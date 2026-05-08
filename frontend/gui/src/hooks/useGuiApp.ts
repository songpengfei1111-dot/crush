import { useCallback, useEffect, useMemo, useState } from "react";

import {
  allowPermission,
  cancelSession,
  createSession,
  deleteSession,
  denyPermission,
  getBootstrap,
  getMessages,
  openEventStream,
  postMessage,
  renameSession,
  summarizeSession,
} from "../api/gui";
import { removeById, upsertById } from "../utils/collections";
import type {
  AgentEvent,
  AgentInfo,
  AppState,
  EventEnvelope,
  EventMutationType,
  FinishPart,
  Message,
  MessagePart,
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
  busySessionID: "",
};

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}

function isMutationType(value: string): value is EventMutationType {
  return value === "created" || value === "updated" || value === "deleted";
}

function isFinishPart(part: MessagePart): part is Extract<MessagePart, { type: "finish" }> {
  return part.type === "finish";
}

function getFinishPart(message: Message): FinishPart | undefined {
  return message.parts.find(isFinishPart)?.data;
}

function shouldReleaseBusyFromMessage(message: Message, busySessionID: string): boolean {
  if (!busySessionID || message.session_id !== busySessionID || message.role !== "assistant") {
    return false;
  }

  const finish = getFinishPart(message);
  if (!finish) {
    return false;
  }

  return finish.reason !== "tool_use";
}

function isTerminalAgentEvent(event: AgentEvent, busySessionID: string): boolean {
  if (!busySessionID) {
    return false;
  }

  return event.session_id === busySessionID;
}

function applyResourceEvent<T extends { id: string }>(
  items: T[],
  event: EventEnvelope<T>,
): T[] {
  if (event.payload.type === "deleted") {
    return removeById(items, event.payload.payload.id);
  }

  return upsertById(items, event.payload.payload);
}

function reduceEvent(
  prev: AppState,
  payload:
    | EventEnvelope<Message>
    | EventEnvelope<Session>
    | EventEnvelope<PermissionRequest>
    | EventEnvelope<PermissionNotification>
    | EventEnvelope<AgentEvent>,
): AppState {
  switch (payload.type) {
    case "message": {
      const message = payload.payload.payload as Message;
      const messages = applyResourceEvent(prev.messages, payload as EventEnvelope<Message>);
      const shouldReleaseBusy = shouldReleaseBusyFromMessage(message, prev.busySessionID);
      return {
        ...prev,
        messages,
        agent: shouldReleaseBusy ? { ...prev.agent, is_busy: false } : prev.agent,
        busySessionID: shouldReleaseBusy ? "" : prev.busySessionID,
      };
    }
    case "session": {
      const session = payload.payload.payload as Session;
      const sessions = sortSessions(applyResourceEvent(prev.sessions, payload as EventEnvelope<Session>));
      const currentSessionExists = sessions.some((value) => value.id === prev.currentSessionID);
      const nextCurrentSessionID = currentSessionExists ? prev.currentSessionID : (sessions[0]?.id ?? "");
      const deletedCurrentSession =
        payload.payload.type === "deleted" && session.id === prev.currentSessionID;
      return {
        ...prev,
        sessions,
        currentSessionID: nextCurrentSessionID,
        messages: deletedCurrentSession
          ? prev.messages.filter((message) => message.session_id !== session.id)
          : prev.messages,
        agent:
          payload.payload.type === "deleted" && session.id === prev.busySessionID
            ? { ...prev.agent, is_busy: false }
            : prev.agent,
        busySessionID:
          payload.payload.type === "deleted" && session.id === prev.busySessionID
            ? ""
            : prev.busySessionID,
      };
    }
    case "permission_request":
      return {
        ...prev,
        permissions: applyResourceEvent(prev.permissions, payload as EventEnvelope<PermissionRequest>),
      };
    case "permission_notification": {
      const notification = payload.payload.payload as PermissionNotification;
      return {
        ...prev,
        permissions: prev.permissions.filter((permission) => permission.tool_call_id !== notification.tool_call_id),
      };
    }
    case "agent_event": {
      const event = payload.payload.payload as AgentEvent;
      const shouldReleaseBusy = isTerminalAgentEvent(event, prev.busySessionID);
      return {
        ...prev,
        agent: shouldReleaseBusy ? { ...prev.agent, is_busy: false } : prev.agent,
        busySessionID: shouldReleaseBusy ? "" : prev.busySessionID,
      };
    }
    default:
      return prev;
  }
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
        busySessionID: data.agent?.is_busy ? data.current_session_id || "" : "",
      }));

      stream = openEventStream();
      stream.onmessage = (event: MessageEvent<string>) => {
        const payload = JSON.parse(event.data) as
          | EventEnvelope<Message>
          | EventEnvelope<Session>
          | EventEnvelope<PermissionRequest>
          | EventEnvelope<PermissionNotification>
          | EventEnvelope<AgentEvent>;

        if (!isMutationType(payload.payload.type)) {
          return;
        }

        setState((prev) => reduceEvent(prev, payload));
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
      const sessionID = state.currentSessionID;
      setState((prev) => ({
        ...prev,
        agent: { ...prev.agent, is_busy: true },
        busySessionID: sessionID,
      }));
      try {
        await postMessage(sessionID, prompt);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          agent: prev.busySessionID === sessionID ? { ...prev.agent, is_busy: false } : prev.agent,
          busySessionID: prev.busySessionID === sessionID ? "" : prev.busySessionID,
        }));
        throw error;
      }
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

  const renameExistingSession = useCallback(async (sessionID: string, title: string) => {
    const nextTitle = title.trim();
    if (!sessionID || !nextTitle) {
      return;
    }
    await renameSession(sessionID, nextTitle);
  }, []);

  const deleteExistingSession = useCallback(async (sessionID: string) => {
    if (!sessionID) {
      return;
    }
    await deleteSession(sessionID);
  }, []);

  const summarizeSessionByID = useCallback(async (sessionID: string) => {
    if (!sessionID) {
      return;
    }
    await summarizeSession(sessionID);
  }, []);

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
      renameExistingSession,
      deleteExistingSession,
      summarizeSessionByID,
      allowCurrentPermission,
      denyCurrentPermission,
    },
  };
}
