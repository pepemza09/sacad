import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { TrashBinIcon, AngleLeftIcon, PencilIcon } from "../../icons";
import { apiClient } from "../../api";
import { useAuth } from "../../context/auth/AuthContext";
import { useMenuPermissions } from "../../hooks/useMenuPermissions";

interface TipoMateria {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function GestionTiposMateriaPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("configuracion.tipos-materia");
  const navigate = useNavigate();
  const { data: tipos, loading, refetch } = useApiData<{ results: TipoMateria[] }>("/tipos-materia/");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombre, setNombre] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    setNombre("");
    setActivo(true);
    setError("");
  };

  const openEdit = (t: TipoMateria) => {
    setEditingId(t.id);
    setNombre(t.nombre);
    setActivo(t.activo);
    setError("");
  };

  const handleSave = async () => {
    const trimmed = nombre.trim().toLowerCase();
    if (!trimmed) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { nombre: trimmed, activo };
      if (editingId) {
        await apiClient.put(`/tipos-materia/${editingId}/`, payload);
      } else {
        await apiClient.post("/tipos-materia/", payload);
      }
      setEditingId(null);
      setShowCreate(false);
      setNombre("");
      setActivo(true);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, string | string[]> } };
      const data = axiosErr?.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join(" ");
        setError(msgs);
      } else {
        setError("No se pudo guardar.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/tipos-materia/${deleteId}/`);
      setDeleteId(null);
      refetch();
    } catch {
      setError("El tipo tiene materias asociadas. Eliminalas primero.");
    }
  };

  const items = tipos?.results ?? [];

  return (
    <>
      <PageMeta title="SACAD - Tipos de Materia" description="Gestión de tipos de materia" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Tipos de Materia" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-amber-500">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Tipos de Materia
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Configurá los tipos de materia disponibles (obligatoria, optativa, electiva, etc.).
            </p>
          </div>
          <div className="flex-none">
            {canWrite && <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Nuevo Tipo</Button>}
          </div>
        </div>

        <div className="p-6">
          {(editingId !== null || showCreate) && (
            <div className="mb-6 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {error && (
                <div className="mb-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {error}
                </div>
              )}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="ej: obligatoria"
                    className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input
                    type="checkbox"
                    id="tipo-activo"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <label htmlFor="tipo-activo" className="text-xs text-gray-600 dark:text-gray-400">Activo</label>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving || !nombre.trim()}>
                  {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
                </Button>
                {(editingId || showCreate) && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setShowCreate(false); setNombre(""); setActivo(true); setError(""); }}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center">Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No hay tipos de materia configurados.</td></tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 capitalize">{t.nombre}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${t.activo ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                          {t.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canWrite && <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="w-4 h-4" />
                          </button>}
                          {canWrite && <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <TrashBinIcon className="w-4 h-4" />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar tipo</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar este tipo? Las materias que lo usan no podrán eliminarlo.
            </p>
            {error && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">{error}</div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button size="sm" className="bg-error-500 text-white hover:bg-error-600" onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
