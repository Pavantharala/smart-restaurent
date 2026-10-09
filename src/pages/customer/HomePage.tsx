//
// SMART CAFE - CUSTOMER HOME PAGE
//
// PHASE 13.1
//
// This is the main customer landing page.
//
// It connects the homepage to:
// - MenuContext
// - TableContext
// - Existing customer routes
//
// IMPORTANT:
// The homepage does NOT create new order/table/gaming logic.
// It only provides a better entry point into features
// that already exist.
//

import { Link } from "react-router-dom";

import { useMenu } from "../../context/MenuContext";
import { useTable } from "../../context/TableContext";

export default function HomePage() {
  // =========================================================
  // EXISTING APPLICATION DATA
  // =========================================================

  const { menuItems } = useMenu();

  const { selectedTable } = useTable();

  // =========================================================
  // FEATURED MENU ITEMS
  //
  // For now we simply take the first 4 available items.
  //
  // Later we can add:
  // - Popular items
  // - Best sellers
  // - Admin-controlled featured items
  // =========================================================

  const featuredItems = menuItems
    .filter((item) => item.isAvailable)
    .slice(0, 4);

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="smart-cafe-home">

      {/* =====================================================
          HERO SECTION
      ===================================================== */}

      <section className="home-hero">

        <div className="home-hero-content">

          <p className="home-eyebrow">
            WELCOME TO SMART CAFE
          </p>

          <h1>
            Eat. Play. Relax.
          </h1>

          <p className="home-hero-description">
            Enjoy delicious food, refreshing drinks, gaming,
            and a smarter cafe experience.
          </p>

          <div className="home-hero-actions">

            <Link
              to="/menu"
              className="primary-button"
            >
              🍔 Order Food
            </Link>

            <Link
              to="/games"
              className="secondary-button"
            >
              🎮 Play Games
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          CURRENT TABLE
      ===================================================== */}

      {selectedTable && (
        <section className="home-table-card">

          <div>
            <p className="home-section-label">
              YOUR TABLE
            </p>

            <h2>
              Table {selectedTable.number}
            </h2>

            <p>
              Capacity: {selectedTable.capacity} people
            </p>
          </div>

          <Link
            to="/menu"
            className="primary-button"
          >
            Start Ordering
          </Link>

        </section>
      )}

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section className="home-section">

        <div className="home-section-heading">

          <p className="home-section-label">
            QUICK ACCESS
          </p>

          <h2>
            What would you like to do?
          </h2>

        </div>

        <div className="home-quick-grid">

          {/* ORDER FOOD */}

          <Link
            to="/menu"
            className="home-action-card"
          >
            <span className="home-action-icon">
              🍔
            </span>

            <h3>
              Order Food
            </h3>

            <p>
              Browse our menu and order your favourite food.
            </p>
          </Link>

          {/* GAMES */}

          <Link
            to="/games"
            className="home-action-card"
          >
            <span className="home-action-icon">
              🎮
            </span>

            <h3>
              Play Games
            </h3>

            <p>
              Enjoy gaming while your cafe experience continues.
            </p>
          </Link>

          {/* WAITING LOUNGE */}

          <Link
            to="/waiting-lounge"
            className="home-action-card"
          >
            <span className="home-action-icon">
              🛋️
            </span>

            <h3>
              Waiting Lounge
            </h3>

            <p>
              No table available? Relax and enjoy the lounge.
            </p>
          </Link>

          {/* MY ORDERS */}

          <Link
            to="/orders"
            className="home-action-card"
          >
            <span className="home-action-icon">
              📦
            </span>

            <h3>
              My Orders
            </h3>

            <p>
              Track your current and previous orders.
            </p>
          </Link>

        </div>

      </section>

      {/* =====================================================
          FEATURED FOOD
      ===================================================== */}

      <section className="home-section">

        <div className="home-section-heading home-heading-row">

          <div>

            <p className="home-section-label">
              FEATURED
            </p>

            <h2>
              Popular from our menu
            </h2>

          </div>

          <Link
            to="/menu"
            className="home-view-all"
          >
            View Menu →
          </Link>

        </div>

        <div className="home-food-grid">

          {featuredItems.map((item) => (

            <Link
              key={item.id}
              to={`/menu/${item.id}`}
              className="home-food-card"
            >

              {/* IMAGE */}

              <div className="home-food-image">

                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                ) : (
                  <span>
                    🍽️
                  </span>
                )}

              </div>

              {/* INFORMATION */}

              <div className="home-food-content">

                <p className="home-food-category">
                  {item.category}
                </p>

                <h3>
                  {item.name}
                </h3>

                <p className="home-food-description">
                  {item.description ||
                    "Deliciously prepared just for you."}
                </p>

                <strong>
                  ₹{item.price}
                </strong>

              </div>

            </Link>

          ))}

        </div>

      </section>

      {/* =====================================================
          SMART CAFE EXPERIENCE
      ===================================================== */}

      <section className="home-experience">

        <div className="home-experience-content">

          <p className="home-section-label">
            MORE THAN A CAFE
          </p>

          <h2>
            Eat, play, relax and enjoy.
          </h2>

          <p>
            Smart Cafe combines great food with gaming,
            comfortable waiting areas and a simple digital
            ordering experience.
          </p>

          <div className="home-experience-actions">

            <Link
              to="/menu"
              className="primary-button"
            >
              Explore Menu
            </Link>

            <Link
              to="/waiting-lounge"
              className="secondary-button"
            >
              Visit Waiting Lounge
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}