import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaTicketAlt,
  FaUsers,
  FaWallet,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { bookingService } from "../../services/bookingService";
import { eventsService } from "../../services/eventsService";
import { reviewsService } from "../../services/reviewsService";
import { ticketService } from "../../services/ticketService";
import { handleApiError } from "../../utils/apiErrorHandler";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("_", "");

const toArray = (value) => (Array.isArray(value) ? value : value?.data ?? []);

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatMoney = (value, currency = "EUR") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Date not set";
  return new Date(value).toLocaleString();
};

const ticketIsCheckedIn = (ticket) => {
  const status = Number(ticket.status ?? 0);
  return status === 1 || Boolean(ticket.usedAt || ticket.checkIn?.checkedInAtUtc);
};

const getInitials = (user) => {
  const email = Array.isArray(user?.email) ? user.email[0] : user?.email;
  const source = user?.fullName || email || "Tenant Admin";
  return source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "TA";
};

const eventBackgrounds = [
  "linear-gradient(135deg, #111827, #7c3aed 48%, #f97316)",
  "linear-gradient(135deg, #0f172a, #0ea5e9 50%, #22c55e)",
  "linear-gradient(135deg, #1f2937, #ef4444 52%, #facc15)",
];

const buildChartPoints = (bookings) => {
  const days = Array.from({ length: 8 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (7 - index));
    return date;
  });

  const counts = days.map((day) =>
    bookings.filter((booking) => {
      const value = booking.bookingDate || booking.createdAtUtc || booking.createdAt;
      if (!value) return false;
      const date = new Date(value);
      return date.toDateString() === day.toDateString();
    }).length
  );
  const max = Math.max(...counts, 1);

  return counts
    .map((count, index) => {
      const x = Math.round((304 / (counts.length - 1)) * index);
      const y = Math.round(104 - (count / max) * 88);
      return `${x},${y}`;
    })
    .join(" ");
};

function DashboardPage() {
  const { user } = useAuth();
  const isStaff = normalizeRole(user?.role) === "staff";
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      eventsService.getAll(),
      bookingService.getAll(),
      ticketService.getAll(),
      reviewsService.getAll(),
    ]);

    const [eventsResult, bookingsResult, ticketsResult, reviewsResult] = results;

    if (eventsResult.status === "fulfilled") setEvents(toArray(eventsResult.value));
    if (bookingsResult.status === "fulfilled") setBookings(toArray(bookingsResult.value));
    if (ticketsResult.status === "fulfilled") setTickets(toArray(ticketsResult.value));
    if (reviewsResult.status === "fulfilled") setReviews(toArray(reviewsResult.value));

    const failed = results.find((result) => result.status === "rejected");
    if (failed) setError(handleApiError(failed.reason));

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const dashboardStats = useMemo(() => {
    const checkedIn = tickets.filter(ticketIsCheckedIn).length;
    const revenue = bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
    const published = events.filter((event) => event.isPublished).length;
    const attendanceRate = tickets.length ? Math.round((checkedIn / tickets.length) * 100) : 0;

    return [
      {
        label: "Total Events",
        value: formatNumber(events.length),
        note: `${published} published`,
        icon: FaCalendarAlt,
      },
      {
        label: "Tickets Issued",
        value: formatNumber(tickets.length),
        note: `${checkedIn} checked in`,
        icon: FaTicketAlt,
      },
      {
        label: "Total Revenue",
        value: formatMoney(revenue),
        note: `${bookings.length} orders`,
        icon: FaWallet,
      },
      {
        label: "Attendance Rate",
        value: `${attendanceRate}%`,
        note: `${reviews.length} reviews`,
        icon: FaUsers,
      },
    ];
  }, [bookings, events, reviews.length, tickets]);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    const sorted = [...events].sort((a, b) => new Date(a.startUtc || 0) - new Date(b.startUtc || 0));
    const future = sorted.filter((event) => new Date(event.startUtc || 0).getTime() >= now);
    return (future.length ? future : sorted).slice(0, 3).map((event, index) => {
      const eventTickets = tickets.filter((ticket) => String(ticket.eventId) === String(event.id));

      return {
        id: event.id,
        title: event.title || event.name || "Untitled event",
        meta: formatDate(event.startUtc),
        venue: event.venueName || event.organizerName || "Venue not set",
        sold: `${formatNumber(eventTickets.length)} tickets issued`,
        image: event.bannerImageUrl
          ? `linear-gradient(90deg, rgba(15, 23, 42, 0.28), rgba(15, 23, 42, 0.1)), url(${event.bannerImageUrl})`
          : eventBackgrounds[index % eventBackgrounds.length],
        published: Boolean(event.isPublished),
      };
    });
  }, [events, tickets]);

  const chartPoints = useMemo(() => buildChartPoints(bookings), [bookings]);
  const recentOrders = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return bookings.filter((booking) => {
      const value = booking.bookingDate || booking.createdAtUtc || booking.createdAt;
      return value && new Date(value) >= weekAgo;
    }).length;
  }, [bookings]);

  const displayEmail = Array.isArray(user?.email) ? user.email[0] : user?.email;

  return (
    <section className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {isStaff
              ? "Welcome back! Here are the tools you need for event operations."
              : "Live overview for the current tenant."}
          </p>
        </div>
        <div className="profile-chip">
          <span className="notification-dot">{loading ? "..." : bookings.length}</span>
          <span className="avatar">{getInitials(user)}</span>
          <div>
            <strong>{displayEmail || "Tenant user"}</strong>
            <small>{isStaff ? "Event Staff" : "Organization Admin"}</small>
          </div>
        </div>
      </header>

      {error && <div className="form-alert">{error}</div>}

      <div className="stat-grid">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
              <span className="stat-icon">
                <Icon />
              </span>
              <div>
                <strong>{loading ? "..." : stat.value}</strong>
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
            <Link to="/tenant/events">View All</Link>
          </div>
          <div className="event-list">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => (
                <div className="event-row" key={event.id}>
                  <span className="event-thumb" style={{ background: event.image }} />
                  <div>
                    <strong>{event.title}</strong>
                    <small>{event.meta}</small>
                    <small>{event.venue}</small>
                  </div>
                  <div className="event-sales">
                    <strong>{event.sold}</strong>
                    <small>Tenant data</small>
                  </div>
                  <span className="live-pill">{event.published ? "Live" : "Draft"}</span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>No events yet</strong>
                <p>Create an event to start seeing tenant activity.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="panel-title">
            <h2>Orders Overview</h2>
            <span className="panel-badge">Last 8 days</span>
          </div>
          <div className="line-chart purple-chart">
            <svg viewBox="0 0 320 130" role="img" aria-label="Orders trend chart">
              <polyline points={chartPoints} />
              {chartPoints.split(" ").map((point) => {
                const [cx, cy] = point.split(",");
                return <circle key={point} cx={cx} cy={cy} r="4" />;
              })}
            </svg>
          </div>
          <div className="chart-summary">
            <strong>{recentOrders}</strong>
            <span>orders in the last 7 days</span>
          </div>
        </article>
      </div>

    </section>
  );
}

export default DashboardPage;
