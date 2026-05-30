import { useCallback, useEffect, useMemo, useState } from "react";
import { FaBrain } from "react-icons/fa";
import DynamicTable from "../../components/DynamicTable";
import { aiService } from "../../services/aiService";
import { eventCategoriesService } from "../../services/eventCategoriesService";
import { eventsService } from "../../services/eventsService";
import { venuesService } from "../../services/venuesService";
import { handleApiError } from "../../utils/apiErrorHandler";
import Alert from "../../components/Alert";

const statusOptions = [
  { value: 1, label: "Draft" },
  { value: 2, label: "Published" },
  { value: 3, label: "Cancelled" },
  { value: 4, label: "Completed" },
  { value: 5, label: "Archived" },
];

const visibilityOptions = [
  { value: 1, label: "Private" },
  { value: 2, label: "Public" },
  { value: 3, label: "Unlisted" },
];

const initialForm = {
  venueId: "",
  eventCategoryId: "",
  title: "",
  slug: "",
  description: "",
  marketingCopy: "",
  organizerName: "",
  startUtc: "",
  endUtc: "",
  status: 1,
  visibility: 2,
  bannerImageUrl: "",
  maxTicketsPerOrder: 10,
  minTicketsPerOrder: 1,
  isFree: false,
  isPublished: false,
  currency: "EUR",
};

const toArray = (value) => (Array.isArray(value) ? value : value?.data ?? []);

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const labelFromOptions = (options, value) => {
  const match = options.find((option) => String(option.value) === String(value));
  return match?.label || value || "";
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "");

const getEventSortTime = (event) => {
  const value = event.createdAtUtc || event.updatedAtUtc || event.startUtc;
  const time = value ? new Date(value).getTime() : 0;

  return Number.isNaN(time) ? 0 : time;
};

const mergeEventsById = (...eventGroups) => {
  const map = new Map();

  eventGroups.flat().filter(Boolean).forEach((event) => {
    const key = event.id || event.slug || event.title;
    if (key) map.set(String(key), { ...map.get(String(key)), ...event });
  });

  return [...map.values()].sort((a, b) => getEventSortTime(b) - getEventSortTime(a));
};

const filterEvents = (events, searchValue) => {
  const term = String(searchValue || "").trim().toLowerCase();

  if (!term) return events;

  return events.filter((event) =>
    [
      event.title,
      event.slug,
      event.description,
      event.organizerName,
      event.venueName,
      event.eventCategoryName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
};

const formatVenueOptionLabel = (venue) => {
  const name = venue.code ? `${venue.name} (${venue.code})` : venue.name;
  const source = venue.source === "tenant" ? "Tenant" : "Public";

  return `${name} - ${source}`;
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [recentEvents, setRecentEvents] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchEventsForTable = useCallback(async (page, pageSize, searchValue) => {
    setLoading(true);
    setError("");

    try {
      const backendEvents = toArray(await eventsService.getAll(searchValue));
      const data = filterEvents(mergeEventsById(recentEvents, backendEvents), searchValue);
      const startIndex = (page - 1) * pageSize;

      setEvents(data);

      return {
        data: data.slice(startIndex, startIndex + pageSize),
        totalPages: Math.max(1, Math.ceil(data.length / pageSize)),
      };
    } catch (err) {
      setEvents([]);
      setError(handleApiError(err));
      return { data: [], totalPages: 1 };
    } finally {
      setLoading(false);
    }
  }, [recentEvents]);

  const loadEvents = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPageData() {
      try {
        const [venueData, categoryData] = await Promise.all([
          venuesService.getAllAvailable(),
          eventCategoriesService.getAll(),
        ]);

        if (!isMounted) return;
        setVenues(toArray(venueData));
        setCategories(toArray(categoryData));
      } catch {
        if (!isMounted) return;
        setVenues([]);
        setCategories([]);
      }
    }

    loadPageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const venueOptions = useMemo(
    () => [
      { value: "", label: "Select venue" },
      ...venues.map((venue) => ({
        value: venue.id,
        label: formatVenueOptionLabel(venue),
      })),
    ],
    [venues]
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Select category" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories]
  );

  const venueNameById = useMemo(() => {
    return venues.reduce((map, venue) => {
      map[String(venue.id)] = venue.name;
      return map;
    }, {});
  }, [venues]);

  const categoryNameById = useMemo(() => {
    return categories.reduce((map, category) => {
      map[String(category.id)] = category.name;
      return map;
    }, {});
  }, [categories]);

  const eventColumns = useMemo(
    () => [
      {
        key: "title",
        label: "Title",
      },
      {
        key: "eventCategoryId",
        label: "Category",
        render: (event) =>
          categoryNameById[String(event.eventCategoryId)] ||
          event.eventCategoryName ||
          event.eventCategoryId,
      },
      {
        key: "venueId",
        label: "Venue",
        render: (event) => venueNameById[String(event.venueId)] || event.venueName || event.venueId,
      },
      {
        key: "organizerName",
        label: "Organizer",
        render: (event) => event.organizerName || "-",
      },
      {
        key: "startUtc",
        label: "Start",
        render: (event) => formatDate(event.startUtc),
      },
      {
        key: "endUtc",
        label: "End",
        render: (event) => formatDate(event.endUtc),
      },
      {
        key: "status",
        label: "Status",
        render: (event) => labelFromOptions(statusOptions, event.status),
      },
      {
        key: "visibility",
        label: "Visibility",
        render: (event) => labelFromOptions(visibilityOptions, event.visibility),
      },
      {
        key: "isPublished",
        label: "Published",
        render: (event) => (event.isPublished ? "Yes" : "No"),
      },
    ],
    [categoryNameById, venueNameById]
  );

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setError("");
    setMessage("");
  };

  const handleChange = (event) => {
    const { checked, name, type, value } = event.target;
    updateField(name, type === "checkbox" ? checked : value);
  };

  const generateDescription = async () => {
    const title = form.title?.trim();

    if (!title) {
      setError("Add an event title before generating the description.");
      return;
    }

    setAiLoading("description");
    setError("");
    setMessage("");

    try {
      const result = await aiService.generateEventDescription({
        title,
        category: categoryNameById[String(form.eventCategoryId)] || "Event",
        location: venueNameById[String(form.venueId)] || form.organizerName?.trim() || "Event venue",
        organizerName: form.organizerName?.trim() || "",
        startUtc: form.startUtc || "",
        endUtc: form.endUtc || "",
        currency: form.currency || "EUR",
        isFree: Boolean(form.isFree),
      });

      const response = result.response?.trim();

      if (!response) {
        setError("AI did not return a description. Try again.");
        return;
      }

      updateField("description", response.slice(0, 3000));
      setMessage("AI description generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAiLoading("");
    }
  };

  const generateMarketing = async () => {
    const eventTitle = form.title?.trim();
    const eventDescription = form.description?.trim();

    if (!eventTitle) {
      setError("Add an event title before generating marketing content.");
      return;
    }

    if (!eventDescription) {
      setError("Add or generate an event description first.");
      return;
    }

    setAiLoading("marketingCopy");
    setError("");
    setMessage("");

    try {
      const result = await aiService.generateMarketing({
        eventTitle,
        eventDescription,
      });

      const response = result.response?.trim();

      if (!response) {
        setError("AI did not return marketing content. Try again.");
        return;
      }

      updateField("marketingCopy", response);
      setMessage("AI marketing content generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAiLoading("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await eventsService.update(editingId, form);
        setRecentEvents((current) =>
          mergeEventsById(current, [{ ...form, id: editingId, updatedAtUtc: new Date().toISOString() }])
        );
        loadEvents();
        setMessage("Event updated.");
      } else {
        const createdEvent = await eventsService.create(form);
        setRecentEvents((current) => mergeEventsById(current, [createdEvent]));
        loadEvents();
        setMessage("Event created.");
      }

      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      ...initialForm,
      ...event,
      startUtc: toDateTimeLocal(event.startUtc),
      endUtc: toDateTimeLocal(event.endUtc),
      status: Number(event.status || 1),
      visibility: Number(event.visibility || 2),
      marketingCopy: event.marketingCopy || "",
    });
    setError("");
    setMessage("");
  };

  const handleDelete = async (event) => {
    setError("");
    setMessage("");

    try {
      await eventsService.delete(event.id);
      loadEvents();
      setMessage("Event deleted.");
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  };

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Events</h1>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError("")} />
      <Alert type="success" message={message} onClose={() => setMessage("")} />

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Venue</label>
          <select name="venueId" value={form.venueId} onChange={handleChange} required>
            {venueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Category</label>
          <select name="eventCategoryId" value={form.eventCategoryId} onChange={handleChange} required>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>Slug</label>
          <input name="slug" value={form.slug} onChange={handleChange} />
        </div>

        <div className="form-field full-span">
          <div className="field-label-row">
            <label>Description</label>
            <button
              className="field-action-button"
              type="button"
              disabled={aiLoading === "description"}
              onClick={generateDescription}
            >
              <FaBrain />
              <span>{aiLoading === "description" ? "Generating..." : "AI"}</span>
            </button>
          </div>
          <textarea
            name="description"
            rows={7}
            maxLength={3000}
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-field full-span">
          <div className="field-label-row">
            <label>Marketing Copy</label>
            <button
              className="field-action-button"
              type="button"
              disabled={aiLoading === "marketingCopy"}
              onClick={generateMarketing}
            >
              <FaBrain />
              <span>{aiLoading === "marketingCopy" ? "Generating..." : "AI Marketing"}</span>
            </button>
          </div>
          <textarea
            name="marketingCopy"
            rows={7}
            value={form.marketingCopy}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label>Organizer</label>
          <input name="organizerName" value={form.organizerName} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Start</label>
          <input name="startUtc" type="datetime-local" value={form.startUtc} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>End</label>
          <input name="endUtc" type="datetime-local" value={form.endUtc} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>Status</label>
          <select name="status" value={form.status} onChange={handleChange}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Visibility</label>
          <select name="visibility" value={form.visibility} onChange={handleChange}>
            {visibilityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Banner Image URL</label>
          <input name="bannerImageUrl" value={form.bannerImageUrl} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Max Tickets</label>
          <input
            name="maxTicketsPerOrder"
            type="number"
            min="1"
            value={form.maxTicketsPerOrder}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label>Min Tickets</label>
          <input
            name="minTicketsPerOrder"
            type="number"
            min="1"
            value={form.minTicketsPerOrder}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label>Currency</label>
          <input name="currency" value={form.currency} onChange={handleChange} required />
        </div>

        <div className="form-field">
          <label>Free</label>
          <input name="isFree" type="checkbox" checked={form.isFree} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Published</label>
          <input name="isPublished" type="checkbox" checked={form.isPublished} onChange={handleChange} />
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Saving..." : editingId ? "Update Event" : "Create Event"}
        </button>

        {editingId && (
          <button type="button" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </form>

      <DynamicTable
        columns={eventColumns}
        fetchData={fetchEventsForTable}
        defaultPageSize={5}
        pageSizeOptions={[5, 10, 20]}
        refreshKey={refreshKey}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete,
        }}
      />
    </section>
  );
}
