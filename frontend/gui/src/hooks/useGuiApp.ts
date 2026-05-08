import { useCallback, useEffect, useMemo, useState } from "react";

import type { AppState, BranchMeta, PermissionRequest } from "../shared/types";
import {
  allowGuiPermission,
  bootstrapGuiApp,
  cancelGuiSession,
  createGuiSession,
  deleteGuiSession,
  denyGuiPermission,
  forkGuiSession,
  loadSessionMessages,
  revokeGuiRound,
  renameGuiSession,
  subscribeGuiEvents,
  submitPrompt,
  summarizeGuiSession,
} from "../state/guiAppEffects";
import {
  applyBootstrapResponse,
  initialAppState,
  isMutationType,
  reduceEvent,
  sortSessions,
} from "../state/guiAppReducer";
import { upsertById } from "../utils/collections";

export function useGuiApp() {
  const [state, setState] = useState<AppState>(initialAppState);

  useEffect(() => {
    let stream: EventSource | undefined;

    async function bootstrap() {
      const data = await bootstrapGuiApp();
      setState((prev) => applyBootstrapResponse(prev, data));

      stream = subscribeGuiEvents((payload) => {
        if (!isMutationType(payload.payload.type)) {
          return;
        }
        setState((prev) => reduceEvent(prev, payload));
      });
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
    const messages = await loadSessionMessages(sessionID);
    setState((prev) => ({ ...prev, messages }));
  }, []);

  const refreshMessages = useCallback(async () => {
    if (!state.currentSessionID) {
      return;
    }
    const messages = await loadSessionMessages(state.currentSessionID);
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
        await submitPrompt(sessionID, prompt);
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
    const session = await createGuiSession(title);
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
    await cancelGuiSession(state.currentSessionID);
  }, [state.currentSessionID]);

  const renameExistingSession = useCallback(async (sessionID: string, title: string) => {
    const nextTitle = title.trim();
    if (!sessionID || !nextTitle) {
      return;
    }
    await renameGuiSession(sessionID, nextTitle);
  }, []);

  const deleteExistingSession = useCallback(async (sessionID: string) => {
    if (!sessionID) {
      return;
    }
    await deleteGuiSession(sessionID);
  }, []);

  const summarizeSessionByID = useCallback(async (sessionID: string) => {
    if (!sessionID) {
      return;
    }
    await summarizeGuiSession(sessionID);
  }, []);

  const forkSession = useCallback(
    async (title?: string) => {
      if (!state.currentSessionID || !state.messages.length) {
        return;
      }
      const lastMessage = state.messages[state.messages.length - 1];
      await forkGuiSession(state.currentSessionID, lastMessage.id, title);
    },
    [state.currentSessionID, state.messages],
  );

  const allowCurrentPermission = useCallback(async (permission: PermissionRequest, persistent: boolean) => {
    await allowGuiPermission(permission, persistent);
  }, []);

  const denyCurrentPermission = useCallback(async (permission: PermissionRequest) => {
    await denyGuiPermission(permission);
  }, []);

  const revokeRoundByMessageID = useCallback(
    async (messageID: string) => {
      if (!state.currentSessionID || !messageID) {
        return;
      }
      await revokeGuiRound(state.currentSessionID, messageID);
    },
    [state.currentSessionID],
  );

  const forkSessionFromRoundEnd = useCallback(
    async (roundEndMessageID: string, title?: string) => {
      if (!state.currentSessionID || !roundEndMessageID) {
        return;
      }
      const sourceSessionID = state.currentSessionID;
      const forkedSession = await forkGuiSession(sourceSessionID, roundEndMessageID, title);
      const messages = await loadSessionMessages(forkedSession.id);
      setState((prev) => {
        const parentMeta = prev.branchMetaBySessionID[sourceSessionID];
        const branchMeta: BranchMeta = {
          sessionID: forkedSession.id,
          parentSessionID: sourceSessionID,
          roundEndMessageID,
          rootSessionID: parentMeta?.rootSessionID || sourceSessionID,
          createdAt: Math.floor(Date.now() / 1000),
        };
        return {
          ...prev,
          sessions: sortSessions(upsertById(prev.sessions, forkedSession)),
          currentSessionID: forkedSession.id,
          messages,
          branchMetaBySessionID: {
            ...prev.branchMetaBySessionID,
            [forkedSession.id]: branchMeta,
          },
        };
      });
    },
    [state.currentSessionID],
  );

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
      forkSession,
      forkSessionFromRoundEnd,
      allowCurrentPermission,
      denyCurrentPermission,
      revokeRoundByMessageID,
    },
  };
}
