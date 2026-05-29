import { useCallback, useEffect, useMemo, useState } from "react";
import DynamicTable from "../../components/DynamicTable.jsx";
import EntityCrudPage from "../../components/crud/EntityCrudPage";
import api from "../../services/api";
import bookingService from "../../services/bookingService";
import { createCrudService } from "../../services/crudService";
import { aiService } from "../../services/aiService";
import { eventsService } from "../../services/eventsService";
import { eventSectionsService } from "../../services/eventSectionsService";
import { reviewsService } from "../../services/reviewsService";
import { ticketService } from "../../services/ticketService";
import { ticketTypeService } from "../../services/ticketTypeService";
import { usersService } from "../../services/usersService";
import { handleApiError } from "../../utils/apiErrorHandler";
import "./Tenant.css";

const uuid = "00000000-0000-0000-0000-000000000000";

const text = (name, label = name) => ({ name, label });
const date = (name, label = name) => ({ name, label, type: "datetime-local" });
const number = (name, label = name) => ({ name, label, type: "number" });
const checkbox = (name, label = name) => ({ name, label, type: "checkbox" });
const area = (name, label = name) => ({ name, label, type: "textarea" });
const select = (name, label, options) => ({
  name,
  label,
  type: "select",
  options,
});

const readonlyEmptyService = {
  getAll: async () => [],
  create: async () => null,
  update: async () => null,
  delete: async () => null,
};

const auditLogsService = {
  getAll: async () => {
    const response = await api.get("/AuditLog");
    return (
      response.data?.items ?? response.data?.Items ?? response.data?.data ?? []
    );
  },
  create: async () => null,
  update: async () => null,
  delete: async () => null,
};

const ordersService = {
  getAll: () => bookingService.getAll(),
  create: async () => null,
  update: async () => null,
  delete: async () => null,
};

export function TicketTypesPage() {
  const [events, setEvents] = useState([]);
  const [eventSections, setEventSections] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    return eventSections.filter(
      (section) => String(section.eventId) === String(form.eventId),
    );
  }, [eventSections, form.eventId]);

  const sectionsById = useMemo(() => {
    return eventSections.reduce((map, section) => {
      map[String(section.id)] = section;
      return map;
    }, {});
  }, [eventSections]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");
      setMessage("");

      try {
        const eventsData = await eventsService.getAll();

        const nextEvents = Array.isArray(eventsData)
          ? eventsData
          : (eventsData?.data ?? []);

        setEvents(nextEvents);

        if (nextEvents.length > 0) {
          const firstEventId = nextEvents[0].id;

          setForm((prev) => ({
            ...prev,
            eventId: prev.eventId || firstEventId,
          }));

          try {
            const sectionsData =
              await eventSectionsService.getByEventId(firstEventId);

            setEventSections(
              Array.isArray(sectionsData)
                ? sectionsData
                : (sectionsData?.data ?? []),
            );
          } catch {
            setEventSections([]);
          }

          try {
            const ticketTypesData =
              await ticketTypeService.getByEventId(firstEventId);

            setTicketTypes(
              Array.isArray(ticketTypesData)
                ? ticketTypesData
                : (ticketTypesData?.data ?? []),
            );
          } catch {
            setTicketTypes([]);
          }
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setMessage("");
  };

  const handleEventChange = async (eventId) => {
    setForm((prev) => ({
      ...prev,
      eventId,
      eventSectionId: "",
    }));

    setError("");
    setMessage("");

    if (!eventId) {
      setTicketTypes([]);
      setEventSections([]);
      return;
    }

    try {
      const [sectionsData, ticketTypesData] = await Promise.all([
        eventSectionsService.getByEventId(eventId),
        ticketTypeService.getByEventId(eventId),
      ]);

      const nextSections = Array.isArray(sectionsData)
        ? sectionsData
        : (sectionsData?.data ?? []);

      const nextTicketTypes = Array.isArray(ticketTypesData)
        ? ticketTypesData
        : (ticketTypesData?.data ?? []);

      setEventSections(nextSections);
      setTicketTypes(nextTicketTypes);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.eventId || !form.eventSectionId) {
      setError("Select event and event section.");
      return;
    }

    const normalizedName = form.name.trim().toLowerCase();

    if (!normalizedName) {
      setError("Ticket type name is required.");
      return;
    }

    const duplicateName = ticketTypes.some(
      (type) => type.name?.trim().toLowerCase() === normalizedName,
    );

    if (duplicateName) {
      setError(
        "A ticket type with this name already exists for the selected event.",
      );
      return;
    }

    if (Number(form.price) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    if (Number(form.quantityAvailable) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (new Date(form.saleEndDate) <= new Date(form.saleStartDate)) {
      setError("Sale end must be after sale start.");
      return;
    }

    setSaving(true);

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
      setMessage("Ticket type was created.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleString() : "";
  };

  const getSaleStatus = (type) => {
    const now = new Date();
    const start = new Date(type.saleStartDate);
    const end = new Date(type.saleEndDate);

    if (now < start) return "Scheduled";
    if (now > end) return "Closed";
    if (type.quantityAvailable <= 0) return "Sold out";
    return "Active";
  };

  const getSectionLabel = (ticketType) => {
    const section = sectionsById[String(ticketType.eventSectionId)];
    if (!section) return ticketType.eventSectionId || "";
    return section.code ? `${section.name} (${section.code})` : section.name;
  };

  const ticketTypeRows = useMemo(() => {
    return ticketTypes.map((type) => ({
      ...type,
      sectionLabel: getSectionLabel(type),
      priceText: `${Number(type.price || 0).toFixed(2)} EUR`,
      ticketsLeft: Number(type.ticketsLeft ?? type.quantityAvailable ?? 0),
      totalStock: Number(type.totalStock ?? 0),
      stockText: `${Number(type.ticketsLeft ?? type.quantityAvailable ?? 0)} left / ${Number(type.totalStock ?? 0)} total`,
      statusText: getSaleStatus(type),
      saleStartText: formatDate(type.saleStartDate),
      saleEndText: formatDate(type.saleEndDate),
    }));
  }, [ticketTypes, sectionsById]);

  const fetchTicketTypes = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = ticketTypeRows.filter((type) =>
        [
          type.sectionLabel,
          type.name,
          type.priceText,
          type.ticketsLeft,
          type.soldQuantity,
          type.totalStock,
          type.stockText,
          type.statusText,
          type.saleStartText,
          type.saleEndText,
        ]
          .filter((value) => value !== undefined && value !== null)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [ticketTypeRows],
  );

  const ticketTypeColumns = [
    { key: "sectionLabel", label: "Section" },
    { key: "name", label: "Name" },
    { key: "priceText", label: "Price" },
    { key: "ticketsLeft", label: "Tickets Left" },
    { key: "soldQuantity", label: "Sold" },
    { key: "totalStock", label: "Total Stock" },
    { key: "statusText", label: "Status" },
    { key: "saleStartText", label: "Sale Start" },
    { key: "saleEndText", label: "Sale End" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Ticket Types</h1>
          <p>Manage pricing, stock, and sale windows by event section.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {message && <div className="form-alert success">{message}</div>}

      <form className="dynamic-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label>Event</label>
          <select
            value={form.eventId}
            disabled={saving}
            onChange={(event) => handleEventChange(event.target.value)}
            required
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title || event.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Event Section</label>
          <div className="form-field full">
            <label>Choose venue part for this ticket type</label>

            <div className="event-section-picker">
              {selectedEventSections.length === 0 && (
                <p className="status-text">
                  No event sections found for this event. First create Event
                  Sections for this event.
                </p>
              )}
              {selectedEventSections.map((section) => {
                const selected =
                  String(form.eventSectionId) === String(section.id);

                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`event-section-card ${selected ? "selected" : ""}`}
                    disabled={saving}
                    onClick={() => updateField("eventSectionId", section.id)}
                  >
                    <strong>{section.name}</strong>
                    <span>{section.code}</span>
                    <small>Capacity: {section.capacity}</small>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="form-field">
          <label>Name</label>
          <input
            value={form.name}
            disabled={saving}
            placeholder="VIP"
            onChange={(event) => updateField("name", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Price</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            disabled={saving}
            placeholder="75"
            onChange={(event) => updateField("price", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Quantity Available</label>
          <input
            type="number"
            min="0"
            value={form.quantityAvailable}
            disabled={saving}
            placeholder="100"
            onChange={(event) =>
              updateField("quantityAvailable", event.target.value)
            }
            required
          />
        </div>

        <div className="form-field">
          <label>Sale Start</label>
          <input
            type="datetime-local"
            value={form.saleStartDate}
            disabled={saving}
            onChange={(event) =>
              updateField("saleStartDate", event.target.value)
            }
            required
          />
        </div>

        <div className="form-field">
          <label>Sale End</label>
          <input
            type="datetime-local"
            value={form.saleEndDate}
            disabled={saving}
            onChange={(event) => updateField("saleEndDate", event.target.value)}
            required
          />
        </div>

        <button className="primary-button" type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Ticket Type"}
        </button>
      </form>

      {loading ? (
        <div className="table-panel">
          <p>Loading...</p>
        </div>
      ) : (
        <DynamicTable
          columns={ticketTypeColumns}
          fetchData={fetchTicketTypes}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </section>
  );
}

export function BookingsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const columns = [
    { key: "referenceNumber", label: "Reference" },
    { key: "eventTitle", label: "Event" },
    { key: "buyerEmail", label: "Buyer Email" },
    { key: "status", label: "Status" },
    { key: "totalText", label: "Total" },
    { key: "quantity", label: "Qty" },
    { key: "ticketCodes", label: "Ticket Codes" },
    { key: "bookingDateText", label: "Booked At" },
  ];

  const fetchOrders = useCallback(async (page, pageSize, search) => {
    setError("");

    try {
      const result = await ordersService.getAll();
      const rows = (Array.isArray(result) ? result : (result?.data ?? []))
        .map((order) => ({
          ...order,
          buyerEmail:
            order.buyerEmail ||
            order.email ||
            order.emailedTo ||
            order.userEmail ||
            order.userId ||
            "-",
          ticketCodes:
            order.tickets
              ?.map((ticket) => ticket.ticketCode)
              .filter(Boolean)
              .join(", ") ||
            order.ticketCode ||
            "",
          totalText: `EUR ${Number(order.totalAmount || 0).toFixed(2)}`,
          bookingDateText: order.bookingDate
            ? new Date(order.bookingDate).toLocaleString()
            : "",
        }))
        .sort(
          (a, b) => new Date(b.bookingDate || 0) - new Date(a.bookingDate || 0),
        );
      const term = search.trim().toLowerCase();
      const filtered = rows.filter((order) =>
        [
          order.referenceNumber,
          order.eventTitle,
          order.buyerEmail,
          order.status,
          order.totalText,
          order.quantity,
          order.ticketCodes,
          order.bookingDateText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    } catch (err) {
      setError(handleApiError(err));
      return { data: [], totalPages: 1 };
    }
  }, []);

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Orders</h1>
          <p>Bookings created from buyer checkout.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}

      <DynamicTable
        columns={columns}
        fetchData={fetchOrders}
        defaultPageSize={5}
        pageSizeOptions={[5, 10, 20, 50]}
        refreshKey={refreshKey}
      />
    </section>
  );
}

export function PaymentsPage() {
  return (
    <EntityCrudPage
      title="Payments"
      description="Payments created from buyer checkout."
      api={createCrudService("/Payment")}
      initialForm={{
        bookingId: uuid,
        amount: 0,
        paymentMethodId: uuid,
        transactionId: "",
        status: 0,
      }}
      fields={[
        text("bookingId", "Booking ID"),
        text("eventTitle", "Event"),
        text("buyerEmail", "Buyer Email"),
        number("amount", "Amount"),
        text("paymentMethod", "Method"),
        text("transactionId", "Transaction ID"),
        text("status", "Status"),
        text("createdAt", "Created"),
      ]}
    />
  );
}

export function PaymentMethodsPage() {
  return (
    <EntityCrudPage
      title="Payment Methods"
      description="Payment method settings from backend."
      api={createCrudService("/PaymentMethod")}
      initialForm={{
        name: "",
        provider: 1,
        description: "",
        isActive: true,
      }}
      fields={[
        text("name", "Name"),
        select("provider", "Provider", [
          { value: 1, label: "Stripe" },
          { value: 2, label: "PayPal" },
          { value: 3, label: "Bank Transfer" },
          { value: 4, label: "Cash" },
          { value: 5, label: "Credit Card" },
          { value: 6, label: "Apple Pay" },
          { value: 7, label: "Google Pay" },
        ]),
        area("description", "Description"),
        checkbox("isActive", "Active"),
      ]}
    />
  );
}

export function CouponsPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    eventsService
      .getAll()
      .then((data) =>
        setEvents(Array.isArray(data) ? data : (data?.data ?? [])),
      )
      .catch(() => setEvents([]));
  }, []);

  const couponApi = useMemo(
    () =>
      createCrudService("/DiscountCoupon", {
        mapCreate: (data) => ({
          eventId: data.eventId,
          code: data.code?.trim().toUpperCase(),
          type: Number(data.type),
          discountValue: Number(data.discountValue),
          validFrom: data.validFrom
            ? new Date(data.validFrom).toISOString()
            : null,
          validTo: data.validTo ? new Date(data.validTo).toISOString() : null,
          usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
        }),
        mapUpdate: (data) => ({
          eventId: data.eventId,
          code: data.code?.trim().toUpperCase(),
          type: Number(data.type),
          discountValue: Number(data.discountValue),
          validFrom: data.validFrom
            ? new Date(data.validFrom).toISOString()
            : null,
          validTo: data.validTo ? new Date(data.validTo).toISOString() : null,
          usageLimit: data.usageLimit === "" ? null : Number(data.usageLimit),
        }),
      }),
    [],
  );

  const eventOptions = useMemo(
    () => [
      { value: "", label: "Select event" },
      ...events.map((event) => ({
        value: event.id,
        label: event.title || event.name || event.id,
      })),
    ],
    [events],
  );

  return (
    <EntityCrudPage
      title="Discount Coupons"
      description="Create promo codes and discount rules for events."
      api={couponApi}
      initialForm={{
        eventId: "",
        code: "",
        type: 1,
        discountValue: 0,
        validFrom: "",
        validTo: "",
        usageLimit: "",
      }}
      fields={[
        select("eventId", "Event", eventOptions),
        text("code", "Code"),
        select("type", "Discount Type", [
          { value: 1, label: "Percentage" },
          { value: 2, label: "Fixed Amount" },
        ]),
        number("discountValue", "Value"),
        date("validFrom", "Valid From"),
        date("validTo", "Valid To"),
        number("usageLimit", "Usage Limit"),
      ]}
      tableFields={[
        {
          name: "eventId",
          label: "Event",
          render: (item) =>
            events.find((event) => String(event.id) === String(item.eventId))
              ?.title ||
            events.find((event) => String(event.id) === String(item.eventId))
              ?.name ||
            item.eventId,
        },
        text("code", "Code"),
        {
          name: "type",
          label: "Type",
          render: (item) =>
            Number(item.type) === 2 ? "Fixed Amount" : "Percentage",
        },
        number("discountValue", "Value"),
        {
          name: "validFrom",
          label: "Valid From",
          render: (item) =>
            item.validFrom ? new Date(item.validFrom).toLocaleString() : "",
        },
        {
          name: "validTo",
          label: "Valid To",
          render: (item) =>
            item.validTo ? new Date(item.validTo).toLocaleString() : "",
        },
        number("usageLimit", "Usage Limit"),
        number("usageCount", "Used"),
      ]}
    />
  );
}

export function EventSessionsPage() {
  return (
    <EntityCrudPage
      title="Event Sessions"
      description="Agenda blocks, workshops, talks, and multi-day event sessions."
      api={createCrudService("/EventSession")}
      initialForm={{
        eventId: uuid,
        speakerId: uuid,
        title: "",
        description: "",
        startTime: "",
        endTime: "",
      }}
      fields={[
        text("eventId", "Event ID"),
        text("speakerId", "Speaker ID"),
        text("title", "Title"),
        area("description", "Description"),
        date("startTime", "Start"),
        date("endTime", "End"),
      ]}
    />
  );
}

export function SpeakersPage() {
  return (
    <EntityCrudPage
      title="Speakers"
      description="Speaker profiles for conferences, panels, and sessions."
      api={createCrudService("/Speakers")}
      initialForm={{
        fullName: "",
        bio: "",
        email: "",
        phone: "",
        profileImageUrl: "",
      }}
      fields={[
        text("fullName", "Full Name"),
        area("bio", "Bio"),
        text("email", "Email"),
        text("phone", "Phone"),
        text("profileImageUrl", "Image URL"),
      ]}
    />
  );
}

export function CheckInsPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticket, setTicket] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const statusLabels = {
    0: "Ready",
    1: "Checked in",
    2: "Cancelled",
    3: "Refunded",
  };

  const cleanTicketCode = () => ticketCode.trim();

  const mergeTicketIntoList = (updatedTicket) => {
    if (!updatedTicket?.ticketCode) return;

    setTickets((prev) => {
      const exists = prev.some(
        (item) => item.ticketCode === updatedTicket.ticketCode,
      );

      if (!exists) {
        return [updatedTicket, ...prev];
      }

      return prev.map((item) =>
        item.ticketCode === updatedTicket.ticketCode
          ? {
              ...item,
              ...updatedTicket,
              eventTitle: updatedTicket.eventTitle ?? item.eventTitle,
              buyerEmail: updatedTicket.buyerEmail ?? item.buyerEmail,
              referenceNumber:
                updatedTicket.referenceNumber ?? item.referenceNumber,
              bookingId: updatedTicket.bookingId ?? item.bookingId,
            }
          : item,
      );
    });
  };

  const loadTickets = async () => {
    setLoadingTickets(true);
    setError("");

    try {
      const result = await ticketService.getAll();
      setTickets(result);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTicket = async (code = cleanTicketCode()) => {
    if (!code) {
      setError("Enter a ticket code.");
      return null;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await ticketService.getByCode(code);
      setTicket(result);
      mergeTicketIntoList(result);
      return result;
    } catch (err) {
      setTicket(null);
      setError(handleApiError(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (event) => {
    event.preventDefault();
    await loadTicket();
  };

  const handleCheckIn = async () => {
    const code = cleanTicketCode();

    if (!code) {
      setError("Enter a ticket code.");
      return;
    }

    setCheckingIn(true);
    setError("");
    setMessage("");

    try {
      const response = await ticketService.checkIn(code);
      const updatedTicket = await ticketService.getByCode(code);

      setTicket(updatedTicket);
      mergeTicketIntoList(updatedTicket);
      await loadTickets();
      setMessage(response?.message || "Ticket successfully checked in.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setCheckingIn(false);
    }
  };

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleString() : "";
  };

  const statusText = ticket
    ? (statusLabels[ticket.status] ?? String(ticket.status))
    : "";
  const isUsed = ticket?.status === 1;

  const checkInTicket = async (code) => {
    setTicketCode(code);
    setTicket(null);
    setCheckingIn(true);
    setError("");
    setMessage("");

    try {
      const response = await ticketService.checkIn(code);
      const updatedTicket = await ticketService.getByCode(code);

      setTicket(updatedTicket);
      mergeTicketIntoList(updatedTicket);
      await loadTickets();
      setMessage(response?.message || "Ticket successfully checked in.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setCheckingIn(false);
    }
  };

  const findTicketFromList = async (code) => {
    setTicketCode(code);
    await loadTicket(code);
  };

  const ticketRows = useMemo(() => {
    return tickets.map((item) => ({
      ...item,
      buyerEmail:
        item.buyerEmail ||
        item.email ||
        item.emailedTo ||
        item.userEmail ||
        item.userId ||
        "-",
      statusText: statusLabels[item.status] ?? String(item.status),
      issuedAtText: formatDate(item.issuedAt),
      usedAtText: item.usedAt ? formatDate(item.usedAt) : "Not checked in",
    }));
  }, [tickets]);

  const fetchCheckInTickets = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = ticketRows.filter((item) =>
        [
          item.ticketCode,
          item.eventTitle,
          item.buyerEmail,
          item.statusText,
          item.issuedAtText,
          item.usedAtText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [ticketRows],
  );

  const checkInColumns = [
    { key: "ticketCode", label: "Ticket Code" },
    { key: "eventTitle", label: "Event" },
    { key: "buyerEmail", label: "Buyer Email" },
    { key: "statusText", label: "Status" },
    { key: "issuedAtText", label: "Issued At" },
    { key: "usedAtText", label: "Used At" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Check-in</h1>
          <p>Validate tickets and mark attendees as checked in.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {message && <div className="form-alert success">{message}</div>}

      <form className="dynamic-form" onSubmit={handleLookup}>
        <div className="form-field">
          <label>Ticket Code</label>
          <input
            value={ticketCode}
            placeholder="TKT-ABC12345"
            onChange={(event) => {
              setTicketCode(event.target.value.toUpperCase());
              setError("");
              setMessage("");
            }}
            required
          />
        </div>

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Checking..." : "Find Ticket"}
        </button>
      </form>

      <div className="table-panel">
        {!ticket ? (
          <p className="status-text">
            Enter a ticket code to check its status.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Ticket Code</th>
                <th>Status</th>
                <th>Issued At</th>
                <th>Used At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{ticket.id}</td>
                <td>{ticket.ticketCode}</td>
                <td>{statusText}</td>
                <td>{formatDate(ticket.issuedAt)}</td>
                <td>
                  {ticket.usedAt ? formatDate(ticket.usedAt) : "Not checked in"}
                </td>
                <td>
                  <button
                    type="button"
                    disabled={checkingIn || isUsed}
                    onClick={handleCheckIn}
                  >
                    {isUsed
                      ? "Checked in"
                      : checkingIn
                        ? "Checking in..."
                        : "Check in"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="table-section-title">
        <h2>All Tickets</h2>
      </div>

      {loadingTickets ? (
        <div className="table-panel">
          <p>Loading tickets...</p>
        </div>
      ) : (
        <DynamicTable
          columns={checkInColumns}
          fetchData={fetchCheckInTickets}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
          refreshKey={`${tickets.length}-${tickets.map((item) => `${item.ticketCode}:${item.status}:${item.usedAt || ""}`).join("|")}`}
          actions={{
            onView: (item) => findTicketFromList(item.ticketCode),
            custom: [
              {
                key: "check-in",
                label: (item) =>
                  item.status === 1 ? "Checked in" : "Check in",
                disabled: (item) => checkingIn || item.status === 1,
                onClick: (item) => checkInTicket(item.ticketCode),
              },
            ],
          }}
        />
      )}
    </section>
  );
}

export function AttendeesPage() {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const statusLabels = {
    0: "Ready",
    1: "Checked in",
    2: "Cancelled",
    3: "Refunded",
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [eventsData, ticketsData] = await Promise.all([
        eventsService.getAll(),
        ticketService.getAll(),
      ]);

      setEvents(
        Array.isArray(eventsData) ? eventsData : (eventsData?.data ?? []),
      );
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const eventTickets = useMemo(() => {
    return tickets.filter(
      (ticket) => !eventId || String(ticket.eventId) === String(eventId),
    );
  }, [tickets, eventId]);

  const stats = useMemo(() => {
    const total = eventTickets.length;
    const checkedIn = eventTickets.filter(
      (ticket) => ticket.status === 1,
    ).length;
    const cancelled = eventTickets.filter(
      (ticket) => ticket.status === 2 || ticket.status === 3,
    ).length;
    const pending = total - checkedIn - cancelled;
    const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { total, checkedIn, pending, cancelled, rate };
  }, [eventTickets]);

  const formatDate = (value) => {
    return value ? new Date(value).toLocaleString() : "";
  };

  const attendeeRows = useMemo(() => {
    return eventTickets.map((ticket) => ({
      ...ticket,
      statusText: statusLabels[ticket.status] ?? String(ticket.status),
      issuedAtText: formatDate(ticket.issuedAt),
      usedAtText: ticket.usedAt ? formatDate(ticket.usedAt) : "Not checked in",
    }));
  }, [eventTickets]);

  const fetchAttendees = useCallback(
    async (page, pageSize, searchValue) => {
      const term = searchValue.trim().toLowerCase();
      const filtered = attendeeRows.filter((ticket) =>
        [
          ticket.eventTitle,
          ticket.buyerEmail,
          ticket.ticketCode,
          ticket.referenceNumber,
          ticket.statusText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );

      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [attendeeRows],
  );

  const attendeeColumns = [
    { key: "eventTitle", label: "Event" },
    { key: "buyerEmail", label: "Buyer Email" },
    { key: "ticketCode", label: "Ticket Code" },
    { key: "referenceNumber", label: "Booking" },
    { key: "statusText", label: "Status" },
    { key: "issuedAtText", label: "Issued At" },
    { key: "usedAtText", label: "Check-in Time" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Attendees</h1>
          <p>Track ticket holders, check-in status, and attendance by event.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}

      <div className="dynamic-form attendees-filter">
        <div className="form-field">
          <label>Event</label>
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title || event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="attendees-stats">
        <article className="attendee-stat-card">
          <span>Total attendees</span>
          <strong>{stats.total}</strong>
          <small>Tickets issued</small>
        </article>
        <article className="attendee-stat-card">
          <span>Checked in</span>
          <strong>{stats.checkedIn}</strong>
          <small>{stats.rate}% attendance rate</small>
        </article>
        <article className="attendee-stat-card">
          <span>Not checked in</span>
          <strong>{stats.pending}</strong>
          <small>Ready for entrance</small>
        </article>
        <article className="attendee-stat-card">
          <span>Cancelled / refunded</span>
          <strong>{stats.cancelled}</strong>
          <small>Inactive tickets</small>
        </article>
      </div>

      <div className="attendees-table">
        <DynamicTable
          columns={attendeeColumns}
          fetchData={fetchAttendees}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
        />
      </div>
    </section>
  );
}

export function NotificationsPage() {
  return (
    <EntityCrudPage
      title="Notifications"
      description="Send confirmations, reminders, and event updates to users."
      api={createCrudService("/Notification", { createOnly: true })}
      initialForm={{
        userId: uuid,
        eventId: uuid,
        type: 0,
        title: "",
        message: "",
      }}
      fields={[
        text("userId", "User ID"),
        text("eventId", "Event ID"),
        number("type", "Type"),
        text("title", "Title"),
        area("message", "Message"),
        checkbox("isRead", "Read"),
      ]}
    />
  );
}

export function ReviewsPage() {
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [eventId, setEventId] = useState("");
  const [reviewSummary, setReviewSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const [eventsData, reviewsData, usersData] = await Promise.all([
        eventsService.getAll(),
        reviewsService.getAll(),
        usersService.getAll(),
      ]);

      setEvents(
        Array.isArray(eventsData) ? eventsData : (eventsData?.data ?? []),
      );
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setUsers(Array.isArray(usersData) ? usersData : (usersData?.data ?? []));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const eventNameById = useMemo(() => {
    return events.reduce((map, event) => {
      map[String(event.id)] = event.title || event.name;
      return map;
    }, {});
  }, [events]);

  const userNameById = useMemo(() => {
    return users.reduce((map, user) => {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      map[String(user.id)] = fullName || user.email || user.id;
      return map;
    }, {});
  }, [users]);

  const visibleReviews = useMemo(() => {
    return reviews.filter(
      (review) => !eventId || String(review.eventId) === String(eventId),
    );
  }, [reviews, eventId]);

  const selectedEventName = eventId
    ? eventNameById[String(eventId)] || "Selected event"
    : "";

  const generateReviewSummary = async () => {
    if (!eventId) {
      setError("Select an event first.");
      return;
    }

    setSummaryLoading(true);
    setError("");
    setMessage("");
    setReviewSummary("");

    try {
      const result = await aiService.getReviewSummary(eventId);
      const response = result.response?.trim();

      if (!response) {
        setError("AI did not return a review summary. Try again.");
        return;
      }

      setReviewSummary(response);
      setMessage("AI review summary generated.");
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleEventChange = (value) => {
    setEventId(value);
    setReviewSummary("");
    setError("");
    setMessage("");
  };

  const stats = useMemo(() => {
    const total = visibleReviews.length;
    const average = total
      ? visibleReviews.reduce(
          (sum, review) => sum + Number(review.rating || 0),
          0,
        ) / total
      : 0;
    const fiveStar = visibleReviews.filter(
      (review) => Number(review.rating) === 5,
    ).length;
    const lowRating = visibleReviews.filter(
      (review) => Number(review.rating) <= 2,
    ).length;

    return {
      total,
      average: average.toFixed(1),
      fiveStar,
      lowRating,
    };
  }, [visibleReviews]);

  const rows = useMemo(() => {
    return visibleReviews.map((review) => ({
      ...review,
      eventTitle: eventNameById[String(review.eventId)] || review.eventId,
      userName: userNameById[String(review.userId)] || review.userId,
      ratingText: `${review.rating}/5`,
      createdAtText: review.createdAt
        ? new Date(review.createdAt).toLocaleString()
        : "",
      commentText: review.comment || "",
    }));
  }, [visibleReviews, eventNameById, userNameById]);

  const fetchReviews = useCallback(
    async (page, pageSize, search) => {
      const term = search.trim().toLowerCase();
      const filtered = rows.filter((review) =>
        [
          review.eventTitle,
          review.userName,
          review.ratingText,
          review.commentText,
          review.createdAtText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
      );
      const start = (page - 1) * pageSize;

      return {
        data: filtered.slice(start, start + pageSize),
        totalPages: Math.ceil(filtered.length / pageSize) || 1,
      };
    },
    [rows],
  );

  const reviewSummaryLines = useMemo(() => {
    return reviewSummary
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [reviewSummary]);

  const columns = [
    { key: "eventTitle", label: "Event" },
    { key: "ratingText", label: "Rating" },
    { key: "commentText", label: "Comment" },
    { key: "userName", label: "User" },
    { key: "createdAtText", label: "Created" },
  ];

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Reviews</h1>
          <p>Monitor attendee feedback and rating trends by event.</p>
        </div>
      </div>

      {error && <div className="form-alert">{error}</div>}
      {message && <div className="form-alert success">{message}</div>}

      <div className="dynamic-form attendees-filter">
        <div className="form-field">
          <label>Event</label>
          <select
            value={eventId}
            onChange={(event) => handleEventChange(event.target.value)}
          >
            <option value="">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title || event.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>AI Summary</label>
          <button
            className="primary-button"
            type="button"
            disabled={!eventId || summaryLoading}
            onClick={generateReviewSummary}
          >
            {summaryLoading ? "Summarizing..." : "Summarize Reviews"}
          </button>
        </div>
      </div>

      {reviewSummary && (
        <div className="ai-summary-panel">
          <div className="ai-summary-header">
            <div>
              <span>AI Insight</span>
              <h2>
                Review Summary
                {selectedEventName ? ` - ${selectedEventName}` : ""}
              </h2>
            </div>
            <small>Max 1000 words</small>
          </div>
          <div className="ai-summary-body">
            {reviewSummaryLines.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        </div>
      )}

      <div className="attendees-stats">
        <article className="attendee-stat-card">
          <span>Total reviews</span>
          <strong>{stats.total}</strong>
          <small>Feedback received</small>
        </article>
        <article className="attendee-stat-card">
          <span>Average rating</span>
          <strong>{stats.average}</strong>
          <small>Out of 5 stars</small>
        </article>
        <article className="attendee-stat-card">
          <span>5-star reviews</span>
          <strong>{stats.fiveStar}</strong>
          <small>Best feedback</small>
        </article>
        <article className="attendee-stat-card">
          <span>Low ratings</span>
          <strong>{stats.lowRating}</strong>
          <small>Needs attention</small>
        </article>
      </div>

      {loading ? (
        <div className="table-panel">
          <p>Loading reviews...</p>
        </div>
      ) : (
        <DynamicTable
          columns={columns}
          fetchData={fetchReviews}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 20]}
        />
      )}
    </section>
  );
}

export function UsersPage() {
  return (
    <EntityCrudPage
      title="Users"
      description="Tenant users and attendees."
      api={createCrudService("/User")}
      initialForm={{
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        isActive: true,
      }}
      fields={[
        text("firstName", "First Name"),
        text("lastName", "Last Name"),
        text("email", "Email"),
        text("password", "Password"),
        checkbox("isActive", "Active"),
      ]}
    />
  );
}

export function RolesPage() {
  return (
    <EntityCrudPage
      title="Roles"
      description="Tenant roles used for RBAC permissions."
      api={createCrudService("/Role")}
      initialForm={{ name: "", description: "", isGlobal: false }}
      fields={[
        text("name", "Name"),
        area("description", "Description"),
        checkbox("isGlobal", "Global"),
      ]}
    />
  );
}

export function UserRolesPage() {
  return (
    <EntityCrudPage
      title="User Roles"
      description="Assign roles to tenant users."
      api={createCrudService("/UserRole", { createOnly: true })}
      initialForm={{ userId: uuid, roleId: uuid }}
      fields={[
        text("userId", "User ID"),
        text("roleId", "Role ID"),
        text("assignedAt", "Assigned At"),
      ]}
    />
  );
}

export function ArchiveRecordsPage() {
  return (
    <EntityCrudPage
      title="Archive Records"
      description="Archived entity snapshots and retention metadata."
      api={createCrudService("/ArchiveRecords", { createOnly: true })}
      initialForm={{
        tenantId: uuid,
        entityName: "",
        entityId: uuid,
        data: "",
        archivedByUserId: uuid,
        archiveYear: new Date().getFullYear(),
      }}
      fields={[
        text("tenantId", "Tenant ID"),
        text("entityName", "Entity"),
        text("entityId", "Entity ID"),
        area("data", "Data"),
        text("archivedByUserId", "Archived By"),
        number("archiveYear", "Year"),
      ]}
    />
  );
}

export function AuditLogsPage() {
  return (
    <EntityCrudPage
      title="Audit Logs"
      description="Read-only operational audit trail from backend."
      readonly
      api={auditLogsService}
      initialForm={{}}
      fields={[
        text("entityName", "Entity"),
        text("entityId", "Entity ID"),
        text("action", "Action"),
        text("userId", "User ID"),
        text("createdAt", "Created At"),
      ]}
    />
  );
}

export function AIRequestsPage() {
  return (
    <EntityCrudPage
      title="AI Request Logs"
      description="Track AI prompts, responses, token usage, and status."
      readonly
      api={readonlyEmptyService}
      initialForm={{
        userId: uuid,
        prompt: "",
        responseSummary: "",
        requestType: "",
        tokensUsed: 0,
        status: "",
      }}
      fields={[
        text("userId", "User ID"),
        area("prompt", "Prompt"),
        area("responseSummary", "Response"),
        text("requestType", "Type"),
        number("tokensUsed", "Tokens"),
        text("status", "Status"),
      ]}
    />
  );
}
