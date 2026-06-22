import { useEffect, useCallback } from "react";
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
  const { data, loading, refetch } = useApiData<PermissionsResponse>("/auth/groups/me/permissions/");

  useEffect(() => {
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, []);

  const configured = data?.configured ?? false;
  const perms = data?.permissions ?? {};

  const canRead = useCallback((menuKey: string): boolean => {
    if (!configured) return true;
    const p = perms[menuKey];
    return p?.can_read || p?.can_write || false;
  }, [configured, perms]);

  const canWrite = useCallback((menuKey: string): boolean => {
    if (!configured) return true;
    return perms[menuKey]?.can_write ?? false;
  }, [configured, perms]);

  return { permissions: perms, loading, canRead, canWrite, refetch };
}
