import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaClipboardList,
  FaCreditCard,
  FaDoorOpen,
  FaPercent,
  FaQrcode,
  FaRegCalendarAlt,
  FaSignOutAlt,
  FaStar,
  FaStore,
  FaUsers,
  FaFilter,
  FaLayerGroup,
  FaTicketAlt,
  FaUserFriends,
} from "react-icons/fa";
import { useAuth } from "../auth/AuthContext";

const adminLinks = [
  { path: "/tenant", label: "Overview", icon: FaChartBar, end: true },
  { path: "/tenant/events", label: "Events", icon: FaRegCalendarAlt },
  { path: "/tenant/event-sections", label: "Event Sections", icon: FaLayerGroup },
  { path: "/tenant/event-categories", label: "Event Sections", icon: FaFilter },
  { path: "/tenant/tickets", label: "Tickets", icon: FaTicketAlt },
  { path: "/tenant/payment-methods", label: "Payment Methods", icon: FaCreditCard },
  { path: "/tenant/coupons", label: "Coupons", icon: FaPercent },
  { path: "/tenant/orders", label: "Orders", icon: FaClipboardList },
  { path: "/tenant/check-in", label: "Check-in", icon: FaQrcode },
  { path: "/tenant/attendees", label: "Attendees", icon: FaUsers },
  { path: "/tenant/staff", label: "Staff", icon: FaUserFriends },
  { path: "/tenant/reviews", label: "Reviews", icon: FaStar },
  { path: "/tenant/reports", label: "Reports", icon: FaChartBar },
];

const staffLinks = [
  { path: "/tenant", label: "Overview", icon: FaChartBar, end: true },
  { path: "/tenant/check-in", label: "Check-in", icon: FaQrcode },
  { path: "/tenant/attendees", label: "Attendees", icon: FaUsers },
  { path: "/tenant/orders", label: "Orders", icon: FaClipboardList },
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

const TenantLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const isStaff = normalizeRole(user?.role) === "staff";
  const links = isStaff ? staffLinks : adminLinks;

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
          <span>{isStaff ? "STAFF (Event Operations)" : "TENANT (Event Organizer)"}</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default TenantLayout;
