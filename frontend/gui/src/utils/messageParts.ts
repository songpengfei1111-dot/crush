import type { MessagePart } from "../types";

export function firstText(parts: MessagePart[] = []): string {
  return parts
    .filter((part): part is MessagePart & { text: string } => typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

export function reasoningText(parts: MessagePart[] = []): string {
  return parts
    .filter(
      (part): part is MessagePart & { thinking: string } => typeof part.thinking === "string" && !!part.thinking,
    )
    .map((part) => part.thinking)
    .join("\n");
}

export function renderMessageContent(parts: MessagePart[]): string {
  const text = firstText(parts);
  const thinking = reasoningText(parts);
  return text || (thinking ? `[thinking]\n${thinking}` : JSON.stringify(parts, null, 2));
}
