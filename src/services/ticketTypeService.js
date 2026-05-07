import api from "../api/axios";

const fallbackTicketTypes = [
  {
    id: "37d5d940-2c7a-4ac1-8562-200000000001",
    name: "Early Bird",
    price: 20,
    quantityAvailable: 150,
    saleStartDate: "2026-04-01T00:00:00Z",
    saleEndDate: "2026-04-30T23:59:59Z"
  },
  {
    id: "37d5d940-2c7a-4ac1-8562-200000000002",
    name: "Regular",
    price: 35,
    quantityAvailable: 420,
    saleStartDate: "2026-05-01T00:00:00Z",
    saleEndDate: "2026-06-15T23:59:59Z"
  },
  {
    id: "37d5d940-2c7a-4ac1-8562-200000000003",
    name: "VIP",
    price: 75,
    quantityAvailable: 80,
    saleStartDate: "2026-05-01T00:00:00Z",
    saleEndDate: "2026-06-15T23:59:59Z"
  },
  {
    id: "37d5d940-2c7a-4ac1-8562-200000000004",
    name: "Backstage",
    price: 140,
    quantityAvailable: 20,
    saleStartDate: "2026-05-10T00:00:00Z",
    saleEndDate: "2026-06-10T23:59:59Z"
  }
];

export async function getTicketTypes(eventId) {
  if (!eventId) {
    return fallbackTicketTypes;
  }

  try {
    const response = await api.get(`/TicketType/event/${eventId}`);

    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }

    return fallbackTicketTypes;
  } catch (error) {
    console.warn("Using fallback ticket types because the API is not ready.", error);
    return fallbackTicketTypes;
  }
}
