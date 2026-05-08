import type { MessagePart } from "../types";

export function firstText(parts: MessagePart[] = []): string {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "text" }> => part.type === "text")
    .map((part) => part.data.text)
    .join("\n");
}

export function reasoningText(parts: MessagePart[] = []): string {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "reasoning" }> => part.type === "reasoning")
    .map((part) => part.data.thinking)
    .filter(Boolean)
    .join("\n");
}

export function renderMessageContent(parts: MessagePart[]): string {
  const text = firstText(parts);
  const thinking = reasoningText(parts);
  return text || (thinking ? `[thinking]\n${thinking}` : JSON.stringify(parts, null, 2));
}
