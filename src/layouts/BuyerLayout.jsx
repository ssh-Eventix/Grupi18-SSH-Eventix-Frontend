import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FaBell,
  FaCalendarAlt,
  FaCompass,
  FaCog,
  FaHeart,
  FaReceipt,
  FaTicketAlt,
  FaUser,
} from "react-icons/fa";
import { getUnreadBuyerNotifications } from "../services/buyerStorage";

const links = [
  { path: "/buyer", label: "Discover", icon: FaCompass, end: true },
  { path: "/buyer/top-events", label: "Top Events", icon: FaCalendarAlt },
  { path: "/buyer/weekend", label: "This Week", icon: FaTicketAlt },
  { path: "/buyer/free-events", label: "Free Events", icon: FaReceipt },
  { path: "/buyer/tickets", label: "My Tickets", icon: FaTicketAlt },
  { path: "/buyer/favorites", label: "Favorites", icon: FaHeart },
  { path: "/buyer/notifications", label: "Notifications", icon: FaBell },
  { path: "/buyer/profile", label: "Profile", icon: FaUser },
  { path: "/buyer/settings", label: "Settings", icon: FaCog },
];

const BuyerLayout = () => {
  const [notificationCount, setNotificationCount] = useState(() => getUnreadBuyerNotifications().length);

  useEffect(() => {
    const updateNotificationCount = () => {
      setNotificationCount(getUnreadBuyerNotifications().length);
    };

    window.addEventListener("buyerNotificationsChanged", updateNotificationCount);
    window.addEventListener("storage", updateNotificationCount);

    return () => {
      window.removeEventListener("buyerNotificationsChanged", updateNotificationCount);
      window.removeEventListener("storage", updateNotificationCount);
    };
  }, []);

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
                {link.path === "/buyer/notifications" && notificationCount > 0 && (
                  <b className="nav-count-badge">{notificationCount}</b>
                )}
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
