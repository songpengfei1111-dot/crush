import { Composer } from "./components/Composer";
import { MessagesPane } from "./components/MessagesPane";
import { PermissionsPane } from "./components/PermissionsPane";
import { SessionsPane } from "./components/SessionsPane";
import { Toolbar } from "./components/Toolbar";
import { useGuiApp } from "./hooks/useGuiApp";

export default function App() {
  const { state, currentSession, currentMessages, actions } = useGuiApp();

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
        onSummarizeSession={(sessionID) => void actions.summarizeSessionByID(sessionID)}
      />
      <main className="main">
        <Toolbar
          title={currentSession ? currentSession.title : "Crush GUI"}
          isBusy={state.agent.is_busy}
        />
        <MessagesPane messages={currentMessages} sessionID={state.currentSessionID} />
        <Composer
          onSend={actions.sendPrompt}
          onRefresh={actions.refreshMessages}
          onCancel={actions.cancelCurrentSession}
          isBusy={state.agent.is_busy}
        />
        <PermissionsPane
          permissions={state.permissions}
          onAllow={actions.allowCurrentPermission}
          onDeny={actions.denyCurrentPermission}
        />
      </main>
    </div>
  );
}
