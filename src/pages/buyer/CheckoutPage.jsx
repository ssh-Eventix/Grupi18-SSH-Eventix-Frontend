import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaCreditCard, FaEnvelope, FaMinus, FaPlus, FaTicketAlt } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { createBooking } from "../../services/bookingService";
import { savePurchaseRecords } from "../../services/purchaseRecordsService";
import { getTicketTypes } from "../../services/ticketTypeService";

const parseStartPrice = (price) => {
  if (price === "Free") return 0;
  const match = price.match(/\d+/);
  return match ? Number(match[0]) : 20;
};

function CheckoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [success, setSuccess] = useState(null);
  const [payment, setPayment] = useState({
    email: user?.email || "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    if (!event?.id) return;

    getTicketTypes(event.id).then((types) => {
      setTicketTypes(types);
      setSelectedTicketTypeId(types[0]?.id || "");
    });
  }, [event]);

  if (!event) {
    return (
      <section className="buyer-page simple-buyer-page empty-state">
        <strong>Checkout unavailable</strong>
        <p>Choose an event before buying tickets.</p>
        <Link to="/buyer">Back to events</Link>
      </section>
    );
  }

  const selectedTicketType = ticketTypes.find((type) => type.id === selectedTicketTypeId);
  const unitPrice = selectedTicketType?.price ?? parseStartPrice(event.price);
  const total = unitPrice * quantity;

  const updatePayment = (name, value) => {
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value) => {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  };

  const confirmBooking = async (submitEvent) => {
    submitEvent.preventDefault();

    const ticketCode = `EVX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    let backendBooking = null;

    if (event.isBackendEvent && user?.id && selectedTicketTypeId) {
      try {
        backendBooking = await createBooking({
          userId: user.id,
          eventId: event.backendId || event.id,
          ticketTypeId: selectedTicketTypeId,
          quantity,
        });
      } catch (error) {
        console.warn("Backend booking failed, keeping frontend ticket fallback.", error);
      }
    }

    const ticket = {
      id: backendBooking?.tickets?.[0]?.id || `ticket-${Date.now()}`,
      event: event.title,
      code: backendBooking?.tickets?.[0]?.ticketCode || ticketCode,
      date: event.date,
      seat: selectedTicketType?.name || "General Admission",
      status: backendBooking?.status || "Confirmed",
      quantity,
      email: payment.email,
      emailedTo: payment.email,
      emailSentAt: new Date().toISOString(),
      bookingId: backendBooking?.id,
      referenceNumber: backendBooking?.referenceNumber,
      backendSynced: Boolean(backendBooking),
    };
    const receipt = {
      id: `email-${Date.now()}`,
      to: payment.email,
      subject: `Your Eventix ticket for ${event.title}`,
      ticketCode,
      event: event.title,
      date: event.date,
      venue: event.venue,
      quantity,
      total: total === 0 ? "Free" : `EUR ${total}`,
      sentAt: ticket.emailSentAt,
    };
    const existing = JSON.parse(localStorage.getItem("buyerTickets") || "[]");
    const emailOutbox = JSON.parse(localStorage.getItem("ticketEmailOutbox") || "[]");

    localStorage.setItem("buyerTickets", JSON.stringify([ticket, ...existing]));
    localStorage.setItem("ticketEmailOutbox", JSON.stringify([receipt, ...emailOutbox]));
    savePurchaseRecords({
      backendBooking,
      event,
      payment,
      quantity,
      ticket,
      ticketType: selectedTicketType,
      total,
      user,
    });
    setSuccess(ticket);
  };

  if (success) {
    return (
      <section className="buyer-page checkout-page">
        <article className="panel checkout-success">
          <FaCheckCircle />
          <h1>Ticket bought</h1>
          <p>
            Your ticket for <strong>{success.event}</strong> is confirmed.
          </p>
          <div className="email-confirmation">
            <FaEnvelope />
            <span>Ticket email sent to {success.email}</span>
          </div>
          <code>{success.code}</code>
          <button className="primary-button" type="button" onClick={() => navigate("/buyer/tickets")}>
            View ticket and QR
          </button>
        </article>
      </section>
    );
  }

  return (
    <section className="buyer-page checkout-page">
      <form className="panel checkout-summary" onSubmit={confirmBooking}>
        <h1>Checkout</h1>
        <div className="checkout-event">
          <span style={{ backgroundImage: `url("${event.image}")` }} />
          <div>
            <strong>{event.title}</strong>
            <small>{event.date} - {event.venue}</small>
          </div>
        </div>

        <div className="quantity-row">
          <span>Tickets</span>
          <div>
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
              <FaMinus />
            </button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity((value) => value + 1)}>
              <FaPlus />
            </button>
          </div>
        </div>

        <div className="checkout-total">
          <span>Total</span>
          <strong>{total === 0 ? "Free" : `EUR ${total}`}</strong>
        </div>

        {ticketTypes.length > 0 && (
          <label className="ticket-type-picker">
            Ticket type
            <select value={selectedTicketTypeId} onChange={(input) => setSelectedTicketTypeId(input.target.value)}>
              {ticketTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.price === 0 ? "Free" : `EUR ${type.price}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="payment-form">
          <label>
            Email for confirmation
            <input
              onChange={(input) => updatePayment("email", input.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={payment.email}
            />
          </label>
          <label>
            Name on card
            <input
              onChange={(input) => updatePayment("cardName", input.target.value)}
              placeholder="Arne Attendee"
              required
              value={payment.cardName}
            />
          </label>
          <label>
            Card number
            <input
              inputMode="numeric"
              onChange={(input) => updatePayment("cardNumber", formatCardNumber(input.target.value))}
              placeholder="4242 4242 4242 4242"
              required
              value={payment.cardNumber}
            />
          </label>
          <div className="payment-grid">
            <label>
              Expiry
              <input
                onChange={(input) => updatePayment("expiry", input.target.value)}
                placeholder="MM/YY"
                required
                value={payment.expiry}
              />
            </label>
            <label>
              CVC
              <input
                inputMode="numeric"
                maxLength="4"
                onChange={(input) => updatePayment("cvc", input.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                required
                value={payment.cvc}
              />
            </label>
          </div>
        </div>

        <button className="primary-button" type="submit">
          <FaCreditCard /> Pay and get ticket
        </button>
      </form>

      <aside className="panel checkout-panel">
        <FaTicketAlt />
        <h2>Secure demo checkout</h2>
        <p>After payment, Eventix saves your ticket and shows a QR code in My Tickets.</p>
      </aside>
    </section>
  );
}

export default CheckoutPage;
