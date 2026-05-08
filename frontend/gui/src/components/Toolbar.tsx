type ToolbarProps = {
  title: string;
  isBusy: boolean;
};

export function Toolbar(props: ToolbarProps) {
  const { title, isBusy } = props;

  return (
    <div className="toolbar">
      <strong>{title}</strong>
      <span className="muted">{isBusy ? "运行中" : "空闲"}</span>
      <div className="spacer" />
    </div>
  );
}
