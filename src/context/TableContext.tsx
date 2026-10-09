
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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

// Orders that no longer own a physical table.
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

  // Cancellation clears only the order connection.
  // It does not automatically make the physical table available.
  cancelTableOrder: (
    tableId: string,
    expectedOrderId: string,
  ) => boolean;

  completeTableOrder: (
    tableId: string,
    expectedOrderId: string,
  ) => boolean;

  // Explicit admin/staff release.
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
// CHECK WHETHER AN ORDER IS TERMINAL
// ============================================================

function isTerminalOrderStatus(
  status: string | undefined,
): boolean {
  return (
    status === TERMINAL_ORDER_STATUSES[0] ||
    status === TERMINAL_ORDER_STATUSES[1]
  );
}

// ============================================================
// CHECK WHETHER A STORED ORDER IS ACTIVE
// ============================================================

function isStoredOrderActive(orderId: string): boolean {
  try {
    const storedOrders = localStorage.getItem(
      ORDERS_STORAGE_KEY,
    );

    if (!storedOrders) {
      // If no order data can be found, do not assume
      // that an existing table connection is safe to remove.
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

    // Safety rule: preserve the connection when
    // the order cannot be verified.
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
      return initialTables;
    }

    const parsedTables: unknown = JSON.parse(savedTables);

    if (!Array.isArray(parsedTables)) {
      console.warn(
        "Smart Cafe: Saved table data is invalid. Using initial tables.",
      );

      return initialTables;
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

      // No order connection: keep the saved table status.
      if (!orderId) {
        return mergedTable;
      }

      // Active order: preserve ownership and ensure
      // the table is occupied unless reserved or cleaning.
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

      // Stale order: remove its ownership.
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
          mergedTable.status === "reserved" ||
          mergedTable.status === "cleaning"
            ? mergedTable.status
            : "available",
      };
    });
  } catch (error) {
    console.error(
      "Smart Cafe: Failed to load saved table status:",
      error,
    );

    return initialTables;
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

  // ----------------------------------------------------------
  // RESTORE CUSTOMER TABLE SESSION
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // KEEP SELECTED TABLE SYNCHRONIZED
  // ----------------------------------------------------------

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

      localStorage.setItem(
        TABLE_SESSION_KEY,
        JSON.stringify(liveTable),
      );
    }
  }, [tables, selectedTable]);

  // ----------------------------------------------------------
  // SAVE TABLE STATES
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // DETECT TABLE FROM QR URL
  // Example: /menu?table=QR-SMART-CAFE-T04
  // ----------------------------------------------------------

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

    localStorage.setItem(
      TABLE_SESSION_KEY,
      JSON.stringify(liveTable),
    );
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

    const liveTable = tables.find(
      (item) => item.id === table.id,
    );

    if (!liveTable) {
      return;
    }

    setSelectedTable(liveTable);

    localStorage.setItem(
      TABLE_SESSION_KEY,
      JSON.stringify(liveTable),
    );
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

    const liveTable = tables.find(
      (item) => item.id === table.id,
    );

    if (!liveTable) {
      return;
    }

    setSelectedTable(liveTable);

    localStorage.setItem(
      TABLE_SESSION_KEY,
      JSON.stringify(liveTable),
    );
  };

  // ==========================================================
  // CLEAR SELECTED CUSTOMER TABLE
  // This does not release the physical table.
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
    setTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // Do not make an order-owned table available
        // through an ordinary status update.
        if (
          table.orderId &&
          requestedStatus === "available"
        ) {
          console.warn(
            "Smart Cafe: Table has an order. Use releaseTable() for an explicit release.",
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
    const currentTable = tables.find(
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

    // Another order owns the table.
    if (
      currentTable.orderId &&
      currentTable.orderId !== staleOrderId
    ) {
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

    // Do not assign a table that is reserved,
    // occupied without an eligible stale connection,
    // or undergoing cleaning.
    if (
      currentTable.status !== "available" &&
      currentTable.orderId !== staleOrderId
    ) {
      console.error(
        "Smart Cafe: Cannot assign table. Table is not available.",
        {
          tableId,
          status: currentTable.status,
          orderId: currentTable.orderId,
        },
      );
      return false;
    }

    setTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // Recheck ownership against the latest state.
        if (
          table.orderId &&
          table.orderId !== orderId &&
          table.orderId !== staleOrderId
        ) {
          console.error(
            "Smart Cafe: Final table assignment check failed.",
            {
              tableId,
              existingOrderId: table.orderId,
              requestedOrderId: orderId,
            },
          );

          return table;
        }

        return {
          ...table,
          status: "occupied",
          orderId,
        };
      }),
    );

    console.log(
      "Smart Cafe: Table assigned successfully.",
      {
        tableId,
        orderId,
        replacedStaleOrderId: staleOrderId,
      },
    );

    return true;
  };

  // ==========================================================
  // CLEAR ORDER CONNECTION ONLY
  // The physical table status remains unchanged.
  // ==========================================================

  const clearTableOrder = (
    tableId: string,
    expectedOrderId?: string,
  ): boolean => {
    const currentTable = tables.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot clear table order. Table not found:",
        tableId,
      );
      return false;
    }

    // Nothing to clear; allow repeated cleanup calls.
    if (!currentTable.orderId) {
      return true;
    }

    // Ownership protection: do not clear a different order.
    if (
      expectedOrderId &&
      currentTable.orderId !== expectedOrderId
    ) {
      console.warn(
        "Smart Cafe: Table belongs to another order. Refusing to clear.",
        {
          tableId,
          expectedOrderId,
          currentOrderId: currentTable.orderId,
        },
      );
      return false;
    }

    setTables((currentTables) =>
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

    console.log(
      "Smart Cafe: Table order connection cleared.",
      {
        tableId,
        expectedOrderId,
      },
    );

    return true;
  };

  // ==========================================================
  // CANCEL TABLE ORDER CONNECTION
  // Does not change physical table status.
  // ==========================================================

  const cancelTableOrder = (
    tableId: string,
    expectedOrderId: string,
  ): boolean => {
    if (!expectedOrderId) {
      console.warn(
        "Smart Cafe: Cannot cancel a table connection without an order ID.",
        { tableId },
      );
      return false;
    }

    return clearTableOrder(
      tableId,
      expectedOrderId,
    );
  };

  // ==========================================================
  // COMPLETE DINE-IN ORDER AND RELEASE ITS TABLE
  // Only the order that owns the table can release it.
  // ==========================================================

  const completeTableOrder = (
    tableId: string,
    expectedOrderId: string,
  ): boolean => {
    const currentTable = tables.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot complete table order. Table not found:",
        tableId,
      );
      return false;
    }

    if (!currentTable.orderId) {
      console.warn(
        "Smart Cafe: Table has no order ownership during completion.",
        {
          tableId,
          expectedOrderId,
        },
      );
      return false;
    }

    if (currentTable.orderId !== expectedOrderId) {
      console.warn(
        "Smart Cafe: Refusing to release table because ownership changed.",
        {
          tableId,
          expectedOrderId,
          currentOrderId: currentTable.orderId,
        },
      );
      return false;
    }

    setTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        // Final ownership protection.
        if (table.orderId !== expectedOrderId) {
          return table;
        }

        return {
          ...table,
          orderId: undefined,
          status: "available",
        };
      }),
    );

    console.log(
      "Smart Cafe: Completed dine-in order released its table.",
      {
        tableId,
        orderId: expectedOrderId,
      },
    );

    return true;
  };

  // ==========================================================
  // EXPLICIT ADMIN/STAFF RELEASE
  // Clears ownership and makes the table available.
  // ==========================================================

  const releaseTable = (
    tableId: string,
  ): boolean => {
    const currentTable = tables.find(
      (table) => table.id === tableId,
    );

    if (!currentTable) {
      console.warn(
        "Smart Cafe: Cannot release table. Table not found:",
        tableId,
      );
      return false;
    }

    setTables((currentTables) =>
      currentTables.map((table) => {
        if (table.id !== tableId) {
          return table;
        }

        return {
          ...table,
          orderId: undefined,
          status: "available",
        };
      }),
    );

    console.log(
      "Smart Cafe: Table explicitly released:",
      {
        tableId,
        previousOrderId: currentTable.orderId,
      },
    );

    return true;
  };

  // ==========================================================
  // GET TABLE BY ID
  // ==========================================================

  const getTableById = (
    tableId: string,
  ): CafeTable | undefined => {
    return tables.find(
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