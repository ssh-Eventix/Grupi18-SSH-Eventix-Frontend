import api from "./api";

const EVENTS_URL = "/Events";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toUtcIso = (value) => {
  if (!value) return "";
  return new Date(value).toISOString();
};

const validationError = (message) => {
  throw {
    response: {
      data: message,
    },
  };
};

const normalizeEventPayload = (data) => {
  const title = data.title?.trim();
  const venueId = data.venueId?.trim();
  const eventCategoryId = data.eventCategoryId?.trim();
  const startUtc = data.startUtc ? toUtcIso(data.startUtc) : "";
  const endUtc = data.endUtc ? toUtcIso(data.endUtc) : "";

  if (!venueId) return validationError("Select a venue.");
  if (!eventCategoryId) return validationError("Select a category.");
  if (!title) return validationError("Title is required.");
  if (!startUtc) return validationError("Start date is required.");
  if (!endUtc) return validationError("End date is required.");
  if (new Date(endUtc) <= new Date(startUtc)) {
    return validationError("End date must be after start date.");
  }

  const tag = () => {
          if (!startUtc) return false;

          const eventDate = new Date(startUtc);
          if (isNaN(eventDate.getTime())) return false;

          const now = new Date();
          const day = now.getDay();

          const daysUntilFriday = day <= 5 ? 5 - day : 6;

          const friday = new Date(now);
          friday.setDate(now.getDate() + daysUntilFriday);
          friday.setHours(0, 0, 0, 0);

          const sunday = new Date(friday);
          sunday.setDate(friday.getDate() + 2);
          sunday.setHours(23, 59, 59, 999);

          if(eventDate >= friday && eventDate <= sunday){
            return "This Weekend";
          }else{
            return "";
          }
        }

  return {
    venueId,
    eventCategoryId,
    title,
    slug: data.slug?.trim() || slugify(title),
    description: (data.description?.trim() || "").slice(0, 3000),
    organizerName: data.organizerName?.trim() || "",
    startUtc,
    endUtc,
    tag: tag(),
    status: Number(data.status ?? 0),
    visibility: Number(data.visibility ?? 0),
    bannerImageUrl: data.bannerImageUrl?.trim() || "",
    maxTicketsPerOrder: Number(data.maxTicketsPerOrder || 10),
    minTicketsPerOrder: Number(data.minTicketsPerOrder || 1),
    isFree: Boolean(data.isFree),
    isPublished: Boolean(data.isPublished),
    currency: data.currency?.trim() || "EUR",
  };
};

export const eventsService = {
  getAll: async (search = "") => {
    const response = await api.get(`${EVENTS_URL}?search=${search}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`${EVENTS_URL}/${id}`);
    return response.data;
  },

  create: async (data) => {
    const payload = normalizeEventPayload(data);
    const response = await api.post(EVENTS_URL, payload);
    return response.data;
  },

  update: async (id, data) => {
    const payload = normalizeEventPayload(data);
    await api.put(`${EVENTS_URL}/${id}`, payload);
  },

  delete: async (id) => {
    await api.delete(`${EVENTS_URL}/${id}`);
  },
};
