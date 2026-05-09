import {
  allowPermission,
  cancelSession,
  createSession,
  deleteSession,
  deleteMCPServer,
  denyPermission,
  forkSession,
  getBootstrap,
  getDefaultSmallModel,
  getMessages,
  getSettingsBootstrap,
  openEventStream,
  postMessage,
  refreshProviderOAuth,
  revokeRound,
  saveMCPServer,
  renameSession,
  saveProvider,
  saveSkillSettings,
  setCompactMode,
  summarizeSession,
  testProvider,
  updatePreferredModel,
} from "../api/gui";
import type {
  AgentEvent,
  BootstrapResponse,
  ConfigScope,
  EventEnvelope,
  MCPServerDraft,
  MCPServerSummary,
  Message,
  PermissionNotification,
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

export function bootstrapGuiSettings(): Promise<SettingsBootstrap> {
  return getSettingsBootstrap();
}

export function saveGuiProvider(scope: ConfigScope, provider: ProviderDraft): Promise<ProviderSummary> {
  return saveProvider(scope, provider);
}

export function testGuiProvider(provider: ProviderDraft): Promise<ProviderTestResult> {
  return testProvider(provider);
}

export function updateGuiPreferredModel(
  scope: ConfigScope,
  modelType: SelectedModelType,
  model: SelectedModelConfig,
): Promise<void> {
  return updatePreferredModel(scope, modelType, model);
}

export function setGuiCompactMode(scope: ConfigScope, enabled: boolean): Promise<void> {
  return setCompactMode(scope, enabled);
}

export function saveGuiMCPServer(scope: ConfigScope, server: MCPServerDraft): Promise<MCPServerSummary> {
  return saveMCPServer(scope, server);
}

export function deleteGuiMCPServer(name: string, scope: ConfigScope): Promise<void> {
  return deleteMCPServer(name, scope);
}

export function saveGuiSkillSettings(scope: ConfigScope, skills: SkillSettingsDraft): Promise<void> {
  return saveSkillSettings(scope, skills);
}

export function refreshGuiProviderOAuth(scope: ConfigScope, providerID: string): Promise<void> {
  return refreshProviderOAuth(scope, providerID);
}

export function loadDefaultSmallModel(providerID: string): Promise<SelectedModelConfig> {
  return getDefaultSmallModel(providerID);
}
