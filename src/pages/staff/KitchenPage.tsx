
// =========================================================
// SMART CAFE - KITCHEN PAGE
// =========================================================
//
// PURPOSE:
// - Show active kitchen orders.
// - Keep the newest orders at the top.
// - Allow staff to filter orders by workflow status.
// - Provide quick access to new and active orders.
//
// KITCHEN WORKFLOW:
// Confirmed -> Accepted -> Preparing -> Ready -> Served
//
// IMPORTANT:
// - Payment is handled separately.
// - Payment status never blocks kitchen preparation.
// - Completed orders are handled by the order lifecycle.
// =========================================================

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Check,
  ChefHat,
  PackageCheck,
  Utensils,
  ClipboardList,
  RotateCcw,
} from "lucide-react";

import {
  useOrder,
} from "../../context/OrderContext";

import KitchenOrderCard from "../../components/kitchen/KitchenOrderCard";

// =========================================================
// TYPES
// =========================================================

type KitchenFilter =
  | "all"
  | "confirmed"
  | "accepted"
  | "preparing"
  | "ready";

// =========================================================
// KITCHEN PAGE
// =========================================================

export default function KitchenPage() {
  const {
    orders,
    updateOrderStatus,
  } = useOrder();

  const [activeFilter, setActiveFilter] =
    useState<KitchenFilter>("all");

  // =======================================================
  // ACTIVE KITCHEN ORDERS
  // =======================================================
  //
  // Sort newest first so staff can access recent orders
  // immediately, even when there are hundreds of orders.
  //
  // Payment-pending and terminal orders are excluded.
  // =======================================================

  const kitchenOrders = useMemo(() => {
    return orders
      .filter((order) =>
        [
          "confirmed",
          "accepted",
          "preparing",
          "ready",
          "served",
        ].includes(order.status),
      )
      .sort((a, b) => {
        const timeDifference =
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime();

        // Use order ID as a stable fallback when timestamps match.
        return timeDifference !== 0
          ? timeDifference
          : b.id.localeCompare(a.id);
      });
  }, [orders]);

  // =======================================================
  // SUMMARY COUNTS
  // =======================================================

  const confirmedCount = kitchenOrders.filter(
    (order) => order.status === "confirmed",
  ).length;

  const acceptedCount = kitchenOrders.filter(
    (order) => order.status === "accepted",
  ).length;

  const preparingCount = kitchenOrders.filter(
    (order) => order.status === "preparing",
  ).length;

  const readyCount = kitchenOrders.filter(
    (order) => order.status === "ready",
  ).length;

  // =======================================================
  // FILTERED ORDERS
  // =======================================================

  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") {
      return kitchenOrders;
    }

    return kitchenOrders.filter(
      (order) => order.status === activeFilter,
    );
  }, [kitchenOrders, activeFilter]);

  const filterLabels: Record<KitchenFilter, string> = {
    all: "All Active",
    confirmed: "New Orders",
    accepted: "Accepted",
    preparing: "Preparing",
    ready: "Ready",
  };

  // =======================================================
  // ACCEPT ORDER
  // =======================================================

  function handleAcceptOrder(orderId: string) {
    const success = updateOrderStatus(
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

  function handleCancelOrder(orderId: string) {
    const shouldCancel = window.confirm(
      "Are you sure this order should be cancelled?",
    );

    if (!shouldCancel) {
      return;
    }

    const success = updateOrderStatus(
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

  function handleStartPreparing(orderId: string) {
    const success = updateOrderStatus(
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

  function handleMarkReady(orderId: string) {
    const success = updateOrderStatus(
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

  function handleMarkServed(orderId: string) {
    const success = updateOrderStatus(
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
    <section className="page-placeholder">
      {/* HEADER */}

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
            margin: "6px 0 8px",
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
          Accept, prepare, and serve customer orders.
          Newest orders appear first.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <SummaryCard
          label="New Orders"
          value={confirmedCount}
          icon={<PackageCheck size={20} />}
          selected={activeFilter === "confirmed"}
          accentColor="#dc2626"
          onClick={() => setActiveFilter("confirmed")}
        />

        <SummaryCard
          label="Accepted"
          value={acceptedCount}
          icon={<Check size={20} />}
          selected={activeFilter === "accepted"}
          accentColor="#2563eb"
          onClick={() => setActiveFilter("accepted")}
        />

        <SummaryCard
          label="Preparing"
          value={preparingCount}
          icon={<ChefHat size={20} />}
          selected={activeFilter === "preparing"}
          accentColor="#d97706"
          onClick={() => setActiveFilter("preparing")}
        />

        <SummaryCard
          label="Ready"
          value={readyCount}
          icon={<Utensils size={20} />}
          selected={activeFilter === "ready"}
          accentColor="#16a34a"
          onClick={() => setActiveFilter("ready")}
        />
      </div>

      {/* QUICK-ACCESS FILTER BUTTONS */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          marginBottom: "22px",
          padding: "14px",
          border: "1px solid rgba(128,128,128,0.25)",
          borderRadius: "12px",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            marginRight: "4px",
            fontWeight: 700,
          }}
        >
          <ClipboardList size={18} />
          Quick access
        </span>

        <FilterButton
          label="All Active"
          count={kitchenOrders.length}
          selected={activeFilter === "all"}
          onClick={() => setActiveFilter("all")}
        />

        <FilterButton
          label="New Orders"
          count={confirmedCount}
          selected={activeFilter === "confirmed"}
          onClick={() => setActiveFilter("confirmed")}
        />

        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px",
            padding: "9px 12px",
            border: "1px solid rgba(128,128,128,0.35)",
            borderRadius: "8px",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <RotateCcw size={16} />
          Reset filter
        </button>
      </div>

      {/* ORDER LIST HEADING */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            {filterLabels[activeFilter]}
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              opacity: 0.7,
              fontSize: "14px",
            }}
          >
            Showing {filteredOrders.length}{" "}
            {filteredOrders.length === 1
              ? "order"
              : "orders"}
          </p>
        </div>

        {activeFilter !== "all" && (
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "9px 13px",
              border: "1px solid rgba(128,128,128,0.35)",
              borderRadius: "8px",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 600,
            }}
          >
            Show all active orders
          </button>
        )}
      </div>

      {/* EMPTY STATE */}

      {filteredOrders.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            border: "1px dashed currentColor",
            borderRadius: "12px",
            opacity: 0.75,
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
              margin: "0 0 8px",
            }}
          >
            {activeFilter === "all"
              ? "No kitchen orders"
              : `No ${filterLabels[
                  activeFilter
                ].toLowerCase()} right now`}
          </h3>

          <p
            style={{
              margin: "0 0 16px",
            }}
          >
            {activeFilter === "confirmed"
              ? "New confirmed orders will appear here."
              : activeFilter === "all"
                ? "Confirmed customer orders will appear here."
                : "Orders will appear here when they reach this stage."}
          </p>

          {activeFilter !== "all" && (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                font: "inherit",
                fontWeight: 600,
              }}
            >
              View all active orders
            </button>
          )}
        </div>
      ) : (
        /* ORDER CARDS */

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {filteredOrders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              onAccept={handleAcceptOrder}
              onCancel={handleCancelOrder}
              onStartPreparing={handleStartPreparing}
              onMarkReady={handleMarkReady}
              onMarkServed={handleMarkServed}
            />
          ))}
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
  selected,
  accentColor,
  onClick,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  selected: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        width: "100%",
        padding: "16px",
        border: selected
          ? `2px solid ${accentColor}`
          : "1px solid rgba(128,128,128,0.25)",
        borderRadius: "12px",
        background: selected
          ? `${accentColor}12`
          : "transparent",
        color: "inherit",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        transition: "border-color 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: accentColor,
          fontWeight: 600,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>

      <strong
        style={{
          display: "block",
          marginTop: "8px",
          fontSize: "26px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          display: "block",
          marginTop: "4px",
          fontSize: "12px",
          opacity: 0.7,
        }}
      >
        Click to view
      </span>
    </button>
  );
}

// =========================================================
// QUICK-ACCESS FILTER BUTTON
// =========================================================

function FilterButton({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 12px",
        border: selected
          ? "1px solid #2563eb"
          : "1px solid rgba(128,128,128,0.35)",
        borderRadius: "8px",
        background: selected
          ? "rgba(37,99,235,0.12)"
          : "transparent",
        color: "inherit",
        cursor: "pointer",
        font: "inherit",
        fontWeight: selected ? 700 : 500,
      }}
    >
      <span>{label}</span>

      <span
        style={{
          minWidth: "22px",
          padding: "2px 6px",
          borderRadius: "20px",
          background: selected
            ? "#2563eb"
            : "rgba(128,128,128,0.18)",
          color: selected ? "#ffffff" : "inherit",
          textAlign: "center",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {count}
      </span>
    </button>
  );
}
