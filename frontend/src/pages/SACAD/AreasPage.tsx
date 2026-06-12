import { useState, useRef, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { TrashBinIcon, PencilIcon } from "../../icons";
import { apiClient } from "../../api";

interface PlanOption {
  id: number;
  codigo: string;
  carrera_nombre: string;
}

interface Area {
  id: number;
  nombre: string;
  orden: number;
  plan_estudio: number;
  plan_estudio_codigo: string;
  materias_count: number;
}

interface FieldErrors {
  nombre?: string;
  plan_estudio?: string;
}

export default function AreasPage() {
  const { data: areas, loading, refetch } = useApiData<{ results: Area[] }>("/areas/");
  const { data: planes } = useApiData<{ results: PlanOption[] }>("/planes/");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState(0);
  const [planEstudio, setPlanEstudio] = useState<number | undefined>(undefined);
  const [planSearch, setPlanSearch] = useState("");
  const [planDropdownOpen, setPlanDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (planRef.current && !planRef.current.contains(e.target as Node)) {
        setPlanDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const planOptions = planes?.results ?? [];
  const planFiltered = planSearch
    ? planOptions.filter((p) =>
        `${p.carrera_nombre} ${p.codigo}`.toLowerCase().includes(planSearch.toLowerCase())
      )
    : planOptions;

  const openCreate = () => {
    setEditingId(null);
    setShowCreate(true);
    setNombre("");
    setOrden(0);
    setPlanEstudio(undefined);
    setPlanSearch("");
    setError("");
    setErrors({});
    setPlanDropdownOpen(false);
  };

  const openEdit = (a: Area) => {
    setEditingId(a.id);
    setShowCreate(true);
    setNombre(a.nombre);
    setOrden(a.orden);
    setPlanEstudio(a.plan_estudio);
    const p = planOptions.find((x) => x.id === a.plan_estudio);
    setPlanSearch(p ? `${p.carrera_nombre} - ${p.codigo}` : "");
    setError("");
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!planEstudio) newErrors.plan_estudio = "Seleccioná un plan de estudio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setError("");
    try {
      const payload = { nombre: nombre.trim(), orden, plan_estudio: planEstudio };
      if (editingId) {
        await apiClient.put(`/areas/${editingId}/`, payload);
      } else {
        await apiClient.post("/areas/", payload);
      }
      setEditingId(null);
      setShowCreate(false);
      setNombre("");
      setOrden(0);
      setPlanEstudio(undefined);
      setPlanSearch("");
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
      await apiClient.delete(`/areas/${deleteId}/`);
      setDeleteId(null);
      setDeleteError("");
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 409) {
        setDeleteError(axiosErr.response.data?.detail || "El área tiene materias asociadas. Eliminalas primero.");
        return;
      }
      setDeleteError("No se pudo eliminar el área.");
    }
  };

  const items = areas?.results ?? [];

  return (
    <>
      <PageMeta title="SACAD - Áreas" description="Gestión de áreas curriculares" />

      <PageBreadcrumb items={[{ label: "Áreas Curriculares" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Áreas Curriculares
            </h3>
            <div className="flex items-center gap-3">
              <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Agregar Área</Button>
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div ref={planRef} className="relative">
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Plan de Estudio</label>
                  <input
                    type="text"
                    placeholder="Buscá un plan..."
                    value={planSearch}
                    onChange={(e) => {
                      setPlanSearch(e.target.value);
                      setPlanEstudio(undefined);
                      setPlanDropdownOpen(true);
                    }}
                    onFocus={() => setPlanDropdownOpen(true)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400 ${
                      errors.plan_estudio ? "border-error-500" : "border-gray-200 dark:border-gray-700"
                    }`}
                  />
                  {planDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {planFiltered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                      ) : (
                        planFiltered.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              planEstudio === p.id
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                                : "text-gray-800 dark:text-white/90"
                            }`}
                            onClick={() => {
                              setPlanEstudio(p.id);
                              setPlanSearch(`${p.carrera_nombre} - ${p.codigo}`);
                              setPlanDropdownOpen(false);
                            }}
                          >
                            {p.carrera_nombre} - {p.codigo}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {errors.plan_estudio && <p className="mt-1 text-xs text-error-500">{errors.plan_estudio}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="ej: Ciencias Sociales"
                    className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-error-500">{errors.nombre}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Orden</label>
                  <input
                    type="number"
                    min="0"
                    value={orden}
                    onChange={(e) => setOrden(Number(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button size="sm" onClick={handleSave} disabled={saving || !nombre.trim()}>
                  {saving ? "Guardando..." : editingId ? "Guardar" : "Crear"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setShowCreate(false); setNombre(""); setOrden(0); setPlanEstudio(undefined); setPlanSearch(""); setError(""); setErrors({}); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Plan de Estudio</th>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Materias</th>
                  <th className="px-4 py-3 w-28">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center">Cargando...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay áreas registradas.</td></tr>
                ) : (
                  items.map((a) => (
                    <tr key={a.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{a.nombre}</td>
                      <td className="px-4 py-3">{a.plan_estudio_codigo}</td>
                      <td className="px-4 py-3">{a.orden}</td>
                      <td className="px-4 py-3">{a.materias_count}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
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
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Eliminar área</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar esta área? Las materias que la usan no podrán eliminarla.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">{deleteError}</div>
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
