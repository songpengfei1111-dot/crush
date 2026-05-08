import type {
  BootstrapResponse,
  Message,
  PermissionRequest,
  Session,
} from "../shared/types";
import { requestJSON } from "../shared/api/client";

export function getBootstrap(): Promise<BootstrapResponse> {
  return requestJSON<BootstrapResponse>("/api/bootstrap");
}

export function getMessages(sessionID: string): Promise<Message[]> {
  return requestJSON<Message[]>(`/api/sessions/${encodeURIComponent(sessionID)}/messages`);
}

export function postMessage(sessionID: string, prompt: string): Promise<void> {
  return requestJSON<void>(`/api/sessions/${encodeURIComponent(sessionID)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
}

export function createSession(title: string): Promise<Session> {
  return requestJSON<Session>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export function renameSession(sessionID: string, title: string): Promise<Session> {
  return requestJSON<Session>(`/api/sessions/${encodeURIComponent(sessionID)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export function deleteSession(sessionID: string): Promise<void> {
  return requestJSON<void>(`/api/sessions/${encodeURIComponent(sessionID)}`, {
    method: "DELETE",
  });
}

export function cancelSession(sessionID: string): Promise<void> {
  return requestJSON<void>(`/api/sessions/${encodeURIComponent(sessionID)}/cancel`, {
    method: "POST",
  });
}

export function summarizeSession(sessionID: string): Promise<void> {
  return requestJSON<void>(`/api/sessions/${encodeURIComponent(sessionID)}/summarize`, {
    method: "POST",
  });
}

export function allowPermission(permission: PermissionRequest, persistent: boolean): Promise<void> {
  return requestJSON<void>("/api/permissions/allow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permission, persistent }),
  });
}

export function denyPermission(permission: PermissionRequest): Promise<void> {
  return requestJSON<void>("/api/permissions/deny", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permission }),
  });
}

export function openEventStream(): EventSource {
  return new EventSource("/api/events");
}
