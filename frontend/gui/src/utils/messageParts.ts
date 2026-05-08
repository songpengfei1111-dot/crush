import type { Message, MessagePart, ToolCallPart, ToolResultPart } from "../shared/types";

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
  return toolCalls(parts).length;
}

export function toolResultCount(parts: MessagePart[] = []): number {
  return toolResults(parts).length;
}

export function toolCalls(parts: MessagePart[] = []): ToolCallPart[] {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "tool_call" }> => part.type === "tool_call")
    .map((part) => part.data);
}

export function toolResults(parts: MessagePart[] = []): ToolResultPart[] {
  return parts
    .filter((part): part is Extract<MessagePart, { type: "tool_result" }> => part.type === "tool_result")
    .map((part) => part.data);
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

export function buildToolResultMap(messages: Message[]): Map<string, ToolResultPart> {
  const resultsByCallID = new Map<string, ToolResultPart>();
  for (const message of messages) {
    for (const result of toolResults(message.parts)) {
      resultsByCallID.set(result.tool_call_id, result);
    }
  }
  return resultsByCallID;
}

export function shortenToolPayload(input: string, maxLength = 180): string {
  const normalized = input.trim();
  if (!normalized) {
    return "";
  }

  const summarizedJSON = summarizeJSONPayload(normalized);
  const source = summarizedJSON || collapseWhitespace(normalized);
  if (source.length <= maxLength) {
    return source;
  }
  return `${source.slice(0, maxLength - 1).trimEnd()}...`;
}

export function formatToolPayload(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return "";
  }

  const parsed = parseJSON(normalized);
  if (parsed === undefined) {
    return normalized;
  }

  return JSON.stringify(parsed, null, 2);
}

function summarizeJSONPayload(input: string): string {
  const parsed = parseJSON(input);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    return "";
  }

  const entries = Object.entries(parsed)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${summarizeJSONValue(value)}`);

  return entries.join(" · ");
}

function summarizeJSONValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.length}]`;
  }
  if (value && typeof value === "object") {
    return "{...}";
  }
  return "null";
}

function parseJSON(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return undefined;
  }
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function renderMessageContent(parts: MessagePart[]): string {
  const text = firstText(parts);
  const thinking = reasoningText(parts);
  return text || (thinking ? `[thinking]\n${thinking}` : JSON.stringify(parts, null, 2));
}
