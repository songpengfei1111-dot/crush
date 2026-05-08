type ToolbarProps = {
  title: string;
  isBusy: boolean;
  onCancel: () => void;
};

export function Toolbar(props: ToolbarProps) {
  const { title, isBusy, onCancel } = props;

  return (
    <div className="toolbar">
      <strong>{title}</strong>
      <span className="muted">{isBusy ? "运行中" : "空闲"}</span>
      <div className="spacer" />
      <button className="danger" onClick={onCancel}>
        取消
      </button>
    </div>
  );
}
