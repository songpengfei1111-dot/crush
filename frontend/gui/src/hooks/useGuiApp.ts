import { useCallback, useEffect, useMemo, useState } from "react";

import {
  allowPermission,
  cancelSession,
  createSession,
  denyPermission,
  getBootstrap,
  getMessages,
  openEventStream,
  postMessage,
} from "../api/gui";
import { upsertById } from "../utils/collections";
import type {
  AgentEvent,
  AgentInfo,
  AppState,
  EventEnvelope,
  Message,
  PermissionNotification,
  PermissionRequest,
  Session,
} from "../types";

const defaultAgentInfo: AgentInfo = {
  is_busy: false,
  is_ready: false,
  model: {},
  model_cfg: {},
};

const initialState: AppState = {
  sessions: [],
  messages: [],
  currentSessionID: "",
  permissions: [],
  agent: defaultAgentInfo,
};

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}

export function useGuiApp() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    let stream: EventSource | undefined;

    async function bootstrap() {
      const data = await getBootstrap();
      setState((prev) => ({
        ...prev,
        sessions: data.sessions || [],
        currentSessionID: data.current_session_id || "",
        messages: data.messages || [],
        permissions: data.permissions || [],
        agent: data.agent || prev.agent,
      }));

      stream = openEventStream();
      stream.onmessage = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as
          | EventEnvelope<Message>
          | EventEnvelope<Session>
          | EventEnvelope<PermissionRequest>
          | EventEnvelope<PermissionNotification>
          | EventEnvelope<AgentEvent>;

        setState((prev) => {
          switch (payload.type) {
            case "message":
              return {
                ...prev,
                messages: upsertById(prev.messages, payload.payload.payload as Message),
              };
            case "session": {
              const sessions = sortSessions(upsertById(prev.sessions, payload.payload.payload as Session));
              return {
                ...prev,
                sessions,
                currentSessionID: prev.currentSessionID || (payload.payload.payload as Session).id,
              };
            }
            case "permission_request":
              return {
                ...prev,
                permissions: upsertById(prev.permissions, payload.payload.payload as PermissionRequest),
              };
            case "permission_notification": {
              const notification = payload.payload.payload as PermissionNotification;
              return {
                ...prev,
                permissions: prev.permissions.filter((permission) => permission.tool_call_id !== notification.tool_call_id),
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
      stream?.close();
    };
  }, []);

  const currentSession = useMemo(
    () => state.sessions.find((session) => session.id === state.currentSessionID),
    [state.currentSessionID, state.sessions],
  );

  const currentMessages = useMemo(
    () => state.messages.filter((message) => message.session_id === state.currentSessionID),
    [state.currentSessionID, state.messages],
  );

  const selectSession = useCallback(async (sessionID: string) => {
    setState((prev) => ({ ...prev, currentSessionID: sessionID }));
    if (!sessionID) {
      return;
    }
    const messages = await getMessages(sessionID);
    setState((prev) => ({ ...prev, messages }));
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!state.currentSessionID) {
      return;
    }
    const messages = await getMessages(state.currentSessionID);
    setState((prev) => ({ ...prev, messages }));
  }, [state.currentSessionID]);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt || !state.currentSessionID) {
        return;
      }
      await postMessage(state.currentSessionID, prompt);
    },
    [state.currentSessionID],
  );

  const createNewSession = useCallback(async () => {
    const title = window.prompt("Session 标题", "Untitled Session") || "Untitled Session";
    const session = await createSession(title);
    setState((prev) => ({
      ...prev,
      sessions: sortSessions([session, ...prev.sessions]),
      currentSessionID: session.id,
      messages: [],
    }));
  }, []);

  const cancelCurrentSession = useCallback(async () => {
    if (!state.currentSessionID) {
      return;
    }
    await cancelSession(state.currentSessionID);
  }, [state.currentSessionID]);

  const allowCurrentPermission = useCallback(async (permission: PermissionRequest, persistent: boolean) => {
    await allowPermission(permission, persistent);
  }, []);

  const denyCurrentPermission = useCallback(async (permission: PermissionRequest) => {
    await denyPermission(permission);
  }, []);

  return {
    state,
    currentSession,
    currentMessages,
    actions: {
      selectSession,
      refreshMessages,
      sendPrompt,
      createNewSession,
      cancelCurrentSession,
      allowCurrentPermission,
      denyCurrentPermission,
    },
  };
}
