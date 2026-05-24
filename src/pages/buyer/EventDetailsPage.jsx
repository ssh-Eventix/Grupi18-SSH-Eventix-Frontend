import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHeart,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaRobot,
  FaStar,
  FaTicketAlt,
  FaUserTie,
} from "react-icons/fa";
import api from "../../api/axios";
import AuthPromptModal from "../../components/AuthPromptModal";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { getAvailableTicketTypes } from "../../services/ticketTypeService";
import {
  addBuyerReview,
  getBuyerReviews,
  isFavoriteEvent,
  toggleFavoriteEvent,
} from "../../services/buyerStorage";

const fallbackTicketTypes = [
  { id: "regular", name: "Regular", price: 15, quantityAvailable: 50 },
  { id: "vip", name: "VIP", price: 35, quantityAvailable: 20 },
];

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPublicPage = !location.pathname.startsWith("/buyer");
  const backPath = location.pathname.startsWith("/buyer") ? "/buyer" : "/";
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [authPrompt, setAuthPrompt] = useState(null);

  useEffect(() => {
    eventsApi.getById(eventId, { publicOnly: isPublicPage }).then((nextEvent) => {
      setEvent(nextEvent);
      setFavorite(nextEvent ? isFavoriteEvent(nextEvent.id) : false);
    });
  }, [eventId, isPublicPage]);

  useEffect(() => {
    if (!event) return;

    setReviews(getBuyerReviews().filter((review) => review.eventId === event.id || review.backendEventId === event.backendId));

    if (isPublicPage) {
      setTicketTypes(fallbackTicketTypes);
      setSelectedTicketTypeId(fallbackTicketTypes[0].id);
      return;
    }

    getAvailableTicketTypes(event.backendId || event.id)
      .then((types) => {
        const nextTypes = types.length ? types : fallbackTicketTypes;
        setTicketTypes(nextTypes);
        setSelectedTicketTypeId(nextTypes[0]?.id || "");
      })
      .catch(() => {
        setTicketTypes(fallbackTicketTypes);
        setSelectedTicketTypeId(fallbackTicketTypes[0].id);
      });
  }, [event, isPublicPage]);

  const selectedTicketType = useMemo(
    () => ticketTypes.find((type) => type.id === selectedTicketTypeId),
    [selectedTicketTypeId, ticketTypes]
  );

  if (!event) {
    return (
      <section className="buyer-page simple-buyer-page empty-state">
        <strong>Event not found</strong>
        <p>This event may have been removed or is not published yet.</p>
        <Link to={backPath}>Back to events</Link>
      </section>
    );
  }

  const handleFavorite = () => {
    if (!user) {
      setAuthPrompt({
        message: `Save ${event.title} after you log in or create a buyer account.`,
        redirectTo: `/buyer/events/${event.id}`,
      });
      return;
    }

    const next = toggleFavoriteEvent(event);
    setFavorite(next.some((item) => item.id === event.id));
  };

  const buyTicket = () => {
    const params = new URLSearchParams();
    if (selectedTicketTypeId) params.set("ticketTypeId", selectedTicketTypeId);
    params.set("quantity", String(quantity));
    const checkoutPath = `/buyer/checkout/${event.id}?${params.toString()}`;
    if (!user) {
      setAuthPrompt({
        message: "Log in or create an account to continue to checkout and buy this ticket.",
        redirectTo: checkoutPath,
      });
      return;
    }

    navigate(checkoutPath);
  };

  const submitReview = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!user) {
      setAuthPrompt({
        message: "Log in or create an account to write a review.",
        redirectTo: `/buyer/events/${event.id}`,
      });
      return;
    }

    if (!reviewForm.comment.trim()) return;

    const review = {
      eventId: event.id,
      backendEventId: event.backendId,
      eventTitle: event.title,
      userId: user?.id || "local-buyer",
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment.trim(),
    };

    if (event.isBackendEvent && user?.id) {
      try {
        await api.post("/Review", {
          eventId: event.backendId || event.id,
          userId: user.id,
          rating: review.rating,
          comment: review.comment,
        });
      } catch {
        // Local review is still useful for the buyer profile when backend validation blocks it.
      }
    }

    addBuyerReview(review);
    setReviews([review, ...reviews]);
    setReviewForm({ rating: 5, comment: "" });
  };

  return (
    <section className="buyer-page event-details-page">
      <div className="details-hero" style={{ backgroundImage: `url("${event.image}")` }}>
        <div>
          <span>{event.category}</span>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
        </div>
      </div>

      <div className="details-grid">
        <article className="panel event-info-panel">
          <h2>Event Details</h2>
          <p><FaCalendarAlt /> {event.date}{event.time ? `, ${event.time}` : ""}</p>
          <p><FaMapMarkerAlt /> {event.venue}, {event.city}</p>
          <p><FaUserTie /> {event.speakerName || event.organizerName || "Speaker info coming soon"}</p>
          <div className="ai-note">
            <FaRobot />
            <span>AI recommendation: this event matches your recent searches and saved tickets.</span>
          </div>
        </article>

        <aside className="panel checkout-panel">
          <button className="logout-button" type="button" onClick={handleFavorite}>
            <FaHeart /> {favorite ? "Saved" : "Save event"}
          </button>
          <span>Ticket type</span>
          <label className="ticket-type-picker">
            Select ticket
            <select value={selectedTicketTypeId} onChange={(input) => setSelectedTicketTypeId(input.target.value)}>
              {ticketTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - EUR {Number(type.price || 0)}
                </option>
              ))}
            </select>
          </label>
          <div className="quantity-row">
            <span>Quantity</span>
            <div>
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><FaMinus /></button>
              <strong>{quantity}</strong>
              <button type="button" onClick={() => setQuantity((value) => Math.min(Number(selectedTicketType?.quantityAvailable || 50), value + 1))}><FaPlus /></button>
            </div>
          </div>
          <strong>EUR {Number(selectedTicketType?.price || 0) * quantity}</strong>
          <button className="primary-button" type="button" onClick={buyTicket}>
            <FaTicketAlt /> Buy ticket
          </button>
        </aside>
      </div>

      <section className="panel review-panel">
        <div className="panel-title">
          <h2>Reviews</h2>
          <span>{reviews.length} written</span>
        </div>
        <form className="settings-form-grid" onSubmit={submitReview}>
          <label className="settings-field">
            Rating
            <select value={reviewForm.rating} onChange={(input) => setReviewForm((prev) => ({ ...prev, rating: input.target.value }))}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>{rating} stars</option>
              ))}
            </select>
          </label>
          <label className="settings-field">
            Review
            <input
              onChange={(input) => setReviewForm((prev) => ({ ...prev, comment: input.target.value }))}
              placeholder="Write what you thought about this event"
              value={reviewForm.comment}
            />
          </label>
          <button className="primary-button settings-save" type="submit">Add review</button>
        </form>
        <div className="ticket-list">
          {reviews.map((review) => (
            <article className="ticket-card" key={review.id || `${review.eventId}-${review.createdAt}`}>
              <span><FaStar /></span>
              <div>
                <strong>{review.rating}/5 stars</strong>
                <small>{review.comment}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
      {authPrompt && (
        <AuthPromptModal
          message={authPrompt.message}
          onClose={() => setAuthPrompt(null)}
          redirectTo={authPrompt.redirectTo}
        />
      )}
    </section>
  );
}

export default EventDetailsPage;
