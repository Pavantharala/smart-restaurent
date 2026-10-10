
import { Link } from "react-router-dom";

import {
  Check,
  Clock,
  Gamepad2,
  MapPin,
  Ticket,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { useQueue } from "../../context/QueueContext";
import { useTable } from "../../context/TableContext";
import { useOrder } from "../../context/OrderContext";
import QueueReadyNotification from "../../components/QueueReadyNotification";

// =========================================================
// SMART CAFE - CUSTOMER WAITING LOUNGE
// =========================================================

const CURRENT_QUEUE_ENTRY_KEY =
  "smart-cafe-current-queue-entry";

const ORDER_PROGRESS_STEPS = [
  {
    status: "confirmed",
    title: "Order Confirmed",
    description: "Your order has been confirmed.",
  },
  {
    status: "accepted",
    title: "Order Accepted",
    description: "The cafe has accepted your order.",
  },
  {
    status: "preparing",
    title: "Preparing",
    description: "The kitchen is preparing your food.",
  },
  {
    status: "ready",
    title: "Ready",
    description: "Your order is ready.",
  },
  {
    status: "served",
    title: "Served",
    description: "Your order has been served.",
  },
  {
    status: "completed",
    title: "Completed",
    description: "Your order is completed.",
  },
] as const;

export default function WaitingLoungePage() {
  // -------------------------------------------------------
  // CONTEXT DATA
  // -------------------------------------------------------

  const { queue } = useQueue();
  const { tables } = useTable();
  const { getOrderById } = useOrder();

  // -------------------------------------------------------
  // FIND CURRENT QUEUE ENTRY
  // -------------------------------------------------------

  const queueEntryId = localStorage.getItem(
    CURRENT_QUEUE_ENTRY_KEY,
  );

  const queueEntry = queue.find(
    (entry) => entry.id === queueEntryId,
  );

  // -------------------------------------------------------
  // FIND ASSIGNED TABLE
  // -------------------------------------------------------

  const assignedTable = queueEntry?.assignedTableId
    ? tables.find(
        (table) =>
          table.id === queueEntry.assignedTableId,
      )
    : undefined;

  // -------------------------------------------------------
  // FIND CONNECTED ORDER
  // -------------------------------------------------------

  const order = queueEntry?.orderId
    ? getOrderById(queueEntry.orderId)
    : undefined;

  // -------------------------------------------------------
  // EMPTY STATE
  // -------------------------------------------------------

  if (!queueEntry) {
    return (
      <main className="waiting-lounge-page">
        <section className="waiting-lounge-empty">
          <div className="waiting-lounge-empty-icon">
            <Clock size={40} />
          </div>

          <h1>No Active Waiting Queue</h1>

          <p>
            You currently don't have an active
            waiting lounge entry.
          </p>

          <Link
            to="/menu"
            className="waiting-lounge-button"
          >
            Browse Menu
          </Link>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------
  // QUEUE STATUS
  // -------------------------------------------------------

  const statusLabel =
    queueEntry.status === "waiting"
      ? "Waiting for a Table"
      : queueEntry.status === "table-ready"
        ? "Your Table Is Ready"
        : queueEntry.status === "seated"
          ? "Seated"
          : queueEntry.status === "cancelled"
            ? "Queue Cancelled"
            : "Queue Completed";

  const statusMessage =
    queueEntry.status === "waiting"
      ? "Relax in the waiting lounge while we prepare your table."
      : queueEntry.status === "table-ready"
        ? "Your table has been assigned. Please proceed to the table."
        : queueEntry.status === "seated"
          ? "Your table is ready. You can now track your order progress."
          : queueEntry.status === "cancelled"
            ? "This waiting queue entry has been cancelled."
            : "Your waiting lounge session has been completed.";

  // -------------------------------------------------------
  // ORDER PROGRESS
  // -------------------------------------------------------

  const orderStatus = order?.status;

  const currentStepIndex =
    orderStatus === "confirmed" ||
    orderStatus === "accepted" ||
    orderStatus === "preparing" ||
    orderStatus === "ready" ||
    orderStatus === "served" ||
    orderStatus === "completed"
      ? ORDER_PROGRESS_STEPS.findIndex(
          (step) => step.status === orderStatus,
        )
      : -1;

  const orderStatusMessage =
    orderStatus === "confirmed"
      ? "Your order has been confirmed."
      : orderStatus === "accepted"
        ? "The cafe has accepted your order."
        : orderStatus === "preparing"
          ? "The kitchen is preparing your food."
          : orderStatus === "ready"
            ? "Your order is ready."
            : orderStatus === "served"
              ? "Your order has been served."
              : orderStatus === "completed"
                ? "Your order has been completed."
                : "Your order is being processed.";

  const shouldShowOrderTracking =
    Boolean(order) &&
    (
      queueEntry.status === "table-ready" ||
      queueEntry.status === "seated" ||
      queueEntry.status === "completed"
    );

  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <main className="waiting-lounge-page">
      {/* HEADER */}

      <section className="waiting-lounge-header">
        <div>
          <p className="waiting-lounge-eyebrow">
            SMART CAFE
          </p>

          <h1>Waiting Lounge</h1>

          <p>
            Track your table status while you relax,
            play and enjoy your time.
          </p>
        </div>

        <div className="waiting-lounge-order">
          <span>Order</span>
          <strong>{queueEntry.orderId ?? "N/A"}</strong>
        </div>
      </section>

      {/* QUEUE-READY NOTIFICATION */}

      <QueueReadyNotification queueEntry={queueEntry} />

      {/* CUSTOMER QUEUE TOKEN */}

      <section className="waiting-lounge-token-card">
        <div className="waiting-lounge-token-icon">
          <Ticket size={28} />
        </div>

        <div className="waiting-lounge-token-content">
          <span>YOUR QUEUE TOKEN</span>

          <strong>{queueEntry.queueToken}</strong>

          <p>
            Keep this token handy when speaking with our staff.
          </p>
        </div>
      </section>

      {/* MAIN QUEUE STATUS */}

      <section className="waiting-lounge-status-card">
        <div className="waiting-lounge-status-icon">
          <Clock size={34} />
        </div>

        <div className="waiting-lounge-status-content">
          <span className="waiting-lounge-status-label">
            Current Status
          </span>

          <h2>{statusLabel}</h2>
          <p>{statusMessage}</p>
        </div>
      </section>

      {/* QUEUE INFORMATION */}

      <section className="waiting-lounge-info-grid">
        <article className="waiting-lounge-info-card">
          <div className="waiting-lounge-info-icon">
            <Users size={24} />
          </div>

          <span>Queue Position</span>

          <strong>
            {queueEntry.position > 0
              ? `#${queueEntry.position}`
              : "—"}
          </strong>
        </article>

        <article className="waiting-lounge-info-card">
          <div className="waiting-lounge-info-icon">
            <Clock size={24} />
          </div>

          <span>Estimated Wait</span>

          <strong>
            {queueEntry.estimatedWaitMinutes > 0
              ? `${queueEntry.estimatedWaitMinutes} min`
              : "Ready"}
          </strong>
        </article>

        <article className="waiting-lounge-info-card">
          <div className="waiting-lounge-info-icon">
            <Users size={24} />
          </div>

          <span>Party Size</span>

          <strong>{queueEntry.partySize}</strong>
        </article>

        <article className="waiting-lounge-info-card">
          <div className="waiting-lounge-info-icon">
            <MapPin size={24} />
          </div>

          <span>Assigned Table</span>

          <strong>
            {assignedTable
              ? `Table ${assignedTable.number}`
              : "Waiting"}
          </strong>
        </article>
      </section>

      {/* TABLE-READY DETAILS */}

      {queueEntry.status === "table-ready" && (
        <section className="waiting-lounge-ready-card">
          <div>
            <MapPin size={32} />

            <div>
              <h2>Your Table Is Ready!</h2>

              <p>
                Please proceed to{" "}
                <strong>
                  {assignedTable
                    ? `Table ${assignedTable.number}`
                    : "your assigned table"}
                </strong>.
              </p>

              <p>
                Queue Token:{" "}
                <strong>{queueEntry.queueToken}</strong>
              </p>
            </div>
          </div>

          <Link
            to="/orders"
            className="waiting-lounge-button"
          >
            View Order
          </Link>
        </section>
      )}

      {/* ORDER PROGRESS */}

      {shouldShowOrderTracking && order && (
        <section className="waiting-lounge-order-progress">
          <div className="waiting-lounge-progress-header">
            <div>
              <span className="waiting-lounge-progress-eyebrow">
                ORDER PROGRESS
              </span>

              <h2>Track Your Order</h2>
            </div>

            <div className="waiting-lounge-progress-status">
              {order.status}
            </div>
          </div>

          <div className="waiting-lounge-progress-steps">
            {ORDER_PROGRESS_STEPS.map((step, index) => {
              const isCompleted = currentStepIndex >= index;
              const isCurrent = currentStepIndex === index;

              return (
                <div
                  key={step.status}
                  className={`waiting-lounge-progress-step ${
                    isCompleted ? "completed" : ""
                  } ${isCurrent ? "current" : ""}`}
                >
                  <div className="waiting-lounge-progress-marker">
                    {isCompleted ? (
                      <Check size={18} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="waiting-lounge-progress-step-content">
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="waiting-lounge-current-order-message">
            <strong>{orderStatusMessage}</strong>
          </div>

          {/* ORDER SUMMARY */}

          <div className="waiting-lounge-order-summary">
            <div>
              <span>Order ID</span>
              <strong>{order.id}</strong>
            </div>

            <div>
              <span>Customer</span>
              <strong>{order.customer.name}</strong>
            </div>

            <div>
              <span>Order Type</span>
              <strong>Waiting Lounge</strong>
            </div>

            <div>
              <span>Table</span>
              <strong>
                {assignedTable
                  ? `Table ${assignedTable.number}`
                  : "Table not assigned"}
              </strong>
            </div>

            <div>
              <span>Payment</span>
              <strong>
                {order.paymentStatus === "paid"
                  ? "Payment Successful"
                  : order.paymentStatus === "pending"
                    ? "Payment Pending"
                    : order.paymentStatus}
              </strong>
            </div>

            <div>
              <span>Total</span>
              <strong>
                ₹{order.totalAmount.toFixed(0)}
              </strong>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="waiting-lounge-order-actions">
            <Link
              to="/orders"
              className="waiting-lounge-button"
            >
              View My Orders
            </Link>

            <Link
              to="/menu"
              className="waiting-lounge-secondary-button"
            >
              Order More
            </Link>
          </div>
        </section>
      )}

      {/* GAMING SECTION */}

      {(queueEntry.status === "waiting" ||
        queueEntry.status === "table-ready") && (
        <section className="waiting-lounge-gaming-card">
          <div className="waiting-lounge-gaming-icon">
            <Gamepad2 size={32} />
          </div>

          <div className="waiting-lounge-gaming-content">
            <span>WHILE YOU WAIT</span>

            <h2>Play Games in the Lounge</h2>

            <p>
              Your waiting time doesn't have to feel like waiting.
              Enjoy games while your table is being prepared.
            </p>

            <Link
              to="/games"
              className="waiting-lounge-secondary-button"
            >
              <Gamepad2 size={18} />
              Explore Games
            </Link>
          </div>
        </section>
      )}

      {/* FOOD PROMOTION */}

      {queueEntry.status === "waiting" && (
        <section className="waiting-lounge-addons-card">
          <div className="waiting-lounge-addons-icon">
            <UtensilsCrossed size={28} />
          </div>

          <div>
            <span>MAKE YOUR WAIT BETTER</span>

            <h2>Want Something While You Wait?</h2>

            <p>
              Add cool drinks, snacks or extra food to your order
              while relaxing in the lounge.
            </p>

            <Link
              to="/menu"
              className="waiting-lounge-secondary-button"
            >
              Browse Menu
            </Link>
          </div>
        </section>
      )}

      {/* ORDER INFORMATION */}

      <section className="waiting-lounge-order-card">
        <div>
          <span>Order ID</span>
          <strong>{queueEntry.orderId ?? "Not Available"}</strong>
        </div>

        <div>
          <span>Queue Token</span>
          <strong>{queueEntry.queueToken}</strong>
        </div>

        <div>
          <span>Joined</span>

          <strong>
            {new Date(queueEntry.joinedAt).toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            )}
          </strong>
        </div>
      </section>
    </main>
  );
}
