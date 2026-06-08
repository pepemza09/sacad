import apiClient from "./client";

export const academicaApi = {
  facultades: (params?: Record<string, unknown>) =>
    apiClient.get("/facultades/", { params }),
  carreraDetalle: (id: number) => apiClient.get(`/carreras/${id}/`),
  carreras: (params?: Record<string, unknown>) =>
    apiClient.get("/carreras/", { params }),
  planDetalle: (id: number) => apiClient.get(`/planes/${id}/`),
  planArbol: (id: number) => apiClient.get(`/planes/${id}/arbol_curricular/`),
  planes: (params?: Record<string, unknown>) =>
    apiClient.get("/planes/", { params }),
  materias: (params?: Record<string, unknown>) =>
    apiClient.get("/materias/", { params }),
  materiaDetalle: (id: number) => apiClient.get(`/materias/${id}/`),
  materiaCorrelativas: (id: number) =>
    apiClient.get(`/materias/${id}/correlativas/`),
  createMateria: (data: Record<string, unknown>) =>
    apiClient.post("/materias/", data),
  updateMateria: (id: number, data: Record<string, unknown>) =>
    apiClient.put(`/materias/${id}/`, data),
  deleteMateria: (id: number) => apiClient.delete(`/materias/${id}/`),
  createCorrelatividad: (data: Record<string, unknown>) =>
    apiClient.post("/correlatividades/", data),
  deleteCorrelatividad: (id: number) =>
    apiClient.delete(`/correlatividades/${id}/`),
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
