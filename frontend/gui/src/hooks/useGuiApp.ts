import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  StreamStatus,
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
  streamStatus: "connecting",
  errorMessage: "",
};

function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}

function isMutationType(value: string): value is EventMutationType {
  return value === "created" || value === "updated" || value === "deleted";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
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
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    let stream: EventSource | undefined;
    let cancelled = false;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function setStreamStatus(status: StreamStatus, errorMessage = "") {
      setState((prev) => ({
        ...prev,
        streamStatus: status,
        errorMessage: errorMessage || (status === "connected" ? "" : prev.errorMessage),
      }));
    }

    function scheduleReconnect() {
      if (cancelled || reconnectTimerRef.current !== null) {
        return;
      }

      const attempt = reconnectAttemptsRef.current;
      const delay = Math.min(1000 * 2 ** attempt, 5000);
      reconnectAttemptsRef.current += 1;
      setStreamStatus("reconnecting", "事件流已断开，正在尝试重新连接...");
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connectEventStream();
      }, delay);
    }

    function connectEventStream() {
      if (cancelled) {
        return;
      }

      clearReconnectTimer();
      stream?.close();
      setStreamStatus(reconnectAttemptsRef.current > 0 ? "reconnecting" : "connecting");

      const nextStream = openEventStream();
      stream = nextStream;

      nextStream.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setState((prev) => ({
          ...prev,
          streamStatus: "connected",
          errorMessage: "",
        }));
      };

      nextStream.onmessage = (event: MessageEvent<string>) => {
        let payload:
          | EventEnvelope<Message>
          | EventEnvelope<Session>
          | EventEnvelope<PermissionRequest>
          | EventEnvelope<PermissionNotification>
          | EventEnvelope<AgentEvent>;

        try {
          payload = JSON.parse(event.data) as
            | EventEnvelope<Message>
            | EventEnvelope<Session>
            | EventEnvelope<PermissionRequest>
            | EventEnvelope<PermissionNotification>
            | EventEnvelope<AgentEvent>;
        } catch (error) {
          setState((prev) => ({
            ...prev,
            errorMessage: getErrorMessage(error, "解析服务端事件失败。"),
          }));
          return;
        }

        if (!isMutationType(payload.payload.type)) {
          return;
        }

        setState((prev) => reduceEvent(prev, payload));
      };

      nextStream.onerror = () => {
        nextStream.close();
        if (cancelled) {
          return;
        }
        scheduleReconnect();
      };
    }

    async function bootstrap() {
      try {
        const data = await getBootstrap();
        if (cancelled) {
          return;
        }
        setState((prev) => ({
          ...prev,
          sessions: data.sessions || [],
          currentSessionID: data.current_session_id || "",
          messages: data.messages || [],
          permissions: data.permissions || [],
          agent: data.agent || prev.agent,
          busySessionID: data.agent?.is_busy ? data.current_session_id || "" : "",
          streamStatus: "connecting",
          errorMessage: "",
        }));
        connectEventStream();
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState((prev) => ({
          ...prev,
          streamStatus: "disconnected",
          errorMessage: getErrorMessage(error, "初始化 GUI 数据失败。"),
        }));
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      clearReconnectTimer();
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
    try {
      const messages = await getMessages(sessionID);
      setState((prev) => ({ ...prev, messages, errorMessage: "" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "加载消息失败。"),
      }));
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!state.currentSessionID) {
      return;
    }
    try {
      const messages = await getMessages(state.currentSessionID);
      setState((prev) => ({ ...prev, messages, errorMessage: "" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "刷新消息失败。"),
      }));
    }
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
          errorMessage: getErrorMessage(error, "发送消息失败。"),
        }));
        throw error;
      }
    },
    [state.currentSessionID],
  );

  const createNewSession = useCallback(async () => {
    const title = window.prompt("Session 标题", "Untitled Session") || "Untitled Session";
    try {
      const session = await createSession(title);
      setState((prev) => ({
        ...prev,
        sessions: sortSessions([session, ...prev.sessions]),
        currentSessionID: session.id,
        messages: [],
        errorMessage: "",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "创建会话失败。"),
      }));
    }
  }, []);

  const cancelCurrentSession = useCallback(async () => {
    if (!state.currentSessionID) {
      return;
    }
    try {
      await cancelSession(state.currentSessionID);
      setState((prev) => ({ ...prev, errorMessage: "" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "取消当前会话失败。"),
      }));
    }
  }, [state.currentSessionID]);

  const allowCurrentPermission = useCallback(async (permission: PermissionRequest, persistent: boolean) => {
    try {
      await allowPermission(permission, persistent);
      setState((prev) => ({ ...prev, errorMessage: "" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "批准权限请求失败。"),
      }));
    }
  }, []);

  const denyCurrentPermission = useCallback(async (permission: PermissionRequest) => {
    try {
      await denyPermission(permission);
      setState((prev) => ({ ...prev, errorMessage: "" }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errorMessage: getErrorMessage(error, "拒绝权限请求失败。"),
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, errorMessage: "" }));
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
      clearError,
    },
  };
}
