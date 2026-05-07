import { useEffect, useState } from "react";
import DynamicForm from "../../components/DynamicForm.jsx";
import DynamicTable from "../../components/DynamicTable.jsx";
import { getBookings } from "../../services/bookingService.js";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [editingBooking, setEditingBooking] = useState(null);

  const columns = [
    { key: "referenceNumber", label: "Reference Number" },
    { key: "totalAmountText", label: "Total Amount" },
    { key: "status", label: "Status" },
    { key: "ticketCount", label: "Tickets" }
  ];

  const fields = [
    {
      name: "referenceNumber",
      label: "Reference Number",
      type: "text",
      placeholder: "BK-2026-0016",
      required: true
    },
    {
      name: "totalAmount",
      label: "Total Amount",
      type: "number",
      placeholder: "120",
      required: true
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { id: "Confirmed", name: "Confirmed" },
        { id: "Pending", name: "Pending" },
        { id: "Cancelled", name: "Cancelled" },
        { id: "Refunded", name: "Refunded" }
      ]
    },
    {
      name: "ticketCount",
      label: "Tickets",
      type: "number",
      placeholder: "2",
      required: true
    }
  ];

  useEffect(() => {
    getBookings().then(setBookings);
  }, []);

  const createTickets = (count, referenceNumber) => {
    return Array.from({ length: Number(count || 0) }).map((_, index) => ({
      ticketCode: `${referenceNumber}-T${index + 1}`,
      qrCode: `QR-${referenceNumber}-T${index + 1}`
    }));
  };

  const handleSubmit = (values) => {
    if (editingBooking) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === editingBooking.id
            ? {
                ...booking,
                referenceNumber: values.referenceNumber,
                totalAmount: Number(values.totalAmount),
                status: values.status,
                tickets: createTickets(values.ticketCount, values.referenceNumber)
              }
            : booking
        )
      );
      setEditingBooking(null);
      return;
    }

    setBookings((prev) => [
      {
        id: crypto.randomUUID(),
        referenceNumber: values.referenceNumber,
        totalAmount: Number(values.totalAmount),
        status: values.status,
        tickets: createTickets(values.ticketCount, values.referenceNumber)
      },
      ...prev
    ]);
  };

  const handleEdit = (booking) => {
    setEditingBooking({
      ...booking,
      totalAmount: String(booking.totalAmount),
      ticketCount: String(booking.ticketCount)
    });
  };

  const handleDelete = (booking) => {
    setBookings((prev) => prev.filter((item) => item.id !== booking.id));
  };

  const fetchBookings = async (page, pageSize, search) => {
    const mappedBookings = bookings.map((booking) => ({
      ...booking,
      ticketCount: booking.tickets?.length || 0,
      totalAmountText: `${Number(booking.totalAmount || 0).toFixed(2)} EUR`
    }));

    const filtered = mappedBookings.filter((booking) =>
      [
        booking.referenceNumber,
        booking.totalAmount,
        booking.status,
        booking.ticketCount,
        ...(booking.tickets || []).map((ticket) => ticket.ticketCode)
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      totalPages: Math.ceil(filtered.length / pageSize) || 1
    };
  };

  return (
    <main className="page">
      <h1>Bookings</h1>
      <DynamicForm
        fields={fields}
        initialValues={editingBooking || {}}
        onSubmit={handleSubmit}
        submitText={editingBooking ? "Update booking" : "Add booking"}
      />

      {editingBooking && (
        <div className="page-actions">
          <button type="button" onClick={() => setEditingBooking(null)}>
            Cancel edit
          </button>
        </div>
      )}

      <DynamicTable
        columns={columns}
        fetchData={fetchBookings}
        pageSizeOptions={[5, 10, 20]}
        refreshKey={bookings.length + (editingBooking?.id || "")}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </main>
  );
}
