import { useApiData } from "./useApiData";

interface MenuPermission {
  can_read: boolean;
  can_write: boolean;
}

export function useMenuPermissions() {
  const { data, loading } = useApiData<Record<string, MenuPermission>>("/auth/groups/me/permissions/");

  const canRead = (menuKey: string): boolean => {
    if (!data) return false;
    const p = data[menuKey];
    return p?.can_read || p?.can_write || false;
  };

  const canWrite = (menuKey: string): boolean => {
    if (!data) return false;
    return data[menuKey]?.can_write ?? false;
  };

  return { permissions: data ?? {}, loading, canRead, canWrite };
}
