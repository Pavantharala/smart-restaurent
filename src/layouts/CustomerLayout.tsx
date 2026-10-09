//
// SMART CAFE - CUSTOMER LAYOUT
//
// This layout contains the common structure used by customers.
//
// Future customer pages will appear inside this layout:
//
// Home
// Menu
// Product Details
// Cart
// Checkout
// Orders
// Account
// Waiting Lounge
// Gaming
//
// IMPORTANT:
// We use React Router's <Outlet /> so individual pages can
// change without rebuilding the common header/footer.
//

import { Link, Outlet } from "react-router-dom";

export default function CustomerLayout() {
  return (
    <div className="customer-layout">
      {/* --------------------------------------------------
          CUSTOMER HEADER

          This header will eventually contain:
          - Smart Cafe logo
          - Menu navigation
          - Cart
          - Account
          - Current gaming status
          - Waiting lounge status
      -------------------------------------------------- */}
      <header className="customer-header">
        <Link to="/" className="customer-brand">
          <span className="customer-brand-icon">☕</span>

          <div>
            <strong>Smart Cafe</strong>
            <small>Food • Games • Experience</small>
          </div>
        </Link>

        <nav className="customer-nav">
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
        </nav>
      </header>

      {/* --------------------------------------------------
          PAGE CONTENT

          React Router renders the selected customer page here.
      -------------------------------------------------- */}
      <main className="customer-content">
        <Outlet />
      </main>

      {/* --------------------------------------------------
          CUSTOMER FOOTER

          More links and information will be added later.
      -------------------------------------------------- */}
      <footer className="customer-footer">
        <p>© 2026 Smart Cafe</p>
        <p>Eat • Play • Enjoy</p>
      </footer>
    </div>
  );
}