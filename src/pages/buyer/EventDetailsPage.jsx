import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaHeart,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaStar,
  FaTicketAlt,
  FaUserTie,
} from "react-icons/fa";
import AuthPromptModal from "../../components/AuthPromptModal";
import { eventsApi } from "../../api/eventsApi";
import { useAuth } from "../../auth/AuthContext";
import { getAvailableTicketTypes } from "../../services/ticketTypeService";
import { reviewsService } from "../../services/reviewsService";
import {
  addBuyerNotification,
  addBuyerReview,
  isFavoriteEvent,
  toggleFavoriteEvent,
} from "../../services/buyerStorage";

const getEventTenantSlug = (event) => {
  if (event?.tenantSlug) return event.tenantSlug;
  if (event?.schemaName?.startsWith("tenant_")) {
    return event.schemaName.replace(/^tenant_/, "").replace(/_events$/, "");
  }

  return "";
};

const getErrorMessage = (error) => {
  const data = error.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.title) return data.title;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");

  return error.message || "Review could not be saved right now. Please try again.";
};

function EventDetailsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useAuth();
  const isPublicPage = !location.pathname.startsWith("/buyer");
  const backPath = location.pathname.startsWith("/buyer") ? "/buyer" : "/";
  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [authPrompt, setAuthPrompt] = useState(null);

  useEffect(() => {
    eventsApi.getById(eventId, { publicOnly: isPublicPage }).then((nextEvent) => {
      setEvent(nextEvent);
      setFavorite(nextEvent ? isFavoriteEvent(nextEvent.id) : false);
    });
  }, [eventId, isPublicPage]);

  useEffect(() => {
    if (!event) return;
    const eventTenantSlug = getEventTenantSlug(event);

    reviewsService
      .getByEventId(event.backendId || event.id, eventTenantSlug)
      .then(setReviews)
      .catch(() => setReviews([]));

    getAvailableTicketTypes(event.backendId || event.id, eventTenantSlug)
      .then((types) => {
        setTicketTypes(types);
        setSelectedTicketTypeId(types[0]?.id || "");
      })
      .catch(() => {
        setTicketTypes([]);
        setSelectedTicketTypeId("");
      });
  }, [event, isPublicPage]);

  useEffect(() => {
    if (!event || !user || isPublicPage) return;

    eventsApi.browse({ publicOnly: true })
      .then((events) => {
        const similarEvents = events
          .filter((item) =>
            item.id !== event.id &&
            item.title !== event.title &&
            item.category === event.category &&
            new Date(item.startUtc || item.date).getTime() > Date.now()
          )
          .filter((item, index, items) => items.findIndex((nextItem) => nextItem.title === item.title) === index)
          .slice(0, 3);

        if (!similarEvents.length) return;

        const notificationKey = `ai-recommendation-${event.id}`;
        const titles = similarEvents.map((item) => item.title).join(", ");

        addBuyerNotification({
          id: notificationKey,
          type: "ai-recommendation",
          title: `AI found more ${event.category} events`,
          message: `Because you viewed ${event.title}, you may also like: ${titles}.`,
          eventId: event.id,
          targetEventId: similarEvents[0].id,
          category: event.category,
        });
      })
      .catch(() => {});
  }, [event, isPublicPage, user]);

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
    if (!token) {
      setAuthPrompt({
        message: "Log in or create an account to write a review.",
        redirectTo: `/buyer/events/${event.id}`,
      });
      return;
    }

    if (!reviewForm.comment.trim()) return;

    const userId = user?.id || user?.userId || user?.publicUserId;
    const eventTenantSlug = getEventTenantSlug(event);

    if (!userId) {
      setReviewError("Your login session is missing the user id. Please log out and log in again.");
      return;
    }

    if (!eventTenantSlug) {
      setReviewError("This event is missing tenantSlug from the public events API, so the review cannot be saved to the correct tenant.");
      return;
    }

    setReviewError("");

    const review = {
      eventId: event.backendId || event.id,
      userId,
      rating: Number(reviewForm.rating),
      comment: reviewForm.comment.trim(),
    };

    try {
      const savedReview = await reviewsService.create(review, eventTenantSlug);
      const profileReview = {
        ...savedReview,
        id: savedReview.id || `review-${Date.now()}`,
        eventId: event.backendId || event.id,
        eventTitle: event.title,
        tenantSlug: eventTenantSlug,
        rating: savedReview.rating || review.rating,
        comment: savedReview.comment || review.comment,
      };

      addBuyerReview(profileReview);
      setReviews([savedReview, ...reviews]);
      setReviewForm({ rating: 5, comment: "" });
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthPrompt({
          message: "Your session expired. Log in again to write a review.",
          redirectTo: `/buyer/events/${event.id}`,
        });
        return;
      }

      setReviewError(getErrorMessage(error));
    }
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
          {event.organizerName && (
              <p>
                <FaUserTie /> Organized by {event.organizerName}
              </p>
            )}
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
        {reviewError && <p className="form-error">{reviewError}</p>}
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
