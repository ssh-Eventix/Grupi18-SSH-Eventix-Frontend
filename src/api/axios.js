import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5225/api",
  headers: {
    "Content-Type": "application/json",
  },
});

const DEFAULT_TENANT_SLUG = "yllka";

api.interceptors.request.use(
  (config) => {
    const url = config.url || "";

    const isRegister = url.includes("/auth/register");
    const isLogin = url.includes("/auth/login");

    if (isRegister) {
      delete config.headers.Authorization;
      delete config.headers["X-Tenant-Slug"];
      return config;
    }

    if (isLogin) {
      delete config.headers.Authorization;

      const tenantSlug = config.headers["X-Tenant-Slug"];

      if (!tenantSlug) {
        delete config.headers["X-Tenant-Slug"];
      }

      return config;
    }

    const token = localStorage.getItem("token");
    const tenantSlug = localStorage.getItem("tenantSlug") || DEFAULT_TENANT_SLUG;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-Tenant-Slug"] = config.headers["X-Tenant-Slug"] || tenantSlug;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.suppressAuthRedirect) {
      localStorage.removeItem("token");
      localStorage.removeItem("tenantSlug");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
