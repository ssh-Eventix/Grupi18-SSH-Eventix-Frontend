export const getUserFromToken = (token, fallbackEmail = "") => {
  if (!token) return null;

  const payload = JSON.parse(atob(token.split(".")[1]));

  const role =
    payload.role ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    payload.roles ||
    "";

  const email =
    payload.email ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
    fallbackEmail;

  return {
    id:
      payload.sub ||
      payload.nameid ||
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
    email,
    role: Array.isArray(role) ? role[0] : role,
    tenantId: payload.tenantId,
    tenantSlug: payload.tenantSlug,
  };
};

export const defaultPathForRole = (role) => {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

  if (normalizedRole === "superadmin") {
    return "/superadmin";
  }

  if (
    normalizedRole === "admin" ||
    normalizedRole === "tenantadmin" ||
    normalizedRole === "staff"
  ) {
    return "/tenant";
  }

  if (normalizedRole === "buyer") {
    return "/buyer";
  }

  return "/buyer";
};

export const startupPathFromToken = () => {
  const token = localStorage.getItem("token");

  if (!token) return "/login";

  try {
    const user = getUserFromToken(token);
    return defaultPathForRole(user.role);
  } catch {
    return "/login";
  }
};