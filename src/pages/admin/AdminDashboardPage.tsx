
import { useMemo } from "react";
import { useOrder } from "../../context/OrderContext";
import { useMenu } from "../../context/MenuContext";
import { useTable } from "../../context/TableContext";
import { useQueue } from "../../context/QueueContext";
import { useReservation } from "../../context/ReservationContext";
import { useGaming } from "../../context/GamingContext";
import "./AdminDashboardPage.css";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="dashboard-stat-card">
      <p className="dashboard-stat-label">{label}</p>
      <h2 className="dashboard-stat-value">{value}</h2>
      <p className="dashboard-stat-detail">{detail}</p>
    </article>
  );
}

export default function AdminDashboardPage() {
  const { orders } = useOrder();
  const { menuItems } = useMenu();
  const { tables } = useTable();
  const { queue } = useQueue();
  const { reservations } = useReservation();
  const { sessions } = useGaming();

  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();

    const completedOrders = orders.filter(
      (order) => order.status === "completed",
    );

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled",
    );

    const activeOrders = orders.filter(
      (order) =>
        order.status !== "completed" &&
        order.status !== "cancelled",
    );

    // This reflects the app's recorded payment status, not
    // independently verified payment-gateway transactions.
    const recordedPaidOrders = orders.filter(
      (order) => order.paymentStatus === "paid",
    );

    const recordedRevenue = recordedPaidOrders.reduce(
      (total, order) => total + order.totalAmount,
      0,
    );

    const todayRevenue = recordedPaidOrders
      .filter(
        (order) =>
          new Date(order.createdAt).toDateString() === today,
      )
      .reduce((total, order) => total + order.totalAmount, 0);

    const todayOrders = orders.filter(
      (order) =>
        new Date(order.createdAt).toDateString() === today,
    );

    const availableMenuItems = menuItems.filter(
      (item) => item.isAvailable,
    );

    const waitingQueue = queue.filter(
      (entry) => entry.status === "waiting",
    );

    const readyQueue = queue.filter(
      (entry) => entry.status === "table-ready",
    );

    const activeSessions = sessions.filter(
      (session) =>
        session.status === "active" ||
        session.status === "closing",
    );

    const activeReservations = reservations.filter(
      (reservation) =>
        reservation.status === "pending" ||
        reservation.status === "confirmed" ||
        reservation.status === "waiting" ||
        reservation.status === "checked-in",
    );

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    return {
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      recordedRevenue,
      todayRevenue,
      todayOrders: todayOrders.length,
      totalTables: tables.length,
      availableTables: tables.filter(
        (table) => table.status === "available",
      ).length,
      occupiedTables: tables.filter(
        (table) => table.status === "occupied",
      ).length,
      reservedTables: tables.filter(
        (table) => table.status === "reserved",
      ).length,
      cleaningTables: tables.filter(
        (table) => table.status === "cleaning",
      ).length,
      totalMenuItems: menuItems.length,
      availableMenuItems: availableMenuItems.length,
      unavailableMenuItems:
        menuItems.length - availableMenuItems.length,
      waitingQueue: waitingQueue.length,
      readyQueue: readyQueue.length,
      activeSessions: activeSessions.length,
      activeReservations: activeReservations.length,
      recentOrders,
    };
  }, [orders, menuItems, tables, queue, reservations, sessions]);

  return (
    <section className="admin-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">SMART CAFE MANAGEMENT</p>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            An overview of your cafe's current operations.
          </p>
        </div>

        <div className="dashboard-date">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </header>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Business Overview</h2>

        <div className="dashboard-stats-grid">
          <StatCard
            label="Today's Recorded Revenue"
            value={formatCurrency(metrics.todayRevenue)}
            detail={`${metrics.todayOrders} orders created today`}
          />
          <StatCard
            label="Recorded Revenue"
            value={formatCurrency(metrics.recordedRevenue)}
            detail="Orders marked as paid in the app"
          />
          <StatCard
            label="Total Orders"
            value={metrics.totalOrders}
            detail={`${metrics.activeOrders} currently active`}
          />
          <StatCard
            label="Completed Orders"
            value={metrics.completedOrders}
            detail={`${metrics.cancelledOrders} cancelled`}
          />
        </div>

        <p className="dashboard-note">
          Revenue uses the app's saved payment status. It is not yet
          verified against a real payment gateway.
        </p>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Cafe Operations</h2>

        <div className="dashboard-stats-grid">
          <StatCard
            label="Available Tables"
            value={metrics.availableTables}
            detail={`${metrics.totalTables} tables in total`}
          />
          <StatCard
            label="Occupied Tables"
            value={metrics.occupiedTables}
            detail={`${metrics.reservedTables} reserved`}
          />
          <StatCard
            label="Tables Being Cleaned"
            value={metrics.cleaningTables}
            detail="Current table status"
          />
          <StatCard
            label="Waiting Lounge"
            value={metrics.waitingQueue}
            detail={`${metrics.readyQueue} guests notified that a table is ready`}
          />
          <StatCard
            label="Active Reservations"
            value={metrics.activeReservations}
            detail="Pending, confirmed, waiting or checked in"
          />
          <StatCard
            label="Active Gaming Sessions"
            value={metrics.activeSessions}
            detail="Includes sessions in closing countdown"
          />
          <StatCard
            label="Available Menu Items"
            value={metrics.availableMenuItems}
            detail={`${metrics.unavailableMenuItems} unavailable`}
          />
          <StatCard
            label="Total Menu Items"
            value={metrics.totalMenuItems}
            detail="Items managed through the menu system"
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-table-heading">
          <h2 className="dashboard-section-title">Recent Orders</h2>
          <span className="dashboard-count">
            {metrics.recentOrders.length} shown
          </span>
        </div>

        {metrics.recentOrders.length === 0 ? (
          <div className="dashboard-empty">
            <h3>No orders yet</h3>
            <p>New customer orders will appear here.</p>
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard-order-id">{order.id}</td>
                    <td>{order.customer.name || "Guest"}</td>
                    <td>{order.type.replace("-", " ")}</td>
                    <td>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className="dashboard-status">
                        {order.status.replaceAll("-", " ")}
                      </span>
                    </td>
                    <td>{order.paymentStatus}</td>
                    <td>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
