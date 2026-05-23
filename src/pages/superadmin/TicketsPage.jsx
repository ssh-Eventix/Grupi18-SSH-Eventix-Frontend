import { useEffect, useState, useMemo } from "react";
import { eventsService } from "../../services/eventsService.js";
import { eventSectionsService } from "../../services/eventSectionsService.js";
import { ticketTypeService } from "../../services/ticketTypeService.js";
import DynamicForm from "../../components/DynamicForm.jsx";
import DynamicTable from "../../components/DynamicTable.jsx";
import { getTickets } from "../../services/ticketService.js";

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventSections, setEventSections] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    eventId: "",
    eventSectionId: "",
    name: "",
    price: "",
    quantityAvailable: "",
    saleStartDate: "",
    saleEndDate: "",
  });

  const selectedEventSections = useMemo(() => {
    return eventSections.filter((section) => section.eventId === form.eventId);
  }, [eventSections, form.eventId]);

  const handleEventChange = (eventId) => {
    setForm((prev) => ({
      ...prev,
      eventId,
      eventSectionId: "",
    }));

    ticketTypeService
      .getByEventId(eventId)
      .then(setTicketTypes)
      .catch((err) => setError(handleApiError(err)));
  };

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.eventId || !form.eventSectionId) {
      setError("Select event and event section.");
      return;
    }

    try {
      await ticketTypeService.create(form);

      const updated = await ticketTypeService.getByEventId(form.eventId);
      setTicketTypes(updated);

      setForm((prev) => ({
        ...prev,
        name: "",
        price: "",
        quantityAvailable: "",
        saleStartDate: "",
        saleEndDate: "",
      }));
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const columns = [
    { key: "ticketCode", label: "Ticket Code" },
    { key: "qrCode", label: "QR Code" }
  ];

  const fields = [
    {
      name: "ticketCode",
      label: "Ticket Code",
      type: "text",
      placeholder: "TCK-2001-A",
      required: true
    },
    {
      name: "qrCode",
      label: "QR Code",
      type: "text",
      placeholder: "QR-2001-A",
      required: true
    }
  ];

  useEffect(() => {
    async function loadData() {
      try {
       const [eventsData, sectionsData] = await Promise.all([
        eventsService.getAll(),
        eventSectionsService.getAll(),
      ]);

      setEvents(eventsData);
      setEventSections(sectionsData);
    } catch (err) {
      setError(handleApiError(err));
    }
  }

    loadData();
  }, []);

  const handleSubmit = (values) => {
    if (editingTicket) {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === editingTicket.id
            ? {
                ...ticket,
                ticketCode: values.ticketCode,
                qrCode: values.qrCode
              }
            : ticket
        )
      );
      setEditingTicket(null);
      return;
    }

    setTickets((prev) => [
      {
        id: crypto.randomUUID(),
        ticketCode: values.ticketCode,
        qrCode: values.qrCode
      },
      ...prev
    ]);
  };

  const handleDelete = (ticket) => {
    setTickets((prev) => prev.filter((item) => item.id !== ticket.id));
  };

  const fetchTickets = async (page, pageSize, search) => {
    const filtered = tickets.filter((ticket) =>
      [ticket.ticketCode, ticket.qrCode].join(" ").toLowerCase().includes(search.toLowerCase())
    );

    const start = (page - 1) * pageSize;

    return {
      data: filtered.slice(start, start + pageSize),
      totalPages: Math.ceil(filtered.length / pageSize) || 1
    };
  };

  return (
    <section className="page">
      <h1>Tickets</h1>
      <DynamicForm
        fields={fields}
        initialValues={editingTicket || {}}
        onSubmit={handleSubmit}
        submitText={editingTicket ? "Update ticket" : "Add ticket"}
      />

      {editingTicket && (
        <div className="page-actions">
          <button type="button" onClick={() => setEditingTicket(null)}>
            Cancel edit
          </button>
        </div>
      )}

      <DynamicTable
        columns={columns}
        fetchData={fetchTickets}
        pageSizeOptions={[5, 10, 20]}
        refreshKey={tickets.length + (editingTicket?.id || "")}
        actions={{
          onEdit: setEditingTicket,
          onDelete: handleDelete
        }}
      />
    </section>
  );
}
