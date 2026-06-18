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

interface CarreraOption {
  id: number;
  nombre: string;
}

interface TituloIntermedio {
  id?: number;
  nombre: string;
  duracion_anos: number;
}

interface PlanEstudio {
  id: number;
  codigo: string;
  version: string;
  carrera: number;
  carrera_nombre: string;
  titulo_otorga: string;
  duracion_anos: number;
  vigente: boolean;
  año_inicio_implementacion: number;
  materias_count: number;
  titulos_intermedios: TituloIntermedio[];
}

interface PlanForm {
  carrera: number | undefined;
  codigo: string;
  version: string;
  titulo_otorga: string;
  duracion_anos: number;
  vigente: boolean;
  año_inicio_implementacion: number;
  titulos_intermedios: TituloIntermedio[];
}

interface FieldErrors {
  carrera?: string;
  codigo?: string;
  titulo_otorga?: string;
  duracion_anos?: string;
  año_inicio_implementacion?: string;
}

const emptyForm: PlanForm = {
  carrera: undefined,
  codigo: "",
  version: "",
  titulo_otorga: "",
  duracion_anos: 1,
  vigente: false,
  año_inicio_implementacion: new Date().getFullYear(),
  titulos_intermedios: [],
};

export default function PlanesPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || user?.group_names?.includes("Admin Universidad") || user?.group_names?.includes("Secretario Académico") || canWriteMenu("planes");
  const [filter, setFilter] = useState("");
  const params = new URLSearchParams();
  if (filter) params.set("search", filter);
  const qs = params.toString();
  const { data, loading, refetch } = useApiData<{ results: PlanEstudio[] }>(
    `/planes/${qs ? `?${qs}` : ""}`,
    [qs]
  );
  const { data: carreras } = useApiData<{ results: CarreraOption[] }>("/carreras/");
  const modal = useModal();

  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [carreraSearch, setCarreraSearch] = useState("");
  const [carreraDropdownOpen, setCarreraDropdownOpen] = useState(false);
  const carreraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (carreraRef.current && !carreraRef.current.contains(e.target as Node)) {
        setCarreraDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const carreraOptions = carreras?.results ?? [];
  const carreraFiltered = carreraSearch
    ? carreraOptions.filter((c) =>
        c.nombre.toLowerCase().includes(carreraSearch.toLowerCase())
      )
    : carreraOptions;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormError("");
    setCarreraSearch("");
    setCarreraDropdownOpen(false);
    modal.openModal();
  };

  const openEdit = (p: PlanEstudio) => {
    setEditingId(p.id);
    setErrors({});
    setFormError("");
    const carrera = carreraOptions.find((c) => c.id === p.carrera);
    setCarreraSearch(carrera?.nombre ?? "");
    setCarreraDropdownOpen(false);
    setForm({
      carrera: p.carrera,
      codigo: p.codigo,
      version: p.version,
      titulo_otorga: p.titulo_otorga,
      duracion_anos: p.duracion_anos,
      vigente: p.vigente,
      año_inicio_implementacion: p.año_inicio_implementacion,
      titulos_intermedios: p.titulos_intermedios?.map((t) => ({ nombre: t.nombre, duracion_anos: t.duracion_anos })) ?? [],
    });
    modal.openModal();
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setDeleteError("");
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.carrera) newErrors.carrera = "Seleccioná una carrera.";
    if (!form.codigo.trim()) newErrors.codigo = "Este campo es obligatorio.";
    if (!form.titulo_otorga.trim()) newErrors.titulo_otorga = "Este campo es obligatorio.";
    if (!form.duracion_anos || form.duracion_anos < 1) newErrors.duracion_anos = "Tiene que ser mayor a 0.";
    if (!form.año_inicio_implementacion) newErrors.año_inicio_implementacion = "Este campo es obligatorio.";
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
        titulos_intermedios: form.titulos_intermedios.filter((t) => t.nombre.trim()),
      };
      if (editingId) {
        await apiClient.put(`/planes/${editingId}/`, payload);
      } else {
        await apiClient.post("/planes/", payload);
      }
      modal.closeModal();
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: Record<string, string | string[]> } };
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
      await apiClient.delete(`/planes/${deletingId}/`);
      setDeletingId(null);
      setDeleteError("");
      refetch();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
        if (axiosErr.response?.status === 409) {
          setDeleteError(axiosErr.response.data?.detail || "El plan tiene materias asociadas. Eliminalas primero.");
          return;
        }
      }
      setDeleteError("No se pudo eliminar el plan.");
    }
  };

  const addTituloIntermedio = () => {
    setForm({
      ...form,
      titulos_intermedios: [...form.titulos_intermedios, { nombre: "", duracion_anos: 1 }],
    });
  };

  const removeTituloIntermedio = (idx: number) => {
    setForm({
      ...form,
      titulos_intermedios: form.titulos_intermedios.filter((_, i) => i !== idx),
    });
  };

  const updateTituloIntermedio = (idx: number, field: keyof TituloIntermedio, value: string | number) => {
    const updated = [...form.titulos_intermedios];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, titulos_intermedios: updated });
  };

  return (
    <>
      <PageMeta title="SACAD - Planes de Estudio" description="Gestión de Planes de Estudio" />

      <PageBreadcrumb items={[{ label: "Planes de Estudio" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Planes de Estudio
            </h3>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Buscar por código..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              {canWrite && <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>Agregar Plan</Button>}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Versión</th>
                <th className="px-4 py-3">Carrera</th>
                <th className="px-4 py-3">Título que Otorga</th>
                <th className="px-4 py-3">Duración</th>
                <th className="px-4 py-3">Año Inicio</th>
                <th className="px-4 py-3">Títulos Intermedios</th>
                <th className="px-4 py-3">Materias</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : data?.results?.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                    No hay planes de estudio registrados
                  </td>
                </tr>
              ) : (
                data?.results?.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-3">{p.version || "-"}</td>
                    <td className="px-4 py-3">{p.carrera_nombre}</td>
                    <td className="px-4 py-3">{p.titulo_otorga}</td>
                    <td className="px-4 py-3">{p.duracion_anos} años</td>
                    <td className="px-4 py-3">{p.año_inicio_implementacion}</td>
                    <td className="px-4 py-3">
                      {p.titulos_intermedios?.length
                        ? p.titulos_intermedios.map((t) => `${t.nombre} (${t.duracion_anos}a)`).join(", ")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{p.materias_count}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          p.vigente
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {p.vigente ? "Vigente" : "No vigente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <div className="relative group">
                            <button
                              onClick={() => openEdit(p)}
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
                              onClick={() => openDelete(p.id)}
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

      <Modal isOpen={modal.isOpen} onClose={modal.closeModal} className="max-w-[900px] m-4">
        <div className="no-scrollbar relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Plan de Estudio" : "Agregar Plan de Estudio"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {editingId ? "Modificá los datos del plan de estudio" : "Completá los datos para registrar un nuevo plan de estudio"}
            </p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="flex flex-col"
          >
            <div className="px-2 pb-3 space-y-5">
              {formError && (
                <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {formError}
                </div>
              )}

              <div ref={carreraRef} className="relative">
                <Label htmlFor="carrera">Carrera</Label>
                <input
                  id="carrera"
                  type="text"
                  placeholder="Buscá una carrera..."
                  value={carreraSearch}
                  onChange={(e) => {
                    setCarreraSearch(e.target.value);
                    setForm({ ...form, carrera: undefined });
                    setCarreraDropdownOpen(true);
                  }}
                  onFocus={() => setCarreraDropdownOpen(true)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400 ${
                    errors.carrera ? "border-error-500" : "border-gray-200 dark:border-gray-700"
                  }`}
                />
                {carreraDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {carreraFiltered.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                    ) : (
                      carreraFiltered.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            form.carrera === c.id
                              ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                              : "text-gray-800 dark:text-white/90"
                          }`}
                          onClick={() => {
                            setForm({ ...form, carrera: c.id });
                            setCarreraSearch(c.nombre);
                            setCarreraDropdownOpen(false);
                          }}
                        >
                          {c.nombre}
                        </button>
                      ))
                    )}
                  </div>
                )}
                {errors.carrera && <p className="mt-1 text-xs text-error-500">{errors.carrera}</p>}
              </div>

              <div>
                <Label htmlFor="codigo">Código del Plan</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: 2024-A"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  error={!!errors.codigo}
                />
                {errors.codigo && <p className="mt-1 text-xs text-error-500">{errors.codigo}</p>}
              </div>

              <div>
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  placeholder="Ej: 1.0, 2.0"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="titulo_otorga">Título que Otorga</Label>
                <Input
                  id="titulo_otorga"
                  placeholder="Ej: Licenciado en Sistemas"
                  value={form.titulo_otorga}
                  onChange={(e) => setForm({ ...form, titulo_otorga: e.target.value })}
                  error={!!errors.titulo_otorga}
                />
                {errors.titulo_otorga && <p className="mt-1 text-xs text-error-500">{errors.titulo_otorga}</p>}
              </div>

              <div>
                <Label htmlFor="duracion_anos">Duración (años)</Label>
                <Input
                  id="duracion_anos"
                  type="number"
                  min="1"
                  placeholder="Ej: 5"
                  value={form.duracion_anos}
                  onChange={(e) => setForm({ ...form, duracion_anos: Number(e.target.value) || 1 })}
                  error={!!errors.duracion_anos}
                />
                {errors.duracion_anos && <p className="mt-1 text-xs text-error-500">{errors.duracion_anos}</p>}
              </div>

              <div>
                <Label htmlFor="año_inicio_implementacion">Año de Inicio de Implementación</Label>
                <Input
                  id="año_inicio_implementacion"
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="Ej: 2024"
                  value={form.año_inicio_implementacion}
                  onChange={(e) => setForm({ ...form, año_inicio_implementacion: Number(e.target.value) || 0 })}
                  error={!!errors.año_inicio_implementacion}
                />
                {errors.año_inicio_implementacion && <p className="mt-1 text-xs text-error-500">{errors.año_inicio_implementacion}</p>}
              </div>

              <div key={editingId ?? "create"}>
                <Switch
                  label="Plan vigente"
                  defaultChecked={form.vigente}
                  onChange={(checked) => setForm({ ...form, vigente: checked })}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Títulos Intermedios</Label>
                  <button
                    type="button"
                    onClick={addTituloIntermedio}
                    className="text-xs text-brand-500 hover:text-brand-600 font-medium"
                  >
                    + Agregar título intermedio
                  </button>
                </div>
                {form.titulos_intermedios.length === 0 ? (
                  <p className="text-sm text-gray-400">No tiene títulos intermedios.</p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Título que otorga</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-32">Duración (años)</th>
                          <th className="px-4 py-2.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {form.titulos_intermedios.map((t, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                placeholder="Nombre del título"
                                value={t.nombre}
                                onChange={(e) => updateTituloIntermedio(idx, "nombre", e.target.value)}
                                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                min="1"
                                placeholder="Años"
                                value={t.duracion_anos}
                                onChange={(e) => updateTituloIntermedio(idx, "duracion_anos", Number(e.target.value) || 1)}
                                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => removeTituloIntermedio(idx)}
                                className="p-1 rounded text-gray-400 hover:text-error-500"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-6">
              <Button size="sm" variant="outline" onClick={modal.closeModal}>
                Cancelar
              </Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plan"}
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
              ¿Estás seguro de que querés eliminar este plan de estudio? Esta acción no se puede deshacer.
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