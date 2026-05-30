import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5225/api",
  headers: { "Content-Type": "application/json" },
});

const getStoredTenantSlug = () => {
  const directSlug = localStorage.getItem("tenantSlug");

  if (directSlug) {
    return directSlug;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.tenantSlug || user?.tenant?.slug || "";
  } catch {
    return "";
  }
};

api.interceptors.request.use((config) => {
  const url = config.url || "";
  
if (url.includes("/Events/public")) {
  delete config.headers.Authorization;
  delete config.headers["X-Tenant-Slug"];
  return config;
}

  if (url.includes("/ai/buyer")) {
    delete config.headers["X-Tenant-Slug"];
  }

  if (
    url.includes("/auth/register") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password")
  ) {
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
  const tenantSlug = config.headers["X-Tenant-Slug"] || getStoredTenantSlug();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

    if (
    url.includes("/Venue/public") ||
    url.includes("/VenueSection/public")||
    url.includes("/AuditLog")
  ) {
    delete config.headers["X-Tenant-Slug"];
    return config;
  }

  if (tenantSlug && !url.includes("/ai/buyer")) {
    config.headers["X-Tenant-Slug"] = tenantSlug;
  } else {
    delete config.headers["X-Tenant-Slug"];
  }

  return config;
});

export default api;
