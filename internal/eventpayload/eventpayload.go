package eventpayload

import (
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/charmbracelet/crush/internal/agent/notify"
	"github.com/charmbracelet/crush/internal/agent/tools/mcp"
	"github.com/charmbracelet/crush/internal/app"
	"github.com/charmbracelet/crush/internal/history"
	"github.com/charmbracelet/crush/internal/message"
	"github.com/charmbracelet/crush/internal/permission"
	"github.com/charmbracelet/crush/internal/proto"
	"github.com/charmbracelet/crush/internal/pubsub"
	"github.com/charmbracelet/crush/internal/session"
)

// WrapDomainEvent converts an in-process event to a JSON-friendly payload
// envelope suitable for GUI consumers and SSE transport.
func WrapDomainEvent(ev any) *pubsub.Payload {
	switch e := ev.(type) {
	case pubsub.Event[app.LSPEvent]:
		return envelope(pubsub.PayloadTypeLSPEvent, pubsub.Event[proto.LSPEvent]{
			Type:    e.Type,
			Payload: LSPEventFromDomain(e.Payload),
		})
	case pubsub.Event[mcp.Event]:
		return envelope(pubsub.PayloadTypeMCPEvent, pubsub.Event[proto.MCPEvent]{
			Type:    e.Type,
			Payload: MCPEventFromDomain(e.Payload),
		})
	case pubsub.Event[permission.PermissionRequest]:
		return envelope(pubsub.PayloadTypePermissionRequest, pubsub.Event[proto.PermissionRequest]{
			Type:    e.Type,
			Payload: PermissionRequestFromDomain(e.Payload),
		})
	case pubsub.Event[permission.PermissionNotification]:
		return envelope(pubsub.PayloadTypePermissionNotification, pubsub.Event[proto.PermissionNotification]{
			Type:    e.Type,
			Payload: PermissionNotificationFromDomain(e.Payload),
		})
	case pubsub.Event[message.Message]:
		return envelope(pubsub.PayloadTypeMessage, pubsub.Event[proto.Message]{
			Type:    e.Type,
			Payload: MessageFromDomain(e.Payload),
		})
	case pubsub.Event[session.Session]:
		return envelope(pubsub.PayloadTypeSession, pubsub.Event[proto.Session]{
			Type:    e.Type,
			Payload: SessionFromDomain(e.Payload),
		})
	case pubsub.Event[history.File]:
		return envelope(pubsub.PayloadTypeFile, pubsub.Event[proto.File]{
			Type:    e.Type,
			Payload: FileFromDomain(e.Payload),
		})
	case pubsub.Event[notify.Notification]:
		return envelope(pubsub.PayloadTypeAgentEvent, pubsub.Event[proto.AgentEvent]{
			Type:    e.Type,
			Payload: AgentEventFromDomain(e.Payload),
		})
	default:
		slog.Warn("Unrecognized domain event type", "type", fmt.Sprintf("%T", ev))
		return nil
	}
}

// WrapProtoEvent converts a proto-typed event back into the same payload
// envelope shape produced by WrapDomainEvent.
func WrapProtoEvent(ev any) *pubsub.Payload {
	switch e := ev.(type) {
	case pubsub.Event[proto.LSPEvent]:
		return envelope(pubsub.PayloadTypeLSPEvent, e)
	case pubsub.Event[proto.MCPEvent]:
		return envelope(pubsub.PayloadTypeMCPEvent, e)
	case pubsub.Event[proto.PermissionRequest]:
		return envelope(pubsub.PayloadTypePermissionRequest, e)
	case pubsub.Event[proto.PermissionNotification]:
		return envelope(pubsub.PayloadTypePermissionNotification, e)
	case pubsub.Event[proto.Message]:
		return envelope(pubsub.PayloadTypeMessage, e)
	case pubsub.Event[proto.Session]:
		return envelope(pubsub.PayloadTypeSession, e)
	case pubsub.Event[proto.File]:
		return envelope(pubsub.PayloadTypeFile, e)
	case pubsub.Event[proto.AgentEvent]:
		return envelope(pubsub.PayloadTypeAgentEvent, e)
	default:
		slog.Warn("Unrecognized proto event type", "type", fmt.Sprintf("%T", ev))
		return nil
	}
}

func MessageFromDomain(m message.Message) proto.Message {
	msg := proto.Message{
		ID:        m.ID,
		SessionID: m.SessionID,
		Role:      proto.MessageRole(m.Role),
		Model:     m.Model,
		Provider:  m.Provider,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}

	for _, p := range m.Parts {
		switch v := p.(type) {
		case message.TextContent:
			msg.Parts = append(msg.Parts, proto.TextContent{Text: v.Text})
		case message.ReasoningContent:
			msg.Parts = append(msg.Parts, proto.ReasoningContent{
				Thinking:   v.Thinking,
				Signature:  v.Signature,
				StartedAt:  v.StartedAt,
				FinishedAt: v.FinishedAt,
			})
		case message.ToolCall:
			msg.Parts = append(msg.Parts, proto.ToolCall{
				ID:       v.ID,
				Name:     v.Name,
				Input:    v.Input,
				Finished: v.Finished,
			})
		case message.ToolResult:
			msg.Parts = append(msg.Parts, proto.ToolResult{
				ToolCallID: v.ToolCallID,
				Name:       v.Name,
				Content:    v.Content,
				Metadata:   v.Metadata,
				IsError:    v.IsError,
			})
		case message.ImageURLContent:
			msg.Parts = append(msg.Parts, proto.ImageURLContent{
				URL:    v.URL,
				Detail: v.Detail,
			})
		case message.BinaryContent:
			msg.Parts = append(msg.Parts, proto.BinaryContent{
				Path:     v.Path,
				MIMEType: v.MIMEType,
				Data:     v.Data,
			})
		case message.Finish:
			msg.Parts = append(msg.Parts, proto.Finish{
				Reason:  proto.FinishReason(v.Reason),
				Time:    v.Time,
				Message: v.Message,
				Details: v.Details,
			})
		}
	}

	return msg
}

func SessionFromDomain(s session.Session) proto.Session {
	return proto.Session{
		ID:               s.ID,
		ParentSessionID:  s.ParentSessionID,
		Title:            s.Title,
		SummaryMessageID: s.SummaryMessageID,
		MessageCount:     s.MessageCount,
		PromptTokens:     s.PromptTokens,
		CompletionTokens: s.CompletionTokens,
		Cost:             s.Cost,
		CreatedAt:        s.CreatedAt,
		UpdatedAt:        s.UpdatedAt,
	}
}

func FileFromDomain(f history.File) proto.File {
	return proto.File{
		ID:        f.ID,
		SessionID: f.SessionID,
		Path:      f.Path,
		Content:   f.Content,
		Version:   f.Version,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}
}

func PermissionRequestFromDomain(p permission.PermissionRequest) proto.PermissionRequest {
	return proto.PermissionRequest{
		ID:          p.ID,
		SessionID:   p.SessionID,
		ToolCallID:  p.ToolCallID,
		ToolName:    p.ToolName,
		Description: p.Description,
		Action:      p.Action,
		Path:        p.Path,
		Params:      p.Params,
	}
}

func PermissionNotificationFromDomain(p permission.PermissionNotification) proto.PermissionNotification {
	return proto.PermissionNotification{
		ToolCallID: p.ToolCallID,
		Granted:    p.Granted,
		Denied:     p.Denied,
	}
}

func AgentEventFromDomain(n notify.Notification) proto.AgentEvent {
	return proto.AgentEvent{
		SessionID:    n.SessionID,
		SessionTitle: n.SessionTitle,
		Type:         proto.AgentEventType(n.Type),
	}
}

func LSPEventFromDomain(e app.LSPEvent) proto.LSPEvent {
	return proto.LSPEvent{
		Type:            proto.LSPEventType(e.Type),
		Name:            e.Name,
		State:           e.State,
		Error:           e.Error,
		DiagnosticCount: e.DiagnosticCount,
	}
}

func MCPEventFromDomain(e mcp.Event) proto.MCPEvent {
	return proto.MCPEvent{
		Type:          mcpEventTypeToProto(e.Type),
		Name:          e.Name,
		State:         proto.MCPState(e.State),
		Error:         e.Error,
		ToolCount:     e.Counts.Tools,
		PromptCount:   e.Counts.Prompts,
		ResourceCount: e.Counts.Resources,
	}
}

func mcpEventTypeToProto(t mcp.EventType) proto.MCPEventType {
	switch t {
	case mcp.EventStateChanged:
		return proto.MCPEventStateChanged
	case mcp.EventToolsListChanged:
		return proto.MCPEventToolsListChanged
	case mcp.EventPromptsListChanged:
		return proto.MCPEventPromptsListChanged
	case mcp.EventResourcesListChanged:
		return proto.MCPEventResourcesListChanged
	default:
		return proto.MCPEventStateChanged
	}
}

func envelope(payloadType pubsub.PayloadType, inner any) *pubsub.Payload {
	raw, err := json.Marshal(inner)
	if err != nil {
		slog.Error("Failed to marshal event payload", "error", err)
		return nil
	}
	return &pubsub.Payload{
		Type:    payloadType,
		Payload: raw,
	}
}
