import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicTable from "../../components/DynamicTable.jsx";
import { bookingService } from "../../services/bookingService";
import { eventsService } from "../../services/eventsService";
import { reviewsService } from "../../services/reviewsService";
import { ticketService } from "../../services/ticketService";
import { handleApiError } from "../../utils/apiErrorHandler";

const money = (value, currency = "EUR") =>
  `${currency} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const ticketIsCheckedIn = (ticket) => {
  const status = Number(ticket.status ?? 0);
  return status === 1 || Boolean(ticket.usedAt || ticket.checkIn?.checkedInAtUtc);
};

export default function ReportsPage() {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventsData, bookingsData, ticketsData, reviewsData] = await Promise.all([
        eventsService.getAll(),
        bookingService.getAll(),
        ticketService.getAll(),
        reviewsService.getAll(),
      ]);

      setEvents(Array.isArray(eventsData) ? eventsData : eventsData?.data ?? []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const reportRows = useMemo(() => {
    return events.map((event) => {
      const eventBookings = bookings.filter((booking) => String(booking.eventId) === String(event.id));
      const eventTickets = tickets.filter((ticket) => String(ticket.eventId) === String(event.id));
      const eventReviews = reviews.filter((review) => String(review.eventId) === String(event.id));
      const checkedIn = eventTickets.filter(ticketIsCheckedIn).length;
      const revenue = eventBookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0);
      const averageRating = eventReviews.length
        ? eventReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / eventReviews.length
        : 0;

      return {
        id: event.id,
        title: event.title || event.name || "Untitled event",
        bookings: eventBookings.length,
        tickets: eventTickets.length,
        checkedIn,
        attendanceRate: eventTickets.length ? `${Math.round((checkedIn / eventTickets.length) * 100)}%` : "0%",
        revenue,
        revenueText: money(revenue, event.currency || "EUR"),
        averageRating: averageRating ? averageRating.toFixed(1) : "0.0",
        reviews: eventReviews.length,
      };
    });
  }, [bookings, events, reviews, tickets]);

  const totals = useMemo(() => {
    const totalRevenue = reportRows.reduce((sum, row) => sum + row.revenue, 0);
    const checkedIn = tickets.filter(ticketIsCheckedIn).length;
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
      : 0;

    return {
      events: events.length,
      bookings: bookings.length,
      tickets: tickets.length,
      checkedIn,
      revenue: money(totalRevenue),
      attendanceRate: tickets.length ? `${Math.round((checkedIn / tickets.length) * 100)}%` : "0%",
      averageRating: averageRating ? averageRating.toFixed(1) : "0.0",
    };
  }, [bookings.length, events.length, reportRows, reviews, tickets]);

  const fetchReportRows = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = reportRows.filter((row) =>
        [row.title, row.bookings, row.tickets, row.checkedIn, row.attendanceRate, row.revenueText, row.averageRating]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [reportRows]
  );

  const columns = [
    { key: "title", label: "Event" },
    { key: "bookings", label: "Orders" },
    { key: "tickets", label: "Tickets" },
    { key: "checkedIn", label: "Checked In" },
    { key: "attendanceRate", label: "Attendance" },
    { key: "revenueText", label: "Revenue" },
    { key: "averageRating", label: "Rating" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Reports</h1>
          <p>Track event performance, revenue, attendance, and review health.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}

      <div className="attendees-stats report-stats">
        <article className="attendee-stat-card">
          <span>Events</span>
          <strong>{totals.events}</strong>
          <small>Active report scope</small>
        </article>
        <article className="attendee-stat-card">
          <span>Revenue</span>
          <strong>{totals.revenue}</strong>
          <small>From orders</small>
        </article>
        <article className="attendee-stat-card">
          <span>Attendance</span>
          <strong>{totals.attendanceRate}</strong>
          <small>{totals.checkedIn} checked in / {totals.tickets} tickets</small>
        </article>
        <article className="attendee-stat-card">
          <span>Avg rating</span>
          <strong>{totals.averageRating}</strong>
          <small>Across reviews</small>
        </article>
      </div>

      {loading ? (
        <div className="table-panel">
          <p>Loading reports...</p>
        </div>
      ) : (
        <DynamicTable
          columns={columns}
          fetchData={fetchReportRows}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </section>
  );
}
