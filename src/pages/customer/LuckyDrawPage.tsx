// ============================================================
// SMART CAFE - CUSTOMER LUCKY DRAW
// Phase 20.3: Customer entry and eligibility feedback.
//
// IMPORTANT:
// LuckyDrawProvider is provided globally in main.tsx.
// Do not create another provider inside this page.
// ============================================================

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useSettings } from "../../context/SettingsContext";
import { useLuckyDraw } from "../../context/LuckyDrawContext";

import "./LuckyDrawPage.css";

// ============================================================
// PAGE CONTENT
// ============================================================

export default function LuckyDrawPage() {
  const { settings } = useSettings();

  const { enterLuckyDraw, hasEntered, config, prizes } =
    useLuckyDraw();

  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  // ----------------------------------------------------------
  // HANDLE CUSTOMER ENTRY
  // ----------------------------------------------------------

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = enterLuckyDraw(orderId);

    setMessage(result.message);
    setMessageType(result.success ? "success" : "error");

    if (result.success) {
      setOrderId(orderId.trim());
    }
  }

  // ----------------------------------------------------------
  // CAMPAIGN DATE DISPLAY
  // ----------------------------------------------------------

  const formatDate = (date: string) => {
    if (!date) {
      return "";
    }

    // Use a local date to avoid shifting the date due to UTC.
    const [year, month, day] = date.split("-").map(Number);

    if (!year || !month || !day) {
      return date;
    }

    return new Date(year, month - 1, day).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    );
  };

  const alreadyEntered =
    orderId.trim().length > 0 && hasEntered(orderId);

  // ----------------------------------------------------------
  // DISABLED PAGE
  // ----------------------------------------------------------

  if (!settings.luckyDrawEnabled) {
    return (
      <section className="lucky-draw-page">
        <div className="lucky-draw-card">
          <div className="lucky-draw-icon">🎁</div>

          <h1>Lucky Draw</h1>

          <p className="lucky-draw-description">
            The Lucky Draw is currently unavailable.
            Please check again later.
          </p>

          <Link className="lucky-draw-link" to="/">
            Back to Home
          </Link>
        </div>
      </section>
    );
  }

  // ----------------------------------------------------------
  // ENABLED PAGE
  // ----------------------------------------------------------

  return (
    <section className="lucky-draw-page">
      <div className="lucky-draw-card">
        <div className="lucky-draw-icon">🎉</div>

        <p className="lucky-draw-eyebrow">
          SMART CAFE SPECIAL
        </p>

        <h1>Lucky Draw</h1>

        <p className="lucky-draw-description">
          Complete an eligible Smart Cafe order and enter
          for a chance to participate in our Lucky Draw.
        </p>

        <div className="lucky-draw-status">
          <span className="lucky-draw-status-dot" />
          Lucky Draw is enabled
        </div>

        {/* --------------------------------------------------
            CAMPAIGN DETAILS
        -------------------------------------------------- */}

        {(config.startDate || config.endDate) && (
          <div className="lucky-draw-rules">
            <h2>Campaign dates</h2>

            <p>
              {config.startDate
                ? `Starts: ${formatDate(config.startDate)}`
                : "Start date: No restriction"}
            </p>

            <p>
              {config.endDate
                ? `Ends: ${formatDate(config.endDate)}`
                : "End date: No restriction"}
            </p>
          </div>
        )}

        {/* --------------------------------------------------
            ENTRY RULES
        -------------------------------------------------- */}

        <div className="lucky-draw-rules">
          <h2>Entry rules</h2>

          <ul>
            <li>
              Eligible orders: Dine-in, Waiting Lounge and
              Takeaway.
            </li>

            <li>
              Minimum subtotal:{" "}
              <strong>
                ₹{config.minimumSubtotal.toLocaleString("en-IN")}
                {" "}before tax
              </strong>.
            </li>

            <li>
              Maximum subtotal:{" "}
              <strong>
                ₹{config.maximumSubtotal.toLocaleString("en-IN")}
              </strong>.
            </li>

            <li>
              At least one ordered item must be priced between{" "}
              <strong>
                ₹{config.minimumItemPrice.toLocaleString("en-IN")}
                {" "}and ₹
                {config.maximumItemPrice.toLocaleString("en-IN")}
              </strong>.
            </li>

            <li>
              Your order must have status{" "}
              <strong>Completed</strong>.
            </li>

            <li>
              <strong>One entry per order.</strong>
            </li>

            <li>
              Each qualifying order receives{" "}
              <strong>
                {config.ticketsPerEntry} ticket(s)
              </strong>.
            </li>
          </ul>
        </div>

        {/* --------------------------------------------------
            ACTIVE PRIZES
        -------------------------------------------------- */}

        {prizes.some((prize) => prize.active) && (
          <div className="lucky-draw-rules">
            <h2>Available prizes</h2>

            <ul>
              {prizes
                .filter((prize) => prize.active)
                .map((prize) => (
                  <li key={prize.id}>
                    <strong>{prize.name}</strong>
                    {prize.description
                      ? ` — ${prize.description}`
                      : ""}
                    {` (Quantity: ${prize.quantity})`}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* --------------------------------------------------
            ENTRY FORM
        -------------------------------------------------- */}

        <form
          className="lucky-draw-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="lucky-draw-order-id">
            Enter your order ID
          </label>

          <input
            id="lucky-draw-order-id"
            name="orderId"
            type="text"
            value={orderId}
            onChange={(event) => {
              setOrderId(event.target.value);
              setMessage("");
              setMessageType("");
            }}
            placeholder="Example: SC1001"
            autoComplete="off"
            required
            disabled={alreadyEntered}
          />

          <button
            className="lucky-draw-enter-button"
            type="submit"
            disabled={alreadyEntered}
          >
            {alreadyEntered
              ? "Order Already Entered"
              : "Enter Lucky Draw"}
          </button>
        </form>

        {/* --------------------------------------------------
            ENTRY RESULT
        -------------------------------------------------- */}

        {message && (
          <p
            className={`lucky-draw-message ${
              messageType === "success"
                ? "is-success"
                : "is-error"
            }`}
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}

        {alreadyEntered && !message && (
          <p
            className="lucky-draw-message is-success"
            role="status"
          >
            This order has already been entered.
          </p>
        )}

        <p className="lucky-draw-footnote">
          Eligibility is checked against the order stored in
          Smart Cafe. Keep your order ID for reference.
        </p>

        <Link className="lucky-draw-link" to="/orders">
          View My Orders
        </Link>
      </div>
    </section>
  );
}