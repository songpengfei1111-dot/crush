package tools

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"

	"charm.land/fantasy"
	"github.com/charmbracelet/crush/internal/filepathext"
	"github.com/charmbracelet/crush/internal/fsext"
	"github.com/charmbracelet/crush/internal/permission"
)

//go:embed trace_query.md
var traceQueryDescription []byte

const (
	TraceQueryToolName           = "trace_query"
	traceQueryDefaultMaxResults  = 100
	traceQueryMaxLinesWindow     = 100
	traceQueryDefaultFallbackBin = "/Users/bytedance/PycharmProjects/traceSearch_MCP/target/release/large-text-viewer"
)

type TraceQueryMode string

const (
	TraceQueryModeSearch TraceQueryMode = "search"
	TraceQueryModeLines  TraceQueryMode = "lines"
)

type TraceQueryParams struct {
	Mode        TraceQueryMode `json:"mode" description:"Trace query mode. Use 'search' to search large trace files and 'lines' to extract specific line ranges"`
	FilePath    string         `json:"file_path" description:"Path to the trace file"`
	Pattern     string         `json:"pattern,omitempty" description:"Search pattern used when mode is 'search'"`
	Regex       bool           `json:"regex,omitempty" description:"Treat pattern as a regular expression when mode is 'search'"`
	Context     int            `json:"context,omitempty" description:"Optional context lines around search matches when mode is 'search'. Leave unset by default and only provide it when nearby lines are required"`
	MaxResults  int            `json:"max_results,omitempty" description:"Optional maximum number of search results when mode is 'search'. Must be less than 100"`
	Start       int            `json:"start,omitempty" description:"Start line number (1-based) when mode is 'lines'"`
	End         int            `json:"end,omitempty" description:"End line number (1-based) when mode is 'lines'"`
	Count       int            `json:"count,omitempty" description:"Number of lines to return when mode is 'lines'"`
	LineNumbers *bool          `json:"line_numbers,omitempty" description:"Show line numbers when mode is 'lines'. Defaults to true"`
}

type TraceQueryPermissionsParams struct {
	Mode        TraceQueryMode `json:"mode"`
	FilePath    string         `json:"file_path"`
	Pattern     string         `json:"pattern,omitempty"`
	Regex       bool           `json:"regex,omitempty"`
	Context     int            `json:"context,omitempty"`
	MaxResults  int            `json:"max_results,omitempty"`
	Start       int            `json:"start,omitempty"`
	End         int            `json:"end,omitempty"`
	Count       int            `json:"count,omitempty"`
	LineNumbers bool           `json:"line_numbers,omitempty"`
}

type TraceQueryResponseMetadata struct {
	Mode        TraceQueryMode `json:"mode"`
	BinaryPath  string         `json:"binary_path,omitempty"`
	FilePath    string         `json:"file_path"`
	Pattern     string         `json:"pattern,omitempty"`
	Regex       bool           `json:"regex,omitempty"`
	Context     int            `json:"context,omitempty"`
	MaxResults  int            `json:"max_results,omitempty"`
	Start       int            `json:"start,omitempty"`
	End         int            `json:"end,omitempty"`
	Count       int            `json:"count,omitempty"`
	LineNumbers bool           `json:"line_numbers,omitempty"`
	MatchCount  int            `json:"match_count,omitempty"`
	Truncated   bool           `json:"truncated,omitempty"`
	LikelyMiss  bool           `json:"likely_miss,omitempty"`
}

type TraceQueryToolOptions struct {
	BinaryPath string
}

func NewTraceQueryTool(
	permissions permission.Service,
	workingDir string,
	options TraceQueryToolOptions,
) fantasy.AgentTool {
	return fantasy.NewAgentTool(
		TraceQueryToolName,
		FirstLineDescription(traceQueryDescription),
		func(ctx context.Context, params TraceQueryParams, call fantasy.ToolCall) (fantasy.ToolResponse, error) {
			params = normalizeTraceQueryParams(params)
			if err := validateTraceQueryParams(params); err != nil {
				return fantasy.NewTextErrorResponse(err.Error()), nil
			}

			filePath := filepathext.SmartJoin(workingDir, params.FilePath)
			absFilePath, err := filepath.Abs(filePath)
			if err != nil {
				return fantasy.ToolResponse{}, fmt.Errorf("error resolving trace file path: %w", err)
			}

			if err := requestTraceQueryPermission(ctx, permissions, workingDir, absFilePath, params, call.ID); err != nil {
				if err == permissionDeniedSentinel {
					return NewPermissionDeniedResponse(), nil
				}
				return fantasy.ToolResponse{}, err
			}

			binaryPath, err := resolveTraceBinaryPath(options.BinaryPath)
			if err != nil {
				return fantasy.NewTextErrorResponse(err.Error()), nil
			}

			args := buildTraceQueryArgs(absFilePath, params)
			cmd := exec.CommandContext(ctx, binaryPath, args...)
			output, cmdErr := cmd.CombinedOutput()
			stdout := strings.TrimSpace(string(output))
			meta := buildTraceQueryMetadata(params, binaryPath, absFilePath, stdout)

			if cmdErr != nil {
				errText := stdout
				if errText == "" {
					errText = cmdErr.Error()
				}
				return fantasy.WithResponseMetadata(fantasy.NewTextErrorResponse(errText), meta), nil
			}

			return fantasy.WithResponseMetadata(fantasy.NewTextResponse(stdout), meta), nil
		},
	)
}

var permissionDeniedSentinel = fmt.Errorf("trace query permission denied")

func normalizeTraceQueryParams(params TraceQueryParams) TraceQueryParams {
	if params.Mode == TraceQueryModeLines && params.Start <= 0 {
		params.Start = 1
	}
	return params
}

func validateTraceQueryParams(params TraceQueryParams) error {
	if params.FilePath == "" {
		return fmt.Errorf("file_path is required")
	}

	switch params.Mode {
	case TraceQueryModeSearch:
		if params.Pattern == "" {
			return fmt.Errorf("pattern is required when mode is search")
		}
		if params.Context < 0 {
			return fmt.Errorf("context cannot be negative")
		}
		if params.MaxResults < 0 {
			return fmt.Errorf("max_results cannot be negative")
		}
		if params.MaxResults > 0 && params.MaxResults >= traceQueryDefaultMaxResults {
			return fmt.Errorf("max_results must be less than %d", traceQueryDefaultMaxResults)
		}
	case TraceQueryModeLines:
		if params.Start <= 0 {
			return fmt.Errorf("start must be greater than 0 when mode is lines")
		}
		if params.Pattern != "" {
			return fmt.Errorf("pattern is not supported when mode is lines")
		}
		if params.Regex {
			return fmt.Errorf("regex is not supported when mode is lines")
		}
		if params.Context != 0 {
			return fmt.Errorf("context is not supported when mode is lines")
		}
		if params.MaxResults != 0 {
			return fmt.Errorf("max_results is not supported when mode is lines")
		}
		if params.End > 0 && params.End < params.Start {
			return fmt.Errorf("end must be greater than or equal to start")
		}
		if params.End > 0 && params.Count > 0 {
			return fmt.Errorf("end and count cannot both be set in lines mode")
		}
		if params.End == 0 && params.Count == 0 {
			return fmt.Errorf("either end or count must be set when mode is lines")
		}
		if params.Count < 0 {
			return fmt.Errorf("count cannot be negative")
		}
		if params.End > 0 && params.End-params.Start > traceQueryMaxLinesWindow {
			return fmt.Errorf("line range cannot exceed %d lines", traceQueryMaxLinesWindow)
		}
		if params.Count > traceQueryMaxLinesWindow {
			return fmt.Errorf("count cannot exceed %d lines", traceQueryMaxLinesWindow)
		}
	default:
		return fmt.Errorf("mode must be either search or lines")
	}

	return nil
}

func requestTraceQueryPermission(
	ctx context.Context,
	permissions permission.Service,
	workingDir string,
	filePath string,
	params TraceQueryParams,
	toolCallID string,
) error {
	absWorkingDir, err := filepath.Abs(workingDir)
	if err != nil {
		return fmt.Errorf("error resolving working directory: %w", err)
	}

	relPath, err := filepath.Rel(absWorkingDir, filePath)
	if err == nil && !strings.HasPrefix(relPath, "..") {
		return nil
	}

	sessionID := GetSessionFromContext(ctx)
	if sessionID == "" {
		return fmt.Errorf("session ID is required for accessing trace files outside working directory")
	}

	lineNumbers := true
	if params.LineNumbers != nil {
		lineNumbers = *params.LineNumbers
	}

	granted, reqErr := permissions.Request(ctx, permission.CreatePermissionRequest{
		SessionID:   sessionID,
		Path:        filePath,
		ToolCallID:  toolCallID,
		ToolName:    TraceQueryToolName,
		Action:      "read",
		Description: fmt.Sprintf("Read trace file outside working directory: %s", filePath),
		Params: TraceQueryPermissionsParams{
			Mode:        params.Mode,
			FilePath:    filePath,
			Pattern:     params.Pattern,
			Regex:       params.Regex,
			Context:     params.Context,
			MaxResults:  params.MaxResults,
			Start:       params.Start,
			End:         params.End,
			Count:       params.Count,
			LineNumbers: lineNumbers,
		},
	})
	if reqErr != nil {
		return reqErr
	}
	if !granted {
		return permissionDeniedSentinel
	}
	return nil
}

func resolveTraceBinaryPath(configuredPath string) (string, error) {
	var candidates []string
	if configuredPath != "" {
		candidates = append(candidates, configuredPath)
	}
	if envPath := os.Getenv("CRUSH_TRACE_BINARY_PATH"); envPath != "" {
		candidates = append(candidates, envPath)
	}
	if pathLookup, err := exec.LookPath("large-text-viewer"); err == nil {
		candidates = append(candidates, pathLookup)
	}
	candidates = append(candidates, traceQueryDefaultFallbackBin)

	for _, candidate := range candidates {
		if candidate == "" {
			continue
		}
		expanded, err := fsext.Expand(candidate)
		if err != nil {
			continue
		}
		absPath, err := filepath.Abs(expanded)
		if err != nil {
			continue
		}
		info, err := os.Stat(absPath)
		if err != nil || info.IsDir() {
			continue
		}
		return absPath, nil
	}

	return "", fmt.Errorf("trace binary not found; set options.trace_agent.binary_path or CRUSH_TRACE_BINARY_PATH, or add large-text-viewer to PATH")
}

func buildTraceQueryArgs(filePath string, params TraceQueryParams) []string {
	switch params.Mode {
	case TraceQueryModeSearch:
		args := []string{
			string(TraceQueryModeSearch),
			"--file", filePath,
			"--pattern", params.Pattern,
		}
		if params.Regex || patternLooksLikeRegex(params.Pattern) {
			args = append(args, "--regex")
		}
		if params.Context > 0 {
			args = append(args, "--context", fmt.Sprintf("%d", params.Context))
		}
		if params.MaxResults > 0 {
			args = append(args, "--max-results", fmt.Sprintf("%d", params.MaxResults))
		}
		return args
	default:
		args := []string{
			string(TraceQueryModeLines),
			"--file", filePath,
			"--start", fmt.Sprintf("%d", params.Start),
		}
		if params.End > 0 {
			args = append(args, "--end", fmt.Sprintf("%d", params.End))
		} else if params.Count > 0 {
			args = append(args, "--count", fmt.Sprintf("%d", params.Count))
		}

		lineNumbers := true
		if params.LineNumbers != nil {
			lineNumbers = *params.LineNumbers
		}
		if lineNumbers {
			args = append(args, "--line-numbers")
		}
		return args
	}
}

var traceRegexHintPattern = regexp.MustCompile(`[\\|()[\]{}.+*?^$]`)

func patternLooksLikeRegex(pattern string) bool {
	return traceRegexHintPattern.MatchString(pattern)
}

func buildTraceQueryMetadata(
	params TraceQueryParams,
	binaryPath string,
	filePath string,
	output string,
) TraceQueryResponseMetadata {
	meta := TraceQueryResponseMetadata{
		Mode:       params.Mode,
		BinaryPath: binaryPath,
		FilePath:   filePath,
		Pattern:    params.Pattern,
		Regex:      params.Regex || patternLooksLikeRegex(params.Pattern),
		Context:    params.Context,
		MaxResults: params.MaxResults,
		Start:      params.Start,
		End:        params.End,
		Count:      params.Count,
	}

	if params.Mode == TraceQueryModeLines {
		meta.LineNumbers = params.LineNumbers == nil || *params.LineNumbers
		return meta
	}

	meta.MatchCount = parseTraceMatchCount(output)
	meta.LikelyMiss = meta.MatchCount == 0 || traceSearchOutputLooksLikeMiss(output)
	return meta
}

var traceMatchCountPattern = regexp.MustCompile(`(?i)(showed|found)\s+(\d+)\s+matches`)
var traceZeroMatchPattern = regexp.MustCompile(`(?i)\b(showed|found)\s+0\s+matches\b|\b0\s+matches\b`)

func parseTraceMatchCount(output string) int {
	match := traceMatchCountPattern.FindStringSubmatch(output)
	if len(match) != 3 {
		return 0
	}

	var count int
	_, _ = fmt.Sscanf(match[2], "%d", &count)
	return count
}

func traceSearchOutputLooksLikeMiss(output string) bool {
	s := strings.ToLower(output)
	if traceZeroMatchPattern.MatchString(output) {
		return true
	}
	missMarkers := []string{
		"no matches found",
		"no results",
	}
	for _, marker := range missMarkers {
		if strings.Contains(s, marker) {
			return true
		}
	}
	return false
}
