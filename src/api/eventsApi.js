import api from "./axios";
import { buyerEvents } from "../pages/buyer/buyerData";

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Date TBA");

const formatTime = (value) =>
  value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

const isActiveEvent = (event) => {
  if (!event.endUtc) return true;
  return new Date(event.endUtc).getTime() > Date.now();
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

export const eventsApi = {
  async browse({ search = "" } = {}) {
    const response = await api.get("/Events/public", {
      params: search ? { search } : undefined,
      suppressAuthRedirect: true,
    });

    return normalizeEventList(response.data);
  },

  async getById(id) {
    try {
      const response = await api.get(`/Events/public/${id}`, {
        suppressAuthRedirect: true,
      });

      return normalizeBackendEvent(response.data);
    } catch {
      const events = await eventsApi.browse();
      return events.find((event) => event.id === id || event.backendId === id) || null;
    }
  },
};