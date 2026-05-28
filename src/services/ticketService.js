import api from "../api/axios";
import { bookingService } from "./bookingService";
import { readJson } from "./buyerStorage";

const TICKET_URL = "/Ticket";

const normalizeTicket = (ticket) => ({
  ...ticket,
  qrCode: ticket.qrCode ?? ticket.qRCode ?? ticket.QRCode ?? "",
  status: Number(ticket.status ?? 0),
});

const mapLocalCheckInRecord = (record) =>
  normalizeTicket({
    id: record.ticketId || record.id,
    ticketCode: record.ticketCode,
    eventTitle: record.eventTitle,
    buyerEmail: record.buyerEmail,
    status: record.checkInTime && record.checkInTime !== "Not checked in" ? 1 : 0,
    issuedAt: record.createdAt,
    usedAt: record.checkInTime && record.checkInTime !== "Not checked in" ? record.checkInTime : null,
    notes: record.notes,
    source: "Local mirror",
  });

const getLocalCheckInTickets = () =>
  readJson("checkIns", [])
    .filter((record) => record?.ticketCode)
    .map(mapLocalCheckInRecord);

export const ticketService = {
  getAll: async () => {
    const bookings = await bookingService.getAll();
    const backendTickets = bookings.flatMap((booking) =>
      (booking.tickets ?? []).map((ticket) =>
        normalizeTicket({
          ...ticket,
          bookingId: booking.id,
          eventId: booking.eventId,
          eventTitle: booking.eventTitle,
          buyerEmail: booking.buyerEmail,
          referenceNumber: booking.referenceNumber,
          bookingStatus: booking.status,
          bookingDate: booking.bookingDate,
          totalAmount: booking.totalAmount,
        })
      )
    );
    const backendCodes = new Set(backendTickets.map((ticket) => ticket.ticketCode));
    const localTickets = getLocalCheckInTickets().filter(
      (ticket) => ticket.ticketCode && !backendCodes.has(ticket.ticketCode)
    );

    return [...backendTickets, ...localTickets];
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
