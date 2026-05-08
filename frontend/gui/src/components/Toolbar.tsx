import type { StreamStatus } from "../types";

type ToolbarProps = {
  title: string;
  isBusy: boolean;
  streamStatus: StreamStatus;
};

export function Toolbar(props: ToolbarProps) {
  const { title, isBusy, streamStatus } = props;

  const connectionLabel =
    streamStatus === "connected"
      ? "已连接"
      : streamStatus === "reconnecting"
        ? "重连中"
        : streamStatus === "disconnected"
          ? "已断开"
          : "连接中";

  return (
    <div className="toolbar">
      <strong>{title}</strong>
      <span className="muted">{isBusy ? "运行中" : "空闲"}</span>
      <span className={`muted connection-status ${streamStatus}`}>{connectionLabel}</span>
      <div className="spacer" />
    </div>
  );
}
