
//
// SMART CAFE - STAFF LAYOUT
//
// Provides navigation for cafe staff.
// Styling remains in App.css or the existing staff CSS.
//

import { NavLink, Outlet } from "react-router-dom";

export default function StaffLayout() {
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    `staff-nav-link${isActive ? " active" : ""}`;

  return (
    <div className="staff-layout">
      {/* STAFF HEADER */}
      <header className="staff-header">
        <div className="staff-brand">
          <span>☕</span>

          <div>
            <strong>Smart Cafe</strong>
            <small>Staff Panel</small>
          </div>
        </div>

        {/* STAFF NAVIGATION */}
        <nav className="staff-nav">
          <NavLink
            to="/staff"
            end
            className={getNavClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/staff/kitchen"
            className={getNavClass}
          >
            Kitchen
          </NavLink>

          <NavLink
            to="/staff/tables"
            className={getNavClass}
          >
            Tables
          </NavLink>

          <NavLink
            to="/staff/queue"
            className={getNavClass}
          >
            Queue
          </NavLink>

          <NavLink
            to="/staff/reservations"
            className={getNavClass}
          >
            Reservations
          </NavLink>
        </nav>
      </header>

      {/* STAFF PAGE CONTENT */}
      <main className="staff-content">
        <Outlet />
      </main>
    </div>
  );
}