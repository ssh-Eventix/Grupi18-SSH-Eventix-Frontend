import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5225/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const url = config.url || "";

  api.interceptors.request.use((config) => {
  const url = config.url || "";

  if (url.includes("/Events/public")) {
    delete config.headers.Authorization;
    delete config.headers["X-Tenant-Slug"];
    return config;
  }

  if (url.includes("/auth/register")) {
    delete config.headers.Authorization;
    delete config.headers["X-Tenant-Slug"];
    return config;
  }

  if (url.includes("/auth/login")) {
    delete config.headers.Authorization;
    if (!config.headers["X-Tenant-Slug"]) {
      delete config.headers["X-Tenant-Slug"];
    }
    return config;
  }

  const token = localStorage.getItem("token");
  const tenantSlug = config.headers["X-Tenant-Slug"] || localStorage.getItem("tenantSlug");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  else delete config.headers["X-Tenant-Slug"];

  return config;
});

  if (url.includes("/auth/register")) {
    delete config.headers.Authorization;
    delete config.headers["X-Tenant-Slug"];
    return config;
  }

  if (url.includes("/auth/login")) {
    delete config.headers.Authorization;
    if (!config.headers["X-Tenant-Slug"]) {
      delete config.headers["X-Tenant-Slug"];
    }
    return config;
  }

  const token = localStorage.getItem("token");
  const tenantSlug = config.headers["X-Tenant-Slug"] || localStorage.getItem("tenantSlug");

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) config.headers["X-Tenant-Slug"] = tenantSlug;
  else delete config.headers["X-Tenant-Slug"];

  return config;
});

export default api;
