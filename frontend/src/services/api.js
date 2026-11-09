// Every call to the FastAPI backend goes through this one axios instance.
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
});

// Attach the JWT saved at login to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lirs_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token expired, clear it and send the user back to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes("/auth/login")) {
      localStorage.removeItem("lirs_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  return detail || err.message || "Something went wrong";
};

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  changePassword: (current_password, new_password) =>
    api.post("/auth/change-password", null, { params: { current_password, new_password } }),
};

export const correspondenceApi = {
  list: (params) => api.get("/correspondence", { params }).then((r) => r.data),
  get: (id) => api.get(`/correspondence/${id}`).then((r) => r.data),
  create: (data) => api.post("/correspondence", data).then((r) => r.data),
  update: (id, data) => api.patch(`/correspondence/${id}`, data).then((r) => r.data),
  changeStatus: (id, new_status, notes) =>
    api.post(`/correspondence/${id}/status`, { new_status, notes }).then((r) => r.data),
  history: (id) => api.get(`/correspondence/${id}/history`).then((r) => r.data),
  remove: (id) => api.delete(`/correspondence/${id}`),
};

export const usersApi = {
  list: () => api.get("/users").then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  update: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then((r) => r.data),
};

export const departmentsApi = {
  list: () => api.get("/departments").then((r) => r.data),
};

export const reportsApi = {
  summary: () => api.get("/reports/summary").then((r) => r.data),
  byStatus: () => api.get("/reports/by-status").then((r) => r.data),
  byDepartment: () => api.get("/reports/by-department").then((r) => r.data),
  byOfficer: () => api.get("/reports/by-officer").then((r) => r.data),
  monthly: () => api.get("/reports/monthly").then((r) => r.data),
};

export const adminApi = {
  schema: () => api.get("/admin/schema").then((r) => r.data),
  query: (sql) => api.post("/admin/query", { sql }).then((r) => r.data),
};

export default api;
