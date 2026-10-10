
//
// SMART CAFE - CUSTOMER LAYOUT
// Shared header, navigation, page content and footer.
//

import { Link, Outlet } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";

export default function CustomerLayout() {
  const { settings } = useSettings();

  return (
    <div className="customer-layout">
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

          {settings.luckyDrawEnabled && (
            <Link to="/lucky-draw">Lucky Draw</Link>
          )}
        </nav>
      </header>

      <main className="customer-content">
        <Outlet />
      </main>

      <footer className="customer-footer">
        <p>© 2026 Smart Cafe</p>
        <p>Eat • Play • Enjoy</p>
      </footer>
    </div>
  );
}
