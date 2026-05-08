import { useEffect, useMemo, useRef, useState } from "react";

import { MessageMarkdown } from "../features/message/MessageMarkdown";
import { ToolInvocationCard } from "../features/message/ToolInvocationCard";
import type { Message, ToolResultPart } from "../shared/types";
import { copyTextToClipboard } from "../utils/clipboard";
import {
  buildToolResultMap,
  finishPart,
  firstText,
  hasFinishedReasoning,
  reasoningText,
  toolCalls,
  toolResults,
} from "../utils/messageParts";

type MessagesPaneProps = {
  messages: Message[];
  sessionID: string;
  isBusy: boolean;
  onForkRound: (messageID: string) => void;
  onRevokeRound: (messageID: string) => void;
};

export function MessagesPane(props: MessagesPaneProps) {
  const { messages, sessionID, isBusy, onForkRound, onRevokeRound } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const copyResetTimerRef = useRef<number | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [copiedMessageID, setCopiedMessageID] = useState("");
  const [expandedToolInputs, setExpandedToolInputs] = useState<Record<string, boolean>>({});
  const [expandedToolOutputs, setExpandedToolOutputs] = useState<Record<string, boolean>>({});

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
    setExpandedToolInputs({});
    setExpandedToolOutputs({});
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

  const toolResultsByCallID = useMemo(() => buildToolResultMap(messages), [messages]);

  const visibleMessages = useMemo(() => {
    const matchedResultIDs = new Set<string>();
    for (const message of messages) {
      for (const call of toolCalls(message.parts)) {
        if (toolResultsByCallID.has(call.id)) {
          matchedResultIDs.add(call.id);
        }
      }
    }

    return messages.filter((message) => {
      if (message.role !== "tool") {
        return true;
      }

      const results = toolResults(message.parts);
      if (results.length === 0) {
        return true;
      }

      return results.some((result) => !matchedResultIDs.has(result.tool_call_id));
    });
  }, [messages, toolResultsByCallID]);

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
        {visibleMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            toolResultsByCallID={toolResultsByCallID}
            copied={copiedMessageID === message.id}
            canRevoke={message.role === "user" && !isBusy && message.id === latestUserMessageID}
            onCopyRawText={(value) => void handleCopyMessage(message.id, value)}
            onForkRound={() => onForkRound(message.id)}
            onRevokeRound={() => onRevokeRound(message.id)}
            thinkingExpanded={expandedThinking[message.id]}
            onToggleThinking={(nextOpen) => toggleThinking(message.id, nextOpen)}
            expandedToolInputIDs={expandedToolInputs}
            expandedToolOutputIDs={expandedToolOutputs}
            onToggleToolInput={(toolCallID, nextOpen) =>
              setExpandedToolInputs((prev) => ({
                ...prev,
                [toolCallID]: nextOpen,
              }))
            }
            onToggleToolOutput={(toolCallID, nextOpen) =>
              setExpandedToolOutputs((prev) => ({
                ...prev,
                [toolCallID]: nextOpen,
              }))
            }
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
  toolResultsByCallID: Map<string, ToolResultPart>;
  copied: boolean;
  canRevoke: boolean;
  onCopyRawText: (value: string) => void;
  onForkRound: () => void;
  onRevokeRound: () => void;
  thinkingExpanded?: boolean;
  onToggleThinking: (nextOpen: boolean) => void;
  expandedToolInputIDs: Record<string, boolean>;
  expandedToolOutputIDs: Record<string, boolean>;
  onToggleToolInput: (toolCallID: string, nextOpen: boolean) => void;
  onToggleToolOutput: (toolCallID: string, nextOpen: boolean) => void;
};

function MessageCard(props: MessageCardProps) {
  const {
    message,
    toolResultsByCallID,
    copied,
    canRevoke,
    onCopyRawText,
    onForkRound,
    onRevokeRound,
    thinkingExpanded,
    onToggleThinking,
    expandedToolInputIDs,
    expandedToolOutputIDs,
    onToggleToolInput,
    onToggleToolOutput,
  } = props;
  const text = useMemo(() => firstText(message.parts), [message.parts]);
  const thinking = useMemo(() => reasoningText(message.parts), [message.parts]);
  const finish = useMemo(() => finishPart(message.parts), [message.parts]);
  const messageToolCalls = useMemo(() => toolCalls(message.parts), [message.parts]);
  const messageToolResults = useMemo(() => toolResults(message.parts), [message.parts]);
  const reasoningFinished = useMemo(() => hasFinishedReasoning(message.parts), [message.parts]);

  const defaultThinkingOpen = !reasoningFinished || !text;
  const showThinking = Boolean(thinking);
  const isThinkingOpen = thinkingExpanded ?? defaultThinkingOpen;
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isTool = message.role === "tool";
  const canFork = isAssistant && Boolean(finish && finish.reason !== "tool_use");

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

        {isAssistant && (text || canFork) ? (
          <div className="message-toolbar">
            {text ? (
              <button className="message-toolbar-button secondary" onClick={() => onCopyRawText(text)}>
                {copied ? "Copied" : "Copy"}
              </button>
            ) : null}
            {canFork ? (
              <button className="message-toolbar-button secondary" onClick={onForkRound}>
                Fork
              </button>
            ) : null}
          </div>
        ) : null}

        {messageToolCalls.length > 0 ? (
          <div className="tool-invocation-list">
            {messageToolCalls.map((call) => (
              <ToolInvocationCard
                key={call.id}
                call={call}
                result={toolResultsByCallID.get(call.id)}
                inputExpanded={Boolean(expandedToolInputIDs[call.id])}
                outputExpanded={Boolean(expandedToolOutputIDs[call.id])}
                onToggleInput={(nextOpen) => onToggleToolInput(call.id, nextOpen)}
                onToggleOutput={(nextOpen) => onToggleToolOutput(call.id, nextOpen)}
              />
            ))}
          </div>
        ) : null}

        {isTool && messageToolResults.length > 0 ? (
          <div className="tool-invocation-list">
            {messageToolResults.map((result) => (
              <ToolInvocationCard
                key={result.tool_call_id}
                result={result}
                outputExpanded={Boolean(expandedToolOutputIDs[result.tool_call_id])}
                onToggleOutput={(nextOpen) => onToggleToolOutput(result.tool_call_id, nextOpen)}
              />
            ))}
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
