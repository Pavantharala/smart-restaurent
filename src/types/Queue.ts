// =========================================================
// SMART CAFE - QUEUE TYPES
// =========================================================
//
// This file defines the data structure used by the
// Waiting Lounge queue system.
//
// QUEUE LIFECYCLE:
//
// Waiting
//    ↓
// Table Ready
//    ↓
// Seated
//    ↓
// Completed
//
// Cancellation can happen before completion:
//
// Waiting → Cancelled
// Table Ready → Cancelled
//
// IMPORTANT:
//
// Queue status describes the customer's Waiting Lounge
// lifecycle.
//
// It is separate from:
// 1. Order status
// 2. Table physical status
// 3. Reservation status
//
// We connect these systems using IDs instead of copying
// complete objects into the queue.
// =========================================================


// =========================================================
// QUEUE STATUS
// =========================================================
//
// These statuses represent the complete lifecycle of a
// Waiting Lounge customer.
//
// waiting
//    Customer is waiting for a table.
//
// table-ready
//    Staff has assigned a table temporarily.
//
// seated
//    Customer has actually been seated.
//
// completed
//    Waiting Lounge queue lifecycle is finished.
//
// cancelled
//    Customer left/cancelled before completion.
//
// =========================================================

export type QueueStatus =
  | "waiting"
  | "table-ready"
  | "seated"
  | "completed"
  | "cancelled";


// =========================================================
// QUEUE ENTRY
// =========================================================
//
// One QueueEntry represents one customer/group in the
// Waiting Lounge queue.
// =========================================================

export interface QueueEntry {

  // -------------------------------------------------------
  // UNIQUE QUEUE ENTRY ID
  // -------------------------------------------------------
  //
  // Example:
  //
  // queue-1791194646255
  //
  // -------------------------------------------------------

  id: string;


  // -------------------------------------------------------
  // CUSTOMER / GUEST ID
  // -------------------------------------------------------
  //
  // Identifies the customer or guest who joined the queue.
  //
  // For the current Smart Cafe system this can also
  // represent a guest/session identifier.
  //
  // -------------------------------------------------------

  customerId: string;


  // -------------------------------------------------------
  // ORDER CONNECTION
  // -------------------------------------------------------
  //
  // A Waiting Lounge customer normally has an order.
  //
  // We store only the order ID instead of copying the
  // complete Order object into the queue.
  //
  // Example:
  //
  // orderId = "SC1005"
  //
  // This keeps the queue data small and avoids duplicated
  // order information.
  //
  // -------------------------------------------------------

  orderId?: string;


  // -------------------------------------------------------
  // RESERVATION CONNECTION
  // -------------------------------------------------------
  //
  // If this queue entry is connected to a reservation,
  // this stores the reservation ID.
  //
  // Example:
  //
  // RES-1791194646255-470
  //
  // QueueContext can use this ID when the customer is
  // seated and the reservation needs to be checked in.
  //
  // -------------------------------------------------------

  reservationId?: string;


  // -------------------------------------------------------
  // QUEUE TOKEN
  // -------------------------------------------------------
  //
  // Human-readable token shown to the customer.
  //
  // Example:
  //
  // WL-1005
  //
  // -------------------------------------------------------

  queueToken: string;


  // -------------------------------------------------------
  // PARTY SIZE
  // -------------------------------------------------------
  //
  // Number of people in this queue entry.
  //
  // Example:
  //
  // partySize = 4
  //
  // -------------------------------------------------------

  partySize: number;


  // -------------------------------------------------------
  // CURRENT QUEUE POSITION
  // -------------------------------------------------------
  //
  // Position is calculated for active queue entries.
  //
  // Example:
  //
  // 1 = first customer
  // 2 = second customer
  // 3 = third customer
  //
  // -------------------------------------------------------

  position: number;


  // -------------------------------------------------------
  // ESTIMATED WAIT TIME
  // -------------------------------------------------------
  //
  // Estimated waiting time in minutes.
  //
  // Example:
  //
  // estimatedWaitMinutes = 20
  //
  // This value can be recalculated when the queue changes.
  //
  // -------------------------------------------------------

  estimatedWaitMinutes: number;


  // -------------------------------------------------------
  // JOIN TIME
  // -------------------------------------------------------
  //
  // ISO timestamp indicating when the customer joined
  // the Waiting Lounge queue.
  //
  // Example:
  //
  // "2026-10-06T12:30:00.000Z"
  //
  // -------------------------------------------------------

  joinedAt: string;


  // -------------------------------------------------------
  // CURRENT QUEUE STATUS
  // -------------------------------------------------------
  //
  // Controls the customer's position in the queue lifecycle.
  //
  // waiting
  // → table-ready
  // → seated
  // → completed
  //
  // Cancellation:
  //
  // waiting → cancelled
  // table-ready → cancelled
  //
  // -------------------------------------------------------

  status: QueueStatus;


  // -------------------------------------------------------
  // ASSIGNED TABLE
  // -------------------------------------------------------
  //
  // This is set when staff temporarily assigns a table
  // to the Waiting Lounge customer.
  //
  // Example:
  //
  // assignedTableId = "table-1"
  //
  // It can change if staff moves the customer to another
  // table.
  //
  // -------------------------------------------------------

  assignedTableId?: string;


  // -------------------------------------------------------
  // CUSTOMER NOTIFICATION PREFERENCE
  // -------------------------------------------------------
  //
  // true:
  // Customer wants notification when their table becomes
  // ready.
  //
  // false:
  // Customer does not want notification.
  //
  // -------------------------------------------------------

  notifyWhenReady: boolean;
}