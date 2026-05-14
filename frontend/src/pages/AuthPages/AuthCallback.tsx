import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuth } from "../../context/auth/AuthContext";
import { apiClient } from "../../api";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const access = params.get("access");
    const refresh = params.get("refresh");

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
