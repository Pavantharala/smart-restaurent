// =========================================================
// SMART CAFE - SETTINGS TYPES
// =========================================================
//
// Central configuration for restaurant business rules.
//
// IMPORTANT:
// These values will eventually be controlled from:
//
// /admin/settings
//
// Instead of hard-coding business rules in different
// contexts, the application can read them from
// SettingsContext.
//
// =========================================================

export interface CafeSettings {
  // =======================================================
  // RESTAURANT
  // =======================================================

  restaurantName: string;

  restaurantPhone: string;

  restaurantAddress: string;

  // =======================================================
  // GAMING
  // =======================================================
  //
  // Default:
  // 1 order = 60 minutes
  //
  // =======================================================

  gamingDurationMinutes: number;

  // Final positive countdown before gaming ends.
  //
  // Default:
  // 5 minutes
  //
  gamingClosingCountdownMinutes: number;

  // =======================================================
  // WAITING LOUNGE / QUEUE
  // =======================================================

  queueWaitTimePerPositionMinutes: number;

  // Expected table usage by a Waiting Lounge customer.
  //
  // Default:
  // 60 minutes
  //
  queueProjectedUsageMinutes: number;

  // =======================================================
  // RESERVATIONS
  // =======================================================

  // Protection after reservation end.
  //
  // Example:
  //
  // Reservation:
  // 5:00 - 6:00
  //
  // Buffer:
  // 10 minutes
  //
  // Table protected until:
  // 6:10
  //
  reservationTurnoverBufferMinutes: number;

  // =======================================================
  // RESERVATION PAYMENT
  // =======================================================
  //
  // These are temporary business defaults.
  //
  // They can later be changed by Admin.
  //
  // =======================================================

  reservationAmount: number;

  reservationPartialPaymentAmount: number;

  // =======================================================
  // PAYMENT
  // =======================================================

  reservationPaymentRequired: boolean;

  // =======================================================
  // CUSTOMER NOTIFICATIONS
  // =======================================================

  queueNotificationsEnabled: boolean;

  reservationNotificationsEnabled: boolean;
}