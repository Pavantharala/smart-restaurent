
import {
  Check,
  CircleX,
  Clock,
  PackageCheck,
  Play,
  Utensils,
} from "lucide-react";

import type { Order } from "../../types/Order";
import { formatCurrency } from "../../utils/formatCurrency";

import "./KitchenOrderCard.css";

// ============================================================
// PROPS
// ============================================================

interface KitchenOrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  onStartPreparing: (orderId: string) => void;
  onMarkReady: (orderId: string) => void;
  onMarkServed: (orderId: string) => void;
}

// ============================================================
// STATUS HELPERS
// ============================================================

function getStatusLabel(status: Order["status"]): string {
  switch (status) {
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
    default:
      return status;
  }
}

function getStatusClass(status: Order["status"]): string {
  switch (status) {
    case "confirmed":
      return "confirmed";
    case "accepted":
      return "accepted";
    case "preparing":
      return "preparing";
    case "ready":
      return "ready";
    case "served":
      return "served";
    default:
      return "";
  }
}

// ============================================================
// KITCHEN ORDER CARD
// ============================================================

export default function KitchenOrderCard({
  order,
  onAccept,
  onCancel,
  onStartPreparing,
  onMarkReady,
  onMarkServed,
}: KitchenOrderCardProps) {
  const statusClass = getStatusClass(order.status);

  return (
    <article className="kitchen-order-card">
      {/* Order header */}
      <div className="kitchen-order-header">
        <div>
          <h3>{order.id}</h3>

          <p className="kitchen-order-time">
            <Clock size={15} />

            {new Date(order.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <span
          className={`kitchen-order-status ${statusClass}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Customer and order type */}
      <div className="kitchen-order-customer">
        {order.customer?.name && (
          <strong>{order.customer.name}</strong>
        )}

        <span>
          {order.type === "dine-in"
            ? `Dine-in${
                order.tableId
                  ? ` • Table ${order.tableId}`
                  : ""
              }`
            : order.type === "waiting-lounge"
              ? "Waiting Lounge"
              : "Takeaway"}
        </span>
      </div>

      {/* Order items */}
      <div className="kitchen-order-items">
        <h4>
          <Utensils size={16} />
          Items
        </h4>

        {order.items.map((item, index) => (
          <div
            className="kitchen-order-item"
            key={`${item.menuItemId}-${index}`}
          >
            <div>
              <strong>
                {item.quantity} × {item.name}
              </strong>

              {item.customizations &&
                item.customizations.length > 0 && (
                  <ul className="kitchen-customizations">
                    {item.customizations.map(
                      (customization, customizationIndex) => (
                        <li
                          key={`${customization.name}-${customizationIndex}`}
                        >
                          {customization.name}
                        </li>
                      ),
                    )}
                  </ul>
                )}

              {item.specialInstructions && (
                <p className="kitchen-special-instructions">
                  Note: {item.specialInstructions}
                </p>
              )}
            </div>

            <span>
              {formatCurrency(
                item.unitPrice * item.quantity,
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Display order total only; payment is handled separately. */}
      <div className="kitchen-order-total">
        <span>Order Total</span>

        <strong>
          {formatCurrency(order.totalAmount)}
        </strong>
      </div>

      {/* Kitchen workflow actions */}
      <div className="kitchen-order-actions">
        {order.status === "confirmed" && (
          <>
            <button
              type="button"
              className="kitchen-action primary"
              onClick={() => onAccept(order.id)}
            >
              <Check size={16} />
              Accept Order
            </button>

            <button
              type="button"
              className="kitchen-action danger"
              onClick={() => onCancel(order.id)}
            >
              <CircleX size={16} />
              Cancel
            </button>
          </>
        )}

        {order.status === "accepted" && (
          <>
            <button
              type="button"
              className="kitchen-action primary"
              onClick={() => onStartPreparing(order.id)}
            >
              <Play size={16} />
              Start Preparing
            </button>

            <button
              type="button"
              className="kitchen-action danger"
              onClick={() => onCancel(order.id)}
            >
              <CircleX size={16} />
              Cancel
            </button>
          </>
        )}

        {order.status === "preparing" && (
          <>
            <button
              type="button"
              className="kitchen-action primary"
              onClick={() => onMarkReady(order.id)}
            >
              <PackageCheck size={16} />
              Mark Ready
            </button>

            <button
              type="button"
              className="kitchen-action danger"
              onClick={() => onCancel(order.id)}
            >
              <CircleX size={16} />
              Cancel
            </button>
          </>
        )}

        {order.status === "ready" && (
          <button
            type="button"
            className="kitchen-action primary"
            onClick={() => onMarkServed(order.id)}
          >
            <PackageCheck size={16} />
            Mark Served
          </button>
        )}

        {order.status === "served" && (
          <div className="kitchen-served-message">
            <Check size={17} />
            Served — waiting for completion
          </div>
        )}
      </div>
    </article>
  );
}