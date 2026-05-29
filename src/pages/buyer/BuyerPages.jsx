import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaBell,
  FaCog,
  FaEnvelope,
  FaHeart,
  FaQrcode,
  FaSignOutAlt,
  FaStar,
  FaTicketAlt,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
import { eventsApi } from "../../api/eventsApi";
import { bookingService } from "../../services/bookingService";
import { reviewsService } from "../../services/reviewsService";
import notificationService from "../../services/notificationService";
import { usersService } from "../../services/usersService";
import { getFavoriteEvents, toggleFavoriteEvent } from "../../services/buyerStorage";

const getUserId = (user) => user?.id || user?.userId || user?.publicUserId;

const isWeekendEvent = (event) => {
  if (!event.startUtc) return false;
  const day = new Date(event.startUtc).getDay();
  return day === 0 || day === 6;
};

const isFreeEvent = (event) =>
  event.isFree === true || event.price === "Free" || Number(event.price) === 0;

const sortTopEvents = (events) =>
  [...events].sort((a, b) => {
    const aScore = Number(a.reviewCount || a.bookingsCount || a.soldTickets || 0);
    const bScore = Number(b.reviewCount || b.bookingsCount || b.soldTickets || 0);
    return bScore - aScore;
  });

const filterEvents = (events, filterType) => {
  if (filterType === "weekend") return events.filter(isWeekendEvent);
  if (filterType === "free") return events.filter(isFreeEvent);
  if (filterType === "top") return sortTopEvents(events);
  return events;
};

const formatTicketDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "Date TBA";

const normalizeTicketFromBooking = (booking) => {
  const tickets = booking.tickets || [];

  return tickets.map((ticket) => ({
    id: ticket.id,
    event: booking.eventTitle || booking.event?.title || "Event",
    code: ticket.ticketCode || ticket.code || "",
    date: formatTicketDate(booking.bookingDate || ticket.issuedAt),
    seat: ticket.ticketTypeName || ticket.ticketType || "Regular",
    status: ticket.statusName || ticket.status || "Confirmed",
    quantity: booking.quantity || tickets.length,
    referenceNumber: booking.referenceNumber,
    backendSynced: true,
    qrCode: ticket.qrCode || ticket.qRCode || ticket.QRCode || ticket.ticketCode,
  }));
};

const buildTicketQrValue = (ticket) =>
  JSON.stringify({
    app: "Eventix",
    ticketCode: ticket.code,
    event: ticket.event,
    date: ticket.date,
    seat: ticket.seat,
    status: ticket.status || "Confirmed",
  });

const EventCards = ({ events, onFavoriteClick }) => (
  <div className="event-card-grid">
    {events.map((event) => (
      <article className="event-card" key={event.id}>
        <div className="event-card-image" style={{ backgroundImage: `url("${event.image}")` }}>
          <button
            aria-label={`Save ${event.title}`}
            className="favorite-active"
            onClick={() => onFavoriteClick?.(event)}
            type="button"
          >
            <FaHeart />
          </button>
        </div>
        <Link className="event-title-link" to={`/buyer/events/${event.id}`}>
          {event.title}
        </Link>
        <span>{event.category}</span>
        <small>{event.date}{event.time ? ` - ${event.time}` : ""}</small>
        <small>{event.venue}</small>
        <b>{event.price}</b>
      </article>
    ))}
  </div>
);

export function BuyerEventsPage({ title, filterType }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi
      .browse({ publicOnly: false })
      .then((data) => setEvents(filterEvents(data, filterType)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [filterType]);

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>{title}</h1>
        <Link to="/buyer">Back to Discover</Link>
      </div>

      {loading ? (
        <div className="empty-state">Loading events...</div>
      ) : events.length ? (
        <EventCards
          events={events}
          onFavoriteClick={() => navigate("/login", { state: { from: location } })}
        />
      ) : (
        <div className="empty-state">
          <strong>No events found</strong>
          <p>No backend events match this page yet.</p>
        </div>
      )}
    </section>
  );
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState(getFavoriteEvents);

  const removeFavorite = (event) => {
    const next = toggleFavoriteEvent(event);
    setFavorites(next);
  };

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>Favorite Events</h1>
        <Link to="/buyer">Find more events</Link>
      </div>
      {favorites.length ? (
        <EventCards events={favorites} onFavoriteClick={removeFavorite} />
      ) : (
        <div className="empty-state">
          <strong>No favorites yet</strong>
          <p>Save events from Discover or Event Details and they will show here.</p>
        </div>
      )}
    </section>
  );
}

export function TicketsPage() {
  const { user, tenantSlug } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId(user);

    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    bookingService
      .getByUserId(userId, tenantSlug)
      .then((bookings) => setTickets(bookings.flatMap(normalizeTicketFromBooking)))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [user, tenantSlug]);

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>My Tickets</h1>
        <Link to="/buyer">Find more events</Link>
      </div>

      {loading ? (
        <div className="empty-state">Loading tickets...</div>
      ) : tickets.length ? (
        <div className="ticket-list">
          {tickets.map((ticket) => (
            <article className="ticket-card" key={ticket.id}>
              <span><FaTicketAlt /></span>
              <div>
                <strong>{ticket.event}</strong>
                <small>{ticket.date} - {ticket.seat}</small>
                <code>{ticket.code}</code>
                {ticket.quantity && <small>Quantity: {ticket.quantity}</small>}
                {ticket.referenceNumber && <small>Booking: {ticket.referenceNumber}</small>}
              </div>
              <button type="button" onClick={() => setSelectedTicket(ticket)}>
                <FaQrcode /> View QR
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No tickets yet</strong>
          <p>Tickets bought from backend bookings will show here.</p>
        </div>
      )}

      {selectedTicket && (
        <div className="qr-overlay" role="dialog" aria-modal="true">
          <article className="qr-modal panel">
            <button className="qr-close" type="button" onClick={() => setSelectedTicket(null)}>Close</button>
            <div className="qr-box">
              <QRCodeSVG
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                size={174}
                value={selectedTicket.qrCode || buildTicketQrValue(selectedTicket)}
              />
            </div>
            <h2>{selectedTicket.event}</h2>
            <p>{selectedTicket.date} - {selectedTicket.seat}</p>
            <code>{selectedTicket.code}</code>
          </article>
        </div>
      )}
    </section>
  );
}

export function ProfilePage() {
  const { logout, tenantSlug, user } = useAuth();
  const [showReviews, setShowReviews] = useState(false);
  const [profile, setProfile] = useState(user || {});
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const favorites = getFavoriteEvents();

  const userId = getUserId(user);

  useEffect(() => {
    if (!userId) return;

    usersService.getById(userId).then(setProfile).catch(() => setProfile(user || {}));
    bookingService.getByUserId(userId, tenantSlug).then(setTickets).catch(() => setTickets([]));
    reviewsService.getByUserId(userId, tenantSlug).then(setReviews).catch(() => setReviews([]));
  }, [userId, tenantSlug, user]);

  const fullName =
    profile.fullName ||
    `${profile.firstName || ""} ${profile.lastName || ""}`.trim() ||
    user?.email ||
    "Buyer";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BA";

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="account-hero panel">
        <div className="account-avatar">{initials}</div>
        <div>
          <span>Buyer account</span>
          <h1>{fullName}</h1>
          <p>{profile.email || user?.email}</p>
        </div>
        <button className="logout-button" type="button" onClick={() => logout("/")}>
          <FaSignOutAlt /> Log out
        </button>
      </div>

      <div className="account-grid">
        <article className="panel account-card">
          <div className="account-card-title">
            <FaUserCircle />
            <h2>Profile Details</h2>
          </div>
          <dl className="detail-list">
            <div><dt>Name</dt><dd>{fullName}</dd></div>
            <div><dt>Email</dt><dd>{profile.email || user?.email}</dd></div>
            <div><dt>Role</dt><dd>{user?.role || "Buyer"}</dd></div>
            <div><dt>Tenant</dt><dd>{tenantSlug || "Public buyer"}</dd></div>
          </dl>
        </article>

        <article className="panel account-card">
          <div className="account-card-title">
            <FaTicketAlt />
            <h2>Event Activity</h2>
          </div>
          <div className="activity-stats">
            <span><strong>{tickets.length}</strong> Bookings</span>
            <span><strong>{favorites.length}</strong> Favorites</span>
            <button type="button" onClick={() => setShowReviews((value) => !value)}>
              <strong>{reviews.length}</strong> Reviews
            </button>
          </div>

          {showReviews && (
            <div className="profile-review-list">
              {reviews.length ? reviews.map((review) => (
                <article className="profile-review-item" key={review.id}>
                  <strong>{review.eventTitle || "Event review"}</strong>
                  <small>{review.rating}/5 stars</small>
                  <p>{review.comment}</p>
                </article>
              )) : (
                <div className="empty-state compact-empty">
                  <strong>No reviews yet</strong>
                  <p>Your backend reviews will show here.</p>
                </div>
              )}
            </div>
          )}

          <div className="account-actions">
            <Link to="/buyer/tickets">View tickets</Link>
            <Link to="/buyer/favorites">Saved events</Link>
            <Link to="/buyer/settings">Notifications</Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export function BuyerSettingsPage() {
  const { user, tenantSlug } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  const userId = getUserId(user);

  useEffect(() => {
    if (!userId) return;

    notificationService
      .getByUserId(userId, tenantSlug)
      .then(setNotifications)
      .catch(() => setNotifications([]));

    reviewsService
      .getByUserId(userId, tenantSlug)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [userId, tenantSlug]);

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="settings-header">
        <div>
          <span>Account preferences</span>
          <h1>Settings</h1>
        </div>
        <FaCog />
      </div>

      <div className="settings-grid">
        <article className="panel settings-card">
          <div className="account-card-title">
            <FaBell />
            <h2>Ticket Notifications</h2>
          </div>
          {notifications.length ? notifications.map((notification) => (
            <div className="setting-row" key={notification.id}>
              <span>
                <strong>{notification.title}</strong>
                <small>{notification.message}</small>
              </span>
            </div>
          )) : (
            <div className="empty-state">
              <strong>No notifications yet</strong>
              <p>Backend notifications for this buyer will appear here.</p>
            </div>
          )}
        </article>

        <article className="panel settings-card">
          <div className="account-card-title">
            <FaStar />
            <h2>Your Reviews</h2>
          </div>
          {reviews.length ? reviews.map((review) => (
            <div className="setting-row" key={review.id}>
              <span>
                <strong>{review.eventTitle || "Event review"}</strong>
                <small>{review.rating}/5 - {review.comment}</small>
              </span>
            </div>
          )) : (
            <div className="empty-state">
              <strong>No reviews yet</strong>
              <p>Reviews saved in backend will appear here.</p>
            </div>
          )}
        </article>

        <article className="panel settings-card wide-settings-card">
          <div className="account-card-title">
            <FaEnvelope />
            <h2>Contact</h2>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              Email address
              <input type="email" readOnly value={user?.email || ""} />
            </label>
          </div>
          <div className="ai-note">
            <FaBell />
            <span>AI recommendations can use backend tickets, favorites, and reviews later.</span>
          </div>
        </article>
      </div>
    </section>
  );
}