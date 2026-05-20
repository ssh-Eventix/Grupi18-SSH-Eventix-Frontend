import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  FaBell,
  FaCog,
  FaEnvelope,
  FaHeart,
  FaMapMarkerAlt,
  FaQrcode,
  FaSignOutAlt,
  FaTicketAlt,
  FaUserCircle,
} from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
import { buyerEvents, buyerTickets } from "./buyerData";

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

const EventCards = ({ events }) => (
  <div className="event-card-grid">
    {events.map((event) => (
      <article className="event-card" key={event.id}>
        <div className="event-card-image" style={{ backgroundImage: `url("${event.image}")` }}>
          <Link to="/buyer/favorites" aria-label={`Save ${event.title}`}>
            <FaHeart />
          </Link>
        </div>
        <Link className="event-title-link" to={`/buyer/events/${event.id}`}>
          {event.title}
        </Link>
        <span>{event.category}</span>
        <small>{event.date}</small>
        <small>{event.venue}</small>
        <b>{event.price}</b>
      </article>
    ))}
  </div>
);

export function BuyerEventsPage({ title, filter }) {
  const events = buyerEvents.filter(filter ?? (() => true));

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>{title}</h1>
        <Link to="/buyer">Back to Discover</Link>
      </div>
      <EventCards events={events} />
    </section>
  );
}

export function FavoritesPage() {
  return (
    <BuyerEventsPage
      title="Favorites"
      filter={(event) => ["tech-conference-2025", "summer-vibes-party"].includes(event.id)}
    />
  );
}

export function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const storedTickets = useMemo(
    () => JSON.parse(localStorage.getItem("buyerTickets") || "[]"),
    []
  );
  const tickets = [...storedTickets, ...buyerTickets];

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="panel-title">
        <h1>My Tickets</h1>
        <Link to="/buyer">Find more events</Link>
      </div>
      <div className="ticket-list">
        {tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.id}>
            <span>
              <FaTicketAlt />
            </span>
            <div>
              <strong>{ticket.event}</strong>
              <small>{ticket.date} - {ticket.seat}</small>
              <code>{ticket.code}</code>
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
            <p>{selectedTicket.date} - {selectedTicket.seat}</p>
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
  const displayEmail = user?.email || "guest@eventix.test";
  const displayName = displayEmail.split("@")[0].replace(/[._-]/g, " ");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "EA";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <section className="buyer-page simple-buyer-page">
      <div className="account-hero panel">
        <div className="account-avatar">{initials}</div>
        <div>
          <span>Buyer account</span>
          <h1>{displayName}</h1>
          <p>{displayEmail}</p>
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
          <dl className="detail-list">
            <div>
              <dt>Email</dt>
              <dd>{displayEmail}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user?.role || "Buyer"}</dd>
            </div>
            <div>
              <dt>Tenant</dt>
              <dd>{tenantSlug || "Not selected"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Active</dd>
            </div>
          </dl>
        </article>

        <article className="panel account-card">
          <div className="account-card-title">
            <FaTicketAlt />
            <h2>Event Activity</h2>
          </div>
          <div className="activity-stats">
            <span><strong>2</strong> Tickets</span>
            <span><strong>2</strong> Favorites</span>
            <span><strong>4</strong> Cities viewed</span>
          </div>
          <div className="account-actions">
            <Link to="/buyer/tickets">View tickets</Link>
            <Link to="/buyer/favorites">Saved events</Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export function BuyerSettingsPage() {
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
            <h2>Notifications</h2>
          </div>
          <label className="setting-row">
            <span>
              <strong>Saved event reminders</strong>
              <small>Email me before favorite events start.</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="setting-row">
            <span>
              <strong>Ticket updates</strong>
              <small>Send purchase confirmations and schedule changes.</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
        </article>

        <article className="panel settings-card">
          <div className="account-card-title">
            <FaMapMarkerAlt />
            <h2>Discovery</h2>
          </div>
          <label className="settings-field">
            Preferred city
            <select defaultValue="">
              <option value="">Any city</option>
              <option>Tirana</option>
              <option>Prishtina</option>
              <option>Prizren</option>
              <option>Peja</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              <strong>Show nearby events first</strong>
              <small>Prioritize events from your selected city.</small>
            </span>
            <input type="checkbox" defaultChecked />
          </label>
        </article>

        <article className="panel settings-card wide-settings-card">
          <div className="account-card-title">
            <FaEnvelope />
            <h2>Contact</h2>
          </div>
          <div className="settings-form-grid">
            <label className="settings-field">
              Email address
              <input type="email" defaultValue="guest@eventix.test" />
            </label>
            <label className="settings-field">
              Language
              <select defaultValue="en">
                <option value="en">English</option>
                <option value="sq">Albanian</option>
              </select>
            </label>
          </div>
          <button className="primary-button settings-save" type="button">Save preferences</button>
        </article>
      </div>
    </section>
  );
}
