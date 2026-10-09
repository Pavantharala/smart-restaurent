// ============================================================
// SMART CAFE - QUEUE INTEGRITY HELPERS
// ============================================================
//
// Phase 17.14.2
//
// These helpers protect the relationship between:
//
// Order
//   ↕
// Queue Entry
//   ↕
// Reservation
//
// IMPORTANT:
//
// QueueContext is below OrderContext in the provider tree.
//
// Therefore QueueContext must NOT use useOrder().
//
// Instead, these helpers read the persisted order data from
// localStorage when an order relationship needs to be checked.
//
// This keeps the provider architecture one-directional.
// ============================================================

import type { Order } from "../types/Order";
import type { QueueEntry } from "../types/Queue";

// ============================================================
// STORAGE KEY
// ============================================================

const ORDERS_STORAGE_KEY =
  "smart-cafe-orders";

// ============================================================
// ACTIVE QUEUE STATUSES
// ============================================================
//
// These statuses represent queue entries that are still part
// of the customer's current lifecycle.
//
// A completed/cancelled queue entry is historical data.
// ============================================================

const ACTIVE_QUEUE_STATUSES = new Set([
  "waiting",
  "table-ready",
  "seated",
]);

// ============================================================
// LOAD STORED ORDERS
// ============================================================
//
// QueueContext cannot call useOrder() because of the provider
// hierarchy.
//
// So when we need to validate an order relationship, we read
// the persisted order list directly.
// ============================================================

export function loadStoredOrders(): Order[] {
  try {
    const stored =
      localStorage.getItem(
        ORDERS_STORAGE_KEY,
      );

    if (!stored) {
      return [];
    }

    const parsed =
      JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      console.warn(
        "Smart Cafe: Stored orders data is not an array.",
      );

      return [];
    }

    return parsed as Order[];
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to read stored orders for queue validation:",
      error,
    );

    return [];
  }
}

// ============================================================
// FIND ORDER
// ============================================================

export function findStoredOrder(
  orderId: string,
): Order | undefined {
  const orders =
    loadStoredOrders();

  return orders.find(
    (order) =>
      order.id === orderId,
  );
}

// ============================================================
// FIND QUEUE ENTRY BY ORDER
// ============================================================
//
// Returns an existing queue entry connected to the order.
//
// This checks all queue entries, including completed and
// cancelled entries, because one physical order should never
// be connected to multiple queue records.
// ============================================================

export function findQueueEntryByOrder(
  queue: QueueEntry[],
  orderId: string,
): QueueEntry | undefined {
  return queue.find(
    (entry) =>
      entry.orderId === orderId,
  );
}

// ============================================================
// FIND ACTIVE QUEUE ENTRY BY ORDER
// ============================================================
//
// Useful when the caller only wants to know whether the
// customer currently has an active queue position.
// ============================================================

export function findActiveQueueEntryByOrder(
  queue: QueueEntry[],
  orderId: string,
): QueueEntry | undefined {
  return queue.find(
    (entry) =>
      entry.orderId === orderId &&
      ACTIVE_QUEUE_STATUSES.has(
        entry.status,
      ),
  );
}

// ============================================================
// FIND QUEUE ENTRY BY RESERVATION
// ============================================================
//
// A reservation should not create multiple active Waiting
// Lounge entries.
//
// Historical completed/cancelled entries are allowed to remain
// in localStorage, so we only block active entries.
// ============================================================

export function findActiveQueueEntryByReservation(
  queue: QueueEntry[],
  reservationId: string,
): QueueEntry | undefined {
  return queue.find(
    (entry) =>
      entry.reservationId ===
        reservationId &&
      ACTIVE_QUEUE_STATUSES.has(
        entry.status,
      ),
  );
}

// ============================================================
// CHECK QUEUE ENTRY ID
// ============================================================
//
// Queue IDs must be unique.
//
// This protects against accidental ID reuse.
// ============================================================

export function queueEntryIdExists(
  queue: QueueEntry[],
  queueEntryId: string,
): boolean {
  return queue.some(
    (entry) =>
      entry.id === queueEntryId,
  );
}

// ============================================================
// VALIDATE ORDER REFERENCE
// ============================================================
//
// Returns:
//
// null
//   → order reference is valid
//
// string
//   → validation error
//
// ============================================================

export function validateQueueOrderReference(
  queue: QueueEntry[],
  orderId?: string,
): string | null {
  // ----------------------------------------------------------
  // No order is allowed for flexible queue usage.
  // ----------------------------------------------------------

  if (!orderId) {
    return null;
  }

  // ----------------------------------------------------------
  // ORDER MUST EXIST
  // ----------------------------------------------------------

  const order =
    findStoredOrder(orderId);

  if (!order) {
    return (
      `Order "${orderId}" could not be found. ` +
      "The queue entry was not created."
    );
  }

  // ----------------------------------------------------------
  // ORDER CANNOT HAVE ANOTHER QUEUE ENTRY
  // ----------------------------------------------------------

  const existingQueueEntry =
    findQueueEntryByOrder(
      queue,
      orderId,
    );

  if (existingQueueEntry) {
    return (
      `Order "${orderId}" is already connected to queue entry ` +
      `"${existingQueueEntry.id}".`
    );
  }

  // ----------------------------------------------------------
  // ORDER'S OWN queueEntryId MUST NOT POINT ELSEWHERE
  // ----------------------------------------------------------
  //
  // If the Order already contains a queueEntryId, it means
  // another queue relationship already exists.
  //
  // QueueContext cannot silently overwrite that relationship.
  // ----------------------------------------------------------

  if (
    order.queueEntryId
  ) {
    const linkedQueueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          order.queueEntryId,
      );

    if (
      linkedQueueEntry
    ) {
      return (
        `Order "${orderId}" is already linked to queue entry ` +
        `"${order.queueEntryId}".`
      );
    }

    // --------------------------------------------------------
    // The order references a queue entry that is not present
    // in the current queue.
    //
    // We do not automatically overwrite it.
    // This is safer until the recovery phase.
    // --------------------------------------------------------

    return (
      `Order "${orderId}" already contains queue entry ID ` +
      `"${order.queueEntryId}", but that queue entry was not found.`
    );
  }

  return null;
}

// ============================================================
// VALIDATE RESERVATION DUPLICATE
// ============================================================
//
// Returns:
//
// null
//   → reservation can be connected
//
// string
//   → duplicate active queue entry exists
// ============================================================

export function validateQueueReservationReference(
  queue: QueueEntry[],
  reservationId?: string,
): string | null {
  if (!reservationId) {
    return null;
  }

  const existingQueueEntry =
    findActiveQueueEntryByReservation(
      queue,
      reservationId,
    );

  if (!existingQueueEntry) {
    return null;
  }

  return (
    `Reservation "${reservationId}" is already connected ` +
    `to active queue entry "${existingQueueEntry.id}".`
  );
}

// ============================================================
// VALIDATE QUEUE ENTRY ID
// ============================================================

export function validateQueueEntryId(
  queue: QueueEntry[],
  queueEntryId: string,
): string | null {
  if (
    !queueEntryId ||
    queueEntryId.trim().length ===
      0
  ) {
    return "Queue entry ID is required.";
  }

  if (
    queueEntryIdExists(
      queue,
      queueEntryId,
    )
  ) {
    return (
      `Queue entry ID "${queueEntryId}" already exists.`
    );
  }

  return null;
}