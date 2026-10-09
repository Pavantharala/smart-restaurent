// =========================================================
// SMART CAFE - QUEUE CONTEXT
// =========================================================
//
// Handles the restaurant Waiting Lounge queue.
//
// RESPONSIBILITIES:
//
// - Add customers to waiting queue
// - Prevent duplicate queue entries
// - Prevent duplicate reservation queue entries
// - Validate Order ↔ Queue relationships
// - Generate queue tokens
// - Generate queue positions
// - Calculate estimated waiting time
// - Recalculate queue
// - Cancel queue entries
// - Assign tables
// - Change assigned tables
// - Mark customers seated
// - Complete seated queue entries
// - Persist queue
// - Synchronize queue between browser tabs
// - Synchronize queue with order lifecycle
// - Protect table ownership during queue synchronization
//
// =========================================================
// PHASE 17.15.6
// =========================================================
//
// QUEUE ↔ ORDER ↔ TABLE SYNCHRONIZATION
//
// IMPORTANT ARCHITECTURE:
//
// OrderProvider is ABOVE QueueProvider.
//
// Therefore QueueContext does NOT call useOrder().
//
// Instead:
//
// OrderContext
//      ↓
// CustomEvent
//      ↓
// QueueContext
//
// This avoids circular provider dependencies.
//
// PAYMENT IS NOT PART OF THIS WORKFLOW.
//
// QueueContext only synchronizes:
//
// Order lifecycle
//      ↕
// Queue lifecycle
//      ↕
// Temporary / assigned table lifecycle
//
// Payment status must never block queue or kitchen workflow.
//
// =========================================================
//
// QUEUE LIFECYCLE
//
// waiting
//    ↓
// table-ready
//    ↓
// seated
//    ↓
// completed
//
// Cancellation:
//
// waiting       → cancelled
// table-ready   → cancelled
//
// A seated queue customer keeps the physical table because
// the customer has already been seated.
//
// =========================================================
//
// TABLE SAFETY
//
// Queue temporary table holds use:
//
// status = "reserved"
// orderId = undefined
//
// Before releasing a queue table, we verify that the table
// is still a queue-style temporary hold.
//
// This prevents:
//
// Queue A cancelled
//      ↓
// accidentally releasing
//      ↓
// Table now owned by Order B
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

import type {
  QueueEntry,
  QueueStatus,
} from "../types/Queue";

import { useTable } from "./TableContext";
import { useReservation } from "./ReservationContext";
import { useSettings } from "./SettingsContext";

// =========================================================
// QUEUE INTEGRITY HELPERS
// =========================================================

import {
  validateQueueEntryId,
  validateQueueOrderReference,
  validateQueueReservationReference,
} from "../utils/queueIntegrity";

// =========================================================
// STORAGE
// =========================================================

const QUEUE_STORAGE_KEY =
  "smart-cafe-queue";

const ORDERS_STORAGE_KEY =
  "smart-cafe-orders";

// =========================================================
// ORDER LIFECYCLE EVENT
// =========================================================

const ORDER_LIFECYCLE_EVENT =
  "smart-cafe-order-lifecycle";

// =========================================================
// QUEUE TOKEN
// =========================================================

const QUEUE_TOKEN_PREFIX = "WL";

// =========================================================
// CONTEXT TYPE
// =========================================================

interface QueueContextType {
  queue: QueueEntry[];

  addToQueue: (input: {
    customerId: string;
    orderId?: string;
    reservationId?: string;
    partySize: number;
    notifyWhenReady?: boolean;
  }) => QueueEntry;

  getQueueEntryById: (
    queueEntryId: string,
  ) => QueueEntry | undefined;

  getQueueEntryByOrderId: (
    orderId: string,
  ) => QueueEntry | undefined;

  getQueueEntryByToken: (
    queueToken: string,
  ) => QueueEntry | undefined;

  updateQueueStatus: (
    queueEntryId: string,
    status: QueueStatus,
  ) => void;

  assignTable: (
    queueEntryId: string,
    tableId: string,
  ) => void;

  changeAssignedTable: (
    queueEntryId: string,
    newTableId: string,
  ) => void;

  markAsSeated: (
    queueEntryId: string,
  ) => void;

  cancelQueueEntry: (
    queueEntryId: string,
  ) => void;

  getWaitingEntries: () => QueueEntry[];
}

// =========================================================
// CONTEXT
// =========================================================

const QueueContext =
  createContext<
    QueueContextType | undefined
  >(undefined);

// =========================================================
// NORMALIZE QUEUE STATUS
// =========================================================

function normalizeQueueStatus(
  value: unknown,
): QueueStatus {
  if (
    value === "waiting" ||
    value === "table-ready" ||
    value === "seated" ||
    value === "completed" ||
    value === "cancelled"
  ) {
    return value;
  }

  return "waiting";
}

// =========================================================
// NORMALIZE QUEUE
// =========================================================

function normalizeQueue(
  value: unknown,
): QueueEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(
    (rawEntry, index) => {
      const entry =
        rawEntry &&
        typeof rawEntry === "object"
          ? (rawEntry as Record<
              string,
              unknown
            >)
          : {};

      // -----------------------------------------------------
      // PARTY SIZE
      // -----------------------------------------------------

      const rawPartySize =
        Number(entry.partySize);

      const partySize =
        Number.isFinite(rawPartySize) &&
        rawPartySize > 0
          ? rawPartySize
          : 1;

      // -----------------------------------------------------
      // POSITION
      // -----------------------------------------------------

      const rawPosition =
        Number(entry.position);

      const position =
        Number.isFinite(rawPosition) &&
        rawPosition >= 0
          ? rawPosition
          : 0;

      // -----------------------------------------------------
      // WAIT TIME
      // -----------------------------------------------------

      const rawWait =
        Number(
          entry.estimatedWaitMinutes,
        );

      const estimatedWaitMinutes =
        Number.isFinite(rawWait) &&
        rawWait >= 0
          ? rawWait
          : 0;

      // -----------------------------------------------------
      // RETURN NORMALIZED ENTRY
      // -----------------------------------------------------

      return {
        ...entry,

        id:
          typeof entry.id ===
          "string"
            ? entry.id
            : `Q${Date.now()}-${index}`,

        queueToken:
          typeof entry.queueToken ===
          "string"
            ? entry.queueToken
            : `${QUEUE_TOKEN_PREFIX}-${Date.now()}-${index}`,

        customerId:
          typeof entry.customerId ===
          "string"
            ? entry.customerId
            : `guest-${index}`,

        orderId:
          typeof entry.orderId ===
          "string"
            ? entry.orderId
            : undefined,

        reservationId:
          typeof entry.reservationId ===
          "string"
            ? entry.reservationId
            : undefined,

        partySize,

        position,

        estimatedWaitMinutes,

        joinedAt:
          typeof entry.joinedAt ===
          "string"
            ? entry.joinedAt
            : new Date().toISOString(),

        status:
          normalizeQueueStatus(
            entry.status,
          ),

        assignedTableId:
          typeof entry.assignedTableId ===
          "string"
            ? entry.assignedTableId
            : undefined,

        notifyWhenReady:
          typeof entry.notifyWhenReady ===
          "boolean"
            ? entry.notifyWhenReady
            : true,
      } as QueueEntry;
    },
  );
}

// =========================================================
// DATE HELPERS
// =========================================================

function padNumber(
  value: number,
): string {
  return String(value).padStart(
    2,
    "0",
  );
}

// =========================================================
// LOCAL DATE
// =========================================================

function getLocalDateKey(
  date: Date,
): string {
  return [
    date.getFullYear(),
    padNumber(
      date.getMonth() + 1,
    ),
    padNumber(
      date.getDate(),
    ),
  ].join("-");
}

// =========================================================
// LOCAL TIME
// =========================================================

function getLocalTimeKey(
  date: Date,
): string {
  return [
    padNumber(
      date.getHours(),
    ),
    padNumber(
      date.getMinutes(),
    ),
  ].join(":");
}

// =========================================================
// QUEUE STATUS TRANSITION VALIDATION
// =========================================================

function isValidQueueStatusTransition(
  currentStatus: QueueStatus,
  nextStatus: QueueStatus,
): boolean {
  // Same status is harmless.
  if (
    currentStatus ===
    nextStatus
  ) {
    return true;
  }

  // -------------------------------------------------------
  // WAITING
  // -------------------------------------------------------

  if (
    currentStatus ===
    "waiting"
  ) {
    return (
      nextStatus ===
        "table-ready" ||
      nextStatus ===
        "cancelled"
    );
  }

  // -------------------------------------------------------
  // TABLE READY
  // -------------------------------------------------------

  if (
    currentStatus ===
    "table-ready"
  ) {
    return (
      nextStatus ===
        "seated" ||
      nextStatus ===
        "cancelled"
    );
  }

  // -------------------------------------------------------
  // SEATED
  // -------------------------------------------------------

  if (
    currentStatus ===
    "seated"
  ) {
    return (
      nextStatus ===
      "completed"
    );
  }

  // -------------------------------------------------------
  // TERMINAL
  // -------------------------------------------------------

  if (
    currentStatus ===
      "cancelled" ||
    currentStatus ===
      "completed"
  ) {
    return false;
  }

  return false;
}

// =========================================================
// ORDER → QUEUE STATUS MAPPING
// =========================================================
//
// OrderContext owns the order lifecycle.
//
// QueueContext owns the queue lifecycle.
//
// These systems are synchronized only when an order reaches
// a terminal state.
//
// =========================================================

function getQueueStatusForOrderStatus(
  currentQueueStatus: QueueStatus,
  orderStatus: string,
): QueueStatus | null {
  // -------------------------------------------------------
  // ORDER CANCELLED
  // -------------------------------------------------------

  if (
    orderStatus ===
    "cancelled"
  ) {
    // A customer still waiting can be cancelled.
    //
    // A table-ready customer can be cancelled and its
    // temporary table hold can be released.
    if (
      currentQueueStatus ===
        "waiting" ||
      currentQueueStatus ===
        "table-ready"
    ) {
      return "cancelled";
    }

    // A seated customer is deliberately not changed here.
    //
    // The customer has already occupied the physical table.
    // Order cancellation must not automatically release that
    // physical table.
    return null;
  }

  // -------------------------------------------------------
  // ORDER COMPLETED
  // -------------------------------------------------------

  if (
    orderStatus ===
    "completed"
  ) {
    if (
      currentQueueStatus ===
      "seated"
    ) {
      return "completed";
    }

    return null;
  }

  // -------------------------------------------------------
  // OTHER ORDER STATUS
  // -------------------------------------------------------

  return null;
}

// =========================================================
// PROVIDER
// =========================================================

export function QueueProvider({
  children,
}: {
  children: ReactNode;
}) {
  // =======================================================
  // SETTINGS
  // =======================================================

  const { settings } =
    useSettings();

  // =======================================================
  // TABLE CONTEXT
  // =======================================================

  const {
    tables,
    updateTableStatus,
    setTableOrder,
    releaseTable,
  } = useTable();

  // =======================================================
  // RESERVATION CONTEXT
  // =======================================================

  const {
    reservations,
    isTableAvailableForReservation,
    checkInReservation,
  } = useReservation();

  // =======================================================
  // LOAD QUEUE
  // =======================================================

  const [
    queue,
    setQueue,
  ] = useState<QueueEntry[]>(() => {
    try {
      const savedQueue =
        localStorage.getItem(
          QUEUE_STORAGE_KEY,
        );

      if (!savedQueue) {
        return [];
      }

      const parsedQueue =
        JSON.parse(
          savedQueue,
        );

      return normalizeQueue(
        parsedQueue,
      );
    } catch (error) {
      console.error(
        "Failed to load Smart Cafe queue:",
        error,
      );

      return [];
    }
  });

  // =======================================================
  // SAVE QUEUE
  // =======================================================

  const saveQueue = (
    updatedQueue: QueueEntry[],
  ) => {
    try {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(
          updatedQueue,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to save Smart Cafe queue:",
        error,
      );
    }
  };

  // =======================================================
  // SAFE QUEUE TABLE RELEASE
  // =======================================================
  //
  // A queue entry may temporarily reserve a table.
  //
  // Before releasing it, verify that:
  //
  // 1. The table still exists.
  // 2. The table is still reserved.
  // 3. The table does NOT belong to an order.
  //
  // This is important because another customer/order may have
  // taken ownership of the table between the original queue
  // assignment and the cancellation/completion event.
  //
  // =======================================================

  const safelyReleaseQueueTable = (
    tableId: string,
  ): boolean => {
    const table =
      tables.find(
        (currentTable) =>
          currentTable.id ===
          tableId,
      );

    if (!table) {
      console.warn(
        `Smart Cafe: Queue table ${tableId} could not be released because the table no longer exists.`,
      );

      return false;
    }

    // -----------------------------------------------------
    // ACTIVE ORDER OWNS THE TABLE
    // -----------------------------------------------------
    //
    // NEVER release a table that is currently connected to
    // an order.
    //
    // -----------------------------------------------------

    if (table.orderId) {
      console.warn(
        `Smart Cafe: Queue synchronization refused to release table ${tableId} because it belongs to order ${table.orderId}.`,
      );

      return false;
    }

    // -----------------------------------------------------
    // ONLY RELEASE QUEUE-STYLE TEMPORARY HOLDS
    // -----------------------------------------------------

    if (
      table.status !==
      "reserved"
    ) {
      console.warn(
        `Smart Cafe: Queue synchronization refused to release table ${tableId} because its current status is ${table.status}.`,
      );

      return false;
    }

    releaseTable(
      tableId,
    );

    return true;
  };

  // =======================================================
  // CROSS-TAB QUEUE SYNCHRONIZATION
  // =======================================================

  useEffect(() => {
    const handleStorageChange = (
      event: StorageEvent,
    ) => {
      if (
        event.key !==
        QUEUE_STORAGE_KEY
      ) {
        return;
      }

      // Another tab removed the queue.
      if (!event.newValue) {
        setQueue([]);
        return;
      }

      try {
        const parsedQueue =
          JSON.parse(
            event.newValue,
          );

        const normalizedQueue =
          normalizeQueue(
            parsedQueue,
          );

        setQueue(
          normalizedQueue,
        );
      } catch (error) {
        console.error(
          "Failed to synchronize Smart Cafe queue:",
          error,
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
    };
  }, []);

  // =======================================================
  // GENERATE QUEUE TOKEN
  // =======================================================

  const generateQueueToken = (
    orderId?: string,
  ) => {
    // -----------------------------------------------------
    // USE ORDER NUMBER WHEN AVAILABLE
    // -----------------------------------------------------

    if (orderId) {
      const numericPart =
        orderId.replace(
          /\D/g,
          "",
        );

      if (numericPart) {
        const token =
          `${QUEUE_TOKEN_PREFIX}-${numericPart}`;

        const tokenAlreadyExists =
          queue.some(
            (entry) =>
              entry.queueToken ===
              token,
          );

        if (
          !tokenAlreadyExists
        ) {
          return token;
        }
      }
    }

    // -----------------------------------------------------
    // FALLBACK TOKEN
    // -----------------------------------------------------

    return `${QUEUE_TOKEN_PREFIX}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  };

  // =======================================================
  // PROJECTED QUEUE SLOT
  // =======================================================

  const createProjectedQueueSlot =
    () => {
      const start =
        new Date();

      const end =
        new Date(
          start.getTime() +
            settings.queueProjectedUsageMinutes *
              60 *
              1000,
        );

      return {
        date:
          getLocalDateKey(
            start,
          ),

        startTime:
          getLocalTimeKey(
            start,
          ),

        endTime:
          getLocalTimeKey(
            end,
          ),
      };
    };

  // =======================================================
  // RECALCULATE QUEUE
  // =======================================================

  const recalculateQueue = (
    currentQueue: QueueEntry[],
  ): QueueEntry[] => {
    let activePosition = 0;

    return currentQueue.map(
      (entry) => {
        const isActive =
          entry.status ===
            "waiting" ||
          entry.status ===
            "table-ready";

        if (!isActive) {
          return {
            ...entry,

            position: 0,

            estimatedWaitMinutes: 0,
          };
        }

        activePosition += 1;

        return {
          ...entry,

          position:
            activePosition,

          estimatedWaitMinutes:
            activePosition *
            settings.queueWaitTimePerPositionMinutes,
        };
      },
    );
  };

  // =======================================================
  // ORDER → QUEUE LIFECYCLE SYNCHRONIZATION
  // =======================================================
  //
  // OrderContext dispatches:
  //
  // "smart-cafe-order-lifecycle"
  //
  // QueueContext receives the event and updates only the
  // related queue entry.
  //
  // =======================================================

  useEffect(() => {
    const handleOrderLifecycle = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          orderId?: string;
          status?: string;
          queueEntryId?: string;
        }>;

      const detail =
        customEvent.detail;

      if (!detail) {
        return;
      }

      // ---------------------------------------------------
      // FIND RELATED QUEUE ENTRY
      // ---------------------------------------------------

      const queueEntry =
        detail.queueEntryId
          ? queue.find(
              (entry) =>
                entry.id ===
                detail.queueEntryId,
            )
          : detail.orderId
            ? queue.find(
                (entry) =>
                  entry.orderId ===
                  detail.orderId,
              )
            : undefined;

      if (!queueEntry) {
        // This order does not belong to the queue.
        return;
      }

      // ---------------------------------------------------
      // CALCULATE NEXT QUEUE STATUS
      // ---------------------------------------------------

      const nextQueueStatus =
        getQueueStatusForOrderStatus(
          queueEntry.status,
          detail.status ?? "",
        );

      if (!nextQueueStatus) {
        return;
      }

      // ---------------------------------------------------
      // RELEASE TEMPORARY TABLE HOLD
      // ---------------------------------------------------
      //
      // Only table-ready queue customers have a temporary
      // queue table hold.
      //
      // A seated customer's physical table is NOT released
      // by QueueContext.
      //
      // OrderContext remains responsible for order-owned
      // table lifecycle.
      //
      // ---------------------------------------------------

      if (
        nextQueueStatus ===
          "cancelled" &&
        queueEntry.status ===
          "table-ready" &&
        queueEntry.assignedTableId
      ) {
        safelyReleaseQueueTable(
          queueEntry.assignedTableId,
        );
      }

      // ---------------------------------------------------
      // UPDATE QUEUE ENTRY
      // ---------------------------------------------------

      const queueWithUpdatedStatus =
        queue.map(
          (entry) =>
            entry.id ===
            queueEntry.id
              ? {
                  ...entry,

                  status:
                    nextQueueStatus,

                  assignedTableId:
                    nextQueueStatus ===
                    "cancelled"
                      ? undefined
                      : entry.assignedTableId,
                }
              : entry,
        );

      // ---------------------------------------------------
      // RECALCULATE
      // ---------------------------------------------------

      const updatedQueue =
        recalculateQueue(
          queueWithUpdatedStatus,
        );

      // ---------------------------------------------------
      // SAVE
      // ---------------------------------------------------

      setQueue(
        updatedQueue,
      );

      saveQueue(
        updatedQueue,
      );
    };

    window.addEventListener(
      ORDER_LIFECYCLE_EVENT,
      handleOrderLifecycle,
    );

    return () => {
      window.removeEventListener(
        ORDER_LIFECYCLE_EVENT,
        handleOrderLifecycle,
      );
    };
  }, [
    queue,
    settings,
    tables,
    releaseTable,
  ]);

  // =======================================================
  // CROSS-TAB ORDER → QUEUE SYNCHRONIZATION
  // =======================================================
  //
  // Handles order lifecycle changes made in another browser
  // tab.
  //
  // =======================================================

  useEffect(() => {
    const handleOrderStorageChange = (
      event: StorageEvent,
    ) => {
      if (
        event.key !==
        ORDERS_STORAGE_KEY
      ) {
        return;
      }

      if (!event.newValue) {
        return;
      }

      try {
        const storedOrders =
          JSON.parse(
            event.newValue,
          );

        if (
          !Array.isArray(
            storedOrders,
          )
        ) {
          return;
        }

        let hasChanges =
          false;

        const tablesToRelease =
          new Set<string>();

        const updatedQueue =
          queue.map(
            (queueEntry) => {
              // -----------------------------------------
              // FIND RELATED ORDER
              // -----------------------------------------

              const relatedOrder =
                storedOrders.find(
                  (order: {
                    id?: string;
                    queueEntryId?: string;
                  }) =>
                    (
                      queueEntry.orderId &&
                      order.id ===
                        queueEntry.orderId
                    ) ||
                    (
                      queueEntry.id ===
                      order.queueEntryId
                    ),
                );

              if (
                !relatedOrder
              ) {
                return queueEntry;
              }

              // -----------------------------------------
              // FIND NEXT QUEUE STATUS
              // -----------------------------------------

              const nextQueueStatus =
                getQueueStatusForOrderStatus(
                  queueEntry.status,
                  relatedOrder.status,
                );

              if (
                !nextQueueStatus ||
                nextQueueStatus ===
                  queueEntry.status
              ) {
                return queueEntry;
              }

              hasChanges =
                true;

              // -----------------------------------------
              // TEMPORARY TABLE RELEASE
              // -----------------------------------------

              if (
                nextQueueStatus ===
                  "cancelled" &&
                queueEntry.status ===
                  "table-ready" &&
                queueEntry.assignedTableId
              ) {
                tablesToRelease.add(
                  queueEntry.assignedTableId,
                );
              }

              // -----------------------------------------
              // UPDATE ENTRY
              // -----------------------------------------

              return {
                ...queueEntry,

                status:
                  nextQueueStatus,

                assignedTableId:
                  nextQueueStatus ===
                  "cancelled"
                    ? undefined
                    : queueEntry.assignedTableId,
              };
            },
          );

        // ------------------------------------------------
        // RELEASE ONLY SAFE TEMPORARY TABLE HOLDS
        // ------------------------------------------------

        tablesToRelease.forEach(
          (tableId) => {
            safelyReleaseQueueTable(
              tableId,
            );
          },
        );

        // ------------------------------------------------
        // SAVE ONLY WHEN SOMETHING CHANGED
        // ------------------------------------------------

        if (hasChanges) {
          const recalculatedQueue =
            recalculateQueue(
              updatedQueue,
            );

          setQueue(
            recalculatedQueue,
          );

          saveQueue(
            recalculatedQueue,
          );
        }
      } catch (error) {
        console.error(
          "Smart Cafe: Failed to synchronize queue with orders:",
          error,
        );
      }
    };

    window.addEventListener(
      "storage",
      handleOrderStorageChange,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleOrderStorageChange,
      );
    };
  }, [
    queue,
    settings,
    tables,
    releaseTable,
  ]);

  // =======================================================
  // ADD CUSTOMER TO QUEUE
  // =======================================================

  const addToQueue = (
    input: {
      customerId: string;
      orderId?: string;
      reservationId?: string;
      partySize: number;
      notifyWhenReady?: boolean;
    },
  ): QueueEntry => {
    // -----------------------------------------------------
    // PARTY SIZE
    // -----------------------------------------------------

    if (
      !Number.isInteger(
        input.partySize,
      ) ||
      input.partySize <= 0
    ) {
      throw new Error(
        "Party size must be a positive number.",
      );
    }

    // =====================================================
    // PHASE 17.14.2
    // ORDER INTEGRITY CHECK
    // =====================================================

    const orderValidationError =
      validateQueueOrderReference(
        queue,
        input.orderId,
      );

    if (
      orderValidationError
    ) {
      console.warn(
        "Smart Cafe: Queue order validation failed:",
        orderValidationError,
      );

      throw new Error(
        orderValidationError,
      );
    }

    // =====================================================
    // PHASE 17.14.2
    // RESERVATION DUPLICATE CHECK
    // =====================================================

    const reservationValidationError =
      validateQueueReservationReference(
        queue,
        input.reservationId,
      );

    if (
      reservationValidationError
    ) {
      console.warn(
        "Smart Cafe: Queue reservation validation failed:",
        reservationValidationError,
      );

      throw new Error(
        reservationValidationError,
      );
    }

    // =====================================================
    // GENERATE QUEUE ID
    // =====================================================

    const queueId =
      `Q${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    // =====================================================
    // PHASE 17.14.2
    // QUEUE ID DUPLICATE CHECK
    // =====================================================

    const queueIdValidationError =
      validateQueueEntryId(
        queue,
        queueId,
      );

    if (
      queueIdValidationError
    ) {
      console.error(
        "Smart Cafe: Queue ID validation failed:",
        queueIdValidationError,
      );

      throw new Error(
        queueIdValidationError,
      );
    }

    // -----------------------------------------------------
    // TOKEN
    // -----------------------------------------------------

    const queueToken =
      generateQueueToken(
        input.orderId,
      );

    // -----------------------------------------------------
    // CREATE ENTRY
    // -----------------------------------------------------

    const newEntry:
      QueueEntry = {
      id:
        queueId,

      queueToken,

      customerId:
        input.customerId,

      orderId:
        input.orderId,

      reservationId:
        input.reservationId,

      partySize:
        input.partySize,

      position: 0,

      estimatedWaitMinutes: 0,

      joinedAt:
        new Date().toISOString(),

      status:
        "waiting",

      notifyWhenReady:
        input.notifyWhenReady ?? true,
    };

    // -----------------------------------------------------
    // ADD
    // -----------------------------------------------------

    const queueWithNewEntry = [
      ...queue,
      newEntry,
    ];

    // -----------------------------------------------------
    // RECALCULATE
    // -----------------------------------------------------

    const updatedQueue =
      recalculateQueue(
        queueWithNewEntry,
      );

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setQueue(
      updatedQueue,
    );

    saveQueue(
      updatedQueue,
    );

    // -----------------------------------------------------
    // RETURN
    // -----------------------------------------------------

    return (
      updatedQueue.find(
        (entry) =>
          entry.id ===
          newEntry.id,
      ) ?? newEntry
    );
  };

  // =======================================================
  // FIND BY ID
  // =======================================================

  const getQueueEntryById = (
    queueEntryId: string,
  ) => {
    return queue.find(
      (entry) =>
        entry.id ===
        queueEntryId,
    );
  };

  // =======================================================
  // FIND BY ORDER
  // =======================================================

  const getQueueEntryByOrderId = (
    orderId: string,
  ) => {
    return queue.find(
      (entry) =>
        entry.orderId ===
        orderId,
    );
  };

  // =======================================================
  // FIND BY TOKEN
  // =======================================================

  const getQueueEntryByToken = (
    queueToken: string,
  ) => {
    return queue.find(
      (entry) =>
        entry.queueToken ===
        queueToken,
    );
  };

  // =======================================================
  // UPDATE QUEUE STATUS
  // =======================================================

  const updateQueueStatus = (
    queueEntryId: string,
    status: QueueStatus,
  ) => {
    // -----------------------------------------------------
    // FIND ENTRY
    // -----------------------------------------------------

    const queueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          queueEntryId,
      );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // VALIDATE TRANSITION
    // -----------------------------------------------------

    if (
      !isValidQueueStatusTransition(
        queueEntry.status,
        status,
      )
    ) {
      console.warn(
        `Invalid queue status transition: ${queueEntry.status} -> ${status}`,
      );

      return;
    }

    // -----------------------------------------------------
    // TABLE REQUIRED FOR TABLE-READY
    // -----------------------------------------------------

    if (
      status ===
        "table-ready" &&
      !queueEntry.assignedTableId
    ) {
      console.warn(
        "A queue customer cannot become table-ready without an assigned table.",
      );

      return;
    }

    // -----------------------------------------------------
    // TABLE REQUIRED FOR SEATED
    // -----------------------------------------------------

    if (
      status ===
        "seated" &&
      !queueEntry.assignedTableId
    ) {
      console.warn(
        "A queue customer cannot become seated without an assigned table.",
      );

      return;
    }

    // -----------------------------------------------------
    // RELEASE TEMPORARY TABLE ON CANCELLATION
    // -----------------------------------------------------
    //
    // Only a table-ready queue customer has a temporary
    // table hold.
    //
    // A seated customer's table is NOT released here.
    //
    // -----------------------------------------------------

    if (
      status ===
        "cancelled" &&
      queueEntry.status ===
        "table-ready" &&
      queueEntry.assignedTableId
    ) {
      safelyReleaseQueueTable(
        queueEntry.assignedTableId,
      );
    }

    // -----------------------------------------------------
    // UPDATE
    // -----------------------------------------------------

    const queueWithUpdatedStatus =
      queue.map(
        (entry) =>
          entry.id ===
          queueEntryId
            ? {
                ...entry,

                status,

                assignedTableId:
                  status ===
                  "cancelled"
                    ? undefined
                    : entry.assignedTableId,
              }
            : entry,
      );

    // -----------------------------------------------------
    // RECALCULATE
    // -----------------------------------------------------

    const updatedQueue =
      recalculateQueue(
        queueWithUpdatedStatus,
      );

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setQueue(
      updatedQueue,
    );

    saveQueue(
      updatedQueue,
    );
  };

  // =======================================================
  // CHECK TABLE RESERVATION CONFLICT
  // =======================================================

  const isTableProtectedByReservation =
    (
      tableId: string,
    ): boolean => {
      const projectedSlot =
        createProjectedQueueSlot();

      return !isTableAvailableForReservation(
        tableId,
        projectedSlot,
      );
    };

  // =======================================================
  // ASSIGN TABLE
  // =======================================================

  const assignTable = (
    queueEntryId: string,
    tableId: string,
  ) => {
    // -----------------------------------------------------
    // FIND ENTRY
    // -----------------------------------------------------

    const queueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          queueEntryId,
      );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // ONLY WAITING
    // -----------------------------------------------------

    if (
      queueEntry.status !==
      "waiting"
    ) {
      console.warn(
        "Only waiting customers can be assigned a table.",
      );

      return;
    }

    // -----------------------------------------------------
    // FIND TABLE
    // -----------------------------------------------------

    const selectedTable =
      tables.find(
        (table) =>
          table.id ===
          tableId,
      );

    if (!selectedTable) {
      console.warn(
        `Table ${tableId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // PHYSICAL AVAILABILITY
    // -----------------------------------------------------

    if (
      selectedTable.status !==
      "available"
    ) {
      console.warn(
        `Table ${tableId} is not physically available.`,
      );

      return;
    }

    // -----------------------------------------------------
    // TABLE OWNERSHIP
    // -----------------------------------------------------

    if (selectedTable.orderId) {
      console.warn(
        `Table ${tableId} is already owned by order ${selectedTable.orderId}.`,
      );

      return;
    }

    // -----------------------------------------------------
    // CAPACITY
    // -----------------------------------------------------

    if (
      selectedTable.capacity <
      queueEntry.partySize
    ) {
      console.warn(
        `Table ${tableId} does not have enough capacity.`,
      );

      return;
    }

    // -----------------------------------------------------
    // RESERVATION PROTECTION
    // -----------------------------------------------------

    if (
      isTableProtectedByReservation(
        tableId,
      )
    ) {
      console.warn(
        `Table ${tableId} cannot be assigned because the projected queue session conflicts with a reservation.`,
      );

      return;
    }

    // -----------------------------------------------------
    // TEMPORARILY RESERVE TABLE
    // -----------------------------------------------------

    updateTableStatus(
      tableId,
      "reserved",
    );

    // -----------------------------------------------------
    // UPDATE QUEUE
    // -----------------------------------------------------

    const queueWithUpdatedEntry =
      queue.map(
        (entry) =>
          entry.id ===
          queueEntryId
            ? {
                ...entry,

                status:
                  "table-ready" as QueueStatus,

                assignedTableId:
                  tableId,
              }
            : entry,
      );

    // -----------------------------------------------------
    // RECALCULATE
    // -----------------------------------------------------

    const updatedQueue =
      recalculateQueue(
        queueWithUpdatedEntry,
      );

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setQueue(
      updatedQueue,
    );

    saveQueue(
      updatedQueue,
    );
  };

  // =======================================================
  // CHANGE ASSIGNED TABLE
  // =======================================================

  const changeAssignedTable = (
    queueEntryId: string,
    newTableId: string,
  ) => {
    // -----------------------------------------------------
    // FIND ENTRY
    // -----------------------------------------------------

    const queueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          queueEntryId,
      );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // MUST BE TABLE READY
    // -----------------------------------------------------

    if (
      queueEntry.status !==
      "table-ready"
    ) {
      console.warn(
        "Only a table-ready queue entry can change its assigned table.",
      );

      return;
    }

    // -----------------------------------------------------
    // CURRENT TABLE
    // -----------------------------------------------------

    const currentTableId =
      queueEntry.assignedTableId;

    if (!currentTableId) {
      console.warn(
        "Cannot change table because no current table is assigned.",
      );

      return;
    }

    // -----------------------------------------------------
    // SAME TABLE
    // -----------------------------------------------------

    if (
      currentTableId ===
      newTableId
    ) {
      console.warn(
        "The selected table is already assigned.",
      );

      return;
    }

    // -----------------------------------------------------
    // FIND NEW TABLE
    // -----------------------------------------------------

    const newTable =
      tables.find(
        (table) =>
          table.id ===
          newTableId,
      );

    if (!newTable) {
      console.warn(
        `Table ${newTableId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // NEW TABLE AVAILABLE
    // -----------------------------------------------------

    if (
      newTable.status !==
      "available"
    ) {
      console.warn(
        `Table ${newTableId} is not physically available.`,
      );

      return;
    }

    // -----------------------------------------------------
    // NEW TABLE OWNERSHIP
    // -----------------------------------------------------

    if (newTable.orderId) {
      console.warn(
        `Table ${newTableId} is already owned by order ${newTable.orderId}.`,
      );

      return;
    }

    // -----------------------------------------------------
    // CAPACITY
    // -----------------------------------------------------

    if (
      newTable.capacity <
      queueEntry.partySize
    ) {
      console.warn(
        `Table ${newTableId} does not have enough capacity.`,
      );

      return;
    }

    // -----------------------------------------------------
    // RESERVATION PROTECTION
    // -----------------------------------------------------

    if (
      isTableProtectedByReservation(
        newTableId,
      )
    ) {
      console.warn(
        `Table ${newTableId} cannot be assigned because the projected queue session conflicts with a reservation.`,
      );

      return;
    }

    // -----------------------------------------------------
    // RESERVE NEW TABLE FIRST
    // -----------------------------------------------------

    updateTableStatus(
      newTableId,
      "reserved",
    );

    // -----------------------------------------------------
    // RELEASE OLD TABLE SAFELY
    // -----------------------------------------------------
    //
    // If another order has taken the old table in the
    // meantime, safelyReleaseQueueTable() refuses to release
    // it.
    //
    // -----------------------------------------------------

    safelyReleaseQueueTable(
      currentTableId,
    );

    // -----------------------------------------------------
    // UPDATE QUEUE
    // -----------------------------------------------------

    const queueWithUpdatedEntry =
      queue.map(
        (entry) =>
          entry.id ===
          queueEntryId
            ? {
                ...entry,

                status:
                  "table-ready" as QueueStatus,

                assignedTableId:
                  newTableId,
              }
            : entry,
      );

    // -----------------------------------------------------
    // RECALCULATE
    // -----------------------------------------------------

    const updatedQueue =
      recalculateQueue(
        queueWithUpdatedEntry,
      );

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setQueue(
      updatedQueue,
    );

    saveQueue(
      updatedQueue,
    );
  };

  // =======================================================
  // MARK CUSTOMER AS SEATED
  // =======================================================

  const markAsSeated = (
    queueEntryId: string,
  ) => {
    // -----------------------------------------------------
    // FIND ENTRY
    // -----------------------------------------------------

    const queueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          queueEntryId,
      );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // ONLY TABLE READY
    // -----------------------------------------------------

    if (
      queueEntry.status !==
      "table-ready"
    ) {
      console.warn(
        "Only table-ready customers can be marked as seated.",
      );

      return;
    }

    // -----------------------------------------------------
    // TABLE REQUIRED
    // -----------------------------------------------------

    if (
      !queueEntry.assignedTableId
    ) {
      console.warn(
        "Cannot seat customer because no table is assigned.",
      );

      return;
    }

    const tableId =
      queueEntry.assignedTableId;

    // -----------------------------------------------------
    // VERIFY TABLE STILL EXISTS
    // -----------------------------------------------------

    const currentTable =
      tables.find(
        (table) =>
          table.id ===
          tableId,
      );

    if (!currentTable) {
      console.warn(
        `Cannot seat queue customer because table ${tableId} no longer exists.`,
      );

      return;
    }

    // -----------------------------------------------------
    // VERIFY TABLE HAS NOT BEEN TAKEN
    // -----------------------------------------------------

    if (
      currentTable.orderId &&
      currentTable.orderId !==
        queueEntry.orderId
    ) {
      console.warn(
        `Cannot seat queue customer because table ${tableId} is already owned by another order.`,
      );

      return;
    }

    // -----------------------------------------------------
    // OCCUPY TABLE
    // -----------------------------------------------------

    if (queueEntry.orderId) {
      const assigned =
        setTableOrder(
          tableId,
          queueEntry.orderId,
        );

      if (!assigned) {
        console.warn(
          `Smart Cafe: Failed to connect table ${tableId} to order ${queueEntry.orderId}.`,
        );

        return;
      }
    } else {
      updateTableStatus(
        tableId,
        "occupied",
      );
    }

    // -----------------------------------------------------
    // CHECK IN RESERVATION
    // -----------------------------------------------------

    if (
      queueEntry.reservationId
    ) {
      checkInReservation(
        queueEntry.reservationId,
      );
    }

    // -----------------------------------------------------
    // UPDATE QUEUE
    // -----------------------------------------------------

    const queueWithUpdatedStatus =
      queue.map(
        (entry) =>
          entry.id ===
          queueEntryId
            ? {
                ...entry,

                status:
                  "seated" as QueueStatus,
              }
            : entry,
      );

    // -----------------------------------------------------
    // RECALCULATE
    // -----------------------------------------------------

    const updatedQueue =
      recalculateQueue(
        queueWithUpdatedStatus,
      );

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    setQueue(
      updatedQueue,
    );

    saveQueue(
      updatedQueue,
    );
  };

  // =======================================================
  // CANCEL QUEUE ENTRY
  // =======================================================

  const cancelQueueEntry = (
    queueEntryId: string,
  ) => {
    // -----------------------------------------------------
    // FIND ENTRY
    // -----------------------------------------------------

    const queueEntry =
      queue.find(
        (entry) =>
          entry.id ===
          queueEntryId,
      );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    // -----------------------------------------------------
    // TERMINAL CHECK
    // -----------------------------------------------------

    if (
      queueEntry.status ===
        "cancelled" ||
      queueEntry.status ===
        "completed"
    ) {
      console.warn(
        "This queue entry is already in a terminal state.",
      );

      return;
    }

    // -----------------------------------------------------
    // CENTRAL STATUS FUNCTION
    // -----------------------------------------------------
    //
    // updateQueueStatus() owns the cancellation logic so
    // table-release behavior is not duplicated.
    //
    // -----------------------------------------------------

    updateQueueStatus(
      queueEntryId,
      "cancelled",
    );
  };

  // =======================================================
  // GET ACTIVE WAITING CUSTOMERS
  // =======================================================

  const getWaitingEntries =
    () => {
      return queue.filter(
        (entry) =>
          entry.status ===
            "waiting" ||
          entry.status ===
            "table-ready",
      );
    };

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value =
    useMemo<QueueContextType>(
      () => ({
        queue,

        addToQueue,

        getQueueEntryById,

        getQueueEntryByOrderId,

        getQueueEntryByToken,

        updateQueueStatus,

        assignTable,

        changeAssignedTable,

        markAsSeated,

        cancelQueueEntry,

        getWaitingEntries,
      }),
      [
        queue,
        tables,
        reservations,
        isTableAvailableForReservation,
        checkInReservation,
        settings,
        updateTableStatus,
        setTableOrder,
        releaseTable,
      ],
    );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <QueueContext.Provider
      value={value}
    >
      {children}
    </QueueContext.Provider>
  );
}

// =========================================================
// USE QUEUE HOOK
// =========================================================

export function useQueue() {
  const context =
    useContext(
      QueueContext,
    );

  if (!context) {
    throw new Error(
      "useQueue must be used inside QueueProvider",
    );
  }

  return context;
}