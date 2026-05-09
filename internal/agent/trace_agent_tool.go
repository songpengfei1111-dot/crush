package agent

import (
	"context"
	_ "embed"
	"errors"
	"fmt"
	"log/slog"
	"slices"

	"charm.land/fantasy"

	"github.com/charmbracelet/crush/internal/agent/prompt"
	"github.com/charmbracelet/crush/internal/agent/tools"
	"github.com/charmbracelet/crush/internal/config"
)

//go:embed templates/trace_agent.md
var traceAgentDescription []byte

//go:embed templates/trace_agent_prompt.md.tpl
var traceAgentPromptTmpl []byte

const (
	TraceAgentToolName = "trace_agent"
	traceAgentID       = "trace_executor"
)

var traceAgentDefaultTools = []string{tools.TraceQueryToolName}

type TraceAgentParams struct {
	Prompt string `json:"prompt" description:"The trace analysis task for the execution sub-agent, including目标、线索、预期值和验证要求"`
}

type traceAgentValidationResult struct {
	SessionID      string
	AgentMessageID string
}

func validateTraceAgentParams(ctx context.Context, params TraceAgentParams) (traceAgentValidationResult, error) {
	if params.Prompt == "" {
		return traceAgentValidationResult{}, errors.New("prompt is required")
	}

	sessionID := tools.GetSessionFromContext(ctx)
	if sessionID == "" {
		return traceAgentValidationResult{}, errors.New("session id missing from context")
	}

	agentMessageID := tools.GetMessageFromContext(ctx)
	if agentMessageID == "" {
		return traceAgentValidationResult{}, errors.New("agent message id missing from context")
	}

	return traceAgentValidationResult{
		SessionID:      sessionID,
		AgentMessageID: agentMessageID,
	}, nil
}

func (c *coordinator) traceAgentTool(ctx context.Context) (fantasy.AgentTool, error) {
	return fantasy.NewParallelAgentTool(
		TraceAgentToolName,
		tools.FirstLineDescription(traceAgentDescription),
		func(ctx context.Context, params TraceAgentParams, call fantasy.ToolCall) (fantasy.ToolResponse, error) {
			validationResult, err := validateTraceAgentParams(ctx, params)
			if err != nil {
				return fantasy.NewTextErrorResponse(err.Error()), nil
			}

			model, err := c.traceAgentModel(ctx)
			if err != nil {
				return fantasy.ToolResponse{}, err
			}

			providerCfg, ok := c.cfg.Config().Providers.Get(model.ModelCfg.Provider)
			if !ok {
				return fantasy.ToolResponse{}, errModelProviderNotConfigured
			}

			promptTemplate, err := prompt.NewPrompt(
				"trace_agent",
				string(traceAgentPromptTmpl),
				prompt.WithWorkingDir(c.cfg.WorkingDir()),
			)
			if err != nil {
				return fantasy.ToolResponse{}, fmt.Errorf("error creating trace agent prompt: %w", err)
			}

			systemPrompt, err := promptTemplate.Build(ctx, model.Model.Provider(), model.Model.Model(), c.cfg)
			if err != nil {
				return fantasy.ToolResponse{}, fmt.Errorf("error building trace agent prompt: %w", err)
			}

			traceAgentCfg := c.traceAgentConfig()
			traceTools, err := c.buildTools(ctx, traceAgentCfg, true)
			if err != nil {
				return fantasy.ToolResponse{}, err
			}
			if len(traceTools) == 0 {
				return fantasy.NewTextErrorResponse("trace agent has no tools configured"), nil
			}

			traceAgent := NewSessionAgent(SessionAgentOptions{
				LargeModel:           model,
				SmallModel:           model,
				SystemPromptPrefix:   providerCfg.SystemPromptPrefix,
				SystemPrompt:         systemPrompt,
				IsSubAgent:           true,
				DisableAutoSummarize: c.cfg.Config().Options.DisableAutoSummarize,
				IsYolo:               c.permissions.SkipRequests(),
				Sessions:             c.sessions,
				Messages:             c.messages,
				Tools:                traceTools,
				Notify:               c.notify,
			})

			childSessionID := c.sessions.CreateAgentToolSessionID(validationResult.AgentMessageID, call.ID)
			resp, err := c.runSubAgent(ctx, subAgentParams{
				Agent:          traceAgent,
				SessionID:      validationResult.SessionID,
				AgentMessageID: validationResult.AgentMessageID,
				ToolCallID:     call.ID,
				Prompt:         params.Prompt,
				SessionTitle:   "Trace Analysis",
			})
			if err != nil {
				return fantasy.ToolResponse{}, err
			}

			childMessages, listErr := c.messages.List(ctx, childSessionID)
			if listErr != nil {
				slog.Warn("Failed to collect trace sub-agent audit", "session_id", childSessionID, "error", listErr)
				return fantasy.WithResponseMetadata(resp, TraceAgentResponseMetadata{
					ChildSessionID: childSessionID,
				}), nil
			}

			return fantasy.WithResponseMetadata(resp, TraceAgentResponseMetadata{
				ChildSessionID: childSessionID,
				Audit:          buildTraceAudit(childMessages),
			}), nil
		}), nil
}

func (c *coordinator) traceAgentModel(ctx context.Context) (Model, error) {
	large, small, err := c.buildAgentModels(ctx, true)
	if err != nil {
		return Model{}, err
	}

	if opts := c.cfg.Config().Options.TraceAgent; opts != nil && opts.Model == config.SelectedModelTypeSmall {
		return small, nil
	}

	return large, nil
}

func (c *coordinator) traceAgentConfig() config.Agent {
	traceOptions := c.cfg.Config().Options.TraceAgent

	agentCfg := config.Agent{
		ID:           traceAgentID,
		Name:         "Trace Executor",
		Description:  "A sub-agent dedicated to executing large-trace searches and returning concise conclusions.",
		Model:        config.SelectedModelTypeLarge,
		ContextPaths: c.cfg.Config().Options.ContextPaths,
		AllowedTools: slices.Clone(traceAgentDefaultTools),
		AllowedMCP:   map[string][]string{},
	}

	if traceOptions != nil {
		if traceOptions.Model != "" {
			agentCfg.Model = traceOptions.Model
		}
		if len(traceOptions.AllowedTools) > 0 {
			agentCfg.AllowedTools = slices.Clone(traceOptions.AllowedTools)
		}
		if traceOptions.AllowedMCP != nil {
			agentCfg.AllowedMCP = cloneAllowedMCP(traceOptions.AllowedMCP)
		}
	}

	agentCfg.AllowedTools = filterTraceAgentTools(agentCfg.AllowedTools)
	return agentCfg
}

func filterTraceAgentTools(in []string) []string {
	blocked := map[string]struct{}{
		AgentToolName:              {},
		tools.AgenticFetchToolName: {},
		TraceAgentToolName:         {},
	}

	filtered := make([]string, 0, len(in))
	for _, toolName := range in {
		if _, isBlocked := blocked[toolName]; isBlocked {
			continue
		}
		filtered = append(filtered, toolName)
	}
	return filtered
}

func cloneAllowedMCP(in map[string][]string) map[string][]string {
	out := make(map[string][]string, len(in))
	for server, toolNames := range in {
		if toolNames == nil {
			out[server] = nil
			continue
		}
		out[server] = slices.Clone(toolNames)
	}
	return out
}
