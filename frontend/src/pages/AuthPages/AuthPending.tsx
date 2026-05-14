import { useState } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { Modal } from "../../components/ui/modal";

export default function AuthPending() {
  const [isOpen] = useState(true);

  return (
    <>
      <PageMeta title="SACAD - Pendiente de aprobación" description="" />
      <AuthLayout>
        <div className="flex flex-col flex-1" />
      </AuthLayout>

      <Modal isOpen={isOpen} onClose={() => {}} className="max-w-[450px] m-4">
        <div className="no-scrollbar relative w-full max-w-[450px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/10">
              <svg
                className="h-8 w-8 text-yellow-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h4 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
              Cuenta pendiente de aprobación
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Te registraste con tu cuenta de Google correctamente. Sin embargo, un
              administrador debe habilitar tu ingreso antes de que puedas acceder al
              sistema. Cuando sea aprobado, vas a poder iniciar sesión con Google.
            </p>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-5 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
