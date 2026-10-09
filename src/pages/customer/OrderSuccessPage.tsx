// =========================================================
// SMART CAFE - ORDER SUCCESS PAGE
// =========================================================
//
// Displays the order confirmation after checkout.
//
// Shows:
// - Order ID
// - Customer
// - Table number for dine-in
// - Order type
// - Payment
// - Total
// - Status
//
// Gaming is intentionally NOT started here yet.
// =========================================================

import {
  Link,
  useParams,
} from "react-router-dom";

import { useOrder } from "../../context/OrderContext";

import { getTableById } from "../../data/tables";

import { formatCurrency } from "../../utils/formatCurrency";

import OrderStatusTracker from "../../components/orders/OrderStatusTracker";

export default function OrderSuccessPage() {

  // =======================================================
  // ORDER ID
  // =======================================================

  const {
    orderId,
  } = useParams<{
    orderId: string;
  }>();

  // =======================================================
  // ORDER CONTEXT
  // =======================================================

  const {
    getOrderById,
  } = useOrder();

  // =======================================================
  // GET ORDER
  // =======================================================

  const order =
    orderId
      ? getOrderById(orderId)
      : undefined;

  // =======================================================
  // ORDER NOT FOUND
  // =======================================================

  if (!order) {
    return (
      <main className="page-container">

        <div className="empty-state">

          <h1>
            Order Not Found
          </h1>

          <p>
            We could not find this order
            in the current browser.
          </p>

          <Link
            to="/orders"
            className="primary-button"
          >
            View Orders
          </Link>

        </div>

      </main>
    );
  }

  // =======================================================
  // PAYMENT TEXT
  // =======================================================

  const paymentText =
    order.paymentStatus === "paid"
      ? "Payment Successful"
      : "Payment Pending";

  // =======================================================
  // ORDER TYPE
  // =======================================================

  const orderTypeText =
    order.type === "dine-in"
      ? "Dine In"
      : order.type === "waiting-lounge"
        ? "Waiting Lounge"
        : "Takeaway";

  // =======================================================
  // FIND TABLE
  // =======================================================

  const table =
    order.tableId
      ? getTableById(order.tableId)
      : undefined;

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <main className="page-container order-success-page">

      <section className="order-success-card">

        {/* =================================================
          LIVE ORDER TRACKER

          The customer can immediately see the current
          kitchen progress after placing the order.
          ================================================= */}

          <OrderStatusTracker order={order} />

        {/* =================================================
            SUCCESS ICON
        ================================================= */}

        <div className="order-success-icon">
          ✓
        </div>

        {/* =================================================
            TITLE
        ================================================= */}

        <h1>
          Order Confirmed!
        </h1>

        <p className="order-success-message">
          Your order has been successfully
          created.
        </p>

        {/* =================================================
            ORDER ID
        ================================================= */}

        <div className="order-success-id">

          <span>
            Order ID
          </span>

          <strong>
            {order.id}
          </strong>

        </div>

        {/* =================================================
            ORDER DETAILS
        ================================================= */}

        <div className="order-success-details">

          {/* CUSTOMER */}

          <div>

            <span>
              Customer
            </span>

            <strong>
              {order.customer.name}
            </strong>

          </div>

          {/* ORDER TYPE */}

          <div>

            <span>
              Order Type
            </span>

            <strong>
              {orderTypeText}
            </strong>

          </div>

          {/* =================================================
              TABLE
          ================================================= */}

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
                    : "Table not assigned"}
              </strong>

            </div>
          )}

          {/* PAYMENT */}

          <div>

            <span>
              Payment
            </span>

            <strong>
              {paymentText}
            </strong>

          </div>

          {/* TOTAL */}

          <div>

            <span>
              Total
            </span>

            <strong>
              {formatCurrency(
                order.totalAmount,
              )}
            </strong>

          </div>

          {/* STATUS */}

          <div>

            <span>
              Status
            </span>

            <strong>
              {order.status}
            </strong>

          </div>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="order-success-actions">

          <Link
            to="/orders"
            className="primary-button"
          >
            View My Orders
          </Link>

          <Link
            to="/menu"
            className="secondary-button"
          >
            Order More
          </Link>

        </div>

      </section>

    </main>
  );
}