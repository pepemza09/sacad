import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { apiClient } from "../../api";

interface Facultad {
  id: number; nombre: string;
}

interface Sede {
  id: number; nombre: string; facultad_nombre: string;
}

interface Carrera {
  id: number; nombre: string; facultad_nombre: string;
}

interface Plan {
  id: number; nombre: string; carrera_nombre: string;
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      apiClient.get(`/facultades/?search=${encodeURIComponent(q)}`).then(r => setFacultades(r.data?.results ?? [])).catch(() => {}),
      apiClient.get(`/sedes/?search=${encodeURIComponent(q)}`).then(r => setSedes(r.data?.results ?? [])).catch(() => {}),
      apiClient.get(`/carreras/?search=${encodeURIComponent(q)}`).then(r => setCarreras(r.data?.results ?? [])).catch(() => {}),
      apiClient.get(`/planes/?search=${encodeURIComponent(q)}`).then(r => setPlanes(r.data?.results ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [q]);

  return (
    <>
      <PageMeta title="SACAD - Buscar" description="Resultados de búsqueda" />
      <PageBreadcrumb items={[{ label: "Resultados de búsqueda" }]} />

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Resultados para &ldquo;{q}&rdquo;
          </h3>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Buscando...</p>
          ) : !q ? (
            <p className="text-sm text-gray-400">Escribí un término de búsqueda.</p>
          ) : (
            <div className="space-y-8">
              {!facultades.length && !sedes.length && !carreras.length && !planes.length && (
                <p className="text-sm text-gray-400">No se encontraron resultados.</p>
              )}

              {facultades.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Facultades</h4>
                  <div className="space-y-2">
                    {facultades.map(f => (
                      <Link key={f.id} to={`/facultades`} className="block px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {f.nombre}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {sedes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Sedes</h4>
                  <div className="space-y-2">
                    {sedes.map(s => (
                      <Link key={s.id} to={`/sedes`} className="block px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {s.nombre} <span className="text-gray-400">({s.facultad_nombre})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {carreras.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Carreras</h4>
                  <div className="space-y-2">
                    {carreras.map(c => (
                      <Link key={c.id} to={`/carreras`} className="block px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {c.nombre} <span className="text-gray-400">({c.facultad_nombre})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {planes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-3">Planes de Estudio</h4>
                  <div className="space-y-2">
                    {planes.map(p => (
                      <Link key={p.id} to={`/planes`} className="block px-4 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                        {p.nombre} <span className="text-gray-400">({p.carrera_nombre})</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}