import { useEffect, useMemo, useState } from "react";
import { eventsService } from "../../services/eventsService";
import { eventSectionsService } from "../../services/eventSectionsService";
import { venuesService } from "../../services/venuesService";
import { venueSectionsService } from "../../services/venueSectionsService";
import { handleApiError } from "../../utils/apiErrorHandler";
import Alert from "../../components/Alert";
import "./Tenant.css";

export default function EventSectionsPage() {
  const [events, setEvents] = useState([]);
  const [eventSections, setEventSections] = useState([]);
  const [venues, setVenues] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedVenueSectionId, setSelectedVenueSectionId] = useState("");
  const [venueSections, setVenueSections] = useState([]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    capacity: 0,
    isActive: true,
    salesStartUtc: "",
    salesEndUtc: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedEvent = useMemo(() => {
    return events.find((event) => String(event.id) === String(selectedEventId));
  }, [events, selectedEventId]);

  const selectedVenueId = selectedEvent?.venueId || "";
  const venueNameById = useMemo(() => {
    return venues.reduce((map, venue) => {
      map[String(venue.id)] = venue.name;
      return map;
    }, {});
  }, [venues]);
  const selectedVenueName =
    selectedEvent?.venueName ||
    venueNameById[String(selectedVenueId)] ||
    "";

  const selectedVenueSection = useMemo(() => {
    return venueSections.find(
      (section) => String(section.id) === String(selectedVenueSectionId)
    );
  }, [venueSections, selectedVenueSectionId]);

  const selectedEventSections = useMemo(() => {
    return eventSections.filter(
      (section) => String(section.eventId) === String(selectedEventId)
    );
  }, [eventSections, selectedEventId]);

  useEffect(() => {
  async function loadData() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [eventsData, venuesData] = await Promise.all([
        eventsService.getAll(),
        venuesService.getAllAvailable(),
      ]);

      const nextEvents = Array.isArray(eventsData)
        ? eventsData
        : eventsData?.data ?? [];
      const nextVenues = Array.isArray(venuesData)
        ? venuesData
        : venuesData?.data ?? [];

      setEvents(nextEvents);
      setVenues(nextVenues);

      if (nextEvents.length > 0) {
        const firstEventId = nextEvents[0].id;

        setSelectedEventId(firstEventId);

        const sections = await eventSectionsService.getByEventId(firstEventId);

        setEventSections(
          Array.isArray(sections)
            ? sections
            : sections?.data ?? []
        );
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }

  loadData();
}, []);

 useEffect(() => {
  async function loadVenueSections() {
    setVenueSections([]);
    setSelectedVenueSectionId("");

    if (!selectedVenueId) return;

    try {
      const data = await venueSectionsService.getByVenueId(selectedVenueId);

      setVenueSections(
        Array.isArray(data)
          ? data
          : data?.data ?? []
      );
    } catch (err) {
      setError(handleApiError(err));
    }
  }

  loadVenueSections();
}, [selectedVenueId]);

  const selectVenueSection = (section) => {
    setSelectedVenueSectionId(section.id);
    setError("");
    setMessage("");

    setForm((prev) => ({
      ...prev,
      name: section.name || "",
      code: section.code || "",
      capacity: section.capacity || 0,
    }));
  };

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!selectedEventId) {
      setError("Select an event first.");
      return;
    }

    if (!selectedVenueSectionId) {
      setError("Select a venue section first.");
      return;
    }

    const alreadyAdded = selectedEventSections.some(
      (section) =>
        String(section.venueSectionId) === String(selectedVenueSectionId)
    );

    if (alreadyAdded) {
      setError("This venue section is already added to this event.");
      return;
    }

    const payload = {
      eventId: selectedEventId,
      venueSectionId: selectedVenueSectionId,
      name: form.name.trim(),
      code: form.code.trim(),
      capacity: Number(form.capacity),
      isActive: Boolean(form.isActive),
      salesStartUtc: form.salesStartUtc
      ? new Date(form.salesStartUtc).toISOString()
      : null,
    salesEndUtc: form.salesEndUtc
      ? new Date(form.salesEndUtc).toISOString()
      : null,
        };

    if (!payload.name || !payload.code) {
      setError("Name and code are required.");
      return;
    }

    if (payload.capacity <= 0) {
      setError("Capacity must be greater than zero.");
      return;
    }

    setSaving(true);

    try {
      const created = await eventSectionsService.create(payload);

      setEventSections((prev) => [
        ...prev,
        created,
      ]);

      setSelectedVenueSectionId("");
      setForm({
        name: "",
        code: "",
        capacity: 0,
        isActive: true,
        salesStartUtc: "",
        salesEndUtc: "",
      });

      setMessage("Event section was created successfully.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Event Sections</h1>
          <p>Select physical venue parts and add them to an event.</p>
        </div>
      </div>

    <Alert type="error" message={error} onClose={() => setError("")} />
    <Alert type="success" message={message} onClose={() => setMessage("")} />

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field full">
          <label>Event</label>
          <select
            value={selectedEventId}
            disabled={saving}
            onChange={async (event) => {
            const eventId = event.target.value;

            setSelectedEventId(eventId);
            setSelectedVenueSectionId("");
            setVenueSections([]);
            setError("");
            setMessage("");

            try {
              const sections = await eventSectionsService.getByEventId(eventId);

              setEventSections(
                Array.isArray(sections)
                  ? sections
                  : sections?.data ?? []
              );
            } catch (err) {
              setError(handleApiError(err));
            }
          }}
            required
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title || event.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field full">
          <label>Venue</label>
          <div className="readonly-info">
            {selectedEvent
              ? selectedVenueName || "Venue selected from event"
              : "Select an event first"}
          </div>
        </div>

        <div className="form-field full">
          <label>Venue Sections</label>

          <div className="event-section-picker">
            {loading && <p className="status-text">Loading...</p>}

            {!loading && selectedEvent && venueSections.length === 0 && (
              <p className="status-text">
                No venue sections found for this venue.
              </p>
            )}

            {venueSections.map((section) => {
              const selected =
                String(selectedVenueSectionId) === String(section.id);

              const alreadyAdded = selectedEventSections.some(
                (eventSection) =>
                  String(eventSection.venueSectionId) === String(section.id)
              );

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`event-section-card ${selected ? "selected" : ""}`}
                  disabled={saving || alreadyAdded}
                  onClick={() => selectVenueSection(section)}
                >
                  <strong>{section.name}</strong>
                  <span>{section.code}</span>
                  <small>Capacity: {section.capacity}</small>
                  {alreadyAdded && <small>Already added</small>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-field">
          <label>Name</label>
          <input
            value={form.name}
            disabled={saving}
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Code</label>
          <input
            value={form.code}
            disabled={saving}
            onChange={(event) => updateField("code", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Capacity</label>
          <input
            type="number"
            min="1"
            value={form.capacity}
            disabled={saving}
            onChange={(event) => updateField("capacity", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Sales Start</label>
          <input
            type="datetime-local"
            value={form.salesStartUtc}
            disabled={saving}
            onChange={(event) => updateField("salesStartUtc", event.target.value)}
          />
        </div>

        <div className="form-field">
          <label>Sales End</label>
          <input
            type="datetime-local"
            value={form.salesEndUtc}
            disabled={saving}
            onChange={(event) => updateField("salesEndUtc", event.target.value)}
          />
        </div>

        <div className="form-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={saving}
              onChange={(event) => updateField("isActive", event.target.checked)}
            />
            Active
          </label>
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Event Section"}
        </button>
      </form>

      <div className="table-panel">
        <h2>Sections for selected event</h2>

        {selectedEventSections.length === 0 ? (
          <p className="status-text">No sections added to this event yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Capacity</th>
                <th>Active</th>
              </tr>
            </thead>

            <tbody>
              {selectedEventSections.map((section) => (
                <tr key={section.id}>
                  <td>{section.name}</td>
                  <td>{section.code}</td>
                  <td>{section.capacity}</td>
                  <td>{section.isActive ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
