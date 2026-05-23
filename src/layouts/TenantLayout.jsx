import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaClipboardList,
  FaCog,
  FaCreditCard,
  FaDoorOpen,
  FaQrcode,
  FaRegCalendarAlt,
  FaSignOutAlt,
  FaStar,
  FaStore,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";

const links = [
  { path: "/tenant", label: "Overview", icon: FaChartBar, end: true },
  { path: "/tenant/events", label: "Events", icon: FaRegCalendarAlt },
  { path: "/tenant/tickets", label: "Tickets", icon: FaCreditCard },
  { path: "/tenant/orders", label: "Orders", icon: FaClipboardList },
  { path: "/tenant/check-in", label: "Check-in", icon: FaQrcode },
  { path: "/tenant/attendees", label: "Attendees", icon: FaUsers },
  { path: "/tenant/staff", label: "Staff", icon: FaUsers },
  { path: "/tenant/reviews", label: "Reviews", icon: FaStar },
  { path: "/tenant/reports", label: "Reports", icon: FaChartBar },
  { path: "/tenant/settings", label: "Settings", icon: FaCog },
];

const TenantLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell tenant-theme">
      <aside className="sidebar">
        <div className="brand">
          <FaStore />
          <span>EventHub</span>
        </div>
        <button className="org-switch" type="button">
          My Organization
          <FaDoorOpen />
        </button>

        <nav className="side-nav" aria-label="Tenant navigation">
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
        <div className="role-ribbon tenant-ribbon">
          <FaUsers />
          <span>TENANT (Event Organizer)</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default TenantLayout;
