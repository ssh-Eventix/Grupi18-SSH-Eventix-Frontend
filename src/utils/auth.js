export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

export const getTenant = () => localStorage.getItem("tenantSlug");
export const setTenant = (tenant) => localStorage.setItem("tenantSlug", tenant);
export const removeTenant = () => localStorage.removeItem("tenantSlug");