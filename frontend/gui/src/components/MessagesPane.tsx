import { useEffect, useMemo, useRef, useState } from "react";

import { MessageMarkdown } from "../features/message/MessageMarkdown";
import type { Message } from "../shared/types";
import { copyTextToClipboard } from "../utils/clipboard";
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
  isBusy: boolean;
  onRevokeRound: (messageID: string) => void;
};

export function MessagesPane(props: MessagesPaneProps) {
  const { messages, sessionID, isBusy, onRevokeRound } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const copyResetTimerRef = useRef<number | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [copiedMessageID, setCopiedMessageID] = useState("");

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
    setCopiedMessageID("");
  }, [sessionID]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current !== null) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

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

  const latestUserMessageID = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") {
        return messages[i].id;
      }
    }
    return "";
  }, [messages]);

  async function handleCopyMessage(messageID: string, value: string) {
    if (!value.trim()) {
      return;
    }

    await copyTextToClipboard(value);
    setCopiedMessageID(messageID);
    if (copyResetTimerRef.current !== null) {
      window.clearTimeout(copyResetTimerRef.current);
    }
    copyResetTimerRef.current = window.setTimeout(() => {
      setCopiedMessageID((current) => (current === messageID ? "" : current));
      copyResetTimerRef.current = null;
    }, 1500);
  }

  return (
    <div className="messages-wrap">
      <div ref={containerRef} className="messages" onScroll={handleScroll}>
        {messages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            copied={copiedMessageID === message.id}
            canRevoke={message.role === "user" && !isBusy && message.id === latestUserMessageID}
            onCopyRawText={(value) => void handleCopyMessage(message.id, value)}
            onRevokeRound={() => onRevokeRound(message.id)}
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
  copied: boolean;
  canRevoke: boolean;
  onCopyRawText: (value: string) => void;
  onRevokeRound: () => void;
  thinkingExpanded?: boolean;
  onToggleThinking: (nextOpen: boolean) => void;
};

function MessageCard(props: MessageCardProps) {
  const { message, copied, canRevoke, onCopyRawText, onRevokeRound, thinkingExpanded, onToggleThinking } = props;
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

  if (isUser) {
    return (
      <div className="msg-row user">
        <div className="user-message-stack">
          <div className="user-message-meta">
            <div className="role external-role">USER</div>
          </div>
          <div className="msg user-bubble">
            {text ? <MessageMarkdown content={text} className="user-markdown" /> : null}
          </div>
          {text ? (
            <div className="message-toolbar message-toolbar-user">
              <button className="message-toolbar-button secondary" onClick={() => onCopyRawText(text)}>
                {copied ? "Copied" : "Copy"}
              </button>
              {canRevoke ? (
                <button className="message-toolbar-button secondary" onClick={onRevokeRound}>
                  撤回
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

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

        {text ? (
          <MessageMarkdown
            content={text}
            className={isAssistant ? "assistant-markdown" : isUser ? "user-markdown" : undefined}
          />
        ) : null}

        {isAssistant && text ? (
          <div className="message-toolbar">
            <button className="message-toolbar-button secondary" onClick={() => onCopyRawText(text)}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        ) : null}

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
