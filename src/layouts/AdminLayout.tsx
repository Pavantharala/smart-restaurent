// ============================================================
// SMART CAFE - ADMIN LAYOUT
// ============================================================

import { Link, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">☕</span>

          <div>
            <strong>Smart Cafe</strong>
            <small>Admin Panel</small>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/menu">Menu Management</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/tables">Tables</Link>
          <Link to="/admin/reservations">Reservations</Link>
          <Link to="/admin/gaming">Gaming</Link>
          <Link to="/admin/queue">Waiting Queue</Link>
          <Link to="/admin/customers">Customers</Link>

          {/* Phase 20: Lucky Draw campaign and prize management */}
          <Link to="/admin/lucky-draw">Lucky Draw</Link>

          <Link to="/admin/settings">Settings</Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}