package tools

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBuildTraceQueryArgsSearch(t *testing.T) {
	t.Parallel()

	args := buildTraceQueryArgs("/tmp/trace.log", TraceQueryParams{
		Mode:     TraceQueryModeSearch,
		FilePath: "/tmp/trace.log",
		Pattern:  "mov w.*#0xa3",
		Context:  3,
	})

	assert.Equal(t, []string{
		"search",
		"--file", "/tmp/trace.log",
		"--pattern", "mov w.*#0xa3",
		"--regex",
		"--context", "3",
	}, args)
}

func TestBuildTraceQueryArgsSearchWithMaxResults(t *testing.T) {
	t.Parallel()

	args := buildTraceQueryArgs("/tmp/trace.log", TraceQueryParams{
		Mode:       TraceQueryModeSearch,
		FilePath:   "/tmp/trace.log",
		Pattern:    "deadbeef",
		MaxResults: 20,
	})

	assert.Equal(t, []string{
		"search",
		"--file", "/tmp/trace.log",
		"--pattern", "deadbeef",
		"--max-results", "20",
	}, args)
}

func TestBuildTraceQueryArgsLinesDefaultsLineNumbers(t *testing.T) {
	t.Parallel()

	args := buildTraceQueryArgs("/tmp/trace.log", TraceQueryParams{
		Mode:  TraceQueryModeLines,
		Start: 120,
		Count: 10,
	})

	assert.Equal(t, []string{
		"lines",
		"--file", "/tmp/trace.log",
		"--start", "120",
		"--count", "10",
		"--line-numbers",
	}, args)
}

func TestBuildTraceQueryMetadataSearch(t *testing.T) {
	t.Parallel()

	meta := buildTraceQueryMetadata(
		TraceQueryParams{
			Mode:    TraceQueryModeSearch,
			Pattern: "deadbeef",
		},
		"/bin/large-text-viewer",
		"/tmp/trace.log",
		"Found 0 matches",
	)

	assert.Equal(t, TraceQueryModeSearch, meta.Mode)
	assert.Equal(t, 0, meta.MatchCount)
	assert.True(t, meta.LikelyMiss)
	assert.False(t, meta.Truncated)
}

func TestBuildTraceQueryMetadataSearchCountDoesNotImplyTruncated(t *testing.T) {
	t.Parallel()

	meta := buildTraceQueryMetadata(
		TraceQueryParams{
			Mode:    TraceQueryModeSearch,
			Pattern: "mov",
		},
		"/bin/large-text-viewer",
		"/tmp/trace.log",
		"Showed 100 matches",
	)

	assert.Equal(t, 100, meta.MatchCount)
	assert.False(t, meta.Truncated)
	assert.False(t, meta.LikelyMiss)
}

func TestBuildTraceQueryMetadataSearchCustomMaxResultsDoesNotImplyTruncated(t *testing.T) {
	t.Parallel()

	meta := buildTraceQueryMetadata(
		TraceQueryParams{
			Mode:       TraceQueryModeSearch,
			Pattern:    "mov",
			MaxResults: 20,
		},
		"/bin/large-text-viewer",
		"/tmp/trace.log",
		"Showed 20 matches",
	)

	assert.Equal(t, 20, meta.MatchCount)
	assert.False(t, meta.Truncated)
}

func TestValidateTraceQueryParams(t *testing.T) {
	t.Parallel()

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeSearch,
		FilePath: "/tmp/trace.log",
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		End:      5,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		Context:  20,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:       TraceQueryModeSearch,
		FilePath:   "/tmp/trace.log",
		Pattern:    "deadbeef",
		MaxResults: 100,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		End:      111,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		Count:    101,
	}))

	require.Error(t, validateTraceQueryParams(TraceQueryParams{
		Mode:       TraceQueryModeLines,
		FilePath:   "/tmp/trace.log",
		Start:      10,
		Count:      5,
		MaxResults: 10,
	}))

	require.NoError(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		Count:    5,
	}))

	require.NoError(t, validateTraceQueryParams(TraceQueryParams{
		Mode:     TraceQueryModeLines,
		FilePath: "/tmp/trace.log",
		Start:    10,
		End:      110,
	}))

	require.NoError(t, validateTraceQueryParams(TraceQueryParams{
		Mode:       TraceQueryModeSearch,
		FilePath:   "/tmp/trace.log",
		Pattern:    "deadbeef",
		MaxResults: 99,
	}))
}
