import type { PermissionRequest } from "../types";

type PermissionsPaneProps = {
  permissions: PermissionRequest[];
  onAllow: (permission: PermissionRequest, persistent: boolean) => Promise<void>;
  onDeny: (permission: PermissionRequest) => Promise<void>;
};

export function PermissionsPane(props: PermissionsPaneProps) {
  const { permissions, onAllow, onDeny } = props;

  return (
    <div className="permissions">
      <strong>权限请求</strong>
      <div className="permissions-list">
        {permissions.map((permission) => (
          <div key={permission.id} className="perm">
            <div>
              <strong>{permission.tool_name}</strong>
            </div>
            <div className="muted">{permission.description || ""}</div>
            <div className="muted">{permission.path || ""}</div>
            <div className="perm-actions">
              <button onClick={() => void onAllow(permission, false)}>允许</button>
              <button className="secondary" onClick={() => void onAllow(permission, true)}>
                永久允许
              </button>
              <button className="danger" onClick={() => void onDeny(permission)}>
                拒绝
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
