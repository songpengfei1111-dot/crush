import { useMemo, useState } from "react";

import type {
  MCPServerDraft,
  MCPServerSummary,
  ProviderDraft,
  ProviderSummary,
  ProviderTestResult,
  SelectedModelConfig,
  SkillSettings,
  SkillSettingsDraft,
} from "../../shared/types";

type SettingsSection = "general" | "providers" | "mcp" | "skills";

type SettingsPageProps = {
  open: boolean;
  loading: boolean;
  providerCatalog: ProviderSummary[];
  configuredProviders: ProviderSummary[];
  mcpServers: MCPServerSummary[];
  skills: SkillSettings;
  selectedModel?: SelectedModelConfig;
  compactMode: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onSaveProvider: (provider: ProviderDraft) => Promise<void>;
  onTestProvider: (provider: ProviderDraft) => Promise<ProviderTestResult>;
  onSelectModel: (model: SelectedModelConfig) => Promise<void>;
  onSetCompactMode: (enabled: boolean) => Promise<void>;
  onRefreshOAuth: (providerID: string) => Promise<void>;
  onSaveMCPServer: (server: MCPServerDraft) => Promise<void>;
  onDeleteMCPServer: (name: string) => Promise<void>;
  onSaveSkills: (skills: SkillSettingsDraft) => Promise<void>;
};

export function SettingsPage(props: SettingsPageProps) {
  const {
    open,
    loading,
    providerCatalog,
    configuredProviders,
    mcpServers,
    skills,
    selectedModel,
    compactMode,
    onClose,
    onRefresh,
    onSaveProvider,
    onTestProvider,
    onSelectModel,
    onSetCompactMode,
    onRefreshOAuth,
    onSaveMCPServer,
    onDeleteMCPServer,
    onSaveSkills,
  } = props;
  const normalizedSkills = normalizeSkillSettings(skills);
  const providers = useMemo(
    () => mergeProviders(providerCatalog, configuredProviders),
    [configuredProviders, providerCatalog],
  );
  const [section, setSection] = useState<SettingsSection>("providers");
  const [selectedProviderID, setSelectedProviderID] = useState("");
  const [selectedMCPName, setSelectedMCPName] = useState("");
  const selectedProvider = providers.find((provider) => provider.id === selectedProviderID) || providers[0];
  const selectedMCP = mcpServers.find((server) => server.name === selectedMCPName) || mcpServers[0];

  if (!open) {
    return null;
  }

  return (
    <div className="settings-backdrop">
      <section className="settings-panel">
        <header className="settings-header">
          <div>
            <h2>Provider 设置</h2>
            <p>管理 provider、API Key、连通性测试和默认模型。</p>
          </div>
          <div className="settings-header-actions">
            <button className="secondary" onClick={() => void onRefresh()}>
              刷新
            </button>
            <button className="secondary" onClick={onClose}>
              关闭
            </button>
          </div>
        </header>
        {loading ? <div className="settings-loading">加载中...</div> : null}
        <div className="settings-body">
          <aside className="settings-sidebar">
            <div className="settings-sections">
              <button
                className={`settings-section-item${section === "general" ? " active" : ""}`}
                onClick={() => setSection("general")}
              >
                通用
              </button>
              <button
                className={`settings-section-item${section === "providers" ? " active" : ""}`}
                onClick={() => setSection("providers")}
              >
                Providers
              </button>
              <button
                className={`settings-section-item${section === "mcp" ? " active" : ""}`}
                onClick={() => setSection("mcp")}
              >
                MCP
              </button>
              <button
                className={`settings-section-item${section === "skills" ? " active" : ""}`}
                onClick={() => setSection("skills")}
              >
                Skills
              </button>
            </div>
            {section === "providers" ? (
              <div className="settings-resource-list">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    className={`settings-provider-item${provider.id === selectedProvider?.id ? " active" : ""}`}
                    onClick={() => setSelectedProviderID(provider.id)}
                  >
                    <span>{provider.name || provider.id}</span>
                    <small className={`settings-provider-state${provider.configured ? " configured" : ""}`}>
                      {provider.configured ? "已配置" : "未配置"}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}
            {section === "mcp" ? (
              <div className="settings-resource-list">
                <button
                  className={`settings-provider-item${!selectedMCP ? " active" : ""}`}
                  onClick={() => setSelectedMCPName("")}
                >
                  <span>新建 MCP</span>
                  <small className="settings-provider-state">Draft</small>
                </button>
                {mcpServers.map((server) => (
                  <button
                    key={server.name}
                    className={`settings-provider-item${server.name === selectedMCP?.name ? " active" : ""}`}
                    onClick={() => setSelectedMCPName(server.name)}
                  >
                    <span>{server.name}</span>
                    <small className={`settings-provider-state${server.disabled ? "" : " configured"}`}>
                      {server.disabled ? "已禁用" : server.state || "已配置"}
                    </small>
                  </button>
                ))}
              </div>
            ) : null}
          </aside>
          <main className="settings-detail">
            {section === "general" ? (
              <GeneralSettings compactMode={compactMode} onSetCompactMode={onSetCompactMode} />
            ) : null}
            {section === "providers" ? (
              selectedProvider ? (
                <>
                  <ProviderEditor
                    key={selectedProvider.id}
                    provider={selectedProvider}
                    onSave={onSaveProvider}
                    onTest={onTestProvider}
                    onRefreshOAuth={onRefreshOAuth}
                  />
                  <ModelPicker
                    key={`${selectedProvider.id}:models`}
                    provider={selectedProvider}
                    selectedModel={selectedModel}
                    onSelectModel={onSelectModel}
                  />
                </>
              ) : (
                <div className="settings-empty">暂无 provider。</div>
              )
            ) : null}
            {section === "mcp" ? (
              <MCPEditor
                key={selectedMCP?.name || "__new__"}
                server={selectedMCP}
                onSave={onSaveMCPServer}
                onDelete={onDeleteMCPServer}
              />
            ) : null}
            {section === "skills" ? (
              <SkillsEditor
                key={normalizedSkills.skills.map((skill) => skill.skill_file_path || skill.name).join("|")}
                skills={normalizedSkills}
                onSave={onSaveSkills}
              />
            ) : null}
          </main>
        </div>
      </section>
    </div>
  );
}

type GeneralSettingsProps = {
  compactMode: boolean;
  onSetCompactMode: (enabled: boolean) => Promise<void>;
};

function GeneralSettings(props: GeneralSettingsProps) {
  const { compactMode, onSetCompactMode } = props;

  return (
    <section className="settings-card">
      <h3>通用设置</h3>
      <label className="settings-check-row">
        <input
          type="checkbox"
          checked={compactMode}
          onChange={(event) => void onSetCompactMode(event.currentTarget.checked)}
        />
        <span>启用 compact mode</span>
      </label>
    </section>
  );
}

type ProviderEditorProps = {
  provider: ProviderSummary;
  onSave: (provider: ProviderDraft) => Promise<void>;
  onTest: (provider: ProviderDraft) => Promise<ProviderTestResult>;
  onRefreshOAuth: (providerID: string) => Promise<void>;
};

function ProviderEditor(props: ProviderEditorProps) {
  const { provider, onSave, onTest, onRefreshOAuth } = props;
  const [apiKey, setAPIKey] = useState(provider.api_key || "");
  const [baseURL, setBaseURL] = useState(provider.base_url || "");
  const [testResult, setTestResult] = useState<ProviderTestResult | undefined>();
  const draft = (): ProviderDraft => ({
    id: provider.id,
    name: provider.name,
    type: provider.type,
    base_url: baseURL,
    api_key: apiKey,
    disabled: provider.disabled,
  });

  return (
    <section className="settings-card">
      <div className="settings-card-title">
        <div>
          <h3>{provider.name || provider.id}</h3>
          <p>{provider.id}</p>
        </div>
        <span className={`settings-status${provider.configured ? " ok" : ""}`}>
          {provider.configured ? "已配置" : "未配置"}
        </span>
      </div>
      <label>
        Base URL
        <input value={baseURL} onChange={(event) => setBaseURL(event.currentTarget.value)} />
      </label>
      <label>
        API Key
        <input
          type="password"
          placeholder={provider.has_api_key ? "已保存，留空则不修改" : "输入 API Key"}
          value={apiKey}
          onChange={(event) => setAPIKey(event.currentTarget.value)}
        />
      </label>
      {testResult ? (
        <div className={`settings-test-result${testResult.ok ? " ok" : " error"}`}>
          {testResult.ok ? "连通性测试通过" : testResult.error || "连通性测试失败"}
        </div>
      ) : null}
      <div className="settings-actions">
        <button
          className="secondary"
          onClick={async () => {
            setTestResult(await onTest(draft()));
          }}
        >
          测试连接
        </button>
        <button onClick={() => void onSave(draft())}>保存 Provider</button>
        {provider.has_oauth ? (
          <button className="secondary" onClick={() => void onRefreshOAuth(provider.id)}>
            刷新 OAuth
          </button>
        ) : null}
      </div>
    </section>
  );
}

type ModelPickerProps = {
  provider: ProviderSummary;
  selectedModel?: SelectedModelConfig;
  onSelectModel: (model: SelectedModelConfig) => Promise<void>;
};

function ModelPicker(props: ModelPickerProps) {
  const { provider, selectedModel, onSelectModel } = props;
  const [modelID, setModelID] = useState(selectedModel?.provider === provider.id ? selectedModel.model : "");
  const models = provider.models || [];

  return (
    <section className="settings-card">
      <h3>默认 Large Model</h3>
      <div className="settings-model-row">
        <select value={modelID} onChange={(event) => setModelID(event.currentTarget.value)}>
          <option value="">选择模型</option>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name || model.id}
            </option>
          ))}
        </select>
        <button
          disabled={!modelID}
          onClick={() => void onSelectModel({ provider: provider.id, model: modelID })}
        >
          设为默认
        </button>
      </div>
    </section>
  );
}

type MCPEditorProps = {
  server?: MCPServerSummary;
  onSave: (server: MCPServerDraft) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
};

function MCPEditor(props: MCPEditorProps) {
  const { server, onSave, onDelete } = props;
  const [name, setName] = useState(server?.name || "");
  const [type, setType] = useState<MCPServerDraft["type"]>(server?.type || "stdio");
  const [command, setCommand] = useState(server?.command || "");
  const [url, setURL] = useState(server?.url || "");
  const [argsText, setArgsText] = useState((server?.args || []).join("\n"));
  const [envText, setEnvText] = useState(serializeRecord(server?.env));
  const [headersText, setHeadersText] = useState(serializeRecord(server?.headers));
  const [disabledToolsText, setDisabledToolsText] = useState((server?.disabled_tools || []).join("\n"));
  const [timeout, setTimeoutValue] = useState(server?.timeout ? String(server.timeout) : "");
  const [disabled, setDisabled] = useState(Boolean(server?.disabled));

  const draft = (): MCPServerDraft => ({
    name: name.trim(),
    type,
    command: command.trim(),
    url: url.trim(),
    args: parseLines(argsText),
    env: parseKeyValueLines(envText),
    headers: parseKeyValueLines(headersText),
    disabled_tools: parseLines(disabledToolsText),
    disabled,
    timeout: Number.parseInt(timeout, 10) || 0,
  });

  return (
    <section className="settings-card">
      <div className="settings-card-title">
        <div>
          <h3>{server ? server.name : "新建 MCP Server"}</h3>
          <p>配置自定义 MCP 连接，支持 stdio / sse / http。</p>
        </div>
        {server ? (
          <span className={`settings-status${server.disabled ? "" : " ok"}`}>
            {server.disabled ? "已禁用" : server.state || "已配置"}
          </span>
        ) : null}
      </div>
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.currentTarget.value)} />
      </label>
      <label>
        Type
        <select value={type} onChange={(event) => setType(event.currentTarget.value as MCPServerDraft["type"])}>
          <option value="stdio">stdio</option>
          <option value="sse">sse</option>
          <option value="http">http</option>
        </select>
      </label>
      {type === "stdio" ? (
        <>
          <label>
            Command
            <input value={command} onChange={(event) => setCommand(event.currentTarget.value)} />
          </label>
          <label>
            Args
            <textarea rows={5} value={argsText} onChange={(event) => setArgsText(event.currentTarget.value)} />
          </label>
          <label>
            Env
            <textarea
              rows={5}
              placeholder="KEY=value"
              value={envText}
              onChange={(event) => setEnvText(event.currentTarget.value)}
            />
          </label>
        </>
      ) : (
        <>
          <label>
            URL
            <input value={url} onChange={(event) => setURL(event.currentTarget.value)} />
          </label>
          <label>
            Headers
            <textarea
              rows={5}
              placeholder="Authorization=Bearer ..."
              value={headersText}
              onChange={(event) => setHeadersText(event.currentTarget.value)}
            />
          </label>
        </>
      )}
      <label>
        Disabled Tools
        <textarea
          rows={4}
          placeholder="一行一个 tool 名称"
          value={disabledToolsText}
          onChange={(event) => setDisabledToolsText(event.currentTarget.value)}
        />
      </label>
      <label>
        Timeout Seconds
        <input value={timeout} onChange={(event) => setTimeoutValue(event.currentTarget.value)} />
      </label>
      <label className="settings-check-row">
        <input type="checkbox" checked={disabled} onChange={(event) => setDisabled(event.currentTarget.checked)} />
        <span>禁用该 MCP server</span>
      </label>
      {server ? (
        <div className="settings-inline-meta">
          <span>tools: {server.tool_count || 0}</span>
          <span>prompts: {server.prompt_count || 0}</span>
          <span>resources: {server.resource_count || 0}</span>
          {server.error ? <span className="settings-error-text">{server.error}</span> : null}
        </div>
      ) : null}
      <div className="settings-actions">
        <button onClick={() => void onSave(draft())}>保存 MCP</button>
        {server ? (
          <button className="danger" onClick={() => void onDelete(server.name)}>
            删除 MCP
          </button>
        ) : null}
      </div>
    </section>
  );
}

type SkillsEditorProps = {
  skills: SkillSettings;
  onSave: (skills: SkillSettingsDraft) => Promise<void>;
};

function SkillsEditor(props: SkillsEditorProps) {
  const { skills, onSave } = props;
  const [userPathsText, setUserPathsText] = useState(skills.user_paths.join("\n"));
  const [disabledSkills, setDisabledSkills] = useState(() => new Set(skills.disabled_skills));

  function toggleSkill(name: string, enabled: boolean) {
    setDisabledSkills((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <>
      <section className="settings-card">
        <div className="settings-card-title">
          <div>
            <h3>Skills 路径与启停</h3>
            <p>管理自定义 skills 目录，并控制技能是否对 agent 可见。</p>
          </div>
          <span className="settings-status">{skills.skills.length} skills</span>
        </div>
        <label>
          自定义 Skills Paths
          <textarea
            rows={6}
            placeholder="一行一个目录"
            value={userPathsText}
            onChange={(event) => setUserPathsText(event.currentTarget.value)}
          />
        </label>
        <div className="settings-subsection">
          <strong>默认自动发现目录</strong>
          <div className="settings-token-list">
            {skills.default_paths.map((path) => (
              <span key={path} className="settings-token">
                {path}
              </span>
            ))}
          </div>
        </div>
        <div className="settings-actions">
          <button
            onClick={() =>
              void onSave({
                user_paths: parseLines(userPathsText),
                disabled_skills: [...disabledSkills].sort(),
              })
            }
          >
            保存 Skills 设置
          </button>
        </div>
      </section>
      <section className="settings-card">
        <h3>已发现 Skills</h3>
        <div className="settings-skill-list">
          {skills.skills.map((skill) => {
            const enabled = !disabledSkills.has(skill.name);
            return (
              <label key={`${skill.skill_file_path || skill.name}:${skill.state}`} className="settings-skill-item">
                <div className="settings-check-row">
                  <input
                    type="checkbox"
                    checked={enabled}
                    disabled={skill.state === "error" || !skill.name}
                    onChange={(event) => toggleSkill(skill.name, event.currentTarget.checked)}
                  />
                  <span>{skill.name || skill.skill_file_path || "Unnamed Skill"}</span>
                  <span className={`settings-provider-state${enabled && skill.state === "normal" ? " configured" : ""}`}>
                    {skill.state === "error" ? "错误" : skill.builtin ? "builtin" : "local"}
                  </span>
                </div>
                {skill.description ? <div className="muted">{skill.description}</div> : null}
                {skill.compatibility ? <div className="muted">{skill.compatibility}</div> : null}
                {skill.skill_file_path ? <div className="muted">{skill.skill_file_path}</div> : null}
                {skill.error ? <div className="settings-error-text">{skill.error}</div> : null}
              </label>
            );
          })}
        </div>
      </section>
    </>
  );
}

function mergeProviders(catalog: ProviderSummary[], configured: ProviderSummary[]): ProviderSummary[] {
  const map = new Map<string, ProviderSummary>();
  for (const provider of catalog) {
    map.set(provider.id, provider);
  }
  for (const provider of configured) {
    map.set(provider.id, { ...map.get(provider.id), ...provider, configured: true });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseKeyValueLines(value: string): Record<string, string> | undefined {
  const entries = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("=");
      if (separator === -1) {
        return undefined;
      }
      const key = line.slice(0, separator).trim();
      const val = line.slice(separator + 1).trim();
      if (!key) {
        return undefined;
      }
      return [key, val] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries);
}

function serializeRecord(record?: Record<string, string>): string {
  if (!record) {
    return "";
  }
  return Object.entries(record)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function normalizeSkillSettings(skills?: SkillSettings): SkillSettings {
  return {
    user_paths: skills?.user_paths || [],
    default_paths: skills?.default_paths || [],
    disabled_skills: skills?.disabled_skills || [],
    skills: skills?.skills || [],
  };
}
