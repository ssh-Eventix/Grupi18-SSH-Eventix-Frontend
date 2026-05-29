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
  const events =
    Array.isArray(data) ? data :
    Array.isArray(data?.data) ? data.data :
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.$values) ? data.$values :
    Array.isArray(data?.data?.$values) ? data.data.$values :
    [];

  return events.map(normalizeEvent);
};

export const normalizeEvent = (event) => {
  if (!event) return event;

  return {
    ...event,
    id: event.id ?? event.Id,
    venueId: event.venueId ?? event.VenueId,
    venueName: event.venueName ?? event.VenueName,
    eventCategoryId: event.eventCategoryId ?? event.EventCategoryId,
    eventCategoryName: event.eventCategoryName ?? event.EventCategoryName,
    title: event.title ?? event.Title ?? "",
    slug: event.slug ?? event.Slug ?? "",
    description: event.description ?? event.Description ?? "",
    organizerName: event.organizerName ?? event.OrganizerName ?? "",
    startUtc: event.startUtc ?? event.StartUtc,
    endUtc: event.endUtc ?? event.EndUtc,
    status: Number(event.status ?? event.Status ?? 1),
    visibility: Number(event.visibility ?? event.Visibility ?? 2),
    bannerImageUrl: event.bannerImageUrl ?? event.BannerImageUrl ?? "",
    maxTicketsPerOrder: event.maxTicketsPerOrder ?? event.MaxTicketsPerOrder ?? 10,
    minTicketsPerOrder: event.minTicketsPerOrder ?? event.MinTicketsPerOrder ?? 1,
    isFree: Boolean(event.isFree ?? event.IsFree),
    isPublished: Boolean(event.isPublished ?? event.IsPublished),
    currency: event.currency ?? event.Currency ?? "EUR",
    createdAtUtc: event.createdAtUtc ?? event.CreatedAtUtc,
    updatedAtUtc: event.updatedAtUtc ?? event.UpdatedAtUtc,
  };
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
    return normalizeEvent(response.data);
  },

  create: async (data) => {
    const payload = normalizeEventPayload(data);
    const response = await api.post(EVENTS_URL, payload);
    return normalizeEvent(response.data);
  },

  update: async (id, data) => {
    const payload = normalizeEventPayload(data);
    await api.put(`${EVENTS_URL}/${id}`, payload);
  },

  delete: async (id) => {
    await api.delete(`${EVENTS_URL}/${id}`);
  },
};
