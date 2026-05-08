import type { Session } from "../types";

type SessionsPaneProps = {
  sessions: Session[];
  currentSessionID: string;
  onCreateSession: () => void;
  onSelectSession: (sessionID: string) => void;
};

export function SessionsPane(props: SessionsPaneProps) {
  const { sessions, currentSessionID, onCreateSession, onSelectSession } = props;

  return (
    <aside className="sidebar">
      <div className="sidebar-actions">
        <button onClick={onCreateSession}>新建 Session</button>
      </div>
      <div>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`session${session.id === currentSessionID ? " active" : ""}`}
            onClick={() => onSelectSession(session.id)}
          >
            <div>{session.title || "Untitled Session"}</div>
            <div className="muted">{session.id.slice(0, 8)}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
