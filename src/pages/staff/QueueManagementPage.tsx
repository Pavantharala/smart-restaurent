// =========================================================
// SMART CAFE - STAFF WAITING QUEUE
// =========================================================
//
// PHASE 13.5.4
// STAFF QUEUE MANAGEMENT
//
// Staff can:
// - Monitor active waiting customers
// - See queue position
// - See queue token
// - See party size
// - See estimated waiting time
// - Assign available tables
// - Change an already assigned table
// - Mark customers as seated
// - Cancel queue entries
//
// STAFF FLOW:
//
// WAITING
//    ├── Assign Table
//    └── Cancel
//
// TABLE READY
//    ├── Change Table
//    ├── Mark Seated
//    └── Cancel
//
// SEATED
//    └── No active actions
//
// =========================================================

import { useMemo } from "react";

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
// COMPONENT
// =========================================================

export default function QueueManagementPage() {
  const {
    queue,
    assignTable,
    changeAssignedTable,
    markAsSeated,
    cancelQueueEntry,
  } = useQueue();

  const { tables } = useTable();

  // =======================================================
  // ACTIVE QUEUE
  // =======================================================
  //
  // Staff mainly works with:
  //
  // waiting
  // table-ready
  //
  // =======================================================

  const activeQueue = useMemo(() => {
    return queue
      .filter(
        (entry) =>
          entry.status === "waiting" ||
          entry.status === "table-ready",
      )
      .sort(
        (a, b) =>
          a.position - b.position,
      );
  }, [queue]);

  // =======================================================
  // AVAILABLE TABLES
  // =======================================================

  const availableTables = useMemo(() => {
    return tables.filter(
      (table) =>
        table.status === "available",
    );
  }, [tables]);

  // =======================================================
  // SUMMARY COUNTS
  // =======================================================

  const waitingCount = queue.filter(
    (entry) =>
      entry.status === "waiting",
  ).length;

  const tableReadyCount = queue.filter(
    (entry) =>
      entry.status === "table-ready",
  ).length;

  // =======================================================
  // ASSIGN TABLE
  // =======================================================

  const handleAssignTable = (
    queueEntryId: string,
    tableId: string,
  ) => {
    assignTable(
      queueEntryId,
      tableId,
    );
  };

  // =======================================================
  // CHANGE TABLE
  // =======================================================
  //
  // Example:
  //
  // Table 2 → Table 4
  //
  // QueueContext handles:
  //
  // Table 2 → available
  // Table 4 → reserved
  //
  // =======================================================

  const handleChangeTable = (
    queueEntryId: string,
    tableId: string,
  ) => {
    changeAssignedTable(
      queueEntryId,
      tableId,
    );
  };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <section className="staff-queue-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="staff-queue-header">

        <div>

          <p className="staff-queue-eyebrow">
            STAFF OPERATIONS
          </p>

          <h1>
            Waiting Queue
          </h1>

          <p>
            Manage customers waiting for
            restaurant tables.
          </p>

        </div>

      </header>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="staff-queue-summary">

        <div className="staff-queue-summary-card">

          <div className="staff-queue-summary-icon">
            <Users size={21} />
          </div>

          <div>

            <strong>
              {waitingCount}
            </strong>

            <span>
              Waiting
            </span>

          </div>

        </div>

        <div className="staff-queue-summary-card">

          <div className="staff-queue-summary-icon">
            <CheckCircle size={21} />
          </div>

          <div>

            <strong>
              {tableReadyCount}
            </strong>

            <span>
              Table Ready
            </span>

          </div>

        </div>

      </div>

      {/* ==================================================
          QUEUE CONTENT
      ================================================== */}

      {activeQueue.length === 0 ? (

        <div className="staff-queue-empty">

          <Ticket size={42} />

          <h2>
            No active queue
          </h2>

          <p>
            There are currently no customers
            waiting for a table.
          </p>

        </div>

      ) : (

        <div className="staff-queue-list">

          {activeQueue.map(
            (entry) => {

              const assignedTable =
                entry.assignedTableId
                  ? tables.find(
                      (table) =>
                        table.id ===
                        entry.assignedTableId,
                    )
                  : undefined;

              return (
                <article
                  key={entry.id}
                  className="staff-queue-card"
                >

                  {/* ========================================
                      CARD HEADER
                  ======================================== */}

                  <div className="staff-queue-card-header">

                    <div>

                      <span className="staff-queue-position">
                        Queue Position #
                        {entry.position}
                      </span>

                      <h2>
                        {entry.queueToken}
                      </h2>

                    </div>

                    <span
                      className={
                        entry.status ===
                        "waiting"
                          ? "staff-queue-status waiting"
                          : "staff-queue-status ready"
                      }
                    >
                      {entry.status ===
                      "waiting"
                        ? "Waiting"
                        : "Table Ready"}
                    </span>

                  </div>

                  {/* ========================================
                      IDENTIFICATION
                  ======================================== */}

                  <div className="staff-queue-identification">

                    <div>

                      <Ticket size={17} />

                      <span>
                        Queue Token
                      </span>

                      <strong>
                        {entry.queueToken}
                      </strong>

                    </div>

                    <div>

                      <Hash size={17} />

                      <span>
                        Order ID
                      </span>

                      <strong>
                        {entry.orderId
                          ? entry.orderId
                          : "—"}
                      </strong>

                    </div>

                  </div>

                  {/* ========================================
                      QUEUE INFORMATION
                  ======================================== */}

                  <div className="staff-queue-info-grid">

                    <div>

                      <span>
                        Party Size
                      </span>

                      <strong>
                        {entry.partySize}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Position
                      </span>

                      <strong>
                        #{entry.position}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Estimated Wait
                      </span>

                      <strong>
                        {
                          entry.estimatedWaitMinutes
                        }{" "}
                        min
                      </strong>

                    </div>

                    <div>

                      <span>
                        Joined
                      </span>

                      <strong>
                        {new Date(
                          entry.joinedAt,
                        ).toLocaleTimeString()}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Assigned Table
                      </span>

                      <strong>
                        {assignedTable
                          ? `Table ${assignedTable.number}`
                          : "Not assigned"}
                      </strong>

                    </div>

                  </div>

                  {/* ========================================
                      ACTIONS
                  ======================================== */}

                  <div className="staff-queue-actions">

                    {/* ====================================
                        WAITING → ASSIGN TABLE
                    ==================================== */}

                    {entry.status ===
                      "waiting" && (

                      <select
                        defaultValue=""
                        onChange={(event) => {

                          if (
                            event.target
                              .value
                          ) {
                            handleAssignTable(
                              entry.id,
                              event.target
                                .value,
                            );

                            event.target.value =
                              "";
                          }

                        }}
                      >

                        <option value="">
                          Assign Table
                        </option>

                        {availableTables
                          .filter(
                            (table) =>
                              table.capacity >=
                              entry.partySize,
                          )
                          .map(
                            (table) => (
                              <option
                                key={
                                  table.id
                                }
                                value={
                                  table.id
                                }
                              >
                                Table{" "}
                                {
                                  table.number
                                }{" "}
                                —{" "}
                                {
                                  table.capacity
                                }{" "}
                                seats
                              </option>
                            ),
                          )}

                      </select>

                    )}

                    {/* ====================================
                        TABLE READY ACTIONS
                    ==================================== */}

                    {entry.status ===
                      "table-ready" && (

                      <>

                        {/* --------------------------------
                            CHANGE TABLE
                        -------------------------------- */}

                        <select
                          defaultValue=""
                          onChange={(event) => {

                            if (
                              event.target
                                .value
                            ) {
                              handleChangeTable(
                                entry.id,
                                event.target
                                  .value,
                              );

                              event.target.value =
                                "";
                            }

                          }}
                        >

                          <option value="">
                            Change Table
                          </option>

                          {availableTables
                            .filter(
                              (table) =>
                                table.id !==
                                  entry.assignedTableId &&
                                table.capacity >=
                                  entry.partySize,
                            )
                            .map(
                              (table) => (
                                <option
                                  key={
                                    table.id
                                  }
                                  value={
                                    table.id
                                  }
                                >
                                  Table{" "}
                                  {
                                    table.number
                                  }{" "}
                                  —{" "}
                                  {
                                    table.capacity
                                  }{" "}
                                  seats
                                </option>
                              ),
                            )}

                        </select>

                        {/* --------------------------------
                            MARK SEATED
                        -------------------------------- */}

                        <button
                          type="button"
                          className="staff-queue-seat-button"
                          onClick={() =>
                            markAsSeated(
                              entry.id,
                            )
                          }
                        >

                          <CheckCircle
                            size={16}
                          />

                          Mark Seated

                        </button>

                        {/* --------------------------------
                            CANCEL
                        -------------------------------- */}

                        <button
                          type="button"
                          className="staff-queue-cancel-button"
                          onClick={() =>
                            cancelQueueEntry(
                              entry.id,
                            )
                          }
                        >

                          <XCircle
                            size={16}
                          />

                          Cancel

                        </button>

                      </>

                    )}

                    {/* ====================================
                        WAITING → CANCEL
                    ==================================== */}

                    {entry.status ===
                      "waiting" && (

                      <button
                        type="button"
                        className="staff-queue-cancel-button"
                        onClick={() =>
                          cancelQueueEntry(
                            entry.id,
                          )
                        }
                      >

                        <XCircle
                          size={16}
                        />

                        Cancel

                      </button>

                    )}

                  </div>

                </article>
              );
            },
          )}

        </div>
      )}

    </section>
  );
}