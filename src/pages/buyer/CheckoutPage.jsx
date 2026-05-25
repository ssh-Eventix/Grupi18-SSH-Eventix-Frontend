import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaMinus, FaPlus, FaTicketAlt } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { getTicketTypes } from "../../services/ticketTypeService";

const parseStartPrice = (price) => {
  if (price === "Free") return 0;
  const match = price.match(/\d+/);
  return match ? Number(match[0]) : 20;
};

const fallbackTicketTypes = [
  { id: "regular", name: "Regular", price: 15, quantityAvailable: 50 },
  { id: "vip", name: "VIP", price: 35, quantityAvailable: 20 },
];

const normalizeEmail = (email) => {
  if (Array.isArray(email)) {
    return email.find(Boolean) || "";
  }

  return email || "";
};

function CheckoutPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(Number(searchParams.get("quantity")) || 1);
  const [email, setEmail] = useState(normalizeEmail(user?.email));

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    if (!event?.id) return;

    getTicketTypes(event.backendId || event.id)
      .then((types) => {
        const nextTypes = types.length ? types : fallbackTicketTypes;
        setTicketTypes(nextTypes);
        setSelectedTicketTypeId(searchParams.get("ticketTypeId") || nextTypes[0]?.id || "");
      })
      .catch(() => {
        setTicketTypes(fallbackTicketTypes);
        setSelectedTicketTypeId(searchParams.get("ticketTypeId") || fallbackTicketTypes[0].id);
      });
  }, [event, searchParams]);

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
  const subtotal = unitPrice * quantity;
  const maxQuantity = Math.max(1, Number(selectedTicketType?.quantityAvailable || 25));

  const goToPayment = (submitEvent) => {
    submitEvent.preventDefault();

    const params = new URLSearchParams({
      ticketTypeId: selectedTicketTypeId,
      quantity: String(quantity),
      email: email.trim(),
    });

    navigate(`/buyer/payment/${event.id}?${params.toString()}`);
  };

  return (
    <section className="buyer-page checkout-page">
      <form className="panel checkout-summary" onSubmit={goToPayment}>
        <h1>Checkout</h1>
        <div className="checkout-event">
          <span style={{ backgroundImage: `url("${event.image}")` }} />
          <div>
            <strong>{event.title}</strong>
            <small>{event.date} - {event.venue}</small>
          </div>
        </div>

        {ticketTypes.length > 0 && (
          <label className="ticket-type-picker">
            Ticket type
            <select value={selectedTicketTypeId} onChange={(input) => setSelectedTicketTypeId(input.target.value)}>
              {ticketTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.price === 0 ? "Free" : `EUR ${type.price}`} ({type.quantityAvailable} left)
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="quantity-row">
          <span>Tickets</span>
          <div>
            <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
              <FaMinus />
            </button>
            <strong>{quantity}</strong>
            <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}>
              <FaPlus />
            </button>
          </div>
        </div>

        <label className="ticket-type-picker">
          Email for confirmation
          <input
            onChange={(input) => setEmail(input.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <div className="checkout-total">
          <span>Subtotal</span>
          <strong>{subtotal === 0 ? "Free" : `EUR ${subtotal}`}</strong>
        </div>

        <button className="primary-button" type="submit">
          Go to payment
        </button>
      </form>

      <aside className="panel checkout-panel">
        <FaTicketAlt />
        <h2>Ticket details first</h2>
        <p>Choose ticket type, quantity, and confirmation email. Payment opens on the next page.</p>
      </aside>
    </section>
  );
}

export default CheckoutPage;
