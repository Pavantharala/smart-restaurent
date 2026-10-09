// =========================================================
// SMART CAFE - GAMING TYPES
// =========================================================
//
// This file contains the data structures used by the
// Smart Cafe gaming system.
//
// IMPORTANT:
// This file does NOT contain actual game logic.
//
// Single-player and multiplayer games will be built
// separately later.
//
// GamingContext will use these types to manage:
// - Gaming sessions
// - Order ownership
// - Start time
// - Expiry time
// - Remaining time
// - Closing period
// - Session status
//
// =========================================================


// =========================================================
// GAMING SESSION STATUS
// =========================================================

export type GamingSessionStatus =
  | "active"
  | "closing"
  | "expired"
  | "cancelled";


// =========================================================
// GAMING MODE
// =========================================================
//
// single-player:
// One customer plays alone.
//
// multiplayer:
// Multiple players participate in the same game.
//
// =========================================================

export type GamingMode =
  | "single-player"
  | "multiplayer";


// =========================================================
// GAMING SESSION
// =========================================================

export interface GamingSession {
  // Unique gaming session ID
  id: string;

  // Order that gives the customer gaming access
  orderId: string;

  // Customer who owns the session
  customerId?: string;

  // Type of gaming
  mode: GamingMode;

  // Session start timestamp
  startedAt: string;

  // Normal gaming expiry timestamp
  expiresAt: string;

  // Final 5-minute closing period starts here
  closingStartsAt: string;

  // Current session state
  status: GamingSessionStatus;

  // Optional game currently being played
  gameId?: string;

  // When the session was finally closed
  endedAt?: string;

  // Number of players for multiplayer games
  playerCount?: number;
}