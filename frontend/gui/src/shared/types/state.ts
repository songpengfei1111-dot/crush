import type {
  AgentInfo,
  ConfigScope,
  MCPServerSummary,
  Message,
  PermissionRequest,
  ProviderSummary,
  SkillSettings,
  SelectedModelConfig,
  SelectedModelType,
  Session,
} from "./domain";

export interface BootstrapResponse {
  sessions: Session[];
  current_session_id: string;
  messages: Message[];
  agent: AgentInfo;
  permissions: PermissionRequest[];
}

export interface SettingsBootstrap {
  provider_catalog: ProviderSummary[];
  configured_providers: ProviderSummary[];
  selected_models: Partial<Record<SelectedModelType, SelectedModelConfig>>;
  compact_mode: boolean;
  mcp_servers: MCPServerSummary[];
  skills: SkillSettings;
}

export interface SendPromptOptions {
  modelOverride?: SelectedModelConfig;
  scope?: ConfigScope;
  syncSmallModel?: boolean;
}

export interface AppState {
  sessions: Session[];
  messages: Message[];
  currentSessionID: string;
  permissions: PermissionRequest[];
  agent: AgentInfo;
  busySessionID: string;
  settingsOpen: boolean;
  settingsLoading: boolean;
  providerCatalog: ProviderSummary[];
  configuredProviders: ProviderSummary[];
  selectedModels: Partial<Record<SelectedModelType, SelectedModelConfig>>;
  compactMode: boolean;
  mcpServers: MCPServerSummary[];
  skills: SkillSettings;
}
