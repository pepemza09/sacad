import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { UserCheckIcon } from "../../icons";

const configCards = [
  {
    title: "Autorización de usuarios",
    description: "Gestioná qué usuarios tienen acceso al sistema y sus roles.",
    icon: UserCheckIcon,
    iconBg: "bg-indigo-500",
    href: "/configuracion/usuarios",
  },
  {
    title: "Dominios permitidos",
    description: "Configurá qué dominios de email pueden iniciar sesión con Google.",
    icon: () => (
      <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    iconBg: "bg-teal-500",
    href: "/configuracion/dominios",
  },
  {
    title: "Roles de usuarios",
    description: "Asigná permisos de administración a los usuarios del sistema.",
    icon: () => (
      <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    iconBg: "bg-purple-500",
    href: "/configuracion/roles",
  },
  {
    title: "Tipos de Materia",
    description: "Configurá los tipos de materia (obligatoria, optativa, electiva, etc.).",
    icon: () => (
      <svg className="size-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    iconBg: "bg-amber-500",
    href: "/configuracion/tipos-materia",
  },
];

export default function ConfiguracionPage() {
  return (
    <>
      <PageMeta title="SACAD - Configuración" description="Configuración del sistema" />

      <PageBreadcrumb items={[{ label: "Configuración" }]} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {configCards.map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="relative flex items-center gap-x-4 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div className={`flex size-12 flex-none items-center justify-center rounded-lg ${card.iconBg}`}>
              <card.icon className="size-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.title}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
