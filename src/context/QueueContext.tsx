// =========================================================
// SMART CAFE - QUEUE CONTEXT
// =========================================================
//
// Handles the restaurant Waiting Lounge queue.
//
// Responsibilities:
// - Add and cancel queue entries
// - Prevent duplicate queue/order/reservation references
// - Generate tokens and calculate wait times
// - Assign and change tables
// - Seat customers and complete queue entries
// - Persist and synchronize queue across browser tabs
// - Synchronize queue with order lifecycle
// - Protect tables owned by orders
//
// Payment is independent of queue and kitchen workflows.
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

import {
  validateQueueEntryId,
  validateQueueOrderReference,
  validateQueueReservationReference,
} from "../utils/queueIntegrity";

// =========================================================
// STORAGE AND EVENTS
// =========================================================

const QUEUE_STORAGE_KEY = "smart-cafe-queue";
const ORDERS_STORAGE_KEY = "smart-cafe-orders";
const ORDER_LIFECYCLE_EVENT =
  "smart-cafe-order-lifecycle";

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

const QueueContext =
  createContext<QueueContextType | undefined>(
    undefined,
  );

// =========================================================
// NORMALIZATION
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

function normalizeQueue(
  value: unknown,
): QueueEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((rawEntry, index) => {
    const entry =
      rawEntry && typeof rawEntry === "object"
        ? (rawEntry as Record<string, unknown>)
        : {};

    const rawPartySize = Number(entry.partySize);
    const rawPosition = Number(entry.position);
    const rawWait = Number(
      entry.estimatedWaitMinutes,
    );

    return {
      ...entry,

      id:
        typeof entry.id === "string"
          ? entry.id
          : `Q${Date.now()}-${index}`,

      queueToken:
        typeof entry.queueToken === "string"
          ? entry.queueToken
          : `${QUEUE_TOKEN_PREFIX}-${Date.now()}-${index}`,

      customerId:
        typeof entry.customerId === "string"
          ? entry.customerId
          : `guest-${index}`,

      orderId:
        typeof entry.orderId === "string"
          ? entry.orderId
          : undefined,

      reservationId:
        typeof entry.reservationId === "string"
          ? entry.reservationId
          : undefined,

      partySize:
        Number.isFinite(rawPartySize) &&
        rawPartySize > 0
          ? rawPartySize
          : 1,

      position:
        Number.isFinite(rawPosition) &&
        rawPosition >= 0
          ? rawPosition
          : 0,

      estimatedWaitMinutes:
        Number.isFinite(rawWait) && rawWait >= 0
          ? rawWait
          : 0,

      joinedAt:
        typeof entry.joinedAt === "string"
          ? entry.joinedAt
          : new Date().toISOString(),

      status: normalizeQueueStatus(entry.status),

      assignedTableId:
        typeof entry.assignedTableId === "string"
          ? entry.assignedTableId
          : undefined,

      notifyWhenReady:
        typeof entry.notifyWhenReady === "boolean"
          ? entry.notifyWhenReady
          : true,
    } as QueueEntry;
  });
}

// =========================================================
// DATE HELPERS
// =========================================================

function padNumber(value: number): string {
  return String(value).padStart(2, "0");
}

function getLocalDateKey(date: Date): string {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function getLocalTimeKey(date: Date): string {
  return [
    padNumber(date.getHours()),
    padNumber(date.getMinutes()),
  ].join(":");
}

// =========================================================
// QUEUE STATUS TRANSITIONS
// =========================================================

function isValidQueueStatusTransition(
  currentStatus: QueueStatus,
  nextStatus: QueueStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "waiting") {
    return (
      nextStatus === "table-ready" ||
      nextStatus === "cancelled"
    );
  }

  if (currentStatus === "table-ready") {
    return (
      nextStatus === "seated" ||
      nextStatus === "cancelled"
    );
  }

  if (currentStatus === "seated") {
    return nextStatus === "completed";
  }

  return false;
}

// =========================================================
// ORDER → QUEUE STATUS MAPPING
// =========================================================

function getQueueStatusForOrderStatus(
  currentQueueStatus: QueueStatus,
  orderStatus: string,
): QueueStatus | null {
  if (orderStatus === "cancelled") {
    if (
      currentQueueStatus === "waiting" ||
      currentQueueStatus === "table-ready"
    ) {
      return "cancelled";
    }

    // Never release a seated customer's physical table here.
    return null;
  }

  if (orderStatus === "completed") {
    return currentQueueStatus === "seated"
      ? "completed"
      : null;
  }

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
  const { settings } = useSettings();

  const {
    tables,
    updateTableStatus,
    setTableOrder,
  } = useTable();

  const {
    reservations,
    isTableAvailableForReservation,
    checkInReservation,
  } = useReservation();

  // -------------------------------------------------------
  // LOAD SAVED QUEUE
  // -------------------------------------------------------

  const [queue, setQueue] = useState<QueueEntry[]>(
    () => {
      try {
        const savedQueue = localStorage.getItem(
          QUEUE_STORAGE_KEY,
        );

        if (!savedQueue) {
          return [];
        }

        return normalizeQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error(
          "Failed to load Smart Cafe queue:",
          error,
        );

        return [];
      }
    },
  );

  // -------------------------------------------------------
  // SAVE QUEUE
  // -------------------------------------------------------

  const saveQueue = (updatedQueue: QueueEntry[]) => {
    try {
      localStorage.setItem(
        QUEUE_STORAGE_KEY,
        JSON.stringify(updatedQueue),
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
  // Only release a table when it is still a temporary queue
  // hold: status "reserved", with no orderId.
  //
  // This does not replace TableContext's order lifecycle.
  // =======================================================

  const safelyReleaseQueueTable = (
    tableId: string,
  ): boolean => {
    const table = tables.find(
      (currentTable) => currentTable.id === tableId,
    );

    if (!table) {
      console.warn(
        `Queue could not release table ${tableId}: table not found.`,
      );

      return false;
    }

    if (table.orderId) {
      console.warn(
        `Queue refused to release table ${tableId}: owned by order ${table.orderId}.`,
      );

      return false;
    }

    if (table.status !== "reserved") {
      console.warn(
        `Queue refused to release table ${tableId}: status is ${table.status}.`,
      );

      return false;
    }

    // A temporary queue hold is not an order-cleaning
    // lifecycle. Do not call TableContext.releaseTable().
    updateTableStatus(tableId, "available");

    return true;
  };

  // =======================================================
  // CROSS-TAB QUEUE SYNCHRONIZATION
  // =======================================================

  useEffect(() => {
    const handleStorageChange = (
      event: StorageEvent,
    ) => {
      if (event.key !== QUEUE_STORAGE_KEY) {
        return;
      }

      if (!event.newValue) {
        setQueue([]);
        return;
      }

      try {
        setQueue(
          normalizeQueue(JSON.parse(event.newValue)),
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

  const generateQueueToken = (orderId?: string) => {
    if (orderId) {
      const numericPart = orderId.replace(/\D/g, "");

      if (numericPart) {
        const token = `${QUEUE_TOKEN_PREFIX}-${numericPart}`;

        if (
          !queue.some(
            (entry) => entry.queueToken === token,
          )
        ) {
          return token;
        }
      }
    }

    return `${QUEUE_TOKEN_PREFIX}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  };

  // =======================================================
  // PROJECTED QUEUE SLOT
  // =======================================================

  const createProjectedQueueSlot = () => {
    const start = new Date();

    const end = new Date(
      start.getTime() +
        settings.queueProjectedUsageMinutes * 60 * 1000,
    );

    return {
      date: getLocalDateKey(start),
      startTime: getLocalTimeKey(start),
      endTime: getLocalTimeKey(end),
    };
  };

  // =======================================================
  // RECALCULATE QUEUE POSITIONS AND WAIT TIMES
  // =======================================================

  const recalculateQueue = (
    currentQueue: QueueEntry[],
  ): QueueEntry[] => {
    let activePosition = 0;

    return currentQueue.map((entry) => {
      const isActive =
        entry.status === "waiting" ||
        entry.status === "table-ready";

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
        position: activePosition,
        estimatedWaitMinutes:
          activePosition *
          settings.queueWaitTimePerPositionMinutes,
      };
    });
  };

  // =======================================================
  // ORDER → QUEUE LIFECYCLE SYNCHRONIZATION
  // =======================================================

  useEffect(() => {
    const handleOrderLifecycle = (event: Event) => {
      const customEvent = event as CustomEvent<{
        orderId?: string;
        status?: string;
        queueEntryId?: string;
      }>;

      const detail = customEvent.detail;

      if (!detail) {
        return;
      }

      const queueEntry = detail.queueEntryId
        ? queue.find(
            (entry) => entry.id === detail.queueEntryId,
          )
        : detail.orderId
          ? queue.find(
              (entry) => entry.orderId === detail.orderId,
            )
          : undefined;

      if (!queueEntry) {
        return;
      }

      const nextQueueStatus =
        getQueueStatusForOrderStatus(
          queueEntry.status,
          detail.status ?? "",
        );

      if (!nextQueueStatus) {
        return;
      }

      // Only a table-ready queue entry has a temporary
      // queue hold that cancellation may release.
      if (
        nextQueueStatus === "cancelled" &&
        queueEntry.status === "table-ready" &&
        queueEntry.assignedTableId
      ) {
        safelyReleaseQueueTable(
          queueEntry.assignedTableId,
        );
      }

      const queueWithUpdatedStatus = queue.map(
        (entry) =>
          entry.id === queueEntry.id
            ? {
                ...entry,
                status: nextQueueStatus,
                assignedTableId:
                  nextQueueStatus === "cancelled"
                    ? undefined
                    : entry.assignedTableId,
              }
            : entry,
      );

      const updatedQueue = recalculateQueue(
        queueWithUpdatedStatus,
      );

      setQueue(updatedQueue);
      saveQueue(updatedQueue);
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
    updateTableStatus,
  ]);

  // =======================================================
  // CROSS-TAB ORDER → QUEUE SYNCHRONIZATION
  // =======================================================

  useEffect(() => {
    const handleOrderStorageChange = (
      event: StorageEvent,
    ) => {
      if (
        event.key !== ORDERS_STORAGE_KEY ||
        !event.newValue
      ) {
        return;
      }

      try {
        const storedOrders = JSON.parse(event.newValue);

        if (!Array.isArray(storedOrders)) {
          return;
        }

        let hasChanges = false;
        const tablesToRelease = new Set<string>();

        const updatedQueue = queue.map((queueEntry) => {
          const relatedOrder = storedOrders.find(
            (order: {
              id?: string;
              queueEntryId?: string;
              status?: string;
            }) =>
              (queueEntry.orderId &&
                order.id === queueEntry.orderId) ||
              queueEntry.id === order.queueEntryId,
          );

          if (!relatedOrder) {
            return queueEntry;
          }

          const nextQueueStatus =
            getQueueStatusForOrderStatus(
              queueEntry.status,
              relatedOrder.status ?? "",
            );

          if (
            !nextQueueStatus ||
            nextQueueStatus === queueEntry.status
          ) {
            return queueEntry;
          }

          hasChanges = true;

          if (
            nextQueueStatus === "cancelled" &&
            queueEntry.status === "table-ready" &&
            queueEntry.assignedTableId
          ) {
            tablesToRelease.add(
              queueEntry.assignedTableId,
            );
          }

          return {
            ...queueEntry,
            status: nextQueueStatus,
            assignedTableId:
              nextQueueStatus === "cancelled"
                ? undefined
                : queueEntry.assignedTableId,
          };
        });

        tablesToRelease.forEach((tableId) => {
          safelyReleaseQueueTable(tableId);
        });

        if (hasChanges) {
          const recalculatedQueue =
            recalculateQueue(updatedQueue);

          setQueue(recalculatedQueue);
          saveQueue(recalculatedQueue);
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
    updateTableStatus,
  ]);

  // =======================================================
  // ADD CUSTOMER TO QUEUE
  // =======================================================

  const addToQueue = (input: {
    customerId: string;
    orderId?: string;
    reservationId?: string;
    partySize: number;
    notifyWhenReady?: boolean;
  }): QueueEntry => {
    if (
      !Number.isInteger(input.partySize) ||
      input.partySize <= 0
    ) {
      throw new Error(
        "Party size must be a positive number.",
      );
    }

    const orderValidationError =
      validateQueueOrderReference(
        queue,
        input.orderId,
      );

    if (orderValidationError) {
      console.warn(
        "Smart Cafe: Queue order validation failed:",
        orderValidationError,
      );

      throw new Error(orderValidationError);
    }

    const reservationValidationError =
      validateQueueReservationReference(
        queue,
        input.reservationId,
      );

    if (reservationValidationError) {
      console.warn(
        "Smart Cafe: Queue reservation validation failed:",
        reservationValidationError,
      );

      throw new Error(reservationValidationError);
    }

    const queueId = `Q${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const queueIdValidationError =
      validateQueueEntryId(queue, queueId);

    if (queueIdValidationError) {
      console.error(
        "Smart Cafe: Queue ID validation failed:",
        queueIdValidationError,
      );

      throw new Error(queueIdValidationError);
    }

    const newEntry: QueueEntry = {
      id: queueId,
      queueToken: generateQueueToken(input.orderId),
      customerId: input.customerId,
      orderId: input.orderId,
      reservationId: input.reservationId,
      partySize: input.partySize,
      position: 0,
      estimatedWaitMinutes: 0,
      joinedAt: new Date().toISOString(),
      status: "waiting",
      notifyWhenReady: input.notifyWhenReady ?? true,
    };

    const updatedQueue = recalculateQueue([
      ...queue,
      newEntry,
    ]);

    setQueue(updatedQueue);
    saveQueue(updatedQueue);

    return (
      updatedQueue.find(
        (entry) => entry.id === newEntry.id,
      ) ?? newEntry
    );
  };

  // =======================================================
  // FIND QUEUE ENTRIES
  // =======================================================

  const getQueueEntryById = (
    queueEntryId: string,
  ) => queue.find((entry) => entry.id === queueEntryId);

  const getQueueEntryByOrderId = (
    orderId: string,
  ) => queue.find((entry) => entry.orderId === orderId);

  const getQueueEntryByToken = (
    queueToken: string,
  ) => queue.find(
    (entry) => entry.queueToken === queueToken,
  );

  // =======================================================
  // UPDATE QUEUE STATUS
  // =======================================================

  const updateQueueStatus = (
    queueEntryId: string,
    status: QueueStatus,
  ) => {
    const queueEntry = queue.find(
      (entry) => entry.id === queueEntryId,
    );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

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

    if (
      status === "table-ready" &&
      !queueEntry.assignedTableId
    ) {
      console.warn(
        "A queue customer cannot become table-ready without an assigned table.",
      );

      return;
    }

    if (
      status === "seated" &&
      !queueEntry.assignedTableId
    ) {
      console.warn(
        "A queue customer cannot become seated without an assigned table.",
      );

      return;
    }

    if (
      status === "cancelled" &&
      queueEntry.status === "table-ready" &&
      queueEntry.assignedTableId
    ) {
      safelyReleaseQueueTable(
        queueEntry.assignedTableId,
      );
    }

    const queueWithUpdatedStatus = queue.map(
      (entry) =>
        entry.id === queueEntryId
          ? {
              ...entry,
              status,
              assignedTableId:
                status === "cancelled"
                  ? undefined
                  : entry.assignedTableId,
            }
          : entry,
    );

    const updatedQueue = recalculateQueue(
      queueWithUpdatedStatus,
    );

    setQueue(updatedQueue);
    saveQueue(updatedQueue);
  };

  // =======================================================
  // RESERVATION CONFLICT CHECK
  // =======================================================

  const isTableProtectedByReservation = (
    tableId: string,
  ): boolean => {
    const projectedSlot = createProjectedQueueSlot();

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
    const queueEntry = queue.find(
      (entry) => entry.id === queueEntryId,
    );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    if (queueEntry.status !== "waiting") {
      console.warn(
        "Only waiting customers can be assigned a table.",
      );

      return;
    }

    const selectedTable = tables.find(
      (table) => table.id === tableId,
    );

    if (!selectedTable) {
      console.warn(`Table ${tableId} was not found.`);
      return;
    }

    if (selectedTable.status !== "available") {
      console.warn(
        `Table ${tableId} is not physically available.`,
      );

      return;
    }

    if (selectedTable.orderId) {
      console.warn(
        `Table ${tableId} is already owned by order ${selectedTable.orderId}.`,
      );

      return;
    }

    if (selectedTable.capacity < queueEntry.partySize) {
      console.warn(
        `Table ${tableId} does not have enough capacity.`,
      );

      return;
    }

    if (isTableProtectedByReservation(tableId)) {
      console.warn(
        `Table ${tableId} conflicts with a reservation.`,
      );

      return;
    }

    // Temporary queue hold; no order owns this table yet.
    updateTableStatus(tableId, "reserved");

    const updatedQueue = recalculateQueue(
      queue.map((entry) =>
        entry.id === queueEntryId
          ? {
              ...entry,
              status: "table-ready" as QueueStatus,
              assignedTableId: tableId,
            }
          : entry,
      ),
    );

    setQueue(updatedQueue);
    saveQueue(updatedQueue);
  };

  // =======================================================
  // CHANGE ASSIGNED TABLE
  // =======================================================

  const changeAssignedTable = (
    queueEntryId: string,
    newTableId: string,
  ) => {
    const queueEntry = queue.find(
      (entry) => entry.id === queueEntryId,
    );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    if (queueEntry.status !== "table-ready") {
      console.warn(
        "Only a table-ready queue entry can change its assigned table.",
      );

      return;
    }

    const currentTableId = queueEntry.assignedTableId;

    if (!currentTableId) {
      console.warn(
        "Cannot change table because no current table is assigned.",
      );

      return;
    }

    if (currentTableId === newTableId) {
      console.warn(
        "The selected table is already assigned.",
      );

      return;
    }

    const newTable = tables.find(
      (table) => table.id === newTableId,
    );

    if (!newTable) {
      console.warn(`Table ${newTableId} was not found.`);
      return;
    }

    if (newTable.status !== "available") {
      console.warn(
        `Table ${newTableId} is not physically available.`,
      );

      return;
    }

    if (newTable.orderId) {
      console.warn(
        `Table ${newTableId} is already owned by order ${newTable.orderId}.`,
      );

      return;
    }

    if (newTable.capacity < queueEntry.partySize) {
      console.warn(
        `Table ${newTableId} does not have enough capacity.`,
      );

      return;
    }

    if (isTableProtectedByReservation(newTableId)) {
      console.warn(
        `Table ${newTableId} conflicts with a reservation.`,
      );

      return;
    }

    // Reserve the replacement table first.
    updateTableStatus(newTableId, "reserved");

    // The safety check prevents releasing an order-owned
    // table if ownership changed since the queue assignment.
    safelyReleaseQueueTable(currentTableId);

    const updatedQueue = recalculateQueue(
      queue.map((entry) =>
        entry.id === queueEntryId
          ? {
              ...entry,
              status: "table-ready" as QueueStatus,
              assignedTableId: newTableId,
            }
          : entry,
      ),
    );

    setQueue(updatedQueue);
    saveQueue(updatedQueue);
  };

  // =======================================================
  // MARK CUSTOMER AS SEATED
  // =======================================================

  const markAsSeated = (
    queueEntryId: string,
  ) => {
    const queueEntry = queue.find(
      (entry) => entry.id === queueEntryId,
    );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    if (queueEntry.status !== "table-ready") {
      console.warn(
        "Only table-ready customers can be marked as seated.",
      );

      return;
    }

    if (!queueEntry.assignedTableId) {
      console.warn(
        "Cannot seat customer because no table is assigned.",
      );

      return;
    }

    const tableId = queueEntry.assignedTableId;

    const currentTable = tables.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        `Table ${tableId} no longer exists.`,
      );

      return;
    }

    if (
      currentTable.orderId &&
      currentTable.orderId !== queueEntry.orderId
    ) {
      console.warn(
        `Table ${tableId} is already owned by another order.`,
      );

      return;
    }

    if (queueEntry.orderId) {
      const assigned = setTableOrder(
        tableId,
        queueEntry.orderId,
      );

      if (!assigned) {
        console.warn(
          `Failed to connect table ${tableId} to order ${queueEntry.orderId}.`,
        );

        return;
      }
    } else {
      updateTableStatus(tableId, "occupied");
    }

    if (queueEntry.reservationId) {
      checkInReservation(queueEntry.reservationId);
    }

    const updatedQueue = recalculateQueue(
      queue.map((entry) =>
        entry.id === queueEntryId
          ? {
              ...entry,
              status: "seated" as QueueStatus,
            }
          : entry,
      ),
    );

    setQueue(updatedQueue);
    saveQueue(updatedQueue);
  };

  // =======================================================
  // CANCEL QUEUE ENTRY
  // =======================================================

  const cancelQueueEntry = (
    queueEntryId: string,
  ) => {
    const queueEntry = queue.find(
      (entry) => entry.id === queueEntryId,
    );

    if (!queueEntry) {
      console.warn(
        `Queue entry ${queueEntryId} was not found.`,
      );

      return;
    }

    if (
      queueEntry.status === "cancelled" ||
      queueEntry.status === "completed"
    ) {
      console.warn(
        "This queue entry is already in a terminal state.",
      );

      return;
    }

    // updateQueueStatus owns the cancellation and safe
    // temporary-table release behavior.
    updateQueueStatus(queueEntryId, "cancelled");
  };

  // =======================================================
  // GET ACTIVE WAITING CUSTOMERS
  // =======================================================

  const getWaitingEntries = () =>
    queue.filter(
      (entry) =>
        entry.status === "waiting" ||
        entry.status === "table-ready",
    );

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = useMemo<QueueContextType>(
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
    ],
  );

  return (
    <QueueContext.Provider value={value}>
      {children}
    </QueueContext.Provider>
  );
}

// =========================================================
// USE QUEUE HOOK
// =========================================================

export function useQueue() {
  const context = useContext(QueueContext);

  if (!context) {
    throw new Error(
      "useQueue must be used inside QueueProvider",
    );
  }

  return context;
}