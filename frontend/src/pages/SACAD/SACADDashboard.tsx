import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { GridIcon, GroupIcon, DocsIcon, BoxCubeIcon } from "../../icons";

interface Stats {
  total_facultades: number;
  total_carreras: number;
  planes_vigentes: number;
  total_materias: number;
  carreras_por_facultad: Record<string, number>;
  materias_por_año: Record<string, number>;
  ultimos_planes: {
    id: number;
    nombre: string;
    carrera: string;
    año_inicio_implementacion: number;
    activo: boolean;
  }[];
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <Icon className="size-5 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="flex items-end justify-between mt-3">
        <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
      ))}
    </div>
  );
}

export default function SACADDashboard() {
  const { data: stats, loading } = useApiData<Stats>("/dashboard/stats/");

  const carrerasLabels = stats?.carreras_por_facultad
    ? Object.keys(stats.carreras_por_facultad)
    : [];
  const carrerasValues = stats?.carreras_por_facultad
    ? Object.values(stats.carreras_por_facultad)
    : [];

  return (
    <>
      <PageMeta
        title="SACAD - Dashboard"
        description="Sistema de Administración de Carreras, Actividades y Docentes"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Facultades" value={stats?.total_facultades ?? 0} icon={GridIcon} />
        <StatCard label="Carreras" value={stats?.total_carreras ?? 0} icon={GroupIcon} />
        <StatCard label="Planes Vigentes" value={stats?.planes_vigentes ?? 0} icon={DocsIcon} />
        <StatCard label="Materias" value={stats?.total_materias ?? 0} icon={BoxCubeIcon} />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Carreras por Facultad</h3>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="space-y-3">
              {carrerasLabels.map((fac, i) => (
                <div key={fac} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{fac}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded-full dark:bg-gray-700">
                      <div
                        className="h-full rounded-full bg-brand-500"
                        style={{
                          width: `${Math.min(
                            ((carrerasValues[i] ?? 0) / Math.max(...carrerasValues, 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-500">{carrerasValues[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Materias por Año</h3>
          {loading ? (
            <TableSkeleton />
          ) : (
            <div className="space-y-3">
              {stats?.materias_por_año &&
                Object.entries(stats.materias_por_año).map(([year, count]) => (
                  <div key={year} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Año {year}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-success-500"
                          style={{
                            width: `${Math.min(
                              ((count as number) /
                                Math.max(
                                  ...Object.values(stats.materias_por_año),
                                  1
                                )) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{count as number}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 font-semibold text-gray-800 dark:text-white/90">Últimos Planes Modificados</h3>
        {loading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Carrera</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Año</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats?.ultimos_planes.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3">{p.carrera}</td>
                    <td className="px-4 py-3">{p.nombre}</td>
                    <td className="px-4 py-3">{p.año_inicio_implementacion}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          p.activo
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
