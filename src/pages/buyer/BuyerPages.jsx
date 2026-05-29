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
import {
  getBuyerNotifications,
  getBuyerReviews,
  getBuyerTickets,
  getFavoriteEvents,
  readObject,
  toggleFavoriteEvent,
  writeJson,
} from "../../services/buyerStorage";

const buildTicketQrValue = (ticket) => {
  return JSON.stringify({
    app: "Eventix",
    ticketCode: ticket.code,
    event: ticket.event,
    date: ticket.date,
    seat: ticket.seat,
    status: ticket.status || "Confirmed",
    emailedTo: ticket.emailedTo || ticket.email || null,
  });
};

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

const normalizeEmail = (email) => {
  if (Array.isArray(email)) {
    return email.find(Boolean) || "";
  }

  return typeof email === "string" ? email : "";
};

export function BuyerEventsPage({ title, filter }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventsApi.browse({ publicOnly: false }).then(setEvents).catch(() => setEvents([]));
  }, []);

  const visibleEvents = events.filter(filter ?? (() => true));

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>{title}</h1>
        <Link to="/buyer">Back to Discover</Link>
      </div>
      <EventCards
        events={visibleEvents}
        onFavoriteClick={() => navigate("/login", { state: { from: location } })}
      />
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
  const [selectedTicket, setSelectedTicket] = useState(null);
  const storedTickets = useMemo(() => getBuyerTickets(), []);
  const tickets = storedTickets;

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>My Tickets</h1>
        <Link to="/buyer">Find more events</Link>
      </div>
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.id}>
            <span><FaTicketAlt /></span>
            <div>
              <strong>{ticket.event}</strong>
              <small>{ticket.date} - {ticket.seat || ticket.ticketType || "Regular"}</small>
              <code>{ticket.code}</code>
              {ticket.quantity && <small>Quantity: {ticket.quantity}</small>}
              {ticket.referenceNumber && <small>Booking: {ticket.referenceNumber}</small>}
              {ticket.backendSynced && <small>Saved in backend</small>}
              {ticket.emailedTo && <small>Ticket emailed to {ticket.emailedTo}</small>}
              {!ticket.emailedTo && ticket.email && <small>Confirmation sent to {ticket.email}</small>}
            </div>
            <button type="button" onClick={() => setSelectedTicket(ticket)}>
              <FaQrcode /> View QR
            </button>
          </article>
        ))}
      </div>
      {selectedTicket && (
        <div className="qr-overlay" role="dialog" aria-modal="true">
          <article className="qr-modal panel">
            <button className="qr-close" type="button" onClick={() => setSelectedTicket(null)}>Close</button>
            <div className="qr-box" aria-label={`QR ticket ${selectedTicket.code}`}>
              <QRCodeSVG
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                size={174}
                value={buildTicketQrValue(selectedTicket)}
              />
            </div>
            <h2>{selectedTicket.event}</h2>
            <p>{selectedTicket.date} - {selectedTicket.seat || selectedTicket.ticketType}</p>
            <code>{selectedTicket.code}</code>
          </article>
        </div>
      )}
    </section>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { logout, tenantSlug, user } = useAuth();
  const [showReviews, setShowReviews] = useState(false);
  const savedProfile = readObject("buyerProfile", {});
  const userEmail = normalizeEmail(user?.email);
  const userName = typeof user?.fullName === "string" ? user.fullName : "";
  const savedEmail = savedProfile.email === "buyer@eventix.test" ? "" : normalizeEmail(savedProfile.email);
  const displayEmail = userEmail || savedEmail || "buyer@eventix.test";
  const [form, setForm] = useState({
    fullName: savedProfile.fullName || userName || displayEmail.split("@")[0].replace(/[._-]/g, " "),
    email: displayEmail,
    city: savedProfile.city || "Prishtina",
    phone: savedProfile.phone || "",
  });
  const tickets = getBuyerTickets();
  const favorites = getFavoriteEvents();
  const reviews = getBuyerReviews();

  const initials = String(form.fullName || "Buyer")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "BA";

  const handleLogout = () => {
    logout("/");
  };

  const saveProfile = () => {
    writeJson("buyerProfile", form);
    writeJson("user", { ...(user || {}), ...form, role: user?.role || "Buyer" });
  };

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="account-hero panel">
        <div className="account-avatar">{initials}</div>
        <div>
          <span>Buyer account</span>
          <h1>{form.fullName}</h1>
          <p>{form.email}</p>
        </div>
        <button className="logout-button" type="button" onClick={handleLogout}>
          <FaSignOutAlt /> Log out
        </button>
      </div>

      <div className="account-grid">
        <article className="panel account-card">
          <div className="account-card-title">
            <FaUserCircle />
            <h2>Profile Details</h2>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              Full name
              <input value={form.fullName} onChange={(input) => setForm((prev) => ({ ...prev, fullName: input.target.value }))} />
            </label>
            <label className="settings-field">
              Email
              <input type="email" value={form.email} onChange={(input) => setForm((prev) => ({ ...prev, email: input.target.value }))} />
            </label>
            <label className="settings-field">
              City
              <input value={form.city} onChange={(input) => setForm((prev) => ({ ...prev, city: input.target.value }))} />
            </label>
            <label className="settings-field">
              Phone
              <input value={form.phone} onChange={(input) => setForm((prev) => ({ ...prev, phone: input.target.value }))} />
            </label>
          </div>
          <button className="primary-button settings-save" type="button" onClick={saveProfile}>Save profile</button>
          <dl className="detail-list">
            <div><dt>Role</dt><dd>{user?.role || "Buyer"}</dd></div>
          </dl>
        </article>

        <article className="panel account-card">
          <div className="account-card-title">
            <FaTicketAlt />
            <h2>Event Activity</h2>
          </div>
          <div className="activity-stats">
            <span><strong>{tickets.length}</strong> Tickets</span>
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
                  <p>Your event reviews will show here.</p>
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
  const notifications = getBuyerNotifications();
  const reviews = getBuyerReviews();
  const savedProfile = readObject("buyerProfile", {});
  const { user } = useAuth();
  const userEmail = normalizeEmail(user?.email);
  const savedEmail = savedProfile.email === "buyer@eventix.test" ? "" : normalizeEmail(savedProfile.email);
  const displayEmail = userEmail || savedEmail || "buyer@eventix.test";

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
              <p>When you buy tickets, booking item notifications will appear here.</p>
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
                <strong>{review.eventTitle}</strong>
                <small>{review.rating}/5 - {review.comment}</small>
              </span>
            </div>
          )) : (
            <div className="empty-state">
              <strong>No reviews yet</strong>
              <p>Write a review from an event details page.</p>
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
              <input type="email" defaultValue={displayEmail} />
            </label>
            <label className="settings-field">
              Preferred city
              <select defaultValue={savedProfile.city || ""}>
                <option value="">Any city</option>
                <option>Prishtina</option>
                <option>Tirana</option>
                <option>Prizren</option>
                <option>Peja</option>
              </select>
            </label>
          </div>
          <div className="ai-note">
            <FaBell />
            <span>AI recommendations use your favorites, ticket history, and reviews to suggest better events.</span>
          </div>
        </article>
      </div>
    </section>
  );
}
