import { useEffect, useId, useState } from "react";

import mermaid from "mermaid";

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
        ensureMermaidInitialized()
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

  const classes = ["mermaid-block", className].filter(Boolean).join(" ");

  if (state.status === "loading" || state.status === "idle") {
    return <div className={`${classes} is-loading`}>Rendering Mermaid diagram...</div>;
  }

  if (state.status === "error") {
    return (
      <div className={`${classes} is-error`}>
        <div className="mermaid-block-title">Mermaid render failed</div>
        <div className="mermaid-block-error">{state.error}</div>
        <pre className="message-markdown-pre">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={classes}>
      <div className="mermaid-block-canvas" dangerouslySetInnerHTML={{ __html: state.svg }} />
    </div>
  );
}
