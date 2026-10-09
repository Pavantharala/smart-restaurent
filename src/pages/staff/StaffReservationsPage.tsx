
import { useMemo, useState } from "react";

import { useReservation } from "../../context/ReservationContext";
import { useTable } from "../../context/TableContext";
import { useQueue } from "../../context/QueueContext";

import "./StaffReservationsPage.css";

export default function StaffReservationsPage() {
  const {
    reservations,
    checkInReservation,
    sendReservationToWaiting,
    markReservationNoShow,
    cancelReservation,
  } = useReservation();

  const { tables, updateTableStatus } = useTable();
  const { addToQueue } = useQueue();

  const [filter, setFilter] = useState<
    "all" | "active" | "waiting" | "checked-in" | "no-show"
  >("all");

  // Sort reservations by date and start time.
  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const dateA = `${a.slot.date} ${a.slot.startTime}`;
      const dateB = `${b.slot.date} ${b.slot.startTime}`;

      return dateA.localeCompare(dateB);
    });
  }, [reservations]);

  // Filter reservations by their current status.
  const filteredReservations = useMemo(() => {
    if (filter === "all") {
      return sortedReservations;
    }

    if (filter === "active") {
      return sortedReservations.filter(
        (reservation) =>
          reservation.status === "pending" ||
          reservation.status === "confirmed",
      );
    }

    return sortedReservations.filter(
      (reservation) => reservation.status === filter,
    );
  }, [sortedReservations, filter]);

  // Summary statistics.
  const summary = useMemo(() => {
    return {
      total: reservations.length,

      active: reservations.filter(
        (reservation) =>
          reservation.status === "pending" ||
          reservation.status === "confirmed",
      ).length,

      waiting: reservations.filter(
        (reservation) => reservation.status === "waiting",
      ).length,

      checkedIn: reservations.filter(
        (reservation) => reservation.status === "checked-in",
      ).length,

      noShow: reservations.filter(
        (reservation) => reservation.status === "no-show",
      ).length,
    };
  }, [reservations]);

  // Find the physical table assigned to a reservation.
  const getReservationTable = (tableId: string) => {
    return tables.find((table) => table.id === tableId);
  };

  // ----------------------------------------------------------
  // CHECK IN
  // ----------------------------------------------------------

  const handleCheckIn = (reservationId: string) => {
    const reservation = reservations.find(
      (item) => item.id === reservationId,
    );

    if (!reservation) {
      return;
    }

    const table = getReservationTable(reservation.tableId);

    if (!table) {
      window.alert("Reserved table could not be found.");
      return;
    }

    if (
      table.status === "occupied" ||
      table.status === "cleaning"
    ) {
      window.alert(
        `Table ${table.number} is not ready yet.\n\nSend the customer to Waiting Lounge instead.`,
      );

      return;
    }

    updateTableStatus(table.id, "occupied");
    checkInReservation(reservation.id);
  };

  // ----------------------------------------------------------
  // SEND RESERVATION TO WAITING LOUNGE
  // ----------------------------------------------------------

  const handleSendToWaiting = (reservationId: string) => {
    const reservation = reservations.find(
      (item) => item.id === reservationId,
    );

    if (!reservation) {
      return;
    }

    try {
      addToQueue({
        customerId: reservation.id,
        orderId: reservation.orderId,
        reservationId: reservation.id,
        partySize: reservation.partySize,
        notifyWhenReady: true,
      });

      sendReservationToWaiting(reservation.id);

      window.alert(
        `Reservation ${reservation.id} has been moved to the Waiting Lounge.`,
      );
    } catch (error) {
      console.error(
        "Failed to move reservation to Waiting Lounge:",
        error,
      );

      window.alert(
        "Could not move the reservation to Waiting Lounge.",
      );
    }
  };

  // ----------------------------------------------------------
  // MARK NO-SHOW
  // ----------------------------------------------------------

  const handleNoShow = (reservationId: string) => {
    const reservation = reservations.find(
      (item) => item.id === reservationId,
    );

    if (!reservation) {
      return;
    }

    const table = getReservationTable(reservation.tableId);

    const confirmed = window.confirm(
      `Mark reservation ${reservation.id} as NO-SHOW?\n\n` +
        `Customer: ${reservation.customerName}\n` +
        `Table: ${table?.number ?? "-"}\n\n` +
        "This should only be used when the customer has not arrived.",
    );

    if (!confirmed) {
      return;
    }

    markReservationNoShow(reservation.id);
  };

  // ----------------------------------------------------------
  // CANCEL RESERVATION
  // ----------------------------------------------------------

  const handleCancel = (reservationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!confirmed) {
      return;
    }

    cancelReservation(reservationId);
  };

  // ----------------------------------------------------------
  // PAYMENT LABEL
  // ----------------------------------------------------------

  const getPaymentLabel = (status: string) => {
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
  };

  // ----------------------------------------------------------
  // PAGE UI
  // ----------------------------------------------------------

  return (
    <section className="staff-reservations-page">
      <header className="reservations-header">
        <p className="reservations-eyebrow">STAFF OPERATIONS</p>

        <h1>Reservation Management</h1>

        <p className="reservations-subtitle">
          Manage arrivals, late customers, waiting customers and no-shows.
        </p>
      </header>

      {/* SUMMARY CARDS */}

      <div className="reservations-summary">
        <SummaryCard label="Total" value={summary.total} />
        <SummaryCard label="Active" value={summary.active} />
        <SummaryCard label="Waiting" value={summary.waiting} />
        <SummaryCard label="Checked In" value={summary.checkedIn} />
        <SummaryCard label="No-show" value={summary.noShow} />
      </div>

      {/* FILTERS */}

      <div className="reservations-filters">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />

        <FilterButton
          active={filter === "active"}
          onClick={() => setFilter("active")}
          label="Active"
        />

        <FilterButton
          active={filter === "waiting"}
          onClick={() => setFilter("waiting")}
          label="Waiting"
        />

        <FilterButton
          active={filter === "checked-in"}
          onClick={() => setFilter("checked-in")}
          label="Checked In"
        />

        <FilterButton
          active={filter === "no-show"}
          onClick={() => setFilter("no-show")}
          label="No-show"
        />
      </div>

      {/* RESERVATION LIST */}

      {filteredReservations.length === 0 ? (
        <div className="reservations-empty">
          <h3>No reservations found</h3>

          <p>
            There are no reservations matching this filter.
          </p>
        </div>
      ) : (
        <div className="reservations-list">
          {filteredReservations.map((reservation) => {
            const table = getReservationTable(
              reservation.tableId,
            );

            const tableReady =
              Boolean(table) &&
              (table?.status === "available" ||
                table?.status === "reserved");

            const canCheckIn =
              reservation.status === "pending" ||
              reservation.status === "confirmed" ||
              reservation.status === "waiting";

            const canSendToWaiting =
              reservation.status === "pending" ||
              reservation.status === "confirmed";

            const canMarkNoShow =
              reservation.status === "pending" ||
              reservation.status === "confirmed";

            const canCancel =
              reservation.status === "pending" ||
              reservation.status === "confirmed" ||
              reservation.status === "waiting";

            const remainingAmount = Math.max(
              reservation.payment.amountDue -
                reservation.payment.amountPaid,
              0,
            );

            return (
              <article
                className="reservation-card"
                key={reservation.id}
              >
                {/* CARD HEADER */}

                <div className="reservation-card-header">
                  <div className="reservation-customer">
                    <h2>{reservation.customerName}</h2>

                    <p>
                      Reservation ID: {reservation.id}
                    </p>
                  </div>

                  <StatusBadge status={reservation.status} />
                </div>

                {/* RESERVATION DETAILS */}

                <div className="reservation-details">
                  <InfoItem
                    label="Table"
                    value={
                      table
                        ? `Table ${table.number}`
                        : reservation.tableId
                    }
                  />

                  <InfoItem
                    label="Date"
                    value={reservation.slot.date}
                  />

                  <InfoItem
                    label="Time"
                    value={`${reservation.slot.startTime} - ${reservation.slot.endTime}`}
                  />

                  <InfoItem
                    label="Party Size"
                    value={String(reservation.partySize)}
                  />

                  <InfoItem
                    label="Physical Table"
                    value={table?.status ?? "Unknown"}
                  />

                  <InfoItem
                    label="Payment"
                    value={getPaymentLabel(
                      reservation.payment.status,
                    )}
                  />

                  <InfoItem
                    label="Amount Due"
                    value={`₹${reservation.payment.amountDue}`}
                  />

                  <InfoItem
                    label="Amount Paid"
                    value={`₹${reservation.payment.amountPaid}`}
                  />

                  <InfoItem
                    label="Remaining"
                    value={`₹${remainingAmount}`}
                  />

                  <InfoItem
                    label="Payment Method"
                    value={reservation.payment.method}
                  />

                  {reservation.payment.transactionId && (
                    <InfoItem
                      label="Transaction"
                      value={reservation.payment.transactionId}
                    />
                  )}
                </div>

                {/* TABLE NOT READY NOTICE */}

                {canCheckIn &&
                  !tableReady &&
                  table &&
                  (table.status === "occupied" ||
                    table.status === "cleaning") && (
                    <div className="reservation-notice reservation-notice-warning">
                      <strong>Table not ready</strong>

                      <p>
                        Table {table.number} is currently{" "}
                        {table.status}. The customer can wait in
                        the Waiting Lounge.
                      </p>
                    </div>
                  )}

                {/* WAITING LOUNGE NOTICE */}

                {reservation.status === "waiting" && (
                  <div className="reservation-notice reservation-notice-info">
                    <strong>Waiting Lounge</strong>

                    <p>
                      This reservation is connected to the
                      Waiting Lounge queue. Staff can assign an
                      available table from the Queue Management
                      page.
                    </p>
                  </div>
                )}

                {/* ACTION BUTTONS */}

                <div className="reservation-actions">
                  {canCheckIn && tableReady && (
                    <button
                      type="button"
                      className="reservation-button reservation-button-primary"
                      onClick={() =>
                        handleCheckIn(reservation.id)
                      }
                    >
                      Check In
                    </button>
                  )}

                  {canSendToWaiting && !tableReady && (
                    <button
                      type="button"
                      className="reservation-button reservation-button-waiting"
                      onClick={() =>
                        handleSendToWaiting(reservation.id)
                      }
                    >
                      Send to Waiting
                    </button>
                  )}

                  {canMarkNoShow && (
                    <button
                      type="button"
                      className="reservation-button reservation-button-danger"
                      onClick={() =>
                        handleNoShow(reservation.id)
                      }
                    >
                      Mark No-show
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className="reservation-button reservation-button-outline"
                      onClick={() =>
                        handleCancel(reservation.id)
                      }
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="reservation-summary-card">
      <div className="reservation-summary-label">
        {label}
      </div>

      <strong className="reservation-summary-value">
        {value}
      </strong>
    </div>
  );
}

// ============================================================
// FILTER BUTTON
// ============================================================

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`reservation-filter-button ${
        active ? "is-active" : ""
      }`}
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="reservation-info-item">
      <div className="reservation-info-label">
        {label}
      </div>

      <strong className="reservation-info-value">
        {value}
      </strong>
    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const statusClass = status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  let label = status;

  if (status === "no-show") {
    label = "No-show";
  } else if (status === "checked-in") {
    label = "Checked In";
  } else if (status === "pending") {
    label = "Pending";
  } else if (status === "confirmed") {
    label = "Confirmed";
  } else if (status === "waiting") {
    label = "Waiting";
  } else if (status === "cancelled") {
    label = "Cancelled";
  } else if (status === "completed") {
    label = "Completed";
  }

  return (
    <span
      className={`reservation-status-badge reservation-status-${statusClass}`}
    >
      {label}
    </span>
  );
}