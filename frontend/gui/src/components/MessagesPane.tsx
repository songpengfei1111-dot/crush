import { useEffect, useRef, useState } from "react";

import type { Message } from "../types";
import { renderMessageContent } from "../utils/messageParts";

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

  return (
    <div className="messages-wrap">
      <div ref={containerRef} className="messages" onScroll={handleScroll}>
        {messages.map((message) => (
          <div key={message.id} className="msg">
            <div className="role">{message.role}</div>
            <pre>{renderMessageContent(message.parts)}</pre>
          </div>
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
