# Eventix Frontend

## Multi-Tenant Event Management Platform - Frontend Application

Eventix Frontend is a React-based client application that provides the user interface for the Eventix platform. It serves as the presentation layer of the system and communicates exclusively with the Eventix REST API through HTTP requests.

The application supports multiple user roles, tenant-aware routing, authentication, authorization, event browsing, ticket purchasing, administrative dashboards, reporting, and tenant management.

---

# Table of Contents

* Overview
* Frontend Architecture
* Technologies Used
* Application Structure
* Folder Structure
* Authentication Flow
* Tenant Resolution
* Routing System
* Context Management
* Service Layer
* Main Features
* Backend Integration
* Installation
* Running the Application
* User Roles
* Future Improvements

---

# Overview

The frontend is responsible for:

* User authentication
* Session management
* Route protection
* Dashboard visualization
* Event management
* Venue management
* Ticket management
* Booking workflows
* Payment workflows
* Reporting and analytics
* Tenant administration

The application follows a component-based architecture using React and Context API for state management.

---

# Frontend Architecture

```text
User
 │
 ▼
React Components
 │
 ▼
Context Providers
 │
 ▼
Service Layer
 │
 ▼
Axios Client
 │
 ▼
Eventix REST API
```

## Architecture Layers

### Presentation Layer

Responsible for:

* Pages
* Components
* Layouts
* Forms
* Tables
* Dashboards

### State Management Layer

Responsible for:

* Authentication state
* User information
* Tenant information
* Session management

### Service Layer

Responsible for:

* API communication
* Request handling
* Response processing
* Error handling

---

# Technologies Used

## Core

* React
* React Router DOM
* Axios
* Context API

## UI

* React Icons
* CSS
* Responsive Layouts

## Development

* Vite
* ESLint
* GitHub

---

# Application Structure

The frontend follows a modular architecture where each feature is separated into reusable components, pages, services, and layouts.

Benefits include:

* Easier maintenance
* Better scalability
* Improved readability
* Reusable code
* Clear separation of concerns

---

# Folder Structure

```text
src
│
├── api
│   └── axios.js
│
├── components
│   ├── common
│   ├── forms
│   ├── tables
│   ├── charts
│   └── shared
│
├── contexts
│   ├── AuthContext.jsx
│   └── TenantContext.jsx
│
├── layouts
│   ├── PublicLayout.jsx
│   ├── BuyerLayout.jsx
│   ├── TenantAdminLayout.jsx
│   └── SuperAdminLayout.jsx
│
├── pages
│   ├── auth
│   ├── public
│   ├── buyer
│   ├── tenant
│   └── superadmin
│
├── routes
│   ├── AppRoutes.jsx
│   ├── ProtectedRoute.jsx
│   └── RoleRoute.jsx
│
├── services
│   ├── authService.js
│   ├── tenantService.js
│   ├── eventService.js
│   ├── venueService.js
│   ├── bookingService.js
│   ├── paymentService.js
│   ├── reportService.js
│   └── auditLogService.js
│
├── utils
│   ├── apiErrorHandler.js
│   └── roles.js
│
├── App.jsx
├── main.jsx
└── index.css
```

---

# Main Files Explained

## main.jsx

Application entry point.

Responsibilities:

* Creates React application
* Registers providers
* Loads routing system
* Mounts application to DOM

---

## App.jsx

Main application component.

Responsibilities:

* Loads route definitions
* Connects layouts
* Initializes application structure

---

## api/axios.js

Central Axios configuration.

Responsibilities:

* API base URL
* JWT token injection
* Tenant slug injection
* Request configuration
* Response interceptors

All API communication passes through this file.

---

## contexts/AuthContext.jsx

Manages authentication state.

Responsibilities:

* Current user information
* Login status
* Logout functionality
* JWT storage
* Session restoration

Used throughout the entire application.

---

## contexts/TenantContext.jsx

Manages tenant information.

Responsibilities:

* Active tenant
* Tenant slug
* Tenant switching
* Tenant-aware requests

Supports multi-tenant functionality.

---

## routes/AppRoutes.jsx

Defines all application routes.

Responsibilities:

* Public routes
* Protected routes
* Role-specific routes
* Layout assignment

Acts as the application's navigation map.

---

## routes/ProtectedRoute.jsx

Protects authenticated pages.

Responsibilities:

* Token validation
* Login redirection
* Session verification

Prevents unauthorized access.

---

## routes/RoleRoute.jsx

Handles role-based routing.

Responsibilities:

* Role validation
* Access restriction
* Authorization enforcement

Ensures users only access allowed sections.

---

# Authentication Flow

The frontend authenticates users using JWT tokens provided by the backend.

Login process:

1. User submits credentials.
2. Request sent to Auth API.
3. Backend returns JWT token.
4. Token stored in local storage.
5. AuthContext updates session state.
6. Protected routes become accessible.

Each subsequent request automatically includes:

```http
Authorization: Bearer JWT_TOKEN
```

through Axios interceptors.

---

# Tenant Resolution

Eventix supports schema-based multi-tenancy.

The frontend identifies the active tenant using:

```http
X-Tenant-Slug
```

header.

Example:

```http
X-Tenant-Slug: company-a
```

The Axios client automatically attaches this header to all tenant-specific requests.

This allows the backend to determine which tenant schema should be used.

---

# Routing System

The application contains four primary route groups.

## Public Routes

Accessible without authentication.

Examples:

* Home Page
* Event Details
* Login
* Register
* Forgot Password

---

## Buyer Routes

Accessible by buyers.

Examples:

* Event Listing
* My Bookings
* My Tickets
* Reviews

---

## Tenant Admin Routes

Accessible by tenant administrators.

Examples:

* Dashboard
* Events
* Venues
* Tickets
* Staff
* Reports
* Audit Logs

---

## Super Admin Routes

Accessible by platform administrators.

Examples:

* Tenant Management
* Platform Statistics
* Global Audit Logs
* System Monitoring

---

# Service Layer

The service layer separates API logic from UI components.

Example structure:

```javascript
eventService.js
venueService.js
bookingService.js
paymentService.js
```

Benefits:

* Cleaner components
* Reusable API calls
* Easier maintenance
* Better testing

Pages never call Axios directly.

Instead they use services.

Example:

```javascript
const events = await eventService.getAll();
```

---

# Main Features

## Authentication Pages

Includes:

* Login
* Register
* Forgot Password
* Reset Password

Provides secure access to the platform.

---

## Event Management Interface

Allows administrators to:

* Create events
* Edit events
* Publish events
* Manage event sections

Provides complete event lifecycle management.

---

## Venue Management Interface

Allows administrators to:

* Create venues
* Edit venues
* Configure capacities
* Manage sections

Supports event planning workflows.

---

## Ticket Management Interface

Allows administrators to:

* Create ticket types
* Configure pricing
* Set limits
* Monitor sales

Integrated with bookings and reports.

---

## Booking Interface

Allows buyers to:

* Reserve tickets
* View bookings
* Review booking history

Provides a streamlined purchasing experience.

---

## Payment Interface

Allows users to:

* Complete purchases
* Select payment methods
* Review payment history

Integrated with backend payment processing.

---

## Reporting Dashboard

Provides:

* Sales statistics
* Revenue analytics
* Attendance metrics
* Event performance indicators

Supports business decision-making.

---

## Audit Log Viewer

Displays:

* User activity
* Entity modifications
* Payment actions
* Authentication events

Improves transparency and monitoring.

---

# Backend Integration

The frontend communicates exclusively through REST API endpoints.

Examples:

```javascript
GET /api/Events
GET /api/Venue
GET /api/Bookings
POST /api/Auth/Login
POST /api/Payment
```

All communication is handled through Axios services.

No direct database access exists in the frontend.

This ensures proper separation between client and server layers.

---

# Installation

Clone repository:

```bash
git clone https://github.com/ssh-Eventix/Grupi18-SSH-Eventix-Frontend.git
```

Install dependencies:

```bash
npm install
```

---

# Environment Configuration

Create a `.env` file:

```env
VITE_API_BASE_URL=https://localhost:5001/api
```

---

# Running the Application

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Default frontend URL:

```text
http://localhost:5173
```

---

# User Roles

## SuperAdmin

* Manage tenants
* Monitor platform activity
* View global reports
* Manage system resources

## TenantAdmin

* Manage events
* Manage venues
* Manage tickets
* Manage staff
* View reports

## Staff

* Support event operations
* Manage attendees
* Assist administrators

## Buyer

* Browse events
* Purchase tickets
* View bookings
* Submit reviews

---

# Future Improvements

* Dark Mode
* Internationalization (i18n)
* Real-Time Notifications
* QR Ticket Scanner
* Mobile Responsive Enhancements
* PWA Support
* Offline Mode
* Advanced Dashboard Visualizations

---

# Conclusion

Eventix Frontend provides a scalable and maintainable React-based client application designed for a distributed multi-tenant event management platform. Through Context API, protected routing, modular services, and tenant-aware communication, the frontend delivers a secure and responsive user experience while remaining fully decoupled from the backend infrastructure.
