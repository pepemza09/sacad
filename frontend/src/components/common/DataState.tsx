interface DataStateProps {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  searching?: boolean;
  emptyMessage?: string;
}

export default function DataState({
  loading = false,
  error = null,
  empty = false,
  searching = false,
  emptyMessage = "No hay registros.",
}: DataStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-gray-500 dark:text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 my-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
        No se pudieron cargar los datos. {error}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {searching ? "Sin resultados para tu búsqueda." : emptyMessage}
      </div>
    );
  }

  return null;
}
