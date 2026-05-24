import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaChartPie,
  FaBrain,
  FaClipboardList,
  FaCog,
  FaCreditCard,
  FaEnvelope,
  FaFileAlt,
  FaListAlt,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaStore,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";

const links = [
  { path: "/superadmin", label: "Overview", icon: FaChartPie, end: true },
  { path: "/superadmin/tenants", label: "Tenants", icon: FaStore },
  { path: "/superadmin/tenant-domains", label: "Tenant Domains", icon: FaEnvelope },
  { path: "/superadmin/tenant-admins", label: "Tenant Admins", icon: FaUsers },
  { path: "/superadmin/events", label: "Events", icon: FaCalendarAlt },
  { path: "/superadmin/users", label: "Users", icon: FaUsers },
  { path: "/superadmin/venues", label: "Venues", icon: FaMapMarkerAlt },
  { path: "/superadmin/tickets", label: "Tickets", icon: FaCreditCard },
  { path: "/superadmin/orders", label: "Orders", icon: FaClipboardList },
  { path: "/superadmin/reports", label: "Reports", icon: FaFileAlt },
  { path: "/superadmin/analytics", label: "Analytics", icon: FaChartPie },
  { path: "/superadmin/archive", label: "Archive", icon: FaFileAlt },
  { path: "/superadmin/ai-logs", label: "AI Logs", icon: FaBrain },
  { path: "/superadmin/system-logs", label: "System Logs", icon: FaListAlt },
  { path: "/superadmin/settings", label: "Settings", icon: FaCog },
];

const SuperAdminLayout = () => {
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
          <span>EventHub</span>
        </div>

        <nav className="side-nav" aria-label="Super admin navigation">
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
          <span>SUPERADMIN (Platform Owner)</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
