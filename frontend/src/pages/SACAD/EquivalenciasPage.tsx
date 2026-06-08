import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { PencilIcon, TrashBinIcon, PlusIcon } from "../../icons";
import { equivalenciasApi } from "../../api/services";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface Equivalencia {
  id: number;
  plan_destino: number;
  plan_destino_nombre: string;
  materias_origen: number[];
  materias_destino: number[];
  materias_origen_display: { id: number; codigo: string; nombre: string }[];
  materias_destino_display: { id: number; codigo: string; nombre: string }[];
  tipo: string;
  porcentaje: number | null;
  resolucion: string;
  observaciones: string;
  activa: boolean;
}

interface EquivalenciaForm {
  plan_destino: string;
  materias_origen: string;
  materias_destino: string;
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
  materias_origen: "",
  materias_destino: "",
  tipo: "total",
  porcentaje: "",
  resolucion: "",
  observaciones: "",
  activa: true,
};

export default function EquivalenciasPage() {
  const { data, loading, refetch } = useApiData<{ results: Equivalencia[] }>(
    "/equivalencias/"
  );
  const { data: planesData } = useApiData<{ results: { id: number; codigo: string; carrera_nombre: string }[] }>(
    "/planes/"
  );

  const modal = useModal();
  const [form, setForm] = useState<EquivalenciaForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [consultaOrigen, setConsultaOrigen] = useState("");
  const [consultaDestino, setConsultaDestino] = useState("");
  const [consultaResult, setConsultaResult] = useState<unknown[] | null>(null);
  const [consulting, setConsulting] = useState(false);

  const planes = planesData?.results || [];

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
      materias_origen: eq.materias_origen?.join(",") ?? eq.materias_origen_display.map((m) => m.id).join(","),
      materias_destino: eq.materias_destino?.join(",") ?? eq.materias_destino_display.map((m) => m.id).join(","),
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
    if (!consultaOrigen || !consultaDestino) return;
    setConsulting(true);
    try {
      const res = await equivalenciasApi.consultar(
        Number(consultaOrigen),
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
    if (!form.materias_origen.trim()) newErrors.materias_origen = "Ingresá IDs de materias origen.";
    if (!form.materias_destino.trim()) newErrors.materias_destino = "Ingresá IDs de materias destino.";
    if (form.tipo === "parcial" && !form.porcentaje) newErrors.porcentaje = "Ingresá el porcentaje.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      const materias_origen = form.materias_origen.split(",").map(Number).filter(Boolean);
      const materias_destino = form.materias_destino.split(",").map(Number).filter(Boolean);
      const payload: Record<string, unknown> = {
        plan_destino: Number(form.plan_destino),
        materias_origen,
        materias_destino,
        tipo: form.tipo,
        resolucion: form.resolucion,
        observaciones: form.observaciones,
        activa: form.activa,
      };
      if (form.tipo === "parcial" && form.porcentaje) {
        payload.porcentaje = Number(form.porcentaje);
      }
      if (editingId) {
        await equivalenciasApi.update(editingId, payload);
      } else {
        await equivalenciasApi.create(payload);
      }
      modal.closeModal();
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: Record<string, string | string[]> };
        };
        if (axiosErr.response?.status === 401) {
          setFormError("Debe iniciar sesión para realizar esta acción.");
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
      await equivalenciasApi.delete(deletingId);
      setDeletingId(null);
      refetch();
    } catch {
      setDeleteError("Error al eliminar la equivalencia.");
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Equivalencias" description="Gestión de Equivalencias" />

      <PageBreadcrumb items={[{ label: "Equivalencias" }]} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Consultar Equivalencias
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <Label htmlFor="consulta_origen">ID Materia Origen</Label>
              <Input
                id="consulta_origen"
                type="number"
                value={consultaOrigen}
                onChange={(e) => setConsultaOrigen(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="consulta_destino">ID Plan Destino</Label>
              <Input
                id="consulta_destino"
                type="number"
                value={consultaDestino}
                onChange={(e) => setConsultaDestino(e.target.value)}
              />
            </div>
            <Button
              onClick={handleConsultar}
              disabled={consulting}
            >
              {consulting ? "Consultando..." : "Consultar"}
            </Button>

            {consultaResult && (
              <div className="mt-4">
                <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                  Resultado
                </h4>
                {consultaResult.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin equivalencias encontradas</p>
                ) : (
                  <ul className="space-y-2">
                    {(consultaResult as Array<{
                      materia_destino_nombre: string;
                      materia_destino_codigo: string;
                      tipo: string;
                      porcentaje: number | null;
                    }>).map((r, i) => (
                      <li
                        key={i}
                        className="p-3 text-sm border rounded-lg border-gray-200 dark:border-gray-700"
                      >
                        <span className="font-medium">{r.materia_destino_codigo}</span> -{" "}
                        {r.materia_destino_nombre}
                        <span className="ml-2 inline-flex px-2 py-0.5 text-xs rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500">
                          {r.tipo}
                        </span>
                        {r.porcentaje && (
                          <span className="ml-1 text-xs text-gray-400">{r.porcentaje}%</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Equivalencias Registradas
              </h3>
              <Button size="sm" onClick={openCreate}>
                <PlusIcon className="w-4 h-4" />
                Agregar
              </Button>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-96">
            {loading ? (
              <p className="text-center text-gray-500">Cargando...</p>
            ) : data?.results?.length === 0 ? (
              <p className="text-center text-gray-400">No hay equivalencias registradas</p>
            ) : (
              <div className="space-y-3">
                {data?.results?.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3 border rounded-lg border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">#{eq.id}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            eq.activa
                              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {eq.activa ? "Activa" : "Inactiva"}
                        </span>
                        <button
                          onClick={() => openEdit(eq)}
                          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDelete(eq)}
                          className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <TrashBinIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {eq.materias_origen_display.map((m) => m.nombre).join(" + ") || "Sin origen"}
                    </p>
                    <p className="text-xs text-gray-400">&rarr;</p>
                    <p className="text-xs font-medium text-gray-800 dark:text-white/90">
                      {eq.materias_destino_display.map((m) => m.nombre).join(" + ") || "Sin destino"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {eq.tipo} {eq.porcentaje ? `- ${eq.porcentaje}%` : ""} | {eq.plan_destino_nombre}
                      {eq.resolucion && ` | ${eq.resolucion}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[600px] m-4">
        <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Equivalencia" : "Agregar Equivalencia"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId ? "Modificá los datos de la equivalencia" : "Completá los datos para registrar una nueva equivalencia"}
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
                <Label htmlFor="plan_destino">Plan Destino</Label>
                <select
                  id="plan_destino"
                  value={form.plan_destino}
                  onChange={(e) => setForm({ ...form, plan_destino: e.target.value })}
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
                  <p className="mt-1 text-xs text-error-500">{errors.plan_destino}</p>
                )}
              </div>

              <div>
                <Label htmlFor="materias_origen">Materias Origen (IDs separados por coma)</Label>
                <Input
                  id="materias_origen"
                  placeholder="Ej: 1,2,3"
                  value={form.materias_origen}
                  onChange={(e) => setForm({ ...form, materias_origen: e.target.value })}
                  error={!!errors.materias_origen}
                />
                {errors.materias_origen && (
                  <p className="mt-1 text-xs text-error-500">{errors.materias_origen}</p>
                )}
              </div>

              <div>
                <Label htmlFor="materias_destino">Materias Destino (IDs separados por coma)</Label>
                <Input
                  id="materias_destino"
                  placeholder="Ej: 4,5"
                  value={form.materias_destino}
                  onChange={(e) => setForm({ ...form, materias_destino: e.target.value })}
                  error={!!errors.materias_destino}
                />
                {errors.materias_destino && (
                  <p className="mt-1 text-xs text-error-500">{errors.materias_destino}</p>
                )}
              </div>

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
                      onChange={(e) => setForm({ ...form, porcentaje: e.target.value })}
                      error={!!errors.porcentaje}
                    />
                    {errors.porcentaje && (
                      <p className="mt-1 text-xs text-error-500">{errors.porcentaje}</p>
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
                  onChange={(e) => setForm({ ...form, resolucion: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <textarea
                  id="observaciones"
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  className="h-16 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activa"
                  checked={form.activa}
                  onChange={(e) => setForm({ ...form, activa: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <Label htmlFor="activa" className="mb-0">Equivalencia activa</Label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-6">
              <Button size="sm" variant="outline" onClick={modal.closeModal}>
                Cancelar
              </Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear equivalencia"}
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
              ¿Estás seguro de que querés eliminar esta equivalencia?
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
