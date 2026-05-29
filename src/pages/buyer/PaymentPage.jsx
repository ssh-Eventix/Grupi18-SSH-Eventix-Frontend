import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaCheckCircle, FaCreditCard, FaEnvelope, FaTicketAlt } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { createBooking, updateBookingStatus } from "../../services/bookingService";
import { discountCouponService } from "../../services/discountCouponService";
import { paymentService } from "../../services/paymentService";
import { paymentMethodService } from "../../services/paymentMethodService";
import { getTicketTypes } from "../../services/ticketTypeService";
import {
  addBuyerNotification,
  readJson,
  recordTicketTypePurchase,
  saveBuyerTicket,
} from "../../services/buyerStorage";

const parseStartPrice = (price) => {
  if (price === "Free") return 0;
  const match = price.match(/\d+/);
  return match ? Number(match[0]) : 20;
};

const formatCardNumber = (value) =>
  value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits.length === 2 ? `${digits}/` : digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const isCashMethod = (method) => {
  const text = `${method?.name || ""} ${method?.provider || ""}`.toLowerCase();
  return text.includes("cash");
};

const isValidCardExpiry = (value) => {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);

  if (!match) return false;

  const month = Number(match[1]);
  const year = Number(match[2]);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear() % 100;

  return year > currentYear || (year === currentYear && month >= currentMonth);
};

const isValidCvc = (value) => /^\d{3}$/.test(value);

const getEventTenantSlug = (event) => {
  if (event?.tenantSlug) return event.tenantSlug;
  if (event?.schemaName?.startsWith("tenant_")) {
    return event.schemaName.replace(/^tenant_/, "").replace(/_events$/, "");
  }

  return "";
};

const parseCartItems = (searchParams) => {
  const itemsParam = searchParams.get("items");

  if (itemsParam) {
    const candidates = [itemsParam];

    try {
      candidates.push(decodeURIComponent(itemsParam));
    } catch {
      // URLSearchParams usually decodes already; this keeps older double-encoded links working.
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);

        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => ({
              ticketTypeId: item.ticketTypeId,
              quantity: Number(item.quantity) || 0,
            }))
            .filter((item) => item.ticketTypeId && item.quantity > 0);
        }
      } catch {
        // Try the next candidate.
      }
    }
  }

  const ticketTypeId = searchParams.get("ticketTypeId") || "";
  const quantity = Number(searchParams.get("quantity")) || 1;

  return ticketTypeId ? [{ ticketTypeId, quantity }] : [];
};

const buildCheckoutQuery = (items, email) => {
  const params = new URLSearchParams({
    items: JSON.stringify(items),
    email: email || "",
  });

  return params.toString();
};

function PaymentPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponValidation, setCouponValidation] = useState(null);
  const [couponApplying, setCouponApplying] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [payment, setPayment] = useState({
    email: searchParams.get("email") || user?.email || "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const cartItems = parseCartItems(searchParams);

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  useEffect(() => {
    if (!event?.id) return;
    const eventTenantSlug = getEventTenantSlug(event);

    getTicketTypes(event.backendId || event.id, eventTenantSlug)
      .then(setTicketTypes)
      .catch(() => setTicketTypes([]));

    paymentMethodService
      .getAll(eventTenantSlug)
      .then((methods) => {
        const activeMethods = methods.filter((method) => method.isActive !== false);
        setPaymentMethods(activeMethods);
        setSelectedPaymentMethodId(activeMethods[0]?.id || "");
      })
      .catch(() => {
        setPaymentMethods([]);
        setSelectedPaymentMethodId("");
      });
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

  const cartLines = cartItems.map((item) => {
    const ticketType = ticketTypes.find((type) => String(type.id) === String(item.ticketTypeId));
    const unitPrice = Number(ticketType?.price ?? parseStartPrice(event.price));
    const quantity = Number(item.quantity || 0);

    return {
      ...item,
      ticketType,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
    };
  });
  const quantity = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cartLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = couponValidation?.isValid ? Number(couponValidation.discountAmount || 0) : 0;
  const total = couponValidation?.isValid
    ? Math.max(0, Number(couponValidation.total ?? subtotal - discount))
    : subtotal;
  const cartSummary = cartLines
    .map((line) => `${line.quantity} x ${line.ticketType?.name || "Ticket"}`)
    .join(", ");
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === selectedPaymentMethodId);
  const requiresCardDetails = total > 0 && selectedPaymentMethodId && !isCashMethod(selectedPaymentMethod);

  const updatePayment = (name, value) => {
    setPayment((prev) => ({ ...prev, [name]: value }));
  };

  const applyCoupon = async () => {
    const code = couponCode.trim();

    setCouponMessage("");
    setCouponValidation(null);

    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    if (!event.isBackendEvent) {
      setCouponMessage("Coupons are available only for backend events.");
      return;
    }

    setCouponApplying(true);

    try {
      const result = await discountCouponService.validate({
        eventId: event.backendId || event.id,
        code,
        subtotal,
        tenantSlug: getEventTenantSlug(event),
      });

      setCouponValidation(result);
      setCouponMessage(result?.message || (result?.isValid ? "Coupon applied." : "Coupon not valid."));
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        "Coupon could not be validated.";

      setCouponMessage(typeof message === "string" ? message : "Coupon could not be validated.");
    } finally {
      setCouponApplying(false);
    }
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

      if (!cartItems.length || cartLines.some((line) => !line.ticketType?.id)) {
        setBookingError("Please choose a valid ticket type before payment.");
        setSubmitting(false);
        return;
      }

      if (total > 0 && !selectedPaymentMethodId) {
        setBookingError("No active payment method is configured for this tenant.");
        setSubmitting(false);
        return;
      }

      if (couponCode.trim() && !couponValidation?.isValid) {
        setBookingError("Please apply a valid coupon or clear the coupon field.");
        setSubmitting(false);
        return;
      }

      if (requiresCardDetails) {
        if (payment.cardNumber.replace(/\D/g, "").length !== 16) {
          setBookingError("Card number must contain 16 digits.");
          setSubmitting(false);
          return;
        }

        if (!isValidCardExpiry(payment.expiry)) {
          setBookingError("Card expiry date is invalid or expired.");
          setSubmitting(false);
          return;
        }

        if (!isValidCvc(payment.cvc)) {
          setBookingError("CVC must contain exactly 3 digits.");
          setSubmitting(false);
          return;
        }
      }

      try {
        const eventTenantSlug = getEventTenantSlug(event);

        backendBooking = await createBooking({
          userId: user.id,
          eventId: event.backendId || event.id,
          bookingItems: cartItems,
          tenantSlug: eventTenantSlug,
        });

        if (!backendBooking?.id) {
          throw new Error("Booking was created, but the API did not return a valid booking id.");
        }

        if (total > 0) {
          await paymentService.create({
            bookingId: backendBooking.id,
            paymentMethodId: selectedPaymentMethodId,
            amount: total,
            status: 2,
            paidAt: new Date().toISOString(),
            tenantSlug: eventTenantSlug,
          });
        } else {
          await updateBookingStatus(backendBooking.id, "Confirmed", eventTenantSlug);
          backendBooking = { ...backendBooking, status: "Confirmed" };
        }

        if (couponValidation?.isValid && couponCode.trim()) {
          await discountCouponService.redeem({
            eventId: event.backendId || event.id,
            code: couponCode.trim(),
            tenantSlug: eventTenantSlug,
          });
        }
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.response?.data ||
          error?.message ||
          "Backend booking or payment failed. Please try again.";

        setBookingError(typeof message === "string" ? message : "Backend booking or payment failed. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const issuedTickets =
      backendBooking?.tickets?.length > 0
        ? backendBooking.tickets
        : [{ id: `ticket-${Date.now()}`, ticketCode }];
    const emailSentAt = new Date().toISOString();
    const savedTickets = issuedTickets.map((issuedTicket, index) => ({
      id: issuedTicket.id || `ticket-${Date.now()}-${index}`,
      event: event.title,
      code: issuedTicket.ticketCode || ticketCode,
      date: event.date,
      seat: cartSummary || "General Admission",
      status: backendBooking?.status || "Confirmed",
      quantity: 1,
      ticketType: cartSummary || "Regular",
      amountPaid: total,
      discount,
      buyerEmail: payment.email,
      userEmail: payment.email,
      email: payment.email,
      emailedTo: payment.email,
      emailSentAt,
      bookingId: backendBooking?.id,
      referenceNumber: backendBooking?.referenceNumber,
      backendSynced: Boolean(backendBooking),
    }));
    const ticket = {
      ...savedTickets[0],
      quantity,
      ticketCodes: savedTickets.map((item) => item.code),
    };
    const receipt = {
      id: `email-${Date.now()}`,
      to: payment.email,
      subject: `Your Eventix ticket for ${event.title}`,
      ticketCode: ticket.ticketCodes.join(", "),
      event: event.title,
      date: event.date,
      venue: event.venue,
      quantity,
      total: total === 0 ? "Free" : `EUR ${total}`,
      sentAt: emailSentAt,
    };
    const emailOutbox = readJson("ticketEmailOutbox", []);

    savedTickets.forEach(saveBuyerTicket);
    localStorage.setItem("ticketEmailOutbox", JSON.stringify([receipt, ...emailOutbox]));
    addBuyerNotification({
      title: "Ticket bought",
      message: `${quantity} ticket${quantity === 1 ? "" : "s"} booked for ${event.title}.`,
      eventId: event.id,
      ticketCode: ticket.code,
      type: "bookingitem",
    });
    cartLines.forEach((line) => {
      recordTicketTypePurchase(line.ticketTypeId, line.quantity, line.ticketType?.quantityAvailable);
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
            <small>{cartSummary || "Ticket"} - {payment.email}</small>
          </div>
        </div>

        <label className="ticket-type-picker">
          Discount coupon
          <div className="coupon-row">
            <input
              onChange={(input) => {
                setCouponCode(input.target.value);
                setCouponMessage("");
                setCouponValidation(null);
              }}
              placeholder="Enter coupon code"
              value={couponCode}
            />
            <button
              type="button"
              disabled={couponApplying}
              onClick={applyCoupon}
            >
              {couponApplying ? "Checking..." : "Apply"}
            </button>
          </div>
          {couponMessage && <small>{couponMessage}</small>}
        </label>

        <div className="checkout-total">
          <span>Subtotal</span>
          <strong>{subtotal === 0 ? "Free" : `EUR ${subtotal}`}</strong>
        </div>

        {discount > 0 && (
          <div className="checkout-total">
            <span>Discount</span>
            <strong>- EUR {discount}</strong>
          </div>
        )}

        <div className="checkout-total">
          <span>Total ({quantity} tickets)</span>
          <strong>{total === 0 ? "Free" : `EUR ${total}`}</strong>
        </div>

        {total > 0 && (
          <label className="ticket-type-picker">
            Payment method
            <select
              required
              value={selectedPaymentMethodId}
              onChange={(input) => setSelectedPaymentMethodId(input.target.value)}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} {method.provider ? `- ${method.provider}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {requiresCardDetails && (
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
                  inputMode="numeric"
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
                  maxLength="3"
                  onChange={(input) => updatePayment("cvc", input.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="123"
                  required
                  value={payment.cvc}
                />
              </label>
            </div>
          </div>
        )}

        <div className="checkout-actions">
          <Link className="auth-secondary-button" to={`/buyer/checkout/${event.id}?${buildCheckoutQuery(cartItems, payment.email)}`}>
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
