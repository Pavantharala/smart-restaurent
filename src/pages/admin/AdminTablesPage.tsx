import {
  CheckCircle,
  Clock,
  Coffee,
  Wrench,
} from "lucide-react";

import { useTable } from "../../context/TableContext";
import type { TableStatus } from "../../types/Table";

export default function AdminTablesPage() {
  // =========================================================
  // GET TABLE DATA FROM TABLE CONTEXT
  // =========================================================

  const {
    tables,
    updateTableStatus,
    releaseTable,
  } = useTable();

  // =========================================================
  // COUNT TABLES BY STATUS
  // =========================================================

  const availableCount = tables.filter(
    (table) =>
      table.status === "available",
  ).length;

  const occupiedCount = tables.filter(
    (table) =>
      table.status === "occupied",
  ).length;

  const reservedCount = tables.filter(
    (table) =>
      table.status === "reserved",
  ).length;

  const cleaningCount = tables.filter(
    (table) =>
      table.status === "cleaning",
  ).length;

  // =========================================================
  // STATUS LABELS
  // =========================================================

  const statusLabel: Record<
    TableStatus,
    string
  > = {
    available: "Available",
    occupied: "Occupied",
    reserved: "Reserved",
    cleaning: "Cleaning",
  };

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = (
    status: TableStatus,
  ) => {
    switch (status) {
      case "available":
        return (
          <CheckCircle size={20} />
        );

      case "occupied":
        return (
          <Coffee size={20} />
        );

      case "reserved":
        return (
          <Clock size={20} />
        );

      case "cleaning":
        return (
          <Wrench size={20} />
        );

      default:
        return null;
    }
  };

  // =========================================================
  // ADMIN STATUS CHANGE
  // =========================================================
  //
  // IMPORTANT:
  //
  // Normal updateTableStatus() protects active orders.
  //
  // But Admin choosing AVAILABLE is an explicit request
  // to release the table.
  //
  // Therefore:
  //
  // available + orderId
  //        ↓
  // confirmation
  //        ↓
  // releaseTable()
  //
  // available + no orderId
  //        ↓
  // updateTableStatus()
  //
  // =========================================================

  const handleStatusChange = (
    tableId: string,
    requestedStatus: TableStatus,
  ) => {
    const table =
      tables.find(
        (item) =>
          item.id === tableId,
      );

    if (!table) {
      console.error(
        "Smart Cafe: Table not found:",
        tableId,
      );

      return;
    }

    // -------------------------------------------------------
    // No actual change
    // -------------------------------------------------------

    if (
      table.status ===
      requestedStatus
    ) {
      return;
    }

    // -------------------------------------------------------
    // ADMIN RELEASE
    // -------------------------------------------------------
    //
    // If a table has an order connection and Admin wants
    // Available, this is an explicit release.
    //
    // -------------------------------------------------------

    if (
      requestedStatus ===
        "available" &&
      table.orderId
    ) {
      const confirmed =
        window.confirm(
          `Table ${table.number} is connected to order ${table.orderId}.\n\n` +
            `Making this table Available will remove that table-order connection.\n\n` +
            `Continue?`,
        );

      if (!confirmed) {
        return;
      }

      const released =
        releaseTable(
          table.id,
        );

      if (!released) {
        window.alert(
          `Unable to release Table ${table.number}.`,
        );
      }

      return;
    }

    // -------------------------------------------------------
    // NORMAL STATUS CHANGE
    // -------------------------------------------------------

    updateTableStatus(
      table.id,
      requestedStatus,
    );
  };

  return (
    <div className="admin-page">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="admin-page-header">
        <div>
          <h1>
            Table Management
          </h1>

          <p>
            Monitor and manage all
            restaurant tables from one
            place.
          </p>
        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>
            Available
          </span>

          <strong>
            {availableCount}
          </strong>
        </div>

        <div className="admin-summary-card">
          <span>
            Occupied
          </span>

          <strong>
            {occupiedCount}
          </strong>
        </div>

        <div className="admin-summary-card">
          <span>
            Reserved
          </span>

          <strong>
            {reservedCount}
          </strong>
        </div>

        <div className="admin-summary-card">
          <span>
            Cleaning
          </span>

          <strong>
            {cleaningCount}
          </strong>
        </div>
      </div>

      {/* =====================================================
          TABLE GRID
          ===================================================== */}

      <section className="admin-table-section">
        <div className="admin-section-header">
          <div>
            <h2>
              All Tables
            </h2>

            <p>
              {tables.length} tables
              configured in the
              restaurant.
            </p>
          </div>
        </div>

        <div className="admin-table-grid">
          {tables.map(
            (table) => (
              <article
                key={table.id}
                className={`admin-table-card status-${table.status}`}
              >
                {/* =============================================
                    TABLE HEADER
                    ============================================= */}

                <div className="admin-table-card-header">
                  <div>
                    <span className="admin-table-number">
                      Table{" "}
                      {table.number}
                    </span>

                    <span className="admin-table-id">
                      {table.id}
                    </span>
                  </div>

                  <div className="admin-table-status-icon">
                    {getStatusIcon(
                      table.status,
                    )}
                  </div>
                </div>

                {/* =============================================
                    TABLE INFORMATION
                    ============================================= */}

                <div className="admin-table-info">
                  <div>
                    <span>
                      Capacity
                    </span>

                    <strong>
                      {
                        table.capacity
                      }{" "}
                      people
                    </strong>
                  </div>

                  <div>
                    <span>
                      Status
                    </span>

                    <strong>
                      {
                        statusLabel[
                          table.status
                        ]
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      QR Token
                    </span>

                    <strong>
                      {
                        table.qrToken
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Order
                    </span>

                    <strong>
                      {table.orderId ??
                        "No active order"}
                    </strong>
                  </div>
                </div>

                {/* =============================================
                    STATUS CONTROL
                    ============================================= */}

                <div className="admin-table-actions">
                  <label
                    htmlFor={`status-${table.id}`}
                  >
                    Change Status
                  </label>

                  <select
                    id={`status-${table.id}`}
                    value={
                      table.status
                    }
                    onChange={(
                      event,
                    ) =>
                      handleStatusChange(
                        table.id,
                        event.target
                          .value as TableStatus,
                      )
                    }
                  >
                    <option value="available">
                      Available
                    </option>

                    <option value="occupied">
                      Occupied
                    </option>

                    <option value="reserved">
                      Reserved
                    </option>

                    <option value="cleaning">
                      Cleaning
                    </option>
                  </select>
                </div>
              </article>
            ),
          )}
        </div>
      </section>
    </div>
  );
}