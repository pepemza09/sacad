import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useApiData } from "../../hooks/useApiData";
import { equivalenciasApi } from "../../api/services";

interface Equivalencia {
  id: number;
  plan_destino: number;
  plan_destino_nombre: string;
  materias_origen_display: { id: number; codigo: string; nombre: string }[];
  materias_destino_display: { id: number; codigo: string; nombre: string }[];
  tipo: string;
  porcentaje: number | null;
  resolucion: string;
  activa: boolean;
}

export default function EquivalenciasPage() {
  const { data, loading } = useApiData<{ results: Equivalencia[] }>("/equivalencias/");
  const [materiaOrigen, setMateriaOrigen] = useState("");
  const [planDestino, setPlanDestino] = useState("");
  const [consultaResult, setConsultaResult] = useState<unknown[] | null>(null);
  const [consulting, setConsulting] = useState(false);

  const handleConsultar = async () => {
    if (!materiaOrigen || !planDestino) return;
    setConsulting(true);
    try {
      const res = await equivalenciasApi.consultar(Number(materiaOrigen), Number(planDestino));
      setConsultaResult(res.data);
    } catch {
      setConsultaResult([]);
    }
    setConsulting(false);
  };

  return (
    <>
      <PageMeta title="SACAD - Equivalencias" description="Gestión de Equivalencias" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Consultar Equivalencias
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-500 dark:text-gray-400">
                Materia Origen ID
              </label>
              <input
                type="number"
                value={materiaOrigen}
                onChange={(e) => setMateriaOrigen(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-500 dark:text-gray-400">
                Plan Destino ID
              </label>
              <input
                type="number"
                value={planDestino}
                onChange={(e) => setPlanDestino(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-transparent"
              />
            </div>
            <button
              onClick={handleConsultar}
              disabled={consulting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50"
            >
              {consulting ? "Consultando..." : "Consultar"}
            </button>

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
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Equivalencias Registradas
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-96">
            {loading ? (
              <p className="text-center text-gray-500">Cargando...</p>
            ) : (
              <div className="space-y-3">
                {data?.results?.map((eq) => (
                  <div
                    key={eq.id}
                    className="p-3 border rounded-lg border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">#{eq.id}</span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                          eq.activa
                            ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {eq.activa ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {eq.materias_origen_display.map((m) => m.nombre).join(" + ")}
                    </p>
                    <p className="text-xs text-gray-400">&rarr;</p>
                    <p className="text-xs font-medium text-gray-800 dark:text-white/90">
                      {eq.materias_destino_display.map((m) => m.nombre).join(" + ")}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {eq.tipo} {eq.porcentaje ? `- ${eq.porcentaje}%` : ""} | {eq.plan_destino_nombre}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
