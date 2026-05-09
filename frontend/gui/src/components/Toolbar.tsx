type ToolbarProps = {
  title: string;
  isBusy: boolean;
  modelLabel?: string;
  onOpenSettings: () => void;
};

export function Toolbar(props: ToolbarProps) {
  const { title, isBusy, modelLabel, onOpenSettings } = props;

  return (
    <div className="toolbar">
      <strong>{title}</strong>
      <span className="muted">{isBusy ? "运行中" : "空闲"}</span>
      {modelLabel ? <span className="muted">{modelLabel}</span> : null}
      <div className="spacer" />
      <button className="secondary" onClick={onOpenSettings}>
        设置
      </button>
    </div>
  );
}
