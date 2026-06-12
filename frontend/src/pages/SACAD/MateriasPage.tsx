import { useState, useRef, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { apiClient } from "../../api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/auth/AuthContext";


const colorPalette = [
  { badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-500", row: "bg-blue-50/40 dark:bg-blue-500/[0.04]" },
  { badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-500", row: "bg-emerald-50/40 dark:bg-emerald-500/[0.04]" },
  { badge: "bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-500", row: "bg-purple-50/40 dark:bg-purple-500/[0.04]" },
  { badge: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-500", row: "bg-orange-50/40 dark:bg-orange-500/[0.04]" },
  { badge: "bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-500", row: "bg-pink-50/40 dark:bg-pink-500/[0.04]" },
  { badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-500", row: "bg-teal-50/40 dark:bg-teal-500/[0.04]" },
  { badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-500", row: "bg-cyan-50/40 dark:bg-cyan-500/[0.04]" },
  { badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-500", row: "bg-rose-50/40 dark:bg-rose-500/[0.04]" },
  { badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-500", row: "bg-amber-50/40 dark:bg-amber-500/[0.04]" },
  { badge: "bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-500", row: "bg-lime-50/40 dark:bg-lime-500/[0.04]" },
  { badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-500", row: "bg-indigo-50/40 dark:bg-indigo-500/[0.04]" },
  { badge: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-500", row: "bg-sky-50/40 dark:bg-sky-500/[0.04]" },
];

function hashName(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getBadgeClass(tipo: string): string {
  return colorPalette[hashName(tipo) % colorPalette.length].badge;
}

function getRowClass(tipo: string): string {
  return colorPalette[hashName(tipo) % colorPalette.length].row;
}

interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  año: number;
  cuatrimestre: string;
  creditos: number | null;
  periodo: string;
  carga_horaria_semanal: number;
  carga_horaria_total: number;
  tipo: number;
  tipo_nombre: string;
  contenidos_minimos: string;
  plan_estudio: number;
  plan_estudio_codigo: string;
  carrera_nombre: string;
}

interface PlanOption {
  id: number;
  codigo: string;
  carrera_nombre: string;
}

interface TipoOption {
  id: number;
  nombre: string;
  activo: boolean;
}

interface MateriaForm {
  plan_estudio: number;
  codigo: string;
  nombre: string;
  año: number;
  cuatrimestre: string;
  creditos: string;
  periodo: string;
  carga_horaria_semanal: string;
  carga_horaria_total: string;
  tipo: number;
  contenidos_minimos: string;
}

interface FieldErrors {
  [key: string]: string;
}

const emptyForm: MateriaForm = {
  plan_estudio: 0,
  codigo: "",
  nombre: "",
  año: 1,
  cuatrimestre: "1",
  creditos: "",
  periodo: "",
  carga_horaria_semanal: "",
  carga_horaria_total: "",
  tipo: 0,
  contenidos_minimos: "",
};

const CUATRI_OPTIONS = [
  { value: "1", label: "1er Cuatrimestre" },
  { value: "2", label: "2do Cuatrimestre" },
  { value: "anual", label: "Anual" },
];

export default function MateriasPage() {
  const { user } = useAuth();
  const canWrite = user?.is_superuser ||
    user?.group_names?.includes("Admin Universidad") ||
    user?.group_names?.includes("Secretario Académico") ||
    user?.group_names?.includes("Director Carrera");

  const [search, setSearch] = useState("");
  const qs = search ? `search=${encodeURIComponent(search)}` : "";
  const { data, loading, refetch } = useApiData<{ results: Materia[] }>(
    `/materias/${qs ? `?${qs}` : ""}`,
    [qs]
  );
  const { data: planesData } = useApiData<{ results: PlanOption[] }>(
    "/planes/",
    []
  );
  const { data: tiposData } = useApiData<{ results: TipoOption[] }>(
    "/tipos-materia/",
    []
  );

  const modal = useModal();
  const [form, setForm] = useState<MateriaForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [tipoSearch, setTipoSearch] = useState("");
  const [tipoOpen, setTipoOpen] = useState(false);
  const tipoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tipoRef.current && !tipoRef.current.contains(e.target as Node)) {
        setTipoOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const planes = planesData?.results || [];
  const tipos = tiposData?.results || [];

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      plan_estudio: planes.length === 1 ? planes[0].id : 0,
    });
    setTipoSearch("");
    setErrors({});
    setFormError("");
    modal.openModal();
  };

  const openEdit = (m: Materia) => {
    setEditingId(m.id);
    setErrors({});
    setFormError("");
    setForm({
      plan_estudio: m.plan_estudio,
      codigo: m.codigo,
      nombre: m.nombre,
      año: m.año,
      cuatrimestre: m.cuatrimestre,
      creditos: m.creditos?.toString() ?? "",
      periodo: m.periodo ?? "",
      carga_horaria_semanal: m.carga_horaria_semanal.toString(),
      carga_horaria_total: m.carga_horaria_total.toString(),
      tipo: m.tipo,
      contenidos_minimos: m.contenidos_minimos ?? "",
    });
    const t = tipos.find((t) => t.id === m.tipo);
    setTipoSearch(t?.nombre ?? "");
    modal.openModal();
  };

  const openDelete = (m: Materia) => {
    setDeletingId(m.id);
    setDeleteError("");
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.plan_estudio) newErrors.plan_estudio = "Seleccioná un plan.";
    if (!form.codigo.trim()) newErrors.codigo = "Este campo es obligatorio.";
    if (!form.nombre.trim()) newErrors.nombre = "Este campo es obligatorio.";
    if (!form.carga_horaria_total.trim()) newErrors.carga_horaria_total = "Este campo es obligatorio.";
    if (!form.carga_horaria_semanal.trim()) newErrors.carga_horaria_semanal = "Este campo es obligatorio.";
    if (!form.tipo) newErrors.tipo = "Seleccioná un tipo.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        creditos: form.creditos ? Number(form.creditos) : null,
        carga_horaria_semanal: Number(form.carga_horaria_semanal),
        carga_horaria_total: Number(form.carga_horaria_total),
        año: Number(form.año),
      };
      if (editingId) {
        await apiClient.put(`/materias/${editingId}/`, payload);
      } else {
        await apiClient.post("/materias/", payload);
      }
      modal.closeModal();
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: Record<string, string | string[]> };
        };
        if (axiosErr.response?.status === 401) {
          setFormError("Iniciá sesión para realizar esta acción.");
          return;
        }
        const apiErrors = axiosErr.response?.data;
        if (apiErrors) {
          const mapped: FieldErrors = {};
          for (const [key, msgs] of Object.entries(apiErrors)) {
            mapped[key] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          }
          setErrors(mapped);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiClient.delete(`/materias/${deletingId}/`);
      setDeletingId(null);
      refetch();
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setDeleteError(detail || "No se pudo eliminar la materia. Puede que tenga correlativas asociadas.");
    }
  };

  const tiposFiltrados = tipos.filter((t) =>
    t.nombre.toLowerCase().includes(tipoSearch.toLowerCase())
  );

  const selectedTipo = tipos.find((t) => t.id === form.tipo);

  return (
    <>
      <PageMeta title="SACAD - Materias" description="Gestión de Materias" />

      <PageBreadcrumb items={[{ label: "Materias" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Materias
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {canWrite && <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Agregar Materia</Button>}
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Créditos</th>
                <th className="px-4 py-3">Horas Sem.</th>
                <th className="px-4 py-3">Horas Tot.</th>
                <th className="px-4 py-3">Tipo</th>
                {canWrite && <th className="px-4 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center">Cargando...</td></tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                    No hay materias registradas
                  </td>
                </tr>
              ) : (
                data?.results?.map((m) => (
                  <tr key={m.id} className={`border-b border-gray-200 dark:border-gray-700 ${getRowClass(m.tipo_nombre)}`}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{m.codigo}</td>
                    <td className="px-4 py-3">{m.nombre}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.carrera_nombre}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.plan_estudio_codigo}</td>
                    <td className="px-4 py-3">{m.año}</td>
                    <td className="px-4 py-3">{m.periodo || m.cuatrimestre}</td>
                    <td className="px-4 py-3 font-medium">{m.creditos ?? "-"}</td>
                    <td className="px-4 py-3">{m.carga_horaria_semanal}</td>
                    <td className="px-4 py-3">{m.carga_horaria_total}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getBadgeClass(m.tipo_nombre)}`}>
                        {m.tipo_nombre}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(m)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDelete(m)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Materia" : "Agregar Materia"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId ? "Modificá los datos de la materia" : "Completá los datos para registrar una nueva materia"}
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-col"
          >
            <div className="px-2 pb-3 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {formError}
                </div>
              )}

              <div>
                <Label htmlFor="plan_estudio">Plan de Estudio</Label>
                <select
                  id="plan_estudio"
                  value={form.plan_estudio}
                  onChange={(e) => setForm({ ...form, plan_estudio: Number(e.target.value) })}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                >
                  <option value={0}>Seleccionar plan...</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.carrera_nombre} - {p.codigo}
                    </option>
                  ))}
                </select>
                {errors.plan_estudio && (
                  <p className="mt-1 text-xs text-error-500">{errors.plan_estudio}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    placeholder="Ej: 510303"
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    error={!!errors.codigo}
                  />
                  {errors.codigo && <p className="mt-1 text-xs text-error-500">{errors.codigo}</p>}
                </div>
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Principios de Administración"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    error={!!errors.nombre}
                  />
                  {errors.nombre && <p className="mt-1 text-xs text-error-500">{errors.nombre}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="año">Año</Label>
                  <Input
                    id="año"
                    type="number"
                    min="1"
                    max="10"
                    value={form.año}
                    onChange={(e) => setForm({ ...form, año: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="cuatrimestre">Cuatrimestre</Label>
                  <select
                    id="cuatrimestre"
                    value={form.cuatrimestre}
                    onChange={(e) => setForm({ ...form, cuatrimestre: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    {CUATRI_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="periodo">Período (original)</Label>
                  <Input
                    id="periodo"
                    placeholder="Ej: B1/1C, 1C"
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="creditos">Créditos</Label>
                  <Input
                    id="creditos"
                    type="number"
                    min="0"
                    value={form.creditos}
                    onChange={(e) => setForm({ ...form, creditos: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="carga_horaria_semanal">Horas Semanales</Label>
                  <Input
                    id="carga_horaria_semanal"
                    type="number"
                    min="0"
                    value={form.carga_horaria_semanal}
                    onChange={(e) => setForm({ ...form, carga_horaria_semanal: e.target.value })}
                    error={!!errors.carga_horaria_semanal}
                  />
                  {errors.carga_horaria_semanal && (
                    <p className="mt-1 text-xs text-error-500">{errors.carga_horaria_semanal}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="carga_horaria_total">Horas Totales</Label>
                  <Input
                    id="carga_horaria_total"
                    type="number"
                    min="0"
                    value={form.carga_horaria_total}
                    onChange={(e) => setForm({ ...form, carga_horaria_total: e.target.value })}
                    error={!!errors.carga_horaria_total}
                  />
                  {errors.carga_horaria_total && (
                    <p className="mt-1 text-xs text-error-500">{errors.carga_horaria_total}</p>
                  )}
                </div>
              </div>

              <div ref={tipoRef} className="relative">
                <Label htmlFor="tipo-search">Tipo</Label>
                <input
                  id="tipo-search"
                  type="text"
                  placeholder="Buscar tipo..."
                  value={tipoSearch}
                  onFocus={() => setTipoOpen(true)}
                  onChange={(e) => {
                    setTipoSearch(e.target.value);
                    setTipoOpen(true);
                    setForm({ ...form, tipo: 0 });
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                />
                {tipoOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-48 overflow-y-auto">
                    {tiposFiltrados.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">Sin resultados</div>
                    ) : (
                      tiposFiltrados.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            form.tipo === t.id
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                              : "text-gray-800 dark:text-white/90"
                          }`}
                          onClick={() => {
                            setForm({ ...form, tipo: t.id });
                            setTipoSearch(t.nombre);
                            setTipoOpen(false);
                          }}
                        >
                          <span className="capitalize">{t.nombre}</span>
                          {!t.activo && (
                            <span className="ml-2 text-xs text-gray-400">(inactivo)</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedTipo && !tipoOpen && (
                  <p className="mt-1 text-xs text-gray-400 capitalize">
                    Seleccionado: {selectedTipo.nombre}
                  </p>
                )}
                {errors.tipo && (
                  <p className="mt-1 text-xs text-error-500">{errors.tipo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contenidos_minimos">Contenidos Mínimos</Label>
                <textarea
                  id="contenidos_minimos"
                  rows={3}
                  value={form.contenidos_minimos}
                  onChange={(e) => setForm({ ...form, contenidos_minimos: e.target.value })}
                  className="h-20 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-6">
              <Button size="sm" variant="outline" onClick={modal.closeModal}>
                Cancelar
              </Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear materia"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Confirmar eliminación
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar esta materia? Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {deleteError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>
              Cancelar
            </Button>
            <Button size="sm" className="bg-error-500 text-white hover:bg-error-600" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
