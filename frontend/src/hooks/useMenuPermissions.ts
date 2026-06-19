import { useApiData } from "./useApiData";

interface MenuPermission {
  can_read: boolean;
  can_write: boolean;
}

interface PermissionsResponse {
  permissions: Record<string, MenuPermission>;
  configured: boolean;
}

export function useMenuPermissions() {
  const { data, loading } = useApiData<PermissionsResponse>("/auth/groups/me/permissions/");

  const configured = data?.configured ?? false;
  const perms = data?.permissions ?? {};

  const canRead = (menuKey: string): boolean => {
    if (!configured) return true;
    const p = perms[menuKey];
    return p?.can_read || p?.can_write || false;
  };

  const canWrite = (menuKey: string): boolean => {
    if (!configured) return true;
    return perms[menuKey]?.can_write ?? false;
  };

  return { permissions: perms, loading, canRead, canWrite };
}
