import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { AngleLeftIcon } from "../../icons";
import { apiClient } from "../../api";

interface UserItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  approval_status: string;
  groups: string[];
  is_superuser: boolean;
}

interface GroupItem {
  id: number;
  name: string;
}

const GROUP_COLORS: Record<string, string> = {
  "Admin Universidad": "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-500",
  "Secretario Académico": "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-500",
  "Director Carrera": "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-500",
};

export default function GestionRolesPage() {
  const navigate = useNavigate();
  const { data: users, loading, refetch } = useApiData<UserItem[]>("/auth/users/");
  const { data: allGroups } = useApiData<GroupItem[]>("/auth/groups/");
  const [saving, setSaving] = useState<number | null>(null);
  const [editedGroups, setEditedGroups] = useState<Record<number, string[]>>({});

  useEffect(() => {
    if (users) {
      const initial: Record<number, string[]> = {};
      for (const u of users) {
        initial[u.id] = [...u.groups];
      }
      setEditedGroups(initial);
    }
  }, [users]);

  const toggleGroup = (userId: number, groupName: string) => {
    setEditedGroups((prev) => {
      const current = prev[userId] || [];
      if (current.includes(groupName)) {
        return { ...prev, [userId]: current.filter((g) => g !== groupName) };
      }
      return { ...prev, [userId]: [...current, groupName] };
    });
  };

  const hasChanges = (user: UserItem) => {
    const current = editedGroups[user.id] || [];
    return JSON.stringify([...current].sort()) !== JSON.stringify([...user.groups].sort());
  };

  const saveGroups = async (userId: number) => {
    setSaving(userId);
    try {
      await apiClient.patch(`/auth/users/${userId}/groups/`, {
        groups: editedGroups[userId] || [],
      });
      refetch();
    } catch {
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Roles de usuarios" description="Gestión de roles" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Roles de usuarios" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-purple-500">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Roles de usuarios
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Asigná permisos a los usuarios para que puedan gestionar el sistema.
            </p>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Roles</th>
                <th className="px-4 py-3 w-24">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">Cargando...</td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay usuarios.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-white/90">{u.email}</div>
                      <div className="text-xs text-gray-400">{u.first_name} {u.last_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_superuser ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-500">
                          Superadmin
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-50 text-gray-600 dark:bg-gray-500/15 dark:text-gray-400">
                          {u.approval_status === "approved" ? "Activo" : u.approval_status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {allGroups?.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => !u.is_superuser && toggleGroup(u.id, g.name)}
                            disabled={u.is_superuser}
                            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                              (editedGroups[u.id] || []).includes(g.name)
                                ? `${GROUP_COLORS[g.name] || "bg-brand-50 text-brand-700"} border-transparent`
                                : "bg-transparent text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_superuser ? (
                        <span className="text-xs text-gray-400">-</span>
                      ) : (
                        <button
                          onClick={() => saveGroups(u.id)}
                          disabled={saving === u.id || !hasChanges(u)}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-500 dark:hover:bg-brand-500/25 disabled:opacity-50"
                        >
                          {saving === u.id ? "Guardando..." : "Guardar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}