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

export interface BootstrapResponse {
  sessions: Session[];
  current_session_id: string;
  messages: Message[];
  agent: AgentInfo;
  permissions: PermissionRequest[];
}

export interface AgentEvent {
  session_id?: string;
  session_title?: string;
  type?: string;
}

export interface AppState {
  sessions: Session[];
  messages: Message[];
  currentSessionID: string;
  permissions: PermissionRequest[];
  agent: AgentInfo;
  busySessionID: string;
}

export type EventMutationType = "created" | "updated" | "deleted";

export interface EventPayload<TPayload> {
  type: EventMutationType;
  payload: TPayload;
}

export interface EventEnvelope<TPayload> {
  type: string;
  payload: EventPayload<TPayload>;
}
