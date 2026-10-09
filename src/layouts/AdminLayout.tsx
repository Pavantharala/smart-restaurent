//
// SMART CAFE - ADMIN LAYOUT
//
// This layout is used by the cafe owner/administrator.
//
// Admin will eventually manage:
//
// Dashboard
// Menu
// Products
// Orders
// Tables
// Reservations
// Gaming
// Waiting Queue
// Customers
// Staff
// Offers
// Reports
// Settings
//
// IMPORTANT:
// The actual permission/security system will be implemented
// later when authentication/backend is added.
//
// For now this is only the UI architecture.
//

import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-layout">

      {/* --------------------------------------------------
          ADMIN SIDEBAR

          The sidebar contains the main cafe management
          sections.

          More advanced permission-based navigation will be
          added later with authentication/backend.
      -------------------------------------------------- */}

      <aside className="admin-sidebar">

        {/* ------------------------------------------------
            ADMIN BRAND
        ------------------------------------------------ */}

        <div className="admin-brand">
          <span className="admin-brand-icon">
            ☕
          </span>

          <div>
            <strong>Smart Cafe</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        {/* ------------------------------------------------
            ADMIN NAVIGATION
        ------------------------------------------------ */}

        <nav className="admin-nav">

          {/* DASHBOARD */}

          <Link to="/admin">
            Dashboard
          </Link>

          {/* MENU */}

          <Link to="/admin/menu">
            Menu Management
          </Link>

          {/* ORDERS */}

          <Link to="/admin/orders">
            Orders
          </Link>

          {/* TABLES */}

          <Link to="/admin/tables">
            Tables
          </Link>

          {/* RESERVATIONS */}

          <Link to="/admin/reservations">
            Reservations
          </Link>

          {/* GAMING */}

          <Link to="/admin/gaming">
            Gaming
          </Link>

          {/* WAITING QUEUE */}

          <Link to="/admin/queue">
            Waiting Queue
          </Link>

          {/* CUSTOMERS */}

          <Link to="/admin/customers">
            Customers
          </Link>

          {/* SETTINGS */}

          <Link to="/admin/settings">
            Settings
          </Link>

        </nav>
      </aside>

      {/* --------------------------------------------------
          ADMIN MAIN CONTENT

          Individual admin pages are rendered here using
          React Router's Outlet.
      -------------------------------------------------- */}

      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
}