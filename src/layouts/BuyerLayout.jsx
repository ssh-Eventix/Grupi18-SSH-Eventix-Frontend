import { NavLink, Outlet } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCompass,
  FaCog,
  FaHeart,
  FaReceipt,
  FaTicketAlt,
  FaUser,
} from "react-icons/fa";

const links = [
  { path: "/buyer", label: "Discover", icon: FaCompass, end: true },
  { path: "/buyer/top-events", label: "Top Events", icon: FaCalendarAlt },
  { path: "/buyer/weekend", label: "This Weekend", icon: FaTicketAlt },
  { path: "/buyer/free-events", label: "Free Events", icon: FaReceipt },
  { path: "/buyer/tickets", label: "My Tickets", icon: FaTicketAlt },
  { path: "/buyer/favorites", label: "Favorites", icon: FaHeart },
  { path: "/buyer/profile", label: "Profile", icon: FaUser },
  { path: "/buyer/settings", label: "Settings", icon: FaCog },
];

const BuyerLayout = () => {
  return (
    <div className="app-shell buyer-theme">
      <aside className="sidebar buyer-sidebar">
        <nav className="side-nav" aria-label="Buyer navigation">
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
        <Outlet />
      </main>
    </div>
  );
};

export default BuyerLayout;
