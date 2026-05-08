import { useEffect, useMemo, useState } from "react";

import type {
  AgentInfo,
  BootstrapResponse,
  EventEnvelope,
  Message,
  MessagePart,
  PermissionNotification,
  PermissionRequest,
  Session,
} from "./types";

type AppState = {
  sessions: Session[];
  messages: Message[];
  currentSessionID: string;
  permissions: PermissionRequest[];
  agent: AgentInfo;
};

const initialState: AppState = {
  sessions: [],
  messages: [],
  currentSessionID: "",
  permissions: [],
  agent: {
    is_busy: false,
    is_ready: false,
    model: {},
    model_cfg: {},
  },
};

function firstText(parts: MessagePart[] = []): string {
  return parts
    .filter((p): p is MessagePart & { text: string } => typeof p.text === "string")
    .map((p) => p.text)
    .join("\n");
}

function reasonText(parts: MessagePart[] = []): string {
  return parts
    .filter((p): p is MessagePart & { thinking: string } => typeof p.thinking === "string" && !!p.thinking)
    .map((p) => p.thinking)
    .join("\n");
}

function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  const next = [...items];
  const idx = next.findIndex((v) => v.id === item.id);
  if (idx === -1) {
    next.push(item);
  } else {
    next[idx] = item;
  }
  return next;
}

async function requestJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const rsp = await fetch(input, init);
  if (!rsp.ok) {
    throw new Error(`request failed: ${rsp.status}`);
  }
  return rsp.json() as Promise<T>;
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  const currentSession = useMemo(
    () => state.sessions.find((s) => s.id === state.currentSessionID),
    [state.currentSessionID, state.sessions],
  );

  const currentMessages = useMemo(
    () => state.messages.filter((m) => m.session_id === state.currentSessionID),
    [state.currentSessionID, state.messages],
  );

  useEffect(() => {
    let es: EventSource | undefined;

    async function bootstrap() {
      const data = await requestJSON<BootstrapResponse>("/api/bootstrap");
      setState((prev) => ({
        ...prev,
        sessions: data.sessions || [],
        currentSessionID: data.current_session_id || "",
        messages: data.messages || [],
        permissions: data.permissions || [],
        agent: data.agent || prev.agent,
      }));

      es = new EventSource("/api/events");
      es.onmessage = (ev: MessageEvent<string>) => {
        const data = JSON.parse(ev.data) as
          | EventEnvelope<Message>
          | EventEnvelope<Session>
          | EventEnvelope<PermissionRequest>
          | EventEnvelope<PermissionNotification>;

        setState((prev) => {
          switch (data.type) {
            case "message":
              return {
                ...prev,
                messages: upsertById(prev.messages, data.payload.payload as Message),
              };
            case "session": {
              const nextSessions = upsertById(prev.sessions, data.payload.payload as Session).sort(
                (a, b) => (b.updated_at || 0) - (a.updated_at || 0),
              );
              return {
                ...prev,
                sessions: nextSessions,
                currentSessionID: prev.currentSessionID || (data.payload.payload as Session).id,
              };
            }
            case "permission_request":
              return {
                ...prev,
                permissions: upsertById(prev.permissions, data.payload.payload as PermissionRequest),
              };
            case "permission_notification": {
              const notification = data.payload.payload as PermissionNotification;
              return {
                ...prev,
                permissions: prev.permissions.filter((p) => p.tool_call_id !== notification.tool_call_id),
              };
            }
            case "agent_event":
              return {
                ...prev,
                agent: { ...prev.agent, is_busy: false },
              };
            default:
              return prev;
          }
        });
      };
    }

    void bootstrap();

    return () => {
      es?.close();
    };
  }, []);

  async function loadMessages(sessionID: string): Promise<void> {
    if (!sessionID) {
      return;
    }
    const messages = await requestJSON<Message[]>(`/api/sessions/${encodeURIComponent(sessionID)}/messages`);
    setState((prev) => ({ ...prev, messages }));
  }

  async function sendMessage(): Promise<void> {
    const promptEl = document.getElementById("prompt") as HTMLTextAreaElement | null;
    const prompt = promptEl?.value.trim() ?? "";
    if (!prompt || !state.currentSessionID) {
      return;
    }
    await requestJSON<void>(`/api/sessions/${encodeURIComponent(state.currentSessionID)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (promptEl) {
      promptEl.value = "";
    }
  }

  async function createSession(): Promise<void> {
    const title = window.prompt("Session 标题", "Untitled Session") || "Untitled Session";
    const session = await requestJSON<Session>("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setState((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      currentSessionID: session.id,
      messages: [],
    }));
  }

  async function cancelRun(): Promise<void> {
    if (!state.currentSessionID) {
      return;
    }
    await requestJSON<void>(`/api/sessions/${encodeURIComponent(state.currentSessionID)}/cancel`, {
      method: "POST",
    });
  }

  async function decidePermission(permission: PermissionRequest, allow: boolean, persistent: boolean): Promise<void> {
    const url = allow ? "/api/permissions/allow" : "/api/permissions/deny";
    await requestJSON<void>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission, persistent }),
    });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-actions">
          <button onClick={() => void createSession()}>新建 Session</button>
        </div>
        <div>
          {state.sessions.map((session) => (
            <div
              key={session.id}
              className={`session${session.id === state.currentSessionID ? " active" : ""}`}
              onClick={() => {
                setState((prev) => ({ ...prev, currentSessionID: session.id }));
                void loadMessages(session.id);
              }}
            >
              <div>{session.title || "Untitled Session"}</div>
              <div className="muted">{session.id.slice(0, 8)}</div>
            </div>
          ))}
        </div>
      </aside>
      <main className="main">
        <div className="toolbar">
          <strong>{currentSession ? currentSession.title : "Crush GUI"}</strong>
          <span className="muted">{state.agent.is_busy ? "运行中" : "空闲"}</span>
          <div className="spacer" />
          <button className="danger" onClick={() => void cancelRun()}>
            取消
          </button>
        </div>
        <div className="messages">
          {currentMessages.map((message) => {
            const text = firstText(message.parts);
            const thinking = reasonText(message.parts);
            const content = text || (thinking ? `[thinking]\n${thinking}` : JSON.stringify(message.parts, null, 2));
            return (
              <div key={message.id} className="msg">
                <div className="role">{message.role}</div>
                <pre>{content}</pre>
              </div>
            );
          })}
        </div>
        <div className="composer">
          <textarea id="prompt" placeholder="输入你的 prompt..." />
          <button onClick={() => void sendMessage()}>发送</button>
          <button className="secondary" onClick={() => void loadMessages(state.currentSessionID)}>
            刷新
          </button>
        </div>
        <div className="permissions">
          <strong>权限请求</strong>
          <div className="permissions-list">
            {state.permissions.map((req) => (
              <div key={req.id} className="perm">
                <div>
                  <strong>{req.tool_name}</strong>
                </div>
                <div className="muted">{req.description || ""}</div>
                <div className="muted">{req.path || ""}</div>
                <div className="perm-actions">
                  <button onClick={() => void decidePermission(req, true, false)}>允许</button>
                  <button className="secondary" onClick={() => void decidePermission(req, true, true)}>
                    永久允许
                  </button>
                  <button className="danger" onClick={() => void decidePermission(req, false, false)}>
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
