
import { useMemo, useState } from "react";
import { useOrder } from "../../context/OrderContext";
import { useMenu } from "../../context/MenuContext";
import { useTable } from "../../context/TableContext";
import { useQueue } from "../../context/QueueContext";
import { useReservation } from "../../context/ReservationContext";
import { useGaming } from "../../context/GamingContext";
import "./AdminDashboardPage.css";

type Period = "today" | "yesterday" | "week" | "month" | "year" | "custom";

interface DateRange {
  start: Date;
  endExclusive: Date;
  label: string;
}

interface RevenueBucket {
  label: string;
  start: Date;
  endExclusive: Date;
  revenue: number;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);

  return localDateString(date) === value ? date : null;
}

function getDateRange(
  period: Period,
  customStart: string,
  customEnd: string,
): DateRange {
  const today = startOfDay(new Date());

  if (period === "today") {
    return {
      start: today,
      endExclusive: addDays(today, 1),
      label: "Today",
    };
  }

  if (period === "yesterday") {
    const start = addDays(today, -1);

    return {
      start,
      endExclusive: today,
      label: "Yesterday",
    };
  }

  if (period === "week") {
    const start = addDays(today, -((today.getDay() + 6) % 7));

    return {
      start,
      endExclusive: addDays(start, 7),
      label: "This Week",
    };
  }

  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      start,
      endExclusive: new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1,
      ),
      label: "This Month",
    };
  }

  if (period === "year") {
    const start = new Date(today.getFullYear(), 0, 1);

    return {
      start,
      endExclusive: new Date(today.getFullYear() + 1, 0, 1),
      label: "This Year",
    };
  }

  const parsedStart = parseDateInput(customStart);
  const parsedEnd = parseDateInput(customEnd);

  if (
    !parsedStart ||
    !parsedEnd ||
    parsedStart.getTime() > parsedEnd.getTime()
  ) {
    return {
      start: today,
      endExclusive: addDays(today, 1),
      label: "Custom Range — choose valid dates",
    };
  }

  return {
    start: parsedStart,
    endExclusive: addDays(parsedEnd, 1),
    label: `${parsedStart.toLocaleDateString("en-IN")} – ${parsedEnd.toLocaleDateString("en-IN")}`,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

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

function isInsideRange(dateValue: string, range: DateRange): boolean {
  const timestamp = new Date(dateValue).getTime();

  return (
    Number.isFinite(timestamp) &&
    timestamp >= range.start.getTime() &&
    timestamp < range.endExclusive.getTime()
  );
}

function getPreviousRange(range: DateRange): DateRange {
  const duration = range.endExclusive.getTime() - range.start.getTime();

  return {
    start: new Date(range.start.getTime() - duration),
    endExclusive: range.start,
    label: "Previous equivalent period",
  };
}

function formatPercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current === 0 ? "0%" : "No previous baseline";
  }

  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage > 0 ? "+" : "";

  return `${sign}${percentage.toFixed(1)}%`;
}

export default function AdminDashboardPage() {
  const { orders } = useOrder();
  const { menuItems } = useMenu();
  const { tables } = useTable();
  const { queue } = useQueue();
  const { reservations } = useReservation();
  const { sessions } = useGaming();

  const today = localDateString(new Date());

  const [period, setPeriod] = useState<Period>("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  const dateRange = useMemo(
    () => getDateRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  );

  const previousRange = useMemo(
    () => getPreviousRange(dateRange),
    [dateRange],
  );

  const metrics = useMemo(() => {
    const rangeOrders = orders.filter((order) =>
      isInsideRange(order.createdAt, dateRange),
    );

    const paidOrders = rangeOrders.filter(
      (order) => order.paymentStatus === "paid",
    );

    const nonCancelledOrders = rangeOrders.filter(
      (order) => order.status !== "cancelled",
    );

    const recordedRevenue = paidOrders.reduce(
      (total, order) => total + order.totalAmount,
      0,
    );

    const averageOrderValue =
      nonCancelledOrders.length > 0
        ? nonCancelledOrders.reduce(
            (total, order) => total + order.totalAmount,
            0,
          ) / nonCancelledOrders.length
        : 0;

    const activeOrders = orders.filter(
      (order) =>
        order.status !== "completed" &&
        order.status !== "cancelled",
    );

    const completedOrders = orders.filter(
      (order) => order.status === "completed",
    );

    const cancelledOrders = orders.filter(
      (order) => order.status === "cancelled",
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
      rangeOrderCount: rangeOrders.length,
      recordedRevenue,
      averageOrderValue,
      paidOrderCount: paidOrders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalOrders: orders.length,
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
  }, [orders, menuItems, tables, queue, reservations, sessions, dateRange]);

  const comparison = useMemo(() => {
    const previousOrders = orders.filter((order) =>
      isInsideRange(order.createdAt, previousRange),
    );

    const previousPaidOrders = previousOrders.filter(
      (order) => order.paymentStatus === "paid",
    );

    const previousRevenue = previousPaidOrders.reduce(
      (total, order) => total + order.totalAmount,
      0,
    );

    return {
      previousRevenue,
      previousOrderCount: previousOrders.length,
      revenueChange: formatPercentageChange(
        metrics.recordedRevenue,
        previousRevenue,
      ),
      orderChange: formatPercentageChange(
        metrics.rangeOrderCount,
        previousOrders.length,
      ),
    };
  }, [
    orders,
    previousRange,
    metrics.recordedRevenue,
    metrics.rangeOrderCount,
  ]);

  const revenueBuckets = useMemo<RevenueBucket[]>(() => {
    const start = dateRange.start;
    const end = dateRange.endExclusive;
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / 86_400_000,
    );

    const buckets: RevenueBucket[] = [];

    if (totalDays <= 31) {
      for (
        let cursor = startOfDay(start);
        cursor < end;
        cursor = addDays(cursor, 1)
      ) {
        buckets.push({
          label: cursor.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          }),
          start: cursor,
          endExclusive: addDays(cursor, 1),
          revenue: 0,
        });
      }
    } else {
      let cursor = new Date(start.getFullYear(), start.getMonth(), 1);

      while (cursor < end) {
        const bucketEnd = new Date(
          cursor.getFullYear(),
          cursor.getMonth() + 1,
          1,
        );

        buckets.push({
          label: cursor.toLocaleDateString("en-IN", {
            month: "short",
            year: "2-digit",
          }),
          start: cursor,
          endExclusive: bucketEnd,
          revenue: 0,
        });

        cursor = bucketEnd;
      }
    }

    const paidOrders = orders.filter(
      (order) =>
        order.paymentStatus === "paid" &&
        isInsideRange(order.createdAt, dateRange),
    );

    for (const order of paidOrders) {
      const timestamp = new Date(order.createdAt).getTime();

      const bucket = buckets.find(
        (item) =>
          timestamp >= item.start.getTime() &&
          timestamp < item.endExclusive.getTime(),
      );

      if (bucket) bucket.revenue += order.totalAmount;
    }

    return buckets;
  }, [orders, dateRange]);

  const maximumRevenue = Math.max(
    1,
    ...revenueBuckets.map((bucket) => bucket.revenue),
  );

  const customDatesInvalid =
    period === "custom" &&
    (!parseDateInput(customStart) ||
      !parseDateInput(customEnd) ||
      customStart > customEnd);

  return (
    <section className="admin-dashboard">
      <header className="dashboard-heading">
        <div>
          <p className="dashboard-eyebrow">SMART CAFE MANAGEMENT</p>
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Monitor revenue and your cafe's daily operations.
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
        <h2 className="dashboard-section-title">Revenue Analytics</h2>

        <div className="dashboard-period-filters">
          {(
            [
              ["today", "Today"],
              ["yesterday", "Yesterday"],
              ["week", "This Week"],
              ["month", "This Month"],
              ["year", "This Year"],
              ["custom", "Custom Range"],
            ] as [Period, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`dashboard-period-button ${period === value ? "active" : ""}`}
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
            >
              {label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="dashboard-custom-dates">
            <label>
              Start date
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>

            <label>
              End date
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        )}

        {customDatesInvalid && (
          <p className="dashboard-validation-message">
            Choose a valid start date and end date. The end date must not be
            earlier than the start date.
          </p>
        )}

        <p className="dashboard-range-label">
          Showing results for: <strong>{dateRange.label}</strong>
        </p>

        <div className="dashboard-stats-grid">
          <StatCard
            label="Recorded Revenue"
            value={formatCurrency(metrics.recordedRevenue)}
            detail={`${metrics.paidOrderCount} orders marked as paid`}
          />
          <StatCard
            label="Orders in Period"
            value={metrics.rangeOrderCount}
            detail="Orders created during the selected dates"
          />
          <StatCard
            label="Average Order Value"
            value={formatCurrency(metrics.averageOrderValue)}
            detail="Excludes cancelled orders"
          />
          <StatCard
            label="All-Time Orders"
            value={metrics.totalOrders}
            detail={`${metrics.activeOrders} currently active`}
          />
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-heading">
            <div>
              <h3>Revenue Trend</h3>
              <p>Recorded paid revenue for the selected period</p>
            </div>
            <strong>{formatCurrency(metrics.recordedRevenue)}</strong>
          </div>

          {revenueBuckets.length === 0 ? (
            <p className="dashboard-chart-empty">
              No dates are available for this range.
            </p>
          ) : (
            <div className="dashboard-chart-scroll">
              <div
                className="dashboard-bar-chart"
                style={{
                  minWidth: `${Math.max(revenueBuckets.length * 48, 100)}px`,
                }}
              >
                {revenueBuckets.map((bucket) => {
                  const height =
                    bucket.revenue > 0
                      ? Math.max(
                          5,
                          (bucket.revenue / maximumRevenue) * 100,
                        )
                      : 0;

                  return (
                    <div
                      className="dashboard-bar-column"
                      key={bucket.start.toISOString()}
                      title={`${bucket.label}: ${formatCurrency(bucket.revenue)}`}
                    >
                      <span className="dashboard-bar-value">
                        {bucket.revenue > 0
                          ? formatCurrency(bucket.revenue)
                          : ""}
                      </span>
                      <div className="dashboard-bar-track">
                        <div
                          className="dashboard-bar"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="dashboard-bar-label">
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <p className="dashboard-note">
          Revenue is calculated from orders marked as paid in the app. It is
          not yet independently verified against a payment gateway.
        </p>
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Period Comparison</h2>
        <p className="dashboard-comparison-description">
          Compared with the immediately preceding period of equal duration.
        </p>

        <div className="dashboard-stats-grid">
          <StatCard
            label="Previous Period Revenue"
            value={formatCurrency(comparison.previousRevenue)}
            detail={`${comparison.previousOrderCount} orders in the previous period`}
          />
          <StatCard
            label="Revenue Change"
            value={comparison.revenueChange}
            detail={`Current: ${formatCurrency(metrics.recordedRevenue)} · Previous: ${formatCurrency(comparison.previousRevenue)}`}
          />
          <StatCard
            label="Order Count Change"
            value={comparison.orderChange}
            detail={`${metrics.rangeOrderCount} current orders · ${comparison.previousOrderCount} previous orders`}
          />
        </div>
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
          <StatCard
            label="Completed Orders"
            value={metrics.completedOrders}
            detail={`${metrics.cancelledOrders} cancelled overall`}
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
