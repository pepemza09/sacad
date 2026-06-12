import { useState } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { useApiData } from "../../hooks/useApiData";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { UserCheckIcon, CheckLineIcon, CloseLineIcon, AngleLeftIcon } from "../../icons";
import { apiClient } from "../../api";

interface UserItem {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  approval_status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  rejected_at: string | null;
  is_superuser: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500",
  approved:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500",
  rejected:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500",
};

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AutorizacionUsuariosPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const { data: users, loading, refetch } = useApiData<UserItem[]>(`/auth/users/${qs}`, [qs]);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [rejectError, setRejectError] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/auth/approve-user/${userId}/`);
      refetch();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    try {
      await apiClient.patch(`/auth/reject-user/${rejectingId}/`);
      setRejectingId(null);
      refetch();
    } catch {
      setRejectError("No se pudo rechazar el usuario.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingId) return;
    setActionLoading(deactivatingId);
    try {
      await apiClient.patch(`/auth/reject-user/${deactivatingId}/`);
      setDeactivatingId(null);
      refetch();
    } catch {
      setDeactivateError("No se pudo desactivar el usuario.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <PageMeta title="SACAD - Autorización de usuarios" description="Autorización de usuarios" />

      <PageBreadcrumb items={[{ label: "Configuración", href: "/configuracion" }, { label: "Autorización de usuarios" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <button onClick={() => navigate("/configuracion")} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" title="Volver">
            <AngleLeftIcon className="size-5" />
          </button>
          <div className="flex size-12 flex-none items-center justify-center rounded-lg bg-indigo-500">
            <UserCheckIcon className="size-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Autorización de usuarios
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Gestioná qué usuarios tienen acceso al sistema y sus roles.
            </p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent text-gray-800 dark:text-white/90"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Apellido</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    Cargando...
                  </td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No hay usuarios con ese estado
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">{u.first_name || "-"}</td>
                    <td className="px-4 py-3">{u.last_name || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[u.approval_status]}`}>
                        {STATUS_LABELS[u.approval_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.approval_status === "pending" && formatDate(u.date_joined)}
                      {u.approval_status === "approved" && formatDate(u.approved_at)}
                      {u.approval_status === "rejected" && formatDate(u.rejected_at)}
                    </td>
                    <td className="px-4 py-3">
                      {u.approval_status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(u.id)}
                            disabled={actionLoading === u.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-500 dark:hover:bg-success-500/25 disabled:opacity-50"
                            title="Aprobar"
                          >
                            <CheckLineIcon className="w-4 h-4" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(u.id);
                              setRejectError("");
                            }}
                            disabled={actionLoading === u.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-error-50 px-3 py-1.5 text-xs font-medium text-error-700 hover:bg-error-100 dark:bg-error-500/15 dark:text-error-500 dark:hover:bg-error-500/25 disabled:opacity-50"
                            title="Rechazar"
                          >
                            <CloseLineIcon className="w-4 h-4" />
                            Rechazar
                          </button>
                        </div>
                      )}
                      {u.approval_status === "approved" && !u.is_superuser && (
                        <button
                          onClick={() => {
                            setDeactivatingId(u.id);
                            setDeactivateError("");
                          }}
                          disabled={actionLoading === u.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 dark:bg-orange-500/15 dark:text-orange-500 dark:hover:bg-orange-500/25 disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Desactivar
                        </button>
                      )}
                      {u.approval_status === "approved" && u.is_superuser && (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                      {u.approval_status === "rejected" && (
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={actionLoading === u.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-medium text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-500 dark:hover:bg-success-500/25 disabled:opacity-50"
                        >
                          <CheckLineIcon className="w-4 h-4" />
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!rejectingId} onClose={() => setRejectingId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Rechazar usuario
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que querés rechazar este usuario? No podrá acceder al sistema.
            </p>
            {rejectError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {rejectError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-error-500 text-white hover:bg-error-600"
              onClick={handleReject}
              disabled={actionLoading === rejectingId}
            >
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deactivatingId} onClose={() => setDeactivatingId(null)} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[400px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Desactivar usuario
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Este usuario perderá el acceso al sistema. Podrás reactivarlo luego desde esta misma pantalla.
            </p>
            {deactivateError && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {deactivateError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 px-2">
            <Button size="sm" variant="outline" onClick={() => setDeactivatingId(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
              onClick={handleDeactivate}
              disabled={actionLoading === deactivatingId}
            >
              Desactivar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
