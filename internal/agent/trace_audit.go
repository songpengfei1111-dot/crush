package agent

import (
	"encoding/json"
	"strings"

	"github.com/charmbracelet/crush/internal/message"
)

const (
	traceAuditContentLimit  = 2048
	traceAuditMetadataLimit = 4096
)

type TraceAuditEntry struct {
	ToolCallID string `json:"tool_call_id"`
	ToolName   string `json:"tool_name"`
	Input      string `json:"input,omitempty"`
	Result     string `json:"result,omitempty"`
	Metadata   string `json:"metadata,omitempty"`
	IsError    bool   `json:"is_error"`
	LikelyMiss bool   `json:"likely_miss"`
}

type TraceAgentResponseMetadata struct {
	ChildSessionID string            `json:"child_session_id"`
	Audit          []TraceAuditEntry `json:"audit,omitempty"`
}

func buildTraceAudit(msgs []message.Message) []TraceAuditEntry {
	steps := make([]TraceAuditEntry, 0)
	toolIndex := make(map[string]int)

	for _, msg := range msgs {
		switch msg.Role {
		case message.Assistant:
			for _, tc := range msg.ToolCalls() {
				if idx, ok := toolIndex[tc.ID]; ok {
					steps[idx].Input = trimAuditString(tc.Input, traceAuditContentLimit)
					continue
				}
				toolIndex[tc.ID] = len(steps)
				steps = append(steps, TraceAuditEntry{
					ToolCallID: tc.ID,
					ToolName:   tc.Name,
					Input:      trimAuditString(tc.Input, traceAuditContentLimit),
				})
			}
		case message.Tool:
			for _, tr := range msg.ToolResults() {
				idx, ok := toolIndex[tr.ToolCallID]
				if !ok {
					toolIndex[tr.ToolCallID] = len(steps)
					steps = append(steps, TraceAuditEntry{
						ToolCallID: tr.ToolCallID,
						ToolName:   tr.Name,
					})
					idx = len(steps) - 1
				}
				steps[idx].Result = trimAuditString(toolResultSummary(tr), traceAuditContentLimit)
				steps[idx].Metadata = trimAuditString(tr.Metadata, traceAuditMetadataLimit)
				steps[idx].IsError = tr.IsError
				steps[idx].LikelyMiss = traceResultLooksLikeMiss(tr)
			}
		}
	}

	return steps
}

func toolResultSummary(result message.ToolResult) string {
	if result.Content != "" {
		return result.Content
	}
	if result.Data != "" {
		return "[binary tool output omitted]"
	}
	return ""
}

func traceResultLooksLikeMiss(result message.ToolResult) bool {
	if result.IsError {
		return false
	}
	if traceMetadataLooksLikeMiss(result.Metadata) {
		return true
	}
	s := strings.ToLower(result.Content)
	missMarkers := []string{
		"no matches found",
		"not found",
		"0 matches",
		"found 0",
		"no results",
		"no occurrences",
		"empty result",
	}
	for _, marker := range missMarkers {
		if strings.Contains(s, marker) {
			return true
		}
	}
	return false
}

func traceMetadataLooksLikeMiss(metadata string) bool {
	if metadata == "" {
		return false
	}

	var meta struct {
		Mode       string `json:"mode"`
		MatchCount int    `json:"match_count"`
		LikelyMiss bool   `json:"likely_miss"`
	}
	if err := json.Unmarshal([]byte(metadata), &meta); err != nil {
		return false
	}
	if meta.LikelyMiss {
		return true
	}
	return meta.Mode == "search" && meta.MatchCount == 0
}

func trimAuditString(s string, limit int) string {
	if limit <= 0 || len(s) <= limit {
		return s
	}
	const suffix = "\n...(truncated)"
	if limit <= len(suffix) {
		return suffix[:limit]
	}
	return s[:limit-len(suffix)] + suffix
}
