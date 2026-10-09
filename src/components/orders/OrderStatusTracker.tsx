// ============================================================
// SMART CAFE - CUSTOMER ORDER STATUS TRACKER
// ============================================================
//
// PURPOSE:
// Displays the customer's order progress.
//
// WORKFLOW:
//
// Payment Pending
//      ↓
// Confirmed
//      ↓
// Accepted
//      ↓
// Preparing
//      ↓
// Ready
//      ↓
// Served
//      ↓
// Completed
//
// This component only displays the status.
// OrderContext remains responsible for changing the status.
//
// ============================================================

import type { Order } from "../../types/Order";

import "./OrderStatusTracker.css";

// ============================================================
// PROPS
// ============================================================

interface OrderStatusTrackerProps {
  order: Order;
}

// ============================================================
// TRACKING STEPS
// ============================================================
//
// We intentionally do not show "payment-pending" as one of
// the normal food preparation steps.
//
// It is handled separately above the tracker.
//

const TRACKING_STEPS: Array<{
  status: Order["status"];
  label: string;
  description: string;
}> = [
  {
    status: "confirmed",
    label: "Order Confirmed",
    description: "Your order has been confirmed.",
  },
  {
    status: "accepted",
    label: "Order Accepted",
    description: "The cafe has accepted your order.",
  },
  {
    status: "preparing",
    label: "Preparing",
    description: "The kitchen is preparing your food.",
  },
  {
    status: "ready",
    label: "Ready",
    description: "Your order is ready.",
  },
  {
    status: "served",
    label: "Served",
    description: "Your order has been served.",
  },
  {
    status: "completed",
    label: "Completed",
    description: "Your order is completed.",
  },
];

// ============================================================
// STATUS ORDER
// ============================================================
//
// Used to determine whether a step is:
// - completed
// - current
// - upcoming
//
// ============================================================

const STATUS_INDEX: Record<Order["status"], number> = {
  created: -1,
  "payment-pending": -1,
  confirmed: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  served: 4,
  completed: 5,
  cancelled: -1,
};

// ============================================================
// COMPONENT
// ============================================================

export default function OrderStatusTracker({
  order,
}: OrderStatusTrackerProps) {
  // ==========================================================
  // PAYMENT PENDING
  // ==========================================================
  //
  // Payment-pending orders have not entered the normal kitchen
  // workflow yet.
  //
  if (order.status === "payment-pending") {
    return (
      <section className="order-status-tracker">
        <div className="order-tracker-heading">
          <div>
            <span className="order-tracker-eyebrow">
              ORDER PROGRESS
            </span>

            <h3>Payment Pending</h3>
          </div>

          <span className="order-tracker-status pending">
            Waiting
          </span>
        </div>

        <div className="order-tracker-message pending">
          Please complete payment so the cafe can confirm your
          order.
        </div>
      </section>
    );
  }

  // ==========================================================
  // CANCELLED ORDER
  // ==========================================================
  //
  // Cancelled orders should not look like normal completed
  // orders.
  //

  if (order.status === "cancelled") {
    return (
      <section className="order-status-tracker">
        <div className="order-tracker-heading">
          <div>
            <span className="order-tracker-eyebrow">
              ORDER PROGRESS
            </span>

            <h3>Order Cancelled</h3>
          </div>

          <span className="order-tracker-status cancelled">
            Cancelled
          </span>
        </div>

        <div className="order-tracker-message cancelled">
          This order has been cancelled.
        </div>
      </section>
    );
  }

  // ==========================================================
  // CURRENT STEP
  // ==========================================================

  const currentIndex = STATUS_INDEX[order.status];

  // ==========================================================
  // RENDER TRACKER
  // ==========================================================

  return (
    <section className="order-status-tracker">
      {/* ======================================================
          TRACKER HEADER
      ====================================================== */}

      <div className="order-tracker-heading">
        <div>
          <span className="order-tracker-eyebrow">
            ORDER PROGRESS
          </span>

          <h3>Track Your Order</h3>
        </div>

        <span className="order-tracker-status active">
          {TRACKING_STEPS[currentIndex]?.label ?? "Processing"}
        </span>
      </div>

      {/* ======================================================
          STATUS STEPS
      ====================================================== */}

      <div className="order-tracker-steps">
        {TRACKING_STEPS.map((step, index) => {
          // --------------------------------------------------
          // Determine the visual state of this step.
          // --------------------------------------------------

          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          const stepClass = isCompleted
            ? "completed"
            : isCurrent
              ? "current"
              : "upcoming";

          return (
            <div
              key={step.status}
              className={`order-tracker-step ${stepClass}`}
            >
              {/* =================================================
                  STEP ICON
              ================================================= */}

              <div className="order-tracker-icon">
                {isCompleted ? "✓" : index + 1}
              </div>

              {/* =================================================
                  STEP CONTENT
              ================================================= */}

              <div className="order-tracker-content">
                <strong>{step.label}</strong>

                <span>{step.description}</span>
              </div>

              {/* =================================================
                  CONNECTOR
                  
                  Do not show a connector after the final step.
              ================================================= */}

              {index < TRACKING_STEPS.length - 1 && (
                <div className="order-tracker-line" />
              )}
            </div>
          );
        })}
      </div>

      {/* ======================================================
          CURRENT STATUS MESSAGE
      ====================================================== */}

      <div className="order-tracker-live-message">
        <span className="order-tracker-live-dot" />

        <span>
          {TRACKING_STEPS[currentIndex]?.description ??
            "Your order is being processed."}
        </span>
      </div>
    </section>
  );
}