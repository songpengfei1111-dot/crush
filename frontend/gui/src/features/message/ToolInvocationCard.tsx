import { useMemo } from "react";

import type { ToolCallPart, ToolResultPart } from "../../shared/types";
import { formatToolPayload, shortenToolPayload } from "../../utils/messageParts";

type ToolInvocationCardProps = {
  call?: ToolCallPart;
  result?: ToolResultPart;
  inputExpanded?: boolean;
  outputExpanded?: boolean;
  onToggleInput?: (nextOpen: boolean) => void;
  onToggleOutput?: (nextOpen: boolean) => void;
};

export function ToolInvocationCard(props: ToolInvocationCardProps) {
  const toolName = props.call?.name || props.result?.name || "tool";
  if (toolName === "todos") {
    return <TodosToolCard {...props} />;
  }

  return <GenericToolInvocationCard {...props} />;
}

function GenericToolInvocationCard(props: ToolInvocationCardProps) {
  const { call, result, inputExpanded, outputExpanded, onToggleInput, onToggleOutput } = props;
  const toolName = call?.name || result?.name || "tool";
  const inputPreview = useMemo(() => shortenToolPayload(call?.input || ""), [call?.input]);
  const fullInput = useMemo(() => formatToolPayload(call?.input || ""), [call?.input]);
  const outputPreview = useMemo(() => shortenToolPayload(result?.content || "", 240), [result?.content]);
  const fullOutput = useMemo(() => formatToolPayload(result?.content || ""), [result?.content]);
  const metadata = useMemo(() => formatToolPayload(result?.metadata || ""), [result?.metadata]);
  const isError = Boolean(result?.is_error);
  const isPending = Boolean(call) && !result;
  const statusLabel = isError ? "失败" : isPending ? "执行中" : result ? "完成" : call?.finished ? "已发送" : "准备中";
  const durationLabel = isPending ? "耗时 进行中" : "耗时 --";
  const hasInput = Boolean(call?.input?.trim());
  const hasOutput = Boolean(result?.content?.trim());
  const expanded = Boolean(inputExpanded || outputExpanded);
  const summary = isError
    ? outputPreview || "工具执行失败"
    : outputPreview || inputPreview || (isPending ? "等待工具返回结果" : "已发送工具调用");

  function toggleExpanded(nextOpen: boolean) {
    onToggleInput?.(nextOpen);
    onToggleOutput?.(nextOpen);
  }

  return (
    <section className={`tool-invocation-card${isError ? " error" : ""}`}>
      <button
        type="button"
        className="tool-invocation-header"
        onClick={() => toggleExpanded(!expanded)}
      >
        <div className="tool-invocation-header-main">
          <span className="tool-invocation-icon" aria-hidden="true">
            {isError ? "!" : isPending ? "..." : ">"}
          </span>
          <div className="tool-invocation-copy">
            <div className="tool-invocation-title-row">
              <span className="tool-invocation-name">{toolName}</span>
              <span className={`tool-invocation-status${isError ? " error" : isPending ? " pending" : ""}`}>
                {statusLabel}
              </span>
            </div>
            <div className={`tool-invocation-summary${isError ? " error" : ""}`}>{summary}</div>
          </div>
        </div>
        <div className="tool-invocation-header-side">
          <span className="tool-invocation-duration">{durationLabel}</span>
          <span className={`tool-invocation-chevron${expanded ? " open" : ""}`} aria-hidden="true">
            ›
          </span>
        </div>
      </button>

      {expanded ? (
        <div className="tool-invocation-body">
          {hasInput ? (
            <ToolInvocationSection title="Input" value={fullInput} />
          ) : null}

          {hasOutput ? (
            <ToolInvocationSection title={isError ? "Error" : "Result"} value={fullOutput} tone={isError ? "error" : "default"} />
          ) : result ? (
            <div className={`tool-invocation-empty${isError ? " error" : ""}`}>
              {isError ? "工具执行失败，但未返回错误文本。" : "工具已完成，但没有返回文本内容。"}
            </div>
          ) : null}

          {metadata ? (
            <details className="tool-invocation-meta">
              <summary>Metadata</summary>
              <pre>{metadata}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

type TodoToolItem = {
  content: string;
  status: "pending" | "in_progress" | "completed";
  active_form?: string;
};

type TodosToolInput = {
  todos?: TodoToolItem[];
};

type TodosToolMetadata = {
  is_new?: boolean;
  todos?: TodoToolItem[];
  just_completed?: string[];
  just_started?: string;
  completed?: number;
  total?: number;
};

function TodosToolCard(props: ToolInvocationCardProps) {
  const { call, result, inputExpanded, outputExpanded, onToggleInput, onToggleOutput } = props;
  const parsedInput = useMemo(() => parseToolJSON<TodosToolInput>(call?.input), [call?.input]);
  const parsedMetadata = useMemo(() => parseToolJSON<TodosToolMetadata>(result?.metadata), [result?.metadata]);
  const fullInput = useMemo(() => formatToolPayload(call?.input || ""), [call?.input]);
  const fullOutput = useMemo(() => formatToolPayload(result?.content || ""), [result?.content]);
  const metadata = useMemo(() => formatToolPayload(result?.metadata || ""), [result?.metadata]);
  const outputPreview = useMemo(() => shortenToolPayload(result?.content || "", 240), [result?.content]);
  const isError = Boolean(result?.is_error);
  const isPending = Boolean(call) && !result;
  const expanded = Boolean(inputExpanded || outputExpanded);
  const sourceTodos = parsedMetadata?.todos?.length ? parsedMetadata.todos : parsedInput?.todos || [];
  const todos = useMemo(() => sortTodos(sourceTodos), [sourceTodos]);
  const completedCount = parsedMetadata?.completed ?? todos.filter((todo) => todo.status === "completed").length;
  const totalCount = parsedMetadata?.total ?? todos.length;
  const justCompleted = parsedMetadata?.just_completed ?? [];
  const justStarted = parsedMetadata?.just_started ?? "";
  const ratioLabel = totalCount > 0 ? `${completedCount}/${totalCount}` : "";
  const allCompleted = totalCount > 0 && completedCount === totalCount;
  const statusLabel = isError ? "失败" : isPending ? "执行中" : allCompleted ? "完成" : "";
  const inProgressText = getInProgressTodoText(todos);
  const summary = buildTodosSummary({
    isError,
    isPending,
    outputPreview,
    isNew: Boolean(parsedMetadata?.is_new),
    totalCount,
    justCompletedCount: justCompleted.length,
    justStarted,
    allCompleted,
    inProgressText,
  });
  const hasDebugDetails = Boolean(fullInput || fullOutput || metadata);

  function toggleExpanded(nextOpen: boolean) {
    onToggleInput?.(nextOpen);
    onToggleOutput?.(nextOpen);
  }

  return (
    <section className={`tool-invocation-card todos${isError ? " error" : ""}${allCompleted ? " complete" : ""}`}>
      <button
        type="button"
        className={`todo-tool-header${expanded ? " expanded" : ""}`}
        onClick={() => toggleExpanded(!expanded)}
      >
        <div className="todo-tool-header-main">
          <div className="todo-tool-copy">
            <div className="todo-tool-title-row">
              <span className="todo-tool-name">{ratioLabel ? `Todo ${ratioLabel}` : "Todo"}</span>
              {statusLabel ? (
                <span className={`todo-tool-status${isError ? " error" : isPending ? " pending" : ""}`}>{statusLabel}</span>
              ) : null}
            </div>
            <div className={`todo-tool-summary${isError ? " error" : ""}`}>{summary}</div>
          </div>
        </div>
        {hasDebugDetails ? (
          <span className={`tool-invocation-chevron${expanded ? " open" : ""}`} aria-hidden="true">
            ›
          </span>
        ) : null}
      </button>

      {todos.length > 0 ? (
        <div className="todo-tool-list" role="list" aria-label="Todo items">
          {todos.map((todo) => {
            const isCurrent = todo.status === "in_progress";
            const displayText = isCurrent && todo.active_form ? todo.active_form : todo.content;

            return (
              <div
                key={`${todo.status}:${todo.content}`}
                className={`todo-tool-item ${todo.status}${isCurrent ? " current" : ""}${
                  justCompleted.includes(todo.content) ? " just-completed" : ""
                }`}
                role="listitem"
              >
                <TodoStatusIcon status={todo.status} />
                <span className="todo-tool-text">{displayText}</span>
              </div>
            );
          })}
        </div>
      ) : result ? (
        <div className={`tool-invocation-empty${isError ? " error" : ""}`}>
          {isError ? outputPreview || "待办更新失败。" : "待办已更新，但没有可展示的任务。"}
        </div>
      ) : null}

      {expanded && hasDebugDetails ? (
        <div className="tool-invocation-body">
          {fullInput ? <ToolInvocationSection title="Input" value={fullInput} /> : null}
          {fullOutput ? (
            <ToolInvocationSection title={isError ? "Error" : "Result"} value={fullOutput} tone={isError ? "error" : "default"} />
          ) : null}
          {metadata ? (
            <details className="tool-invocation-meta" open>
              <summary>Metadata</summary>
              <pre>{metadata}</pre>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

type ToolInvocationSectionProps = {
  title: string;
  value: string;
  tone?: "default" | "error";
};

function ToolInvocationSection(props: ToolInvocationSectionProps) {
  const { title, value, tone = "default" } = props;

  return (
    <div className="tool-invocation-section">
      <div className="tool-invocation-section-title">{title}</div>
      <pre className={`tool-invocation-block${tone === "error" ? " error" : ""}`}>{value}</pre>
    </div>
  );
}

function buildTodosSummary(input: {
  isError: boolean;
  isPending: boolean;
  outputPreview: string;
  isNew: boolean;
  totalCount: number;
  justCompletedCount: number;
  justStarted: string;
  allCompleted: boolean;
  inProgressText: string;
}): string {
  const { isError, isPending, outputPreview, isNew, totalCount, justCompletedCount, justStarted, allCompleted, inProgressText } =
    input;

  if (isError) {
    return outputPreview || "待办更新失败";
  }

  if (isPending) {
    if (inProgressText) {
      return inProgressText;
    }
    return "等待待办结果";
  }

  if (isNew) {
    return justStarted ? `新建 ${totalCount} 项，开始第一项` : `新建 ${totalCount} 项`;
  }

  if (justCompletedCount > 0 && justStarted) {
    return `完成 ${justCompletedCount} 项，开始下一项`;
  }
  if (justCompletedCount > 0) {
    return allCompleted ? "全部完成" : `完成 ${justCompletedCount} 项`;
  }
  if (justStarted) {
    return "开始任务";
  }
  if (inProgressText) {
    return inProgressText;
  }

  return outputPreview || "待办已更新";
}

function getInProgressTodoText(todos: TodoToolItem[]): string {
  const activeTodo = todos.find((todo) => todo.status === "in_progress");
  if (!activeTodo) {
    return "";
  }
  return activeTodo.active_form || activeTodo.content;
}

function sortTodos(todos: TodoToolItem[]): TodoToolItem[] {
  return [...todos].sort((left, right) => todoStatusOrder(left.status) - todoStatusOrder(right.status));
}

function todoStatusOrder(status: TodoToolItem["status"]): number {
  switch (status) {
    case "completed":
      return 0;
    case "in_progress":
      return 1;
    default:
      return 2;
  }
}

function parseToolJSON<T>(input?: string): T | undefined {
  if (!input?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    return undefined;
  }
}

function TodoStatusIcon(props: { status: TodoToolItem["status"] }) {
  const { status } = props;

  return (
    <span className={`todo-tool-state-icon ${status}`} aria-hidden="true">
      {status === "completed" ? <span className="todo-tool-state-check">✓</span> : null}
      {status === "in_progress" ? <span className="todo-tool-state-dot" /> : null}
    </span>
  );
}
