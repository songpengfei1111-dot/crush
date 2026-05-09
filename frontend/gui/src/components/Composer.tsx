import { useMemo, useState } from "react";
import type { ProviderSummary, SelectedModelConfig, SendPromptOptions } from "../shared/types";

type ComposerProps = {
  onSend: (prompt: string, options?: SendPromptOptions) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSummarize: () => Promise<void>;
  onCancel: () => Promise<void>;
  isBusy: boolean;
  canSummarize: boolean;
  providers: ProviderSummary[];
  selectedModel?: SelectedModelConfig;
};

export function Composer(props: ComposerProps) {
  const { onSend, onRefresh, onSummarize, onCancel, isBusy, canSummarize, providers, selectedModel } = props;
  const [prompt, setPrompt] = useState("");
  const [modelKey, setModelKey] = useState("");
  const modelOptions = useMemo(
    () =>
      providers.flatMap((provider) =>
        (provider.models || []).map((model) => ({
          key: `${provider.id}:${model.id}`,
          label: `${provider.name}/${model.name || model.id}`,
        })),
      ),
    [providers],
  );
  const defaultModelLabel = selectedModel ? `${selectedModel.provider}/${selectedModel.model}` : "默认模型";

  async function handleSend() {
    const value = prompt.trim();
    if (!value) {
      return;
    }
    const override = modelFromKey(modelKey);
    await onSend(value, override ? { modelOverride: override, scope: "workspace", syncSmallModel: true } : undefined);
    setPrompt("");
  }

  function modelFromKey(value: string): SelectedModelConfig | undefined {
    const [providerID, modelID] = value.split(":", 2);
    if (!providerID || !modelID) {
      return undefined;
    }
    return { provider: providerID, model: modelID };
  }

  return (
    <div className="composer">
      <div className="composer-card">
        <textarea
          className="composer-input"
          placeholder="输入你的 prompt..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <div className="composer-footer">
          <div className="composer-actions">
            <button className="secondary composer-secondary-button" onClick={() => void onRefresh()}>
              刷新
            </button>
          </div>
          <div className="composer-primary-actions">
            <label className="composer-model-picker">
              <select
                className="composer-model-select"
                value={modelKey}
                disabled={isBusy}
                aria-label="选择模型"
                onChange={(event) => setModelKey(event.currentTarget.value)}
              >
                <option value="">{defaultModelLabel}</option>
                {modelOptions.map((model) => (
                  <option key={model.key} value={model.key}>
                    {model.label}
                  </option>
                ))}
              </select>
              <span className="composer-model-chevron">⌄</span>
            </label>
            <button
              className="secondary composer-secondary-button"
              disabled={!canSummarize || isBusy}
              onClick={() => void onSummarize()}
            >
              摘要
            </button>
            <button
              className={`composer-send-button${isBusy ? " stop" : ""}`}
              disabled={!isBusy && !prompt.trim()}
              onClick={() => void (isBusy ? onCancel() : handleSend())}
            >
              {isBusy ? "终止" : "发送"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
