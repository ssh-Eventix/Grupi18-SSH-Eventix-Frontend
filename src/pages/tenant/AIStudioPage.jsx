import { useEffect, useMemo, useState } from "react";
import { aiService } from "../../services/aiService";
import { eventsService } from "../../services/eventsService";
import { handleApiError } from "../../utils/apiErrorHandler";

export default function AIStudioPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [descriptionForm, setDescriptionForm] = useState({
    title: "",
    category: "",
    location: "",
  });

  const [marketingForm, setMarketingForm] = useState({
    eventId: "",
    eventTitle: "",
    eventDescription: "",
  });

  const [reviewEventId, setReviewEventId] = useState("");

  const [descriptionResult, setDescriptionResult] = useState("");
  const [marketingResult, setMarketingResult] = useState("");
  const [reviewResult, setReviewResult] = useState("");

  const [loadingDescription, setLoadingDescription] = useState(false);
  const [loadingMarketing, setLoadingMarketing] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    eventsService
      .getAll()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => setError(handleApiError(err)));
  }, []);

  const selectedMarketingEvent = useMemo(() => {
    return events.find((event) => String(event.id) === String(marketingForm.eventId));
  }, [events, marketingForm.eventId]);

  const updateDescriptionField = (name, value) => {
    setDescriptionForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setMessage("");
  };

  const updateMarketingField = (name, value) => {
    setMarketingForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleMarketingEventChange = (eventId) => {
    const event = events.find((item) => String(item.id) === String(eventId));

    setMarketingForm({
      eventId,
      eventTitle: event?.title || event?.name || "",
      eventDescription: event?.description || "",
    });

    setError("");
    setMessage("");
  };

  const generateDescription = async (event) => {
    event.preventDefault();

    setLoadingDescription(true);
    setError("");
    setMessage("");
    setDescriptionResult("");

    try {
      const result = await aiService.generateEventDescription(descriptionForm);
      setDescriptionResult(result.response || "");
      setMessage("Event description generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoadingDescription(false);
    }
  };

  const generateMarketing = async (event) => {
    event.preventDefault();

    setLoadingMarketing(true);
    setError("");
    setMessage("");
    setMarketingResult("");

    try {
      const result = await aiService.generateMarketing({
        eventTitle: marketingForm.eventTitle,
        eventDescription: marketingForm.eventDescription,
      });

      setMarketingResult(result.response || "");
      setMessage("Marketing content generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoadingMarketing(false);
    }
  };

  const generateReviewSummary = async (event) => {
    event.preventDefault();

    if (!reviewEventId) {
      setError("Select an event first.");
      return;
    }

    setLoadingReviews(true);
    setError("");
    setMessage("");
    setReviewResult("");

    try {
      const result = await aiService.getReviewSummary(reviewEventId);
      setReviewResult(result.response || "");
      setMessage("Review summary generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoadingReviews(false);
    }
  };

  const useDescriptionForMarketing = () => {
    setMarketingForm((prev) => ({
      ...prev,
      eventTitle: prev.eventTitle || descriptionForm.title,
      eventDescription: descriptionResult,
    }));

    setMessage("Description copied to marketing generator.");
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>AI Studio</h1>
          <p>Generate event descriptions, marketing content, and review summaries.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {message && <div className="form-alert success">{message}</div>}

      <div className="table-panel">
        <h2>Generate Event Description</h2>

        <form className="dynamic-form" onSubmit={generateDescription}>
          <div className="form-field">
            <label>Event Title</label>
            <input
              value={descriptionForm.title}
              onChange={(event) => updateDescriptionField("title", event.target.value)}
              placeholder="Sunny Hill Festival"
              required
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <input
              value={descriptionForm.category}
              onChange={(event) => updateDescriptionField("category", event.target.value)}
              placeholder="Music Festival"
              required
            />
          </div>

          <div className="form-field">
            <label>Location</label>
            <input
              value={descriptionForm.location}
              onChange={(event) => updateDescriptionField("location", event.target.value)}
              placeholder="Prishtina"
              required
            />
          </div>

          <button className="primary-button" type="submit" disabled={loadingDescription}>
            {loadingDescription ? "Generating..." : "Generate Description"}
          </button>
        </form>

        {descriptionResult && (
          <>
            <textarea value={descriptionResult} readOnly rows={8} />
            <button type="button" onClick={useDescriptionForMarketing}>
              Use for Marketing
            </button>
          </>
        )}
      </div>

      <div className="table-panel">
        <h2>Generate Marketing</h2>

        <form className="dynamic-form" onSubmit={generateMarketing}>
          <div className="form-field">
            <label>Event</label>
            <select value={marketingForm.eventId} onChange={(event) => handleMarketingEventChange(event.target.value)}>
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title || event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Event Title</label>
            <input
              value={marketingForm.eventTitle}
              onChange={(event) => updateMarketingField("eventTitle", event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Event Description</label>
            <textarea
              value={marketingForm.eventDescription}
              onChange={(event) => updateMarketingField("eventDescription", event.target.value)}
              rows={6}
              required
            />
          </div>

          <button className="primary-button" type="submit" disabled={loadingMarketing}>
            {loadingMarketing ? "Generating..." : "Generate Marketing"}
          </button>
        </form>

        {selectedMarketingEvent && (
          <p className="status-text">
            Selected event: {selectedMarketingEvent.title || selectedMarketingEvent.name}
          </p>
        )}

        {marketingResult && <textarea value={marketingResult} readOnly rows={12} />}
      </div>

      <div className="table-panel">
        <h2>Review Summary</h2>

        <form className="dynamic-form" onSubmit={generateReviewSummary}>
          <div className="form-field">
            <label>Event</label>
            <select value={reviewEventId} onChange={(event) => setReviewEventId(event.target.value)} required>
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title || event.name}
                </option>
              ))}
            </select>
          </div>

          <button className="primary-button" type="submit" disabled={loadingReviews}>
            {loadingReviews ? "Summarizing..." : "Generate Review Summary"}
          </button>
        </form>

        {reviewResult && <textarea value={reviewResult} readOnly rows={10} />}
      </div>
    </section>
  );
}