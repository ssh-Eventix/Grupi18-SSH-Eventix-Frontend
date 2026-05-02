import { NavLink, Outlet } from "react-router-dom";

const SuperAdminLayout = () => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Eventix</h2>
        <p>Super Admin</p>

        <nav>
          <NavLink to="/superadmin">Dashboard</NavLink>
          <NavLink to="/superadmin/tenants">Tenants</NavLink>
          <NavLink to="/superadmin/create-tenant">Create Tenant</NavLink>
          <NavLink to="/superadmin/users">Tenant Users</NavLink>
          <NavLink to="/superadmin/events">All Events</NavLink>
          <NavLink to="/superadmin/reports">Platform Reports</NavLink>
          <NavLink to="/superadmin/logs">System Logs</NavLink>
          <NavLink to="/superadmin/settings">System Settings</NavLink>
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