import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaChartPie,
  FaEnvelope,
  FaShieldAlt,
  FaSignOutAlt,
  FaStore,
  FaUserSecret,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";

const links = [
  { path: "/superadmin", label: "Overview", icon: FaChartPie, end: true },
  { path: "/superadmin/tenants", label: "Tenants", icon: FaStore },
  { path: "/superadmin/tenant-domains", label: "Tenant Domains", icon: FaEnvelope },
  { path: "/superadmin/tenant-admins", label: "Tenant Admins", icon: FaUsers },
  { path: "/superadmin/impersonate", label: "Impersonate", icon: FaUserSecret },
];

export default function SuperAdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell admin-theme">
      <aside className="sidebar">
        <div className="brand">
          <FaShieldAlt />
          <span>Eventix</span>
        </div>

        <nav className="side-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.path} to={link.path} end={link.end}>
                <Icon />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="logout-button" type="button" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="workspace">
        <div className="role-ribbon admin-ribbon">
          <FaShieldAlt />
          <span>SUPERADMIN</span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}