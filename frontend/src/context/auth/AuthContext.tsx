import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "../../api";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: number[];
  group_names: string[];
  foto?: string | null;
  zoom_level?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (access: string, refresh: string, userData?: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");
    if (token) {
      apiClient
        .get("/auth/me/")
        .then((res) => {
          setUser(res.data);
          if (res.data.zoom_level) {
            document.documentElement.style.fontSize = `${res.data.zoom_level}%`;
          }
        })
        .catch(() => {
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (access: string, refresh: string, userData?: User) => {
    sessionStorage.setItem("access_token", access);
    sessionStorage.setItem("refresh_token", refresh);
    if (userData) {
      setUser(userData);
    } else {
      apiClient.get("/auth/me/").then((res) => setUser(res.data));
    }
  };

  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    setUser(null);
    window.location.replace("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
