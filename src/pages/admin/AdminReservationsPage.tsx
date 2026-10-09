 // =========================================================
// SMART CAFE - ADMIN RESERVATIONS
// =========================================================
//
// ADMIN CAN:
//
// - View reservations
// - Filter reservations
// - Confirm reservations
// - Cancel reservations
// - View customer information
// - View reservation date/time
// - View table
// - View physical table status
// - View payment status
// - View amount due
// - View amount paid
// - View remaining balance
//
// IMPORTANT:
//
// Reservation status and physical table status are separate.
//
// =========================================================

import { useMemo, useState } from "react";

import { useReservation } from "../../context/ReservationContext";
import { useTable } from "../../context/TableContext";

// =========================================================
// HELPERS
// =========================================================

function formatDate(
  date: string,
): string {
  const parsedDate = new Date(
    `${date}T00:00:00`,
  );

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatTime(
  time: string,
): string {
  const [hours, minutes] =
    time.split(":").map(Number);

  const period =
    hours >= 12 ? "PM" : "AM";

  const displayHour =
    hours % 12 || 12;

  return `${displayHour}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;
}

function formatCurrency(
  amount: number,
): string {
  return `₹${amount.toLocaleString(
    "en-IN",
  )}`;
}

// =========================================================
// PAGE
// =========================================================

export default function AdminReservationsPage() {
  const {
    reservations,
    confirmReservation,
    cancelReservation,
  } = useReservation();

  const { tables } = useTable();

  // =======================================================
  // FILTER STATE
  // =======================================================

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("");

  // =======================================================
  // FILTERED RESERVATIONS
  // =======================================================

  const filteredReservations =
    useMemo(() => {
      return reservations.filter(
        (reservation) => {
          const matchesStatus =
            statusFilter === "all" ||
            reservation.status ===
              statusFilter;

          const matchesDate =
            !dateFilter ||
            reservation.slot.date ===
              dateFilter;

          return (
            matchesStatus &&
            matchesDate
          );
        },
      );
    }, [
      reservations,
      statusFilter,
      dateFilter,
    ]);

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary = useMemo(() => {
    return {
      total: reservations.length,

      pending:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "pending",
        ).length,

      confirmed:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "confirmed",
        ).length,

      cancelled:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "cancelled",
        ).length,

      noShow:
        reservations.filter(
          (reservation) =>
            reservation.status ===
            "no-show",
        ).length,
    };
  }, [reservations]);

  // =======================================================
  // GET TABLE
  // =======================================================

  function getTable(
    tableId: string,
  ) {
    return tables.find(
      (table) =>
        table.id === tableId,
    );
  }

  // =======================================================
  // CONFIRM RESERVATION
  // =======================================================

  function handleConfirm(
    reservationId: string,
  ) {
    const confirmed =
      confirmReservation(
        reservationId,
      );

    if (!confirmed) {
      alert(
        "This reservation cannot be confirmed because the table has a conflicting reservation.",
      );

      return;
    }

    alert(
      "Reservation confirmed successfully.",
    );
  }

  // =======================================================
  // CANCEL RESERVATION
  // =======================================================

  function handleCancel(
    reservationId: string,
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to cancel this reservation?",
      );

    if (!confirmed) {
      return;
    }

    cancelReservation(
      reservationId,
    );
  }

  // =======================================================
  // PAYMENT STATUS LABEL
  // =======================================================

  function getPaymentStatusLabel(
    status: string,
  ): string {
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

  // =======================================================
  // PAYMENT STATUS CLASS
  // =======================================================

  function getPaymentStatusClass(
    status: string,
  ): string {
    switch (status) {
      case "fully-paid":
        return "payment-status payment-paid";

      case "partially-paid":
        return "payment-status payment-partial";

      case "refunded":
        return "payment-status payment-refunded";

      default:
        return "payment-status payment-not-paid";
    }
  }

  // =======================================================
  // PAYMENT METHOD
  // =======================================================

  function getPaymentMethodLabel(
    method: string,
  ): string {
    switch (method) {
      case "upi":
        return "UPI";

      case "card":
        return "Card";

      case "cash":
        return "Cash";

      case "no-payment":
        return "No Payment";

      default:
        return method;
    }
  }

  // =======================================================
  // STATUS LABEL
  // =======================================================

  function getStatusLabel(
    status: string,
  ): string {
    switch (status) {
      case "pending":
        return "Pending";

      case "confirmed":
        return "Confirmed";

      case "waiting":
        return "Waiting";

      case "checked-in":
        return "Checked In";

      case "cancelled":
        return "Cancelled";

      case "completed":
        return "Completed";

      case "no-show":
        return "No-show";

      default:
        return status;
    }
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      style={{
        padding: "24px",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1>
          Reservations
        </h1>

        <p>
          Manage customer table
          reservations and reservation
          payments.
        </p>
      </div>

      {/* SUMMARY */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <SummaryCard
          label="Total"
          value={summary.total}
        />

        <SummaryCard
          label="Pending"
          value={summary.pending}
        />

        <SummaryCard
          label="Confirmed"
          value={summary.confirmed}
        />

        <SummaryCard
          label="Cancelled"
          value={summary.cancelled}
        />

        <SummaryCard
          label="No-show"
          value={summary.noShow}
        />
      </div>

      {/* FILTERS */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
          style={{
            padding: "10px",
          }}
        >
          <option value="all">
            All Statuses
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="confirmed">
            Confirmed
          </option>

          <option value="waiting">
            Waiting
          </option>

          <option value="checked-in">
            Checked In
          </option>

          <option value="cancelled">
            Cancelled
          </option>

          <option value="completed">
            Completed
          </option>

          <option value="no-show">
            No Show
          </option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(
              event.target.value,
            )
          }
          style={{
            padding: "10px",
          }}
        />

        <button
          type="button"
          onClick={() => {
            setStatusFilter("all");
            setDateFilter("");
          }}
          style={{
            padding: "10px 16px",
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>

      {/* EMPTY STATE */}

      {filteredReservations.length ===
        0 && (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <h2>
            No Reservations
          </h2>

          <p>
            There are no reservations
            matching the selected
            filters.
          </p>
        </div>
      )}

      {/* RESERVATION LIST */}

      <div
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        {filteredReservations.map(
          (reservation) => {
            const table =
              getTable(
                reservation.tableId,
              );

            const payment =
              reservation.payment;

            const amountDue =
              payment?.amountDue ?? 0;

            const amountPaid =
              payment?.amountPaid ?? 0;

            const remainingBalance =
              Math.max(
                amountDue -
                  amountPaid,
                0,
              );

            const paymentStatus =
              payment?.status ??
              "not-paid";

            const paymentMethod =
              payment?.method ??
              "no-payment";

            return (
              <div
                key={reservation.id}
                style={{
                  padding: "20px",
                  border:
                    "1px solid #ddd",
                  borderRadius: "12px",
                  background: "#fff",
                }}
              >
                {/* RESERVATION HEADER */}

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    gap: "16px",
                    flexWrap:
                      "wrap",
                    marginBottom:
                      "18px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        margin: 0,
                      }}
                    >
                      Reservation
                    </h2>

                    <small>
                      ID:{" "}
                      {
                        reservation.id
                      }
                    </small>
                  </div>

                  <div
                    style={{
                      padding:
                        "7px 11px",
                      borderRadius:
                        "999px",
                      background:
                        "#f3f4f6",
                      fontWeight: 700,
                      fontSize:
                        "13px",
                    }}
                  >
                    {getStatusLabel(
                      reservation.status,
                    )}
                  </div>
                </div>

                {/* INFORMATION */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    marginBottom:
                      "20px",
                  }}
                >
                  {/* CUSTOMER */}

                  <div>
                    <strong>
                      Customer
                    </strong>

                    <p>
                      {
                        reservation.customerName
                      }
                    </p>

                    <p>
                      Phone:{" "}
                      {reservation.customerPhone ||
                        "Not provided"}
                    </p>

                    <p>
                      Party Size:{" "}
                      {
                        reservation.partySize
                      }
                    </p>
                  </div>

                  {/* TIME */}

                  <div>
                    <strong>
                      Reservation Time
                    </strong>

                    <p>
                      {formatDate(
                        reservation
                          .slot.date,
                      )}
                    </p>

                    <p>
                      {formatTime(
                        reservation
                          .slot
                          .startTime,
                      )}{" "}
                      →{" "}
                      {formatTime(
                        reservation
                          .slot
                          .endTime,
                      )}
                    </p>
                  </div>

                  {/* TABLE */}

                  <div>
                    <strong>
                      Table
                    </strong>

                    <p>
                      {table
                        ? `Table ${table.number}`
                        : reservation.tableId}
                    </p>

                    <p>
                      Capacity:{" "}
                      {table?.capacity ??
                        "Unknown"}
                    </p>

                    <p>
                      Physical Status:{" "}
                      {table?.status ??
                        "Unknown"}
                    </p>
                  </div>

                  {/* PAYMENT */}

                  <div>
                    <strong>
                      Payment
                    </strong>

                    <p
                      className={getPaymentStatusClass(
                        paymentStatus,
                      )}
                    >
                      {getPaymentStatusLabel(
                        paymentStatus,
                      )}
                    </p>

                    <p>
                      Amount Due:{" "}
                      <strong>
                        {formatCurrency(
                          amountDue,
                        )}
                      </strong>
                    </p>

                    <p>
                      Amount Paid:{" "}
                      <strong>
                        {formatCurrency(
                          amountPaid,
                        )}
                      </strong>
                    </p>

                    <p>
                      Remaining Balance:{" "}
                      <strong>
                        {formatCurrency(
                          remainingBalance,
                        )}
                      </strong>
                    </p>

                    <p>
                      Method:{" "}
                      {getPaymentMethodLabel(
                        paymentMethod,
                      )}
                    </p>
                  </div>
                </div>

                {/* TRANSACTION */}

                {payment?.transactionId && (
                  <div
                    style={{
                      padding: "12px",
                      marginBottom:
                        "16px",
                      borderRadius:
                        "8px",
                      background:
                        "#f7f7f7",
                      fontSize:
                        "14px",
                    }}
                  >
                    <strong>
                      Transaction:
                    </strong>{" "}
                    {
                      payment.transactionId
                    }
                  </div>
                )}

                {/* ACTIONS */}

                <div
                  style={{
                    display: "flex",
                    flexWrap:
                      "wrap",
                    gap: "10px",
                  }}
                >
                  {/* CONFIRM */}

                  {reservation.status ===
                    "pending" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleConfirm(
                          reservation.id,
                        )
                      }
                      style={{
                        padding:
                          "10px 16px",
                        cursor:
                          "pointer",
                      }}
                    >
                      Confirm Reservation
                    </button>
                  )}

                  {/* CANCEL */}

                  {reservation.status !==
                    "cancelled" &&
                    reservation.status !==
                      "completed" &&
                    reservation.status !==
                      "no-show" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCancel(
                            reservation.id,
                          )
                        }
                        style={{
                          padding:
                            "10px 16px",
                          cursor:
                            "pointer",
                        }}
                      >
                        Cancel Reservation
                      </button>
                    )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: "16px",
        border:
          "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <strong>
        {label}
      </strong>

      <div
        style={{
          fontSize: "24px",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}