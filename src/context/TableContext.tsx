
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  initialTables,
  getTableByQrToken,
  getTableByNumber,
} from "../data/tables";

import type {
  CafeTable,
  TableStatus,
} from "../types/Table";

// ============================================================
// LOCAL STORAGE KEYS
// ============================================================

const TABLE_SESSION_KEY = "smart-cafe-table-session";
const TABLE_STATUS_KEY = "smart-cafe-table-status";
const ORDERS_STORAGE_KEY = "smart-cafe-orders";

const TERMINAL_ORDER_STATUSES = [
  "completed",
  "cancelled",
] as const;

// ============================================================
// CONTEXT TYPE
// ============================================================

interface TableContextType {
  selectedTable: CafeTable | null;
  tables: CafeTable[];

  setTableFromQrToken: (qrToken: string) => void;
  setTableByNumber: (tableNumber: number) => void;
  clearTable: () => void;

  updateTableStatus: (
    tableId: string,
    status: TableStatus,
  ) => void;

  setTableOrder: (
    tableId: string,
    orderId: string,
    staleOrderId?: string,
  ) => boolean;

  clearTableOrder: (
    tableId: string,
    expectedOrderId?: string,
  ) => boolean;

  cancelTableOrder: (
    tableId: string,
    expectedOrderId: string,
  ) => boolean;

  completeTableOrder: (
    tableId: string,
    expectedOrderId: string,
  ) => boolean;

  releaseTable: (tableId: string) => boolean;

  getTableById: (
    tableId: string,
  ) => CafeTable | undefined;
}

// ============================================================
// CREATE CONTEXT
// ============================================================

const TableContext =
  createContext<TableContextType | undefined>(undefined);

// ============================================================
// ORDER STATUS HELPERS
// ============================================================

function isTerminalOrderStatus(
  status: string | undefined,
): boolean {
  return (
    status === TERMINAL_ORDER_STATUSES[0] ||
    status === TERMINAL_ORDER_STATUSES[1]
  );
}

function isStoredOrderActive(orderId: string): boolean {
  try {
    const storedOrders = localStorage.getItem(
      ORDERS_STORAGE_KEY,
    );

    // Preserve ownership if the order data is unavailable.
    if (!storedOrders) {
      return true;
    }

    const parsedOrders: unknown = JSON.parse(storedOrders);

    if (!Array.isArray(parsedOrders)) {
      return true;
    }

    const order = parsedOrders.find(
      (item: unknown) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        item.id === orderId,
    );

    // A missing order no longer owns a physical table.
    if (!order) {
      return false;
    }

    const status =
      typeof order === "object" &&
      order !== null &&
      "status" in order &&
      typeof order.status === "string"
        ? order.status
        : undefined;

    return !isTerminalOrderStatus(status);
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to inspect stored order:",
      error,
    );

    // Fail safely when ownership cannot be verified.
    return true;
  }
}

// ============================================================
// LOAD AND REPAIR SAVED TABLES
// ============================================================

function loadSavedTables(): CafeTable[] {
  try {
    const savedTables = localStorage.getItem(
      TABLE_STATUS_KEY,
    );

    if (!savedTables) {
      return initialTables.map((table) => ({ ...table }));
    }

    const parsedTables: unknown = JSON.parse(savedTables);

    if (!Array.isArray(parsedTables)) {
      console.warn(
        "Smart Cafe: Saved table data is invalid. Using initial tables.",
      );

      return initialTables.map((table) => ({ ...table }));
    }

    return initialTables.map((initialTable) => {
      const savedTable = parsedTables.find(
        (table: unknown) =>
          typeof table === "object" &&
          table !== null &&
          "id" in table &&
          table.id === initialTable.id,
      );

      if (!savedTable) {
        return { ...initialTable };
      }

      const mergedTable = {
        ...initialTable,
        ...savedTable,
      } as CafeTable;

      const orderId = mergedTable.orderId;

      // No order owns this table.
      if (!orderId) {
        return mergedTable;
      }

      // Preserve the ownership of an active order.
      if (isStoredOrderActive(orderId)) {
        return {
          ...mergedTable,
          status:
            mergedTable.status === "reserved" ||
            mergedTable.status === "cleaning"
              ? mergedTable.status
              : "occupied",
        };
      }

      // Terminal or missing order: require cleaning.
      console.warn(
        "Smart Cafe: Removing stale table order connection:",
        {
          tableId: initialTable.id,
          orderId,
        },
      );

      return {
        ...mergedTable,
        orderId: undefined,
        status:
          mergedTable.status === "reserved"
            ? "reserved"
            : "cleaning",
      };
    });
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to load saved table status:",
      error,
    );

    return initialTables.map((table) => ({ ...table }));
  }
}

// ============================================================
// TABLE PROVIDER
// ============================================================

export function TableProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedTable, setSelectedTable] =
    useState<CafeTable | null>(null);

  const [tables, setTables] =
    useState<CafeTable[]>(() => loadSavedTables());

  // Keep the latest table state available for synchronous
  // ownership checks, without waiting for another render.
  const tablesRef = useRef<CafeTable[]>(tables);

  // All table mutations go through this helper.
  const commitTables = (
    updater: (currentTables: CafeTable[]) => CafeTable[],
  ): CafeTable[] => {
    const nextTables = updater(tablesRef.current);

    tablesRef.current = nextTables;
    setTables(nextTables);

    return nextTables;
  };

  // ==========================================================
  // RESTORE CUSTOMER TABLE SESSION
  // ==========================================================

  useEffect(() => {
    try {
      const savedTable = localStorage.getItem(
        TABLE_SESSION_KEY,
      );

      if (!savedTable) {
        return;
      }

      const parsedTable: unknown = JSON.parse(savedTable);

      if (
        typeof parsedTable !== "object" ||
        parsedTable === null ||
        !("id" in parsedTable) ||
        typeof parsedTable.id !== "string"
      ) {
        localStorage.removeItem(TABLE_SESSION_KEY);
        return;
      }

      const liveTable = tables.find(
        (table) => table.id === parsedTable.id,
      );

      if (!liveTable) {
        localStorage.removeItem(TABLE_SESSION_KEY);
        return;
      }

      setSelectedTable(liveTable);
    } catch (error) {
      console.error(
        "Smart Cafe: Failed to load saved table session:",
        error,
      );

      localStorage.removeItem(TABLE_SESSION_KEY);
    }
  }, [tables]);

  // ==========================================================
  // KEEP SELECTED TABLE SYNCHRONIZED
  // ==========================================================

  useEffect(() => {
    if (!selectedTable) {
      return;
    }

    const liveTable = tables.find(
      (table) => table.id === selectedTable.id,
    );

    if (!liveTable) {
      setSelectedTable(null);
      localStorage.removeItem(TABLE_SESSION_KEY);
      return;
    }

    if (
      JSON.stringify(liveTable) !==
      JSON.stringify(selectedTable)
    ) {
      setSelectedTable(liveTable);

      try {
        localStorage.setItem(
          TABLE_SESSION_KEY,
          JSON.stringify(liveTable),
        );
      } catch (error) {
        console.error(
          "Smart Cafe: Failed to save selected table:",
          error,
        );
      }
    }
  }, [tables, selectedTable]);

  // ==========================================================
  // SAVE TABLE STATES
  // ==========================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        TABLE_STATUS_KEY,
        JSON.stringify(tables),
      );
    } catch (error) {
      console.error(
        "Smart Cafe: Failed to save table status:",
        error,
      );
    }
  }, [tables]);

  // ==========================================================
  // DETECT TABLE FROM QR URL
  // Example: /menu?table=QR-SMART-CAFE-T04
  // ==========================================================

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search,
    );

    const qrToken = params.get("table");

    if (!qrToken) {
      return;
    }

    const table = getTableByQrToken(qrToken);

    if (!table) {
      console.warn(
        `Smart Cafe: No table found for QR token: ${qrToken}`,
      );
      return;
    }

    const liveTable = tables.find(
      (item) => item.id === table.id,
    );

    if (!liveTable) {
      return;
    }

    setSelectedTable(liveTable);

    try {
      localStorage.setItem(
        TABLE_SESSION_KEY,
        JSON.stringify(liveTable),
      );
    } catch (error) {
      console.error(
        "Smart Cafe: Failed to save QR table session:",
        error,
      );
    }
  }, [tables]);

  // ==========================================================
  // SELECT TABLE FROM QR TOKEN
  // ==========================================================

  const setTableFromQrToken = (qrToken: string) => {
    const table = getTableByQrToken(qrToken);

    if (!table) {
      console.warn(
        `Smart Cafe: No table found for QR token: ${qrToken}`,
      );
      return;
    }

    const liveTable = tablesRef.current.find(
      (item) => item.id === table.id,
    );

    if (!liveTable) {
      return;
    }

    setSelectedTable(liveTable);

    try {
      localStorage.setItem(
        TABLE_SESSION_KEY,
        JSON.stringify(liveTable),
      );
    } catch (error) {
      console.error(
        "Smart Cafe: Failed to save table session:",
        error,
      );
    }
  };

  // ==========================================================
  // SELECT TABLE BY NUMBER
  // ==========================================================

  const setTableByNumber = (tableNumber: number) => {
    const table = getTableByNumber(tableNumber);

    if (!table) {
      console.warn(
        `Smart Cafe: No table found for table number: ${tableNumber}`,
      );
      return;
    }

    const liveTable = tablesRef.current.find(
      (item) => item.id === table.id,
    );

    if (!liveTable) {
      return;
    }

    setSelectedTable(liveTable);

    try {
      localStorage.setItem(
        TABLE_SESSION_KEY,
        JSON.stringify(liveTable),
      );
    } catch (error) {
      console.error(
        "Smart Cafe: Failed to save table session:",
        error,
      );
    }
  };

  // ==========================================================
  // CLEAR SELECTED CUSTOMER TABLE
  // Does not release the physical table.
  // ==========================================================

  const clearTable = () => {
    setSelectedTable(null);
    localStorage.removeItem(TABLE_SESSION_KEY);
  };

  // ==========================================================
  // UPDATE PHYSICAL TABLE STATUS
  // ==========================================================

  const updateTableStatus = (
    tableId: string,
    requestedStatus: TableStatus,
  ) => {
    commitTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // An order-owned table cannot be made available
        // through an ordinary status update.
        if (
          table.orderId &&
          requestedStatus === "available"
        ) {
          console.warn(
            "Smart Cafe: Table has an order. Use the explicit release workflow.",
            {
              tableId,
              orderId: table.orderId,
            },
          );

          return {
            ...table,
            status: "occupied",
          };
        }

        return {
          ...table,
          status: requestedStatus,
        };
      }),
    );
  };

  // ==========================================================
  // CONNECT ORDER TO TABLE
  // ==========================================================

  const setTableOrder = (
    tableId: string,
    orderId: string,
    staleOrderId?: string,
  ): boolean => {
    if (!orderId.trim()) {
      return false;
    }

    const currentTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.error(
        "Smart Cafe: Cannot assign order. Table not found:",
        tableId,
      );
      return false;
    }

    // This order already owns the table.
    if (currentTable.orderId === orderId) {
      return true;
    }

    // Never overwrite another order's ownership.
    if (currentTable.orderId) {
      console.error(
        "Smart Cafe: Cannot assign table. Another order owns it.",
        {
          tableId,
          existingOrderId: currentTable.orderId,
          requestedOrderId: orderId,
        },
      );

      return false;
    }

    // A stale order ID is not permission to bypass
    // the physical table's availability status.
    if (currentTable.status !== "available") {
      console.error(
        "Smart Cafe: Cannot assign order. Table is not available.",
        {
          tableId,
          status: currentTable.status,
          orderId: currentTable.orderId,
          staleOrderId,
        },
      );

      return false;
    }

    commitTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // Recheck the latest state before assigning.
        if (
          table.orderId ||
          table.status !== "available"
        ) {
          return table;
        }

        return {
          ...table,
          status: "occupied",
          orderId,
        };
      }),
    );

    // Return success only if the assignment was committed.
    const committedTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    const assigned = committedTable?.orderId === orderId;

    if (assigned) {
      console.log(
        "Smart Cafe: Table assigned successfully.",
        {
          tableId,
          orderId,
          staleOrderIdProvided: Boolean(staleOrderId),
        },
      );
    }

    return assigned;
  };

  // ==========================================================
  // CLEAR ORDER CONNECTION ONLY
  // Used for rollback if order creation fails.
  // ==========================================================

  const clearTableOrder = (
    tableId: string,
    expectedOrderId?: string,
  ): boolean => {
    const currentTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot clear table order. Table not found:",
        tableId,
      );
      return false;
    }

    if (!currentTable.orderId) {
      return true;
    }

    // Do not clear a different order's ownership.
    if (
      expectedOrderId &&
      currentTable.orderId !== expectedOrderId
    ) {
      console.warn(
        "Smart Cafe: Refusing to clear another order's table.",
        {
          tableId,
          expectedOrderId,
          currentOrderId: currentTable.orderId,
        },
      );

      return false;
    }

    commitTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        if (
          expectedOrderId &&
          table.orderId !== expectedOrderId
        ) {
          return table;
        }

        return {
          ...table,
          orderId: undefined,
        };
      }),
    );

    return !tablesRef.current.find(
      (table) => table.id === tableId,
    )?.orderId;
  };

  // ==========================================================
  // TERMINAL ORDER -> CLEANING
  // Shared by cancellation and completion.
  // ==========================================================

  const moveOwnedTableToCleaning = (
    tableId: string,
    expectedOrderId: string,
    operation: "cancelled" | "completed",
  ): boolean => {
    if (!expectedOrderId.trim()) {
      return false;
    }

    const currentTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot move table to cleaning. Table not found.",
        { tableId, expectedOrderId },
      );

      return false;
    }

    // Ownership must match before changing the table.
    if (currentTable.orderId !== expectedOrderId) {
      console.warn(
        "Smart Cafe: Refusing terminal table transition because ownership changed.",
        {
          tableId,
          expectedOrderId,
          currentOrderId: currentTable.orderId,
          operation,
        },
      );

      return false;
    }

    commitTables((currentTables) =>
      currentTables.map((table) => {
        if (
          table.id !== tableId ||
          table.orderId !== expectedOrderId
        ) {
          return table;
        }

        return {
          ...table,
          orderId: undefined,
          status: "cleaning",
        };
      }),
    );

    const updatedTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    const transitioned =
      updatedTable !== undefined &&
      updatedTable.orderId === undefined &&
      updatedTable.status === "cleaning";

    if (transitioned) {
      console.log(
        `Smart Cafe: ${operation} order moved its table to cleaning.`,
        {
          tableId,
          orderId: expectedOrderId,
        },
      );
    }

    return transitioned;
  };

  // ==========================================================
  // CANCEL DINE-IN ORDER
  // ==========================================================

  const cancelTableOrder = (
    tableId: string,
    expectedOrderId: string,
  ): boolean => {
    return moveOwnedTableToCleaning(
      tableId,
      expectedOrderId,
      "cancelled",
    );
  };

  // ==========================================================
  // COMPLETE DINE-IN ORDER
  // ==========================================================

  const completeTableOrder = (
    tableId: string,
    expectedOrderId: string,
  ): boolean => {
    return moveOwnedTableToCleaning(
      tableId,
      expectedOrderId,
      "completed",
    );
  };

  // ==========================================================
  // EXPLICIT ADMIN/STAFF RELEASE
  // Only after cleaning is complete.
  // ==========================================================

  const releaseTable = (
    tableId: string,
  ): boolean => {
    const currentTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot release table. Table not found:",
        tableId,
      );

      return false;
    }

    if (currentTable.orderId) {
      console.warn(
        "Smart Cafe: Cannot release a table that still has an order.",
        {
          tableId,
          orderId: currentTable.orderId,
        },
      );

      return false;
    }

    if (currentTable.status !== "cleaning") {
      console.warn(
        "Smart Cafe: Only a table in cleaning can be released.",
        {
          tableId,
          status: currentTable.status,
        },
      );

      return false;
    }

    commitTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // Recheck before changing the latest state.
        if (
          table.orderId ||
          table.status !== "cleaning"
        ) {
          return table;
        }

        return {
          ...table,
          orderId: undefined,
          status: "available",
        };
      }),
    );

    const releasedTable = tablesRef.current.find(
      (table) => table.id === tableId,
    );

    return (
      releasedTable !== undefined &&
      !releasedTable.orderId &&
      releasedTable.status === "available"
    );
  };

  // ==========================================================
  // GET TABLE BY ID
  // ==========================================================

  const getTableById = (
    tableId: string,
  ): CafeTable | undefined => {
    return tablesRef.current.find(
      (table) => table.id === tableId,
    );
  };

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = useMemo<TableContextType>(
    () => ({
      selectedTable,
      tables,

      setTableFromQrToken,
      setTableByNumber,
      clearTable,

      updateTableStatus,

      setTableOrder,
      clearTableOrder,
      cancelTableOrder,
      completeTableOrder,
      releaseTable,

      getTableById,
    }),
    [selectedTable, tables],
  );

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
}

// ============================================================
// USE TABLE HOOK
// ============================================================

export function useTable() {
  const context = useContext(TableContext);

  if (!context) {
    throw new Error(
      "useTable must be used inside TableProvider",
    );
  }

  return context;
}
