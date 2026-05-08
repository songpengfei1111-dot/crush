import type { Message } from "../types";
import { renderMessageContent } from "../utils/messageParts";

type MessagesPaneProps = {
  messages: Message[];
};

export function MessagesPane(props: MessagesPaneProps) {
  const { messages } = props;

  return (
    <div className="messages">
      {messages.map((message) => (
        <div key={message.id} className="msg">
          <div className="role">{message.role}</div>
          <pre>{renderMessageContent(message.parts)}</pre>
        </div>
      ))}
    </div>
  );
}
