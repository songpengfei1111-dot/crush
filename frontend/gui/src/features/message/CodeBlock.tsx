import { useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { copyTextToClipboard } from "../../utils/clipboard";

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

export function CodeBlock(props: CodeBlockProps) {
  const { code, language, className } = props;
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  const label = language?.trim().toLowerCase() || "code";
  const highlightLanguage = useMemo(() => {
    if (label === "code" || label === "text" || label === "plain") {
      return "text";
    }
    return label;
  }, [label]);
  const classes = ["message-card", "code-block", className].filter(Boolean).join(" ");

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!code.trim()) {
      return;
    }

    await copyTextToClipboard(code);
    setCopied(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 1500);
  }

  return (
    <div className={classes}>
      <div className="message-card-header">
        <div className="message-card-header-main">
          <div className="message-card-window-controls" aria-hidden="true">
            <span className="message-card-window-dot red" />
            <span className="message-card-window-dot yellow" />
            <span className="message-card-window-dot green" />
          </div>
          <div className="message-card-title">{label}</div>
        </div>
        <button className="message-card-button" onClick={() => void handleCopy()}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={highlightLanguage}
        style={oneDark}
        showLineNumbers
        wrapLongLines={false}
        customStyle={{
          margin: 0,
          padding: "14px 16px",
          background: "transparent",
          overflow: "visible",
        }}
        codeTagProps={{
          className: language ? `language-${label}` : undefined,
        }}
        lineNumberStyle={{
          minWidth: "2.6em",
          paddingRight: "1.1em",
          marginRight: "1em",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          color: "rgba(199, 213, 234, 0.42)",
          userSelect: "none",
        }}
        lineNumberContainerStyle={{
          float: "left",
        }}
        PreTag="div"
        className="code-block-highlight"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
