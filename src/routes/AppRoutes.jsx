import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";

import HomePage from "../pages/buyer/HomePage";
import LoginPage from "../pages/public/LoginPage";
import DashboardPage from "../pages/tenant/DashboardPage";

import SuperAdminLayout from "../layouts/SuperAdminLayout";
import BookingsPage from "../pages/superadmin/BookingsPage";
import TicketsPage from "../pages/superadmin/TicketsPage";
import TicketTypesPage from "../pages/superadmin/TicketTypesPage";

import EventCategoriesPage from "../pages/tenant/EventCategoriesPage";
import EventsPage from "../pages/tenant/EventsPage";
import EventSectionsPage from "../pages/tenant/EventSectionsPage";
import VenuesPage from "../pages/tenant/VenuesPage";
import VenueSectionsPage from "../pages/tenant/VenueSectionsPage";

import TenantsPage from "../pages/superadmin/TenantsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="/tenant/event-categories" element={<EventCategoriesPage />} />
      <Route path="/tenant/events" element={<EventsPage />} />
      <Route path="/tenant/event-sections" element={<EventSectionsPage />} />
      <Route path="/tenant/venues" element={<VenuesPage />} />
      <Route path="/tenant/venue-sections" element={<VenueSectionsPage />} />

      <Route path="/superadmin" element={<SuperAdminLayout />}>
       <Route path="/superadmin/tenants" element={<TenantsPage />} />
        <Route index element={<SuperAdminDashboard />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="ticket-types" element={<TicketTypesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;