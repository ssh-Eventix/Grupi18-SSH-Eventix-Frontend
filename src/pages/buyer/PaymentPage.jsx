import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaCreditCard, FaEnvelope, FaTicketAlt } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { createBooking } from "../../services/bookingService";
import { savePurchaseRecords } from "../../services/purchaseRecordsService";
import { getTicketTypes } from "../../services/ticketTypeService";
import { paymentMethodService } from "../../services/paymentMethodService";
import { paymentService } from "../../services/paymentService";
import { discountCouponService } from "../../services/discountCouponService";
import {
  addBuyerNotification,
  readJson,
  recordTicketTypePurchase,
  saveBuyerTicket,
} from "../../services/buyerStorage";

const formatCardNumber = (value) =>
  value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits.length === 2 ? `${digits}/` : digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const getEventTenantSlug = (event) => {
  if (event?.tenantSlug) return event.tenantSlug;
  if (event?.schemaName?.startsWith("tenant_")) {
    return event.schemaName.replace(/^tenant_/, "").replace(/_events$/, "");
  }

  return "";
};

function PaymentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [couponResult, setCouponResult] = useState(null);
  const [payment, setPayment] = useState({
    email: searchParams.get("email") || user?.email || "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  
   const [paymentMethods, setPaymentMethods] = useState([]);


  const selectedTicketTypeId = searchParams.get("ticketTypeId") || "";
  const quantity = Number(searchParams.get("quantity")) || 1;

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
  paymentMethodService
    .getAll()
    .then(setPaymentMethods)
    .catch(console.error);
}, []);

  useEffect(() => {
    if (!event?.id) return;
    const eventTenantSlug = getEventTenantSlug(event);

    getTicketTypes(event.backendId || event.id, eventTenantSlug)
  .then((types) => setTicketTypes(types))
  .catch(() => setTicketTypes([]));
}, [event]);

  if (!event) {
    return (
      <section className="buyer-page simple-buyer-page empty-state">
        <strong>Payment unavailable</strong>
        <p>Choose a ticket before opening payment.</p>
        <Link to="/buyer">Back to events</Link>
      </section>
    );
  }

  const selectedTicketType = ticketTypes.find((type) => type.id === selectedTicketTypeId) || ticketTypes[0];
  const unitPrice = Number(selectedTicketType?.price || 0);
  const subtotal = unitPrice * quantity;

  const discount = couponResult?.discountAmount || 0;
  const total = couponResult?.total ?? subtotal;

  const updatePayment = (name, value) => {
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const confirmBooking = async (submitEvent) => {
    submitEvent.preventDefault();
    setBookingError("");
    setSubmitting(true);

    const ticketCode = `EVX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    let backendBooking = null;

    if (event.isBackendEvent) {
      if (!user?.id) {
        setBookingError("Please log in again before buying a ticket.");
        setSubmitting(false);
        return;
      }

      if (!selectedTicketTypeId || !selectedTicketType?.id) {
        setBookingError("Please choose a valid ticket type before payment.");
        setSubmitting(false);
        return;
      }

      try {
        backendBooking = await createBooking({
          userId: user.id,
          eventId: event.backendId || event.id,
          ticketTypeId: selectedTicketTypeId,
          tenantSlug: getEventTenantSlug(event),
          quantity,
        });

        const defaultMethod =
          paymentMethods.find((x) => x.isActive === true || x.isActive === undefined) ||
          paymentMethods[0];

        if (!defaultMethod) {
          throw new Error("No payment methods configured. Create one in Payment Methods first.");
        }

        await paymentService.create({
            bookingId: backendBooking.id,
            paymentMethodId: defaultMethod.id,
            amount: total,
            status: 1,
            paidAt: new Date().toISOString(),
        });

      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Backend booking failed. Please try again.";

        setBookingError(typeof message === "string" ? message : "Backend booking failed. Please try again.");
        setSubmitting(false);
        return;
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
      ticketType: selectedTicketType?.name || "Regular",
      amountPaid: total,
      discount,
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
    const emailOutbox = readJson("ticketEmailOutbox", []);

    saveBuyerTicket(ticket);
    localStorage.setItem("ticketEmailOutbox", JSON.stringify([receipt, ...emailOutbox]));
    addBuyerNotification({
      title: "Ticket bought",
      message: `${quantity} ${selectedTicketType?.name || "ticket"} ticket booked for ${event.title}.`,
      eventId: event.id,
      ticketCode: ticket.code,
      type: "bookingitem",
    });
    recordTicketTypePurchase(selectedTicketTypeId, quantity, selectedTicketType?.quantityAvailable);
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
    setSubmitting(false);
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
        <h1>Payment</h1>
        {bookingError && <div className="form-alert">{bookingError}</div>}
        <div className="checkout-event">
          <span style={{ backgroundImage: `url("${event.image}")` }} />
          <div>
            <strong>{event.title}</strong>
            <small>{quantity} x {selectedTicketType?.name || "Ticket"} - {payment.email}</small>
          </div>
        </div>

        <label className="ticket-type-picker">
          Discount coupon
          <div className="coupon-row">
            <input
              onChange={(input) => {
                setCouponCode(input.target.value);
                setCouponMessage("");
              }}
              placeholder="Enter coupon code"
              value={couponCode}
            />
            <button
              type="button"
              onClick={async () => {
                    if (!couponCode.trim()) {
                      setCouponMessage("Enter a coupon code first.");
                      return;
                    }

                    try {
                      const result = await discountCouponService.validate({
                        eventId: event.backendId || event.id,
                        code: couponCode,
                        subtotal,
                        tenantSlug: getEventTenantSlug(event),
                      });

                      setCouponResult(result);
                      setCouponMessage(result.message);
                    } catch {
                      setCouponResult(null);
                      setCouponMessage("Coupon could not be validated.");
                    }
                  }}
            >
              Apply
            </button>
          </div>
          {couponMessage && <small>{couponMessage}</small>}
        </label>

        <div className="checkout-total">
          <span>Total</span>
          <strong>{total === 0 ? "Free" : `EUR ${total}`}</strong>
        </div>

        <div className="payment-form">
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
                onChange={(input) => updatePayment("expiry", formatExpiry(input.target.value))}
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

        <div className="checkout-actions">
          <Link className="auth-secondary-button" to={`/buyer/checkout/${event.id}?ticketTypeId=${selectedTicketTypeId}&quantity=${quantity}`}>
            Back
          </Link>
          <button className="primary-button" disabled={submitting} type="submit">
            <FaCreditCard /> {submitting ? "Creating booking..." : "Pay and get ticket"}
          </button>
        </div>
      </form>

      <aside className="panel checkout-panel">
        <FaTicketAlt />
        <h2>Payment page</h2>
        <p>This page is separate so payment features can grow independently.</p>
      </aside>
    </section>
  );
}

export default PaymentPage;
