import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  AppState,
  ConfigScope,
  MCPServerDraft,
  PermissionRequest,
  ProviderDraft,
  SelectedModelConfig,
  SendPromptOptions,
  SkillSettingsDraft,
} from "../shared/types";
import {
  allowGuiPermission,
  bootstrapGuiApp,
  bootstrapGuiSettings,
  cancelGuiSession,
  createGuiSession,
  deleteGuiMCPServer,
  deleteGuiSession,
  denyGuiPermission,
  forkGuiSession,
  loadDefaultSmallModel,
  loadSessionMessages,
  refreshGuiProviderOAuth,
  revokeGuiRound,
  renameGuiSession,
  saveGuiMCPServer,
  saveGuiProvider,
  saveGuiSkillSettings,
  setGuiCompactMode,
  subscribeGuiEvents,
  submitPrompt,
  summarizeGuiSession,
  testGuiProvider,
  updateGuiPreferredModel,
} from "../state/guiAppEffects";
import {
  applySettingsBootstrap,
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
      const [data, settings] = await Promise.all([bootstrapGuiApp(), bootstrapGuiSettings()]);
      setState((prev) => applyBootstrapResponse(prev, data));
      setState((prev) => applySettingsBootstrap(prev, settings));

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
    async (prompt: string, options?: SendPromptOptions) => {
      if (!prompt || !state.currentSessionID) {
        return;
      }
      const sessionID = state.currentSessionID;
      if (options?.modelOverride) {
        const scope = options.scope || "workspace";
        await updateGuiPreferredModel(scope, "large", options.modelOverride);
        let syncedSmallModel: SelectedModelConfig | undefined;
        if (options.syncSmallModel !== false) {
          const smallModel = await loadDefaultSmallModel(options.modelOverride.provider);
          if (smallModel.model && smallModel.provider) {
            await updateGuiPreferredModel(scope, "small", smallModel);
            syncedSmallModel = smallModel;
          }
        }
        setState((prev) => ({
          ...prev,
          selectedModels: {
            ...prev.selectedModels,
            large: options.modelOverride,
            ...(syncedSmallModel ? { small: syncedSmallModel } : {}),
          },
        }));
      }
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
        return {
          ...prev,
          sessions: sortSessions(upsertById(prev.sessions, forkedSession)),
          currentSessionID: forkedSession.id,
          messages,
        };
      });
    },
    [state.currentSessionID],
  );

  const openSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, settingsOpen: true, settingsLoading: true }));
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const closeSettings = useCallback(() => {
    setState((prev) => ({ ...prev, settingsOpen: false }));
  }, []);

  const refreshSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, settingsLoading: true }));
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const saveProviderDraft = useCallback(async (provider: ProviderDraft, scope: ConfigScope = "global") => {
    await saveGuiProvider(scope, provider);
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const testProviderDraft = useCallback((provider: ProviderDraft) => {
    return testGuiProvider(provider);
  }, []);

  const updatePreferredModelSelection = useCallback(
    async (model: SelectedModelConfig, scope: ConfigScope = "global", syncSmallModel = true) => {
      await updateGuiPreferredModel(scope, "large", model);
      const nextSelectedModels = { ...state.selectedModels, large: model };
      if (syncSmallModel) {
        const smallModel = await loadDefaultSmallModel(model.provider);
        if (smallModel.model && smallModel.provider) {
          await updateGuiPreferredModel(scope, "small", smallModel);
          nextSelectedModels.small = smallModel;
        }
      }
      setState((prev) => ({ ...prev, selectedModels: nextSelectedModels }));
    },
    [state.selectedModels],
  );

  const setCompactMode = useCallback(async (enabled: boolean, scope: ConfigScope = "global") => {
    await setGuiCompactMode(scope, enabled);
    setState((prev) => ({ ...prev, compactMode: enabled }));
  }, []);

  const refreshOAuthForProvider = useCallback(async (providerID: string, scope: ConfigScope = "global") => {
    await refreshGuiProviderOAuth(scope, providerID);
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const saveMCPServerDraft = useCallback(async (server: MCPServerDraft, scope: ConfigScope = "global") => {
    await saveGuiMCPServer(scope, server);
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const deleteMCPServerByName = useCallback(async (name: string, scope: ConfigScope = "global") => {
    await deleteGuiMCPServer(name, scope);
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
  }, []);

  const saveSkillsSettings = useCallback(async (skills: SkillSettingsDraft, scope: ConfigScope = "global") => {
    await saveGuiSkillSettings(scope, skills);
    const settings = await bootstrapGuiSettings();
    setState((prev) => applySettingsBootstrap(prev, settings));
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
      forkSession,
      forkSessionFromRoundEnd,
      allowCurrentPermission,
      denyCurrentPermission,
      revokeRoundByMessageID,
      openSettings,
      closeSettings,
      refreshSettings,
      saveProviderDraft,
      testProviderDraft,
      updatePreferredModelSelection,
      setCompactMode,
      refreshOAuthForProvider,
      saveMCPServerDraft,
      deleteMCPServerByName,
      saveSkillsSettings,
    },
  };
}
