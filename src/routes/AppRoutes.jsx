import { Navigate, Route, Routes } from "react-router-dom";
import RoleRoute from "../routes/RoleRoute";
import ImpersonatePage from "../pages/superadmin/ImpersonatePage";
import BuyerLayout from "../layouts/BuyerLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import ProtectedRoute from "../auth/ProtectedRoute";
import SuperAdminReviewsPage from "../pages/superadmin/SuperAdminReviewsPage";
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
import SuperAdminDashboardPage from "../pages/superadmin/SuperAdminDashboardPage";
import TenantEmailDomainsPage from "../pages/superadmin/TenantEmailDomainsPage";
import TenantsPage from "../pages/superadmin/TenantsPage";
import DashboardPage from "../pages/tenant/DashboardPage";
import EventCategoriesPage from "../pages/tenant/EventCategoriesPage";
import EventsPage from "../pages/tenant/EventsPage";
import EventSectionsPage from "../pages/tenant/EventSectionsPage";
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
import AIStudioPage from "../pages/tenant/AIStudioPage";

const StartRedirect = () => {
  return <Navigate to={startupPathFromToken()} replace />;
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
          <Route path="weekend" element={<BuyerEventsPage title="This Weekend" filter={(event) => event.tag === "This Weekend"} />} />
          <Route path="free-events" element={<BuyerEventsPage title="Free Events" filter={(event) => event.price === "Free"} />} />
          <Route path="events/:eventId" element={<EventDetailsPage />} />
          <Route path="checkout/:eventId" element={<CheckoutPage />} />
          <Route path="payment/:eventId" element={<PaymentPage />} />
          <Route path="tickets" element={<BuyerTicketsPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="profile" element={<BuyerProfilePage />} />
          <Route path="settings" element={<BuyerSettingsPage />} />
        </Route>
      </Route>

      <Route element={<RoleRoute allowedRoles={["Admin", "TenantAdmin", "Staff"]} />}>
        <Route path="/tenant" element={<TenantLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="create-event" element={<EventsPage />} />
          <Route path="event-categories" element={<EventCategoriesPage />} />
          <Route path="event-sections" element={<EventSectionsPage />} />
          <Route path="event-sessions" element={<EventSessionsPage />} />
          <Route path="speakers" element={<SpeakersPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="venues" element={<VenuesPage />} />
          <Route path="venue-sections" element={<VenueSectionsPage />} />
          <Route path="tickets" element={<TicketTypesPage />} />
          <Route path="orders" element={<BookingsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="payment-methods" element={<PaymentMethodsPage />} />
          <Route path="attendees" element={<AttendeesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="check-in" element={<CheckInsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="ai-studio" element={<AIStudioPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="user-roles" element={<UserRolesPage />} />
          <Route path="reports" element={<AuditLogsPage />} />
          <Route path="settings" element={<PaymentMethodsPage />} />
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
        </Route>
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<StartRedirect />} />
      <Route path="/unauthorized" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
