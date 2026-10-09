
// SMART CAFE - ADMIN ORDER DETAILS
// PHASE 12.7
// Displays one order and safely manages its status.

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { useOrder } from "../../context/OrderContext";

import type {
  OrderStatus,
} from "../../types/Order";

import {
  getNextOrderStatuses,
} from "../../utils/orderStatus";

function formatStatus(status: OrderStatus) {
  switch (status) {
    case "created":
      return "Created";
    case "payment-pending":
      return "Payment Pending";
    case "confirmed":
      return "Confirmed";
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
      return status;
  }
}

function formatOrderType(type: string) {
  switch (type) {
    case "dine-in":
      return "Dine-in";
    case "waiting-lounge":
      return "Waiting Lounge";
    case "takeaway":
      return "Takeaway";
    default:
      return type;
  }
}

function formatPaymentMethod(method: string) {
  switch (method) {
    case "upi":
      return "UPI";
    case "card":
      return "Card";
    case "counter":
      return "Pay at Counter";
    default:
      return method;
  }
}

function formatPaymentStatus(status: string) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

function formatCurrency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleString();
}

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const {
    getOrderById,
    updateOrderStatus,
    cancelOrder,
  } = useOrder();

  const order = orderId
    ? getOrderById(orderId)
    : undefined;

  if (!order) {
    return (
      <section
        style={{
          padding: "24px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            padding: "40px",
            border: "1px solid #ddd",
            borderRadius: "14px",
            textAlign: "center",
          }}
        >
          <h1>Order Not Found</h1>

          <p>
            The requested order does not exist or may
            have been removed.
          </p>

          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            style={{
              marginTop: "16px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Orders
          </button>
        </div>
      </section>
    );
  }

  const currentOrder = order;

  const nextStatuses = getNextOrderStatuses(
    currentOrder.status,
  );

  function handleStatusChange(nextStatus: OrderStatus) {
    if (nextStatus === "cancelled") {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order ${currentOrder.id}?`,
      );

      if (!confirmed) {
        return;
      }

      cancelOrder(currentOrder.id);
      return;
    }

    updateOrderStatus(currentOrder.id, nextStatus);
  }

  return (
    <section
      style={{
        padding: "24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "20px" }}>
        <Link to="/admin/orders">
          ← Back to Orders
        </Link>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              color: "#666",
              letterSpacing: "1px",
            }}
          >
            ADMIN ORDER DETAILS
          </p>

          <h1 style={{ margin: "6px 0" }}>
            Order #{currentOrder.id}
          </h1>

          <p style={{ margin: 0, color: "#666" }}>
            {formatOrderType(currentOrder.type)}
          </p>
        </div>

        <div
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            background: "#f5f5f5",
          }}
        >
          <strong>
            {formatStatus(currentOrder.status)}
          </strong>
        </div>
      </div>

      {/* Status management */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Order Status</h2>

        <p>
          Current status:{" "}
          <strong>
            {formatStatus(currentOrder.status)}
          </strong>
        </p>

        {nextStatuses.length === 0 ? (
          <p style={{ color: "#666" }}>
            No further status changes are available.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border:
                    status === "cancelled"
                      ? "1px solid #dc2626"
                      : "1px solid #ccc",
                  cursor: "pointer",
                  background: "#fff",
                  color:
                    status === "cancelled"
                      ? "#dc2626"
                      : "inherit",
                  fontWeight:
                    status === "cancelled" ? 600 : 400,
                }}
              >
                {formatStatus(status)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer information */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Customer Information</h2>

        <p>
          <strong>Name:</strong>{" "}
          {currentOrder.customer.name}
        </p>

        {currentOrder.customer.phone && (
          <p>
            <strong>Phone:</strong>{" "}
            {currentOrder.customer.phone}
          </p>
        )}

        {currentOrder.customer.email && (
          <p>
            <strong>Email:</strong>{" "}
            {currentOrder.customer.email}
          </p>
        )}
      </div>

      {/* Order information */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Order Information</h2>

        <p>
          <strong>Order Type:</strong>{" "}
          {formatOrderType(currentOrder.type)}
        </p>

        <p>
          <strong>Created:</strong>{" "}
          {formatDate(currentOrder.createdAt)}
        </p>

        <p>
          <strong>Last Updated:</strong>{" "}
          {formatDate(currentOrder.updatedAt)}
        </p>

        {currentOrder.tableId && (
          <p>
            <strong>Table:</strong>{" "}
            {currentOrder.tableId}
          </p>
        )}

        {currentOrder.queueEntryId && (
          <p>
            <strong>Queue Entry:</strong>{" "}
            {currentOrder.queueEntryId}
          </p>
        )}
      </div>

      {/* Payment is displayed separately from kitchen workflow. */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Payment</h2>

        <p>
          <strong>Method:</strong>{" "}
          {formatPaymentMethod(currentOrder.paymentMethod)}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {formatPaymentStatus(currentOrder.paymentStatus)}
        </p>
      </div>

      {/* Order items */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Order Items</h2>

        {currentOrder.items.length === 0 ? (
          <p>No order items found.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {currentOrder.items.map((item, index) => (
              <div
                key={`${item.name}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "10px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <strong>{item.name}</strong>

                  <p
                    style={{
                      margin: "4px 0 0",
                      color: "#666",
                    }}
                  >
                    Quantity: {item.quantity}
                  </p>
                </div>

                <strong>
                  {formatCurrency(
                    item.unitPrice * item.quantity,
                  )}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional items */}
      {currentOrder.additionalItems.length > 0 && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >
          <h2>Additional Items</h2>

          {currentOrder.additionalItems.map(
            (item, index) => (
              <div
                key={`${item.name}-${index}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <strong>
                  {formatCurrency(
                    item.unitPrice * item.quantity,
                  )}
                </strong>
              </div>
            ),
          )}
        </div>
      )}

      {/* Bill summary */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "14px",
          marginBottom: "20px",
        }}
      >
        <h2>Bill Summary</h2>

        <p>
          <strong>Subtotal:</strong>{" "}
          {formatCurrency(currentOrder.subtotal)}
        </p>

        <p>
          <strong>Tax:</strong>{" "}
          {formatCurrency(currentOrder.taxAmount)}
        </p>

        <h2>
          Total: {formatCurrency(currentOrder.totalAmount)}
        </h2>
      </div>

      {/* Gaming */}
      {currentOrder.gamingSessionId && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >
          <h2>Gaming</h2>

          <p>
            <strong>Gaming Session:</strong>{" "}
            {currentOrder.gamingSessionId}
          </p>

          <Link
            to={`/games?order=${currentOrder.id}&session=${currentOrder.gamingSessionId}`}
          >
            Open Gaming Session
          </Link>
        </div>
      )}

      {/* Order notes */}
      {currentOrder.orderNotes && (
        <div
          style={{
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "14px",
            marginBottom: "20px",
          }}
        >
          <h2>Order Notes</h2>
          <p>{currentOrder.orderNotes}</p>
        </div>
      )}
    </section>
  );
}

