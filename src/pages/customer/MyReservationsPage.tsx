// =========================================================
// SMART CAFE - MY RESERVATIONS PAGE
// =========================================================
//
// Displays reservations created by this browser.
//
// Authentication/customer accounts will be added later.
// At that stage reservations can be filtered by customer.
//
// =========================================================

import { Link } from "react-router-dom";
import { useReservation } from "../../context/ReservationContext";
import { useTable } from "../../context/TableContext";

export default function MyReservationsPage() {
  const {
    reservations,
    cancelReservation,
  } = useReservation();

  const { getTableById } = useTable();

  // =======================================================
  // SORT RESERVATIONS
  // =======================================================

  const sortedReservations = [...reservations].sort((a, b) => {
    const first = `${a.slot.date} ${a.slot.startTime}`;
    const second = `${b.slot.date} ${b.slot.startTime}`;

    return second.localeCompare(first);
  });

  // =======================================================
  // CANCEL
  // =======================================================

  const handleCancel = (reservationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!confirmed) {
      return;
    }

    cancelReservation(reservationId);
  };

  // =======================================================
  // STATUS
  // =======================================================

  const getStatusLabel = (status: string) => {
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
  };

  // =======================================================
  // EMPTY STATE
  // =======================================================

  if (sortedReservations.length === 0) {
    return (
      <div className="page-container">

        <div className="card empty-state">

          <h1>
            My Reservations
          </h1>

          <p>
            You do not have any table reservations yet.
          </p>

          <Link
            to="/reserve-table"
            className="button"
          >
            Reserve a Table
          </Link>

        </div>

      </div>
    );
  }

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="page-container">

      <div className="page-header">

        <div>
          <h1>
            My Reservations
          </h1>

          <p>
            View and manage your table reservations.
          </p>
        </div>

        <Link
          to="/reserve-table"
          className="button"
        >
          Reserve Another Table
        </Link>

      </div>


      {/* ===================================================
          RESERVATION LIST
      =================================================== */}

      <div className="reservation-list">

        {sortedReservations.map((reservation) => {

          const table = getTableById(
            reservation.tableId,
          );

          const amountDue =
            reservation.payment?.amountDue ?? 0;

          const amountPaid =
            reservation.payment?.amountPaid ?? 0;

          const remainingAmount = Math.max(
            0,
            amountDue - amountPaid,
          );

          return (
            <div
              key={reservation.id}
              className="card reservation-card"
            >

              {/* =========================================
                  HEADER
              ========================================= */}

              <div className="reservation-card-header">

                <div>
                  <h2>
                    {table
                      ? `Table ${table.number}`
                      : "Reserved Table"}
                  </h2>

                  <span>
                    Reservation ID: {reservation.id}
                  </span>
                </div>

                <span className="reservation-status">
                  {getStatusLabel(reservation.status)}
                </span>

              </div>


              {/* =========================================
                  DETAILS
              ========================================= */}

              <div className="details-grid">

                <div className="detail-item">
                  <span>Date</span>

                  <strong>
                    {reservation.slot.date}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Time</span>

                  <strong>
                    {reservation.slot.startTime}
                    {" - "}
                    {reservation.slot.endTime}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Party Size</span>

                  <strong>
                    {reservation.partySize}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Payment</span>

                  <strong>
                    {reservation.payment?.status ===
                    "fully-paid"
                      ? "Fully Paid"
                      : reservation.payment?.status ===
                        "partially-paid"
                      ? "Partially Paid"
                      : "Not Paid"}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Amount Paid</span>

                  <strong>
                    ₹{amountPaid.toFixed(2)}
                  </strong>
                </div>

                <div className="detail-item">
                  <span>Remaining</span>

                  <strong>
                    ₹{remainingAmount.toFixed(2)}
                  </strong>
                </div>

              </div>


              {/* =========================================
                  ACTIONS
              ========================================= */}

              <div className="reservation-card-actions">

                <Link
                  to={`/reservation-success/${reservation.id}`}
                  className="button secondary-button"
                >
                  View Details
                </Link>

                {(reservation.status === "pending" ||
                  reservation.status === "confirmed") && (
                  <button
                    type="button"
                    className="button danger-button"
                    onClick={() =>
                      handleCancel(reservation.id)
                    }
                  >
                    Cancel
                  </button>
                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}