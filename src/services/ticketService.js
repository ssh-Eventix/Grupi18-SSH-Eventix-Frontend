import api from "../api/axios";
import { bookingService } from "./bookingService";
import { readJson } from "./buyerStorage";

const TICKET_URL = "/Ticket";

const normalizeTicket = (ticket) => ({
  ...ticket,
  id: ticket.id ?? ticket.Id,
  ticketCode: ticket.ticketCode ?? ticket.TicketCode ?? "",
  qrCode: ticket.qrCode ?? ticket.qRCode ?? ticket.QRCode ?? "",
  status: Number(ticket.status ?? ticket.Status ?? 0),
  issuedAt: ticket.issuedAt ?? ticket.IssuedAt,
  usedAt: ticket.usedAt ?? ticket.UsedAt,
  bookingId: ticket.bookingId ?? ticket.BookingId,
  eventId: ticket.eventId ?? ticket.EventId,
  eventTitle: ticket.eventTitle ?? ticket.EventTitle,
  buyerEmail:
    ticket.buyerEmail ??
    ticket.BuyerEmail ??
    ticket.email ??
    ticket.Email ??
    ticket.emailedTo ??
    ticket.EmailedTo ??
    ticket.userEmail ??
    ticket.UserEmail ??
    ticket.booking?.buyerEmail ??
    ticket.Booking?.BuyerEmail ??
    "",
  referenceNumber: ticket.referenceNumber ?? ticket.ReferenceNumber,
  bookingStatus: ticket.bookingStatus ?? ticket.BookingStatus,
});

const mapLocalCheckInRecord = (record) =>
  normalizeTicket({
    id: record.ticketId || record.id,
    ticketCode: record.ticketCode,
    eventTitle: record.eventTitle,
    buyerEmail: record.buyerEmail || record.email || record.emailedTo,
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

const getTicketsFromBookings = async () => {
  const bookings = await bookingService.getAll();

  return bookings.flatMap((booking) =>
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
};

const mergeTicketDetails = (ticket, fallback) => ({
  ...ticket,
  buyerEmail: ticket.buyerEmail || fallback?.buyerEmail || "",
  eventTitle: ticket.eventTitle || fallback?.eventTitle,
  eventId: ticket.eventId || fallback?.eventId,
  bookingId: ticket.bookingId || fallback?.bookingId,
  referenceNumber: ticket.referenceNumber || fallback?.referenceNumber,
  bookingStatus: ticket.bookingStatus || fallback?.bookingStatus,
});

export const ticketService = {
  getAll: async () => {
    let backendTickets = [];
    const localTickets = getLocalCheckInTickets();

    try {
      const response = await api.get(TICKET_URL);
      backendTickets = (Array.isArray(response.data) ? response.data : response.data?.data ?? [])
        .map(normalizeTicket);

      if (backendTickets.some((ticket) => !ticket.buyerEmail)) {
        try {
          const bookingTickets = await getTicketsFromBookings();
          const fallbackByCode = new Map(
            [...bookingTickets, ...localTickets]
              .filter((ticket) => ticket.ticketCode)
              .map((ticket) => [ticket.ticketCode, ticket])
          );

          backendTickets = backendTickets.map((ticket) =>
            mergeTicketDetails(ticket, fallbackByCode.get(ticket.ticketCode))
          );
        } catch {
          const fallbackByCode = new Map(
            localTickets
              .filter((ticket) => ticket.ticketCode)
              .map((ticket) => [ticket.ticketCode, ticket])
          );

          backendTickets = backendTickets.map((ticket) =>
            mergeTicketDetails(ticket, fallbackByCode.get(ticket.ticketCode))
          );
        }
      }
    } catch {
      backendTickets = await getTicketsFromBookings();
    }

    const backendCodes = new Set(backendTickets.map((ticket) => ticket.ticketCode));
    const onlyLocalTickets = localTickets.filter(
      (ticket) => ticket.ticketCode && !backendCodes.has(ticket.ticketCode)
    );

    return [...backendTickets, ...onlyLocalTickets];
  },

  getById: async (id) => {
    const response = await api.get(`${TICKET_URL}/${id}`);
    return normalizeTicket(response.data);
  },

  getByCode: async (ticketCode) => {
    try {
      const response = await api.get(`${TICKET_URL}/code/${encodeURIComponent(ticketCode)}`);
      const ticket = normalizeTicket(response.data);

      if (ticket.buyerEmail) return ticket;

      try {
        const tickets = await getTicketsFromBookings();
        const fallback = tickets.find(
          (item) => item.ticketCode?.toLowerCase() === ticketCode.toLowerCase()
        );

        return mergeTicketDetails(ticket, fallback);
      } catch {
        const fallback = getLocalCheckInTickets().find(
          (item) => item.ticketCode?.toLowerCase() === ticketCode.toLowerCase()
        );

        return mergeTicketDetails(ticket, fallback);
      }
    } catch (error) {
      const tickets = await getTicketsFromBookings();
      const ticket = tickets.find(
        (item) => item.ticketCode?.toLowerCase() === ticketCode.toLowerCase()
      );

      if (ticket) return ticket;
      throw error;
    }
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
