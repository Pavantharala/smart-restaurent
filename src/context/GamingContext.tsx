
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
// - Manage gaming sessions linked to orders.
// - Prevent duplicate active sessions for the same order.
// - Track session start, closing and expiry times.
// - Respect configured gaming duration.
// - Preserve completed session history.
// - Recover safely from invalid browser storage.
//
// IMPORTANT
// - Payment status does not control gaming.
// - Kitchen status does not control gaming.
// - OrderContext starts gaming only for eligible orders:
//   dine-in and waiting-lounge.
// - OrderContext handles cleanup when an order is
//   completed or cancelled.
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

const GamingContext = createContext<
  GamingContextType | undefined
>(undefined);

// =========================================================
// HELPERS
// =========================================================

function minutesToMilliseconds(minutes: number): number {
  return minutes * 60 * 1000;
}

function isLiveSession(session: GamingSession): boolean {
  return (
    session.status === "active" ||
    session.status === "closing"
  );
}

// Validate saved data before trusting localStorage.
function isGamingSession(
  value: unknown,
): value is GamingSession {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const session = value as Record<string, unknown>;

  const validDate = (date: unknown): date is string =>
    typeof date === "string" &&
    date.trim() !== "" &&
    Number.isFinite(new Date(date).getTime());

  if (
    typeof session.id !== "string" ||
    session.id.trim() === "" ||
    typeof session.orderId !== "string" ||
    session.orderId.trim() === "" ||
    (session.mode !== "single-player" &&
      session.mode !== "multiplayer") ||
    !validDate(session.startedAt) ||
    !validDate(session.expiresAt) ||
    !validDate(session.closingStartsAt) ||
    (session.status !== "active" &&
      session.status !== "closing" &&
      session.status !== "expired" &&
      session.status !== "cancelled") ||
    (session.customerId !== undefined &&
      typeof session.customerId !== "string") ||
    (session.gameId !== undefined &&
      typeof session.gameId !== "string") ||
    (session.playerCount !== undefined &&
      (typeof session.playerCount !== "number" ||
        !Number.isInteger(session.playerCount) ||
        session.playerCount < 1)) ||
    (session.endedAt !== undefined &&
      !validDate(session.endedAt))
  ) {
    return false;
  }

  const startedAt = new Date(
    session.startedAt,
  ).getTime();

  const closingStartsAt = new Date(
    session.closingStartsAt,
  ).getTime();

  const expiresAt = new Date(
    session.expiresAt,
  ).getTime();

  // A session's timestamps must follow the correct order.
  if (
    startedAt > closingStartsAt ||
    closingStartsAt > expiresAt
  ) {
    return false;
  }

  return true;
}

// Read saved sessions without crashing when storage is blocked.
function loadGamingSessions(): GamingSession[] {
  try {
    const saved = localStorage.getItem(
      GAMING_STORAGE_KEY,
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const validSessions = parsed.filter(isGamingSession);

    // Remove duplicate session IDs from corrupted saved data.
    const seenIds = new Set<string>();

    return validSessions.filter((session) => {
      if (seenIds.has(session.id)) {
        return false;
      }

      seenIds.add(session.id);
      return true;
    });
  } catch {
    return [];
  }
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

  const [sessions, setSessions] =
    useState<GamingSession[]>(loadGamingSessions);

  // Keep a synchronous reference so consecutive operations
  // can see the latest sessions before React rerenders.
  const sessionsRef = useRef(sessions);

  // All internal session changes go through this function.
  const updateSessions = useCallback(
    (
      updater: (
        currentSessions: GamingSession[],
      ) => GamingSession[],
    ) => {
      const nextSessions = updater(sessionsRef.current);

      if (nextSessions === sessionsRef.current) {
        return;
      }

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
      // Browser storage failures must not crash the app.
    }
  }, [sessions]);

  // =======================================================
  // SYNCHRONIZE OTHER TABS
  // =======================================================
  //
  // This supports browser tabs on the same device.
  // It is NOT real-time server or multi-device synchronization.
  //
  // =======================================================

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== GAMING_STORAGE_KEY) {
        return;
      }

      if (event.newValue === null) {
        sessionsRef.current = [];
        setSessions([]);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(
          event.newValue,
        );

        if (!Array.isArray(parsed)) {
          return;
        }

        const validSessions =
          parsed.filter(isGamingSession);

        const uniqueSessions: GamingSession[] = [];
        const seenIds = new Set<string>();

        for (const session of validSessions) {
          if (seenIds.has(session.id)) {
            continue;
          }

          seenIds.add(session.id);
          uniqueSessions.push(session);
        }

        sessionsRef.current = uniqueSessions;
        setSessions(uniqueSessions);
      } catch {
        // Ignore malformed data received from another tab.
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // =======================================================
  // AUTOMATIC SESSION STATUS CHECK
  // =======================================================
  //
  // ACTIVE -> CLOSING -> EXPIRED
  //
  // Use each session's stored closingStartsAt value.
  // Changing settings later must not unexpectedly shift
  // the countdown for an already-running session.
  //
  // =======================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();

      updateSessions((currentSessions) => {
        let changed = false;

        const updatedSessions = currentSessions.map(
          (session) => {
            if (!isLiveSession(session)) {
              return session;
            }

            const expiresAt = new Date(
              session.expiresAt,
            ).getTime();

            const closingStartsAt = new Date(
              session.closingStartsAt,
            ).getTime();

            // Expiry takes priority over the closing state.
            if (now >= expiresAt) {
              changed = true;

              return {
                ...session,
                status: "expired" as const,
                endedAt:
                  session.endedAt ??
                  new Date(now).toISOString(),
              };
            }

            // Start the closing period at its saved timestamp.
            if (
              now >= closingStartsAt &&
              session.status === "active"
            ) {
              changed = true;

              return {
                ...session,
                status: "closing" as const,
              };
            }

            return session;
          },
        );

        return changed ? updatedSessions : currentSessions;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [updateSessions]);

  // =======================================================
  // START GAMING SESSION
  // =======================================================

  const startGamingSession = useCallback(
    (input: {
      orderId: string;
      customerId?: string;
      mode: GamingMode;
      gameId?: string;
      playerCount?: number;
    }): GamingSession => {
      const normalizedOrderId = input.orderId.trim();

      if (!normalizedOrderId) {
        throw new Error(
          "Gaming session cannot start without an order ID.",
        );
      }

      if (
        input.mode !== "single-player" &&
        input.mode !== "multiplayer"
      ) {
        throw new Error("Invalid gaming mode.");
      }

      if (
        input.playerCount !== undefined &&
        (!Number.isInteger(input.playerCount) ||
          input.playerCount < 1)
      ) {
        throw new Error(
          "Player count must be a positive integer.",
        );
      }

      // Do not create a second live session for the same order.
      const existingSession = sessionsRef.current.find(
        (session) =>
          session.orderId === normalizedOrderId &&
          isLiveSession(session) &&
          Date.now() <
            new Date(session.expiresAt).getTime(),
      );

      if (existingSession) {
        return existingSession;
      }

      const now = new Date();

      const configuredDuration = Number(
        settings.gamingDurationMinutes,
      );

      const gamingDurationMinutes = GAMING_TEST_MODE
        ? TEST_GAMING_DURATION_MINUTES
        : Math.max(
            5,
            Number.isFinite(configuredDuration) &&
              configuredDuration > 0
              ? configuredDuration
              : 60,
          );

      const configuredClosingMinutes = Number(
        settings.gamingClosingCountdownMinutes,
      );

      const closingDurationMinutes = Math.min(
        gamingDurationMinutes,
        Math.max(
          0,
          Number.isFinite(configuredClosingMinutes)
            ? configuredClosingMinutes
            : 5,
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
          .slice(2, 10)}`,
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

      updateSessions((currentSessions) => [
        ...currentSessions,
        session,
      ]);

      return session;
    },
    [
      settings.gamingDurationMinutes,
      settings.gamingClosingCountdownMinutes,
      updateSessions,
    ],
  );

  // =======================================================
  // GET SESSION BY ID
  // =======================================================

  const getGamingSessionById = useCallback(
    (sessionId: string): GamingSession | undefined => {
      return sessionsRef.current.find(
        (session) => session.id === sessionId,
      );
    },
    [],
  );

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

  const getGamingSessionByOrderId = useCallback(
    (orderId: string): GamingSession | undefined => {
      const normalizedOrderId = orderId.trim();

      if (!normalizedOrderId) {
        return undefined;
      }

      const orderSessions = sessionsRef.current
        .filter(
          (session) =>
            session.orderId === normalizedOrderId,
        )
        .sort(
          (a, b) =>
            new Date(b.startedAt).getTime() -
            new Date(a.startedAt).getTime(),
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

      return closingSession ?? orderSessions[0];
    },
    [],
  );

  // =======================================================
  // UPDATE SESSION STATUS
  // =======================================================

  const updateGamingSessionStatus = useCallback(
    (
      sessionId: string,
      status: GamingSessionStatus,
    ): void => {
      updateSessions((currentSessions) => {
        let changed = false;

        const updatedSessions = currentSessions.map(
          (session) => {
            if (session.id !== sessionId) {
              return session;
            }

            // Terminal statuses cannot be reopened.
            if (!isLiveSession(session)) {
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

            changed = true;

            if (
              status === "expired" ||
              status === "cancelled"
            ) {
              return {
                ...session,
                status,
                endedAt: new Date().toISOString(),
              };
            }

            return {
              ...session,
              status,
            };
          },
        );

        return changed ? updatedSessions : currentSessions;
      });
    },
    [updateSessions],
  );

  // =======================================================
  // END GAMING SESSION
  // =======================================================
  //
  // The existing GamingSessionStatus type does not contain
  // an "ended" status. For compatibility, a manually ended
  // session is marked "expired" and receives endedAt.
  //
  // This also preserves compatibility with OrderContext,
  // which uses this function for terminal order cleanup.
  //
  // =======================================================

  const endGamingSession = useCallback(
    (sessionId: string): void => {
      updateSessions((currentSessions) => {
        let changed = false;

        const updatedSessions = currentSessions.map(
          (session) => {
            if (
              session.id !== sessionId ||
              !isLiveSession(session)
            ) {
              return session;
            }

            changed = true;

            return {
              ...session,
              status: "expired" as const,
              endedAt: new Date().toISOString(),
            };
          },
        );

        return changed ? updatedSessions : currentSessions;
      });
    },
    [updateSessions],
  );

  // =======================================================
  // REMAINING SECONDS
  // =======================================================

  const getRemainingSeconds = useCallback(
    (session: GamingSession): number => {
      const remainingMilliseconds =
        new Date(session.expiresAt).getTime() -
        Date.now();

      return Math.max(
        0,
        Math.ceil(remainingMilliseconds / 1000),
      );
    },
    [],
  );

  // =======================================================
  // REMAINING MINUTES
  // =======================================================

  const getRemainingMinutes = useCallback(
    (session: GamingSession): number => {
      return Math.ceil(
        getRemainingSeconds(session) / 60,
      );
    },
    [getRemainingSeconds],
  );

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
      startGamingSession,
      getGamingSessionById,
      getGamingSessionByOrderId,
      updateGamingSessionStatus,
      endGamingSession,
      getRemainingSeconds,
      getRemainingMinutes,
    ],
  );

  return (
    <GamingContext.Provider value={value}>
      {children}
    </GamingContext.Provider>
  );
}

// =========================================================
// USE GAMING HOOK
// =========================================================

export function useGaming(): GamingContextType {
  const context = useContext(GamingContext);

  if (!context) {
    throw new Error(
      "useGaming must be used inside GamingProvider",
    );
  }

  return context;
}
