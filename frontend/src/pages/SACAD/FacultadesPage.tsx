import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Switch from "../../components/form/switch/Switch";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { apiClient } from "../../api";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useAuth } from "../../context/auth/AuthContext";
import { useMenuPermissions } from "../../hooks/useMenuPermissions";

interface Facultad {
  id: number;
  codigo: string;
  nombre_corto: string;
  nombre: string;
  activa: boolean;
  carreras_count?: number;
  sedes_count?: number;
}

interface FacultadForm {
  codigo: string;
  nombre_corto: string;
  nombre: string;
  activa: boolean;
}

interface FieldErrors {
  codigo?: string;
  nombre_corto?: string;
  nombre?: string;
}

const emptyForm: FacultadForm = {
  codigo: "",
  nombre_corto: "",
  nombre: "",
  activa: true,
};

export default function FacultadesPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("facultades");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const params = new URLSearchParams();
  if (filter) params.set("search", filter);
  if (statusFilter !== "todas") params.set("activa", statusFilter);
  const qs = params.toString();
  const { data, loading, refetch } = useApiData<{ results: Facultad[] }>(
    `/facultades/${qs ? `?${qs}` : ""}`,
    [qs]
  );
  const modal = useModal();

  const [form, setForm] = useState<FacultadForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBlockedReason, setDeleteBlockedReason] = useState("");

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    modal.openModal();
  };

  const openEdit = (f: Facultad) => {
    setEditingId(f.id);
    setErrors({});
    setFormError("");
    setForm({
      codigo: f.codigo,
      nombre_corto: f.nombre_corto,
      nombre: f.nombre,
      activa: f.activa,
    });
    modal.openModal();
  };

  const openDelete = (f: Facultad) => {
    if (f.sedes_count && f.sedes_count > 0) {
      setDeleteBlockedReason(
              `La facultad "${f.nombre}" tiene ${f.sedes_count} sede${f.sedes_count === 1 ? "" : "s"} asociada${f.sedes_count === 1 ? "" : "s"}. Eliminálas primero.`
            );
      return;
    }
    if (f.carreras_count && f.carreras_count > 0) {
      setDeleteBlockedReason(
              `La facultad "${f.nombre}" tiene ${f.carreras_count} carrera${f.carreras_count === 1 ? "" : "s"} asociada${f.carreras_count === 1 ? "" : "s"}. Eliminalas primero.`
            );
      return;
    }
    setDeletingId(f.id);
    setDeleteError("");
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.codigo.trim()) newErrors.codigo = "Este campo es obligatorio.";
    if (!form.nombre_corto.trim()) newErrors.nombre_corto = "Este campo es obligatorio.";
    if (!form.nombre.trim()) newErrors.nombre = "Este campo es obligatorio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await apiClient.put(`/facultades/${editingId}/`, form);
      } else {
        await apiClient.post("/facultades/", form);
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
            if (key in emptyForm) {
              mapped[key as keyof FieldErrors] = Array.isArray(msgs) ? msgs[0] : String(msgs);
            }
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
      await apiClient.delete(`/facultades/${deletingId}/`);
      setDeletingId(null);
      refetch();
    } catch {
      setDeleteError("No se pudo eliminar la facultad.");
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Facultades" description="Gestión de Facultades" />

      <PageBreadcrumb items={[{ label: "Facultades" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Facultades
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90"
              >
                <option value="todas">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
              <Input
                placeholder="Buscar..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {canWrite && <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Agregar Facultad</Button>}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre Corto</th>
                <th className="px-4 py-3">Nombre Completo</th>
                <th className="px-4 py-3">Sedes</th>
                <th className="px-4 py-3">Carreras</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No hay facultades registradas
                  </td>
                </tr>
              ) : (
                data?.results?.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {f.codigo}
                    </td>
                    <td className="px-4 py-3">{f.nombre_corto}</td>
                    <td className="px-4 py-3">{f.nombre}</td>
                    <td className="px-4 py-3">{f.sedes_count ?? "-"}</td>
                    <td className="px-4 py-3">{f.carreras_count ?? "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          f.activa
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500"
                        }`}
                      >
                        {f.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <div className="relative group">
                            <button
                              onClick={() => openEdit(f)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col items-center z-50">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">Editar</div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => openDelete(f)}
                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            >
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col items-center z-50">
                              <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                              <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">Eliminar</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Facultad" : "Agregar Facultad"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId
                ? "Modificá los datos de la facultad"
                : "Completá los datos para registrar una nueva facultad"}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex flex-col"
          >
            <div className="px-2 pb-3 space-y-5">
              {formError && (
                <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {formError}
                </div>
              )}
              <div>
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: FCE"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  error={!!errors.codigo}
                />
                {errors.codigo && (
                  <p className="mt-1 text-xs text-error-500">{errors.codigo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nombre_corto">Nombre Corto</Label>
                <Input
                  id="nombre_corto"
                  placeholder="Ej: Ciencias Económicas"
                  value={form.nombre_corto}
                  onChange={(e) =>
                    setForm({ ...form, nombre_corto: e.target.value })
                  }
                  error={!!errors.nombre_corto}
                />
                {errors.nombre_corto && (
                  <p className="mt-1 text-xs text-error-500">{errors.nombre_corto}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Facultad de Ciencias Económicas"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  error={!!errors.nombre}
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-error-500">{errors.nombre}</p>
                )}
              </div>

              <div key={editingId ?? "create"}>
                <Switch
                  label="Facultad activa"
                  defaultChecked={form.activa}
                  onChange={(checked) => setForm({ ...form, activa: checked })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-6">
              <Button
                size="sm"
                variant="outline"
                onClick={modal.closeModal}
              >
                Cancelar
              </Button>
              <Button size="sm" disabled={saving}>
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Guardar cambios"
                  : "Crear facultad"}
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
              ¿Estás seguro de que querés eliminar esta facultad? Esta acción no se puede deshacer.
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
            <Button size="sm" className="bg-error-500 text-white hover:bg-error-600" onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteBlockedReason} onClose={() => setDeleteBlockedReason("")} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              No se puede eliminar
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {deleteBlockedReason}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteBlockedReason("")}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
