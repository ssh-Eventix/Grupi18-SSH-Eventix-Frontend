import api from "../api/axios";

const fallbackBookings = [
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0001",
    referenceNumber: "BK-2026-0001",
    totalAmount: 40,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000001", ticketCode: "TCK-1001-A", qrCode: "QR-1001-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000002", ticketCode: "TCK-1001-B", qrCode: "QR-1001-B" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0002",
    referenceNumber: "BK-2026-0002",
    totalAmount: 120,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000003", ticketCode: "TCK-1002-A", qrCode: "QR-1002-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000004", ticketCode: "TCK-1002-B", qrCode: "QR-1002-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000005", ticketCode: "TCK-1002-C", qrCode: "QR-1002-C" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000006", ticketCode: "TCK-1002-D", qrCode: "QR-1002-D" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0003",
    referenceNumber: "BK-2026-0003",
    totalAmount: 15,
    status: "Confirmed",
    tickets: [{ id: "5f4a51b1-7b8d-4f5a-9a10-000000000007", ticketCode: "TCK-1003-A", qrCode: "QR-1003-A" }]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0004",
    referenceNumber: "BK-2026-0004",
    totalAmount: 75,
    status: "Cancelled",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000008", ticketCode: "TCK-1004-A", qrCode: "QR-1004-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000009", ticketCode: "TCK-1004-B", qrCode: "QR-1004-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000010", ticketCode: "TCK-1004-C", qrCode: "QR-1004-C" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0005",
    referenceNumber: "BK-2026-0005",
    totalAmount: 25,
    status: "Confirmed",
    tickets: [{ id: "5f4a51b1-7b8d-4f5a-9a10-000000000011", ticketCode: "TCK-1005-A", qrCode: "QR-1005-A" }]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0006",
    referenceNumber: "BK-2026-0006",
    totalAmount: 180,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000012", ticketCode: "TCK-1006-A", qrCode: "QR-1006-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000013", ticketCode: "TCK-1006-B", qrCode: "QR-1006-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000014", ticketCode: "TCK-1006-C", qrCode: "QR-1006-C" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000015", ticketCode: "TCK-1006-D", qrCode: "QR-1006-D" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000016", ticketCode: "TCK-1006-E", qrCode: "QR-1006-E" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000017", ticketCode: "TCK-1006-F", qrCode: "QR-1006-F" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0007",
    referenceNumber: "BK-2026-0007",
    totalAmount: 60,
    status: "Pending",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000018", ticketCode: "TCK-1007-A", qrCode: "QR-1007-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000019", ticketCode: "TCK-1007-B", qrCode: "QR-1007-B" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0008",
    referenceNumber: "BK-2026-0008",
    totalAmount: 95,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000020", ticketCode: "TCK-1008-A", qrCode: "QR-1008-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000021", ticketCode: "TCK-1008-B", qrCode: "QR-1008-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000022", ticketCode: "TCK-1008-C", qrCode: "QR-1008-C" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0009",
    referenceNumber: "BK-2026-0009",
    totalAmount: 30,
    status: "Refunded",
    tickets: [{ id: "5f4a51b1-7b8d-4f5a-9a10-000000000023", ticketCode: "TCK-1009-A", qrCode: "QR-1009-A" }]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0010",
    referenceNumber: "BK-2026-0010",
    totalAmount: 210,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000024", ticketCode: "TCK-1010-A", qrCode: "QR-1010-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000025", ticketCode: "TCK-1010-B", qrCode: "QR-1010-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000026", ticketCode: "TCK-1010-C", qrCode: "QR-1010-C" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000027", ticketCode: "TCK-1010-D", qrCode: "QR-1010-D" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000028", ticketCode: "TCK-1010-E", qrCode: "QR-1010-E" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0011",
    referenceNumber: "BK-2026-0011",
    totalAmount: 45,
    status: "Pending",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000029", ticketCode: "TCK-1011-A", qrCode: "QR-1011-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000030", ticketCode: "TCK-1011-B", qrCode: "QR-1011-B" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0012",
    referenceNumber: "BK-2026-0012",
    totalAmount: 150,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000031", ticketCode: "TCK-1012-A", qrCode: "QR-1012-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000032", ticketCode: "TCK-1012-B", qrCode: "QR-1012-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000033", ticketCode: "TCK-1012-C", qrCode: "QR-1012-C" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000034", ticketCode: "TCK-1012-D", qrCode: "QR-1012-D" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0013",
    referenceNumber: "BK-2026-0013",
    totalAmount: 20,
    status: "Cancelled",
    tickets: [{ id: "5f4a51b1-7b8d-4f5a-9a10-000000000035", ticketCode: "TCK-1013-A", qrCode: "QR-1013-A" }]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0014",
    referenceNumber: "BK-2026-0014",
    totalAmount: 85,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000036", ticketCode: "TCK-1014-A", qrCode: "QR-1014-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000037", ticketCode: "TCK-1014-B", qrCode: "QR-1014-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000038", ticketCode: "TCK-1014-C", qrCode: "QR-1014-C" }
    ]
  },
  {
    id: "8e98a51b-4f4a-4a82-8d3c-7d8a8f5a0015",
    referenceNumber: "BK-2026-0015",
    totalAmount: 300,
    status: "Confirmed",
    tickets: [
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000039", ticketCode: "TCK-1015-A", qrCode: "QR-1015-A" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000040", ticketCode: "TCK-1015-B", qrCode: "QR-1015-B" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000041", ticketCode: "TCK-1015-C", qrCode: "QR-1015-C" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000042", ticketCode: "TCK-1015-D", qrCode: "QR-1015-D" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000043", ticketCode: "TCK-1015-E", qrCode: "QR-1015-E" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000044", ticketCode: "TCK-1015-F", qrCode: "QR-1015-F" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000045", ticketCode: "TCK-1015-G", qrCode: "QR-1015-G" },
      { id: "5f4a51b1-7b8d-4f5a-9a10-000000000046", ticketCode: "TCK-1015-H", qrCode: "QR-1015-H" }
    ]
  }
];

export async function getBookings() {
  try {
    const response = await api.get("/Booking");

    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }

    return fallbackBookings;
  } catch (error) {
    console.warn("Using fallback bookings because the API is not ready.", error);
    return fallbackBookings;
  }
}

export async function createBooking({ userId, eventId, ticketTypeId, quantity }) {
  const response = await api.post("/Booking", {
    userId,
    eventId,
    bookingItems: [
      {
        ticketTypeId,
        quantity,
      },
    ],
  });

  return response.data;
}

