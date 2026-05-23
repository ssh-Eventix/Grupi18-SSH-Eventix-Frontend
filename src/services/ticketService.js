import api from "../api/axios";
import { bookingService } from "./bookingService";

const TICKET_URL = "/Ticket";

const normalizeTicket = (ticket) => ({
  ...ticket,
  qrCode: ticket.qrCode ?? ticket.qRCode ?? ticket.QRCode ?? "",
});

export const ticketService = {
  getAll: async () => {
    const bookings = await bookingService.getAll();

    return bookings.flatMap((booking) =>
      (booking.tickets ?? []).map((ticket) =>
        normalizeTicket({
          ...ticket,
          bookingId: booking.id,
          referenceNumber: booking.referenceNumber,
          bookingStatus: booking.status,
        })
      )
    );
  },

  getById: async (id) => {
    const response = await api.get(`${TICKET_URL}/${id}`);
    return normalizeTicket(response.data);
  },

  getByCode: async (ticketCode) => {
    const response = await api.get(`${TICKET_URL}/code/${encodeURIComponent(ticketCode)}`);
    return normalizeTicket(response.data);
  },

  validate: async (ticketCode) => {
    const response = await api.post(`${TICKET_URL}/validate`, JSON.stringify(ticketCode));
    return response.data;
  },

  checkIn: async (ticketCode) => {
    const response = await api.post(`${TICKET_URL}/checkin`, JSON.stringify(ticketCode));
    return response.data;
  },
};

export const getTickets = () => ticketService.getAll();

export const getTicketById = (id) => ticketService.getById(id);

export const getTicketByCode = (ticketCode) => ticketService.getByCode(ticketCode);

export const validateTicket = (ticketCode) => ticketService.validate(ticketCode);

export const checkInTicket = (ticketCode) => ticketService.checkIn(ticketCode);

export default ticketService;
