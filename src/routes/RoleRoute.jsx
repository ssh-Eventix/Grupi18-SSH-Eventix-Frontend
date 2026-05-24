import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const normalizeRole = (role) => role?.toLowerCase();

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user.role);

  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeRole(role));

  if (!normalizedAllowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;