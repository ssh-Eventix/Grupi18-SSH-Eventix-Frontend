import { NavLink, Outlet } from "react-router-dom";

const SuperAdminLayout = () => {
  const links = [
    { path: "/superadmin", label: "Dashboard", end: true },
    { path: "/superadmin/bookings", label: "Bookings" },
    { path: "/superadmin/tickets", label: "Tickets" },
    { path: "/superadmin/ticket-types", label: "Ticket Types" },
    { path: "/superadmin/reports", label: "Reports" },
    { path: "/superadmin/staff", label: "Staff" },
    { path: "/superadmin/settings", label: "Settings" }
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Eventix</h2>
        <p>Super Admin</p>

        <nav>
          {links.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>SuperAdmin Panel</h1>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default SuperAdminLayout;
