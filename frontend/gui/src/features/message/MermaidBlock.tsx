import { useEffect, useId, useState } from "react";

import mermaid from "mermaid";

import { copyTextToClipboard } from "../../utils/clipboard";

type MermaidBlockProps = {
  chart: string;
  className?: string;
};

type MermaidRenderState =
  | { status: "idle"; svg: string; error: string }
  | { status: "loading"; svg: string; error: string }
  | { status: "success"; svg: string; error: string }
  | { status: "error"; svg: string; error: string };

let initialized = false;

function ensureMermaidInitialized() {
  if (initialized) {
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "dark",
    fontFamily: "inherit",
  });
  initialized = true;
}

export function MermaidBlock(props: MermaidBlockProps) {
  const { chart, className } = props;
  const reactID = useId();
  const [state, setState] = useState<MermaidRenderState>({
    status: "idle",
    svg: "",
    error: "",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const source = chart.trim();
    if (!source) {
      setState({
        status: "error",
        svg: "",
        error: "Mermaid source is empty.",
      });
      return;
    }

    let disposed = false;

    async function renderChart() {
      setState({
        status: "loading",
        svg: "",
        error: "",
      });

      try {
        ensureMermaidInitialized();
        const renderID = `mermaid-${reactID.replace(/:/g, "-")}`;
        const { svg } = await mermaid.render(renderID, source);
        if (disposed) {
          return;
        }
        setState({
          status: "success",
          svg,
          error: "",
        });
      } catch (error) {
        if (disposed) {
          return;
        }
        setState({
          status: "error",
          svg: "",
          error: error instanceof Error ? error.message : "Failed to render Mermaid diagram.",
        });
      }
    }

    void renderChart();

    return () => {
      disposed = true;
    };
  }, [chart, reactID]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timerID = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timerID);
    };
  }, [copied]);

  async function handleCopy() {
    if (!chart.trim()) {
      return;
    }

    await copyTextToClipboard(chart);
    setCopied(true);
  }

  const classes = ["message-card", "mermaid-block", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <div className="message-card-header">
        <div className="message-card-label">mermaid</div>
        <button className="message-card-button" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mermaid-block-body">
        {state.status === "loading" || state.status === "idle" ? (
          <div className="mermaid-block-status">Rendering Mermaid diagram...</div>
        ) : null}
        {state.status === "error" ? (
          <div className="mermaid-block-error-panel">
            <div className="mermaid-block-title">Mermaid render failed</div>
            <div className="mermaid-block-error">{state.error}</div>
            <pre className="mermaid-block-source">
              <code>{chart}</code>
            </pre>
          </div>
        ) : null}
        {state.status === "success" ? (
          <div className="mermaid-block-canvas" dangerouslySetInnerHTML={{ __html: state.svg }} />
        ) : null}
      </div>
    </div>
  );
}
