import { useState, useRef, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { equivalenciasApi } from "../../api/services";
import { apiClient } from "../../api";
import { useAuth } from "../../context/auth/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface MateriaOption {
  id: number;
  codigo: string;
  nombre: string;
  plan_estudio: number;
  plan_estudio_codigo: string;
  carrera_nombre: string;
}

interface MateriaDisplay {
  id: number;
  codigo: string;
  nombre: string;
  plan_estudio: number;
  plan_estudio_codigo: string;
}

interface Equivalencia {
  id: number;
  plan_destino: number;
  plan_destino_nombre: string;
  materias_origen: number[];
  materias_destino: number[];
  materias_origen_display: MateriaDisplay[];
  materias_destino_display: MateriaDisplay[];
  tipo: string;
  porcentaje: number | null;
  resolucion: string;
  observaciones: string;
  activa: boolean;
}

interface EquivalenciaForm {
  plan_destino: string;
  materias_origen: MateriaOption[];
  materias_destino: MateriaOption[];
  tipo: string;
  porcentaje: string;
  resolucion: string;
  observaciones: string;
  activa: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

const emptyForm: EquivalenciaForm = {
  plan_destino: "",
  materias_origen: [],
  materias_destino: [],
  tipo: "total",
  porcentaje: "",
  resolucion: "",
  observaciones: "",
  activa: true,
};

// ── Searchable multi-select for materias ─────────────────────────
function MateriaMultiSelect({
  label,
  selected,
  onChange,
  placeholder,
  error,
  materias,
}: {
  label: string;
  selected: MateriaOption[];
  onChange: (items: MateriaOption[]) => void;
  placeholder?: string;
  error?: string;
  materias: MateriaOption[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = materias
    .filter(
      (m) =>
        !selected.some((s) => s.id === m.id) &&
        (`${m.codigo} ${m.nombre} ${m.plan_estudio_codigo} ${m.carrera_nombre}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    )
    .slice(0, 50);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <Label>{label}</Label>
      <div ref={ref} className="relative">
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {selected.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
              >
                {m.codigo}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s.id !== m.id))}
                  className="text-brand-400 hover:text-brand-600"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder={placeholder || "Buscar materia..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:placeholder-gray-500"
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {filtered.map((m) => (
              <li
                key={m.id}
                onClick={() => {
                  onChange([...selected, m]);
                  setSearch("");
                  setOpen(false);
                }}
                className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="font-medium">{m.codigo}</span> — {m.nombre}
                <span className="ml-2 text-xs text-gray-400">
                  {m.plan_estudio_codigo} · {m.carrera_nombre}
                </span>
              </li>
            ))}
          </ul>
        )}
        {open && filtered.length === 0 && search && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">
            Sin resultados
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function EquivalenciasPage() {
  const { data, loading, refetch } = useApiData<{ results: Equivalencia[] }>(
    "/equivalencias/"
  );
  const { data: planesData } = useApiData<
    { results: { id: number; codigo: string; carrera_nombre: string }[] }
  >("/planes/");
  const { data: materiasData } = useApiData<
    { results: MateriaOption[] }
  >("/materias/?limit=500");

  const materias = materiasData?.results || [];
  const { user } = useAuth();
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((data?.results?.length || 0) / pageSize));
  const paginated = data?.results?.slice((page - 1) * pageSize, page * pageSize) || [];
  const canWrite = user?.is_superuser || user?.group_names?.includes("Admin Universidad") || user?.group_names?.includes("Secretario Académico") || user?.group_names?.includes("Director Carrera");
  const modal = useModal();
  const [form, setForm] = useState<EquivalenciaForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // ── Consulta panel ──────────────────────────────────────────────
  const [consultaOpen, setConsultaOpen] = useState(false);
  const [consultaOrigen, setConsultaOrigen] = useState<MateriaOption[]>([]);
  const [consultaDestino, setConsultaDestino] = useState("");
  const [consultaResult, setConsultaResult] = useState<
    | {
        materia_destino_id: number;
        materia_destino_codigo: string;
        materia_destino_nombre: string;
        tipo: string;
        porcentaje: number | null;
        cascada?: boolean;
      }[]
    | null
  >(null);
  const [consulting, setConsulting] = useState(false);

  const planes = planesData?.results || [];
  useEffect(() => { setPage(1); }, [data]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    modal.openModal();
  };

  const openEdit = (eq: Equivalencia) => {
    setEditingId(eq.id);
    setErrors({});
    setFormError("");
    setForm({
      plan_destino: eq.plan_destino.toString(),
      materias_origen: eq.materias_origen_display.map((m) => ({
        id: m.id,
        codigo: m.codigo,
        nombre: m.nombre,
        plan_estudio: m.plan_estudio,
        plan_estudio_codigo: m.plan_estudio_codigo,
        carrera_nombre: "",
      })),
      materias_destino: eq.materias_destino_display.map((m) => ({
        id: m.id,
        codigo: m.codigo,
        nombre: m.nombre,
        plan_estudio: m.plan_estudio,
        plan_estudio_codigo: m.plan_estudio_codigo,
        carrera_nombre: "",
      })),
      tipo: eq.tipo,
      porcentaje: eq.porcentaje?.toString() ?? "",
      resolucion: eq.resolucion ?? "",
      observaciones: eq.observaciones ?? "",
      activa: eq.activa,
    });
    modal.openModal();
  };

  const openDelete = (eq: Equivalencia) => {
    setDeletingId(eq.id);
    setDeleteError("");
  };

  const handleConsultar = async () => {
    if (consultaOrigen.length === 0 || !consultaDestino) return;
    setConsulting(true);
    try {
      const res = await equivalenciasApi.consultar(
        consultaOrigen.map((m) => m.id),
        Number(consultaDestino)
      );
      setConsultaResult(res.data);
    } catch {
      setConsultaResult([]);
    }
    setConsulting(false);
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.plan_destino) newErrors.plan_destino = "Seleccioná un plan destino.";
    if (form.materias_origen.length === 0)
      newErrors.materias_origen = "Seleccioná al menos una materia origen.";
    if (form.materias_destino.length === 0)
      newErrors.materias_destino = "Seleccioná al menos una materia destino.";
    if (form.tipo === "parcial" && !form.porcentaje)
      newErrors.porcentaje = "Ingresá el porcentaje.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {
        plan_destino: Number(form.plan_destino),
        materias_origen: form.materias_origen.map((m) => m.id),
        materias_destino: form.materias_destino.map((m) => m.id),
        tipo: form.tipo,
        resolucion: form.resolucion,
        observaciones: form.observaciones,
        activa: form.activa,
      };
      if (form.tipo === "parcial" && form.porcentaje) {
        payload.porcentaje = Number(form.porcentaje);
      }
      if (editingId) {
        await apiClient.put(`/equivalencias/${editingId}/`, payload);
      } else {
        await apiClient.post("/equivalencias/", payload);
      }
      modal.closeModal();
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: Record<string, string | string[]>;
          };
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
      await apiClient.delete(`/equivalencias/${deletingId}/`);
      setDeletingId(null);
      refetch();
    } catch {
      setDeleteError("No se pudo eliminar la equivalencia.");
    }
  };

  return (
    <>
      <PageMeta
        title="SACAD - Equivalencias"
        description="Gestión de Equivalencias"
      />

      <PageBreadcrumb items={[{ label: "Equivalencias" }]} />

      <div className="space-y-6 mb-6">
        {/* ── Consultar Equivalencias ── */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <button
            onClick={() => setConsultaOpen(!consultaOpen)}
            className="w-full px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Consultar Equivalencias
            </h3>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${consultaOpen ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {consultaOpen && (
          <div className="p-6 space-y-4">
            <div>
              <Label>Materias Cursadas (origen)</Label>
              <MateriaMultiSelect
                label=""
                selected={consultaOrigen}
                onChange={setConsultaOrigen}
                placeholder="Buscar materias cursadas..."
                materias={materias}
              />
            </div>
            <div>
              <Label htmlFor="consulta_plan">Plan Destino</Label>
              <select
                id="consulta_plan"
                value={consultaDestino}
                onChange={(e) => setConsultaDestino(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
              >
                <option value="">Seleccionar plan...</option>
                {planes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.carrera_nombre} - {p.codigo}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleConsultar} disabled={consulting}>
              {consulting ? "Consultando..." : "Consultar"}
            </Button>

            {consultaResult && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Resultado
                </h4>
                {consultaResult.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Sin equivalencias encontradas
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {consultaResult.map((r, i) => (
                      <li
                        key={i}
                        className="p-3 text-sm border rounded-lg border-gray-200 dark:border-gray-700"
                      >
                        <span className="font-medium">
                          {r.materia_destino_codigo}
                        </span>{" "}
                        - {r.materia_destino_nombre}
                        <span className="ml-2 inline-flex px-2 py-0.5 text-xs rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500">
                          {r.tipo}
                        </span>
                        {r.porcentaje && (
                          <span className="ml-1 text-xs text-gray-400">
                            {r.porcentaje}%
                          </span>
                        )}
                        {r.cascada && (
                          <span className="ml-1 text-xs text-amber-500">
                            (cascada)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          )}
        </div>

        {/* ── Equivalencias Registradas ── */}
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Equivalencias Registradas
              </h3>
              {canWrite && (
                <Button
                  size="sm"
                  startIcon={
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="9" fill="white" />
                      <path
                        d="M12 8v8M8 12h8"
                        stroke="#465fff"
                        strokeWidth={2}
                        strokeLinecap="round"
                      />
                    </svg>
                  }
                  className="font-semibold"
                  onClick={openCreate}
                >
                  Agregar Equivalencia
                </Button>
              )}
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <p className="text-center text-gray-500">Cargando...</p>
            ) : data?.results?.length === 0 ? (
              <p className="text-center text-gray-400">
                No hay equivalencias registradas
              </p>
            ) : (
              <>
              <div className="space-y-2">
                {paginated.map((eq) => {
                  const origenPlan = eq.materias_origen_display[0]?.plan_estudio_codigo || "";
                  const destCodes = eq.materias_destino_display.map((m) => `${m.codigo} ${m.nombre}`).join(" + ");
                  const oriCodes = eq.materias_origen_display.map((m) => m.codigo).join(" + ");
                  return (
                    <div
                      key={eq.id}
                      className="flex items-center gap-2 p-3 border rounded-lg border-gray-200 dark:border-gray-700 text-sm"
                    >
                      <span className="text-gray-800 dark:text-white/90 font-medium">
                        {oriCodes || "Sin origen"}
                      </span>
                      <span className="text-xs text-gray-400">({origenPlan})</span>
                      <span className="text-gray-400">&gt;&gt;</span>
                      <span className="text-gray-800 dark:text-white/90 font-medium">
                        {destCodes || "Sin destino"}
                      </span>
                      <span className="text-xs text-gray-400">({eq.plan_destino_nombre})</span>
                      <span
                        className={`ml-auto inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                          eq.tipo === "total"
                            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-500"
                        }`}
                      >
                        {eq.tipo === "total" ? "Total" : "Parcial"}
                      </span>
                      {eq.porcentaje && (
                        <span className="text-xs text-gray-400">{eq.porcentaje}%</span>
                      )}
                      <span className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                        eq.activa
                          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {eq.activa ? "Activa" : "Inactiva"}
                      </span>
                      {canWrite && (
                        <>
                          <button onClick={() => openEdit(eq)} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openDelete(eq)} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <TrashBinIcon className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-500">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Siguiente
                  </button>
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal create/edit ── */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.closeModal}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Equivalencia" : "Agregar Equivalencia"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId
                ? "Modificá los datos de la equivalencia"
                : "Completá los datos para registrar una nueva equivalencia"}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col"
          >
            <div className="px-2 pb-3 space-y-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {formError}
                </div>
              )}

              <div>
                <Label htmlFor="plan_destino">Plan Destino</Label>
                <select
                  id="plan_destino"
                  value={form.plan_destino}
                  onChange={(e) =>
                    setForm({ ...form, plan_destino: e.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                >
                  <option value="">Seleccionar plan...</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.carrera_nombre} - {p.codigo}
                    </option>
                  ))}
                </select>
                {errors.plan_destino && (
                  <p className="mt-1 text-xs text-error-500">
                    {errors.plan_destino}
                  </p>
                )}
              </div>

              <MateriaMultiSelect
                label="Materias Origen"
                selected={form.materias_origen}
                onChange={(items) => setForm({ ...form, materias_origen: items })}
                placeholder="Buscar materias de origen..."
                error={errors.materias_origen}
                materias={materias}
              />

              <MateriaMultiSelect
                label="Materias Destino"
                selected={form.materias_destino}
                onChange={(items) => setForm({ ...form, materias_destino: items })}
                placeholder="Buscar materias de destino..."
                error={errors.materias_destino}
                materias={materias}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value="total">Total</option>
                    <option value="parcial">Parcial</option>
                  </select>
                </div>
                {form.tipo === "parcial" && (
                  <div>
                    <Label htmlFor="porcentaje">Porcentaje</Label>
                    <Input
                      id="porcentaje"
                      type="number"
                      min="1"
                      max="99"
                      value={form.porcentaje}
                      onChange={(e) =>
                        setForm({ ...form, porcentaje: e.target.value })
                      }
                      error={!!errors.porcentaje}
                    />
                    {errors.porcentaje && (
                      <p className="mt-1 text-xs text-error-500">
                        {errors.porcentaje}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="resolucion">Resolución</Label>
                <Input
                  id="resolucion"
                  placeholder="Ej: Ord. 123/2025"
                  value={form.resolucion}
                  onChange={(e) =>
                    setForm({ ...form, resolucion: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                  id="observaciones"
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  className="h-16 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm({ ...form, activa: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="activa" className="mb-0">
                  Equivalencia activa
                </Label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-6">
              <Button size="sm" variant="outline" onClick={modal.closeModal}>
                Cancelar
              </Button>
              <Button size="sm" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear equivalencia"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* ── Modal delete ── */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        className="max-w-[400px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Confirmar eliminación
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar esta equivalencia?
            </p>
            {deleteError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {deleteError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeletingId(null)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-error-500 text-white hover:bg-error-600"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
