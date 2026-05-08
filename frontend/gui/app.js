const state = { sessions: [], messages: [], currentSessionID: "", permissions: [], agent: {} };

function firstText(parts = []) {
  return parts.filter((p) => p && typeof p.text === "string").map((p) => p.text).join("\n");
}

function reasonText(parts = []) {
  return parts
    .filter((p) => p && typeof p.thinking === "string" && p.thinking)
    .map((p) => p.thinking)
    .join("\n");
}

function upsertById(arr, item) {
  const idx = arr.findIndex((v) => v.id === item.id);
  if (idx === -1) {
    arr.push(item);
  } else {
    arr[idx] = item;
  }
}

function render() {
  const sessionsEl = document.getElementById("sessions");
  sessionsEl.innerHTML = "";
  for (const session of state.sessions) {
    const div = document.createElement("div");
    div.className = "session" + (session.id === state.currentSessionID ? " active" : "");
    div.innerHTML =
      "<div>" + escapeHtml(session.title || "Untitled Session") + "</div>" +
      "<div class='muted'>" + session.id.slice(0, 8) + "</div>";
    div.onclick = async () => {
      state.currentSessionID = session.id;
      await loadMessages();
      render();
    };
    sessionsEl.appendChild(div);
  }

  const current = state.sessions.find((s) => s.id === state.currentSessionID);
  document.getElementById("current-title").textContent = current ? current.title : "Crush GUI";
  document.getElementById("agent-status").textContent = state.agent && state.agent.is_busy ? "运行中" : "空闲";

  const messagesEl = document.getElementById("messages");
  messagesEl.innerHTML = "";
  for (const message of state.messages.filter((m) => m.session_id === state.currentSessionID)) {
    const div = document.createElement("div");
    div.className = "msg";
    const text = firstText(message.parts);
    const thinking = reasonText(message.parts);
    let content = text;
    if (!content && thinking) {
      content = "[thinking]\n" + thinking;
    }
    if (!content) {
      content = JSON.stringify(message.parts, null, 2);
    }
    div.innerHTML =
      "<div class='role'>" + escapeHtml(message.role) + "</div>" +
      "<pre>" + escapeHtml(content) + "</pre>";
    messagesEl.appendChild(div);
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const permsEl = document.getElementById("permissions");
  permsEl.innerHTML = "";
  for (const req of state.permissions) {
    const div = document.createElement("div");
    div.className = "perm";
    div.innerHTML =
      "<div><strong>" + escapeHtml(req.tool_name) + "</strong></div>" +
      "<div class='muted'>" + escapeHtml(req.description || "") + "</div>" +
      "<div class='muted'>" + escapeHtml(req.path || "") + "</div>";

    const actions = document.createElement("div");
    actions.className = "perm-actions";

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
  if (!state.currentSessionID) {
    return;
  }
  const rsp = await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/messages");
  state.messages = await rsp.json();
}

async function sendMessage() {
  const promptEl = document.getElementById("prompt");
  const prompt = promptEl.value.trim();
  if (!prompt || !state.currentSessionID) {
    return;
  }
  await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/messages", {
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
  state.sessions.unshift(session);
  state.currentSessionID = session.id;
  state.messages = [];
  render();
}

async function cancelRun() {
  if (!state.currentSessionID) {
    return;
  }
  await fetch("/api/sessions/" + encodeURIComponent(state.currentSessionID) + "/cancel", { method: "POST" });
}

async function decidePermission(permission, allow, persistent) {
  const url = allow ? "/api/permissions/allow" : "/api/permissions/deny";
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permission, persistent }),
  });
}

function connectEvents() {
  const es = new EventSource("/api/events");
  es.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    switch (data.type) {
      case "message":
        upsertById(state.messages, data.payload.payload);
        break;
      case "session":
        upsertById(state.sessions, data.payload.payload);
        state.sessions.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
        if (!state.currentSessionID) {
          state.currentSessionID = data.payload.payload.id;
        }
        break;
      case "permission_request":
        upsertById(state.permissions, data.payload.payload);
        break;
      case "permission_notification":
        state.permissions = state.permissions.filter((p) => p.tool_call_id !== data.payload.payload.tool_call_id);
        break;
      case "agent_event":
        state.agent.is_busy = false;
        break;
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
document.getElementById("reload").onclick = async () => {
  await loadMessages();
  render();
};
document.getElementById("cancel").onclick = cancelRun;
document.getElementById("new-session").onclick = createSession;

bootstrap().then(connectEvents);
