import api from "../api/axios";
import { bookingItemService } from "./bookingItemsService";

const BOOKING_URL = "/Booking";

const normalizeTicket = (ticket) => ({
  ...ticket,
  qrCode: ticket.qrCode ?? ticket.qRCode ?? ticket.QRCode ?? "",
});

const normalizeBooking = (booking) => {
  const tickets = Array.isArray(booking?.tickets) ? booking.tickets.map(normalizeTicket) : [];

  return {
    ...booking,
    tickets,
    ticketCount: tickets.length,
    quantity: booking.quantity ?? tickets.length,
    ticketCode: booking.ticketCode ?? tickets[0]?.ticketCode ?? "",
    source: "Backend",
  };
};

const mapCreateBookingRequest = (data) => ({
  userId: data.userId,
  eventId: data.eventId,
  bookingItems: bookingItemService.toRequestList(
    data.bookingItems ??
      data.items ?? [
        {
          ticketTypeId: data.ticketTypeId,
          quantity: data.quantity,
        },
      ]
  ),
});

export const bookingService = {
  getAll: async () => {
    const response = await api.get(BOOKING_URL);
    return response.data.map(normalizeBooking);
  },

  getById: async (id) => {
    const response = await api.get(`${BOOKING_URL}/${id}`);
    return normalizeBooking(response.data);
  },

  getByUserId: async (userId) => {
    const response = await api.get(`${BOOKING_URL}/user/${userId}`);
    return response.data.map(normalizeBooking);
  },

  create: async (data) => {
    const response = await api.post(BOOKING_URL, mapCreateBookingRequest(data), {
      headers: data.tenantSlug ? { "X-Tenant-Slug": data.tenantSlug } : undefined,
    });
    return normalizeBooking(response.data);
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`${BOOKING_URL}/${id}/status`, {
      status: typeof status === "string" ? status : status?.status,
    });

    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`${BOOKING_URL}/${id}`);
    return response.data;
  },
};

export const getBookings = () => bookingService.getAll();

export const getBookingById = (id) => bookingService.getById(id);

export const getBookingsByUserId = (userId) => bookingService.getByUserId(userId);

export const createBooking = (data) => bookingService.create(data);

export const updateBookingStatus = (id, status) => bookingService.updateStatus(id, status);

export const deleteBooking = (id) => bookingService.delete(id);

export default bookingService;
