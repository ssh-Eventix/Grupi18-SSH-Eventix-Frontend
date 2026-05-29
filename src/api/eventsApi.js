import api from "./axios";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Date TBA");

const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const isActiveEvent = (event) => {
  if (!event.endUtc) return true;
  return new Date(event.endUtc).getTime() > Date.now();
};

const cleanDescription = (value) => {
  const text = String(value || "").trim();

  if (!text) return "Event details will be published soon.";

  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s*/, "")
        .replace(/^\s*(?:[-*•]|\d+\.)\s+/, "")
        .replace(/[*_`]/g, "")
        .trim()
    )
    .filter(Boolean)
    .join(" ");
};

const normalizeBackendEvent = (event) => {
  const startsAt = event.startUtc || event.startTime;
  const endsAt = event.endUtc || event.endTime;

  return {
    id: event.id,
    backendId: event.id,
    isBackendEvent: true,
    title: event.title || "Untitled event",
    category: event.eventCategoryName || event.categoryName || "Event",
    date: formatDate(startsAt),
    time: startsAt && endsAt ? `${formatTime(startsAt)} - ${formatTime(endsAt)}` : formatTime(startsAt),
    startUtc: startsAt,
    endUtc: endsAt,
    city: event.city || event.venueCity || "Prishtina",
    venue: event.venueName || event.venue || "Venue TBA",
    price: event.isFree ? "Free" : `${event.currency || "EUR"} tickets available`,
    tag: event.isPublished ? "Top Event" : "Upcoming",
    description: cleanDescription(event.description),
    organizerName: event.organizerName || "Eventix organizer",
    speakerName: event.speakerName || event.mainSpeakerName || "",
    tenantSlug: event.tenantSlug || event.TenantSlug || "",
    schemaName: event.schemaName || event.SchemaName || "",
    image: event.bannerImageUrl || "",
  };
};

const normalizeEventList = (data) => {
  const rawEvents = Array.isArray(data) ? data : Array.isArray(data && data.data) ? data.data : [];
  return rawEvents.map(normalizeBackendEvent).filter(isActiveEvent);
};

export const eventsApi = {
  async browse({ search = "" } = {}) {
    const response = await api.get("/Events/public", {
      params: search ? { search } : undefined,
      suppressAuthRedirect: true,
    });

    return normalizeEventList(response.data);
  },

  async getById(id) {
    const response = await api.get(`/Events/public/${id}`, {
      suppressAuthRedirect: true,
    });

    return normalizeBackendEvent(response.data);
  }
};
