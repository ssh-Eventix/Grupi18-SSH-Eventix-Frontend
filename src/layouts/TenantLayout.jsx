import { NavLink, Outlet } from "react-router-dom";
import {
  FaCalendarCheck,
  FaCalendarPlus,
  FaChartBar,
  FaCheckCircle,
  FaClipboardList,
  FaCog,
  FaCreditCard,
  FaEnvelope,
  FaDoorOpen,
  FaMicrophone,
  FaMapMarkerAlt,
  FaPercent,
  FaQrcode,
  FaRegCalendarAlt,
  FaStar,
  FaStore,
  FaUsers,
} from "react-icons/fa";

const links = [
  { path: "/tenant", label: "Dashboard", icon: FaChartBar, end: true },
  { path: "/tenant/events", label: "Events", icon: FaRegCalendarAlt },
  { path: "/tenant/create-event", label: "Create Event", icon: FaCalendarPlus },
  { path: "/tenant/event-sessions", label: "Sessions", icon: FaCalendarCheck },
  { path: "/tenant/speakers", label: "Speakers", icon: FaMicrophone },
  { path: "/tenant/coupons", label: "Coupons", icon: FaPercent },
  { path: "/tenant/tickets", label: "Tickets", icon: FaCreditCard },
  { path: "/tenant/orders", label: "Orders", icon: FaClipboardList },
  { path: "/tenant/payments", label: "Payments", icon: FaCreditCard },
  { path: "/tenant/attendees", label: "Attendees", icon: FaUsers },
  { path: "/tenant/check-in", label: "Check-in", icon: FaQrcode },
  { path: "/tenant/notifications", label: "Notifications", icon: FaEnvelope },
  { path: "/tenant/reviews", label: "Reviews", icon: FaStar },
  { path: "/tenant/venues", label: "Venues", icon: FaMapMarkerAlt },
  { path: "/tenant/roles", label: "Roles", icon: FaCheckCircle },
  { path: "/tenant/reports", label: "Reports", icon: FaCalendarCheck },
  { path: "/tenant/settings", label: "Settings", icon: FaCog },
];

const TenantLayout = () => {
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
