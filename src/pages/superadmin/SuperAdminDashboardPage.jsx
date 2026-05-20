import {
  FaCalendarAlt,
  FaChartPie,
  FaCheckSquare,
  FaCrown,
  FaStore,
  FaTicketAlt,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Tenants", value: "48", note: "+8 this month", icon: FaStore },
  { label: "Total Events", value: "1,248", note: "+18% this month", icon: FaCheckSquare },
  { label: "Tickets Sold", value: "125,860", note: "+21% this month", icon: FaTicketAlt },
  { label: "Total Revenue", value: "EUR 1,245,300", note: "+24% this month", icon: FaWallet },
];

const topEvents = [
  ["Tech Conference 2025", "Acme Events", "EUR 68,750"],
  ["AI & Future Summit", "Future Group", "EUR 53,200"],
  ["Marketing Summit", "BrandHub", "EUR 41,800"],
  ["Design Talks", "CreativeHub", "EUR 32,450"],
];

const tenants = [
  ["Acme Events", "Joined May 21, 2025"],
  ["CreativeHub", "Joined May 20, 2025"],
  ["Future Group", "Joined May 18, 2025"],
  ["BrandHub", "Joined May 15, 2025"],
];

const modules = [
  { label: "Tenants", path: "/superadmin/tenants", icon: FaStore },
  { label: "Events", path: "/superadmin/events", icon: FaCalendarAlt },
  { label: "Users", path: "/superadmin/users", icon: FaUsers },
  { label: "Venues", path: "/superadmin/venues", icon: FaStore },
  { label: "Tickets", path: "/superadmin/tickets", icon: FaTicketAlt },
  { label: "Bookings", path: "/superadmin/orders", icon: FaWallet },
  { label: "Audit Logs", path: "/superadmin/system-logs", icon: FaChartPie },
  { label: "Archive", path: "/superadmin/archive", icon: FaChartPie },
  { label: "AI Logs", path: "/superadmin/ai-logs", icon: FaCrown },
  { label: "Roles", path: "/superadmin/settings", icon: FaCrown },
];

function SuperAdminDashboardPage() {
  return (
    <section className="dashboard-page admin-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Platform Overview</h1>
          <p>Monitor and manage the entire platform.</p>
        </div>
        <div className="profile-chip">
          <span className="notification-dot">3</span>
          <span className="avatar blue-avatar">SA</span>
          <div>
            <strong>Super Admin</strong>
            <small>Platform Owner</small>
          </div>
        </div>
      </header>

      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card blue-stat" key={stat.label}>
              <span className="stat-icon">
                <Icon />
              </span>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>{stat.note}</small>
              </div>
            </article>
          );
        })}
      </div>

      <div className="admin-grid">
        <article className="panel chart-panel">
          <div className="panel-title">
            <h2>Revenue Overview</h2>
            <button type="button">This Month</button>
          </div>
          <div className="line-chart blue-chart">
            <svg viewBox="0 0 320 130" role="img" aria-label="Revenue trend chart">
              <polyline points="0,82 34,58 68,66 102,42 136,56 170,22 204,44 238,36 272,6 306,14" />
            </svg>
          </div>
        </article>

        <article className="panel top-list">
          <div className="panel-title">
            <h2>Top Performing Events</h2>
            <button type="button">View All</button>
          </div>
          {topEvents.map(([title, owner, revenue], index) => (
            <div className="rank-row" key={title}>
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <small>{owner}</small>
              </div>
              <b>{revenue}</b>
            </div>
          ))}
        </article>

        <article className="panel status-panel">
          <div className="panel-title">
            <h2>Events by Status</h2>
          </div>
          <div className="donut-wrap">
            <div className="donut-chart" />
            <ul>
              <li><span className="dot blue" />Upcoming <b>605 (48%)</b></li>
              <li><span className="dot green" />Ongoing <b>152 (12%)</b></li>
              <li><span className="dot orange" />Completed <b>511 (41%)</b></li>
              <li><span className="dot red" />Canceled <b>21 (2%)</b></li>
            </ul>
          </div>
        </article>

        <article className="panel top-list">
          <div className="panel-title">
            <h2>Recent Tenants</h2>
            <button type="button">View All</button>
          </div>
          {tenants.map(([name, date]) => (
            <div className="tenant-row" key={name}>
              <span><FaCrown /></span>
              <strong>{name}</strong>
              <small>{date}</small>
            </div>
          ))}
        </article>
      </div>

      <article className="panel quick-actions module-directory">
        <div className="panel-title">
          <h2>Platform Modules</h2>
        </div>
        <div className="quick-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link to={module.path} key={module.label}>
                <Icon />
                <span>{module.label}</span>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}

export default SuperAdminDashboardPage;
