import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../utils/roles";

const TenantLayout = () => {
  const { user } = useAuth();

  const isStaff = user?.role === ROLES.STAFF;

  const tenantAdminLinks = [
    { path: "/tenant", label: "Dashboard" },
    { path: "/tenant/events", label: "Events" },
    { path: "/tenant/create-event", label: "Create Event" },
    { path: "/tenant/venues", label: "Venues" },
    { path: "/tenant/tickets", label: "Tickets" },
    { path: "/tenant/orders", label: "Orders" },
    { path: "/tenant/attendees", label: "Attendees" },
    { path: "/tenant/check-in", label: "Check-In" },
    { path: "/tenant/reports", label: "Reports" },
    { path: "/tenant/settings", label: "Settings" },
  ];

  const staffLinks = [
    { path: "/staff", label: "Dashboard" },
    { path: "/staff/events", label: "Assigned Events" },
    { path: "/staff/attendees", label: "Attendees" },
    { path: "/staff/check-in", label: "Check-In" },
  ];

  const links = isStaff ? staffLinks : tenantAdminLinks;

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Eventix</h2>
        <p>{isStaff ? "Staff Panel" : "Tenant Admin Panel"}</p>

        <nav>
          {links.map((link) => (
            <NavLink key={link.path} to={link.path} end>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>{isStaff ? "Staff Dashboard" : "Tenant Dashboard"}</h1>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default TenantLayout;