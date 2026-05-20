import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaUserTie } from "react-icons/fa";
import { eventsApi } from "../../api/eventsApi";

function EventDetailsPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    eventsApi.getById(eventId).then(setEvent);
  }, [eventId]);

  if (!event) {
    return (
      <section className="buyer-page simple-buyer-page empty-state">
        <strong>Event not found</strong>
        <p>This event may have been removed or is not published yet.</p>
        <Link to="/buyer">Back to events</Link>
      </section>
    );
  }

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
          <p>
            <FaCalendarAlt /> {event.date}
          </p>
          <p>
            <FaMapMarkerAlt /> {event.venue}, {event.city}
          </p>
          <p>
            <FaUserTie /> {event.organizerName || "Eventix organizer"}
          </p>
        </article>

        <aside className="panel checkout-panel">
          <span>Starting from</span>
          <strong>{event.price}</strong>
          <Link className="primary-button" to={`/buyer/checkout/${event.id}`}>
            <FaTicketAlt /> Get Tickets
          </Link>
        </aside>
      </div>
    </section>
  );
}

export default EventDetailsPage;
