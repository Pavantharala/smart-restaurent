// =========================================================
// SMART CAFE - TABLE TYPES
// =========================================================
//
// These types describe:
//
// 1. Physical table status
// 2. Reservation status
// 3. Reservation payment status
// 4. Reservation time slots
//
// IMPORTANT
//
// Reservation status and physical table status are
// intentionally separate.
//
// Example:
//
// Reservation = checked-in
// Table = occupied
//
// Or:
//
// Reservation = waiting
// Table = cleaning
// =========================================================


// =========================================================
// PHYSICAL TABLE STATUS
// =========================================================
//
// This describes the REAL physical condition of a table.
//
// available  -> customer can potentially use it
// occupied   -> customer is currently using it
// reserved   -> temporarily assigned/held
// cleaning   -> staff is cleaning/preparing it
// =========================================================

export type TableStatus =
  | "available"
  | "occupied"
  | "reserved"
  | "cleaning";


// =========================================================
// RESERVATION STATUS
// =========================================================
//
// pending
//   Reservation has been created.
//
// confirmed
//   Reservation has been accepted/confirmed.
//
// waiting
//   Customer has arrived, but the reserved table
//   is not physically ready yet.
//
// checked-in
//   Customer has arrived and has been seated.
//
// cancelled
//   Customer/staff cancelled the reservation.
//
// completed
//   Reservation session is finished.
//
// no-show
//   Customer did not arrive.
// =========================================================

export type TableReservationStatus =
  | "pending"
  | "confirmed"
  | "waiting"
  | "checked-in"
  | "cancelled"
  | "completed"
  | "no-show";


// =========================================================
// RESERVATION PAYMENT STATUS
// =========================================================

export type ReservationPaymentStatus =
  | "not-paid"
  | "partially-paid"
  | "fully-paid"
  | "refunded";


// =========================================================
// RESERVATION PAYMENT METHOD
// =========================================================

export type ReservationPaymentMethod =
  | "no-payment"
  | "upi"
  | "card"
  | "cash";


// =========================================================
// RESERVATION TIME SLOT
// =========================================================

export interface TableReservationSlot {
  date: string;
  startTime: string;
  endTime: string;
}


// =========================================================
// RESERVATION PAYMENT
// =========================================================

export interface ReservationPayment {
  amountDue: number;

  amountPaid: number;

  status: ReservationPaymentStatus;

  method: ReservationPaymentMethod;

  transactionId?: string;

  paidAt?: string;
}


// =========================================================
// TABLE RESERVATION
// =========================================================

export interface TableReservation {
  id: string;

  tableId: string;

  customerName: string;

  // Optional in the UI.
  // Empty string is allowed.
  customerPhone: string;

  partySize: number;

  slot: TableReservationSlot;

  status: TableReservationStatus;

  payment: ReservationPayment;

  // Optional connection to an order.
  orderId?: string;

  createdAt: string;
}


// =========================================================
// CAFE TABLE
// =========================================================

export interface CafeTable {
  id: string;

  number: number;

  capacity: number;

  status: TableStatus;

  qrToken: string;

  // Order currently associated with the table.
  orderId?: string;

  // Optional gaming station.
  gamingStationId?: string;
}