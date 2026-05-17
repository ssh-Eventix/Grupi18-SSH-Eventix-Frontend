import { useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import DynamicForm from "./components/DynamicForm.jsx";
import DynamicTable from "./components/DynamicTable.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import SuperAdminLayout from "./layouts/SuperAdminLayout.jsx";
import BookingsPage from "./pages/superadmin/BookingsPage.jsx";
import TicketsPage from "./pages/superadmin/TicketsPage.jsx";
import TicketTypesPage from "./pages/superadmin/TicketTypesPage.jsx";
import LoginPage from "./pages/public/LoginPage.jsx";
import Register from "./pages/public/Register.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

const initialEvents = [
  { id: 1, name: "Tech Meetup", venue: "Prishtina Hall", date: "2026-05-12", status: "Open" },
  { id: 2, name: "Music Night", venue: "Arena Center", date: "2026-05-18", status: "Sold out" },
  { id: 3, name: "Startup Talk", venue: "Innovation Hub", date: "2026-05-22", status: "Open" },
  { id: 4, name: "Design Workshop", venue: "Creative Space", date: "2026-06-02", status: "Draft" },
  { id: 5, name: "Food Festival", venue: "City Park", date: "2026-06-10", status: "Open" }
];

const Dashboard = () => {
  return (
    <main className="page">
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard.</p>
    </main>
  );
};

const SuperAdminDashboard = () => {
  return (
    <section className="page">
      <h1>SuperAdmin Dashboard</h1>
      <p>Manage bookings, tickets, ticket types, reports, and staff for this tenant.</p>
    </section>
  );
};

const PlaceholderPage = ({ title }) => {
  return (
    <section className="page">
      <h1>{title}</h1>
      <p>This page is ready for the next module.</p>
    </section>
  );
};

const Events = () => {
  const [events, setEvents] = useState(initialEvents);

  const columns = [
    { key: "name", label: "Event" },
    { key: "venue", label: "Venue" },
    { key: "date", label: "Date" },
    { key: "status", label: "Status" }
  ];

  const fields = [
    { name: "name", label: "Event", type: "text", placeholder: "Event name", required: true },
    { name: "venue", label: "Venue", type: "text", placeholder: "Venue name", required: true },
    { name: "date", label: "Date", type: "date", required: true },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        { id: "Open", name: "Open" },
        { id: "Sold out", name: "Sold out" },
        { id: "Draft", name: "Draft" }
      ]
    }
  ];

  const fetchEvents = async (page, pageSize, search) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const filtered = events.filter((event) =>
      Object.values(event).join(" ").toLowerCase().includes(search.toLowerCase())
    );

    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return {
      data,
      totalPages: Math.ceil(filtered.length / pageSize) || 1
    };
  };

  const handleCreateEvent = (values) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        ...values
      },
      ...prev
    ]);
  };

  return (
    <main className="page">
      <h1>Events</h1>
      <DynamicForm fields={fields} onSubmit={handleCreateEvent} submitText="Add event" />
      <DynamicTable
        key={events.length}
        columns={columns}
        fetchData={fetchEvents}
        actions={{
          onView: (row) => alert(`Viewing: ${row.name}`),
          onEdit: (row) => alert(`Editing: ${row.name}`),
          onDelete: (row) => alert(`Deleting: ${row.name}`)
        }}
      />
    </main>
  );
};

const Venues = () => {
  return <h1>Venues</h1>;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <>
      <nav className="app-nav">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/events">Events</Link>
        <Link to="/bookings">Bookings</Link>
        <Link to="/superadmin">SuperAdmin</Link>
        <Link to="/venues">Venues</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/events" element={<Events />} />

        <Route path="/bookings" element={<BookingsPage />} />

        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="ticket-types" element={<TicketTypesPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="staff" element={<PlaceholderPage title="Staff" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
        </Route>

        <Route
          path="/venues"
          element={
            <ProtectedRoute>
              <Venues />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
