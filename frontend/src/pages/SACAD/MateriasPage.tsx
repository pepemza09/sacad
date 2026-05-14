import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

interface Materia {
  id: number;
  codigo: string;
  nombre: string;
  año: number;
  cuatrimestre: string;
  carga_horaria_semanal: number;
  carga_horaria_total: number;
  tipo: string;
  plan_estudio: number;
}

export default function MateriasPage() {
  const [filterPlan, setFilterPlan] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const qs = [
    filterPlan && `plan_estudio=${filterPlan}`,
    filterYear && `año=${filterYear}`,
  ].filter(Boolean).join("&");
  const { data, loading } = useApiData<{ results: Materia[] }>(
    `/materias/${qs ? `?${qs}` : ""}`,
    [qs]
  );

  return (
    <>
      <PageMeta title="SACAD - Materias" description="Gestión de Materias" />

      <PageBreadcrumb items={[{ label: "Materias" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Materias</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Plan ID..."
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent"
              />
              <input
                type="text"
                placeholder="Año..."
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Año</th>
                <th className="px-4 py-3">Cuatrimestre</th>
                <th className="px-4 py-3">Horas Sem.</th>
                <th className="px-4 py-3">Horas Tot.</th>
                <th className="px-4 py-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center">Cargando...</td></tr>
              ) : (
                data?.results?.map((m) => (
                  <tr key={m.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{m.codigo}</td>
                    <td className="px-4 py-3">{m.nombre}</td>
                    <td className="px-4 py-3">{m.año}</td>
                    <td className="px-4 py-3 capitalize">{m.cuatrimestre}</td>
                    <td className="px-4 py-3">{m.carga_horaria_semanal}</td>
                    <td className="px-4 py-3">{m.carga_horaria_total}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-500 capitalize">
                        {m.tipo}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
