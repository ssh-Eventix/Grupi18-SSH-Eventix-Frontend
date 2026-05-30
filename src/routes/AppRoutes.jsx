import { Navigate, Route, Routes } from "react-router-dom";
import RoleRoute from "../routes/RoleRoute";
import TenantAccessRoute from "../routes/TenantAccessRoute";
import ImpersonatePage from "../pages/superadmin/ImpersonatePage";
import BuyerLayout from "../layouts/BuyerLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import ProtectedRoute from "../auth/ProtectedRoute";
import { startupPathFromToken } from "../utils/routeDestinations";

import HomePage from "../pages/buyer/HomePage";
import CheckoutPage from "../pages/buyer/CheckoutPage";
import EventDetailsPage from "../pages/buyer/EventDetailsPage";
import PaymentPage from "../pages/buyer/PaymentPage";
import {
  BuyerEventsPage,
  BuyerSettingsPage,
  FavoritesPage,
  ProfilePage as BuyerProfilePage,
  TicketsPage as BuyerTicketsPage,
} from "../pages/buyer/BuyerPages";
import LoginPage from "../pages/public/LoginPage";
import Register from "../pages/public/Register";
import ForgotPasswordPage from "../pages/public/ForgotPasswordPage";
import ResetPasswordPage from "../pages/public/ResetPasswordPage";
import SuperAdminDashboardPage from "../pages/superadmin/SuperAdminDashboardPage";
import TenantEmailDomainsPage from "../pages/superadmin/TenantEmailDomainsPage";
import TenantsPage from "../pages/superadmin/TenantsPage";
import DashboardPage from "../pages/tenant/DashboardPage";
import EventCategoriesPage from "../pages/tenant/EventCategoriesPage";
import EventsPage from "../pages/tenant/EventsPage";
import EventSectionsPage from "../pages/tenant/EventSectionsPage";
import ReportsPage from "../pages/tenant/ReportsPage";
import StaffPage from "../pages/tenant/StaffPage";
import {
  AIRequestsPage,
  ArchiveRecordsPage,
  AttendeesPage,
  AuditLogsPage,
  BookingsPage,
  CheckInsPage,
  CouponsPage,
  EventSessionsPage,
  NotificationsPage,
  PaymentMethodsPage,
  PaymentsPage,
  ReviewsPage,
  RolesPage,
  SpeakersPage,
  TicketTypesPage,
  UserRolesPage,
  UsersPage,
} from "../pages/tenant/MoreEntityPages";
import VenueSectionsPage from "../pages/tenant/VenueSectionsPage";
import VenuesPage from "../pages/tenant/VenuesPage";
import TenantAdminsPage from "../pages/superadmin/TenantAdminsPage";
import SuperAdminAuditLogsPage from "../pages/superadmin/SuperAdminAuditLogsPage";
import SuperAdminVenuesPage from "../pages/superadmin/SuperAdminVenuesPage";

const StartRedirect = () => {
  return <Navigate to={startupPathFromToken()} replace />;
};

const isEventThisWeek = (event) => {
  const eventDate = new Date(event.startUtc || event.date);
  if (Number.isNaN(eventDate.getTime())) return false;

  const now = new Date();
  const start = new Date(now);
  const day = start.getDay() || 7;

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return eventDate >= start && eventDate < end;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:eventId" element={<EventDetailsPage />} />

      <Route element={<RoleRoute allowedRoles={["Buyer"]} />}>
        <Route path="/buyer" element={<BuyerLayout />}>
          <Route index element={<HomePage />} />
          <Route path="top-events" element={<BuyerEventsPage title="Top Events" filter={(event) => event.tag === "Top Event"} />} />
          <Route path="weekend" element={<BuyerEventsPage title="This Week" filter={isEventThisWeek} />} />
          <Route path="free-events" element={<BuyerEventsPage title="Free Events" filter={(event) => event.price === "Free"} />} />
          <Route path="events/:eventId" element={<EventDetailsPage />} />
          <Route path="checkout/:eventId" element={<CheckoutPage />} />
          <Route path="payment/:eventId" element={<PaymentPage />} />
          <Route path="tickets" element={<BuyerTicketsPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="notifications" element={<BuyerSettingsPage />} />
          <Route path="profile" element={<BuyerProfilePage />} />
          <Route path="settings" element={<BuyerSettingsPage />} />
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={["Admin", "TenantAdmin", "Staff"]} />}>
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><EventsPage /></TenantAccessRoute>} />
          <Route path="create-event" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><EventsPage /></TenantAccessRoute>} />
          <Route path="event-categories" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><EventCategoriesPage /></TenantAccessRoute>} />
          <Route path="event-sections" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><EventSectionsPage /></TenantAccessRoute>} />
          <Route path="event-sessions" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><EventSessionsPage /></TenantAccessRoute>} />
          <Route path="speakers" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><SpeakersPage /></TenantAccessRoute>} />
          <Route path="coupons" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><CouponsPage /></TenantAccessRoute>} />
          <Route path="tickets" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><TicketTypesPage /></TenantAccessRoute>} />
          <Route path="orders" element={<BookingsPage />} />
          <Route path="payments" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><PaymentsPage /></TenantAccessRoute>} />
          <Route path="payment-methods" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><PaymentMethodsPage /></TenantAccessRoute>} />
          <Route path="attendees" element={<AttendeesPage />} />
          <Route path="staff" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><StaffPage /></TenantAccessRoute>} />
          <Route path="check-in" element={<CheckInsPage />} />
          <Route path="notifications" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><NotificationsPage /></TenantAccessRoute>} />
          <Route path="reviews" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><ReviewsPage /></TenantAccessRoute>} />
          <Route path="roles" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><RolesPage /></TenantAccessRoute>} />
          <Route path="user-roles" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><UserRolesPage /></TenantAccessRoute>} />
          <Route path="reports" element={<TenantAccessRoute allowedRoles={["Admin", "TenantAdmin"]}><ReportsPage /></TenantAccessRoute>} />
        </Route>
      </Route>
      <Route path="/dashboard" element={<Navigate to="/tenant" replace />} />

      <Route element={<RoleRoute allowedRoles={["SuperAdmin"]} />}>
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboardPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenant-domains" element={<TenantEmailDomainsPage />} />
          <Route path="tenant-admins" element={<TenantAdminsPage />} />
          <Route path="impersonate" element={<ImpersonatePage />} />
          <Route path="/superadmin/audit-logs" element={<SuperAdminAuditLogsPage />} />
          <Route path="/superadmin/venues" element={<SuperAdminVenuesPage />} />
        </Route>
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<StartRedirect />} />
      <Route path="/unauthorized" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
