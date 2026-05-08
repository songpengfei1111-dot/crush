import { useEffect, useState } from "react";

import type { BranchMeta, Session } from "../shared/types";

type SessionsPaneProps = {
  sessions: Session[];
  branchMetaBySessionID: Record<string, BranchMeta>;
  currentSessionID: string;
  busySessionID: string;
  onCreateSession: () => void;
  onSelectSession: (sessionID: string) => void;
  onRenameSession: (sessionID: string, title: string) => void;
  onDeleteSession: (sessionID: string) => void;
  onSummarizeSession: (sessionID: string) => void;
};

type SessionActionIconProps = {
  kind: "rename" | "summarize" | "delete";
};

type SessionTreeNode = {
  session: Session;
  children: SessionTreeNode[];
};

function SessionActionIcon(props: SessionActionIconProps) {
  const { kind } = props;

  if (kind === "rename") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M11.8 1.8a1.5 1.5 0 0 1 2.1 2.1l-7 7-3.4.6.6-3.4 7-7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.4 3.2 12.8 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "summarize") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 4.5h10M3 8h7M3 11.5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3.5 4.5h9m-7.8 0 .6 8h5.4l.6-8M6.2 4.5V3.3c0-.4.3-.8.8-.8H9c.5 0 .8.4.8.8v1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) {
    return "刚刚";
  }

  const diffSeconds = Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
  if (diffSeconds < 60) {
    return "刚刚";
  }
  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)} 分钟前`;
  }
  if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)} 小时前`;
  }
  return `${Math.floor(diffSeconds / 86400)} 天前`;
}

function buildSessionTree(
  sessions: Session[],
  branchMetaBySessionID: Record<string, BranchMeta>,
): SessionTreeNode[] {
  const nodeByID = new Map<string, SessionTreeNode>();
  for (const session of sessions) {
    nodeByID.set(session.id, {
      session,
      children: [],
    });
  }

  const roots: SessionTreeNode[] = [];
  for (const session of sessions) {
    const node = nodeByID.get(session.id);
    if (!node) {
      continue;
    }
    const meta = branchMetaBySessionID[session.id];
    if (!meta || !meta.parentSessionID) {
      roots.push(node);
      continue;
    }
    const parent = nodeByID.get(meta.parentSessionID);
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  return roots
}

export function SessionsPane(props: SessionsPaneProps) {
  const {
    sessions,
    branchMetaBySessionID,
    currentSessionID,
    busySessionID,
    onCreateSession,
    onSelectSession,
    onRenameSession,
    onDeleteSession,
    onSummarizeSession,
  } = props;

  const [editingSessionID, setEditingSessionID] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    if (!editingSessionID) {
      return;
    }
    const existing = sessions.find((session) => session.id === editingSessionID);
    if (!existing) {
      setEditingSessionID("");
      setDraftTitle("");
    }
  }, [editingSessionID, sessions]);

  const roots = buildSessionTree(sessions, branchMetaBySessionID);

  return (
    <aside className="sidebar">
      <div className="sidebar-actions">
        <button onClick={onCreateSession}>新建 Session</button>
      </div>
      <div className="sessions-list">
        {roots.map((node) => (
          <SessionTreeItem
            key={node.session.id}
            node={node}
            depth={0}
            branchMetaBySessionID={branchMetaBySessionID}
            currentSessionID={currentSessionID}
            busySessionID={busySessionID}
            editingSessionID={editingSessionID}
            draftTitle={draftTitle}
            onChangeDraftTitle={setDraftTitle}
            onStartEditing={(session) => {
              setEditingSessionID(session.id)
              setDraftTitle(session.title || "Untitled Session")
            }}
            onStopEditing={() => {
              setEditingSessionID("")
              setDraftTitle("")
            }}
            onSelectSession={onSelectSession}
            onRenameSession={onRenameSession}
            onDeleteSession={onDeleteSession}
            onSummarizeSession={onSummarizeSession}
          />
        ))}
      </div>
    </aside>
  );
}

type SessionTreeItemProps = {
  node: SessionTreeNode;
  depth: number;
  branchMetaBySessionID: Record<string, BranchMeta>;
  currentSessionID: string;
  busySessionID: string;
  editingSessionID: string;
  draftTitle: string;
  onChangeDraftTitle: (title: string) => void;
  onStartEditing: (session: Session) => void;
  onStopEditing: () => void;
  onSelectSession: (sessionID: string) => void;
  onRenameSession: (sessionID: string, title: string) => void;
  onDeleteSession: (sessionID: string) => void;
  onSummarizeSession: (sessionID: string) => void;
};

function SessionTreeItem(props: SessionTreeItemProps) {
  const {
    node,
    depth,
    branchMetaBySessionID,
    currentSessionID,
    busySessionID,
    editingSessionID,
    draftTitle,
    onChangeDraftTitle,
    onStartEditing,
    onStopEditing,
    onSelectSession,
    onRenameSession,
    onDeleteSession,
    onSummarizeSession,
  } = props;
  const { session, children } = node;
  const branchMeta = branchMetaBySessionID[session.id];
  const sessionKindLabel = branchMeta ? "分支" : session.parent_session_id ? "子会话" : "主会话";

  return (
    <div className={`session-tree depth-${depth}`}>
      <div
        className={`session${session.id === currentSessionID ? " active" : ""}${branchMeta ? " branch-session" : ""}`}
        style={{ marginLeft: `${depth * 18}px` }}
        onClick={() => onSelectSession(session.id)}
      >
        {editingSessionID === session.id ? (
          <div
            className="session-rename-form"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <input
              autoFocus
              value={draftTitle}
              onChange={(event) => onChangeDraftTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  const nextTitle = draftTitle.trim() || "Untitled Session";
                  void onRenameSession(session.id, nextTitle);
                  onStopEditing();
                }
                if (event.key === "Escape") {
                  onStopEditing();
                }
              }}
            />
            <div className="session-rename-actions">
              <button
                className="secondary"
                onClick={() => {
                  const nextTitle = draftTitle.trim() || "Untitled Session";
                  void onRenameSession(session.id, nextTitle);
                  onStopEditing();
                }}
              >
                保存
              </button>
              <button className="secondary" onClick={onStopEditing}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="session-title-row">
              <div className="session-title-main">
                <div className="session-title">{session.title || "Untitled Session"}</div>
                {branchMeta ? <span className="session-badge branch">分支</span> : null}
                {session.id === busySessionID ? <span className="session-badge running">运行中</span> : null}
              </div>
              <div className="session-title-actions">
                <button
                  className="secondary session-icon-button"
                  type="button"
                  aria-label="重命名 Session"
                  title="重命名"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEditing(session);
                  }}
                >
                  <SessionActionIcon kind="rename" />
                </button>
                <button
                  className="secondary session-icon-button"
                  type="button"
                  aria-label="生成摘要"
                  title="摘要"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onSummarizeSession(session.id);
                  }}
                >
                  <SessionActionIcon kind="summarize" />
                </button>
                <button
                  className="danger session-icon-button"
                  type="button"
                  aria-label="删除 Session"
                  title="删除"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onDeleteSession(session.id);
                  }}
                >
                  <SessionActionIcon kind="delete" />
                </button>
              </div>
            </div>
          </>
        )}
        <div className="session-meta">
          <span>{session.message_count} 条消息</span>
          <span>{formatRelativeTime(session.updated_at)}</span>
        </div>
        <div className="session-meta muted">
          <span>{sessionKindLabel}</span>
          <span>{session.cost.toFixed(4)} USD</span>
        </div>
        <div className="session-meta muted">
          <span>{session.id.slice(0, 8)}</span>
          {branchMeta ? <span>fork</span> : null}
        </div>
      </div>
      {children.length > 0 ? (
        <div className="session-children">
          {children.map((child) => (
            <SessionTreeItem
              key={child.session.id}
              node={child}
              depth={depth + 1}
              branchMetaBySessionID={branchMetaBySessionID}
              currentSessionID={currentSessionID}
              busySessionID={busySessionID}
              editingSessionID={editingSessionID}
              draftTitle={draftTitle}
              onChangeDraftTitle={onChangeDraftTitle}
              onStartEditing={onStartEditing}
              onStopEditing={onStopEditing}
              onSelectSession={onSelectSession}
              onRenameSession={onRenameSession}
              onDeleteSession={onDeleteSession}
              onSummarizeSession={onSummarizeSession}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
