import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/auth/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated || !sessionStorage.getItem("access_token")) {
    return <Navigate to="/signin" replace />;
  }

  if (user?.needs_group) {
    return <Navigate to="/auth/pending?reason=group" replace />;
  }

  return <Outlet />;
}
