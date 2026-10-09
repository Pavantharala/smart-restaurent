import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useReservation } from "../../context/ReservationContext";
import { useSettings } from "../../context/SettingsContext";
import { useTable } from "../../context/TableContext";

import type {
  ReservationPayment,
} from "../../types/Table";

// =========================================================
// RESERVATION DURATIONS
// =========================================================

const RESERVATION_DURATIONS = [
  {
    value: 30,
    label: "30 minutes",
  },
  {
    value: 60,
    label: "1 hour",
  },
  {
    value: 90,
    label: "1 hour 30 minutes",
  },
  {
    value: 120,
    label: "2 hours",
  },
  {
    value: 180,
    label: "3 hours",
  },
];

// =========================================================
// PAYMENT OPTIONS
// =========================================================

type PaymentChoice =
  | "pay-later"
  | "partial"
  | "full";

// =========================================================
// TIME HELPERS
// =========================================================

function timeToMinutes(
  time: string,
): number {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(
  totalMinutes: number,
): string {
  const hours = Math.floor(
    totalMinutes / 60,
  );

  const minutes =
    totalMinutes % 60;

  const normalizedHours =
    hours % 24;

  return `${String(
    normalizedHours,
  ).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")}`;
}

function formatTime(
  time: string,
): string {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const period =
    hours >= 12 ? "PM" : "AM";

  const displayHour =
    hours % 12 || 12;

  return `${displayHour}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;
}

// =========================================================
// TODAY DATE
// =========================================================

function getTodayDate(): string {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================================================
// PAGE
// =========================================================

export default function TableReservationPage() {
  const navigate = useNavigate();

  const {
    createReservation,
    getAvailableTablesForReservation,
  } = useReservation();

  const { tables } = useTable();

  // =======================================================
  // ADMIN SETTINGS
  // =======================================================

  const { settings } = useSettings();

  // =======================================================
  // RESERVATION FORM STATE
  // =======================================================

  const [date, setDate] =
    useState(getTodayDate());

  const [startTime, setStartTime] =
    useState("12:30");

  const [duration, setDuration] =
    useState(60);

  const [partySize, setPartySize] =
    useState(2);

  const [
    selectedTableId,
    setSelectedTableId,
  ] = useState("");

  // =======================================================
  // CUSTOMER INFORMATION
  // =======================================================

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  // Phone is optional for now.
  const [
    customerPhone,
    setCustomerPhone,
  ] = useState("");

  // =======================================================
  // PAYMENT
  // =======================================================

  const [
    paymentChoice,
    setPaymentChoice,
  ] =
    useState<PaymentChoice>(
      settings.reservationPaymentRequired
        ? "partial"
        : "pay-later",
    );

  // =======================================================
  // ADMIN PAYMENT SETTINGS
  // =======================================================

  const reservationAmount =
    Math.max(
      0,
      Number(
        settings.reservationAmount,
      ) || 0,
    );

  const partialPaymentAmount =
    Math.min(
      reservationAmount,
      Math.max(
        0,
        Number(
          settings.reservationPartialPaymentAmount,
        ) || 0,
      ),
    );

  const paymentRequired =
    settings.reservationPaymentRequired;

  // =======================================================
  // KEEP PAYMENT CHOICE VALID
  // =======================================================
  //
  // If Admin turns payment ON while the customer
  // is currently using Pay Later, automatically
  // move the customer to Partial Payment.
  //
  // If payment is OFF, Pay Later becomes available.
  //
  // =======================================================

  useEffect(() => {
    if (
      paymentRequired &&
      paymentChoice === "pay-later"
    ) {
      if (
        partialPaymentAmount > 0
      ) {
        setPaymentChoice("partial");
      } else if (
        reservationAmount > 0
      ) {
        setPaymentChoice("full");
      }
    }
  }, [
    paymentRequired,
    paymentChoice,
    partialPaymentAmount,
    reservationAmount,
  ]);

  // =======================================================
  // UI STATE
  // =======================================================

  const [error, setError] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  // =======================================================
  // CALCULATE END TIME
  // =======================================================

  const endTime = useMemo(() => {
    const startMinutes =
      timeToMinutes(startTime);

    const calculatedEndMinutes =
      startMinutes + duration;

    return minutesToTime(
      calculatedEndMinutes,
    );
  }, [
    startTime,
    duration,
  ]);

  // =======================================================
  // AVAILABLE TABLES
  // =======================================================

  const availableTables =
    useMemo(() => {
      return getAvailableTablesForReservation(
        {
          date,
          startTime,
          endTime,
        },
        partySize,
      );
    }, [
      date,
      startTime,
      endTime,
      partySize,
      getAvailableTablesForReservation,
    ]);

  // =======================================================
  // CLEAR INVALID TABLE SELECTION
  // =======================================================

  useEffect(() => {
    if (!selectedTableId) {
      return;
    }

    const stillAvailable =
      availableTables.some(
        (table) =>
          table.id ===
          selectedTableId,
      );

    if (!stillAvailable) {
      setSelectedTableId("");
    }
  }, [
    availableTables,
    selectedTableId,
  ]);

  // =======================================================
  // PAYMENT CALCULATION
  // =======================================================

  function getPaymentDetails(): ReservationPayment {
    // -----------------------------------------------------
    // PAY LATER
    // -----------------------------------------------------

    if (
      paymentChoice === "pay-later"
    ) {
      return {
        amountDue:
          reservationAmount,

        amountPaid: 0,

        status: "not-paid",

        method: "no-payment",
      };
    }

    // -----------------------------------------------------
    // PARTIAL PAYMENT
    // -----------------------------------------------------

    if (
      paymentChoice === "partial"
    ) {
      return {
        amountDue:
          reservationAmount,

        amountPaid:
          partialPaymentAmount,

        status:
          partialPaymentAmount >=
          reservationAmount
            ? "fully-paid"
            : "partially-paid",

        method: "upi",

        transactionId:
          `SIM-${Date.now()}`,

        paidAt:
          new Date().toISOString(),
      };
    }

    // -----------------------------------------------------
    // FULL PAYMENT
    // -----------------------------------------------------

    return {
      amountDue:
        reservationAmount,

      amountPaid:
        reservationAmount,

      status: "fully-paid",

      method: "upi",

      transactionId:
        `SIM-${Date.now()}`,

      paidAt:
        new Date().toISOString(),
    };
  }

  // =======================================================
  // PAYMENT DISPLAY
  // =======================================================

  function getPaymentLabel(): string {
    if (
      paymentChoice === "pay-later"
    ) {
      return "Pay Later";
    }

    if (
      paymentChoice === "partial"
    ) {
      return `Pay ₹${partialPaymentAmount}`;
    }

    return `Pay ₹${reservationAmount}`;
  }

  // =======================================================
  // FORM VALIDATION
  // =======================================================

  function validateForm(): boolean {
    setError("");

    // -----------------------------------------------------
    // DATE
    // -----------------------------------------------------

    if (!date) {
      setError(
        "Please select a reservation date.",
      );

      return false;
    }

    // -----------------------------------------------------
    // START TIME
    // -----------------------------------------------------

    if (!startTime) {
      setError(
        "Please select a reservation start time.",
      );

      return false;
    }

    // -----------------------------------------------------
    // DURATION
    // -----------------------------------------------------

    if (duration <= 0) {
      setError(
        "Please select a valid reservation duration.",
      );

      return false;
    }

    // -----------------------------------------------------
    // PARTY SIZE
    // -----------------------------------------------------

    if (partySize <= 0) {
      setError(
        "Please select a valid party size.",
      );

      return false;
    }

    // -----------------------------------------------------
    // TABLE
    // -----------------------------------------------------

    if (!selectedTableId) {
      setError(
        "Please select an available table.",
      );

      return false;
    }

    // -----------------------------------------------------
    // CUSTOMER NAME
    // -----------------------------------------------------

    if (!customerName.trim()) {
      setError(
        "Please enter your name.",
      );

      return false;
    }

    // -----------------------------------------------------
    // PAYMENT VALIDATION
    // -----------------------------------------------------

    if (paymentRequired) {
      if (
        paymentChoice ===
        "pay-later"
      ) {
        setError(
          "Payment is required for this reservation. Please choose partial or full payment.",
        );

        return false;
      }

      if (
        paymentChoice ===
          "partial" &&
        partialPaymentAmount <= 0
      ) {
        setError(
          "Partial payment is currently unavailable. Please choose full payment.",
        );

        return false;
      }

      if (
        paymentChoice ===
          "full" &&
        reservationAmount <= 0
      ) {
        setError(
          "The reservation payment amount must be greater than ₹0.",
        );

        return false;
      }
    }

    // -----------------------------------------------------
    // FINAL AVAILABILITY CHECK
    // -----------------------------------------------------

    const tableStillAvailable =
      availableTables.some(
        (table) =>
          table.id ===
          selectedTableId,
      );

    if (!tableStillAvailable) {
      setError(
        "This table is no longer available for the selected time. Please choose another table or time.",
      );

      return false;
    }

    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------
    //
    // Phone remains optional.
    //
    // -----------------------------------------------------

    return true;
  }

  // =======================================================
  // CREATE RESERVATION
  // =======================================================

  function handleSubmit() {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    setError("");

    setSuccessMessage("");

    try {
      // ---------------------------------------------------
      // PAYMENT
      // ---------------------------------------------------

      const payment =
        getPaymentDetails();

      // ---------------------------------------------------
      // CREATE RESERVATION
      // ---------------------------------------------------

      const reservation =
        createReservation({
          tableId:
            selectedTableId,

          customerName:
            customerName.trim(),

          // Phone is optional.
          customerPhone:
            customerPhone.trim(),

          // Save party size.
          partySize,

          slot: {
            date,
            startTime,
            endTime,
          },

          status: "pending",

          payment,
        });

      // ---------------------------------------------------
      // RESERVATION FAILED
      // ---------------------------------------------------

      if (!reservation) {
        setError(
          "This table is no longer available for the selected time. Please choose another table or time.",
        );

        setIsSubmitting(false);

        return;
      }

      // ---------------------------------------------------
      // SUCCESS
      // ---------------------------------------------------

      setSuccessMessage(
        `Reservation created successfully. ${getPaymentLabel()}.`,
      );

      setIsSubmitting(false);

      // ---------------------------------------------------
      // NAVIGATION
      // ---------------------------------------------------

      setTimeout(() => {
        navigate(
          `/reservation-success/${reservation.id}`,
        );
      }, 1500);

    } catch (reservationError) {
      console.error(
        "Reservation creation failed:",
        reservationError,
      );

      setError(
        "Something went wrong while creating the reservation. Please try again.",
      );

      setIsSubmitting(false);
    }
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "24px",
      }}
    >

      {/* ==================================================
          PAGE HEADER
      ================================================== */}

      <div
        style={{
          marginBottom: "24px",
        }}
      >
        <h1>
          Reserve a Table
        </h1>

        <p>
          Choose your date, time, table and
          reservation payment option.
        </p>
      </div>

      {/* ==================================================
          ERROR MESSAGE
      ================================================== */}

      {error && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#ffe5e5",
            color: "#b00020",
          }}
        >
          {error}
        </div>
      )}

      {/* ==================================================
          SUCCESS MESSAGE
      ================================================== */}

      {successMessage && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#e6f7e6",
            color: "#166534",
          }}
        >
          {successMessage}
        </div>
      )}

      {/* ==================================================
          DATE & TIME
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
        }}
      >

        <h2>
          1. Reservation Time
        </h2>

        {/* DATE */}

        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <label>
            <strong>
              Date
            </strong>
          </label>

          <br />

          <input
            type="date"
            value={date}
            min={getTodayDate()}
            onChange={(event) => {
              setDate(
                event.target.value,
              );

              setError("");
            }}
            style={{
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        {/* START TIME */}

        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <label>
            <strong>
              Start Time
            </strong>
          </label>

          <br />

          <input
            type="time"
            value={startTime}
            step="300"
            onChange={(event) => {
              setStartTime(
                event.target.value,
              );

              setError("");
            }}
            style={{
              padding: "10px",
              marginTop: "6px",
            }}
          />

          <p>
            You can choose any 5-minute time
            such as 12:30, 12:45, 1:10, etc.
          </p>
        </div>

        {/* DURATION */}

        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <label>
            <strong>
              Duration
            </strong>
          </label>

          <br />

          <select
            value={duration}
            onChange={(event) => {
              setDuration(
                Number(
                  event.target.value,
                ),
              );

              setError("");
            }}
            style={{
              padding: "10px",
              marginTop: "6px",
            }}
          >
            {RESERVATION_DURATIONS.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </div>

        {/* TIME PREVIEW */}

        <div
          style={{
            padding: "14px",
            borderRadius: "8px",
            background: "#f5f5f5",
          }}
        >
          <strong>
            Reservation Time
          </strong>

          <div>
            {formatTime(startTime)}
            {" → "}
            {formatTime(endTime)}
          </div>
        </div>

      </section>

      {/* ==================================================
          PARTY SIZE
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
        }}
      >

        <h2>
          2. Party Size
        </h2>

        <input
          type="number"
          min="1"
          max="20"
          value={partySize}
          onChange={(event) => {
            const value =
              Number(
                event.target.value,
              );

            setPartySize(
              Math.max(
                1,
                value,
              ),
            );

            setError("");
          }}
          style={{
            padding: "10px",
            width: "120px",
          }}
        />

        <p>
          Number of people who will use
          the reserved table.
        </p>

      </section>

      {/* ==================================================
          TABLE SELECTION
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
        }}
      >

        <h2>
          3. Select Table
        </h2>

        {availableTables.length === 0 ? (

          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              background: "#fff4e5",
            }}
          >

            <strong>
              No tables are available
              for this time.
            </strong>

            <p>
              Try another time, duration
              or party size.
            </p>

          </div>

        ) : (

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
            }}
          >

            {availableTables.map(
              (table) => {

                const isSelected =
                  selectedTableId ===
                  table.id;

                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      setSelectedTableId(
                        table.id,
                      );

                      setError("");
                    }}
                    style={{
                      padding: "16px",
                      textAlign: "left",
                      borderRadius: "10px",
                      border: isSelected
                        ? "2px solid #000"
                        : "1px solid #ccc",
                      background: isSelected
                        ? "#f0f0f0"
                        : "#fff",
                      cursor: "pointer",
                    }}
                  >

                    <strong>
                      Table {table.number}
                    </strong>

                    <div>
                      Capacity:{" "}
                      {table.capacity}
                    </div>

                    <div>
                      {isSelected
                        ? "✓ Selected"
                        : "Available"}
                    </div>

                  </button>
                );
              },
            )}

          </div>
        )}

      </section>

      {/* ==================================================
          CUSTOMER INFORMATION
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
        }}
      >

        <h2>
          4. Customer Information
        </h2>

        {/* NAME */}

        <div
          style={{
            marginBottom: "16px",
          }}
        >

          <label>
            <strong>
              Name *
            </strong>
          </label>

          <br />

          <input
            type="text"
            value={customerName}
            onChange={(event) =>
              setCustomerName(
                event.target.value,
              )
            }
            placeholder="Enter your name"
            style={{
              padding: "10px",
              width: "100%",
              maxWidth: "400px",
              marginTop: "6px",
            }}
          />

        </div>

        {/* PHONE */}

        <div>

          <label>
            <strong>
              Phone
            </strong>
          </label>

          <br />

          <input
            type="tel"
            value={customerPhone}
            onChange={(event) =>
              setCustomerPhone(
                event.target.value,
              )
            }
            placeholder="Optional"
            style={{
              padding: "10px",
              width: "100%",
              maxWidth: "400px",
              marginTop: "6px",
            }}
          />

          <p>
            Phone number is optional for now.
          </p>

        </div>

      </section>

      {/* ==================================================
          PAYMENT
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
        }}
      >

        <h2>
          5. Reservation Payment
        </h2>

        {paymentRequired ? (
          <p>
            Payment is required for this
            reservation.
          </p>
        ) : (
          <p>
            Payment is optional. You can
            reserve now and pay later.
          </p>
        )}

        {/* PAY LATER */}

        {!paymentRequired && (
          <label
            style={{
              display: "block",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >

            <input
              type="radio"
              name="payment"
              value="pay-later"
              checked={
                paymentChoice ===
                "pay-later"
              }
              onChange={() =>
                setPaymentChoice(
                  "pay-later",
                )
              }
            />

            <strong
              style={{
                marginLeft: "8px",
              }}
            >
              Pay Later
            </strong>

            <div
              style={{
                marginLeft: "24px",
              }}
            >
              No payment required now.
            </div>

          </label>
        )}

        {/* PARTIAL PAYMENT */}

        {partialPaymentAmount > 0 && (
          <label
            style={{
              display: "block",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >

            <input
              type="radio"
              name="payment"
              value="partial"
              checked={
                paymentChoice ===
                "partial"
              }
              onChange={() =>
                setPaymentChoice(
                  "partial",
                )
              }
            />

            <strong
              style={{
                marginLeft: "8px",
              }}
            >
              Pay Partial Amount
            </strong>

            <div
              style={{
                marginLeft: "24px",
              }}
            >
              Pay ₹
              {partialPaymentAmount}
              {" "}now.
            </div>

          </label>
        )}

        {/* FULL PAYMENT */}

        {reservationAmount > 0 && (
          <label
            style={{
              display: "block",
              padding: "16px",
              marginBottom: "12px",
              border: "1px solid #ccc",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >

            <input
              type="radio"
              name="payment"
              value="full"
              checked={
                paymentChoice ===
                "full"
              }
              onChange={() =>
                setPaymentChoice(
                  "full",
                )
              }
            />

            <strong
              style={{
                marginLeft: "8px",
              }}
            >
              Pay Full Amount
            </strong>

            <div
              style={{
                marginLeft: "24px",
              }}
            >
              Pay ₹
              {reservationAmount}
              {" "}now.
            </div>

          </label>
        )}

        {/* CURRENT SETTING NOTICE */}

        <div
          style={{
            padding: "12px",
            marginTop: "12px",
            borderRadius: "8px",
            background: "#f5f5f5",
            fontSize: "14px",
          }}
        >
          Reservation amount: ₹
          {reservationAmount}
          <br />

          Partial payment amount: ₹
          {partialPaymentAmount}
          <br />

          Payment required:{" "}
          {paymentRequired
            ? "Yes"
            : "No"}
        </div>

      </section>

      {/* ==================================================
          RESERVATION SUMMARY
      ================================================== */}

      <section
        style={{
          marginBottom: "28px",
          padding: "18px",
          borderRadius: "10px",
          background: "#f7f7f7",
        }}
      >

        <h2>
          6. Reservation Summary
        </h2>

        <p>
          <strong>
            Date:
          </strong>{" "}
          {date}
        </p>

        <p>
          <strong>
            Time:
          </strong>{" "}
          {formatTime(startTime)}
          {" → "}
          {formatTime(endTime)}
        </p>

        <p>
          <strong>
            Party:
          </strong>{" "}
          {partySize}{" "}
          {partySize === 1
            ? "person"
            : "people"}
        </p>

        <p>
          <strong>
            Table:
          </strong>{" "}

          {selectedTableId
            ? `Table ${
                tables.find(
                  (table) =>
                    table.id ===
                    selectedTableId,
                )?.number ?? ""
              }`
            : "Not selected"}
        </p>

        <p>
          <strong>
            Payment:
          </strong>{" "}

          {paymentChoice ===
          "pay-later"
            ? "Pay Later"
            : paymentChoice ===
                "partial"
              ? `₹${partialPaymentAmount} partial payment`
              : `₹${reservationAmount} full payment`}
        </p>

      </section>

      {/* ==================================================
          CONFIRM BUTTON
      ================================================== */}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          isSubmitting ||
          availableTables.length === 0 ||
          !selectedTableId
        }
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "10px",
          border: "none",
          cursor:
            isSubmitting ||
            availableTables.length === 0 ||
            !selectedTableId
              ? "not-allowed"
              : "pointer",
          fontSize: "16px",
          fontWeight: 600,
        }}
      >
        {isSubmitting
          ? "Creating Reservation..."
          : "Confirm Reservation"}
      </button>

    </div>
  );
}