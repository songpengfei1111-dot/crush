import { useState } from "react";

type ComposerProps = {
  onSend: (prompt: string) => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function Composer(props: ComposerProps) {
  const { onSend, onRefresh } = props;
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
      <textarea
        placeholder="输入你的 prompt..."
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <button onClick={() => void handleSend()}>发送</button>
      <button className="secondary" onClick={() => void onRefresh()}>
        刷新
      </button>
    </div>
  );
}
