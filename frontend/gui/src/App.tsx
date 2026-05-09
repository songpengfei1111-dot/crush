import { Composer } from "./components/Composer";
import { MessagesPane } from "./components/MessagesPane";
import { PermissionsPane } from "./components/PermissionsPane";
import { SessionsPane } from "./components/SessionsPane";
import { Toolbar } from "./components/Toolbar";
import { SettingsPage } from "./features/settings/SettingsPage";
import { useGuiApp } from "./hooks/useGuiApp";

export default function App() {
  const { state, currentSession, currentMessages, actions } = useGuiApp();
  const selectedLargeModel = state.selectedModels.large;
  const configuredProviders = state.configuredProviders.filter((provider) => !provider.disabled);
  const modelLabel = selectedLargeModel ? `${selectedLargeModel.provider}/${selectedLargeModel.model}` : undefined;

  return (
    <div className="app">
      <SessionsPane
        sessions={state.sessions}
        currentSessionID={state.currentSessionID}
        busySessionID={state.busySessionID}
        onCreateSession={() => void actions.createNewSession()}
        onSelectSession={(sessionID) => void actions.selectSession(sessionID)}
        onRenameSession={(sessionID, title) => void actions.renameExistingSession(sessionID, title)}
        onDeleteSession={(sessionID) => void actions.deleteExistingSession(sessionID)}
      />
      <main className="main">
        <Toolbar
          title={currentSession ? currentSession.title : "Crush GUI"}
          isBusy={state.agent.is_busy}
          modelLabel={modelLabel}
          onOpenSettings={() => void actions.openSettings()}
        />
        <MessagesPane
          messages={currentMessages}
          sessionID={state.currentSessionID}
          isBusy={state.agent.is_busy}
          onForkRound={(messageID) => void actions.forkSessionFromRoundEnd(messageID)}
          onRevokeRound={(messageID) => void actions.revokeRoundByMessageID(messageID)}
        />
        <Composer
          onSend={actions.sendPrompt}
          onRefresh={actions.refreshMessages}
          onSummarize={async () => {
            await actions.summarizeSessionByID(state.currentSessionID)
          }}
          onCancel={actions.cancelCurrentSession}
          isBusy={state.agent.is_busy}
          canSummarize={Boolean(state.currentSessionID)}
          providers={configuredProviders}
          selectedModel={selectedLargeModel}
        />
        <PermissionsPane
          permissions={state.permissions}
          onAllow={actions.allowCurrentPermission}
          onDeny={actions.denyCurrentPermission}
        />
        <SettingsPage
          open={state.settingsOpen}
          loading={state.settingsLoading}
          providerCatalog={state.providerCatalog}
          configuredProviders={state.configuredProviders}
          mcpServers={state.mcpServers}
          skills={state.skills}
          selectedModel={selectedLargeModel}
          compactMode={state.compactMode}
          onClose={actions.closeSettings}
          onRefresh={actions.refreshSettings}
          onSaveProvider={actions.saveProviderDraft}
          onTestProvider={actions.testProviderDraft}
          onSelectModel={actions.updatePreferredModelSelection}
          onSetCompactMode={actions.setCompactMode}
          onRefreshOAuth={actions.refreshOAuthForProvider}
          onSaveMCPServer={actions.saveMCPServerDraft}
          onDeleteMCPServer={actions.deleteMCPServerByName}
          onSaveSkills={actions.saveSkillsSettings}
        />
      </main>
    </div>
  );
}
