import { useEffect, useMemo, useState } from "react";
import { reviewsService } from "../../services/reviewsService";
import api from "../../services/api";
import { handleApiError } from "../../utils/apiErrorHandler";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export default function SuperAdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    reviewsService
      .getAll()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((err) => setError(handleApiError(err)))
      .finally(() => setLoading(false));
  }, []);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + Number(review.rating || 0),
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const eventIds = useMemo(() => {
    return [...new Set(reviews.map((review) => review.eventId).filter(Boolean))];
  }, [reviews]);

  const loadAiSummary = async () => {
    if (!selectedEventId) {
      setError("Select an event first.");
      return;
    }

    setError("");
    setAiSummary("");
    setSummaryLoading(true);

    try {
      const response = await api.get(`/ai/review-summary/${selectedEventId}`);
      setAiSummary(
        typeof response.data === "string"
          ? response.data
          : response.data.summary || response.data.message || JSON.stringify(response.data)
      );
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Reviews</h1>
          <p>View customer reviews and generate AI review summaries.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}

      <div className="stat-grid">
        <article className="stat-card blue-stat">
          <div>
            <strong>{reviews.length}</strong>
            <span>Total Reviews</span>
          </div>
        </article>

        <article className="stat-card blue-stat">
          <div>
            <strong>{averageRating}</strong>
            <span>Average Rating</span>
          </div>
        </article>

        <article className="stat-card blue-stat">
          <div>
            <strong>{eventIds.length}</strong>
            <span>Reviewed Events</span>
          </div>
        </article>
      </div>

      <form className="dynamic-form" onSubmit={(event) => event.preventDefault()}>
        <div className="form-field">
          <label>Event</label>
          <select
            value={selectedEventId}
            onChange={(event) => {
              setSelectedEventId(event.target.value);
              setAiSummary("");
              setError("");
            }}
          >
            <option value="">Select event</option>
            {eventIds.map((eventId) => (
              <option key={eventId} value={eventId}>
                {eventId}
              </option>
            ))}
          </select>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={loadAiSummary}
          disabled={summaryLoading}
        >
          {summaryLoading ? "Generating..." : "Generate AI Summary"}
        </button>
      </form>

      {aiSummary && (
        <div className="form-alert success-alert">
          <strong>AI Summary:</strong>
          <p>{aiSummary}</p>
        </div>
      )}

      <div className="table-panel">
        {loading ? (
          <p>Loading reviews...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rating</th>
                <th>Comment</th>
                <th>Event Id</th>
                <th>User Id</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>{review.rating}/5</td>
                  <td>{review.comment || "-"}</td>
                  <td>{review.eventId}</td>
                  <td>{review.userId}</td>
                  <td>{formatDate(review.createdAt)}</td>
                </tr>
              ))}

              {!reviews.length && (
                <tr>
                  <td colSpan="5">No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}