import { useState, useEffect, useRef } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Switch from "../../components/form/switch/Switch";
import { PencilIcon, TrashBinIcon } from "../../icons";
import { apiClient } from "../../api";
import { useAuth } from "../../context/auth/AuthContext";
import { useMenuPermissions } from "../../hooks/useMenuPermissions";
import { formatDate } from "../../utils/dateFormat";

interface CargoDocente {
  id: number;
  docente: number;
  docente_nombre: string;
  materia: number;
  materia_codigo: string;
  materia_nombre: string;
  cargo: number;
  cargo_codigo: string;
  cargo_descripcion: string;
  dedicacion: number;
  dedicacion_codigo: string;
  dedicacion_descripcion: string;
  caracter: number;
  caracter_codigo: string;
  caracter_descripcion: string;
  carrera_nombre: string;
  plan_estudio_codigo: string;
  area_nombre: string | null;
  facultad_nombre: string;
  caracter_requiere_fecha: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activo: boolean;
}

interface CargoDocenteForm {
  docente: number;
  materia: number;
  cargo: number;
  dedicacion: number;
  caracter: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

const emptyForm: CargoDocenteForm = {
  docente: 0,
  materia: 0,
  cargo: 0,
  dedicacion: 0,
  caracter: 0,
  fecha_inicio: "",
  fecha_fin: "",
  activo: true,
};

export default function CargosPersonasPage() {
  const { user } = useAuth();
  const { canWrite: canWriteMenu } = useMenuPermissions();
  const canWrite = user?.is_superuser || canWriteMenu("docentes");

  const { data, loading, refetch } = useApiData<{ results: CargoDocente[] }>("/cargos-docentes/", []);
  const { data: docentesData } = useApiData<{ results: Record<string, unknown>[] }>("/docentes/", []);
  const { data: materiasData } = useApiData<{ results: Record<string, unknown>[] }>("/materias/", []);
  const { data: cargosData } = useApiData<{ results: Record<string, unknown>[] }>("/cargos/", []);
  const { data: dedicacionesData } = useApiData<{ results: Record<string, unknown>[] }>("/dedicaciones/", []);
  const { data: caracteresData } = useApiData<{ results: Record<string, unknown>[] }>("/caracteres/", []);

  const items = data?.results ?? [];
  const docentes = docentesData?.results ?? [];
  const materias = materiasData?.results ?? [];
  const cargos = cargosData?.results ?? [];
  const dedicaciones = dedicacionesData?.results ?? [];
  const caracteres = caracteresData?.results ?? [];

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CargoDocenteForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCaracter, setSelectedCaracter] = useState<{ requiere_fecha: string } | null>(null);

  const [docenteSearch, setDocenteSearch] = useState("");
  const [docenteDropdownOpen, setDocenteDropdownOpen] = useState(false);
  const docenteRef = useRef<HTMLDivElement>(null);
  const [materiaSearch, setMateriaSearch] = useState("");
  const [materiaDropdownOpen, setMateriaDropdownOpen] = useState(false);
  const materiaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (docenteRef.current && !docenteRef.current.contains(e.target as Node)) {
        setDocenteDropdownOpen(false);
      }
      if (materiaRef.current && !materiaRef.current.contains(e.target as Node)) {
        setMateriaDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const docentesFiltered = docenteSearch
    ? docentes.filter((d: Record<string, unknown>) => {
        const ap = (d.apellido as string || "").toLowerCase();
        const nom = (d.nombre as string || "").toLowerCase();
        const q = docenteSearch.toLowerCase();
        return ap.includes(q) || nom.includes(q) || `${ap} ${nom}`.includes(q) || `${nom} ${ap}`.includes(q);
      })
    : docentes;

  const materiasFiltered = materiaSearch
    ? materias.filter((m: Record<string, unknown>) => {
        const cod = (m.codigo as string || "").toLowerCase();
        const nom = (m.nombre as string || "").toLowerCase();
        const q = materiaSearch.toLowerCase();
        return cod.includes(q) || nom.includes(q);
      })
    : materias;

  useEffect(() => {
    if (form.caracter) {
      const c = caracteres.find((c: Record<string, unknown>) => c.id === form.caracter);
      if (c) {
        apiClient.get(`/caracteres/${form.caracter}/`).then((res) => {
          setSelectedCaracter(res.data);
        }).catch(() => setSelectedCaracter(null));
      }
    } else {
      setSelectedCaracter(null);
    }
  }, [form.caracter, caracteres]);

  const requiereFecha = selectedCaracter?.requiere_fecha ?? "ninguna";
  const showInicio = requiereFecha === "inicio" || requiereFecha === "ambas";
  const showFin = requiereFecha === "fin" || requiereFecha === "ambas";

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedCaracter(null);
    setErrors({});
    setFormError("");
    setDocenteSearch("");
    setMateriaSearch("");
    setDocenteDropdownOpen(false);
    setMateriaDropdownOpen(false);
    setOpen(true);
  };

  const openEdit = (item: CargoDocente) => {
    setEditingId(item.id);
    setForm({
      docente: item.docente,
      materia: item.materia,
      cargo: item.cargo,
      dedicacion: item.dedicacion,
      caracter: item.caracter,
      fecha_inicio: item.fecha_inicio ?? "",
      fecha_fin: item.fecha_fin ?? "",
      activo: item.activo,
    });
    setSelectedCaracter({ requiere_fecha: item.caracter_requiere_fecha });
    setDocenteSearch(item.docente_nombre);
    setMateriaSearch(`${item.materia_codigo} - ${item.materia_nombre}`);
    setDocenteDropdownOpen(false);
    setMateriaDropdownOpen(false);
    setErrors({});
    setFormError("");
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setSelectedCaracter(null);
    setErrors({});
    setFormError("");
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.docente) newErrors.docente = "Seleccioná un docente.";
    if (!form.materia) newErrors.materia = "Seleccioná una materia.";
    if (!form.cargo) newErrors.cargo = "Seleccioná un cargo.";
    if (!form.dedicacion) newErrors.dedicacion = "Seleccioná una dedicación.";
    if (!form.caracter) newErrors.caracter = "Seleccioná un carácter.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setFormError("");
    try {
      const payload: Record<string, unknown> = {
        ...form,
        fecha_inicio: showInicio ? form.fecha_inicio || null : null,
        fecha_fin: showFin ? form.fecha_fin || null : null,
      };
      if (editingId) {
        await apiClient.put(`/cargos-docentes/${editingId}/`, payload);
      } else {
        await apiClient.post("/cargos-docentes/", payload);
      }
      close();
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
      await apiClient.delete(`/cargos-docentes/${deletingId}/`);
      setDeletingId(null);
      refetch();
    } catch {
      setDeleteError("No se pudo eliminar el cargo.");
    }
  };

  const filtered = items.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.docente_nombre.toLowerCase().includes(q) ||
      c.materia_codigo.toLowerCase().includes(q) ||
      c.materia_nombre.toLowerCase().includes(q) ||
      c.cargo_descripcion.toLowerCase().includes(q) ||
      c.carrera_nombre.toLowerCase().includes(q) ||
      c.facultad_nombre.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageMeta title="SACAD - Cargos de Personas" description="Gestión de cargos docentes por persona y materia" />
      <PageBreadcrumb items={[{ label: "Docentes", href: "/docentes" }, { label: "Cargos" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Cargos de Personas</h3>
            <div className="flex items-center gap-3">
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
              {canWrite && (
                <Button size="sm" startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>} className="font-semibold" onClick={openCreate}>
                  Nuevo Cargo
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Materia</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Dedicación</th>
                <th className="px-4 py-3">Carácter</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Carrera / Plan</th>
                <th className="px-4 py-3">Facultad</th>
                <th className="px-4 py-3">Activo</th>
                {canWrite && <th className="px-4 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={canWrite ? 10 : 9} className="px-4 py-8 text-center">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={canWrite ? 10 : 9} className="px-4 py-8 text-center text-gray-400">No hay cargos registrados.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{c.docente_nombre}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.materia_codigo} - {c.materia_nombre}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{c.cargo_descripcion}</td>
                    <td className="px-4 py-3">{c.dedicacion_descripcion}</td>
                    <td className="px-4 py-3">{c.caracter_descripcion}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.fecha_inicio ? `Desde ${formatDate(c.fecha_inicio)}` : "—"}
                      {c.fecha_fin ? ` hasta ${formatDate(c.fecha_fin)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.carrera_nombre} / {c.plan_estudio_codigo}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.facultad_nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.activo
                          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                          : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500"
                      }`}>
                        {c.activo ? "Sí" : "No"}
                      </span>
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeletingId(c.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
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

      <Modal isOpen={open} onClose={close} className="max-w-[90vw] my-8">
        <div className="px-6 lg:px-10 py-6 lg:py-10">
          <div className="mb-6">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {editingId ? "Editar Cargo" : "Nuevo Cargo"}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {editingId ? "Modificá los datos del cargo" : "Asigná un cargo a una persona en una materia"}
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex flex-col">
            <div className="px-2 pb-3 space-y-5 max-h-[65vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={docenteRef}>
                  <Label>Persona</Label>
                  <input
                    type="text"
                    placeholder="Buscá una persona..."
                    value={docenteSearch}
                    onChange={(e) => {
                      setDocenteSearch(e.target.value);
                      setForm({ ...form, docente: 0 });
                      setDocenteDropdownOpen(true);
                    }}
                    onFocus={() => setDocenteDropdownOpen(true)}
                    className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 placeholder-gray-400 ${
                      errors.docente
                        ? "border-error-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  {docenteDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {docentesFiltered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                      ) : (
                        docentesFiltered.map((d: Record<string, unknown>) => (
                          <button
                            key={d.id as number}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              form.docente === (d.id as number)
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                                : "text-gray-800 dark:text-white/90"
                            }`}
                            onClick={() => {
                              setForm({ ...form, docente: d.id as number });
                              setDocenteSearch(`${(d.apellido as string)}, ${(d.nombre as string)}`);
                              setDocenteDropdownOpen(false);
                            }}
                          >
                            {(d.apellido as string)}, {(d.nombre as string)}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {errors.docente && <p className="mt-1 text-xs text-error-500">{errors.docente}</p>}
                </div>
                <div className="relative" ref={materiaRef}>
                  <Label>Materia</Label>
                  <input
                    type="text"
                    placeholder="Buscá una materia..."
                    value={materiaSearch}
                    onChange={(e) => {
                      setMateriaSearch(e.target.value);
                      setForm({ ...form, materia: 0 });
                      setMateriaDropdownOpen(true);
                    }}
                    onFocus={() => setMateriaDropdownOpen(true)}
                    className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 placeholder-gray-400 ${
                      errors.materia
                        ? "border-error-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  />
                  {materiaDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      {materiasFiltered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
                      ) : (
                        materiasFiltered.map((m: Record<string, unknown>) => (
                          <button
                            key={m.id as number}
                            type="button"
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              form.materia === (m.id as number)
                                ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500"
                                : "text-gray-800 dark:text-white/90"
                            }`}
                            onClick={() => {
                              setForm({ ...form, materia: m.id as number });
                              setMateriaSearch(`${(m.codigo as string)} - ${(m.nombre as string)}`);
                              setMateriaDropdownOpen(false);
                            }}
                          >
                            {(m.codigo as string)} - {(m.nombre as string)}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  {errors.materia && <p className="mt-1 text-xs text-error-500">{errors.materia}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Cargo</Label>
                  <select
                    value={form.cargo}
                    onChange={(e) => setForm({ ...form, cargo: Number(e.target.value) })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value={0}>Seleccioná...</option>
                    {cargos.map((c: Record<string, unknown>) => (
                      <option key={c.id as number} value={c.id as number}>{c.codigo as string} - {c.descripcion as string}</option>
                    ))}
                  </select>
                  {errors.cargo && <p className="mt-1 text-xs text-error-500">{errors.cargo}</p>}
                </div>
                <div>
                  <Label>Dedicación</Label>
                  <select
                    value={form.dedicacion}
                    onChange={(e) => setForm({ ...form, dedicacion: Number(e.target.value) })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value={0}>Seleccioná...</option>
                    {dedicaciones.map((d: Record<string, unknown>) => (
                      <option key={d.id as number} value={d.id as number}>{d.codigo as string} - {d.descripcion as string}</option>
                    ))}
                  </select>
                  {errors.dedicacion && <p className="mt-1 text-xs text-error-500">{errors.dedicacion}</p>}
                </div>
                <div>
                  <Label>Carácter</Label>
                  <select
                    value={form.caracter}
                    onChange={(e) => setForm({ ...form, caracter: Number(e.target.value) })}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90"
                  >
                    <option value={0}>Seleccioná...</option>
                    {caracteres.map((c: Record<string, unknown>) => (
                      <option key={c.id as number} value={c.id as number}>{c.codigo as string} - {c.descripcion as string}</option>
                    ))}
                  </select>
                  {errors.caracter && <p className="mt-1 text-xs text-error-500">{errors.caracter}</p>}
                </div>
              </div>

              {(showInicio || showFin) && (
                <div className="grid grid-cols-2 gap-4">
                  {showInicio && (
                    <div>
                      <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
                      <Input id="fecha_inicio" type="date" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                    </div>
                  )}
                  {showFin && (
                    <div>
                      <Label htmlFor="fecha_fin">Fecha de fin</Label>
                      <Input id="fecha_fin" type="date" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-2 mt-6">
              <Switch
                label="Cargo activo"
                defaultChecked={form.activo}
                onChange={(checked) => setForm({ ...form, activo: checked })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 px-2 mt-4">
              <Button size="sm" variant="outline" onClick={close}>Cancelar</Button>
              <Button size="sm" disabled={saving}>
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear cargo"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Confirmar eliminación</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">¿Estás seguro de que querés eliminar este cargo?</p>
            {deleteError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {deleteError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeletingId(null)}>Cancelar</Button>
            <Button size="sm" className="bg-error-500 text-white hover:bg-error-600" onClick={handleDelete}>Eliminar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
