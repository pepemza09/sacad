import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { PlusIcon, TrashBinIcon, AngleLeftIcon } from "../../icons";
import { apiClient } from "../../api";

interface DomainItem {
  id: number;
  domain: string;
  created_at: string;
}

export default function GestionDominiosPage() {
  const navigate = useNavigate();
  const { data: domains, loading, refetch } = useApiData<DomainItem[]>("/auth/allowed-domains/");
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    try {
      await apiClient.post("/auth/allowed-domains/", { domain: trimmed });
      setNewDomain("");
      refetch();
    } catch (err: any) {
      const detail = err?.response?.data?.domain?.[0] || err?.response?.data?.detail || "No se pudo agregar el dominio.";
      setError(detail);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await apiClient.delete(`/auth/allowed-domains/${deleteId}/`);
      setDeleteId(null);
      refetch();
    } catch {
      setError("No se pudo eliminar el dominio.");
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Dominios permitidos" description="Gestión de dominios permitidos" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Dominios permitidos" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-teal-500">
            <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Dominios permitidos
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Solo los usuarios con email de estos dominios podrán iniciar sesión con Google.
              Si no hay dominios configurados, cualquier dominio es aceptado.
            </p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="ej: fce.uncu.edu.ar"
              className="flex-1 px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90 placeholder-gray-400"
            />
            <Button size="sm" onClick={handleAdd} disabled={adding || !newDomain.trim()}>
              <PlusIcon className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Dominio</th>
                  <th className="px-4 py-3">Agregado</th>
                  <th className="px-4 py-3 w-20">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">Cargando...</td>
                  </tr>
                ) : !domains || domains.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      No hay dominios configurados. Cualquier dominio será aceptado.
                    </td>
                  </tr>
                ) : (
                  domains.map((d) => (
                    <tr key={d.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                        {d.domain}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(d.created_at).toLocaleDateString("es-AR", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative group inline-block">
                          <button
                            onClick={() => setDeleteId(d.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-500 dark:hover:bg-error-500/25"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col items-center z-50">
                            <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">Eliminar</div>
                          </div>
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
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Eliminar dominio
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés eliminar este dominio? Los usuarios con ese dominio no podrán iniciar sesión.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
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