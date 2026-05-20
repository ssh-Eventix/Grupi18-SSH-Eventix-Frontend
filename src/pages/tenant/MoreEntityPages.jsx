import EntityCrudPage from "../../components/crud/EntityCrudPage";
import { createCrudService, localCrudService } from "../../services/crudService";
import { mergedCrudService } from "../../services/purchaseRecordsService";

const uuid = "00000000-0000-0000-0000-000000000000";

const text = (name, label = name) => ({ name, label });
const date = (name, label = name) => ({ name, label, type: "datetime-local" });
const number = (name, label = name) => ({ name, label, type: "number" });
const checkbox = (name, label = name) => ({ name, label, type: "checkbox" });
const area = (name, label = name) => ({ name, label, type: "textarea" });

export function TicketTypesPage() {
  return (
    <EntityCrudPage
      title="Ticket Types"
      description="Manage pricing, availability, and sales windows for event tickets."
      api={localCrudService("ticketTypes", [
        { id: "tt-regular", eventId: uuid, name: "Regular", price: 25, quantityAvailable: 200, saleStartDate: "", saleEndDate: "" },
      ])}
      initialForm={{ eventId: uuid, name: "", price: 0, quantityAvailable: 0, saleStartDate: "", saleEndDate: "" }}
      fields={[
        text("eventId", "Event ID"),
        text("name", "Name"),
        number("price", "Price"),
        number("quantityAvailable", "Quantity"),
        date("saleStartDate", "Sale Start"),
        date("saleEndDate", "Sale End"),
      ]}
    />
  );
}

export function BookingsPage() {
  return (
    <EntityCrudPage
      title="Bookings"
      description="View and create ticket bookings. Booking items represent the tickets inside each booking."
      api={mergedCrudService("/Booking", "bookings")}
      initialForm={{ userId: uuid, eventId: uuid, items: [{ ticketTypeId: uuid, quantity: 1 }] }}
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
  return (
    <EntityCrudPage
      title="Check-ins"
      description="Tickets bought by buyers appear here ready for QR scan at the entrance."
      api={localCrudService("checkIns")}
      initialForm={{ ticketId: "", ticketCode: "", eventTitle: "", buyerEmail: "", checkedInByUserId: "", notes: "", checkInTime: "Not checked in", status: "Ready" }}
      fields={[
        text("ticketId", "Ticket ID"),
        text("ticketCode", "Ticket Code"),
        text("eventTitle", "Event"),
        text("buyerEmail", "Buyer Email"),
        text("status", "Status"),
        text("checkedInByUserId", "Checked In By"),
        area("notes", "Notes"),
        text("checkInTime", "Check-in Time"),
      ]}
    />
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
