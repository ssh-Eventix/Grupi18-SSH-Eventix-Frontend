import { NavLink, Outlet } from "react-router-dom";

const BuyerLayout = () => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Eventix</h2>
        <p>Buyer</p>

        <nav>
          <NavLink to="/buyer">Discover Events</NavLink>
          <NavLink to="/buyer/tickets">My Tickets</NavLink>
          <NavLink to="/buyer/favorites">Favorites</NavLink>
          <NavLink to="/buyer/profile">Profile</NavLink>
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <h1>Find Events</h1>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default BuyerLayout;