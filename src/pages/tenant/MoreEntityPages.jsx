import { useEffect, useMemo, useState } from "react";
import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { createCrudService, localCrudService } from "../../services/crudService";
import { eventsService } from "../../services/eventsService";
import { eventSectionsService } from "../../services/eventSectionsService";
import { mergedCrudService } from "../../services/purchaseRecordsService";
import { ticketService } from "../../services/ticketService";
import { ticketTypeService } from "../../services/ticketTypeService";
import { handleApiError } from "../../utils/apiErrorHandler";

const uuid = "00000000-0000-0000-0000-000000000000";

const text = (name, label = name) => ({ name, label });
const date = (name, label = name) => ({ name, label, type: "datetime-local" });
const number = (name, label = name) => ({ name, label, type: "number" });
const checkbox = (name, label = name) => ({ name, label, type: "checkbox" });
const area = (name, label = name) => ({ name, label, type: "textarea" });

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
    return eventSections.filter((section) => String(section.eventId) === String(form.eventId));
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
        const [eventsData, sectionsData] = await Promise.all([
          eventsService.getAll(),
          eventSectionsService.getAll(),
        ]);

        const nextEvents = Array.isArray(eventsData) ? eventsData : eventsData?.data ?? [];
        const nextSections = Array.isArray(sectionsData) ? sectionsData : sectionsData?.data ?? [];

        setEvents(nextEvents);
        setEventSections(nextSections);

        if (nextEvents.length > 0) {
          const firstEventId = nextEvents[0].id;
          setForm((prev) => ({
            ...prev,
            eventId: prev.eventId || firstEventId,
          }));

          const data = await ticketTypeService.getByEventId(firstEventId);
          setTicketTypes(data);
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
      return;
    }

    try {
      const data = await ticketTypeService.getByEventId(eventId);
      setTicketTypes(data);
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

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Ticket Types</h1>
          <p>Manage pricing, stock, and sale windows by event section.</p>
        </div>
        <button type="button" onClick={() => handleEventChange(form.eventId)} disabled={!form.eventId || loading}>
          Refresh
        </button>
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
          <select
            value={form.eventSectionId}
            disabled={saving || !form.eventId}
            onChange={(event) => updateField("eventSectionId", event.target.value)}
            required
          >
            <option value="">
              {form.eventId ? "Select section" : "Select event first"}
            </option>
            {selectedEventSections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.code ? `${section.name} (${section.code})` : section.name}
              </option>
            ))}
          </select>
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
            onChange={(event) => updateField("quantityAvailable", event.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label>Sale Start</label>
          <input
            type="datetime-local"
            value={form.saleStartDate}
            disabled={saving}
            onChange={(event) => updateField("saleStartDate", event.target.value)}
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

      <div className="table-panel">
        {loading ? (
          <p>Loading...</p>
        ) : ticketTypes.length === 0 ? (
          <p className="status-text">No ticket types found for the selected event.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>Name</th>
                <th>Price</th>
                <th>Available</th>
                <th>Sold</th>
                <th>Status</th>
                <th>Sale Start</th>
                <th>Sale End</th>
              </tr>
            </thead>

            <tbody>
              {ticketTypes.map((type) => (
                <tr key={type.id}>
                  <td>{getSectionLabel(type)}</td>
                  <td>{type.name}</td>
                  <td>{Number(type.price || 0).toFixed(2)} EUR</td>
                  <td>{type.quantityAvailable}</td>
                  <td>{type.soldQuantity}</td>
                  <td>{getSaleStatus(type)}</td>
                  <td>{formatDate(type.saleStartDate)}</td>
                  <td>{formatDate(type.saleEndDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export function BookingsPage() {
  return (
    <EntityCrudPage
      title="Orders"
      description="Bookings created from buyer checkout."
      readonly
      api={mergedCrudService("/Booking", "bookings")}
      initialForm={{}}
      fields={[
        text("referenceNumber", "Reference"),
        text("eventTitle", "Event"),
        text("buyerEmail", "Buyer Email"),
        text("status", "Status"),
        number("totalAmount", "Total"),
        number("quantity", "Qty"),
        text("ticketCode", "Ticket Code"),
        text("source", "Source"),
      ]}
    />
  );
}

export function PaymentsPage() {
  return (
    <EntityCrudPage
      title="Payments"
      description="Payments created from buyer checkout."
      api={localCrudService("payments")}
      initialForm={{ bookingId: uuid, amount: 0, paymentMethodId: uuid, transactionId: "", status: 0 }}
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
      description="Demo payment method settings until backend endpoints are added."
      api={localCrudService("paymentMethods", [{ id: "pm-card", name: "Card", provider: "Stripe", isActive: true }])}
      initialForm={{ name: "", provider: "", description: "", isActive: true }}
      fields={[
        text("name", "Name"),
        text("provider", "Provider"),
        area("description", "Description"),
        checkbox("isActive", "Active"),
      ]}
    />
  );
}

export function CouponsPage() {
  return (
    <EntityCrudPage
      title="Discount Coupons"
      description="Create promo codes and discount rules for events."
      api={createCrudService("/DiscountCoupon")}
      initialForm={{ eventId: uuid, code: "", discountType: 0, discountValue: 0, validFrom: "", validTo: "", usageLimit: 0 }}
      fields={[
        text("eventId", "Event ID"),
        text("code", "Code"),
        number("discountType", "Discount Type"),
        number("discountValue", "Value"),
        date("validFrom", "Valid From"),
        date("validTo", "Valid To"),
        number("usageLimit", "Usage Limit"),
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
      initialForm={{ eventId: uuid, speakerId: uuid, title: "", description: "", startTime: "", endTime: "" }}
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
      initialForm={{ fullName: "", bio: "", email: "", phone: "", profileImageUrl: "" }}
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
    0: "Active",
    1: "Used",
    2: "Cancelled",
    3: "Refunded",
  };

  const cleanTicketCode = () => ticketCode.trim();

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
      setTickets((prev) =>
        prev.map((item) =>
          item.ticketCode === updatedTicket.ticketCode
            ? { ...item, ...updatedTicket }
            : item
        )
      );
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

  const statusText = ticket ? statusLabels[ticket.status] ?? String(ticket.status) : "";
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
      setTickets((prev) =>
        prev.map((item) =>
          item.ticketCode === updatedTicket.ticketCode
            ? { ...item, ...updatedTicket }
            : item
        )
      );
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

  return (
    <section className="page crud-page">
      <div className="crud-header">
        <div>
          <h1>Check-in</h1>
          <p>Validate tickets and mark attendees as checked in.</p>
        </div>
        <button type="button" onClick={loadTickets} disabled={loadingTickets}>
          {loadingTickets ? "Refreshing..." : "Refresh"}
        </button>
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
          <p className="status-text">Enter a ticket code to check its status.</p>
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
                <td>{ticket.usedAt ? formatDate(ticket.usedAt) : "Not checked in"}</td>
                <td>
                  <button
                    type="button"
                    disabled={checkingIn || isUsed}
                    onClick={handleCheckIn}
                  >
                    {isUsed ? "Checked in" : checkingIn ? "Checking in..." : "Check in"}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="table-panel">
        <h2>All Tickets</h2>
        {loadingTickets ? (
          <p>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="status-text">No tickets found yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Ticket Code</th>
                <th>Event</th>
                <th>Buyer Email</th>
                <th>Status</th>
                <th>Issued At</th>
                <th>Used At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((item) => {
                const itemStatus = statusLabels[item.status] ?? String(item.status);
                const itemUsed = item.status === 1;

                return (
                  <tr key={item.id}>
                    <td>{item.ticketCode}</td>
                    <td>{item.eventTitle || ""}</td>
                    <td>{item.buyerEmail || ""}</td>
                    <td>{itemStatus}</td>
                    <td>{formatDate(item.issuedAt)}</td>
                    <td>{item.usedAt ? formatDate(item.usedAt) : "Not checked in"}</td>
                    <td>
                      <button type="button" onClick={() => findTicketFromList(item.ticketCode)}>
                        View
                      </button>
                      <button
                        type="button"
                        disabled={checkingIn || itemUsed}
                        onClick={() => checkInTicket(item.ticketCode)}
                      >
                        {itemUsed ? "Checked in" : "Check in"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
      initialForm={{ userId: uuid, eventId: uuid, type: 0, title: "", message: "" }}
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
  return (
    <EntityCrudPage
      title="Reviews"
      description="Collect attendee ratings and comments after events."
      api={createCrudService("/Review", { createOnly: true })}
      initialForm={{ eventId: uuid, userId: uuid, rating: 5, comment: "" }}
      fields={[
        text("eventId", "Event ID"),
        text("userId", "User ID"),
        number("rating", "Rating"),
        area("comment", "Comment"),
      ]}
    />
  );
}

export function UsersPage() {
  return (
    <EntityCrudPage
      title="Users"
      description="Tenant users and attendees."
      api={createCrudService("/User")}
      initialForm={{ firstName: "", lastName: "", email: "", password: "", isActive: true }}
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
      initialForm={{ tenantId: uuid, entityName: "", entityId: uuid, data: "", archivedByUserId: uuid, archiveYear: new Date().getFullYear() }}
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
      description="Read-only operational audit trail. Backend endpoints can be connected when available."
      readonly
      api={localCrudService("auditLogs", [{ id: "audit-demo", entityName: "Ticket", action: "Created", userId: uuid, createdAt: new Date().toISOString() }])}
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
      api={localCrudService("aiRequestLogs")}
      initialForm={{ userId: uuid, prompt: "", responseSummary: "", requestType: "", tokensUsed: 0, status: "" }}
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
