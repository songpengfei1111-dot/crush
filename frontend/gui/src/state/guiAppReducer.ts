import type {
  AgentEvent,
  AgentInfo,
  AppState,
  BootstrapResponse,
  EventEnvelope,
  EventMutationType,
  FinishPart,
  Message,
  MessagePart,
  PermissionNotification,
  PermissionRequest,
  SettingsBootstrap,
  Session,
} from "../shared/types";
import { removeById, upsertById } from "../utils/collections";

export const defaultAgentInfo: AgentInfo = {
  is_busy: false,
  is_ready: false,
  model: {},
  model_cfg: {},
};

export const initialAppState: AppState = {
  sessions: [],
  messages: [],
  currentSessionID: "",
  permissions: [],
  agent: defaultAgentInfo,
  busySessionID: "",
  settingsOpen: false,
  settingsLoading: false,
  providerCatalog: [],
  configuredProviders: [],
  selectedModels: {},
  compactMode: false,
  mcpServers: [],
  skills: {
    user_paths: [],
    default_paths: [],
    disabled_skills: [],
    skills: [],
  },
};

export function sortSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}

export function isMutationType(value: string): value is EventMutationType {
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

function hasCompletedAssistantTurn(messages: Message[], sessionID: string): boolean {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.session_id !== sessionID || message.role !== "assistant") {
      continue;
    }

    const finish = getFinishPart(message);
    return Boolean(finish && finish.reason !== "tool_use");
  }

  return false;
}

function isTerminalAgentEvent(event: AgentEvent, busySessionID: string, messages: Message[]): boolean {
  if (!busySessionID) {
    return false;
  }

  if (event.session_id !== busySessionID || event.type !== "agent_finished") {
    return false;
  }

  return hasCompletedAssistantTurn(messages, busySessionID);
}

function applyResourceEvent<T extends { id: string }>(items: T[], event: EventEnvelope<T>): T[] {
  if (event.payload.type === "deleted") {
    return removeById(items, event.payload.payload.id);
  }

  return upsertById(items, event.payload.payload);
}

export function applyBootstrapResponse(
  prev: AppState,
  data: BootstrapResponse,
): AppState {
  return {
    ...prev,
    sessions: data.sessions || [],
    currentSessionID: data.current_session_id || "",
    messages: data.messages || [],
    permissions: data.permissions || [],
    agent: data.agent || prev.agent,
    busySessionID: data.agent?.is_busy ? data.current_session_id || "" : "",
  };
}

export function applySettingsBootstrap(prev: AppState, data: SettingsBootstrap): AppState {
  return {
    ...prev,
    providerCatalog: data.provider_catalog || [],
    configuredProviders: data.configured_providers || [],
    selectedModels: data.selected_models || {},
    compactMode: Boolean(data.compact_mode),
    mcpServers: data.mcp_servers || [],
		skills: normalizeSkillSettings(data.skills || prev.skills),
    settingsLoading: false,
  };
}

function normalizeSkillSettings(data: AppState["skills"]): AppState["skills"] {
	return {
		user_paths: data?.user_paths || [],
		default_paths: data?.default_paths || [],
		disabled_skills: data?.disabled_skills || [],
		skills: data?.skills || [],
	};
}

export function reduceEvent(
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
        permissions: prev.permissions.filter(
          (permission) => permission.tool_call_id !== notification.tool_call_id,
        ),
      };
    }
    case "agent_event": {
      const event = payload.payload.payload as AgentEvent;
      const shouldReleaseBusy = isTerminalAgentEvent(event, prev.busySessionID, prev.messages);
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
