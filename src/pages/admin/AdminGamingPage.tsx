
 // =====================================================
// SMART CAFE - ADMIN GAMING MANAGEMENT
// PHASE 20.6: END / CANCEL GAMING SESSIONS
// =====================================================

import { useEffect, useState } from "react";

import { useGaming } from "../../context/GamingContext";
import type {
  GamingSession,
  GamingSessionStatus,
} from "../../types/Gaming";

import "./AdminGamingPage.css";

type SessionFilter = "all" | GamingSessionStatus;
type SessionAction = "end" | "cancel";

interface PendingSessionAction {
  sessionId: string;
  action: SessionAction;
}

const SESSION_FILTERS: {
  value: SessionFilter;
  label: string;
}[] = [
  { value: "all", label: "All Sessions" },
  { value: "active", label: "Active" },
  { value: "closing", label: "Closing" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : date.toLocaleString();
}

function formatRemainingTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds
      .toString()
      .padStart(2, "0")}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function isSessionLive(session: GamingSession) {
  return (
    session.status === "active" ||
    session.status === "closing"
  );
}

export default function AdminGamingPage() {
  const {
    sessions,
    getRemainingSeconds,
    endGamingSession,
    updateGamingSessionStatus,
  } = useGaming();

  const [selectedStatus, setSelectedStatus] =
    useState<SessionFilter>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSession, setSelectedSession] =
    useState<GamingSession | null>(null);

  const [pendingAction, setPendingAction] =
    useState<PendingSessionAction | null>(null);

  const [, setClock] = useState(Date.now());

  // Refresh live countdowns every second.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // Close dialogs using Escape.
  useEffect(() => {
    if (!selectedSession && !pendingAction) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (pendingAction) {
          setPendingAction(null);
        } else {
          setSelectedSession(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSession, pendingAction]);

  // Always use the latest session data in the details dialog.
  const currentSelectedSession = selectedSession
    ? sessions.find(
        (session) => session.id === selectedSession.id,
      ) ?? null
    : null;

  const currentPendingSession = pendingAction
    ? sessions.find(
        (session) => session.id === pendingAction.sessionId,
      ) ?? null
    : null;

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(b.startedAt).getTime() -
      new Date(a.startedAt).getTime(),
  );

  const normalizedSearchQuery =
    searchQuery.trim().toLowerCase();

  const filteredSessions = sortedSessions.filter((session) => {
    const matchesStatus =
      selectedStatus === "all" ||
      session.status === selectedStatus;

    const matchesSearch =
      session.id.toLowerCase().includes(normalizedSearchQuery) ||
      session.orderId.toLowerCase().includes(normalizedSearchQuery);

    return matchesStatus && matchesSearch;
  });

  const activeCount = sessions.filter(
    (session) => session.status === "active",
  ).length;

  const closingCount = sessions.filter(
    (session) => session.status === "closing",
  ).length;

  const expiredCount = sessions.filter(
    (session) => session.status === "expired",
  ).length;

  const cancelledCount = sessions.filter(
    (session) => session.status === "cancelled",
  ).length;

  function getEmptyTitle() {
    if (sessions.length === 0) return "No gaming sessions yet";
    if (normalizedSearchQuery) return "No matching gaming sessions";
    return `No ${selectedStatus} sessions`;
  }

  function getEmptyDescription() {
    if (sessions.length === 0) {
      return "Sessions will appear here when customers start gaming through an eligible order.";
    }

    if (normalizedSearchQuery) {
      return "Check the session ID or order ID, or clear your search to see more sessions.";
    }

    return "Try selecting another status filter to view more sessions.";
  }

  function requestSessionAction(
    session: GamingSession,
    action: SessionAction,
  ) {
    // Do not allow actions on terminal sessions.
    if (!isSessionLive(session)) return;

    setPendingAction({
      sessionId: session.id,
      action,
    });
  }

  function confirmSessionAction() {
    if (!pendingAction || !currentPendingSession) return;

    // Recheck the current status before applying the action.
    if (!isSessionLive(currentPendingSession)) {
      setPendingAction(null);
      return;
    }

    if (pendingAction.action === "end") {
      // Manual ending is represented by "expired"
      // in the existing GamingSession lifecycle.
      endGamingSession(pendingAction.sessionId);
    } else {
      // Cancelled sessions are terminal and remain in history.
      updateGamingSessionStatus(
        pendingAction.sessionId,
        "cancelled",
      );
    }

    setPendingAction(null);
    setSelectedSession(null);
  }

  const pendingActionIsEnd =
    pendingAction?.action === "end";

  return (
    <section className="admin-gaming">
      <header className="admin-gaming__heading">
        <p className="admin-gaming__breadcrumb">
          ADMIN / GAMING
        </p>

        <h1 className="admin-gaming__title">
          Gaming Management
        </h1>

        <p className="admin-gaming__description">
          Monitor gaming sessions and their lifecycle.
        </p>
      </header>

      {/* SESSION SUMMARY */}

      <div className="admin-gaming__summary">
        <div className="admin-gaming__summary-card">
          <p className="admin-gaming__summary-label">Total Sessions</p>
          <h2 className="admin-gaming__summary-value">
            {sessions.length}
          </h2>
        </div>

        <div className="admin-gaming__summary-card admin-gaming__summary-card--active">
          <p className="admin-gaming__summary-label">Active</p>
          <h2 className="admin-gaming__summary-value">{activeCount}</h2>
        </div>

        <div className="admin-gaming__summary-card admin-gaming__summary-card--closing">
          <p className="admin-gaming__summary-label">Closing</p>
          <h2 className="admin-gaming__summary-value">{closingCount}</h2>
        </div>

        <div className="admin-gaming__summary-card admin-gaming__summary-card--expired">
          <p className="admin-gaming__summary-label">Expired</p>
          <h2 className="admin-gaming__summary-value">{expiredCount}</h2>
        </div>

        <div className="admin-gaming__summary-card admin-gaming__summary-card--cancelled">
          <p className="admin-gaming__summary-label">Cancelled</p>
          <h2 className="admin-gaming__summary-value">{cancelledCount}</h2>
        </div>
      </div>

      {/* GAMING SESSIONS */}

      <section className="admin-gaming__panel">
        <div className="admin-gaming__panel-header">
          <h2 className="admin-gaming__panel-title">
            Gaming Sessions
          </h2>
        </div>

        {/* SEARCH */}

        <div className="admin-gaming__search">
          <label
            className="admin-gaming__search-label"
            htmlFor="gaming-session-search"
          >
            Search sessions
          </label>

          <input
            id="gaming-session-search"
            type="search"
            className="admin-gaming__search-input"
            placeholder="Enter session ID or order ID..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />

          {searchQuery && (
            <button
              type="button"
              className="admin-gaming__clear-search"
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </button>
          )}
        </div>

        {/* STATUS FILTERS */}

        <div
          className="admin-gaming__filters"
          aria-label="Filter gaming sessions by status"
        >
          {SESSION_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={[
                "admin-gaming__filter-button",
                selectedStatus === filter.value
                  ? "admin-gaming__filter-button--selected"
                  : "",
              ].filter(Boolean).join(" ")}
              aria-pressed={selectedStatus === filter.value}
              onClick={() => setSelectedStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <p className="admin-gaming__results" aria-live="polite">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </p>

        {filteredSessions.length === 0 ? (
          <div className="admin-gaming__empty">
            <h3 className="admin-gaming__empty-title">
              {getEmptyTitle()}
            </h3>
            <p className="admin-gaming__empty-description">
              {getEmptyDescription()}
            </p>
          </div>
        ) : (
          <div className="admin-gaming__table-wrapper">
            <table className="admin-gaming__table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Order</th>
                  <th>Mode / Game</th>
                  <th>Started</th>
                  <th>Expires</th>
                  <th>Time Remaining</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSessions.map((session) => {
                  const live = isSessionLive(session);
                  const remainingSeconds = live
                    ? getRemainingSeconds(session)
                    : 0;

                  return (
                    <tr key={session.id}>
                      <td>
                        <span className="admin-gaming__session-id">
                          {session.id}
                        </span>
                      </td>

                      <td>
                        <span className="admin-gaming__order-id">
                          {session.orderId}
                        </span>
                      </td>

                      <td>
                        <div className="admin-gaming__game-mode">
                          {session.mode}
                        </div>
                        <small className="admin-gaming__game-id">
                          {session.gameId || "Not selected"}
                        </small>
                      </td>

                      <td>
                        <div className="admin-gaming__date">
                          {formatDate(session.startedAt)}
                        </div>
                      </td>

                      <td>
                        <div className="admin-gaming__date">
                          {formatDate(session.expiresAt)}
                        </div>
                      </td>

                      <td>
                        <span className="admin-gaming__remaining">
                          {live
                            ? formatRemainingTime(remainingSeconds)
                            : "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`admin-gaming__status admin-gaming__status--${session.status}`}
                        >
                          {session.status}
                        </span>
                      </td>

                      <td>
                        <div className="admin-gaming__row-actions">
                          <button
                            type="button"
                            className="admin-gaming__details-button"
                            onClick={() => setSelectedSession(session)}
                            aria-label={`View details for session ${session.id}`}
                          >
                            View Details
                          </button>

                          {live && (
                            <>
                              <button
                                type="button"
                                className="admin-gaming__action-button admin-gaming__action-button--end"
                                onClick={() =>
                                  requestSessionAction(session, "end")
                                }
                              >
                                End
                              </button>

                              <button
                                type="button"
                                className="admin-gaming__action-button admin-gaming__action-button--cancel"
                                onClick={() =>
                                  requestSessionAction(session, "cancel")
                                }
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SESSION DETAILS DIALOG */}

      {currentSelectedSession && (
        <div
          className="admin-gaming__modal-backdrop"
          onClick={() => setSelectedSession(null)}
        >
          <section
            className="admin-gaming__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="gaming-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="admin-gaming__modal-header">
              <div>
                <p className="admin-gaming__breadcrumb">
                  ADMIN / GAMING / DETAILS
                </p>
                <h2
                  id="gaming-details-title"
                  className="admin-gaming__modal-title"
                >
                  Session Details
                </h2>
              </div>

              <button
                type="button"
                className="admin-gaming__modal-close"
                onClick={() => setSelectedSession(null)}
                aria-label="Close session details"
              >
                ×
              </button>
            </header>

            <div className="admin-gaming__details-grid">
              <div className="admin-gaming__detail">
                <span>Session ID</span>
                <strong>{currentSelectedSession.id}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Order ID</span>
                <strong>{currentSelectedSession.orderId}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Gaming Mode</span>
                <strong>{currentSelectedSession.mode}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Game</span>
                <strong>
                  {currentSelectedSession.gameId || "Not selected"}
                </strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Player Count</span>
                <strong>
                  {currentSelectedSession.playerCount ?? "Not recorded"}
                </strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Customer ID</span>
                <strong>
                  {currentSelectedSession.customerId || "Not recorded"}
                </strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Status</span>
                <strong>
                  <span
                    className={`admin-gaming__status admin-gaming__status--${currentSelectedSession.status}`}
                  >
                    {currentSelectedSession.status}
                  </span>
                </strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Started At</span>
                <strong>{formatDate(currentSelectedSession.startedAt)}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Expires At</span>
                <strong>{formatDate(currentSelectedSession.expiresAt)}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Closing Countdown Starts</span>
                <strong>
                  {formatDate(currentSelectedSession.closingStartsAt)}
                </strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Ended At</span>
                <strong>{formatDate(currentSelectedSession.endedAt)}</strong>
              </div>

              <div className="admin-gaming__detail">
                <span>Time Remaining</span>
                <strong>
                  {isSessionLive(currentSelectedSession)
                    ? formatRemainingTime(
                        getRemainingSeconds(currentSelectedSession),
                      )
                    : "Session not running"}
                </strong>
              </div>
            </div>

            <footer className="admin-gaming__modal-footer">
              {isSessionLive(currentSelectedSession) && (
                <>
                  <button
                    type="button"
                    className="admin-gaming__action-button admin-gaming__action-button--end"
                    onClick={() =>
                      requestSessionAction(currentSelectedSession, "end")
                    }
                  >
                    End Session
                  </button>

                  <button
                    type="button"
                    className="admin-gaming__action-button admin-gaming__action-button--cancel"
                    onClick={() =>
                      requestSessionAction(currentSelectedSession, "cancel")
                    }
                  >
                    Cancel Session
                  </button>
                </>
              )}

              <button
                type="button"
                className="admin-gaming__details-button"
                onClick={() => setSelectedSession(null)}
              >
                Close Details
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* END / CANCEL CONFIRMATION */}

      {pendingAction && currentPendingSession && (
        <div
          className="admin-gaming__modal-backdrop admin-gaming__confirm-backdrop"
          onClick={() => setPendingAction(null)}
        >
          <section
            className="admin-gaming__confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="gaming-confirm-title"
            aria-describedby="gaming-confirm-description"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="admin-gaming__breadcrumb">
              ADMIN / GAMING / CONFIRM
            </p>

            <h2
              id="gaming-confirm-title"
              className="admin-gaming__modal-title"
            >
              {pendingActionIsEnd
                ? "End gaming session?"
                : "Cancel gaming session?"}
            </h2>

            <p
              id="gaming-confirm-description"
              className="admin-gaming__confirm-description"
            >
              {pendingActionIsEnd
                ? "This will immediately stop the session and mark it as expired. The session will remain in history."
                : "This will immediately stop the session and mark it as cancelled. The session will remain in history."}
            </p>

            <div className="admin-gaming__confirm-info">
              <span>Session ID</span>
              <strong>{currentPendingSession.id}</strong>

              <span>Order ID</span>
              <strong>{currentPendingSession.orderId}</strong>

              <span>Current status</span>
              <strong>{currentPendingSession.status}</strong>
            </div>

            <footer className="admin-gaming__confirm-actions">
              <button
                type="button"
                className="admin-gaming__details-button"
                onClick={() => setPendingAction(null)}
              >
                Go Back
              </button>

              <button
                type="button"
                className={`admin-gaming__action-button ${
                  pendingActionIsEnd
                    ? "admin-gaming__action-button--end"
                    : "admin-gaming__action-button--cancel"
                }`}
                onClick={confirmSessionAction}
              >
                {pendingActionIsEnd
                  ? "Confirm End"
                  : "Confirm Cancel"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}