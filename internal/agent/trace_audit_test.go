package agent

import (
	"testing"

	"github.com/charmbracelet/crush/internal/agent/tools"
	"github.com/charmbracelet/crush/internal/message"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildTraceAudit(t *testing.T) {
	msgs := []message.Message{
		{
			Role: message.Assistant,
			Parts: []message.ContentPart{
				message.ToolCall{
					ID:       "call-1",
					Name:     "trace_search",
					Input:    `{"query":"deadbeef"}`,
					Finished: true,
				},
				message.ToolCall{
					ID:       "call-2",
					Name:     "view",
					Input:    `{"file_path":"/tmp/trace.log","offset":120}`,
					Finished: true,
				},
			},
		},
		{
			Role: message.Tool,
			Parts: []message.ContentPart{
				message.ToolResult{
					ToolCallID: "call-1",
					Name:       "trace_search",
					Content:    "No matches found for deadbeef",
					Metadata:   `{"query":"deadbeef","matches":0}`,
				},
			},
		},
		{
			Role: message.Tool,
			Parts: []message.ContentPart{
				message.ToolResult{
					ToolCallID: "call-2",
					Name:       "view",
					Content:    "Loaded 200 lines of trace context",
				},
			},
		},
	}

	audit := buildTraceAudit(msgs)
	require.Len(t, audit, 2)

	assert.Equal(t, "trace_search", audit[0].ToolName)
	assert.Equal(t, `{"query":"deadbeef"}`, audit[0].Input)
	assert.Equal(t, "No matches found for deadbeef", audit[0].Result)
	assert.True(t, audit[0].LikelyMiss)
	assert.False(t, audit[0].IsError)

	assert.Equal(t, "view", audit[1].ToolName)
	assert.Equal(t, "Loaded 200 lines of trace context", audit[1].Result)
	assert.False(t, audit[1].LikelyMiss)
}

func TestBuildTraceAuditUsesStructuredMissMetadata(t *testing.T) {
	msgs := []message.Message{
		{
			Role: message.Assistant,
			Parts: []message.ContentPart{
				message.ToolCall{
					ID:       "call-1",
					Name:     "trace_query",
					Input:    `{"mode":"search","file_path":"/tmp/trace.log","pattern":"deadbeef"}`,
					Finished: true,
				},
			},
		},
		{
			Role: message.Tool,
			Parts: []message.ContentPart{
				message.ToolResult{
					ToolCallID: "call-1",
					Name:       "trace_query",
					Content:    "Search completed",
					Metadata:   `{"mode":"search","match_count":0,"likely_miss":true}`,
				},
			},
		},
	}

	audit := buildTraceAudit(msgs)
	require.Len(t, audit, 1)
	assert.True(t, audit[0].LikelyMiss)
}

func TestFilterTraceAgentTools(t *testing.T) {
	filtered := filterTraceAgentTools([]string{
		"view",
		AgentToolName,
		tools.AgenticFetchToolName,
		TraceAgentToolName,
		"grep",
	})

	assert.Equal(t, []string{"view", "grep"}, filtered)
}
