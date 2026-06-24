import { useState, useEffect } from "react";
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

type Tab = "disciplinas" | "subdisciplinas" | "especialidades";

interface NomencladorItem {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
  disciplina?: number;
  disciplina_codigo?: string;
  subdisciplina?: number;
  subdisciplina_codigo?: string;
}

interface ParentItem {
  id: number;
  codigo: string;
  descripcion: string;
}

interface TabConfig {
  key: Tab;
  label: string;
  endpoint: string;
  title: string;
  desc: string;
  parentEndpoint?: string;
  parentKey?: string;
  parentDisplay?: string;
  parentLabel?: string;
  grandParentEndpoint?: string;
  grandParentKey?: string;
  grandParentDisplay?: string;
  grandParentLabel?: string;
}

const TABS: TabConfig[] = [
  { key: "disciplinas", label: "Disciplinas", endpoint: "/disciplinas/", title: "Disciplinas", desc: "Configurá las disciplinas del nomenclador." },
  { key: "subdisciplinas", label: "Subdisciplinas", endpoint: "/subdisciplinas/", title: "Subdisciplinas", desc: "Configurá las subdisciplinas del nomenclador.", parentEndpoint: "/disciplinas/", parentKey: "disciplina", parentDisplay: "disciplina_codigo", parentLabel: "Disciplina" },
  { key: "especialidades", label: "Especialidades", endpoint: "/especialidades/", title: "Especialidades", desc: "Configurá las especialidades del nomenclador.", parentEndpoint: "/subdisciplinas/", parentKey: "subdisciplina", parentDisplay: "subdisciplina_codigo", parentLabel: "Subdisciplina", grandParentEndpoint: "/disciplinas/", grandParentKey: "disciplina", grandParentDisplay: "disciplina_codigo", grandParentLabel: "Disciplina" },
];

function NomencladorTable({ tab, canWrite }: { tab: TabConfig; canWrite: boolean }) {
  const { data, loading, refetch } = useApiData<{ results: NomencladorItem[] }>(tab.endpoint);
  const [parents, setParents] = useState<ParentItem[]>([]);
  const items = data?.results ?? [];

  useEffect(() => {
    if (tab.parentEndpoint) {
      apiClient.get(tab.parentEndpoint).then((res) => {
        setParents(res.data?.results ?? []);
      });
    }
  }, [tab.parentEndpoint, tab.grandParentEndpoint]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [activo, setActivo] = useState(true);
  const [parentId, setParentId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const hasParent = !!tab.parentKey;

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    setCodigo("");
    setDescripcion("");
    setActivo(true);
    setParentId("");
    setError("");
  };

  const openEdit = (item: NomencladorItem) => {
    setEditingId(item.id);
    setShowCreate(true);
    setCodigo(item.codigo);
    setDescripcion(item.descripcion);
    setActivo(item.activo);
    setParentId((item[tab.parentKey as keyof NomencladorItem] as number) ?? "");
    setError("");
  };

  const cancel = () => {
    setEditingId(null);
    setShowCreate(false);
    setCodigo("");
    setDescripcion("");
    setActivo(true);
    setParentId("");
    setError("");
  };

  const handleSave = async () => {
    const c = codigo.trim().toUpperCase();
    const d = descripcion.trim();
    if (!c) { setError("El código es obligatorio."); return; }
    if (!d) { setError("La descripción es obligatoria."); return; }
    if (c.length !== 2) { setError("El código debe tener exactamente 2 caracteres."); return; }
    if (hasParent && !parentId) {
      setError(`Seleccioná una ${tab.parentLabel?.toLowerCase()}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = { codigo: c, descripcion: d, activo };
      if (hasParent && tab.parentKey) {
        payload[tab.parentKey] = parentId;
      }
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

  const colSpan = (hasParent ? 1 : 0) + (tab.grandParentEndpoint ? 1 : 0) + 4;

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
            {hasParent && tab.parentEndpoint && (
              <div className="flex-1">
                <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">{tab.parentLabel}</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90"
                >
                  <option value="">Seleccioná...</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={`${hasParent ? "flex-1" : "flex-1"}`}>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Código (2 caracteres)</label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 2))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={2}
                placeholder="ej: 11"
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
                placeholder="ej: Ciencias Sociales"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="nomenclador-activo"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="nomenclador-activo" className="text-xs text-gray-600 dark:text-gray-400">Activo</label>
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving || !codigo.trim() || !descripcion.trim() || (hasParent && !parentId)}>
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
              {tab.grandParentEndpoint && <th className="px-4 py-3 w-28">{tab.grandParentLabel}</th>}
              {hasParent && <th className="px-4 py-3 w-28">{tab.parentLabel}</th>}
              <th className="px-4 py-3 w-28">Código</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3 w-28">Estado</th>
              <th className="px-4 py-3 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colSpan} className="px-4 py-8 text-center">Cargando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">No hay registros.</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  {tab.grandParentEndpoint && (
                    <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {item[tab.grandParentDisplay as keyof NomencladorItem] as string}
                    </td>
                  )}
                  {hasParent && (
                    <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {item[tab.parentDisplay as keyof NomencladorItem] as string}
                    </td>
                  )}
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

export default function GestionNomencladorPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("configuracion.nomenclador");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("disciplinas");

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <>
      <PageMeta title="SACAD - Nomenclador" description="Gestión de disciplinas, subdisciplinas y especialidades" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Nomenclador" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-orange-500">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Nomenclador
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Gestioná disciplinas, subdisciplinas y especialidades.
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
          <NomencladorTable key={activeTab} tab={currentTab} canWrite={canWrite} />
        </div>
      </div>
    </>
  );
}
