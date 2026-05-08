package gui

import (
	"context"
	"fmt"
	"slices"

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

func (c *Controller) Cancel(sessionID string) {
	c.ws.AgentCancel(sessionID)
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
