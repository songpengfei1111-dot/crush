package gui

import (
	"context"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"charm.land/catwalk/pkg/catwalk"
	"github.com/charmbracelet/crush/internal/config"
	"github.com/charmbracelet/crush/internal/eventpayload"
	"github.com/charmbracelet/crush/internal/message"
	"github.com/charmbracelet/crush/internal/permission"
	"github.com/charmbracelet/crush/internal/proto"
	"github.com/charmbracelet/crush/internal/pubsub"
	"github.com/charmbracelet/crush/internal/session"
	"github.com/charmbracelet/crush/internal/skills"
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

type SettingsBootstrap struct {
	ProviderCatalog     []ProviderSummary                          `json:"provider_catalog"`
	ConfiguredProviders []ProviderSummary                          `json:"configured_providers"`
	SelectedModels      map[config.SelectedModelType]SelectedModel `json:"selected_models"`
	CompactMode         bool                                       `json:"compact_mode"`
	MCPServers          []MCPServerSummary                         `json:"mcp_servers"`
	Skills              SkillSettings                              `json:"skills"`
}

type ProviderSummary struct {
	ID         string          `json:"id"`
	Name       string          `json:"name"`
	Type       catwalk.Type    `json:"type,omitempty"`
	BaseURL    string          `json:"base_url,omitempty"`
	APIKey     string          `json:"api_key,omitempty"`
	Models     []catwalk.Model `json:"models,omitempty"`
	Configured bool            `json:"configured"`
	Disabled   bool            `json:"disabled"`
	HasAPIKey  bool            `json:"has_api_key"`
	HasOAuth   bool            `json:"has_oauth"`
}

type SelectedModel struct {
	Model           string  `json:"model"`
	Provider        string  `json:"provider"`
	ReasoningEffort string  `json:"reasoning_effort,omitempty"`
	Think           bool    `json:"think,omitempty"`
	MaxTokens       int64   `json:"max_tokens,omitempty"`
	Temperature     float64 `json:"temperature,omitempty"`
}

type ProviderDraft struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Type         catwalk.Type      `json:"type,omitempty"`
	BaseURL      string            `json:"base_url,omitempty"`
	APIKey       string            `json:"api_key,omitempty"`
	Disabled     bool              `json:"disabled,omitempty"`
	ExtraHeaders map[string]string `json:"extra_headers,omitempty"`
	ExtraBody    map[string]any    `json:"extra_body,omitempty"`
	Models       []catwalk.Model   `json:"models,omitempty"`
}

type ProviderTestResult struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

type MCPServerSummary struct {
	Name          string            `json:"name"`
	Type          config.MCPType    `json:"type"`
	Command       string            `json:"command,omitempty"`
	URL           string            `json:"url,omitempty"`
	Args          []string          `json:"args,omitempty"`
	Env           map[string]string `json:"env,omitempty"`
	Headers       map[string]string `json:"headers,omitempty"`
	Disabled      bool              `json:"disabled"`
	DisabledTools []string          `json:"disabled_tools,omitempty"`
	Timeout       int               `json:"timeout,omitempty"`
	State         string            `json:"state,omitempty"`
	Error         string            `json:"error,omitempty"`
	ToolCount     int               `json:"tool_count,omitempty"`
	PromptCount   int               `json:"prompt_count,omitempty"`
	ResourceCount int               `json:"resource_count,omitempty"`
}

type MCPServerDraft struct {
	Name          string            `json:"name"`
	Type          config.MCPType    `json:"type"`
	Command       string            `json:"command,omitempty"`
	URL           string            `json:"url,omitempty"`
	Args          []string          `json:"args,omitempty"`
	Env           map[string]string `json:"env,omitempty"`
	Headers       map[string]string `json:"headers,omitempty"`
	Disabled      bool              `json:"disabled,omitempty"`
	DisabledTools []string          `json:"disabled_tools,omitempty"`
	Timeout       int               `json:"timeout,omitempty"`
}

type SkillSummary struct {
	Name          string `json:"name"`
	Description   string `json:"description,omitempty"`
	Compatibility string `json:"compatibility,omitempty"`
	Path          string `json:"path,omitempty"`
	SkillFilePath string `json:"skill_file_path,omitempty"`
	Builtin       bool   `json:"builtin"`
	Enabled       bool   `json:"enabled"`
	State         string `json:"state"`
	Error         string `json:"error,omitempty"`
}

type SkillSettings struct {
	UserPaths      []string       `json:"user_paths"`
	DefaultPaths   []string       `json:"default_paths"`
	DisabledSkills []string       `json:"disabled_skills"`
	Skills         []SkillSummary `json:"skills"`
}

type SkillSettingsDraft struct {
	UserPaths      []string `json:"user_paths"`
	DisabledSkills []string `json:"disabled_skills"`
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

func (c *Controller) SettingsBootstrap(_ context.Context) (*SettingsBootstrap, error) {
	cfg := c.ws.Config()
	if cfg == nil {
		return nil, fmt.Errorf("config is unavailable")
	}
	providerCatalog, err := config.Providers(cfg)
	if err != nil {
		return nil, err
	}
	return &SettingsBootstrap{
		ProviderCatalog:     c.providerCatalog(providerCatalog),
		ConfiguredProviders: c.configuredProviders(),
		SelectedModels:      selectedModels(cfg.Models),
		CompactMode:         cfg.Options != nil && cfg.Options.TUI != nil && cfg.Options.TUI.CompactMode,
		MCPServers:          c.mcpServers(),
		Skills:              c.skillSettings(),
	}, nil
}

func (c *Controller) TestProvider(_ context.Context, draft ProviderDraft) ProviderTestResult {
	providerCfg := c.providerConfigFromDraft(draft)
	if err := providerCfg.TestConnection(c.ws.Resolver()); err != nil {
		return ProviderTestResult{OK: false, Error: err.Error()}
	}
	return ProviderTestResult{OK: true}
}

func (c *Controller) SaveProvider(_ context.Context, scope config.Scope, draft ProviderDraft) (ProviderSummary, error) {
	if strings.TrimSpace(draft.ID) == "" {
		return ProviderSummary{}, fmt.Errorf("provider id is required")
	}
	providerID := strings.TrimSpace(draft.ID)
	keyPrefix := fmt.Sprintf("providers.%s", providerID)

	if draft.Name != "" {
		if err := c.ws.SetConfigField(scope, keyPrefix+".name", draft.Name); err != nil {
			return ProviderSummary{}, err
		}
	}
	if draft.BaseURL != "" {
		if err := c.ws.SetConfigField(scope, keyPrefix+".base_url", draft.BaseURL); err != nil {
			return ProviderSummary{}, err
		}
	}
	if draft.Type != "" {
		if err := c.ws.SetConfigField(scope, keyPrefix+".type", draft.Type); err != nil {
			return ProviderSummary{}, err
		}
	}
	if err := c.ws.SetConfigField(scope, keyPrefix+".disable", draft.Disabled); err != nil {
		return ProviderSummary{}, err
	}
	if len(draft.ExtraHeaders) > 0 {
		if err := c.ws.SetConfigField(scope, keyPrefix+".extra_headers", draft.ExtraHeaders); err != nil {
			return ProviderSummary{}, err
		}
	}
	if len(draft.ExtraBody) > 0 {
		if err := c.ws.SetConfigField(scope, keyPrefix+".extra_body", draft.ExtraBody); err != nil {
			return ProviderSummary{}, err
		}
	}
	if len(draft.Models) > 0 {
		if err := c.ws.SetConfigField(scope, keyPrefix+".models", draft.Models); err != nil {
			return ProviderSummary{}, err
		}
	}
	if draft.APIKey != "" {
		if err := c.ws.SetProviderAPIKey(scope, providerID, draft.APIKey); err != nil {
			return ProviderSummary{}, err
		}
	}

	if c.ws.AgentIsReady() {
		if err := c.ws.UpdateAgentModel(context.Background()); err != nil {
			return ProviderSummary{}, err
		}
	}

	providerCfg := c.providerConfigFromDraft(ProviderDraft{ID: providerID})
	return providerSummary(providerCfg, true), nil
}

func (c *Controller) UpdatePreferredModel(ctx context.Context, scope config.Scope, modelType config.SelectedModelType, model config.SelectedModel) error {
	if err := c.ws.UpdatePreferredModel(scope, modelType, model); err != nil {
		return err
	}
	if c.ws.AgentIsReady() {
		return c.ws.UpdateAgentModel(ctx)
	}
	return nil
}

func (c *Controller) SetCompactMode(scope config.Scope, enabled bool) error {
	return c.ws.SetConfigField(scope, "options.tui.compact_mode", enabled)
}

func (c *Controller) RefreshOAuthToken(ctx context.Context, scope config.Scope, providerID string) error {
	if err := c.ws.RefreshOAuthToken(ctx, scope, providerID); err != nil {
		return err
	}
	if c.ws.AgentIsReady() {
		return c.ws.UpdateAgentModel(ctx)
	}
	return nil
}

func (c *Controller) DefaultSmallModel(providerID string) config.SelectedModel {
	return c.ws.GetDefaultSmallModel(providerID)
}

func (c *Controller) SaveMCPServer(ctx context.Context, scope config.Scope, name string, draft MCPServerDraft) (MCPServerSummary, error) {
	if c.ws.AgentIsBusy() {
		return MCPServerSummary{}, fmt.Errorf("cannot update MCP settings while the agent is busy")
	}
	serverName := strings.TrimSpace(firstNonEmpty(name, draft.Name))
	if serverName == "" {
		return MCPServerSummary{}, fmt.Errorf("MCP name is required")
	}
	mcpCfg := config.MCPConfig{
		Command:       strings.TrimSpace(draft.Command),
		Env:           mapsOrNil(draft.Env),
		Args:          slices.Clone(draft.Args),
		Type:          draft.Type,
		URL:           strings.TrimSpace(draft.URL),
		Disabled:      draft.Disabled,
		DisabledTools: compactStrings(draft.DisabledTools),
		Timeout:       draft.Timeout,
		Headers:       mapsOrNil(draft.Headers),
	}
	if mcpCfg.Type == "" {
		mcpCfg.Type = config.MCPStdio
	}
	if err := c.ws.SetConfigField(scope, "mcp."+serverName, mcpCfg); err != nil {
		return MCPServerSummary{}, err
	}
	c.ws.RefreshMCPTools(ctx, serverName)
	c.ws.MCPRefreshPrompts(ctx, serverName)
	c.ws.MCPRefreshResources(ctx, serverName)
	if c.ws.AgentIsReady() {
		if err := c.ws.UpdateAgentModel(ctx); err != nil {
			return MCPServerSummary{}, err
		}
	}
	return c.mcpServerSummary(serverName, mcpCfg), nil
}

func (c *Controller) DeleteMCPServer(ctx context.Context, scope config.Scope, name string) error {
	if c.ws.AgentIsBusy() {
		return fmt.Errorf("cannot delete MCP settings while the agent is busy")
	}
	serverName := strings.TrimSpace(name)
	if serverName == "" {
		return fmt.Errorf("MCP name is required")
	}
	if err := c.ws.RemoveConfigField(scope, "mcp."+serverName); err != nil {
		return err
	}
	c.ws.RefreshMCPTools(ctx, serverName)
	c.ws.MCPRefreshPrompts(ctx, serverName)
	c.ws.MCPRefreshResources(ctx, serverName)
	if c.ws.AgentIsReady() {
		return c.ws.UpdateAgentModel(ctx)
	}
	return nil
}

func (c *Controller) SaveSkillSettings(ctx context.Context, scope config.Scope, draft SkillSettingsDraft) error {
	if c.ws.AgentIsBusy() {
		return fmt.Errorf("cannot update skill settings while the agent is busy")
	}
	opts := c.ws.Config().Options
	userPaths := compactStrings(draft.UserPaths)
	disabledSkills := compactStrings(draft.DisabledSkills)

	if len(userPaths) == 0 {
		if opts != nil && len(opts.SkillsPaths) > 0 {
			if err := c.ws.RemoveConfigField(scope, "options.skills_paths"); err != nil {
				return err
			}
		}
	} else if err := c.ws.SetConfigField(scope, "options.skills_paths", userPaths); err != nil {
		return err
	}

	if len(disabledSkills) == 0 {
		if opts != nil && len(opts.DisabledSkills) > 0 {
			if err := c.ws.RemoveConfigField(scope, "options.disabled_skills"); err != nil {
				return err
			}
		}
	} else if err := c.ws.SetConfigField(scope, "options.disabled_skills", disabledSkills); err != nil {
		return err
	}

	if c.ws.Config() != nil && c.ws.Config().IsConfigured() {
		return c.ws.InitCoderAgent(ctx)
	}
	return nil
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

func (c *Controller) providerCatalog(providers []catwalk.Provider) []ProviderSummary {
	out := make([]ProviderSummary, 0, len(providers))
	for _, provider := range providers {
		cfg := config.ProviderConfig{
			ID:      string(provider.ID),
			Name:    provider.Name,
			Type:    provider.Type,
			BaseURL: provider.APIEndpoint,
			Models:  provider.Models,
		}
		if configured, ok := c.ws.Config().Providers.Get(cfg.ID); ok {
			cfg.Name = firstNonEmpty(configured.Name, cfg.Name)
			cfg.BaseURL = firstNonEmpty(configured.BaseURL, cfg.BaseURL)
			if configured.Type != "" {
				cfg.Type = configured.Type
			}
			cfg.Models = firstModels(configured.Models, cfg.Models)
			cfg.APIKey = configured.APIKey
			cfg.OAuthToken = configured.OAuthToken
			cfg.Disable = configured.Disable
		}
		out = append(out, providerSummary(cfg, c.providerConfigured(cfg.ID)))
	}
	slices.SortFunc(out, func(a, b ProviderSummary) int {
		return strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
	})
	return out
}

func (c *Controller) configuredProviders() []ProviderSummary {
	var out []ProviderSummary
	for providerCfg := range c.ws.Config().Providers.Seq() {
		out = append(out, providerSummary(providerCfg, true))
	}
	slices.SortFunc(out, func(a, b ProviderSummary) int {
		return strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
	})
	return out
}

func (c *Controller) mcpServers() []MCPServerSummary {
	out := make([]MCPServerSummary, 0, len(c.ws.Config().MCP))
	for _, item := range c.ws.Config().MCP.Sorted() {
		out = append(out, c.mcpServerSummary(item.Name, item.MCP))
	}
	return out
}

func (c *Controller) mcpServerSummary(name string, mcpCfg config.MCPConfig) MCPServerSummary {
	summary := MCPServerSummary{
		Name:          name,
		Type:          mcpCfg.Type,
		Command:       mcpCfg.Command,
		URL:           mcpCfg.URL,
		Args:          slices.Clone(mcpCfg.Args),
		Env:           mapsOrNil(mcpCfg.Env),
		Headers:       mapsOrNil(mcpCfg.Headers),
		Disabled:      mcpCfg.Disabled,
		DisabledTools: slices.Clone(mcpCfg.DisabledTools),
		Timeout:       mcpCfg.Timeout,
	}
	if state, ok := c.ws.MCPGetStates()[name]; ok {
		summary.State = string(state.State)
		summary.ToolCount = state.Counts.Tools
		summary.PromptCount = state.Counts.Prompts
		summary.ResourceCount = state.Counts.Resources
		if state.Error != nil {
			summary.Error = state.Error.Error()
		}
	}
	return summary
}

func (c *Controller) skillSettings() SkillSettings {
	cfg := c.ws.Config()
	opts := cfg.Options
	var (
		userPaths    []string
		defaultPaths []string
	)
	if opts != nil {
		userPaths, defaultPaths = splitSkillPaths(opts.SkillsPaths, c.ws.WorkingDir())
	} else {
		_, defaultPaths = splitSkillPaths(nil, c.ws.WorkingDir())
	}
	builtinSkills, builtinStates := skills.DiscoverBuiltinWithStates()
	discoveredSkills, discoveredStates := skills.DiscoverWithStates(userPathsAndDefaults(userPaths, defaultPaths))
	allSkills := skills.Deduplicate(append(append([]*skills.Skill(nil), builtinSkills...), discoveredSkills...))

	var disabledList []string
	if opts != nil {
		disabledList = opts.DisabledSkills
	}
	disabledSet := make(map[string]bool, len(disabledList))
	for _, name := range disabledList {
		disabledSet[name] = true
	}

	result := make([]SkillSummary, 0, len(allSkills)+len(builtinStates)+len(discoveredStates))
	seen := make(map[string]bool)
	for _, skill := range allSkills {
		id := skill.SkillFilePath
		if id == "" {
			id = skill.Name
		}
		seen[id] = true
		result = append(result, SkillSummary{
			Name:          skill.Name,
			Description:   skill.Description,
			Compatibility: skill.Compatibility,
			Path:          skill.Path,
			SkillFilePath: skill.SkillFilePath,
			Builtin:       skill.Builtin,
			Enabled:       !disabledSet[skill.Name],
			State:         "normal",
		})
	}
	appendStateErrors := func(states []*skills.SkillState, builtin bool) {
		for _, state := range states {
			if state == nil || state.State != skills.StateError {
				continue
			}
			key := state.Path
			if key == "" {
				key = state.Name
			}
			if seen[key] {
				continue
			}
			seen[key] = true
			errText := ""
			if state.Err != nil {
				errText = state.Err.Error()
			}
			result = append(result, SkillSummary{
				Name:          firstNonEmpty(state.Name, state.Path),
				SkillFilePath: state.Path,
				Builtin:       builtin,
				Enabled:       false,
				State:         "error",
				Error:         errText,
			})
		}
	}
	appendStateErrors(builtinStates, true)
	appendStateErrors(discoveredStates, false)

	slices.SortFunc(result, func(a, b SkillSummary) int {
		left := strings.ToLower(firstNonEmpty(a.Name, a.SkillFilePath))
		right := strings.ToLower(firstNonEmpty(b.Name, b.SkillFilePath))
		if left == right {
			return strings.Compare(a.SkillFilePath, b.SkillFilePath)
		}
		return strings.Compare(left, right)
	})

	return SkillSettings{
		UserPaths:      stringsOrEmpty(userPaths),
		DefaultPaths:   stringsOrEmpty(defaultPaths),
		DisabledSkills: stringsOrEmpty(disabledList),
		Skills:         result,
	}
}

func (c *Controller) providerConfigured(providerID string) bool {
	_, ok := c.ws.Config().Providers.Get(providerID)
	return ok
}

func (c *Controller) providerConfigFromDraft(draft ProviderDraft) config.ProviderConfig {
	providerID := strings.TrimSpace(draft.ID)
	if existing, ok := c.ws.Config().Providers.Get(providerID); ok {
		return mergeProviderDraft(existing, draft)
	}
	providers, _ := config.Providers(c.ws.Config())
	for _, provider := range providers {
		if string(provider.ID) == providerID {
			return mergeProviderDraft(config.ProviderConfig{
				ID:      providerID,
				Name:    provider.Name,
				Type:    provider.Type,
				BaseURL: provider.APIEndpoint,
				Models:  provider.Models,
			}, draft)
		}
	}
	return mergeProviderDraft(config.ProviderConfig{ID: providerID}, draft)
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

func selectedModels(models map[config.SelectedModelType]config.SelectedModel) map[config.SelectedModelType]SelectedModel {
	out := make(map[config.SelectedModelType]SelectedModel, len(models))
	for modelType, model := range models {
		out[modelType] = SelectedModel{
			Model:           model.Model,
			Provider:        model.Provider,
			ReasoningEffort: model.ReasoningEffort,
			Think:           model.Think,
			MaxTokens:       model.MaxTokens,
			Temperature:     pointerFloat(model.Temperature),
		}
	}
	return out
}

func providerSummary(provider config.ProviderConfig, configured bool) ProviderSummary {
	return ProviderSummary{
		ID:         provider.ID,
		Name:       firstNonEmpty(provider.Name, provider.ID),
		Type:       provider.Type,
		BaseURL:    provider.BaseURL,
		APIKey:     provider.APIKey,
		Models:     provider.Models,
		Configured: configured,
		Disabled:   provider.Disable,
		HasAPIKey:  provider.APIKey != "",
		HasOAuth:   provider.OAuthToken != nil,
	}
}

func mergeProviderDraft(provider config.ProviderConfig, draft ProviderDraft) config.ProviderConfig {
	if draft.ID != "" {
		provider.ID = strings.TrimSpace(draft.ID)
	}
	if draft.Name != "" {
		provider.Name = draft.Name
	}
	if draft.Type != "" {
		provider.Type = draft.Type
	}
	if draft.BaseURL != "" {
		provider.BaseURL = draft.BaseURL
	}
	if draft.APIKey != "" {
		provider.APIKey = draft.APIKey
	}
	provider.Disable = draft.Disabled
	if len(draft.ExtraHeaders) > 0 {
		provider.ExtraHeaders = draft.ExtraHeaders
	}
	if len(draft.ExtraBody) > 0 {
		provider.ExtraBody = draft.ExtraBody
	}
	if len(draft.Models) > 0 {
		provider.Models = draft.Models
	}
	return provider
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func firstModels(values ...[]catwalk.Model) []catwalk.Model {
	for _, value := range values {
		if len(value) > 0 {
			return value
		}
	}
	return nil
}

func pointerFloat(value *float64) float64 {
	if value == nil {
		return 0
	}
	return *value
}

func splitSkillPaths(paths []string, workingDir string) (userPaths []string, defaultPaths []string) {
	defaultSet := make(map[string]bool)
	defaultPaths = append(defaultPaths, config.GlobalSkillsDirs()...)
	defaultPaths = append(defaultPaths, config.ProjectSkillsDir(workingDir)...)
	for _, path := range defaultPaths {
		defaultSet[path] = true
	}
	for _, path := range compactStrings(paths) {
		if defaultSet[path] {
			continue
		}
		userPaths = append(userPaths, path)
	}
	return userPaths, compactStrings(defaultPaths)
}

func userPathsAndDefaults(userPaths []string, defaultPaths []string) []string {
	combined := append([]string(nil), defaultPaths...)
	combined = append(combined, userPaths...)
	return compactStrings(combined)
}

func compactStrings(values []string) []string {
	if len(values) == 0 {
		return nil
	}
	out := make([]string, 0, len(values))
	seen := make(map[string]bool, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" || seen[trimmed] {
			continue
		}
		seen[trimmed] = true
		out = append(out, trimmed)
	}
	return out
}

func stringsOrEmpty(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	return slices.Clone(values)
}

func mapsOrNil[K comparable, V any](value map[K]V) map[K]V {
	if len(value) == 0 {
		return nil
	}
	cloned := make(map[K]V, len(value))
	for k, v := range value {
		cloned[k] = v
	}
	return cloned
}

func CanServeGUI(cfg *config.Config) bool {
	return cfg != nil
}
