
// =========================================================
// SMART CAFE - ADMIN WAITING QUEUE
// PHASE 13.5.5
// =========================================================
//
// Admin features:
// - Monitor the waiting queue and queue history
// - View queue token, order ID, party size and wait time
// - Assign or change available tables
// - Mark customers as seated
// - Cancel queue entries
//
// =========================================================

import { useMemo, useState } from "react";

import {
  CheckCircle,
  Hash,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";

import { useQueue } from "../../context/QueueContext";
import { useTable } from "../../context/TableContext";

// =========================================================
// FILTER TYPE
// =========================================================

type QueueFilter =
  | "active"
  | "waiting"
  | "table-ready"
  | "history";

// =========================================================
// COMPONENT
// =========================================================

export default function AdminQueuePage() {
  const {
    queue,
    assignTable,
    changeAssignedTable,
    markAsSeated,
    cancelQueueEntry,
  } = useQueue();

  const { tables } = useTable();

  const [filter, setFilter] =
    useState<QueueFilter>("active");

  // =======================================================
  // AVAILABLE TABLES
  // =======================================================

  const availableTables = useMemo(
    () =>
      tables.filter(
        (table) => table.status === "available",
      ),
    [tables],
  );

  // =======================================================
  // SUMMARY COUNTS
  // =======================================================

  const waitingCount = queue.filter(
    (entry) => entry.status === "waiting",
  ).length;

  const tableReadyCount = queue.filter(
    (entry) => entry.status === "table-ready",
  ).length;

  const seatedCount = queue.filter(
    (entry) => entry.status === "seated",
  ).length;

  const cancelledCount = queue.filter(
    (entry) => entry.status === "cancelled",
  ).length;

  // =======================================================
  // FILTER QUEUE
  // =======================================================

  const filteredQueue = useMemo(() => {
    let result = [...queue];

    if (filter === "active") {
      result = result.filter(
        (entry) =>
          entry.status === "waiting" ||
          entry.status === "table-ready",
      );
    } else if (filter === "waiting") {
      result = result.filter(
        (entry) => entry.status === "waiting",
      );
    } else if (filter === "table-ready") {
      result = result.filter(
        (entry) => entry.status === "table-ready",
      );
    } else if (filter === "history") {
      result = result.filter(
        (entry) =>
          entry.status === "seated" ||
          entry.status === "cancelled" ||
          entry.status === "completed",
      );
    }

    return result.sort((a, b) => {
      if (filter === "history") {
        return (
          new Date(b.joinedAt).getTime() -
          new Date(a.joinedAt).getTime()
        );
      }

      return a.position - b.position;
    });
  }, [queue, filter]);

  // =======================================================
  // ASSIGN TABLE
  // =======================================================

  const handleAssignTable = (
    queueEntryId: string,
    tableId: string,
  ) => {
    assignTable(queueEntryId, tableId);
  };

  // =======================================================
  // CHANGE TABLE
  // =======================================================

  const handleChangeTable = (
    queueEntryId: string,
    tableId: string,
  ) => {
    changeAssignedTable(queueEntryId, tableId);
  };

  // =======================================================
  // CANCEL QUEUE ENTRY
  // =======================================================

  const handleCancel = (
    queueEntryId: string,
    queueToken: string,
  ) => {
    const confirmed = window.confirm(
      `Cancel queue entry ${queueToken}?`,
    );

    if (confirmed) {
      cancelQueueEntry(queueEntryId);
    }
  };

  // =======================================================
  // STATUS LABEL
  // =======================================================

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "waiting":
        return "Waiting";
      case "table-ready":
        return "Table Ready";
      case "seated":
        return "Seated";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  // =======================================================
  // STATUS CSS CLASS
  // =======================================================

  const getStatusClass = (status: string) => {
    switch (status) {
      case "waiting":
        return "admin-queue-status waiting";
      case "table-ready":
        return "admin-queue-status ready";
      case "seated":
        return "admin-queue-status seated";
      case "cancelled":
        return "admin-queue-status cancelled";
      case "completed":
        return "admin-queue-status completed";
      default:
        return "admin-queue-status";
    }
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="admin-queue-page">
      {/* HEADER */}

      <header className="admin-queue-header">
        <div>
          <p className="admin-queue-eyebrow">
            ADMINISTRATION
          </p>

          <h1>Waiting Queue</h1>

          <p>
            Monitor and manage customers waiting for
            restaurant tables.
          </p>
        </div>
      </header>

      {/* SUMMARY */}

      <div className="admin-queue-summary">
        <div className="admin-queue-summary-card">
          <div className="admin-queue-summary-icon">
            <Users size={21} />
          </div>

          <div>
            <strong>{waitingCount}</strong>
            <span>Waiting</span>
          </div>
        </div>

        <div className="admin-queue-summary-card">
          <div className="admin-queue-summary-icon">
            <CheckCircle size={21} />
          </div>

          <div>
            <strong>{tableReadyCount}</strong>
            <span>Table Ready</span>
          </div>
        </div>

        <div className="admin-queue-summary-card">
          <div className="admin-queue-summary-icon">
            <Users size={21} />
          </div>

          <div>
            <strong>{seatedCount}</strong>
            <span>Seated</span>
          </div>
        </div>

        <div className="admin-queue-summary-card">
          <div className="admin-queue-summary-icon">
            <XCircle size={21} />
          </div>

          <div>
            <strong>{cancelledCount}</strong>
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* FILTERS */}

      <div className="admin-queue-filters">
        <button
          type="button"
          className={filter === "active" ? "active" : ""}
          onClick={() => setFilter("active")}
        >
          Active Queue
        </button>

        <button
          type="button"
          className={filter === "waiting" ? "active" : ""}
          onClick={() => setFilter("waiting")}
        >
          Waiting
        </button>

        <button
          type="button"
          className={
            filter === "table-ready" ? "active" : ""
          }
          onClick={() => setFilter("table-ready")}
        >
          Table Ready
        </button>

        <button
          type="button"
          className={filter === "history" ? "active" : ""}
          onClick={() => setFilter("history")}
        >
          History
        </button>
      </div>

      {/* QUEUE CONTENT */}

      {filteredQueue.length === 0 ? (
        <div className="admin-queue-empty">
          <Ticket size={42} />

          <h2>No queue entries</h2>

          <p>
            There are no customers in this queue section.
          </p>
        </div>
      ) : (
        <div className="admin-queue-list">
          {filteredQueue.map((entry) => {
            const assignedTable = entry.assignedTableId
              ? tables.find(
                  (table) =>
                    table.id === entry.assignedTableId,
                )
              : undefined;

            const canManage =
              entry.status === "waiting" ||
              entry.status === "table-ready";

            const suitableTables = availableTables.filter(
              (table) =>
                table.capacity >= entry.partySize &&
                table.id !== entry.assignedTableId,
            );

            return (
              <article
                key={entry.id}
                className="admin-queue-card"
              >
                {/* CARD HEADER */}

                <div className="admin-queue-card-header">
                  <div>
                    <span className="admin-queue-position">
                      Queue Position #{entry.position}
                    </span>

                    <h2>{entry.queueToken}</h2>
                  </div>

                  <span
                    className={getStatusClass(entry.status)}
                  >
                    {getStatusLabel(entry.status)}
                  </span>
                </div>

                {/* IDENTIFICATION */}

                <div className="admin-queue-identification">
                  <div>
                    <Ticket size={17} />
                    <span>Queue Token</span>
                    <strong>{entry.queueToken}</strong>
                  </div>

                  <div>
                    <Hash size={17} />
                    <span>Order ID</span>
                    <strong>{entry.orderId || "—"}</strong>
                  </div>
                </div>

                {/* QUEUE INFORMATION */}

                <div className="admin-queue-info-grid">
                  <div>
                    <span>Party Size</span>
                    <strong>{entry.partySize}</strong>
                  </div>

                  <div>
                    <span>Position</span>
                    <strong>#{entry.position}</strong>
                  </div>

                  <div>
                    <span>Estimated Wait</span>
                    <strong>
                      {entry.estimatedWaitMinutes} min
                    </strong>
                  </div>

                  <div>
                    <span>Joined</span>
                    <strong>
                      {new Date(
                        entry.joinedAt,
                      ).toLocaleTimeString()}
                    </strong>
                  </div>

                  <div>
                    <span>Assigned Table</span>
                    <strong>
                      {assignedTable
                        ? `Table ${assignedTable.number}`
                        : "Not assigned"}
                    </strong>
                  </div>

                  <div>
                    <span>Notification</span>
                    <strong>
                      {entry.notifyWhenReady
                        ? "Enabled"
                        : "Disabled"}
                    </strong>
                  </div>
                </div>

                {/* ACTIONS */}

                {canManage && (
                  <div className="admin-queue-actions">
                    {/* ASSIGN TABLE */}

                    {entry.status === "waiting" && (
                      <select
                        key={`${entry.id}-${entry.status}`}
                        defaultValue=""
                        aria-label={`Assign table to ${entry.queueToken}`}
                        onChange={(event) => {
                          const tableId = event.target.value;

                          if (!tableId) {
                            return;
                          }

                          handleAssignTable(
                            entry.id,
                            tableId,
                          );

                          event.target.value = "";
                        }}
                      >
                        <option value="">
                          Assign Table
                        </option>

                        {suitableTables.map((table) => (
                          <option
                            key={table.id}
                            value={table.id}
                          >
                            Table {table.number} —{" "}
                            {table.capacity} seats
                          </option>
                        ))}
                      </select>
                    )}

                    {/* TABLE-READY ACTIONS */}

                    {entry.status === "table-ready" && (
                      <>
                        <select
                          key={`${entry.id}-${entry.assignedTableId}`}
                          defaultValue=""
                          aria-label={`Change table for ${entry.queueToken}`}
                          onChange={(event) => {
                            const tableId = event.target.value;

                            if (!tableId) {
                              return;
                            }

                            handleChangeTable(
                              entry.id,
                              tableId,
                            );

                            event.target.value = "";
                          }}
                        >
                          <option value="">
                            Change Table
                          </option>

                          {suitableTables.map((table) => (
                            <option
                              key={table.id}
                              value={table.id}
                            >
                              Table {table.number} —{" "}
                              {table.capacity} seats
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="admin-queue-seat-button"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Mark ${entry.queueToken} as seated at ${
                                assignedTable
                                  ? `Table ${assignedTable.number}`
                                  : "the assigned table"
                              }?`,
                            );

                            if (confirmed) {
                              markAsSeated(entry.id);
                            }
                          }}
                        >
                          <CheckCircle size={16} />
                          Mark Seated
                        </button>
                      </>
                    )}

                    {/* CANCEL */}

                    <button
                      type="button"
                      className="admin-queue-cancel-button"
                      onClick={() =>
                        handleCancel(
                          entry.id,
                          entry.queueToken,
                        )
                      }
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

