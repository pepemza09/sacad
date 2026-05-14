import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/auth/AuthContext";
import { authApi } from "../../api";

export default function SignInForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.emailLogin(email, password);
      login(res.data.access, res.data.refresh, res.data.user);
      navigate("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        setError(axiosErr.response?.data?.detail || "Credenciales inválidas");
      } else {
        setError("Error de conexión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/accounts/google/login/?process=login";
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresá con tu cuenta @fce.uncu.edu.ar
            </p>
          </div>
          <div>
            <div className="tooltip-trigger relative">
              <button
                onClick={handleGoogleLogin}
                className="flex items-center justify-center w-full gap-3 px-4 py-3 mb-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                data-tooltip-target="tooltip-google"
                data-tooltip-style="light"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Ingresar con Google
              </button>
              <div id="tooltip-google" role="tooltip" className="tooltip top-full left-1/2 -translate-x-1/2 mt-2 inline-block px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded-lg shadow-theme-xs dark:text-white/90 dark:bg-gray-800 dark:border-gray-700 whitespace-nowrap">
                Ingresá con tu cuenta @fce.uncu.edu.ar
                <div className="tooltip-arrow"></div>
              </div>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 text-gray-500 bg-white dark:bg-gray-900 dark:text-gray-400">
                  o con email y contraseña
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:border-error-500/20 dark:text-error-400">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="admin@sacad.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresá tu contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="tooltip-trigger absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                      data-tooltip-target="tooltip-password"
                      data-tooltip-style="light"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                      <div id="tooltip-password" role="tooltip" className="tooltip top-full left-1/2 -translate-x-1/2 mt-2 inline-block px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded-lg shadow-theme-xs dark:text-white/90 dark:bg-gray-800 dark:border-gray-700 whitespace-nowrap">
                        {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        <div className="tooltip-arrow"></div>
                      </div>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="tooltip-trigger relative flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Mantener sesión iniciada
                    </span>
                    <div id="tooltip-sesion" role="tooltip" className="tooltip top-full left-1/2 -translate-x-1/2 mt-2 inline-block px-3 py-2 text-sm font-medium text-gray-800 bg-gray-100 border border-gray-200 rounded-lg shadow-theme-xs dark:text-white/90 dark:bg-gray-800 dark:border-gray-700 whitespace-nowrap">
                      La sesión se cerrará al cerrar el navegador
                      <div className="tooltip-arrow"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
