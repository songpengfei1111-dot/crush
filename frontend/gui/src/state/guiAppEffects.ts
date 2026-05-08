import {
  allowPermission,
  cancelSession,
  createSession,
  deleteSession,
  denyPermission,
  forkSession,
  getBootstrap,
  getMessages,
  openEventStream,
  postMessage,
  revokeRound,
  renameSession,
  summarizeSession,
} from "../api/gui";
import type {
  AgentEvent,
  BootstrapResponse,
  EventEnvelope,
  Message,
  PermissionNotification,
  PermissionRequest,
  Session,
} from "../shared/types";

export type GuiAppEvent =
  | EventEnvelope<Message>
  | EventEnvelope<Session>
  | EventEnvelope<PermissionRequest>
  | EventEnvelope<PermissionNotification>
  | EventEnvelope<AgentEvent>;

export function bootstrapGuiApp(): Promise<BootstrapResponse> {
  return getBootstrap();
}

export function subscribeGuiEvents(onEvent: (payload: GuiAppEvent) => void): EventSource {
  const stream = openEventStream();
  stream.onmessage = (event: MessageEvent<string>) => {
    onEvent(JSON.parse(event.data) as GuiAppEvent);
  };
  return stream;
}

export function loadSessionMessages(sessionID: string): Promise<Message[]> {
  return getMessages(sessionID);
}

export function submitPrompt(sessionID: string, prompt: string): Promise<void> {
  return postMessage(sessionID, prompt);
}

export function revokeGuiRound(sessionID: string, messageID: string): Promise<void> {
  return revokeRound(sessionID, messageID);
}

export function forkGuiSession(sessionID: string, roundEndMessageID: string, title?: string): Promise<Session> {
  return forkSession(sessionID, roundEndMessageID, title);
}

export function createGuiSession(title: string): Promise<Session> {
  return createSession(title);
}

export function cancelGuiSession(sessionID: string): Promise<void> {
  return cancelSession(sessionID);
}

export function renameGuiSession(sessionID: string, title: string): Promise<Session> {
  return renameSession(sessionID, title);
}

export function deleteGuiSession(sessionID: string): Promise<void> {
  return deleteSession(sessionID);
}

export function summarizeGuiSession(sessionID: string): Promise<void> {
  return summarizeSession(sessionID);
}

export function allowGuiPermission(permission: PermissionRequest, persistent: boolean): Promise<void> {
  return allowPermission(permission, persistent);
}

export function denyGuiPermission(permission: PermissionRequest): Promise<void> {
  return denyPermission(permission);
}
