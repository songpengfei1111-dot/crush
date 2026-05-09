export interface Session {
  id: string;
  parent_session_id: string;
  title: string;
  message_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  summary_message_id: string;
  cost: number;
  created_at: number;
  updated_at: number;
}

export interface TextPart {
  text: string;
}

export interface ReasoningPart {
  thinking: string;
  signature?: string;
  started_at?: number;
  finished_at?: number;
}

export interface ToolCallPart {
  id: string;
  name: string;
  input: string;
  finished: boolean;
}

export interface ToolResultPart {
  tool_call_id: string;
  name: string;
  content: string;
  metadata?: string;
  is_error?: boolean;
}

export interface FinishPart {
  reason: "end_turn" | "max_tokens" | "tool_use" | "canceled" | "error" | "unknown";
  time: number;
  message?: string;
  details?: string;
}

export interface BinaryPart {
  path: string;
  mime_type: string;
  data: string;
}

export interface ImageURLPart {
  url: string;
  detail?: string;
}

export type MessagePart =
  | { type: "text"; data: TextPart }
  | { type: "reasoning"; data: ReasoningPart }
  | { type: "tool_call"; data: ToolCallPart }
  | { type: "tool_result"; data: ToolResultPart }
  | { type: "finish"; data: FinishPart }
  | { type: "binary"; data: BinaryPart }
  | { type: "image_url"; data: ImageURLPart };

export interface Message {
  id: string;
  role: string;
  session_id: string;
  parts: MessagePart[];
  model: string;
  provider: string;
  created_at: number;
  updated_at: number;
}

export interface PermissionRequest {
  id: string;
  session_id: string;
  tool_call_id: string;
  tool_name: string;
  description: string;
  action: string;
  params: unknown;
  path: string;
}

export interface PermissionNotification {
  tool_call_id: string;
  granted: boolean;
  denied: boolean;
}

export interface AgentInfo {
  is_busy: boolean;
  is_ready: boolean;
  model: Record<string, unknown>;
  model_cfg: {
    provider?: string;
    model?: string;
  };
}

export type ConfigScope = "global" | "workspace";
export type SelectedModelType = "large" | "small";

export interface ModelOption {
  id: string;
  name?: string;
  context_window?: number;
  default_max_tokens?: number;
  can_reason?: boolean;
  supports_images?: boolean;
  default_reasoning_effort?: string;
  reasoning_levels?: string[];
}

export interface SelectedModelConfig {
  model: string;
  provider: string;
  reasoning_effort?: string;
  think?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ProviderSummary {
  id: string;
  name: string;
  type?: string;
  base_url?: string;
  api_key?: string;
  models?: ModelOption[];
  configured: boolean;
  disabled: boolean;
  has_api_key: boolean;
  has_oauth: boolean;
}

export interface ProviderDraft {
  id: string;
  name: string;
  type?: string;
  base_url?: string;
  api_key?: string;
  disabled?: boolean;
  extra_headers?: Record<string, string>;
  extra_body?: Record<string, unknown>;
  models?: ModelOption[];
}

export interface ProviderTestResult {
  ok: boolean;
  error?: string;
}

export type MCPServerType = "stdio" | "sse" | "http";

export interface MCPServerSummary {
  name: string;
  type: MCPServerType;
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  disabled: boolean;
  disabled_tools?: string[];
  timeout?: number;
  state?: string;
  error?: string;
  tool_count?: number;
  prompt_count?: number;
  resource_count?: number;
}

export interface MCPServerDraft {
  name: string;
  type: MCPServerType;
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
  headers?: Record<string, string>;
  disabled?: boolean;
  disabled_tools?: string[];
  timeout?: number;
}

export interface SkillSummary {
  name: string;
  description?: string;
  compatibility?: string;
  path?: string;
  skill_file_path?: string;
  builtin: boolean;
  enabled: boolean;
  state: "normal" | "error";
  error?: string;
}

export interface SkillSettings {
  user_paths: string[];
  default_paths: string[];
  disabled_skills: string[];
  skills: SkillSummary[];
}

export interface SkillSettingsDraft {
  user_paths: string[];
  disabled_skills: string[];
}
