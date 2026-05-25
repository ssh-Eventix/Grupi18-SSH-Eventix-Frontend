import api from "./axios";
import { buyerEvents } from "../pages/buyer/buyerData";

const DEFAULT_TENANT_SLUG = "yllka";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Date TBA");

const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const isActiveEvent = (event) => {
  if (!event.endUtc) return true;
  return new Date(event.endUtc).getTime() > Date.now();
};

const tenantHeaders = (tenantSlug) => ({
  "X-Tenant-Slug": tenantSlug || localStorage.getItem("tenantSlug") || DEFAULT_TENANT_SLUG,
});

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
    description: event.description || "Event details will be published soon.",
    organizerName: event.organizerName || "Eventix organizer",
    speakerName: event.speakerName || event.mainSpeakerName || "",
    image: event.bannerImageUrl || buyerEvents[0].image,
  };
};

const normalizeEventList = (data) => {
  const rawEvents = Array.isArray(data) ? data : Array.isArray(data && data.data) ? data.data : [];
  return rawEvents.map(normalizeBackendEvent).filter(isActiveEvent);
};

const getEventsFrom = async (url, { search = "", tenantSlug } = {}) => {
  const response = await api.get(url, {
    headers: tenantHeaders(tenantSlug),
    params: search ? { search } : undefined,
    suppressAuthRedirect: true,
  });

  return normalizeEventList(response.data);
};

export const eventsApi = {
  async browse({ search = "", tenantSlug, publicOnly = false } = {}) {
    const urls = publicOnly ? ["/Events/public", "/Events/search"] : ["/Events/search", "/Events"];

    for (const url of urls) {
      try {
        return await getEventsFrom(url, { search, tenantSlug });
      } catch {
        // Try the next supported endpoint before returning an empty dynamic list.
      }
    }

    return [];
  },

  async getById(id, { tenantSlug, publicOnly = false } = {}) {
    const urls = publicOnly ? [`/Events/public/${id}`] : [`/Events/${id}`];

    for (const url of urls) {
      try {
        const response = await api.get(url, {
          headers: tenantHeaders(tenantSlug),
          suppressAuthRedirect: true,
        });

        return normalizeBackendEvent(response.data);
      } catch {
        // Fall through to list lookup or local fallback.
      }
    }

    if (publicOnly) {
      const events = await eventsApi.browse({ tenantSlug, publicOnly: true });
      return events.find((event) => event.id === id || event.backendId === id) || null;
    }

    return null;
  },
};
