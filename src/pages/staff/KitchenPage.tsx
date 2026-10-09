// =========================================================
// SMART CAFE - KITCHEN PAGE
// =========================================================
//
// PURPOSE:
//
// Kitchen is responsible ONLY for food preparation workflow.
//
// Kitchen workflow:
//
// Confirmed
//     ↓
// Accepted
//     ↓
// Preparing
//     ↓
// Ready
//     ↓
// Served
//
// Completed is handled by the order lifecycle.
//
// IMPORTANT BUSINESS RULE:
//
// Kitchen must NOT:
// - Confirm payments
// - Display payment status
// - Handle payment methods
// - Wait for payment
//
// Payment is handled separately by:
// - Cashier
// - Front desk
// - Staff
// - Order/payment system
//
// Dine-in and Waiting Lounge customers may pay before OR
// after the meal.
//
// Therefore payment must never block the kitchen workflow.
//
// =========================================================

import {
  useMemo,
} from "react";

import {
  Check,
  ChefHat,
  PackageCheck,
  Utensils,
} from "lucide-react";

import {
  useOrder,
} from "../../context/OrderContext";

import KitchenOrderCard from "../../components/kitchen/KitchenOrderCard";


// =========================================================
// KITCHEN PAGE
// =========================================================

export default function KitchenPage() {

  // =======================================================
  // ORDER CONTEXT
  // =======================================================

  const {
    orders,
    updateOrderStatus,
  } = useOrder();


  // =======================================================
  // ACTIVE KITCHEN ORDERS
  // =======================================================
  //
  // IMPORTANT:
  //
  // payment-pending is intentionally NOT included.
  //
  // Payment is not a kitchen workflow state.
  //
  // Only confirmed orders enter the kitchen workflow.
  // =======================================================

  const kitchenOrders = useMemo(() => {

    return orders
      .filter((order) => {

        return (
          order.status === "confirmed" ||
          order.status === "accepted" ||
          order.status === "preparing" ||
          order.status === "ready" ||
          order.status === "served"
        );

      })
      .sort((a, b) => {

        return (
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );

      });

  }, [orders]);


  // =======================================================
  // SUMMARY COUNTS
  // =======================================================

  const confirmedCount =
    kitchenOrders.filter(
      (order) =>
        order.status === "confirmed",
    ).length;


  const acceptedCount =
    kitchenOrders.filter(
      (order) =>
        order.status === "accepted",
    ).length;


  const preparingCount =
    kitchenOrders.filter(
      (order) =>
        order.status === "preparing",
    ).length;


  const readyCount =
    kitchenOrders.filter(
      (order) =>
        order.status === "ready",
    ).length;


  // =======================================================
  // ACCEPT ORDER
  // =======================================================

  function handleAcceptOrder(
    orderId: string,
  ) {

    const success =
      updateOrderStatus(
        orderId,
        "accepted",
      );

    if (!success) {

      window.alert(
        "This order cannot be accepted in its current status.",
      );

    }

  }


  // =======================================================
  // CANCEL ORDER
  // =======================================================

  function handleCancelOrder(
    orderId: string,
  ) {

    const shouldCancel =
      window.confirm(
        "Are you sure this order should be cancelled?",
      );

    if (!shouldCancel) {
      return;
    }

    const success =
      updateOrderStatus(
        orderId,
        "cancelled",
      );

    if (!success) {

      window.alert(
        "This order cannot be cancelled in its current status.",
      );

    }

  }


  // =======================================================
  // START PREPARING
  // =======================================================

  function handleStartPreparing(
    orderId: string,
  ) {

    const success =
      updateOrderStatus(
        orderId,
        "preparing",
      );

    if (!success) {

      window.alert(
        "This order cannot start preparation yet.",
      );

    }

  }


  // =======================================================
  // MARK READY
  // =======================================================

  function handleMarkReady(
    orderId: string,
  ) {

    const success =
      updateOrderStatus(
        orderId,
        "ready",
      );

    if (!success) {

      window.alert(
        "This order cannot be marked ready yet.",
      );

    }

  }


  // =======================================================
  // MARK SERVED
  // =======================================================

  function handleMarkServed(
    orderId: string,
  ) {

    const success =
      updateOrderStatus(
        orderId,
        "served",
      );

    if (!success) {

      window.alert(
        "This order cannot be marked served yet.",
      );

    }

  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section
      className="page-placeholder"
    >

      {/* =================================================
          HEADER
          ================================================= */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          Kitchen
        </p>

        <h1
          style={{
            margin:
              "6px 0 8px",
          }}
        >
          Kitchen Orders
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.7,
          }}
        >
          Accept, prepare, and serve
          customer orders.
        </p>

      </div>


      {/* =================================================
          SUMMARY
          ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >

        <SummaryCard
          label="New Orders"
          value={confirmedCount}
          icon={
            <PackageCheck
              size={20}
            />
          }
        />

        <SummaryCard
          label="Accepted"
          value={acceptedCount}
          icon={
            <Check
              size={20}
            />
          }
        />

        <SummaryCard
          label="Preparing"
          value={preparingCount}
          icon={
            <ChefHat
              size={20}
            />
          }
        />

        <SummaryCard
          label="Ready"
          value={readyCount}
          icon={
            <Utensils
              size={20}
            />
          }
        />

      </div>


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {kitchenOrders.length === 0 ? (

        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            border:
              "1px dashed currentColor",
            borderRadius: "12px",
            opacity: 0.7,
          }}
        >

          <ChefHat
            size={36}
            style={{
              marginBottom: "10px",
            }}
          />

          <h3
            style={{
              margin:
                "0 0 8px",
            }}
          >
            No kitchen orders
          </h3>

          <p
            style={{
              margin: 0,
            }}
          >
            Confirmed customer orders
            will appear here.
          </p>

        </div>

      ) : (

        /* =================================================
           ORDER CARDS
           ================================================= */

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >

          {kitchenOrders.map(
            (order) => (

              <KitchenOrderCard
                key={order.id}
                order={order}

                onAccept={
                  handleAcceptOrder
                }

                onCancel={
                  handleCancelOrder
                }

                onStartPreparing={
                  handleStartPreparing
                }

                onMarkReady={
                  handleMarkReady
                }

                onMarkServed={
                  handleMarkServed
                }
              />

            ),
          )}

        </div>

      )}

    </section>
  );
}


// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {

  return (
    <div
      style={{
        padding:
          "16px",
        border:
          "1px solid rgba(128,128,128,0.25)",
        borderRadius:
          "12px",
      }}
    >

      <div
        style={{
          display:
            "flex",
          alignItems:
            "center",
          gap:
            "8px",
          opacity:
            0.7,
        }}
      >

        {icon}

        <span>
          {label}
        </span>

      </div>

      <strong
        style={{
          display:
            "block",
          marginTop:
            "8px",
          fontSize:
            "24px",
        }}
      >

        {value}

      </strong>

    </div>
  );
}