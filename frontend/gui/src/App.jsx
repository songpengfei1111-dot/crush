import React, { useEffect, useMemo, useState } from "react";

const initialState = {
  sessions: [],
  messages: [],
  currentSessionID: "",
  permissions: [],
  agent: {},
};

function firstText(parts = []) {
  return parts
    .filter((p) => p && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n");
}

function reasonText(parts = []) {
  return parts
    .filter((p) => p && typeof p.thinking === "string" && p.thinking)
    .map((p) => p.thinking)
    .join("\n");
}

function upsertById(items, item) {
  const next = [...items];
  const idx = next.findIndex((v) => v.id === item.id);
  if (idx === -1) {
    next.push(item);
  } else {
    next[idx] = item;
  }
  return next;
}

export default function App() {
  const [state, setState] = useState(initialState);

  const currentSession = useMemo(
    () => state.sessions.find((s) => s.id === state.currentSessionID),
    [state.currentSessionID, state.sessions],
  );

  const currentMessages = useMemo(
    () => state.messages.filter((m) => m.session_id === state.currentSessionID),
    [state.currentSessionID, state.messages],
  );

  useEffect(() => {
    let es;

    async function bootstrap() {
      const rsp = await fetch("/api/bootstrap");
      const data = await rsp.json();
      setState((prev) => ({
        ...prev,
        sessions: data.sessions || [],
        currentSessionID: data.current_session_id || "",
        messages: data.messages || [],
        permissions: data.permissions || [],
        agent: data.agent || {},
      }));

      es = new EventSource("/api/events");
      es.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        setState((prev) => {
          switch (data.type) {
            case "message":
              return {
                ...prev,
                messages: upsertById(prev.messages, data.payload.payload),
              };
            case "session": {
              const sessions = upsertById(prev.sessions, data.payload.payload).sort(
                (a, b) => (b.updated_at || 0) - (a.updated_at || 0),
              );
              return {
                ...prev,
                sessions,
                currentSessionID: prev.currentSessionID || data.payload.payload.id,
              };
            }
            case "permission_request":
              return {
                ...prev,
                permissions: upsertById(prev.permissions, data.payload.payload),
              };
            case "permission_notification":
              return {
                ...prev,
                permissions: prev.permissions.filter(
                  (p) => p.tool_call_id !== data.payload.payload.tool_call_id,
                ),
              };
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

    bootstrap();

    return () => {
      if (es) {
        es.close();
      }
    };
  }, []);

  async function loadMessages(sessionID) {
    if (!sessionID) {
      return;
    }
    const rsp = await fetch(`/api/sessions/${encodeURIComponent(sessionID)}/messages`);
    const messages = await rsp.json();
    setState((prev) => ({ ...prev, messages }));
  }

  async function sendMessage() {
    const promptEl = document.getElementById("prompt");
    const prompt = promptEl.value.trim();
    if (!prompt || !state.currentSessionID) {
      return;
    }
    await fetch(`/api/sessions/${encodeURIComponent(state.currentSessionID)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    promptEl.value = "";
  }

  async function createSession() {
    const title = window.prompt("Session 标题", "Untitled Session") || "Untitled Session";
    const rsp = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const session = await rsp.json();
    setState((prev) => ({
      ...prev,
      sessions: [session, ...prev.sessions],
      currentSessionID: session.id,
      messages: [],
    }));
  }

  async function cancelRun() {
    if (!state.currentSessionID) {
      return;
    }
    await fetch(`/api/sessions/${encodeURIComponent(state.currentSessionID)}/cancel`, {
      method: "POST",
    });
  }

  async function decidePermission(permission, allow, persistent) {
    const url = allow ? "/api/permissions/allow" : "/api/permissions/deny";
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permission, persistent }),
    });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-actions">
          <button onClick={createSession}>新建 Session</button>
        </div>
        <div>
          {state.sessions.map((session) => (
            <div
              key={session.id}
              className={`session${session.id === state.currentSessionID ? " active" : ""}`}
              onClick={async () => {
                setState((prev) => ({ ...prev, currentSessionID: session.id }));
                await loadMessages(session.id);
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
          <span className="muted">{state.agent && state.agent.is_busy ? "运行中" : "空闲"}</span>
          <div className="spacer" />
          <button className="danger" onClick={cancelRun}>
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
          <button onClick={sendMessage}>发送</button>
          <button className="secondary" onClick={() => loadMessages(state.currentSessionID)}>
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
                  <button onClick={() => decidePermission(req, true, false)}>允许</button>
                  <button className="secondary" onClick={() => decidePermission(req, true, true)}>
                    永久允许
                  </button>
                  <button className="danger" onClick={() => decidePermission(req, false, false)}>
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
