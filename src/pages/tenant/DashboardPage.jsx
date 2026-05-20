import {
  FaCalendarAlt,
  FaChartLine,
  FaCheck,
  FaClipboardList,
  FaQrcode,
  FaTicketAlt,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Events", value: "12", note: "+2 this month", icon: FaCalendarAlt },
  { label: "Tickets Sold", value: "5,420", note: "+16% this month", icon: FaTicketAlt },
  { label: "Total Revenue", value: "EUR 86,750", note: "+22% this month", icon: FaWallet },
  { label: "Total Attendees", value: "2,350", note: "+15% this month", icon: FaUsers },
];

const events = [
  {
    title: "Tech Conference 2025",
    meta: "May 24, 2025 - 09:00 AM",
    venue: "Tirana Convention Center",
    sold: "1,250 / 1,500",
    image: "linear-gradient(135deg, #29135f, #8b5cf6 45%, #22d3ee)",
  },
  {
    title: "Marketing Summit",
    meta: "Jun 10, 2025 - 10:00 AM",
    venue: "Hotel Rogner, Tirana",
    sold: "850 / 1,000",
    image: "linear-gradient(135deg, #062745, #2563eb 48%, #f97316)",
  },
  {
    title: "Startup Weekend Tirana",
    meta: "Jun 28, 2025 - 09:00 AM",
    venue: "TUMO Center",
    sold: "620 / 800",
    image: "linear-gradient(135deg, #0f172a, #334155 52%, #f59e0b)",
  },
];

const actions = [
  { label: "Events", path: "/tenant/events", icon: FaClipboardList },
  { label: "Categories", path: "/tenant/event-categories", icon: FaCalendarAlt },
  { label: "Sections", path: "/tenant/event-sections", icon: FaCalendarAlt },
  { label: "Sessions", path: "/tenant/event-sessions", icon: FaCalendarAlt },
  { label: "Speakers", path: "/tenant/speakers", icon: FaUsers },
  { label: "Tickets", path: "/tenant/tickets", icon: FaTicketAlt },
  { label: "Bookings", path: "/tenant/orders", icon: FaWallet },
  { label: "Payments", path: "/tenant/payments", icon: FaWallet },
  { label: "Coupons", path: "/tenant/coupons", icon: FaCheck },
  { label: "Check-ins", path: "/tenant/check-in", icon: FaQrcode },
  { label: "Notifications", path: "/tenant/notifications", icon: FaChartLine },
  { label: "Reviews", path: "/tenant/reviews", icon: FaCheck },
  { label: "Users", path: "/tenant/attendees", icon: FaUsers },
  { label: "Roles", path: "/tenant/roles", icon: FaCheck },
  { label: "Venues", path: "/tenant/venues", icon: FaCalendarAlt },
  { label: "Venue Sections", path: "/tenant/venue-sections", icon: FaCalendarAlt },
];

const chartPoints = "0,92 38,62 76,50 114,76 152,64 190,38 228,22 266,28 304,10";

function DashboardPage() {
  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's what's happening with your events.</p>
        </div>
        <div className="profile-chip">
          <span className="notification-dot">3</span>
          <span className="avatar">AE</span>
          <div>
            <strong>Arne Events</strong>
            <small>Organization Admin</small>
          </div>
        </div>
      </header>

      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
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

      <div className="dashboard-grid">
        <article className="panel upcoming-panel">
          <div className="panel-title">
            <h2>Upcoming Events</h2>
            <button type="button">View All</button>
          </div>
          <div className="event-list">
            {events.map((event) => (
              <div className="event-row" key={event.title}>
                <span className="event-thumb" style={{ background: event.image }} />
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.meta}</small>
                  <small>{event.venue}</small>
                </div>
                <div className="event-sales">
                  <strong>{event.sold}</strong>
                  <small>Tickets Sold</small>
                </div>
                <span className="live-pill">Live</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-title">
            <h2>Sales Overview</h2>
            <button type="button">This Month</button>
          </div>
          <div className="line-chart purple-chart">
            <svg viewBox="0 0 320 130" role="img" aria-label="Sales trend chart">
              <polyline points={chartPoints} />
              {chartPoints.split(" ").map((point) => {
                const [cx, cy] = point.split(",");
                return <circle key={point} cx={cx} cy={cy} r="4" />;
              })}
            </svg>
          </div>
        </article>
      </div>

      <article className="panel quick-actions">
        <div className="panel-title">
          <h2>Quick Actions</h2>
        </div>
        <div className="quick-grid">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link to={action.path} key={action.label}>
                <Icon />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}

export default DashboardPage;
