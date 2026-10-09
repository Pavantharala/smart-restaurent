
// =========================================================
// SMART CAFE - ORDER STATUS WORKFLOW
// =========================================================
//
// Defines which order-status changes are allowed.
//
// CUSTOMER ORDER FLOW:
//
// created
//    ↓
// payment-pending
//    ↓
// confirmed
//    ↓
// accepted
//    ↓
// preparing
//    ↓
// ready
//    ↓
// served
//    ↓
// completed
//
// CANCELLATION:
//
// confirmed  → cancelled
// accepted   → cancelled
// preparing  → cancelled
//
// Keeping this workflow in one place prevents different
// pages from implementing conflicting order rules.
// =========================================================

import type { OrderStatus } from "../types/Order";

// =========================================================
// STATUS TRANSITIONS
// =========================================================
//
// Each status contains the statuses it is allowed to move
// to next.
//
// Example:
//
// confirmed → accepted
// confirmed → cancelled
//
// But:
//
// confirmed → ready
//
// is NOT allowed.
// =========================================================

const STATUS_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
  // -------------------------------------------------------
  // Newly created order.
  // -------------------------------------------------------

  created: [
    "payment-pending",
    "confirmed",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Waiting for payment confirmation.
  // -------------------------------------------------------

  "payment-pending": [
    "confirmed",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Payment confirmed.
  //
  // Kitchen can now accept or cancel the order.
  // -------------------------------------------------------

  confirmed: [
    "accepted",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Kitchen accepted the order.
  //
  // Kitchen can now start preparation or cancel it.
  // -------------------------------------------------------

  accepted: [
    "preparing",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Food is currently being prepared.
  // -------------------------------------------------------

  preparing: [
    "ready",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Food is ready for service.
  // -------------------------------------------------------

  ready: [
    "served",
    "cancelled",
  ],

  // -------------------------------------------------------
  // Customer has been served.
  // -------------------------------------------------------

  served: [
    "completed",
  ],

  // -------------------------------------------------------
  // Finished order.
  // -------------------------------------------------------

  completed: [],

  // -------------------------------------------------------
  // Cancelled order.
  // -------------------------------------------------------

  cancelled: [],
};

// =========================================================
// CHECK STATUS TRANSITION
// =========================================================
//
// Returns true only when the requested status change is
// explicitly allowed.
// =========================================================

export function canChangeOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  // -------------------------------------------------------
  // Do not allow changing to the same status.
  // -------------------------------------------------------

  if (
    currentStatus ===
    nextStatus
  ) {
    return false;
  }

  return STATUS_TRANSITIONS[
    currentStatus
  ].includes(nextStatus);
}

// =========================================================
// GET NEXT POSSIBLE STATUSES
// =========================================================
//
// Useful for future admin/staff interfaces where we may
// want to dynamically show available actions.
// =========================================================

export function getNextOrderStatuses(
  currentStatus: OrderStatus,
): OrderStatus[] {
  return STATUS_TRANSITIONS[
    currentStatus
  ];
}

