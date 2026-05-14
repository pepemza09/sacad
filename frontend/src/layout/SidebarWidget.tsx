export default function SidebarWidget() {
  return (
    <div
      className="mx-auto w-full max-w-52 rounded-2xl bg-gray-50 px-3 py-4 text-center dark:bg-white/[0.03]"
      style={{ transform: "scale(0.9)", transformOrigin: "bottom center" }}
    >
      <h3 className="mb-1 font-semibold text-gray-900 dark:text-white text-sm">
        SACAD
      </h3>
      <p className="text-gray-500 text-xs dark:text-gray-400 leading-relaxed">
        Sistema de Administración de Carreras, Actividades y Docentes
      </p>
    </div>
  );
}
