export interface AgentEvent {
  session_id?: string;
  session_title?: string;
  type?: string;
}

export type EventMutationType = "created" | "updated" | "deleted";

export interface EventPayload<TPayload> {
  type: EventMutationType;
  payload: TPayload;
}

export interface EventEnvelope<TPayload> {
  type: string;
  payload: EventPayload<TPayload>;
}
