import { useState, useMemo } from "react";
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

interface EntradaNomenclador {
  id: string;
  tipo: "disciplina" | "subdisciplina" | "especialidad";
  disciplina_codigo: string;
  subdisciplina_codigo: string;
  especialidad_codigo: string;
  nombre: string;
  activo: boolean;
}

interface FormState {
  id: string | null;
  disciplina_codigo: string;
  subdisciplina_codigo: string;
  especialidad_codigo: string;
  nombre: string;
  activo: boolean;
}

const FORM_INIT: FormState = {
  id: null,
  disciplina_codigo: "",
  subdisciplina_codigo: "",
  especialidad_codigo: "",
  nombre: "",
  activo: true,
};

function codigoTooltip(tipo: string, d: string, s: string, e: string): string {
  if (tipo === "especialidad") return `${d}.${s}.${e}`;
  if (tipo === "subdisciplina") return `${d}.${s}`;
  return d;
}

function NomencladorTable({ canWrite }: { canWrite: boolean }) {
  const { data, loading, refetch } = useApiData<EntradaNomenclador[]>("/entradas/");
  const entries = data ?? [];

  const [form, setForm] = useState<FormState>(FORM_INIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [creating, setCreating] = useState(false);

  const filtradas = useMemo(() => {
    let r = entries;
    if (busqueda.trim()) {
      const q = busqueda.trim().toLowerCase();
      r = r.filter(
        (e) =>
          e.nombre.toLowerCase().includes(q) ||
          e.disciplina_codigo.toLowerCase().includes(q) ||
          e.subdisciplina_codigo.toLowerCase().includes(q) ||
          e.especialidad_codigo.toLowerCase().includes(q) ||
          codigoTooltip(e.tipo, e.disciplina_codigo, e.subdisciplina_codigo, e.especialidad_codigo).includes(q)
      );
    }
    return r;
  }, [entries, busqueda]);

  const openCreate = () => {
    setForm(FORM_INIT);
    setCreating(true);
    setError("");
  };

  const openEdit = (item: EntradaNomenclador) => {
    setForm({
      id: item.id,
      disciplina_codigo: item.disciplina_codigo,
      subdisciplina_codigo: item.subdisciplina_codigo,
      especialidad_codigo: item.especialidad_codigo,
      nombre: item.nombre,
      activo: item.activo,
    });
    setCreating(false);
    setError("");
  };

  const cancel = () => {
    setForm(FORM_INIT);
    setCreating(false);
    setError("");
  };

  const handleSave = async () => {
    const dc = form.disciplina_codigo.trim().toUpperCase();
    const sc = form.subdisciplina_codigo.trim().toUpperCase();
    const ec = form.especialidad_codigo.trim().toUpperCase();
    const n = form.nombre.trim();

    if (!dc) { setError("El código de disciplina es obligatorio."); return; }
    if (dc.length !== 2) { setError("El código de disciplina debe tener 2 caracteres."); return; }
    if (!n) { setError("El nombre es obligatorio."); return; }

    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        id: form.id,
        disciplina_codigo: dc,
        subdisciplina_codigo: sc,
        especialidad_codigo: ec,
        nombre: n,
        activo: form.activo,
      };
      if (!form.id) delete payload.id;
      await apiClient.post("/entradas/", payload);
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
    const tipo = deleteId.startsWith("d_") ? "disciplinas" : deleteId.startsWith("s_") ? "subdisciplinas" : "especialidades";
    const pk = deleteId.split("_", 2)[1];
    try {
      await apiClient.delete(`/${tipo}/${pk}/`);
      setDeleteId(null);
      refetch();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail ?? "No se pudo eliminar.");
    }
  };

  const editing = form.id !== null;
  const showForm = creating || editing;

  return (
    <div>
      {/* Header + create button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Nomenclador</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Gestioná disciplinas, subdisciplinas y especialidades.
          </p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={openCreate}
            startIcon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="white"/><path d="M12 8v8M8 12h8" stroke="#465fff" strokeWidth={2} strokeLinecap="round"/></svg>}
            className="font-semibold">
            Nuevo
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscá por código o nombre..."
          className="w-full px-3 py-1.5 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
        />
      </div>

      {/* Form inline */}
      {showForm && (
        <div className="mb-4 p-4 border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {error && (
            <div className="mb-3 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Disciplina</label>
              <input
                type="text"
                value={form.disciplina_codigo}
                onChange={(e) => setForm({ ...form, disciplina_codigo: e.target.value.toUpperCase().slice(0, 2) })}
                onBlur={() => setForm((f) => ({ ...f, disciplina_codigo: f.disciplina_codigo.padStart(2, "0") }))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={2}
                placeholder="XX"
                className="w-16 px-3 py-2 text-sm text-center border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Subdisciplina</label>
              <input
                type="text"
                value={form.subdisciplina_codigo}
                onChange={(e) => setForm({ ...form, subdisciplina_codigo: e.target.value.toUpperCase().slice(0, 2) })}
                onBlur={() => setForm((f) => ({ ...f, subdisciplina_codigo: f.subdisciplina_codigo.padStart(2, "0") }))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={2}
                placeholder="XX"
                className="w-16 px-3 py-2 text-sm text-center border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
              <input
                type="text"
                value={form.especialidad_codigo}
                onChange={(e) => setForm({ ...form, especialidad_codigo: e.target.value.toUpperCase().slice(0, 2) })}
                onBlur={() => setForm((f) => ({ ...f, especialidad_codigo: f.especialidad_codigo.padStart(2, "0") }))}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                maxLength={2}
                placeholder="XX"
                className="w-16 px-3 py-2 text-sm text-center border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="ej: CIENCIAS SOCIALES"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="nomenclador-activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <label htmlFor="nomenclador-activo" className="text-xs text-gray-600 dark:text-gray-400">Activo</label>
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.disciplina_codigo.trim() || !form.nombre.trim()}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}
            </Button>
            <Button size="sm" variant="outline" onClick={cancel}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 w-28">Estado</th>
              <th className="px-4 py-3 w-28">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay registros.</td></tr>
            ) : (
              filtradas.map((item) => {
                const codigo = codigoTooltip(item.tipo, item.disciplina_codigo, item.subdisciplina_codigo, item.especialidad_codigo);
                const indent = item.tipo === "subdisciplina" ? "ml-4" : item.tipo === "especialidad" ? "ml-8" : "";
                const bold = item.tipo === "disciplina" ? "font-semibold" : "";
                return (
                  <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className={`px-4 py-3 font-mono text-gray-800 dark:text-white/90 ${indent} ${bold}`}>
                      {codigo}
                    </td>
                    <td className={`px-4 py-3 text-gray-800 dark:text-white/90 ${bold}`}>
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.activo
                          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {item.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canWrite && (
                          <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                        {canWrite && (
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete modal */}
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

        <div className="p-6">
          <NomencladorTable canWrite={canWrite} />
        </div>
      </div>
    </>
  );
}