import api from "./axios";
import { buyerEvents } from "../pages/buyer/buyerData";

const normalizeBackendEvent = (event) => ({
  id: event.id,
  backendId: event.id,
  isBackendEvent: true,
  title: event.title,
  category: event.eventCategoryName || "Event",
  date: event.startUtc ? new Date(event.startUtc).toLocaleDateString() : "Date TBA",
  startUtc: event.startUtc,
  endUtc: event.endUtc,
  city: event.city || "Tirana",
  venue: event.venueName || "Venue TBA",
  price: event.isFree ? "Free" : `${event.currency || "EUR"} tickets available`,
  tag: event.isPublished ? "Top Event" : "Upcoming",
  description: event.description || "Event details will be published soon.",
  organizerName: event.organizerName || "Eventix organizer",
  image: event.bannerImageUrl || buyerEvents[0].image,
});

export const eventsApi = {
  async browse({ search = "", tenantSlug } = {}) {
    try {
      const response = await api.get("/Events/search", {
        headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
        params: search ? { search } : undefined,
        suppressAuthRedirect: true,
      });

      return response.data.map(normalizeBackendEvent);
    } catch {
      return buyerEvents;
    }
  },

  async getById(id, { tenantSlug } = {}) {
    try {
      const response = await api.get(`/Events/${id}`, {
        headers: tenantSlug ? { "X-Tenant-Slug": tenantSlug } : undefined,
        suppressAuthRedirect: true,
      });

      return normalizeBackendEvent(response.data);
    } catch {
      return buyerEvents.find((event) => event.id === id) || null;
    }
  },
};
