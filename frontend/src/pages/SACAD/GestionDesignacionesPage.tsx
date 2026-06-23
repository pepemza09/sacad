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

type Tab = "cargos" | "dedicaciones" | "caracteres";

interface Designacion {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

const TABS: { key: Tab; label: string; endpoint: string; title: string; desc: string }[] = [
  { key: "cargos", label: "Cargos", endpoint: "/cargos/", title: "Cargos", desc: "Configurá los cargos docentes." },
  { key: "dedicaciones", label: "Dedicaciones", endpoint: "/dedicaciones/", title: "Dedicaciones", desc: "Configurá las dedicaciones docentes." },
  { key: "caracteres", label: "Caracteres", endpoint: "/caracteres/", title: "Caracteres", desc: "Configurá los caracteres de designación." },
];

function DesignacionTable({ tab, canWrite }: { tab: typeof TABS[0]; canWrite: boolean }) {
  const { data, loading, refetch } = useApiData<{ results: Designacion[] }>(tab.endpoint);
  const items = data?.results ?? [];

  const [editingId, setEditingId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    setCodigo("");
    setDescripcion("");
    setActivo(true);
    setError("");
  };

  const openEdit = (item: Designacion) => {
    setEditingId(item.id);
    setShowCreate(true);
    setCodigo(item.codigo);
    setDescripcion(item.descripcion);
    setActivo(item.activo);
    setError("");
  };

  const cancel = () => {
    setEditingId(null);
    setShowCreate(false);
    setCodigo("");
    setDescripcion("");
    setActivo(true);
    setError("");
  };

  const handleSave = async () => {
    const c = codigo.trim().toUpperCase();
    const d = descripcion.trim();
    if (!c) { setError("El código es obligatorio."); return; }
    if (!d) { setError("La descripción es obligatoria."); return; }
    setSaving(true);
    setError("");
    try {
      const payload = { codigo: c, descripcion: d, activo };
      if (editingId) {
        await apiClient.put(`${tab.endpoint}${editingId}/`, payload);
      } else {
        await apiClient.post(tab.endpoint, payload);
      }
      cancel();
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
      await apiClient.delete(`${tab.endpoint}${deleteId}/`);
      setDeleteId(null);
      refetch();
    } catch {
      setError("No se pudo eliminar.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{tab.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{tab.desc}</p>
        </div>
        {canWrite && (
          <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>
            Nuevo
          </Button>
        )}
      </div>

      {(editingId !== null || showCreate) && (
        <div className="mb-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {error && (
            <div className="mb-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
              {error}
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Código</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="ej: TC"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div className="flex-[2]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="ej: Tiempo Completo"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="designacion-activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="designacion-activo" className="text-xs text-gray-600 dark:text-gray-400">Activo</label>
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving || !codigo.trim() || !descripcion.trim()}>
              {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
            </Button>
            <Button size="sm" variant="outline" onClick={cancel}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 w-28">Código</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 w-28">Estado</th>
              <th className="px-4 py-3 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay registros.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90 uppercase">{item.codigo}</td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white/90">{item.descripcion}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${item.activo ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}`}>
                      {item.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canWrite && <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                        <PencilIcon className="w-4 h-4" />
                      </button>}
                      {canWrite && <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
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

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar este registro?
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button size="sm" className="bg-error-500 text-white hover:bg-error-600" onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function GestionDesignacionesPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("configuracion.designaciones");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("cargos");

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <>
      <PageMeta title="SACAD - Designaciones" description="Gestión de cargos, dedicaciones y caracteres" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Designaciones" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-amber-500">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Designaciones
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Configurá cargos, dedicaciones y caracteres para docentes.
            </p>
          </div>
        </div>

        <div className="px-6 pt-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.key
                    ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <DesignacionTable key={activeTab} tab={currentTab} canWrite={canWrite} />
        </div>
      </div>
    </>
  );
}
