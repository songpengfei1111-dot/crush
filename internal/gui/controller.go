package gui

import (
	"context"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"github.com/charmbracelet/crush/internal/config"
	"github.com/charmbracelet/crush/internal/eventpayload"
	"github.com/charmbracelet/crush/internal/message"
	"github.com/charmbracelet/crush/internal/permission"
	"github.com/charmbracelet/crush/internal/proto"
	"github.com/charmbracelet/crush/internal/pubsub"
	"github.com/charmbracelet/crush/internal/session"
	"github.com/charmbracelet/crush/internal/workspace"
)

const defaultSessionTitle = "Untitled Session"

type Controller struct {
	ws workspace.Workspace
}

type Bootstrap struct {
	Sessions         []proto.Session           `json:"sessions"`
	CurrentSessionID string                    `json:"current_session_id"`
	Messages         []proto.Message           `json:"messages"`
	Agent            proto.AgentInfo           `json:"agent"`
	LSPStates        map[string]any            `json:"lsp_states,omitempty"`
	Permissions      []proto.PermissionRequest `json:"permissions"`
}

type QueueInfo struct {
	Count   int      `json:"count"`
	Prompts []string `json:"prompts"`
}

func NewController(ws workspace.Workspace) *Controller {
	return &Controller{ws: ws}
}

func (c *Controller) EnsureReady(ctx context.Context) error {
	cfg := c.ws.Config()
	if cfg != nil && cfg.IsConfigured() && !c.ws.AgentIsReady() {
		if err := c.ws.InitCoderAgent(ctx); err != nil {
			return fmt.Errorf("initialize agent: %w", err)
		}
	}
	return nil
}

func (c *Controller) Bootstrap(ctx context.Context) (*Bootstrap, error) {
	if err := c.EnsureReady(ctx); err != nil {
		return nil, err
	}

	sessionsList, err := c.ws.ListSessions(ctx)
	if err != nil {
		return nil, err
	}
	if len(sessionsList) == 0 {
		sess, createErr := c.ws.CreateSession(ctx, defaultSessionTitle)
		if createErr != nil {
			return nil, createErr
		}
		sessionsList = []session.Session{sess}
	}

	current := sessionsList[0]
	msgs, err := c.ws.ListMessages(ctx, current.ID)
	if err != nil {
		return nil, err
	}

	return &Bootstrap{
		Sessions:         sessionsToProto(sessionsList),
		CurrentSessionID: current.ID,
		Messages:         messagesToProto(msgs),
		Agent:            c.agentInfo(),
		Permissions:      nil,
	}, nil
}

func (c *Controller) CreateSession(ctx context.Context, title string) (proto.Session, error) {
	if title == "" {
		title = defaultSessionTitle
	}
	sess, err := c.ws.CreateSession(ctx, title)
	if err != nil {
		return proto.Session{}, err
	}
	return eventpayload.SessionFromDomain(sess), nil
}

func (c *Controller) RenameSession(ctx context.Context, sessionID, title string) (proto.Session, error) {
	sess, err := c.ws.GetSession(ctx, sessionID)
	if err != nil {
		return proto.Session{}, err
	}
	if title == "" {
		title = defaultSessionTitle
	}
	sess.Title = title
	saved, err := c.ws.SaveSession(ctx, sess)
	if err != nil {
		return proto.Session{}, err
	}
	return eventpayload.SessionFromDomain(saved), nil
}

func (c *Controller) DeleteSession(ctx context.Context, sessionID string) error {
	return c.ws.DeleteSession(ctx, sessionID)
}

func (c *Controller) ListMessages(ctx context.Context, sessionID string) ([]proto.Message, error) {
	msgs, err := c.ws.ListMessages(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	return messagesToProto(msgs), nil
}

func (c *Controller) SendMessage(ctx context.Context, sessionID, prompt string) error {
	return c.ws.AgentRun(ctx, sessionID, prompt)
}

func (c *Controller) ForkRound(ctx context.Context, sessionID, roundEndMessageID, title string) (proto.Session, error) {
	appWS, err := c.localAppWorkspace()
	if err != nil {
		return proto.Session{}, err
	}
	if c.isSessionBusy(sessionID) {
		return proto.Session{}, fmt.Errorf("cannot fork while the session is busy")
	}

	msgs, err := c.ws.ListMessages(ctx, sessionID)
	if err != nil {
		return proto.Session{}, err
	}

	targetIndex := -1
	for i, msg := range msgs {
		if msg.ID == roundEndMessageID {
			targetIndex = i
			break
		}
	}
	if targetIndex == -1 {
		return proto.Session{}, fmt.Errorf("message not found: %s", roundEndMessageID)
	}

	target := msgs[targetIndex]
	if !isForkRoundEndMessage(target) {
		return proto.Session{}, fmt.Errorf("fork is only available from a completed assistant round")
	}

	sourceSession, err := c.ws.GetSession(ctx, sessionID)
	if err != nil {
		return proto.Session{}, err
	}
	if title == "" {
		title = c.forkSessionTitle(ctx, sourceSession.Title)
	}

	forkedSession, err := c.ws.CreateSession(ctx, title)
	if err != nil {
		return proto.Session{}, err
	}

	for i := 0; i <= targetIndex; i++ {
		params := cloneMessageCreateParams(msgs[i])
		if _, createErr := appWS.App().Messages.Create(ctx, forkedSession.ID, params); createErr != nil {
			_ = c.ws.DeleteSession(ctx, forkedSession.ID)
			return proto.Session{}, createErr
		}
	}

	forkedSession, err = c.ws.GetSession(ctx, forkedSession.ID)
	if err != nil {
		return proto.Session{}, err
	}

	return eventpayload.SessionFromDomain(forkedSession), nil
}

func (c *Controller) RevokeRound(ctx context.Context, sessionID, messageID string) error {
	msgs, err := c.ws.ListMessages(ctx, sessionID)
	if err != nil {
		return err
	}

	targetIndex := -1
	for i, msg := range msgs {
		if msg.ID == messageID {
			targetIndex = i
			break
		}
	}
	if targetIndex == -1 {
		return fmt.Errorf("message not found: %s", messageID)
	}

	target := msgs[targetIndex]
	if target.Role != message.User {
		return fmt.Errorf("only user messages can be revoked")
	}

	lastUserIndex := -1
	for i := len(msgs) - 1; i >= 0; i-- {
		if msgs[i].Role == message.User {
			lastUserIndex = i
			break
		}
	}
	if lastUserIndex == -1 || lastUserIndex != targetIndex {
		return fmt.Errorf("only the latest user message can be revoked")
	}

	appWS, ok := c.ws.(*workspace.AppWorkspace)
	if !ok {
		return fmt.Errorf("round revoke is only available in local GUI mode")
	}
	if appWS.App().AgentCoordinator != nil && appWS.App().AgentCoordinator.IsSessionBusy(sessionID) {
		return fmt.Errorf("cannot revoke while the session is busy")
	}

	for i := len(msgs) - 1; i >= targetIndex; i-- {
		if err := appWS.App().Messages.Delete(ctx, msgs[i].ID); err != nil {
			return err
		}
	}
	return nil
}

func (c *Controller) Cancel(sessionID string) {
	c.ws.AgentCancel(sessionID)
}

func (c *Controller) QueueInfo(sessionID string) QueueInfo {
	prompts := c.ws.AgentQueuedPromptsList(sessionID)
	if prompts == nil {
		prompts = []string{}
	}
	return QueueInfo{
		Count:   c.ws.AgentQueuedPrompts(sessionID),
		Prompts: prompts,
	}
}

func (c *Controller) ClearQueue(sessionID string) {
	c.ws.AgentClearQueue(sessionID)
}

func (c *Controller) SummarizeSession(ctx context.Context, sessionID string) error {
	return c.ws.AgentSummarize(ctx, sessionID)
}

func (c *Controller) GrantPermission(req proto.PermissionRequest, persistent bool) {
	domain := permission.PermissionRequest{
		ID:          req.ID,
		SessionID:   req.SessionID,
		ToolCallID:  req.ToolCallID,
		ToolName:    req.ToolName,
		Description: req.Description,
		Action:      req.Action,
		Params:      req.Params,
		Path:        req.Path,
	}
	if persistent {
		c.ws.PermissionGrantPersistent(domain)
		return
	}
	c.ws.PermissionGrant(domain)
}

func (c *Controller) DenyPermission(req proto.PermissionRequest) {
	c.ws.PermissionDeny(permission.PermissionRequest{
		ID:          req.ID,
		SessionID:   req.SessionID,
		ToolCallID:  req.ToolCallID,
		ToolName:    req.ToolName,
		Description: req.Description,
		Action:      req.Action,
		Params:      req.Params,
		Path:        req.Path,
	})
}

func (c *Controller) SubscribeEvents(ctx context.Context) (<-chan pubsub.Payload, error) {
	return c.ws.SubscribeEvents(ctx)
}

func (c *Controller) agentInfo() proto.AgentInfo {
	model := c.ws.AgentModel()
	return proto.AgentInfo{
		IsBusy:   c.ws.AgentIsBusy(),
		IsReady:  c.ws.AgentIsReady(),
		Model:    model.CatwalkCfg,
		ModelCfg: model.ModelCfg,
	}
}

func (c *Controller) localAppWorkspace() (*workspace.AppWorkspace, error) {
	appWS, ok := c.ws.(*workspace.AppWorkspace)
	if !ok {
		return nil, fmt.Errorf("fork is only available in local GUI mode")
	}
	return appWS, nil
}

func (c *Controller) isSessionBusy(sessionID string) bool {
	return c.ws.AgentIsSessionBusy(sessionID)
}

func isForkRoundEndMessage(msg message.Message) bool {
	if msg.Role != message.Assistant {
		return false
	}
	finish := msg.FinishPart()
	if finish == nil {
		return false
	}
	return finish.Reason != message.FinishReasonToolUse
}

func (c *Controller) forkSessionTitle(ctx context.Context, title string) string {
	parentPath := normalizeSessionTitlePath(title)
	sessionsList, err := c.ws.ListSessions(ctx)
	if err != nil {
		return parentPath + "/fork1"
	}

	maxForkIndex := 0
	parentDepth := titlePathDepth(parentPath)
	for _, sess := range sessionsList {
		childPath := normalizeSessionTitlePath(sess.Title)
		if !strings.HasPrefix(childPath, parentPath+"/") {
			continue
		}
		if titlePathDepth(childPath) != parentDepth+1 {
			continue
		}
		segment := lastTitlePathSegment(childPath)
		if index, ok := parseForkSegment(segment); ok && index > maxForkIndex {
			maxForkIndex = index
		}
	}

	return parentPath + "/fork" + strconv.Itoa(maxForkIndex+1)
}

func normalizeSessionTitlePath(title string) string {
	if title == "" {
		title = defaultSessionTitle
	}
	parts := strings.Split(title, "/")
	normalized := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed == "" {
			continue
		}
		normalized = append(normalized, trimmed)
	}
	if len(normalized) == 0 {
		return defaultSessionTitle
	}
	return strings.Join(normalized, "/")
}

func titlePathDepth(title string) int {
	return len(strings.Split(title, "/"))
}

func lastTitlePathSegment(title string) string {
	parts := strings.Split(title, "/")
	if len(parts) == 0 {
		return ""
	}
	return parts[len(parts)-1]
}

func parseForkSegment(segment string) (int, bool) {
	if !strings.HasPrefix(strings.ToLower(segment), "fork") {
		return 0, false
	}
	suffix := segment[4:]
	if suffix == "" {
		return 1, true
	}
	value, err := strconv.Atoi(suffix)
	if err != nil || value <= 0 {
		return 0, false
	}
	return value, true
}

func cloneMessageCreateParams(msg message.Message) message.CreateMessageParams {
	parts := make([]message.ContentPart, 0, len(msg.Parts))
	for _, part := range msg.Parts {
		if msg.Role != message.Assistant {
			if _, ok := part.(message.Finish); ok {
				continue
			}
		}
		parts = append(parts, part)
	}

	return message.CreateMessageParams{
		Role:             msg.Role,
		Parts:            parts,
		Model:            msg.Model,
		Provider:         msg.Provider,
		IsSummaryMessage: msg.IsSummaryMessage,
	}
}

func sessionsToProto(in []session.Session) []proto.Session {
	out := make([]proto.Session, len(in))
	for i, s := range in {
		out[i] = eventpayload.SessionFromDomain(s)
	}
	slices.SortFunc(out, func(a, b proto.Session) int {
		switch {
		case a.UpdatedAt > b.UpdatedAt:
			return -1
		case a.UpdatedAt < b.UpdatedAt:
			return 1
		default:
			return 0
		}
	})
	return out
}

func messagesToProto(in []message.Message) []proto.Message {
	out := make([]proto.Message, len(in))
	for i, m := range in {
		out[i] = eventpayload.MessageFromDomain(m)
	}
	return out
}

func CanServeGUI(cfg *config.Config) bool {
	return cfg != nil
}
