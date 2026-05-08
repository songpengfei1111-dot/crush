import type { MessagePart } from "../shared/types";

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

export function toolCallCount(parts: MessagePart[] = []): number {
  return parts.filter((part): part is Extract<MessagePart, { type: "tool_call" }> => part.type === "tool_call").length;
}

export function toolResultCount(parts: MessagePart[] = []): number {
  return parts.filter((part): part is Extract<MessagePart, { type: "tool_result" }> => part.type === "tool_result").length;
}

export function finishPart(parts: MessagePart[] = []) {
  return parts.find((part): part is Extract<MessagePart, { type: "finish" }> => part.type === "finish")?.data;
}

export function hasFinishedReasoning(parts: MessagePart[] = []): boolean {
  return parts.some(
    (part): part is Extract<MessagePart, { type: "reasoning" }> =>
      part.type === "reasoning" && typeof part.data.finished_at === "number" && part.data.finished_at > 0,
  );
}

export function renderMessageContent(parts: MessagePart[]): string {
  const text = firstText(parts);
  const thinking = reasoningText(parts);
  return text || (thinking ? `[thinking]\n${thinking}` : JSON.stringify(parts, null, 2));
}
