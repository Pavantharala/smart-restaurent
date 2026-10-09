// =========================================================
// SMART CAFE - TABLE DATA
// =========================================================
//
// Development table configuration.
//
// Later these tables will come from the backend/database.
// =========================================================

import type { CafeTable } from "../types/Table";

// =========================================================
// INITIAL TABLES
// =========================================================

export const initialTables: CafeTable[] = [
  {
    id: "T-01",
    number: 1,
    capacity: 2,
    status: "available",
    qrToken: "QR-SMART-CAFE-T01",
  },

  {
    id: "T-02",
    number: 2,
    capacity: 2,
    status: "available",
    qrToken: "QR-SMART-CAFE-T02",
  },

  {
    id: "T-03",
    number: 3,
    capacity: 4,
    status: "available",
    qrToken: "QR-SMART-CAFE-T03",
  },

  {
    id: "T-04",
    number: 4,
    capacity: 4,
    status: "available",
    qrToken: "QR-SMART-CAFE-T04",
  },

  {
    id: "T-05",
    number: 5,
    capacity: 6,
    status: "available",
    qrToken: "QR-SMART-CAFE-T05",
  },

  {
    id: "T-06",
    number: 6,
    capacity: 4,
    status: "available",
    qrToken: "QR-SMART-CAFE-T06",
  },

  {
    id: "T-07",
    number: 7,
    capacity: 2,
    status: "available",
    qrToken: "QR-SMART-CAFE-T07",
  },

  {
    id: "T-08",
    number: 8,
    capacity: 6,
    status: "available",
    qrToken: "QR-SMART-CAFE-T08",
  },
];

// =========================================================
// FIND TABLE BY ID
// =========================================================
//
// Example:
//
// getTableById("T-04")
//
// returns Table 4.
// =========================================================

export function getTableById(
  tableId: string,
): CafeTable | undefined {
  return initialTables.find(
    (table) =>
      table.id === tableId,
  );
}

// =========================================================
// FIND TABLE BY QR TOKEN
// =========================================================
//
// Example:
//
// ?table=QR-SMART-CAFE-T04
//
// returns Table 4.
// =========================================================

export function getTableByQrToken(
  qrToken: string,
): CafeTable | undefined {
  return initialTables.find(
    (table) =>
      table.qrToken === qrToken,
  );
}

// =========================================================
// FIND TABLE BY NUMBER
// =========================================================
//
// Example:
//
// getTableByNumber(4)
//
// returns Table 4.
// =========================================================

export function getTableByNumber(
  tableNumber: number,
): CafeTable | undefined {
  return initialTables.find(
    (table) =>
      table.number === tableNumber,
  );
}