import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { MermaidBlock } from "./MermaidBlock";

type MessageMarkdownProps = {
  content: string;
  className?: string;
};

export function MessageMarkdown(props: MessageMarkdownProps) {
  const { content, className } = props;

  if (!content.trim()) {
    return null;
  }

  return (
    <div className={["message-markdown", className].filter(Boolean).join(" ")}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a(anchorProps) {
            return <a {...anchorProps} target="_blank" rel="noreferrer" />;
          },
          code(codeProps) {
            const { className: codeClassName, children, ...rest } = codeProps;
            const value = String(children).replace(/\n$/, "");
            const isBlock = Boolean(codeClassName);
            const language = codeClassName?.replace(/^language-/, "").trim().toLowerCase();

            if (isBlock) {
              if (language === "mermaid") {
                return <MermaidBlock chart={value} />;
              }

              return (
                <pre className="message-markdown-pre">
                  <code className={codeClassName} {...rest}>
                    {value}
                  </code>
                </pre>
              );
            }

            return (
              <code className="message-markdown-inline-code" {...rest}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
