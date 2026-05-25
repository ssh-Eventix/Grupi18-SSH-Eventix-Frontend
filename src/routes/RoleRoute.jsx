import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const userRole = normalizeRole(user.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!normalizedAllowedRoles.includes(userRole)) {
    if (userRole === "superadmin") {
      return <Navigate to="/superadmin" replace />;
    }

    if (["admin", "tenantadmin", "staff"].includes(userRole)) {
      return <Navigate to="/tenant" replace />;
    }

    if (userRole === "buyer") {
      return <Navigate to="/buyer" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;