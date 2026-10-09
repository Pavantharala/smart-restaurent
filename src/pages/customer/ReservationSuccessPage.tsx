// =========================================================
// SMART CAFE - RESERVATION SUCCESS PAGE
// =========================================================
//
// Shows the customer the details of their newly created
// table reservation.
//
// URL:
// /reservation-success/:reservationId
//
// The reservation ID comes from the URL and is used to
// retrieve the reservation from ReservationContext.
// =========================================================

import { Link, useNavigate, useParams } from "react-router-dom";
import { useReservation } from "../../context/ReservationContext";
import { useTable } from "../../context/TableContext";

export default function ReservationSuccessPage() {
  // =======================================================
  // URL PARAMETER
  // =======================================================

  const { reservationId } = useParams<{ reservationId: string }>();

  // =======================================================
  // NAVIGATION
  // =======================================================

  const navigate = useNavigate();

  // =======================================================
  // CONTEXTS
  // =======================================================

  const {
    getReservationById,
    cancelReservation,
  } = useReservation();

  const { getTableById } = useTable();

  // =======================================================
  // FIND RESERVATION
  // =======================================================

  const reservation = reservationId
    ? getReservationById(reservationId)
    : undefined;

  // =======================================================
  // RESERVATION NOT FOUND
  // =======================================================

  if (!reservation) {
    return (
      <div className="page-container">
        <div className="card">
          <h1>Reservation Not Found</h1>

          <p>
            We could not find the reservation you are looking for.
          </p>

          <Link to="/reserve-table">
            Make a New Reservation
          </Link>
        </div>
      </div>
    );
  }

  // =======================================================
  // TABLE
  // =======================================================

  const table = getTableById(reservation.tableId);

  // =======================================================
  // PAYMENT CALCULATIONS
  // =======================================================

  const amountDue = reservation.payment?.amountDue ?? 0;
  const amountPaid = reservation.payment?.amountPaid ?? 0;

  const remainingAmount = Math.max(
    0,
    amountDue - amountPaid,
  );

  // =======================================================
  // CANCEL RESERVATION
  // =======================================================

  const handleCancel = () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?",
    );

    if (!confirmed) {
      return;
    }

    cancelReservation(reservation.id);

    alert("Reservation cancelled successfully.");

    navigate("/reservations");
  };

  // =======================================================
  // STATUS LABEL
  // =======================================================

  const getStatusLabel = () => {
    switch (reservation.status) {
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
        return reservation.status;
    }
  };

  // =======================================================
  // PAYMENT STATUS LABEL
  // =======================================================

  const getPaymentStatusLabel = () => {
    switch (reservation.payment?.status) {
      case "not-paid":
        return "Not Paid";

      case "partially-paid":
        return "Partially Paid";

      case "fully-paid":
        return "Fully Paid";

      case "refunded":
        return "Refunded";

      default:
        return "Not Paid";
    }
  };

  // =======================================================
  // PAYMENT METHOD LABEL
  // =======================================================

  const getPaymentMethodLabel = () => {
    switch (reservation.payment?.method) {
      case "upi":
        return "UPI";

      case "card":
        return "Card";

      case "cash":
        return "Cash";

      case "no-payment":
        return "Pay Later";

      default:
        return "Pay Later";
    }
  };

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="page-container">

      {/* ===================================================
          SUCCESS HEADER
      =================================================== */}

      <div className="card reservation-success-header">

        <div className="success-icon">
          ✓
        </div>

        <h1>
          Reservation Created Successfully
        </h1>

        <p>
          Your table reservation has been recorded.
        </p>

        <div className="reservation-id-box">
          <span>Reservation ID</span>

          <strong>
            {reservation.id}
          </strong>
        </div>

      </div>


      {/* ===================================================
          RESERVATION DETAILS
      =================================================== */}

      <div className="card">

        <h2>
          Reservation Details
        </h2>

        <div className="details-grid">

          <div className="detail-item">
            <span>Customer</span>
            <strong>
              {reservation.customerName}
            </strong>
          </div>

          <div className="detail-item">
            <span>Table</span>
            <strong>
              {table
                ? `Table ${table.number}`
                : "Table unavailable"}
            </strong>
          </div>

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
              {reservation.partySize}{" "}
              {reservation.partySize === 1
                ? "Person"
                : "People"}
            </strong>
          </div>

          <div className="detail-item">
            <span>Reservation Status</span>
            <strong>
              {getStatusLabel()}
            </strong>
          </div>

        </div>

      </div>


      {/* ===================================================
          PAYMENT DETAILS
      =================================================== */}

      <div className="card">

        <h2>
          Payment Details
        </h2>

        <div className="details-grid">

          <div className="detail-item">
            <span>Payment Status</span>
            <strong>
              {getPaymentStatusLabel()}
            </strong>
          </div>

          <div className="detail-item">
            <span>Payment Method</span>
            <strong>
              {getPaymentMethodLabel()}
            </strong>
          </div>

          <div className="detail-item">
            <span>Amount Due</span>
            <strong>
              ₹{amountDue.toFixed(2)}
            </strong>
          </div>

          <div className="detail-item">
            <span>Amount Paid</span>
            <strong>
              ₹{amountPaid.toFixed(2)}
            </strong>
          </div>

          <div className="detail-item">
            <span>Remaining Amount</span>
            <strong>
              ₹{remainingAmount.toFixed(2)}
            </strong>
          </div>

          {reservation.payment?.transactionId && (
            <div className="detail-item">
              <span>Transaction ID</span>

              <strong>
                {reservation.payment.transactionId}
              </strong>
            </div>
          )}

        </div>

      </div>


      {/* ===================================================
          IMPORTANT INFORMATION
      =================================================== */}

      <div className="card">

        <h2>
          Before You Visit
        </h2>

        <ul>
          <li>
            Please arrive around your reservation start time.
          </li>

          <li>
            Your reservation is associated with the selected table.
          </li>

          <li>
            The restaurant staff controls the physical table status.
          </li>

          <li>
            If the table is not ready, staff may assist you through
            the Waiting Lounge.
          </li>
        </ul>

      </div>


      {/* ===================================================
          ACTIONS
      =================================================== */}

      <div className="reservation-actions">

        <Link
          to="/reservations"
          className="button secondary-button"
        >
          My Reservations
        </Link>

        <Link
          to="/menu"
          className="button"
        >
          Browse Menu
        </Link>

        {(reservation.status === "pending" ||
          reservation.status === "confirmed") && (
          <button
            type="button"
            className="button danger-button"
            onClick={handleCancel}
          >
            Cancel Reservation
          </button>
        )}

      </div>

    </div>
  );
}