import apiClient from "./client";

export const academicaApi = {
  facultades: (params?: Record<string, unknown>) =>
    apiClient.get("/facultades/", { params }),
  carreras: (params?: Record<string, unknown>) =>
    apiClient.get("/carreras/", { params }),
  planes: (params?: Record<string, unknown>) =>
    apiClient.get("/planes/", { params }),
  planDetalle: (id: number) => apiClient.get(`/planes/${id}/`),
  planArbol: (id: number) => apiClient.get(`/planes/${id}/arbol-curricular/`),
  materias: (params?: Record<string, unknown>) =>
    apiClient.get("/materias/", { params }),
  materiaDetalle: (id: number) => apiClient.get(`/materias/${id}/`),
  materiaCorrelativas: (id: number) =>
    apiClient.get(`/materias/${id}/correlativas/`),
  dashboard: (params?: Record<string, unknown>) =>
    apiClient.get("/dashboard/stats/", { params }),
};

export const equivalenciasApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/equivalencias/", { params }),
  create: (data: Record<string, unknown>) =>
    apiClient.post("/equivalencias/", data),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/equivalencias/${id}/`, data),
  delete: (id: number) => apiClient.delete(`/equivalencias/${id}/`),
  consultar: (materiaOrigen: number, planDestino: number) =>
    apiClient.get("/equivalencias/consultar/", {
      params: { materia_origen: materiaOrigen, plan_destino: planDestino },
    }),
};

export const authApi = {
  me: () => apiClient.get("/auth/me/"),
  login: (code: string) => apiClient.post("/auth/google/", { code }),
  emailLogin: (email: string, password: string) =>
    apiClient.post("/auth/login/", { email, password }),
};
