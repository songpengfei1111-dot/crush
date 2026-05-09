import type {
  BootstrapResponse,
  ConfigScope,
  MCPServerDraft,
  MCPServerSummary,
  Message,
  PermissionRequest,
  ProviderDraft,
  ProviderSummary,
  ProviderTestResult,
  SelectedModelConfig,
  SelectedModelType,
  SkillSettingsDraft,
  SettingsBootstrap,
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

export function revokeRound(sessionID: string, messageID: string): Promise<void> {
  return requestJSON<void>(
    `/api/sessions/${encodeURIComponent(sessionID)}/messages/${encodeURIComponent(messageID)}/revoke`,
    {
      method: "POST",
    },
  );
}

export function forkSession(sessionID: string, roundEndMessageID: string, title?: string): Promise<Session> {
  return requestJSON<Session>(`/api/sessions/${encodeURIComponent(sessionID)}/fork`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      round_end_message_id: roundEndMessageID,
      title,
    }),
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

export function getSettingsBootstrap(): Promise<SettingsBootstrap> {
  return requestJSON<SettingsBootstrap>("/api/settings/bootstrap");
}

export function testProvider(provider: ProviderDraft): Promise<ProviderTestResult> {
  return requestJSON<ProviderTestResult>("/api/settings/providers/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
}

export function saveProvider(scope: ConfigScope, provider: ProviderDraft): Promise<ProviderSummary> {
  return requestJSON<ProviderSummary>(`/api/settings/providers/${encodeURIComponent(provider.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, provider }),
  });
}

export function updatePreferredModel(
  scope: ConfigScope,
  modelType: SelectedModelType,
  model: SelectedModelConfig,
): Promise<void> {
  return requestJSON<void>("/api/settings/models", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, model_type: modelType, model }),
  });
}

export function setCompactMode(scope: ConfigScope, enabled: boolean): Promise<void> {
  return requestJSON<void>("/api/settings/compact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, enabled }),
  });
}

export function saveMCPServer(scope: ConfigScope, server: MCPServerDraft): Promise<MCPServerSummary> {
  return requestJSON<MCPServerSummary>(`/api/settings/mcp/${encodeURIComponent(server.name)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, server }),
  });
}

export function deleteMCPServer(name: string, scope: ConfigScope): Promise<void> {
  const params = new URLSearchParams({ scope });
  return requestJSON<void>(`/api/settings/mcp/${encodeURIComponent(name)}?${params.toString()}`, {
    method: "DELETE",
  });
}

export function saveSkillSettings(scope: ConfigScope, skills: SkillSettingsDraft): Promise<void> {
  return requestJSON<void>("/api/settings/skills", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope, skills }),
  });
}

export function refreshProviderOAuth(scope: ConfigScope, providerID: string): Promise<void> {
  return requestJSON<void>(`/api/settings/providers/${encodeURIComponent(providerID)}/refresh-oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope }),
  });
}

export function getDefaultSmallModel(providerID: string): Promise<SelectedModelConfig> {
  return requestJSON<SelectedModelConfig>(
    `/api/settings/providers/${encodeURIComponent(providerID)}/default-small-model`,
  );
}

export function openEventStream(): EventSource {
  return new EventSource("/api/events");
}
