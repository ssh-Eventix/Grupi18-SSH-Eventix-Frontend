import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";

import HomePage from "../pages/buyer/HomePage";
import LoginPage from "../pages/public/LoginPage";
import DashboardPage from "../pages/tenant/DashboardPage";

import SuperAdminLayout from "../layouts/SuperAdminLayout";
import BookingsPage from "../pages/superadmin/BookingsPage";
import TicketsPage from "../pages/superadmin/TicketsPage";
import TicketTypesPage from "../pages/superadmin/TicketTypesPage";

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

      <Route path="/events" element={<EventsPage />} />
      <Route path="/venues" element={<VenuesPage />} />

      <Route path="/superadmin" element={<SuperAdminLayout />}>
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