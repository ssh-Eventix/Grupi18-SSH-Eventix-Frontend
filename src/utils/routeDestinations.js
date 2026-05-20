import { jwtDecode } from "jwt-decode";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const NAME_ID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

export const getRolesFromDecodedToken = (decoded) => {
  const claimValue = decoded.role || decoded.roles || decoded[ROLE_CLAIM];

  if (!claimValue) return [];

  return Array.isArray(claimValue) ? claimValue : [claimValue];
};

export const getUserFromToken = (token, fallbackEmail = "") => {
  const decoded = jwtDecode(token);
  const roles = getRolesFromDecodedToken(decoded);

  return {
    id: decoded.sub || decoded.nameid || decoded[NAME_ID_CLAIM],
    email: decoded.email || decoded[EMAIL_CLAIM] || fallbackEmail,
    tenantId: decoded.tenantId,
    role: roles[0],
    roles,
  };
};

export const defaultPathForRole = (role) => {
  if (role === "SuperAdmin") return "/superadmin";
  if (["Admin", "TenantAdmin", "Organizer", "Staff"].includes(role)) return "/tenant";
  return "/buyer";
};

export const startupPathFromToken = () => {
  const token = localStorage.getItem("token");

  if (!token) return "/login";

  try {
    const roles = getRolesFromDecodedToken(jwtDecode(token));

    return defaultPathForRole(roles[0]);
  } catch {
    localStorage.removeItem("token");
    return "/login";
  }
};
