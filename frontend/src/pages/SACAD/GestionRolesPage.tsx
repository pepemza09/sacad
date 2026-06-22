import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { useModal } from "../../hooks/useModal";
import { AngleLeftIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";
import Switch from "../../components/form/switch/Switch";
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

interface MenuPerm {
  id?: number;
  group?: number;
  menu_key: string;
  can_read: boolean;
  can_write: boolean;
}

interface GroupWithPerms extends GroupItem {
  menu_permissions: MenuPerm[];
}

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "facultades", label: "Facultades" },
  { key: "sedes", label: "Sedes" },
  { key: "carreras", label: "Carreras" },
  { key: "planes", label: "Planes de Estudio" },
  { key: "areas", label: "Áreas" },
  { key: "materias", label: "Materias" },
  { key: "equivalencias", label: "Equivalencias" },
  { key: "configuracion", label: "Configuración" },
  { key: "configuracion.usuarios", label: "Config. - Autorización usuarios" },
  { key: "configuracion.dominios", label: "Config. - Dominios permitidos" },
  { key: "configuracion.roles", label: "Config. - Roles de usuarios" },
  { key: "configuracion.tipos-materia", label: "Config. - Tipos de Materia" },
];

const defaultMenuPerms = (): MenuPerm[] =>
  MENU_ITEMS.map((m) => ({ menu_key: m.key, can_read: false, can_write: false }));

export default function GestionRolesPage() {
  const navigate = useNavigate();
  const { data: users, loading, refetch } = useApiData<UserItem[]>("/auth/users/");
  const { data: allGroups, refetch: refetchGroups } = useApiData<GroupItem[]>("/auth/groups/");
  const { data: groupsWithPerms, refetch: refetchGroupPerms } = useApiData<GroupWithPerms[]>("/auth/groups/permissions/");
  const [saving, setSaving] = useState<number | null>(null);
  const [editedGroups, setEditedGroups] = useState<Record<number, string[]>>({});
  const modal = useModal();
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [menuPerms, setMenuPerms] = useState<MenuPerm[]>(defaultMenuPerms);

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

  const openCreateModal = () => {
    setEditingGroupId(null);
    setGroupName("");
    setMenuPerms(defaultMenuPerms());
    setGroupError("");
    modal.openModal();
  };

  const openEditModal = async (group: GroupWithPerms) => {
    setEditingGroupId(group.id);
    setGroupName(group.name);
    setGroupError("");
    const permsMap = new Map(group.menu_permissions.map((p) => [p.menu_key, p]));
    setMenuPerms(
      MENU_ITEMS.map((m) => {
        const existing = permsMap.get(m.key);
        return {
          menu_key: m.key,
          can_read: existing?.can_read ?? false,
          can_write: existing?.can_write ?? false,
        };
      })
    );
    modal.openModal();
  };

  const toggleMenuPerm = (key: string, field: "can_read" | "can_write") => {
    setMenuPerms((prev) =>
      prev.map((p) => {
        if (p.menu_key !== key) return p;
        const next = !p[field];
        if (field === "can_write" && next) {
          return { ...p, can_write: true, can_read: true };
        }
        if (field === "can_read" && !next) {
          return { ...p, can_read: false, can_write: false };
        }
        return { ...p, [field]: next };
      })
    );
  };

  const allSelected = menuPerms.every((p) => p.can_read && p.can_write);

  const toggleAll = () => {
    const next = !allSelected;
    setMenuPerms((prev) =>
      prev.map((p) => ({ ...p, can_read: next, can_write: next }))
    );
  };

  const submitGroup = async () => {
    const name = groupName.trim();
    if (!name) {
      setGroupError("El nombre del grupo es obligatorio.");
      return;
    }
    setSubmitting(true);
    setGroupError("");
    try {
      let groupId = editingGroupId;
      if (editingGroupId) {
        await apiClient.patch(`/auth/groups/rename/`, { id: editingGroupId, name });
      } else {
        const created = await apiClient.post("/auth/groups/", { name });
        groupId = created.data.id;
      }
      await apiClient.put(`/auth/groups/${groupId}/permissions/`, menuPerms);
      setGroupName("");
      await Promise.all([refetchGroups(), refetchGroupPerms()]);
      modal.closeModal();
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Error al guardar el grupo.";
      setGroupError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGroup = async (groupId: number, groupName: string) => {
    if (!window.confirm(`¿Eliminar el grupo "${groupName}"?`)) return;
    try {
      await apiClient.delete(`/auth/groups/${groupId}/`);
      await Promise.all([refetchGroups(), refetchGroupPerms()]);
    } catch {
      alert("No se pudo eliminar el grupo.");
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Roles de usuarios" description="Gestión de roles" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Roles de usuarios" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] mb-6">
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
              Gestioná los grupos de permisos y asignalos a los usuarios.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Crear grupo
          </button>
        </div>

        {groupsWithPerms && groupsWithPerms.length > 0 && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Grupos existentes</h4>
            <div className="space-y-2">
              {groupsWithPerms.map((g) => (
                <div key={g.id} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-2.5 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-800 dark:text-white/90 min-w-[180px]">{g.name}</span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {MENU_ITEMS.map((m) => {
                      const perm = g.menu_permissions.find((p) => p.menu_key === m.key);
                      if (!perm || (!perm.can_read && !perm.can_write)) return null;
                      return (
                        <span key={m.key} className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {m.label}
                          {perm.can_write ? " (R+W)" : " (R)"}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                      title="Editar permisos"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteGroup(g.id, g.name)}
                      className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                      title="Eliminar grupo"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-6 overflow-x-auto">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Usuarios</h4>
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
                                ? "bg-brand-50 text-brand-700 border-transparent"
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

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[700px] m-4">
        <div className="px-6 py-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingGroupId ? "Editar grupo" : "Crear grupo"}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {editingGroupId
                ? "Actualizá el nombre y los permisos de menú del grupo."
                : "Definí el nombre del grupo y los permisos de acceso a cada sección."}
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nombre del grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => { setGroupName(e.target.value); setGroupError(""); }}
              placeholder="Ej: Administrador"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
            />
            {groupError && (
              <p className="mt-1.5 text-xs text-red-500">{groupError}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Permisos por menú</h4>
              <Switch
                label="Seleccionar todo"
                defaultChecked={allSelected}
                onChange={toggleAll}
              />
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Menú</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase w-28">Lectura</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase w-28">Escritura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {MENU_ITEMS.map((item) => {
                    const perm = menuPerms.find((p) => p.menu_key === item.key);
                    return (
                      <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{item.label}</td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center">
                            <Switch
                              label=""
                              defaultChecked={perm?.can_read ?? false}
                              onChange={() => toggleMenuPerm(item.key, "can_read")}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center">
                            <Switch
                              label=""
                              defaultChecked={perm?.can_write ?? false}
                              onChange={() => toggleMenuPerm(item.key, "can_write")}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={modal.closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={submitGroup}
              disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              {submitting ? "Guardando..." : editingGroupId ? "Guardar cambios" : "Crear grupo"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
