import { useEffect, useMemo, useRef, useState } from "react";

import type { Message } from "../shared/types";
import {
  finishPart,
  firstText,
  hasFinishedReasoning,
  reasoningText,
  toolCallCount,
  toolResultCount,
} from "../utils/messageParts";

type MessagesPaneProps = {
  messages: Message[];
  sessionID: string;
};

export function MessagesPane(props: MessagesPaneProps) {
  const { messages, sessionID } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});

  function scrollToBottom() {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }

  function handleScroll() {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isNearBottom = distanceFromBottom < 24;
    setStickToBottom(isNearBottom);
    if (isNearBottom) {
      setShowJumpToLatest(false);
    }
  }

  useEffect(() => {
    previousMessageCountRef.current = 0;
    setStickToBottom(true);
    setShowJumpToLatest(false);
    setExpandedThinking({});
  }, [sessionID]);

  useEffect(() => {
    const receivedNewMessages = messages.length > previousMessageCountRef.current;

    if (stickToBottom) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    } else if (receivedNewMessages) {
      setShowJumpToLatest(true);
    }

    previousMessageCountRef.current = messages.length;
  }, [messages, stickToBottom]);

  function toggleThinking(messageID: string, nextOpen: boolean) {
    setExpandedThinking((prev) => ({
      ...prev,
      [messageID]: nextOpen,
    }));
  }

  return (
    <div className="messages-wrap">
      <div ref={containerRef} className="messages" onScroll={handleScroll}>
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            thinkingExpanded={expandedThinking[message.id]}
            onToggleThinking={(nextOpen) => toggleThinking(message.id, nextOpen)}
          />
        ))}
      </div>
      {showJumpToLatest ? (
        <button
          className="jump-latest"
          onClick={() => {
            scrollToBottom();
            setStickToBottom(true);
            setShowJumpToLatest(false);
          }}
        >
          有新消息，跳转到底部
        </button>
      ) : null}
    </div>
  );
}

type MessageCardProps = {
  message: Message;
  thinkingExpanded?: boolean;
  onToggleThinking: (nextOpen: boolean) => void;
};

function MessageCard(props: MessageCardProps) {
  const { message, thinkingExpanded, onToggleThinking } = props;
  const text = useMemo(() => firstText(message.parts), [message.parts]);
  const thinking = useMemo(() => reasoningText(message.parts), [message.parts]);
  const finish = useMemo(() => finishPart(message.parts), [message.parts]);
  const toolCalls = useMemo(() => toolCallCount(message.parts), [message.parts]);
  const toolResults = useMemo(() => toolResultCount(message.parts), [message.parts]);
  const reasoningFinished = useMemo(() => hasFinishedReasoning(message.parts), [message.parts]);

  const defaultThinkingOpen = !reasoningFinished || !text;
  const showThinking = Boolean(thinking);
  const isThinkingOpen = thinkingExpanded ?? defaultThinkingOpen;
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";

  return (
    <div className={`msg-row${isUser ? " user" : isAssistant ? " assistant" : ""}`}>
      <div
        className={[
          "msg",
          isUser ? "user-bubble" : "",
          isAssistant ? "assistant-bubble" : "",
          isTool ? "tool-bubble" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="role">{message.role}</div>

        {showThinking ? (
          <details
            className="thinking-block"
            open={isThinkingOpen}
            onToggle={(event) => onToggleThinking((event.currentTarget as HTMLDetailsElement).open)}
          >
            <summary>
              {reasoningFinished ? "Thought" : "thinking..."}
            </summary>
            <pre>{thinking}</pre>
          </details>
        ) : null}

        {text ? <pre>{text}</pre> : null}

        {toolCalls > 0 || toolResults > 0 ? (
          <div className="message-meta muted">
            {toolCalls > 0 ? `tool Use ${toolCalls}` : ""}
            {toolCalls > 0 && toolResults > 0 ? " · " : ""}
            {toolResults > 0 ? `tool Result ${toolResults}` : ""}
          </div>
        ) : null}

        {finish?.message || finish?.details ? (
          <div className={`message-finish${finish.reason === "error" ? " error" : ""}`}>
            {finish.message ? <div>{finish.message}</div> : null}
            {finish.details ? <div className="muted">{finish.details}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
