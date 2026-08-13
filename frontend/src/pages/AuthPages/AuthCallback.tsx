import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/auth/AuthContext";
import { apiClient } from "../../api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const access = params.get("access");
    const refresh = params.get("refresh");
    window.history.replaceState(null, "", "/auth/callback");

    if (access && refresh) {
      sessionStorage.setItem("access_token", access);
      sessionStorage.setItem("refresh_token", refresh);
      apiClient.get("/auth/me/").then((res) => {
        login(access, refresh, res.data);
        navigate("/", { replace: true });
      });
    } else {
      navigate("/signin", { replace: true });
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 dark:text-gray-400">Ingresando...</p>
    </div>
  );
}
