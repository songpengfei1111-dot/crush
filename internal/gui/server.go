package gui

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"

	"github.com/charmbracelet/crush/internal/proto"
	"github.com/charmbracelet/crush/internal/pubsub"
)

type Server struct {
	controller *Controller
	http       *http.Server
	listener   net.Listener
}

func NewServer(controller *Controller) *Server {
	s := &Server{controller: controller}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", s.handleIndex)
	mux.HandleFunc("GET /api/bootstrap", s.handleBootstrap)
	mux.HandleFunc("POST /api/sessions", s.handleCreateSession)
	mux.HandleFunc("GET /api/sessions/{sid}/messages", s.handleListMessages)
	mux.HandleFunc("POST /api/sessions/{sid}/messages", s.handleSendMessage)
	mux.HandleFunc("POST /api/sessions/{sid}/cancel", s.handleCancel)
	mux.HandleFunc("POST /api/permissions/allow", s.handleAllowPermission)
	mux.HandleFunc("POST /api/permissions/deny", s.handleDenyPermission)
	mux.HandleFunc("GET /api/events", s.handleEvents)
	s.http = &http.Server{Handler: mux}
	return s
}

func (s *Server) Start() (string, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", err
	}
	s.listener = ln
	go func() {
		_ = s.http.Serve(ln)
	}()
	return "http://" + ln.Addr().String() + "/", nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.http == nil {
		return nil
	}
	return s.http.Shutdown(ctx)
}

func (s *Server) handleIndex(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(indexHTML))
}

func (s *Server) handleBootstrap(w http.ResponseWriter, r *http.Request) {
	bootstrap, err := s.controller.Bootstrap(r.Context())
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, bootstrap)
}

func (s *Server) handleCreateSession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	sess, err := s.controller.CreateSession(r.Context(), req.Title)
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, sess)
}

func (s *Server) handleListMessages(w http.ResponseWriter, r *http.Request) {
	msgs, err := s.controller.ListMessages(r.Context(), r.PathValue("sid"))
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	writeJSON(w, msgs)
}

func (s *Server) handleSendMessage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Prompt string `json:"prompt"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	if err := s.controller.SendMessage(r.Context(), r.PathValue("sid"), req.Prompt); err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusAccepted)
}

func (s *Server) handleCancel(w http.ResponseWriter, r *http.Request) {
	s.controller.Cancel(r.PathValue("sid"))
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleAllowPermission(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Permission proto.PermissionRequest `json:"permission"`
		Persistent bool                    `json:"persistent"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	s.controller.GrantPermission(req.Permission, req.Persistent)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleDenyPermission(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Permission proto.PermissionRequest `json:"permission"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err, http.StatusBadRequest)
		return
	}
	s.controller.DenyPermission(req.Permission)
	w.WriteHeader(http.StatusOK)
}

func (s *Server) handleEvents(w http.ResponseWriter, r *http.Request) {
	events, err := s.controller.SubscribeEvents(r.Context())
	if err != nil {
		writeError(w, err, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher := http.NewResponseController(w)
	for {
		select {
		case <-r.Context().Done():
			return
		case ev, ok := <-events:
			if !ok {
				return
			}
			if err := writeSSE(w, ev); err != nil {
				if errors.Is(err, net.ErrClosed) {
					return
				}
				return
			}
			if err := flusher.Flush(); err != nil {
				return
			}
		}
	}
}

func writeSSE(w http.ResponseWriter, payload pubsub.Payload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintf(w, "data: %s\n\n", data)
	return err
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, err error, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
}

const indexHTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Crush GUI</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; font: 14px/1.5 -apple-system, BlinkMacSystemFont, sans-serif; background: #0f1115; color: #e8e8e8; }
    .app { display: grid; grid-template-columns: 280px 1fr; height: 100vh; }
    .sidebar { border-right: 1px solid #23262d; padding: 12px; overflow: auto; }
    .main { display: grid; grid-template-rows: auto 1fr auto auto; min-width: 0; }
    .toolbar { display: flex; gap: 8px; align-items: center; padding: 12px; border-bottom: 1px solid #23262d; }
    .messages { overflow: auto; padding: 16px; }
    .composer { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 12px; border-top: 1px solid #23262d; }
    .permissions { border-top: 1px solid #23262d; padding: 12px; max-height: 220px; overflow: auto; }
    button { background: #2b6ef3; color: white; border: 0; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
    button.secondary { background: #303540; }
    button.danger { background: #a33939; }
    textarea, input { width: 100%; box-sizing: border-box; background: #151922; color: #eee; border: 1px solid #303540; border-radius: 8px; padding: 10px; }
    textarea { min-height: 84px; resize: vertical; }
    .session { padding: 10px; border-radius: 8px; cursor: pointer; margin-bottom: 8px; background: #151922; border: 1px solid transparent; }
    .session.active { border-color: #2b6ef3; }
    .msg { margin-bottom: 14px; padding: 12px; border-radius: 10px; background: #151922; }
    .msg .role { font-size: 12px; opacity: 0.75; margin-bottom: 6px; text-transform: uppercase; }
    .msg pre { white-space: pre-wrap; word-break: break-word; margin: 0; font: inherit; }
    .perm { padding: 10px; background: #151922; border-radius: 8px; margin-bottom: 8px; }
    .muted { opacity: 0.7; }
    .spacer { flex: 1; }
  </style>
</head>
<body>
  <div class="app">
    <aside class="sidebar">
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <button id="new-session">新建 Session</button>
      </div>
      <div id="sessions"></div>
    </aside>
    <main class="main">
      <div class="toolbar">
        <strong id="current-title">Crush GUI</strong>
        <span class="muted" id="agent-status"></span>
        <div class="spacer"></div>
        <button class="danger" id="cancel">取消</button>
      </div>
      <div class="messages" id="messages"></div>
      <div class="composer">
        <textarea id="prompt" placeholder="输入你的 prompt..."></textarea>
        <button id="send">发送</button>
        <button class="secondary" id="reload">刷新</button>
      </div>
      <div class="permissions">
        <strong>权限请求</strong>
        <div id="permissions" style="margin-top:8px;"></div>
      </div>
    </main>
  </div>
  <script>
    const state = { sessions: [], messages: [], currentSessionID: "", permissions: [], agent: {} };

    function firstText(parts = []) {
      return parts.filter(p => p && typeof p.text === "string").map(p => p.text).join("\n");
    }

    function reasonText(parts = []) {
      return parts.filter(p => p && typeof p.thinking === "string" && p.thinking).map(p => p.thinking).join("\n");
    }

    function upsertById(arr, item) {
      const idx = arr.findIndex(v => v.id === item.id);
      if (idx === -1) arr.push(item); else arr[idx] = item;
    }

    function render() {
      const sessionsEl = document.getElementById("sessions");
      sessionsEl.innerHTML = "";
      for (const s of state.sessions) {
        const div = document.createElement("div");
        div.className = "session" + (s.id === state.currentSessionID ? " active" : "");
        div.innerHTML = "<div>" + escapeHtml(s.title || "Untitled Session") + "</div><div class='muted'>" + s.id.slice(0, 8) + "</div>";
        div.onclick = async () => { state.currentSessionID = s.id; await loadMessages(); render(); };
        sessionsEl.appendChild(div);
      }

      const current = state.sessions.find(s => s.id === state.currentSessionID);
      document.getElementById("current-title").textContent = current ? current.title : "Crush GUI";
      document.getElementById("agent-status").textContent = state.agent && state.agent.is_busy ? "运行中" : "空闲";

      const messagesEl = document.getElementById("messages");
      messagesEl.innerHTML = "";
      for (const m of state.messages.filter(m => m.session_id === state.currentSessionID)) {
        const div = document.createElement("div");
        div.className = "msg";
        const text = firstText(m.parts);
        const thinking = reasonText(m.parts);
        let content = text;
        if (!content && thinking) content = "[thinking]\n" + thinking;
        if (!content) content = JSON.stringify(m.parts, null, 2);
        div.innerHTML = "<div class='role'>" + escapeHtml(m.role) + "</div><pre>" + escapeHtml(content) + "</pre>";
        messagesEl.appendChild(div);
      }
      messagesEl.scrollTop = messagesEl.scrollHeight;

      const permsEl = document.getElementById("permissions");
      permsEl.innerHTML = "";
      for (const req of state.permissions) {
        const div = document.createElement("div");
        div.className = "perm";
        div.innerHTML = "<div><strong>" + escapeHtml(req.tool_name) + "</strong></div>"
          + "<div class='muted'>" + escapeHtml(req.description || "") + "</div>"
          + "<div class='muted'>" + escapeHtml(req.path || "") + "</div>";
        const actions = document.createElement("div");
        actions.style.marginTop = "8px";
        actions.style.display = "flex";
        actions.style.gap = "8px";
        const allow = document.createElement("button");
        allow.textContent = "允许";
        allow.onclick = () => decidePermission(req, true, false);
        const allowPersist = document.createElement("button");
        allowPersist.className = "secondary";
        allowPersist.textContent = "永久允许";
        allowPersist.onclick = () => decidePermission(req, true, true);
        const deny = document.createElement("button");
        deny.className = "danger";
        deny.textContent = "拒绝";
        deny.onclick = () => decidePermission(req, false, false);
        actions.append(allow, allowPersist, deny);
        div.appendChild(actions);
        permsEl.appendChild(div);
      }
    }

    async function bootstrap() {
      const rsp = await fetch("/api/bootstrap");
      const data = await rsp.json();
      state.sessions = data.sessions || [];
      state.currentSessionID = data.current_session_id || "";
      state.messages = data.messages || [];
      state.permissions = data.permissions || [];
      state.agent = data.agent || {};
      render();
    }

    async function loadMessages() {
      if (!state.currentSessionID) return;
      const rsp = await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/messages");
      state.messages = await rsp.json();
    }

    async function sendMessage() {
      const promptEl = document.getElementById("prompt");
      const prompt = promptEl.value.trim();
      if (!prompt || !state.currentSessionID) return;
      await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      promptEl.value = "";
    }

    async function createSession() {
      const title = window.prompt("Session 标题", "Untitled Session") || "Untitled Session";
      const rsp = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      const session = await rsp.json();
      state.sessions.unshift(session);
      state.currentSessionID = session.id;
      state.messages = [];
      render();
    }

    async function cancelRun() {
      if (!state.currentSessionID) return;
      await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/cancel", { method: "POST" });
    }

    async function decidePermission(permission, allow, persistent) {
      const url = allow ? "/api/permissions/allow" : "/api/permissions/deny";
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission, persistent })
      });
    }

    function connectEvents() {
      const es = new EventSource("/api/events");
      es.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        switch (data.type) {
          case "message": {
            upsertById(state.messages, data.payload.payload);
            break;
          }
          case "session": {
            upsertById(state.sessions, data.payload.payload);
            state.sessions.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
            if (!state.currentSessionID) state.currentSessionID = data.payload.payload.id;
            break;
          }
          case "permission_request": {
            upsertById(state.permissions, data.payload.payload);
            break;
          }
          case "permission_notification": {
            state.permissions = state.permissions.filter(p => p.tool_call_id !== data.payload.payload.tool_call_id);
            break;
          }
          case "agent_event": {
            state.agent.is_busy = false;
            break;
          }
        }
        render();
      };
    }

    function escapeHtml(text) {
      return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    document.getElementById("send").onclick = sendMessage;
    document.getElementById("reload").onclick = async () => { await loadMessages(); render(); };
    document.getElementById("cancel").onclick = cancelRun;
    document.getElementById("new-session").onclick = createSession;
    bootstrap().then(connectEvents);
  </script>
</body>
</html>`
