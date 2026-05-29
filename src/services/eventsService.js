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

export const normalizeEventsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.$values)) return data.$values;
  if (Array.isArray(data?.data?.$values)) return data.data.$values;
  return [];
};

const normalizeEventPayload = (data) => {
  const title = data.title?.trim();
  const venueId = data.venueId?.trim();
  const eventCategoryId = data.eventCategoryId?.trim();
  const startUtc = data.startUtc ? toUtcIso(data.startUtc) : "";
  const endUtc = data.endUtc ? toUtcIso(data.endUtc) : "";
  const status = Number(data.status || 1);
  const visibility = Number(data.visibility || 2);

  if (!venueId) return validationError("Select a venue.");
  if (!eventCategoryId) return validationError("Select a category.");
  if (!title) return validationError("Title is required.");
  if (!startUtc) return validationError("Start date is required.");
  if (!endUtc) return validationError("End date is required.");
  if (new Date(endUtc) <= new Date(startUtc)) {
    return validationError("End date must be after start date.");
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
    status,
    visibility,
    bannerImageUrl: data.bannerImageUrl?.trim() || "",
    maxTicketsPerOrder: Number(data.maxTicketsPerOrder || 10),
    minTicketsPerOrder: Number(data.minTicketsPerOrder || 1),
    isFree: Boolean(data.isFree),
    isPublished: status === 2 ? true : Boolean(data.isPublished),
    currency: data.currency?.trim() || "EUR",
  };
};

export const eventsService = {
  getAll: async (search = "") => {
    const cleanSearch = String(search || "").trim();
    const response = await api.get(EVENTS_URL, {
      params: {
        ...(cleanSearch ? { search: cleanSearch } : {}),
        _: Date.now(),
      },
    });
    return normalizeEventsResponse(response.data);
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
