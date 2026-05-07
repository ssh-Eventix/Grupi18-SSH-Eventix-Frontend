const fallbackTickets = [
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000001",
    ticketCode: "TCK-1001-A",
    qrCode: "QR-1001-A"
  },
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000002",
    ticketCode: "TCK-1001-B",
    qrCode: "QR-1001-B"
  },
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000003",
    ticketCode: "TCK-1002-A",
    qrCode: "QR-1002-A"
  },
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000004",
    ticketCode: "TCK-1002-B",
    qrCode: "QR-1002-B"
  },
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000005",
    ticketCode: "TCK-1010-A",
    qrCode: "QR-1010-A"
  },
  {
    id: "4f4a51b1-7b8d-4f5a-9a10-100000000006",
    ticketCode: "TCK-1015-H",
    qrCode: "QR-1015-H"
  }
];

export async function getTickets() {
  return fallbackTickets;
}
