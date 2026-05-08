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

export type MessagePart = Partial<TextPart & ReasoningPart> & Record<string, unknown>;

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

export interface EventPayload<TPayload> {
  type: string;
  payload: TPayload;
}

export interface EventEnvelope<TPayload> {
  type: string;
  payload: EventPayload<TPayload>;
}
