
 // =========================================================
 // SMART CAFE - STAFF TABLE MANAGEMENT
 // =========================================================
 //
 // Displays all cafe tables and allows staff to update
 // their physical status.
 //
 // Reservation status and physical table status are
 // separate systems. Reservations do not automatically
 // change the physical status of a table.
 // =========================================================

import type {
  TableReservation,
  TableStatus,
} from "../../types/Table";

import { useTable } from "../../context/TableContext";
import { useReservation } from "../../context/ReservationContext";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

// Convert a reservation date/time into a comparable timestamp.
function getReservationDateTime(
  reservation: TableReservation,
): number {
  return new Date(
    `${reservation.slot.date}T${reservation.slot.startTime}`,
  ).getTime();
}

// Format a reservation date for display.
function formatReservationDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =========================================================
// COMPONENT
// =========================================================

export default function TablesPage() {
  // =======================================================
  // TABLE CONTEXT
  // =======================================================

  const {
    tables,
    updateTableStatus,
  } = useTable();

  // =======================================================
  // RESERVATION CONTEXT
  // =======================================================

  const { reservations } = useReservation();

  // =======================================================
  // STATUS LABELS
  // =======================================================

  function getStatusLabel(status: TableStatus): string {
    switch (status) {
      case "available":
        return "Available";

      case "occupied":
        return "Occupied";

      case "reserved":
        return "Reserved";

      case "cleaning":
        return "Cleaning";

      default:
        return status;
    }
  }

  function getPaymentStatusLabel(status: string): string {
    switch (status) {
      case "not-paid":
        return "Not Paid";

      case "partially-paid":
        return "Partially Paid";

      case "fully-paid":
        return "Fully Paid";

      case "refunded":
        return "Refunded";

      default:
        return status;
    }
  }

  function getReservationStatusLabel(status: string): string {
    switch (status) {
      case "pending":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      case "cancelled":
        return "Cancelled";

      case "completed":
        return "Completed";

      case "no-show":
        return "No Show";

      default:
        return status;
    }
  }

  // =======================================================
  // FIND NEXT ACTIVE RESERVATION
  // =======================================================

  function getNextReservation(
    tableId: string,
  ): TableReservation | undefined {
    const now = Date.now();

    return reservations
      .filter((reservation) => {
        // Only reservations assigned to this table.
        if (reservation.tableId !== tableId) {
          return false;
        }

        // Ignore inactive reservations.
        if (
          reservation.status === "cancelled" ||
          reservation.status === "completed" ||
          reservation.status === "no-show"
        ) {
          return false;
        }

        // Display upcoming reservations only.
        const reservationTime =
          getReservationDateTime(reservation);

        return (
          Number.isFinite(reservationTime) &&
          reservationTime >= now
        );
      })
      .sort(
        (a, b) =>
          getReservationDateTime(a) -
          getReservationDateTime(b),
      )[0];
  }

  // =======================================================
  // RESERVATION COUNTS
  // =======================================================

  const activeReservationCount = reservations.filter(
    (reservation) =>
      reservation.status === "pending" ||
      reservation.status === "confirmed",
  ).length;

  // =======================================================
  // TABLE STATUS COUNTS
  // =======================================================

  const availableCount = tables.filter(
    (table) => table.status === "available",
  ).length;

  const occupiedCount = tables.filter(
    (table) => table.status === "occupied",
  ).length;

  const reservedCount = tables.filter(
    (table) => table.status === "reserved",
  ).length;

  const cleaningCount = tables.filter(
    (table) => table.status === "cleaning",
  ).length;

  // =======================================================
  // PAGE
  // =======================================================

  return (
    <main className="page-container">
      <section className="staff-tables-page">
        {/* PAGE HEADER */}

        <div className="page-header">
          <p className="page-eyebrow">STAFF</p>

          <h1>Table Management</h1>

          <p>
            Monitor cafe tables, reservations, and physical
            table status.
          </p>
        </div>

        {/* SUMMARY */}

        <div className="table-summary-grid">
          <div className="summary-card">
            <span>Total Tables</span>
            <strong>{tables.length}</strong>
          </div>

          <div className="summary-card">
            <span>Available</span>
            <strong>{availableCount}</strong>
          </div>

          <div className="summary-card">
            <span>Occupied</span>
            <strong>{occupiedCount}</strong>
          </div>

          <div className="summary-card">
            <span>Reserved</span>
            <strong>{reservedCount}</strong>
          </div>

          <div className="summary-card">
            <span>Cleaning</span>
            <strong>{cleaningCount}</strong>
          </div>

          <div className="summary-card">
            <span>Active Reservations</span>
            <strong>{activeReservationCount}</strong>
          </div>
        </div>

        {/* TABLE GRID */}

        <div className="staff-table-grid">
          {tables.map((table) => {
            const nextReservation =
              getNextReservation(table.id);

            const amountDue =
              nextReservation?.payment?.amountDue ?? 0;

            const amountPaid =
              nextReservation?.payment?.amountPaid ?? 0;

            const remainingAmount = Math.max(
              0,
              amountDue - amountPaid,
            );

            return (
              <article
                key={table.id}
                className={`staff-table-card table-status-${table.status}`}
              >
                {/* TABLE HEADER */}

                <div className="staff-table-card-header">
                  <div>
                    <span className="table-label">TABLE</span>
                    <h2>Table {table.number}</h2>
                  </div>

                  <span className="table-status-badge">
                    {getStatusLabel(table.status)}
                  </span>
                </div>

                {/* TABLE INFORMATION */}

                <div className="staff-table-info">
                  <div>
                    <span>Table ID</span>
                    <strong>{table.id}</strong>
                  </div>

                  <div>
                    <span>Capacity</span>
                    <strong>{table.capacity} people</strong>
                  </div>

                  <div>
                    <span>QR Token</span>
                    <strong>{table.qrToken}</strong>
                  </div>

                  {table.orderId && (
                    <div>
                      <span>Current Order</span>
                      <strong>{table.orderId}</strong>
                    </div>
                  )}

                  {table.gamingStationId && (
                    <div>
                      <span>Gaming Station</span>
                      <strong>{table.gamingStationId}</strong>
                    </div>
                  )}
                </div>

                {/* UPCOMING RESERVATION */}

                {nextReservation && (
                  <div className="staff-table-reservation">
                    <div className="reservation-section-header">
                      <span>UPCOMING RESERVATION</span>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Customer</span>
                      <strong>
                        {nextReservation.customerName}
                      </strong>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Date</span>
                      <strong>
                        {formatReservationDate(
                          nextReservation.slot.date,
                        )}
                      </strong>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Time</span>
                      <strong>
                        {nextReservation.slot.startTime}
                        {" - "}
                        {nextReservation.slot.endTime}
                      </strong>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Party</span>
                      <strong>
                        {nextReservation.partySize}{" "}
                        {nextReservation.partySize === 1
                          ? "Person"
                          : "People"}
                      </strong>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Reservation</span>
                      <strong>
                        {getReservationStatusLabel(
                          nextReservation.status,
                        )}
                      </strong>
                    </div>

                    <div className="staff-reservation-row">
                      <span>Payment</span>
                      <strong>
                        {getPaymentStatusLabel(
                          nextReservation.payment?.status ??
                            "not-paid",
                        )}
                      </strong>
                    </div>

                    {amountDue > 0 && (
                      <div className="staff-reservation-row">
                        <span>Remaining</span>
                        <strong>
                          ₹{remainingAmount.toFixed(2)}
                        </strong>
                      </div>
                    )}

                    <div className="staff-reservation-row">
                      <span>Reservation ID</span>
                      <strong>{nextReservation.id}</strong>
                    </div>
                  </div>
                )}

                {/* NO UPCOMING RESERVATION */}

                {!nextReservation && (
                  <div className="staff-table-no-reservation">
                    <span>Upcoming Reservation</span>
                    <strong>No upcoming reservation</strong>
                  </div>
                )}

                {/* PHYSICAL STATUS INFORMATION */}

                <div className="staff-table-note">
                  <strong>Physical Status</strong>

                  <p>
                    Reservation information does not
                    automatically change the physical table
                    status.
                  </p>
                </div>

                {/* STATUS CONTROL */}

                <div className="staff-table-actions">
                  <label htmlFor={`status-${table.id}`}>
                    Update Physical Status
                  </label>

                  <select
                    id={`status-${table.id}`}
                    value={table.status}
                    onChange={(event) =>
                      updateTableStatus(
                        table.id,
                        event.target.value as TableStatus,
                      )
                    }
                  >
                    <option value="available">
                      Available
                    </option>

                    <option value="occupied">
                      Occupied
                    </option>

                    <option value="reserved">
                      Reserved
                    </option>

                    <option value="cleaning">
                      Cleaning
                    </option>
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}