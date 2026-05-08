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
        onCreateSession={() => void actions.createNewSession()}
        onSelectSession={(sessionID) => void actions.selectSession(sessionID)}
      />
      <main className="main">
        <Toolbar
          title={currentSession ? currentSession.title : "Crush GUI"}
          isBusy={state.agent.is_busy}
          streamStatus={state.streamStatus}
        />
        {state.errorMessage ? (
          <div className="error-banner">
            <span>{state.errorMessage}</span>
            <button className="secondary" onClick={actions.clearError}>
              关闭
            </button>
          </div>
        ) : null}
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
