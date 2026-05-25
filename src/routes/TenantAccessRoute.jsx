import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

export default function TenantAccessRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = normalizeRole(user.role);
  const allowed = allowedRoles.map(normalizeRole);

  if (!allowed.includes(role)) {
    return <Navigate to={role === "staff" ? "/tenant/check-in" : "/tenant"} replace />;
  }

  return children;
}
