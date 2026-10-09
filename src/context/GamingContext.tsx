
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  GamingMode,
  GamingSession,
  GamingSessionStatus,
} from "../types/Gaming";

import { useSettings } from "./SettingsContext";

// =========================================================
// SMART CAFE - GAMING CONTEXT
// =========================================================
//
// RESPONSIBILITIES
// - Associate a gaming session with an order.
// - Track start, expiry, and closing times.
// - Apply admin-configured gaming settings.
// - Preserve session history.
// - Prevent rapid duplicate session creation.
//
// Game rendering and game-specific logic belong elsewhere.
//
// =========================================================

// STORAGE
const GAMING_STORAGE_KEY = "smart-cafe-gaming-sessions";

// Keep disabled during normal project usage.
const GAMING_TEST_MODE = false;
const TEST_GAMING_DURATION_MINUTES = 6;

// =========================================================
// CONTEXT TYPE
// =========================================================

interface GamingContextType {
  sessions: GamingSession[];

  startGamingSession: (input: {
    orderId: string;
    customerId?: string;
    mode: GamingMode;
    gameId?: string;
    playerCount?: number;
  }) => GamingSession;

  getGamingSessionById: (
    sessionId: string,
  ) => GamingSession | undefined;

  getGamingSessionByOrderId: (
    orderId: string,
  ) => GamingSession | undefined;

  updateGamingSessionStatus: (
    sessionId: string,
    status: GamingSessionStatus,
  ) => void;

  endGamingSession: (sessionId: string) => void;

  getRemainingSeconds: (session: GamingSession) => number;

  getRemainingMinutes: (session: GamingSession) => number;
}

// =========================================================
// CONTEXT CREATION
// =========================================================

const GamingContext = createContext<GamingContextType | undefined>(
  undefined,
);

// =========================================================
// HELPERS
// =========================================================

function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

// Validate data restored from localStorage.
function isGamingSession(value: unknown): value is GamingSession {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const session = value as Record<string, unknown>;

  const validDate = (date: unknown): boolean =>
    typeof date === "string" &&
    date.trim() !== "" &&
    Number.isFinite(new Date(date).getTime());

  return (
    typeof session.id === "string" &&
    session.id.trim() !== "" &&
    typeof session.orderId === "string" &&
    session.orderId.trim() !== "" &&
    (session.mode === "single-player" ||
      session.mode === "multiplayer") &&
    validDate(session.startedAt) &&
    validDate(session.expiresAt) &&
    validDate(session.closingStartsAt) &&
    (session.status === "active" ||
      session.status === "closing" ||
      session.status === "expired" ||
      session.status === "cancelled") &&
    (session.customerId === undefined ||
      typeof session.customerId === "string") &&
    (session.gameId === undefined ||
      typeof session.gameId === "string") &&
    (session.playerCount === undefined ||
      (typeof session.playerCount === "number" &&
        Number.isInteger(session.playerCount) &&
        session.playerCount >= 1)) &&
    (session.endedAt === undefined ||
      validDate(session.endedAt))
  );
}

// =========================================================
// GAMING PROVIDER
// =========================================================

export function GamingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { settings } = useSettings();

  // =======================================================
  // LOAD SAVED SESSIONS
  // =======================================================

  const [sessions, setSessions] = useState<GamingSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem(
        GAMING_STORAGE_KEY,
      );

      if (!savedSessions) {
        return [];
      }

      const parsedSessions: unknown = JSON.parse(savedSessions);

      if (!Array.isArray(parsedSessions)) {
        return [];
      }

      return parsedSessions.filter(isGamingSession);
    } catch {
      return [];
    }
  });

  // =======================================================
  // SYNCHRONOUS SESSION REFERENCE
  // =======================================================
  //
  // React state updates are not immediately reflected in the
  // current render. Keep a synchronous reference so consecutive
  // calls can see sessions created by earlier calls.
  //
  // All session updates must use updateSessions().
  //
  // =======================================================

  const sessionsRef = useRef(sessions);

  const updateSessions = useCallback(
    (
      updater: (
        currentSessions: GamingSession[],
      ) => GamingSession[],
    ) => {
      const nextSessions = updater(sessionsRef.current);

      sessionsRef.current = nextSessions;
      setSessions(nextSessions);
    },
    [],
  );

  // =======================================================
  // SAVE SESSIONS
  // =======================================================

  useEffect(() => {
    try {
      localStorage.setItem(
        GAMING_STORAGE_KEY,
        JSON.stringify(sessions),
      );
    } catch {
      // Do not crash if browser storage is unavailable.
    }
  }, [sessions]);

  // =======================================================
  // AUTOMATIC SESSION STATUS CHECK
  // =======================================================
  //
  // ACTIVE -> CLOSING -> EXPIRED
  //
  // Expired and cancelled sessions remain in history.
  //
  // =======================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      updateSessions((currentSessions) => {
        let changed = false;

        const updatedSessions = currentSessions.map((session) => {
          if (
            session.status === "expired" ||
            session.status === "cancelled"
          ) {
            return session;
          }

          const remainingMilliseconds =
            new Date(session.expiresAt).getTime() -
            Date.now();

          if (remainingMilliseconds <= 0) {
            changed = true;

            return {
              ...session,
              status: "expired" as const,
              endedAt:
                session.endedAt ?? new Date().toISOString(),
            };
          }

          const closingDuration = minutesToMilliseconds(
            Math.max(
              0,
              Number(
                settings.gamingClosingCountdownMinutes,
              ) || 0,
            ),
          );

          if (
            remainingMilliseconds <= closingDuration &&
            session.status === "active"
          ) {
            changed = true;

            return {
              ...session,
              status: "closing" as const,
            };
          }

          return session;
        });

        return changed ? updatedSessions : currentSessions;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    settings.gamingClosingCountdownMinutes,
    updateSessions,
  ]);

  // =======================================================
  // START GAMING SESSION
  // =======================================================

  function startGamingSession(input: {
    orderId: string;
    customerId?: string;
    mode: GamingMode;
    gameId?: string;
    playerCount?: number;
  }): GamingSession {
    const normalizedOrderId = input.orderId.trim();

    if (!normalizedOrderId) {
      throw new Error(
        "Gaming session cannot start without an order ID.",
      );
    }

    // Return an existing live session for this order.
    const existingSession = sessionsRef.current.find(
      (session) =>
        session.orderId === normalizedOrderId &&
        (session.status === "active" ||
          session.status === "closing"),
    );

    if (existingSession) {
      return existingSession;
    }

    const now = new Date();

    const configuredGamingDuration = Math.max(
      5,
      Number(settings.gamingDurationMinutes) || 60,
    );

    const gamingDurationMinutes = GAMING_TEST_MODE
      ? TEST_GAMING_DURATION_MINUTES
      : configuredGamingDuration;

    const closingDurationMinutes = Math.min(
      gamingDurationMinutes,
      Math.max(
        0,
        Number(
          settings.gamingClosingCountdownMinutes,
        ) || 0,
      ),
    );

    const expiresAt = new Date(
      now.getTime() +
        minutesToMilliseconds(gamingDurationMinutes),
    );

    const closingStartsAt = new Date(
      expiresAt.getTime() -
        minutesToMilliseconds(closingDurationMinutes),
    );

    const session: GamingSession = {
      id: `GAME-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      orderId: normalizedOrderId,
      customerId: input.customerId,
      mode: input.mode,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      closingStartsAt: closingStartsAt.toISOString(),
      status: "active",
      gameId: input.gameId,
      playerCount: input.playerCount,
    };

    // The reference is updated synchronously. A rapid second
    // call for this order will find the session above.
    updateSessions((currentSessions) => [
      ...currentSessions,
      session,
    ]);

    return session;
  }

  // =======================================================
  // GET SESSION BY ID
  // =======================================================

  function getGamingSessionById(
    sessionId: string,
  ): GamingSession | undefined {
    return sessions.find(
      (session) => session.id === sessionId,
    );
  }

  // =======================================================
  // GET SESSION BY ORDER ID
  // =======================================================
  //
  // Priority:
  // 1. Active session
  // 2. Closing session
  // 3. Most recent historical session
  //
  // =======================================================

  function getGamingSessionByOrderId(
    orderId: string,
  ): GamingSession | undefined {
    const normalizedOrderId = orderId.trim();

    if (!normalizedOrderId) {
      return undefined;
    }

    const orderSessions = sessions.filter(
      (session) => session.orderId === normalizedOrderId,
    );

    const activeSession = orderSessions.find(
      (session) => session.status === "active",
    );

    if (activeSession) {
      return activeSession;
    }

    const closingSession = orderSessions.find(
      (session) => session.status === "closing",
    );

    if (closingSession) {
      return closingSession;
    }

    return orderSessions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() -
          new Date(a.startedAt).getTime(),
      )[0];
  }

  // =======================================================
  // UPDATE SESSION STATUS
  // =======================================================

  function updateGamingSessionStatus(
    sessionId: string,
    status: GamingSessionStatus,
  ): void {
    updateSessions((currentSessions) =>
      currentSessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        // Terminal statuses cannot be changed.
        if (
          session.status === "expired" ||
          session.status === "cancelled"
        ) {
          return session;
        }

        const validTransition =
          (session.status === "active" &&
            (status === "closing" ||
              status === "expired" ||
              status === "cancelled")) ||
          (session.status === "closing" &&
            (status === "expired" ||
              status === "cancelled"));

        if (!validTransition) {
          return session;
        }

        if (
          status === "expired" ||
          status === "cancelled"
        ) {
          return {
            ...session,
            status,
            endedAt:
              session.endedAt ?? new Date().toISOString(),
          };
        }

        return {
          ...session,
          status,
        };
      }),
    );
  }

  // =======================================================
  // END GAMING SESSION
  // =======================================================
  //
  // Manual ending uses "expired" because GamingSessionStatus
  // does not currently include a separate "ended" status.
  //
  // =======================================================

  function endGamingSession(sessionId: string): void {
    updateSessions((currentSessions) =>
      currentSessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        if (
          session.status === "expired" ||
          session.status === "cancelled"
        ) {
          return session;
        }

        return {
          ...session,
          status: "expired" as const,
          endedAt: new Date().toISOString(),
        };
      }),
    );
  }

  // =======================================================
  // REMAINING SECONDS
  // =======================================================

  function getRemainingSeconds(
    session: GamingSession,
  ): number {
    const remainingMilliseconds =
      new Date(session.expiresAt).getTime() -
      Date.now();

    return Math.max(
      0,
      Math.ceil(remainingMilliseconds / 1000),
    );
  }

  // =======================================================
  // REMAINING MINUTES
  // =======================================================

  function getRemainingMinutes(
    session: GamingSession,
  ): number {
    return Math.ceil(
      getRemainingSeconds(session) / 60,
    );
  }

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = useMemo<GamingContextType>(
    () => ({
      sessions,
      startGamingSession,
      getGamingSessionById,
      getGamingSessionByOrderId,
      updateGamingSessionStatus,
      endGamingSession,
      getRemainingSeconds,
      getRemainingMinutes,
    }),
    [
      sessions,
      settings.gamingDurationMinutes,
      settings.gamingClosingCountdownMinutes,
    ],
  );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <GamingContext.Provider value={value}>
      {children}
    </GamingContext.Provider>
  );
}

// =========================================================
// USE GAMING HOOK
// =========================================================

export function useGaming() {
  const context = useContext(GamingContext);

  if (!context) {
    throw new Error(
      "useGaming must be used inside GamingProvider",
    );
  }

  return context;
}