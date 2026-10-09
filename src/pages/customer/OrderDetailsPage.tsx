//
// SMART CAFE - ORDER DETAILS
//
// Shows detailed information about one customer order.
//
// FEATURES:
// - Order ID
// - Order date/time
// - Order type
// - Table number
// - Payment status
// - Order status timeline
// - Ordered items
// - Total amount
// - Back to My Orders
//

import { Link, useParams } from "react-router-dom";

import { useOrder } from "../../context/OrderContext";
import { getTableById } from "../../data/tables";
import { formatCurrency } from "../../utils/formatCurrency";

export default function OrderDetailsPage() {
  // =========================================================
  // GET ORDER ID FROM URL
  // =========================================================

  const { orderId } =
    useParams<{ orderId: string }>();

  // =========================================================
  // GET ORDER CONTEXT
  // =========================================================

  const { getOrderById } = useOrder();

  // =========================================================
  // FIND ORDER
  // =========================================================

  const order = orderId
    ? getOrderById(orderId)
    : undefined;

  // =========================================================
  // ORDER NOT FOUND
  // =========================================================

  if (!order) {
    return (
      <main className="page-container">
        <section className="empty-state">
          <h1>Order Not Found</h1>

          <p>
            We could not find this order in the current
            browser.
          </p>

          <Link
            to="/orders"
            className="primary-button"
          >
            Back to My Orders
          </Link>
        </section>
      </main>
    );
  }

  // =========================================================
  // TABLE
  // =========================================================

  const table = order.tableId
    ? getTableById(order.tableId)
    : undefined;

  // =========================================================
  // ORDER TYPE
  // =========================================================

  const orderTypeText =
    order.type === "dine-in"
      ? "Dine In"
      : order.type === "waiting-lounge"
        ? "Waiting Lounge"
        : "Takeaway";

  // =========================================================
  // PAYMENT
  // =========================================================

  const paymentText =
    order.paymentStatus === "paid"
      ? "Paid"
      : order.paymentStatus === "pending"
        ? "Pending"
        : order.paymentStatus;

  // =========================================================
  // STATUS
  // =========================================================

  const statusText = order.status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );

  // =========================================================
  // DATE / TIME
  // =========================================================

  const orderDate =
    new Date(order.createdAt);

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

  // =========================================================
  // ORDER STATUS STEPS
  // =========================================================

  const statusSteps = [
    {
      key: "created",
      label: "Order Placed",
    },
    {
      key: "confirmed",
      label: "Confirmed",
    },
    {
      key: "preparing",
      label: "Preparing",
    },
    {
      key: "ready",
      label: "Ready",
    },
    {
      key: "served",
      label: "Served",
    },
    {
      key: "completed",
      label: "Completed",
    },
  ];

  // =========================================================
  // FIND CURRENT STATUS INDEX
  // =========================================================

  const currentStatusIndex =
    statusSteps.findIndex(
      (step) =>
        step.key === order.status,
    );

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="page-container">
      <section className="order-details-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="page-header">
          <p className="page-eyebrow">
            SMART CAFE
          </p>

          <h1>Order Details</h1>

          <p>
            Track your order and view all order
            information.
          </p>
        </div>

        {/* ===================================================
            ORDER HEADER CARD
        =================================================== */}

        <section className="order-details-card">

          <div className="order-details-header">
            <div>
              <span>Order ID</span>

              <strong>
                {order.id}
              </strong>
            </div>

            <div>
              <span>Date</span>

              <strong>
                {formattedDate}
              </strong>
            </div>

            <div>
              <span>Time</span>

              <strong>
                {formattedTime}
              </strong>
            </div>
          </div>

          {/* =================================================
              ORDER INFORMATION
          ================================================= */}

          <div className="order-info-grid">

            <div>
              <span>Customer</span>

              <strong>
                {order.customer.name}
              </strong>
            </div>

            <div>
              <span>Order Type</span>

              <strong>
                {orderTypeText}
              </strong>
            </div>

            {order.type === "dine-in" && (
              <div>
                <span>Table</span>

                <strong>
                  {table
                    ? `Table ${table.number}`
                    : order.tableId ||
                      "Not assigned"}
                </strong>
              </div>
            )}

            <div>
              <span>Payment</span>

              <strong>
                {paymentText}
              </strong>
            </div>

            <div>
              <span>Payment Method</span>

              <strong>
                {order.paymentMethod.toUpperCase()}
              </strong>
            </div>

            <div>
              <span>Current Status</span>

              <strong>
                {statusText}
              </strong>
            </div>

          </div>
        </section>

        {/* ===================================================
            ORDER TRACKING
        =================================================== */}

        <section className="order-tracking-card">

          <div className="section-heading">
            <h2>Order Tracking</h2>

            <p>
              Follow the progress of your order.
            </p>
          </div>

          <div className="order-status-timeline">

            {statusSteps.map(
              (step, index) => {

                const isCompleted =
                  currentStatusIndex >=
                  index;

                const isCurrent =
                  currentStatusIndex ===
                  index;

                return (
                  <div
                    key={step.key}
                    className={`order-status-step ${
                      isCompleted
                        ? "completed"
                        : ""
                    } ${
                      isCurrent
                        ? "current"
                        : ""
                    }`}
                  >

                    <div className="order-status-circle">
                      {isCompleted
                        ? "✓"
                        : index + 1}
                    </div>

                    <div>
                      <strong>
                        {step.label}
                      </strong>

                      {isCurrent && (
                        <span>
                          Current status
                        </span>
                      )}
                    </div>

                  </div>
                );
              },
            )}

          </div>
        </section>

        {/* ===================================================
            ITEMS
        =================================================== */}

        <section className="order-details-card">

          <div className="section-heading">
            <h2>Ordered Items</h2>
          </div>

          <div className="order-items">

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

                    {item.customizations.length >
                      0 && (
                      <span>
                        Customizations:{" "}
                        {item.customizations
                          .map(
                            (customization) =>
                              customization.name,
                          )
                          .join(", ")}
                      </span>
                    )}
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
        </section>

        {/* ===================================================
            BILL SUMMARY
        =================================================== */}

        <section className="order-summary-card">

          <div>
            <span>Subtotal</span>

            <strong>
              {formatCurrency(
                order.subtotal,
              )}
            </strong>
          </div>

          <div>
            <span>Tax</span>

            <strong>
              {formatCurrency(
                order.taxAmount,
              )}
            </strong>
          </div>

          <div className="order-total">
            <span>Total</span>

            <strong>
              {formatCurrency(
                order.totalAmount,
              )}
            </strong>
          </div>

        </section>

        {/* ===================================================
            ACTIONS
        =================================================== */}

        <div className="order-details-actions">

          <Link
            to="/orders"
            className="secondary-button"
          >
            Back to My Orders
          </Link>

          <Link
            to="/menu"
            className="primary-button"
          >
            Order More
          </Link>

        </div>

      </section>
    </main>
  );
}