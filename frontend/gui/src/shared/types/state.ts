import type { AgentInfo, Message, PermissionRequest, Session } from "./domain";

export interface BranchMeta {
  sessionID: string;
  parentSessionID: string;
  roundEndMessageID: string;
  rootSessionID: string;
  createdAt: number;
}

export interface BootstrapResponse {
  sessions: Session[];
  current_session_id: string;
  messages: Message[];
  agent: AgentInfo;
  permissions: PermissionRequest[];
}

export interface AppState {
  sessions: Session[];
  messages: Message[];
  currentSessionID: string;
  permissions: PermissionRequest[];
  agent: AgentInfo;
  busySessionID: string;
  branchMetaBySessionID: Record<string, BranchMeta>;
}
