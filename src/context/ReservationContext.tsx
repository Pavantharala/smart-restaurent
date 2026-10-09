// =========================================================
// SMART CAFE - RESERVATION CONTEXT
// =========================================================
//
// RESPONSIBILITIES
//
// 1. Store customer table reservations
// 2. Save reservations to localStorage
// 3. Check reservation conflicts
// 4. Calculate available tables
// 5. Create reservations
// 6. Cancel reservations
// 7. Confirm reservations
// 8. Check in reservations
// 9. Move arrived customers to waiting
// 10. Store reservation payment information
// 11. Store party size
// 12. Protect reservation turnover time
//
// IMPORTANT
//
// Reservation availability and physical table status are
// intentionally kept separate.
//
// Reservation system:
//     "Can this table be booked for this time?"
//
// Table system:
//     "Is this physical table currently available?"
//
// Staff/Admin controls the physical table status.
//
// =========================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  type CafeTable,
  type ReservationPayment,
  type ReservationPaymentMethod,
  type ReservationPaymentStatus,
  type TableReservation,
  type TableReservationSlot,
  type TableReservationStatus,
} from "../types/Table";

import { useTable } from "./TableContext";
import { useSettings } from "./SettingsContext";

// =========================================================
// STORAGE
// =========================================================

const RESERVATION_STORAGE_KEY =
  "smart-cafe-table-reservations";

// =========================================================
// INPUT TYPE
// =========================================================

export interface CreateReservationInput {
  tableId: string;

  customerName: string;

  // Optional in the UI.
  customerPhone: string;

  partySize: number;

  slot: TableReservationSlot;

  status?: TableReservationStatus;

  payment?: ReservationPayment;

  orderId?: string;
}

// =========================================================
// CONTEXT TYPE
// =========================================================

interface ReservationContextValue {
  reservations: TableReservation[];

  createReservation: (
    input: CreateReservationInput,
  ) => TableReservation | null;

  cancelReservation: (
    reservationId: string,
  ) => void;

  // Returns true when confirmation succeeds.
  // Returns false when the reservation cannot be confirmed.
  confirmReservation: (
    reservationId: string,
  ) => boolean;

  checkInReservation: (
    reservationId: string,
  ) => void;

  sendReservationToWaiting: (
    reservationId: string,
  ) => void;

  completeReservation: (
    reservationId: string,
  ) => void;

  markReservationNoShow: (
    reservationId: string,
  ) => void;

  getReservationById: (
    reservationId: string,
  ) => TableReservation | undefined;

  getReservationsForTable: (
    tableId: string,
  ) => TableReservation[];

  isTableAvailableForReservation: (
    tableId: string,
    slot: TableReservationSlot,
    excludeReservationId?: string,
  ) => boolean;

  getAvailableTablesForReservation: (
    slot: TableReservationSlot,
    partySize: number,
  ) => CafeTable[];
}

// =========================================================
// CONTEXT
// =========================================================

const ReservationContext =
  createContext<
    ReservationContextValue | undefined
  >(undefined);

// =========================================================
// DEFAULT PAYMENT
// =========================================================

function createDefaultPayment(): ReservationPayment {
  return {
    amountDue: 0,
    amountPaid: 0,
    status: "not-paid",
    method: "no-payment",
  };
}

// =========================================================
// NORMALIZE PAYMENT
// =========================================================

function normalizePayment(
  payment?: Partial<ReservationPayment>,
): ReservationPayment {
  const amountDue = Math.max(
    Number(payment?.amountDue ?? 0),
    0,
  );

  const amountPaid = Math.min(
    Math.max(
      Number(payment?.amountPaid ?? 0),
      0,
    ),
    amountDue,
  );

  let status: ReservationPaymentStatus;

  if (payment?.status === "refunded") {
    status = "refunded";
  } else if (amountPaid <= 0) {
    status = "not-paid";
  } else if (
    amountDue > 0 &&
    amountPaid >= amountDue
  ) {
    status = "fully-paid";
  } else {
    status = "partially-paid";
  }

  let method: ReservationPaymentMethod =
    payment?.method ?? "no-payment";

  // No money paid = no payment method.
  if (amountPaid <= 0) {
    method = "no-payment";
  }

  return {
    amountDue,
    amountPaid,
    status,
    method,
    transactionId:
      payment?.transactionId,
    paidAt: payment?.paidAt,
  };
}

// =========================================================
// NORMALIZE OLD RESERVATIONS
// =========================================================

function normalizeReservations(
  value: unknown,
): TableReservation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((reservation) => ({
    ...reservation,

    customerPhone:
      reservation.customerPhone ?? "",

    partySize:
      Number(reservation.partySize) > 0
        ? Number(reservation.partySize)
        : 1,

    payment: normalizePayment(
      reservation.payment,
    ),
  }));
}

// =========================================================
// TIME HELPERS
// =========================================================

function convertToMinutes(
  time: string,
): number {
  if (
    typeof time !== "string" ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return NaN;
  }

  const [hours, minutes] =
    time.split(":").map(Number);

  if (
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN;
  }

  return hours * 60 + minutes;
}

// =========================================================
// VALIDATE RESERVATION SLOT
// =========================================================

function isValidReservationSlot(
  slot: TableReservationSlot,
): boolean {
  if (!slot.date) {
    return false;
  }

  const startMinutes =
    convertToMinutes(
      slot.startTime,
    );

  const endMinutes =
    convertToMinutes(
      slot.endTime,
    );

  if (
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes)
  ) {
    return false;
  }

  // Same-day reservations only.
  if (endMinutes <= startMinutes) {
    return false;
  }

  return true;
}

// =========================================================
// TIME OVERLAP
// =========================================================
//
// The turnover buffer is now supplied by Admin Settings.
//
// Example:
//
// Existing reservation:
// 5:00 PM - 6:00 PM
//
// Admin setting:
// 10 minute turnover buffer
//
// Table remains protected until:
// 6:10 PM
//
// New reservation:
// 6:05 PM
//
// ❌ BLOCKED
//
// New reservation:
// 6:10 PM
//
// ✅ ALLOWED
//
// =========================================================

function slotsOverlap(
  newSlot: TableReservationSlot,
  existingSlot: TableReservationSlot,
  turnoverBufferMinutes: number,
): boolean {
  // Different dates cannot conflict.
  if (
    newSlot.date !==
    existingSlot.date
  ) {
    return false;
  }

  const newStart =
    convertToMinutes(
      newSlot.startTime,
    );

  const newEnd =
    convertToMinutes(
      newSlot.endTime,
    );

  const existingStart =
    convertToMinutes(
      existingSlot.startTime,
    );

  const existingEnd =
    convertToMinutes(
      existingSlot.endTime,
    );

  if (
    Number.isNaN(newStart) ||
    Number.isNaN(newEnd) ||
    Number.isNaN(existingStart) ||
    Number.isNaN(existingEnd)
  ) {
    return false;
  }

  // Protect both reservations using the
  // Admin Settings turnover buffer.
  const newProtectedEnd =
    newEnd +
    turnoverBufferMinutes;

  const existingProtectedEnd =
    existingEnd +
    turnoverBufferMinutes;

  // Symmetric conflict check.
  return (
    newStart < existingProtectedEnd &&
    newProtectedEnd > existingStart
  );
}

// =========================================================
// PROVIDER
// =========================================================

export function ReservationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { tables } = useTable();

  // =======================================================
  // ADMIN SETTINGS
  // =======================================================

  const { settings } = useSettings();

  // =======================================================
  // LOAD RESERVATIONS
  // =======================================================

  const [reservations, setReservations] =
    useState<TableReservation[]>(() => {
      try {
        const stored =
          localStorage.getItem(
            RESERVATION_STORAGE_KEY,
          );

        if (!stored) {
          return [];
        }

        const parsed =
          JSON.parse(stored);

        return normalizeReservations(
          parsed,
        );
      } catch (error) {
        console.error(
          "Failed to load reservations:",
          error,
        );

        return [];
      }
    });

  // =======================================================
  // SAVE RESERVATIONS
  // =======================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        RESERVATION_STORAGE_KEY,
        JSON.stringify(reservations),
      );
    } catch (error) {
      console.error(
        "Failed to save reservations:",
        error,
      );
    }
  }, [reservations]);

  // =======================================================
  // INTERNAL AVAILABILITY CHECK
  // =======================================================

  const isTableAvailableForReservationInternal =
    (
      tableId: string,
      slot: TableReservationSlot,
      excludeReservationId?: string,
    ): boolean => {
      // Invalid time = unavailable.
      if (
        !isValidReservationSlot(slot)
      ) {
        return false;
      }

      return reservations.every(
        (reservation) => {
          // Ignore the reservation currently
          // being edited/confirmed.
          if (
            excludeReservationId &&
            reservation.id ===
              excludeReservationId
          ) {
            return true;
          }

          // Cancelled reservations do not block.
          if (
            reservation.status ===
            "cancelled"
          ) {
            return true;
          }

          // Completed reservations do not block.
          if (
            reservation.status ===
            "completed"
          ) {
            return true;
          }

          // No-show reservations do not block.
          if (
            reservation.status ===
            "no-show"
          ) {
            return true;
          }

          // Different table = no conflict.
          if (
            reservation.tableId !==
            tableId
          ) {
            return true;
          }

          // Same table.
          //
          // Use the current Admin Settings
          // turnover buffer.
          return !slotsOverlap(
            slot,
            reservation.slot,
            settings.reservationTurnoverBufferMinutes,
          );
        },
      );
    };

  // =======================================================
  // CREATE RESERVATION
  // =======================================================

  const createReservation = (
    input: CreateReservationInput,
  ): TableReservation | null => {
    // -----------------------------------------------------
    // CUSTOMER NAME
    // -----------------------------------------------------

    const customerName =
      input.customerName.trim();

    if (!customerName) {
      return null;
    }

    // -----------------------------------------------------
    // PARTY SIZE
    // -----------------------------------------------------

    const partySize = Number(
      input.partySize,
    );

    if (
      !Number.isInteger(partySize) ||
      partySize <= 0
    ) {
      return null;
    }

    // -----------------------------------------------------
    // TABLE EXISTS
    // -----------------------------------------------------

    const table = tables.find(
      (item) =>
        item.id === input.tableId,
    );

    if (!table) {
      return null;
    }

    // -----------------------------------------------------
    // TABLE CAPACITY
    // -----------------------------------------------------

    if (
      partySize > table.capacity
    ) {
      return null;
    }

    // -----------------------------------------------------
    // SLOT VALIDATION
    // -----------------------------------------------------

    if (
      !isValidReservationSlot(
        input.slot,
      )
    ) {
      return null;
    }

    // -----------------------------------------------------
    // CONFLICT CHECK
    // -----------------------------------------------------

    const available =
      isTableAvailableForReservationInternal(
        input.tableId,
        input.slot,
      );

    if (!available) {
      console.warn(
        "Reservation creation blocked because of a table/time conflict.",
      );

      return null;
    }

    // -----------------------------------------------------
    // PAYMENT
    // -----------------------------------------------------

    const payment =
      normalizePayment(
        input.payment ??
          createDefaultPayment(),
      );

    // -----------------------------------------------------
    // CREATE
    // -----------------------------------------------------

    const reservation: TableReservation =
      {
        id: `RES-${Date.now()}-${Math.floor(
          Math.random() * 1000,
        )}`,

        tableId:
          input.tableId,

        customerName,

        customerPhone:
          input.customerPhone?.trim() ??
          "",

        partySize,

        slot: {
          date: input.slot.date,
          startTime:
            input.slot.startTime,
          endTime:
            input.slot.endTime,
        },

        status:
          input.status ?? "pending",

        payment,

        orderId:
          input.orderId,

        createdAt:
          new Date().toISOString(),
      };

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setReservations(
      (current) => [
        ...current,
        reservation,
      ],
    );

    return reservation;
  };

  // =======================================================
  // CANCEL RESERVATION
  // =======================================================

  const cancelReservation = (
    reservationId: string,
  ) => {
    setReservations(
      (current) =>
        current.map(
          (reservation) => {
            if (
              reservation.id !==
              reservationId
            ) {
              return reservation;
            }

            // Already completed reservations
            // should not be cancelled here.
            if (
              reservation.status ===
              "completed"
            ) {
              return reservation;
            }

            return {
              ...reservation,
              status: "cancelled",
            };
          },
        ),
    );
  };

  // =======================================================
  // CONFIRM RESERVATION
  // =======================================================

  const confirmReservation = (
    reservationId: string,
  ): boolean => {
    const reservation =
      reservations.find(
        (item) =>
          item.id === reservationId,
      );

    if (!reservation) {
      return false;
    }

    // Only pending reservations can be confirmed.
    if (
      reservation.status !==
      "pending"
    ) {
      return false;
    }

    // Re-check the latest reservation list.
    const available =
      isTableAvailableForReservationInternal(
        reservation.tableId,
        reservation.slot,
        reservation.id,
      );

    if (!available) {
      console.warn(
        "Reservation confirmation blocked because of a conflicting reservation.",
      );

      return false;
    }

    // -----------------------------------------------------
    // CONFIRM
    // -----------------------------------------------------

    setReservations(
      (current) =>
        current.map(
          (item) =>
            item.id === reservationId
              ? {
                  ...item,
                  status:
                    "confirmed",
                }
              : item,
        ),
    );

    return true;
  };

  // =======================================================
  // CHECK IN RESERVATION
  // =======================================================

  const checkInReservation = (
    reservationId: string,
  ) => {
    setReservations(
      (current) =>
        current.map(
          (reservation) => {
            if (
              reservation.id !==
              reservationId
            ) {
              return reservation;
            }

            // Customer can check in from:
            //
            // pending
            // confirmed
            // waiting
            //
            if (
              reservation.status !==
                "pending" &&
              reservation.status !==
                "confirmed" &&
              reservation.status !==
                "waiting"
            ) {
              return reservation;
            }

            return {
              ...reservation,
              status:
                "checked-in",
            };
          },
        ),
    );
  };

  // =======================================================
  // SEND RESERVATION TO WAITING
  // =======================================================

  const sendReservationToWaiting = (
    reservationId: string,
  ) => {
    setReservations(
      (current) =>
        current.map(
          (reservation) => {
            if (
              reservation.id !==
              reservationId
            ) {
              return reservation;
            }

            // Only customers who haven't been seated
            // can be moved into Waiting Lounge.
            if (
              reservation.status !==
                "pending" &&
              reservation.status !==
                "confirmed"
            ) {
              return reservation;
            }

            return {
              ...reservation,
              status: "waiting",
            };
          },
        ),
    );
  };

  // =======================================================
  // COMPLETE RESERVATION
  // =======================================================

  const completeReservation = (
    reservationId: string,
  ) => {
    setReservations(
      (current) =>
        current.map(
          (reservation) => {
            if (
              reservation.id !==
              reservationId
            ) {
              return reservation;
            }

            // A reservation should normally be completed
            // after the customer has checked in.
            if (
              reservation.status !==
              "checked-in"
            ) {
              return reservation;
            }

            return {
              ...reservation,
              status:
                "completed",
            };
          },
        ),
    );
  };

  // =======================================================
  // MARK NO-SHOW
  // =======================================================

  const markReservationNoShow = (
    reservationId: string,
  ) => {
    setReservations(
      (current) =>
        current.map(
          (reservation) => {
            if (
              reservation.id !==
              reservationId
            ) {
              return reservation;
            }

            // Customer can only be marked no-show
            // before being checked in.
            if (
              reservation.status !==
                "pending" &&
              reservation.status !==
                "confirmed" &&
              reservation.status !==
                "waiting"
            ) {
              return reservation;
            }

            return {
              ...reservation,
              status:
                "no-show",
            };
          },
        ),
    );
  };

  // =======================================================
  // GET RESERVATION BY ID
  // =======================================================

  const getReservationById = (
    reservationId: string,
  ) => {
    return reservations.find(
      (reservation) =>
        reservation.id ===
        reservationId,
    );
  };

  // =======================================================
  // GET RESERVATIONS FOR TABLE
  // =======================================================

  const getReservationsForTable = (
    tableId: string,
  ) => {
    return reservations.filter(
      (reservation) =>
        reservation.tableId ===
        tableId,
    );
  };

  // =======================================================
  // CHECK TABLE AVAILABILITY
  // =======================================================

  const isTableAvailableForReservation = (
    tableId: string,
    slot: TableReservationSlot,
    excludeReservationId?: string,
  ): boolean => {
    return isTableAvailableForReservationInternal(
      tableId,
      slot,
      excludeReservationId,
    );
  };

  // =======================================================
  // GET AVAILABLE TABLES
  // =======================================================

  const getAvailableTablesForReservation =
    (
      slot: TableReservationSlot,
      partySize: number,
    ): CafeTable[] => {
      return tables.filter(
        (table) => {
          // Capacity check.
          if (
            table.capacity <
            partySize
          ) {
            return false;
          }

          // Reservation conflict check.
          return isTableAvailableForReservationInternal(
            table.id,
            slot,
          );
        },
      );
    };

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value =
    useMemo<ReservationContextValue>(
      () => ({
        reservations,

        createReservation,

        cancelReservation,

        confirmReservation,

        checkInReservation,

        sendReservationToWaiting,

        completeReservation,

        markReservationNoShow,

        getReservationById,

        getReservationsForTable,

        isTableAvailableForReservation,

        getAvailableTablesForReservation,
      }),
      [
        reservations,
        tables,
        settings.reservationTurnoverBufferMinutes,
      ],
    );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <ReservationContext.Provider
      value={value}
    >
      {children}
    </ReservationContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useReservation() {
  const context =
    useContext(
      ReservationContext,
    );

  if (!context) {
    throw new Error(
      "useReservation must be used inside ReservationProvider",
    );
  }

  return context;
}