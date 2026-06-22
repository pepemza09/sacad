import { useState, useRef, useEffect } from "react";
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

interface FacultadOption {
  id: number;
  nombre: string;
}

interface Sede {
  id: number;
  codigo: string;
  nombre: string;
  facultad: number;
  facultad_nombre: string;
  activa: boolean;
  direccion: string;
  localidad: string;
}

interface SedeForm {
  codigo: string;
  nombre: string;
  facultad: number | undefined;
  activa: boolean;
  direccion: string;
  localidad: string;
}

interface FieldErrors {
  codigo?: string;
  nombre?: string;
  facultad?: string;
  direccion?: string;
  localidad?: string;
}

const emptyForm: SedeForm = {
  codigo: "",
  nombre: "",
  facultad: undefined,
  activa: true,
  direccion: "",
  localidad: "",
};

export default function SedesPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("sedes");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [facultadFilter, setFacultadFilter] = useState("");
  const params = new URLSearchParams();
  if (filter) params.set("search", filter);
  if (statusFilter !== "todas") params.set("activa", statusFilter);
  if (facultadFilter) params.set("facultad", facultadFilter);
  const qs = params.toString();
  const { data, loading, refetch } = useApiData<{ results: Sede[] }>(
    `/sedes/${qs ? `?${qs}` : ""}`,
    [qs]
  );
  const { data: facultades } = useApiData<{ results: FacultadOption[] }>(
    "/facultades/?activa=true"
  );
  const modal = useModal();

  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const [facultadSearch, setFacultadSearch] = useState("");
  const [facultadDropdownOpen, setFacultadDropdownOpen] = useState(false);
  const facultadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (facultadRef.current && !facultadRef.current.contains(e.target as Node)) {
        setFacultadDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const facultadOptions = facultades?.results ?? [];
  const facultadFiltered = facultadSearch
    ? facultadOptions.filter((f) =>
        f.nombre.toLowerCase().includes(facultadSearch.toLowerCase())
      )
    : facultadOptions;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setFacultadSearch("");
    setFacultadDropdownOpen(false);
    modal.openModal();
  };

  const openEdit = (s: Sede) => {
    setEditingId(s.id);
    setErrors({});
    setFormError("");
    setFacultadSearch(s.facultad_nombre);
    setFacultadDropdownOpen(false);
    setForm({
      codigo: s.codigo,
      nombre: s.nombre,
      facultad: s.facultad,
      activa: s.activa,
      direccion: s.direccion,
      localidad: s.localidad,
    });
    modal.openModal();
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.codigo.trim()) newErrors.codigo = "Este campo es obligatorio.";
    if (!form.nombre.trim()) newErrors.nombre = "Este campo es obligatorio.";
    if (!form.facultad) newErrors.facultad = "Seleccioná una facultad.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      if (editingId) {
        await apiClient.put(`/sedes/${editingId}/`, form);
      } else {
        await apiClient.post("/sedes/", form);
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
      await apiClient.delete(`/sedes/${deletingId}/`);
      setDeletingId(null);
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as {
          response?: { status?: number; data?: { detail?: string } };
        };
        if (axiosErr.response?.status === 409) {
          setDeleteError(
            axiosErr.response.data?.detail ||
              "La sede tiene carreras asociadas. Eliminalas primero."
          );
          return;
        }
      }
      setDeleteError("No se pudo eliminar la sede.");
    }
  };

  const [deleteError, setDeleteError] = useState("");

  return (
    <>
      <PageMeta title="SACAD - Sedes" description="Gestión de Sedes" />

      <PageBreadcrumb items={[{ label: "Sedes" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sedes
            </h3>
            <div className="flex items-center gap-3">
              <select
                value={facultadFilter}
                onChange={(e) => setFacultadFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90"
              >
                <option value="">Todas las facultades</option>
                {facultades?.results?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                  </option>
                ))}
              </select>
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
              {canWrite && <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Agregar Sede</Button>}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Facultad</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Localidad</th>
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
                    No hay sedes registradas
                  </td>
                </tr>
              ) : (
                data?.results?.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {s.codigo}
                    </td>
                    <td className="px-4 py-3">{s.nombre}</td>
                    <td className="px-4 py-3">{s.facultad_nombre}</td>
                    <td className="px-4 py-3">{s.direccion || "-"}</td>
                    <td className="px-4 py-3">{s.localidad || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          s.activa
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500"
                        }`}
                      >
                        {s.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <div className="relative group">
                            <button
                              onClick={() => openEdit(s)}
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
                              onClick={() => openDelete(s.id)}
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
              {editingId ? "Editar Sede" : "Agregar Sede"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId
                ? "Modificá los datos de la sede"
                : "Completá los datos para registrar una nueva sede"}
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
              <div ref={facultadRef} className="relative">
                <Label htmlFor="facultad">Facultad</Label>
                <input
                  id="facultad"
                  type="text"
                  placeholder="Buscá una facultad..."
                  value={facultadSearch}
                  onChange={(e) => {
                    setFacultadSearch(e.target.value);
                    setForm({ ...form, facultad: undefined });
                    setFacultadDropdownOpen(true);
                  }}
                  onFocus={() => setFacultadDropdownOpen(true)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400 ${
                    errors.facultad
                      ? "border-error-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {facultadDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {facultadFiltered.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                    ) : (
                      facultadFiltered.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            form.facultad === f.id
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                              : "text-gray-800 dark:text-white/90"
                          }`}
                          onClick={() => {
                            setForm({ ...form, facultad: f.id });
                            setFacultadSearch(f.nombre);
                            setFacultadDropdownOpen(false);
                          }}
                        >
                          {f.nombre}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {errors.facultad && (
                  <p className="mt-1 text-xs text-error-500">{errors.facultad}</p>
                )}
              </div>

              <div>
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: SEDE001"
                  value={form.codigo}
                  onChange={(e) =>
                    setForm({ ...form, codigo: e.target.value })
                  }
                  error={!!errors.codigo}
                />
                {errors.codigo && (
                  <p className="mt-1 text-xs text-error-500">{errors.codigo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Sede Central"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  error={!!errors.nombre}
                />
                {errors.nombre && (
                  <p className="mt-1 text-xs text-error-500">{errors.nombre}</p>
                )}
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Ej: Av. Libertador 1234"
                  value={form.direccion}
                  onChange={(e) =>
                    setForm({ ...form, direccion: e.target.value })
                  }
                  error={!!errors.direccion}
                />
                {errors.direccion && (
                  <p className="mt-1 text-xs text-error-500">{errors.direccion}</p>
                )}
              </div>

              <div>
                <Label htmlFor="localidad">Localidad</Label>
                <Input
                  id="localidad"
                  placeholder="Ej: Mendoza"
                  value={form.localidad}
                  onChange={(e) =>
                    setForm({ ...form, localidad: e.target.value })
                  }
                  error={!!errors.localidad}
                />
                {errors.localidad && (
                  <p className="mt-1 text-xs text-error-500">{errors.localidad}</p>
                )}
              </div>

              <div key={editingId ?? "create"}>
                <Switch
                  label="Sede activa"
                  defaultChecked={form.activa}
                  onChange={(checked) =>
                    setForm({ ...form, activa: checked })
                  }
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
                  : "Crear sede"}
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
              ¿Estás seguro de que querés eliminar esta sede? Esta acción no se puede deshacer.
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
    </>
  );
}
