//
// SMART CAFE - ADMIN ORDER MANAGEMENT
//
// Phase 17.10
//
// ADVANCED ORDER SEARCH & FILTERING
//
// Admin can:
// - Search orders
// - Filter by order status
// - Filter by order type
// - Filter by payment status
// - Filter by payment method
// - Filter gaming orders
// - Sort newest/oldest
// - Clear all filters
// - View customer information
// - View table information
// - View payment information
// - View gaming information
// - View order items
// - View totals
// - Change valid order statuses
// - Cancel orders safely
// - Open individual order details
//
// IMPORTANT:
// Existing OrderContext remains the single source of truth.
//
// =========================================================

import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { useOrder } from "../../context/OrderContext";

import type {
  OrderStatus,
  OrderType,
} from "../../types/Order";

import {
  getNextOrderStatuses,
} from "../../utils/orderStatus";

import "./AdminOrdersPage.css";

// =========================================================
// FILTER TYPES
// =========================================================

type PaymentStatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

type PaymentMethodFilter =
  | "all"
  | "upi"
  | "card"
  | "counter";

type GamingFilter =
  | "all"
  | "gaming"
  | "non-gaming";

type SortOrder =
  | "newest"
  | "oldest";

// =========================================================
// STATUS LABEL
// =========================================================

function formatStatus(status: OrderStatus) {
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
      return status;
  }
}

// =========================================================
// ORDER TYPE LABEL
// =========================================================

function formatOrderType(type: OrderType) {
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

// =========================================================
// PAYMENT STATUS LABEL
// =========================================================

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

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

// =========================================================
// PAYMENT METHOD LABEL
// =========================================================

function formatPaymentMethod(method: string) {
  switch (method) {
    case "upi":
      return "UPI";

    case "card":
      return "Card";

    case "counter":
      return "Counter";

    default:
      return method;
  }
}

// =========================================================
// CURRENCY
// =========================================================

function formatCurrency(value: number) {
  return `₹${Number(value).toFixed(2)}`;
}

// =========================================================
// DATE / TIME
// =========================================================

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

// =========================================================
// ADMIN ORDERS PAGE
// =========================================================

export default function AdminOrdersPage() {
  // =======================================================
  // ORDER CONTEXT
  // =======================================================

  const {
    orders,
    updateOrderStatus,
    cancelOrder,
  } = useOrder();

  // =======================================================
  // SEARCH
  // =======================================================

  const [searchText, setSearchText] = useState("");

  // =======================================================
  // BASIC FILTERS
  // =======================================================

  const [statusFilter, setStatusFilter] =
    useState<"all" | OrderStatus>("all");

  const [typeFilter, setTypeFilter] =
    useState<"all" | OrderType>("all");

  // =======================================================
  // PAYMENT FILTERS
  // =======================================================

  const [paymentStatusFilter, setPaymentStatusFilter] =
    useState<PaymentStatusFilter>("all");

  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");

  // =======================================================
  // GAMING FILTER
  // =======================================================

  const [gamingFilter, setGamingFilter] =
    useState<GamingFilter>("all");

  // =======================================================
  // SORT
  // =======================================================

  const [sortOrder, setSortOrder] =
    useState<SortOrder>("newest");

  // =======================================================
  // FILTER + SEARCH + SORT
  // =======================================================

  const filteredOrders = useMemo(() => {
    const search = searchText
      .trim()
      .toLowerCase();

    return [...orders]
      .filter((order) => {

        // ---------------------------------------------------
        // STATUS FILTER
        // ---------------------------------------------------

        if (
          statusFilter !== "all" &&
          order.status !== statusFilter
        ) {
          return false;
        }

        // ---------------------------------------------------
        // ORDER TYPE FILTER
        // ---------------------------------------------------

        if (
          typeFilter !== "all" &&
          order.type !== typeFilter
        ) {
          return false;
        }

        // ---------------------------------------------------
        // PAYMENT STATUS FILTER
        // ---------------------------------------------------

        if (
          paymentStatusFilter !== "all" &&
          order.paymentStatus !==
            paymentStatusFilter
        ) {
          return false;
        }

        // ---------------------------------------------------
        // PAYMENT METHOD FILTER
        // ---------------------------------------------------

        if (
          paymentMethodFilter !== "all" &&
          order.paymentMethod !==
            paymentMethodFilter
        ) {
          return false;
        }

        // ---------------------------------------------------
        // GAMING FILTER
        //
        // An order with gamingSessionId is considered
        // a gaming order.
        // ---------------------------------------------------

        if (gamingFilter === "gaming") {
          if (!order.gamingSessionId) {
            return false;
          }
        }

        if (gamingFilter === "non-gaming") {
          if (order.gamingSessionId) {
            return false;
          }
        }

        // ---------------------------------------------------
        // SEARCH
        //
        // Search supports:
        // - Order ID
        // - Customer name
        // - Customer phone
        // - Customer email
        // - Table ID
        // - Order type
        // - Order status
        // ---------------------------------------------------

        if (search) {
          const searchableText = [
            order.id,
            order.customer?.name,
            order.customer?.phone,
            order.customer?.email,
            order.tableId,
            order.type,
            order.status,
            order.paymentStatus,
            order.paymentMethod,
            order.gamingSessionId,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (
            !searchableText.includes(search)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA =
          new Date(a.createdAt).getTime();

        const timeB =
          new Date(b.createdAt).getTime();

        if (sortOrder === "newest") {
          return timeB - timeA;
        }

        return timeA - timeB;
      });
  }, [
    orders,
    searchText,
    statusFilter,
    typeFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    gamingFilter,
    sortOrder,
  ]);

  // =======================================================
  // SUMMARY COUNTS
  // =======================================================

  const totalOrders = orders.length;

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "completed" &&
      order.status !== "cancelled",
  ).length;

  const completedOrders = orders.filter(
    (order) =>
      order.status === "completed",
  ).length;

  const cancelledOrders = orders.filter(
    (order) =>
      order.status === "cancelled",
  ).length;

  // =======================================================
  // STATUS CHANGE
  // =======================================================

  function handleStatusChange(
    orderId: string,
    nextStatus: OrderStatus,
  ) {
    // -----------------------------------------------------
    // Cancellation requires confirmation.
    // -----------------------------------------------------

    if (nextStatus === "cancelled") {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order ${orderId}?`,
      );

      if (!confirmed) {
        return;
      }

      cancelOrder(orderId);

      return;
    }

    // -----------------------------------------------------
    // Normal status changes are validated by:
    //
    // OrderContext
    // +
    // src/utils/orderStatus.ts
    // -----------------------------------------------------

    updateOrderStatus(
      orderId,
      nextStatus,
    );
  }

  // =======================================================
  // CLEAR ALL FILTERS
  // =======================================================

  function clearFilters() {
    setSearchText("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPaymentStatusFilter("all");
    setPaymentMethodFilter("all");
    setGamingFilter("all");
    setSortOrder("newest");
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <section className="admin-orders-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="admin-orders-header">

        <div>
          <p className="admin-orders-eyebrow">
            SMART CAFE ADMIN
          </p>

          <h1>
            Order Management
          </h1>

          <p className="admin-orders-description">
            Monitor customer orders and manage
            their order status.
          </p>
        </div>

      </header>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <div className="admin-order-summary-grid">

        <div className="admin-order-summary-card">
          <span>
            Total Orders
          </span>

          <strong>
            {totalOrders}
          </strong>
        </div>

        <div className="admin-order-summary-card">
          <span>
            Active Orders
          </span>

          <strong>
            {activeOrders}
          </strong>
        </div>

        <div className="admin-order-summary-card">
          <span>
            Completed
          </span>

          <strong>
            {completedOrders}
          </strong>
        </div>

        <div className="admin-order-summary-card">
          <span>
            Cancelled
          </span>

          <strong>
            {cancelledOrders}
          </strong>
        </div>

      </div>

      {/* =================================================
          SEARCH + FILTERS
      ================================================= */}

      <div className="admin-order-filters">

        {/* SEARCH */}

        <div className="admin-order-search">

          <label htmlFor="admin-order-search">
            Search Orders
          </label>

          <input
            id="admin-order-search"
            type="text"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value,
              )
            }
            placeholder="Order ID, customer, phone, table..."
          />

        </div>

        {/* STATUS */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-status-filter">
            Status
          </label>

          <select
            id="admin-order-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "all"
                  | OrderStatus,
              )
            }
          >
            <option value="all">
              All Statuses
            </option>

            <option value="created">
              Created
            </option>

            <option value="payment-pending">
              Payment Pending
            </option>

            <option value="confirmed">
              Confirmed
            </option>

            <option value="accepted">
              Accepted
            </option>

            <option value="preparing">
              Preparing
            </option>

            <option value="ready">
              Ready
            </option>

            <option value="served">
              Served
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* ORDER TYPE */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-type-filter">
            Order Type
          </label>

          <select
            id="admin-order-type-filter"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value as
                  | "all"
                  | OrderType,
              )
            }
          >
            <option value="all">
              All Order Types
            </option>

            <option value="dine-in">
              Dine-in
            </option>

            <option value="waiting-lounge">
              Waiting Lounge
            </option>

            <option value="takeaway">
              Takeaway
            </option>
          </select>

        </div>

        {/* PAYMENT STATUS */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-payment-status">
            Payment Status
          </label>

          <select
            id="admin-order-payment-status"
            value={paymentStatusFilter}
            onChange={(event) =>
              setPaymentStatusFilter(
                event.target.value as
                  PaymentStatusFilter,
              )
            }
          >
            <option value="all">
              All Payment Statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="paid">
              Paid
            </option>

            <option value="failed">
              Failed
            </option>

            <option value="refunded">
              Refunded
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* PAYMENT METHOD */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-payment-method">
            Payment Method
          </label>

          <select
            id="admin-order-payment-method"
            value={paymentMethodFilter}
            onChange={(event) =>
              setPaymentMethodFilter(
                event.target.value as
                  PaymentMethodFilter,
              )
            }
          >
            <option value="all">
              All Payment Methods
            </option>

            <option value="upi">
              UPI
            </option>

            <option value="card">
              Card
            </option>

            <option value="counter">
              Counter
            </option>
          </select>

        </div>

        {/* GAMING */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-gaming">
            Gaming
          </label>

          <select
            id="admin-order-gaming"
            value={gamingFilter}
            onChange={(event) =>
              setGamingFilter(
                event.target.value as
                  GamingFilter,
              )
            }
          >
            <option value="all">
              All Orders
            </option>

            <option value="gaming">
              Gaming Orders
            </option>

            <option value="non-gaming">
              Non-Gaming Orders
            </option>
          </select>

        </div>

        {/* SORT */}

        <div className="admin-order-filter-field">

          <label htmlFor="admin-order-sort">
            Sort
          </label>

          <select
            id="admin-order-sort"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value as SortOrder,
              )
            }
          >
            <option value="newest">
              Newest First
            </option>

            <option value="oldest">
              Oldest First
            </option>
          </select>

        </div>

        {/* CLEAR */}

        <button
          type="button"
          className="admin-order-clear-button"
          onClick={clearFilters}
        >
          Clear All Filters
        </button>

      </div>

      {/* =================================================
          ACTIVE FILTER SUMMARY
      ================================================= */}

      <div className="admin-order-results-info">

        Showing{" "}
        <strong>
          {filteredOrders.length}
        </strong>{" "}
        of{" "}
        <strong>
          {orders.length}
        </strong>{" "}
        orders

        {searchText.trim() && (
          <>
            {" "}
            matching{" "}
            <strong>
              "{searchText.trim()}"
            </strong>
          </>
        )}

      </div>

      {/* =================================================
          EMPTY STATE
      ================================================= */}

      {filteredOrders.length === 0 && (
        <div className="admin-orders-empty">

          <h2>
            No Orders Found
          </h2>

          <p>
            There are no orders matching
            the current search or filters.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="admin-order-empty-button"
          >
            Clear All Filters
          </button>

        </div>
      )}

      {/* =================================================
          ORDER LIST
      ================================================= */}

      <div className="admin-order-list">

        {filteredOrders.map((order) => {

          const nextStatuses =
            getNextOrderStatuses(
              order.status,
            );

          return (
            <article
              key={order.id}
              className="admin-order-card"
            >

              {/* =========================================
                  ORDER HEADER
              ========================================== */}

              <div className="admin-order-card-header">

                <div>

                  <h2>
                    Order #{order.id}
                  </h2>

                  <p className="admin-order-type">
                    {formatOrderType(
                      order.type,
                    )}
                  </p>

                  <p className="admin-order-created">
                    Created:{" "}
                    {formatDateTime(
                      order.createdAt,
                    )}
                  </p>

                </div>

                <div className="admin-order-header-actions">

                  <span
                    className={`admin-order-status admin-order-status-${order.status}`}
                  >
                    {formatStatus(
                      order.status,
                    )}
                  </span>

                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="admin-order-details-button"
                  >
                    View Details
                  </Link>

                </div>

              </div>

              {/* =========================================
                  CUSTOMER
              ========================================== */}

              <div className="admin-order-section">

                <h3>
                  Customer
                </h3>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {order.customer.name}
                </p>

                {order.customer.phone && (
                  <p>
                    <strong>
                      Phone:
                    </strong>{" "}
                    {order.customer.phone}
                  </p>
                )}

                {order.customer.email && (
                  <p>
                    <strong>
                      Email:
                    </strong>{" "}
                    {order.customer.email}
                  </p>
                )}

              </div>

              {/* =========================================
                  TABLE
              ========================================== */}

              {order.tableId && (
                <div className="admin-order-section">

                  <h3>
                    Table
                  </h3>

                  <p>
                    <strong>
                      Table ID:
                    </strong>{" "}
                    {order.tableId}
                  </p>

                </div>
              )}

              {/* =========================================
                  PAYMENT
              ========================================== */}

              <div className="admin-order-section">

                <h3>
                  Payment
                </h3>

                <p>
                  <strong>
                    Method:
                  </strong>{" "}
                  {formatPaymentMethod(
                    order.paymentMethod,
                  )}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {formatPaymentStatus(
                    order.paymentStatus,
                  )}
                </p>

              </div>

              {/* =========================================
                  ITEMS
              ========================================== */}

              <div className="admin-order-section">

                <h3>
                  Items
                </h3>

                <div className="admin-order-items">

                  {order.items.map(
                    (item, index) => (
                      <div
                        key={`${order.id}-${item.menuItemId}-${index}`}
                        className="admin-order-item"
                      >

                        <span>
                          {item.name} ×{" "}
                          {item.quantity}
                        </span>

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

              </div>

              {/* =========================================
                  TOTAL
              ========================================== */}

              <div className="admin-order-total">

                <div>
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatCurrency(
                      order.subtotal,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Tax
                  </span>

                  <strong>
                    {formatCurrency(
                      order.taxAmount,
                    )}
                  </strong>
                </div>

                <div className="admin-order-grand-total">

                  <span>
                    Total
                  </span>

                  <strong>
                    {formatCurrency(
                      order.totalAmount,
                    )}
                  </strong>

                </div>

              </div>

              {/* =========================================
                  GAMING
              ========================================== */}

              {order.gamingSessionId && (
                <div className="admin-order-gaming">

                  <strong>
                    Gaming Session
                  </strong>

                  <p>
                    {order.gamingSessionId}
                  </p>

                </div>
              )}

              {/* =========================================
                  ORDER NOTES
              ========================================== */}

              {order.orderNotes && (
                <div className="admin-order-section">

                  <h3>
                    Order Notes
                  </h3>

                  <p>
                    {order.orderNotes}
                  </p>

                </div>
              )}

              {/* =========================================
                  STATUS CONTROL
              ========================================== */}

              <div className="admin-order-status-control">

                <div>

                  <h3>
                    Update Status
                  </h3>

                  <p>
                    Only valid status transitions
                    are shown.
                  </p>

                </div>

                {nextStatuses.length === 0 ? (
                  <span className="admin-order-no-next-status">
                    No further status changes
                    are available.
                  </span>
                ) : (
                  <select
                    value=""
                    onChange={(event) => {
                      const nextStatus =
                        event.target.value as OrderStatus;

                      if (!nextStatus) {
                        return;
                      }

                      handleStatusChange(
                        order.id,
                        nextStatus,
                      );
                    }}
                  >

                    <option value="">
                      Select next status
                    </option>

                    {nextStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatStatus(
                            status,
                          )}
                        </option>
                      ),
                    )}

                  </select>
                )}

              </div>

            </article>
          );
        })}

      </div>

    </section>
  );
}