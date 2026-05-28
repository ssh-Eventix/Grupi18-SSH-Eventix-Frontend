import api from "./api";

const normalizeLocalRecord = (record) => ({
  ...record,
  source: record.source === "Frontend demo" ? "Not synced" : record.source,
});

const readRecords = (key) =>
  JSON.parse(localStorage.getItem(key) || "[]").map(normalizeLocalRecord);
const writeRecords = (key, records) => localStorage.setItem(key, JSON.stringify(records));

const prependRecord = (key, record) => {
  const records = readRecords(key);
  writeRecords(key, [record, ...records.filter((item) => item.id !== record.id)]);
};

const normalizeBackendRecord = (record) => ({
  ...record,
  source: record.source || "Backend",
});

export const savePurchaseRecords = ({
  backendBooking,
  event,
  payment,
  quantity,
  ticket,
  ticketType,
  total,
  user,
}) => {
  const now = new Date().toISOString();
  const bookingId = backendBooking?.id || ticket.bookingId || `booking-${Date.now()}`;
  const referenceNumber = backendBooking?.referenceNumber || ticket.referenceNumber || `BK-${Date.now()}`;
  const amount = total === 0 ? 0 : total;

  const orderRecord = {
    id: bookingId,
    userId: user?.id || "local-buyer",
    eventId: event.backendId || event.id,
    eventTitle: event.title,
    buyerEmail: payment.email,
    status: backendBooking?.status || "Confirmed",
    referenceNumber,
    totalAmount: amount,
    quantity,
    ticketType: ticketType?.name || "General Admission",
    ticketCode: ticket.code,
    createdAt: now,
    source: backendBooking ? "Backend" : "Not synced",
  };

  const paymentRecord = {
    id: `payment-${Date.now()}`,
    bookingId,
    eventTitle: event.title,
    buyerEmail: payment.email,
    amount,
    paymentMethodId: "card",
    paymentMethod: "Card",
    transactionId: `TX-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    status: "Paid",
    createdAt: now,
  };

  const checkInRecord = {
    id: `checkin-${ticket.id}`,
    ticketId: ticket.id,
    ticketCode: ticket.code,
    eventTitle: event.title,
    buyerEmail: payment.email,
    checkedInByUserId: "",
    notes: "Ready for QR scan at entrance",
    checkInTime: "Not checked in",
    status: "Ready",
  };

  prependRecord("bookings", orderRecord);
  prependRecord("payments", paymentRecord);
  prependRecord("checkIns", checkInRecord);
};

export const mergedCrudService = (url, storageKey) => ({
  getAll: async () => {
    const localRecords = readRecords(storageKey);

    try {
      const response = await api.get(url);
      const backendRecords = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      const localIds = new Set(localRecords.map((item) => item.id));

      return [
        ...localRecords,
        ...backendRecords.filter((item) => !localIds.has(item.id)).map(normalizeBackendRecord),
      ];
    } catch {
      return localRecords;
    }
  },

  create: async (data) => {
    const record = { ...data, id: `${storageKey}-${Date.now()}` };
    prependRecord(storageKey, record);
    return record;
  },

  update: async (id, data) => {
    const records = readRecords(storageKey);
    writeRecords(storageKey, records.map((item) => item.id === id ? { ...item, ...data } : item));
    return data;
  },

  delete: async (id) => {
    writeRecords(storageKey, readRecords(storageKey).filter((item) => item.id !== id));
  },
});
