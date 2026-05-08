import { useState } from "react";

type ComposerProps = {
  onSend: (prompt: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onCancel: () => Promise<void>;
  isBusy: boolean;
};

export function Composer(props: ComposerProps) {
  const { onSend, onRefresh, onCancel, isBusy } = props;
  const [prompt, setPrompt] = useState("");

  async function handleSend() {
    const value = prompt.trim();
    if (!value) {
      return;
    }
    await onSend(value);
    setPrompt("");
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
  );
}
