//
// SMART CAFE - CUSTOMER ORDERS
//
// Phase 17.8
// CUSTOMER ORDER STATUS
//
// This page displays the customer's current and previous orders.
//
// IMPORTANT ARCHITECTURE:
// - OrderContext is the single source of truth.
// - Kitchen/staff changes the order status.
// - Customer only reads the current status.
// - Payment information is visible to the customer.
//
// ORDER STATUS:
// - Created
// - Payment Pending
// - Confirmed
// - Accepted
// - Preparing
// - Ready
// - Served
// - Completed
// - Cancelled
//
// GAMING:
// - Dine-in        → Gaming allowed
// - Waiting Lounge → Gaming allowed
// - Takeaway       → Gaming not allowed
//
// =========================================================

import { Link } from "react-router-dom";

import { useOrder } from "../../context/OrderContext";
import { getTableById } from "../../data/tables";
import { formatCurrency } from "../../utils/formatCurrency";

import "./OrdersPage.css";

// =========================================================
// STATUS LABEL
//
// Converts the internal order status into customer-friendly
// text.
//
// Example:
// "payment-pending" → "Payment Pending"
// "preparing"       → "Preparing"
// =========================================================

function getStatusLabel(status: string) {
  switch (status) {
    case "created":
      return "Created";

    case "payment-pending":
      return "Payment Pending";

    case "confirmed":
      return "Confirmed";

    case "accepted":
      return "Accepted";

    case "preparing":
      return "Preparing";

    case "ready":
      return "Ready";

    case "served":
      return "Served";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        );
  }
}

// =========================================================
// CUSTOMER STATUS MESSAGE
//
// Gives the customer a useful explanation of the current
// order status.
//
// This is only presentation logic.
// It does NOT change the order.
//
// =========================================================

function getStatusMessage(status: string) {
  switch (status) {
    case "created":
      return "Your order has been created.";

    case "payment-pending":
      return "Payment is pending before this order can continue.";

    case "confirmed":
      return "Your order has been confirmed and is waiting for the kitchen.";

    case "accepted":
      return "The kitchen has accepted your order.";

    case "preparing":
      return "Your food is currently being prepared.";

    case "ready":
      return "Your order is ready.";

    case "served":
      return "Your order has been served.";

    case "completed":
      return "Your order has been completed. Thank you for visiting Smart Cafe.";

    case "cancelled":
      return "This order has been cancelled.";

    default:
      return "Your order status has been updated.";
  }
}

// =========================================================
// COMPONENT
// =========================================================

export default function OrdersPage() {
  // =========================================================
  // GET ORDERS FROM ORDER CONTEXT
  //
  // The same OrderContext is used by customer and staff.
  //
  // When the kitchen changes an order status, the customer
  // page reads the updated status from the same source.
  // =========================================================

  const { orders } = useOrder();

  // =========================================================
  // EMPTY STATE
  // =========================================================

  if (orders.length === 0) {
    return (
      <main className="page-container">
        <section className="empty-state">
          <h1>My Orders</h1>

          <p>
            You have not placed any orders yet.
          </p>

          <Link
            to="/menu"
            className="primary-button"
          >
            Browse Menu
          </Link>
        </section>
      </main>
    );
  }

  // =========================================================
  // DISPLAY ORDERS
  // =========================================================

  return (
    <main className="page-container">
      <section className="orders-page">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="page-header">
          <p className="page-eyebrow">
            SMART CAFE
          </p>

          <h1>My Orders</h1>

          <p>
            View your current and previous orders.
          </p>
        </div>

        {/* =================================================
            ORDERS LIST
        ================================================= */}

        <div className="orders-list">
          {orders.map((order) => {

            // =================================================
            // FIND TABLE INFORMATION
            // =================================================

            const table = order.tableId
              ? getTableById(order.tableId)
              : undefined;

            // =================================================
            // ORDER TYPE
            // =================================================

            const orderTypeText =
              order.type === "dine-in"
                ? "Dine In"
                : order.type === "waiting-lounge"
                  ? "Waiting Lounge"
                  : "Takeaway";

            // =================================================
            // PAYMENT STATUS
            // =================================================

            const paymentText =
              order.paymentStatus === "paid"
                ? "Paid"
                : order.paymentStatus === "pending"
                  ? "Pending"
                  : order.paymentStatus === "failed"
                    ? "Failed"
                    : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : order.paymentStatus;

            // =================================================
            // ORDER STATUS
            // =================================================

            const statusText =
              getStatusLabel(order.status);

            const statusMessage =
              getStatusMessage(order.status);

            // =================================================
            // DATE / TIME
            // =================================================

            const orderDate = new Date(
              order.createdAt,
            );

            const formattedDate =
              orderDate.toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              );

            const formattedTime =
              orderDate.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

            // =================================================
            // GAMING ACCESS
            //
            // Dine-in and Waiting Lounge are eligible.
            // Takeaway is not eligible.
            // =================================================

            const canPlayGames =
              order.type === "dine-in" ||
              order.type === "waiting-lounge";

            // =================================================
            // RETURN ORDER CARD
            // =================================================

            return (
              <article
                key={order.id}
                className="order-card"
              >

                {/* =========================================
                    ORDER HEADER
                ========================================== */}

                <div className="order-card-header">
                  <div>
                    <span className="order-label">
                      Order ID
                    </span>

                    <strong>
                      {order.id}
                    </strong>
                  </div>

                  <div className="order-date">
                    <span>
                      {formattedDate}
                    </span>

                    <span>
                      {formattedTime}
                    </span>
                  </div>
                </div>

                {/* =========================================
                    CURRENT ORDER STATUS
                ========================================== */}

                <div className="customer-order-status">

                  <span className="order-label">
                    Current Order Status
                  </span>

                  <h3>
                    {statusText}
                  </h3>

                  <p className="order-status-message">
                    {statusMessage}
                  </p>

                </div>

                {/* =========================================
                    ORDER INFORMATION
                ========================================== */}

                <div className="order-info-grid">

                  <div>
                    <span>
                      Order Type
                    </span>

                    <strong>
                      {orderTypeText}
                    </strong>
                  </div>

                  {/* ---------------------------------------
                      TABLE
                  ---------------------------------------- */}

                  {order.type === "dine-in" && (
                    <div>
                      <span>
                        Table
                      </span>

                      <strong>
                        {table
                          ? `Table ${table.number}`
                          : order.tableId
                            ? order.tableId
                            : "Not assigned"}
                      </strong>
                    </div>
                  )}

                  {/* ---------------------------------------
                      PAYMENT
                  ---------------------------------------- */}

                  <div>
                    <span>
                      Payment
                    </span>

                    <strong>
                      {paymentText}
                    </strong>
                  </div>

                  {/* ---------------------------------------
                      STATUS
                  ---------------------------------------- */}

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {statusText}
                    </strong>
                  </div>

                </div>

                {/* =========================================
                    ORDER ITEMS
                ========================================== */}

                <div className="order-items">

                  <h3>
                    Items
                  </h3>

                  {order.items.map(
                    (item, index) => (
                      <div
                        key={`${order.id}-${item.menuItemId}-${index}`}
                        className="order-item-row"
                      >

                        <div>
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            Qty: {item.quantity}
                          </span>
                        </div>

                        <strong>
                          {formatCurrency(
                            item.unitPrice *
                              item.quantity,
                          )}
                        </strong>

                      </div>
                    ),
                  )}

                </div>

                {/* =========================================
                    ORDER FOOTER
                ========================================== */}

                <div className="order-card-footer">

                  <div>
                    <span>
                      Total Amount
                    </span>

                    <strong>
                      {formatCurrency(
                        order.totalAmount,
                      )}
                    </strong>
                  </div>

                  {/* =======================================
                      ACTION BUTTONS
                  ====================================== */}

                  <div className="order-action-buttons">

                    {/* -------------------------------------
                        PLAY GAMES
                    -------------------------------------- */}

                    {canPlayGames &&
                      order.status !== "cancelled" && (
                        <Link
                          to={`/games?order=${order.id}`}
                          className="primary-button"
                        >
                          🎮 Play Games
                        </Link>
                      )}

                    {/* -------------------------------------
                        VIEW ORDER
                    -------------------------------------- */}

                    <Link
                      to={`/order-success/${order.id}`}
                      className="secondary-button"
                    >
                      View Order
                    </Link>

                  </div>

                </div>

              </article>
            );
          })}
        </div>

      </section>
    </main>
  );
}