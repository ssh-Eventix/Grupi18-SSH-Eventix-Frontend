import api from "../api/axios";
import { getTicketInventoryAdjustment } from "./buyerStorage";

const TICKET_TYPE_URL = "/TicketType";
const EVENTS_URL = "/Events";

const normalizeTicketType = (ticketType, eventId) => {
  const rawAvailable = Number(ticketType.quantityAvailable ?? 0);
  const adjustment = getTicketInventoryAdjustment(ticketType.id);
  const shouldApplyLocalPurchase =
    Number(adjustment.purchased || 0) > 0 &&
    (adjustment.lastKnownAvailable === null || rawAvailable >= Number(adjustment.lastKnownAvailable));
  const localPurchased = shouldApplyLocalPurchase ? Number(adjustment.purchased || 0) : 0;

  return {
    ...ticketType,
    eventId: ticketType.eventId ?? eventId,
    eventSectionId: ticketType.eventSectionId ?? "",
    price: Number(ticketType.price ?? 0),
    quantityAvailable: Math.max(0, rawAvailable - localPurchased),
    soldQuantity: Number(ticketType.soldQuantity ?? 0) + localPurchased,
  };
};

const toUtcIso = (value) => {
  if (!value) return value;
  return new Date(value).toISOString();
};

const mapCreateTicketTypeRequest = (data) => ({
  eventId: data.eventId,
  eventSectionId: data.eventSectionId,
  name: data.name?.trim(),
  price: Number(data.price),
  quantityAvailable: Number(data.quantityAvailable),
  saleStartDate: toUtcIso(data.saleStartDate),
  saleEndDate: toUtcIso(data.saleEndDate),
});

const getEventId = (event) => event.backendId ?? event.id;

export const ticketTypeService = {
  getByEventId: async (eventId) => {
    const response = await api.get(`${TICKET_TYPE_URL}/event/${eventId}`);
    return response.data.map((ticketType) => normalizeTicketType(ticketType, eventId));
  },

  getAvailableByEventId: async (eventId) => {
    const response = await api.get(`${TICKET_TYPE_URL}/event/${eventId}/available`);
    return response.data.map((ticketType) => normalizeTicketType(ticketType, eventId));
  },

  getById: async (id) => {
    const response = await api.get(`${TICKET_TYPE_URL}/${id}`);
    return normalizeTicketType(response.data);
  },

  getAll: async () => {
    const eventsResponse = await api.get(EVENTS_URL);
    const events = Array.isArray(eventsResponse.data) ? eventsResponse.data : eventsResponse.data?.data ?? [];

    const results = await Promise.allSettled(
      events
        .map(getEventId)
        .filter(Boolean)
        .map((eventId) => ticketTypeService.getByEventId(eventId))
    );

    return results
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);
  },

  create: async (data) => {
    const response = await api.post(TICKET_TYPE_URL, mapCreateTicketTypeRequest(data));
    return normalizeTicketType(response.data, data.eventId);
  },
};

export const getTicketTypes = (eventId) =>
  eventId ? ticketTypeService.getByEventId(eventId) : ticketTypeService.getAll();

export const getAvailableTicketTypes = (eventId) => ticketTypeService.getAvailableByEventId(eventId);

export const getTicketTypeById = (id) => ticketTypeService.getById(id);

export const createTicketType = (data) => ticketTypeService.create(data);

export default ticketTypeService;
