
 // =========================================================
// SMART CAFE - SETTINGS TYPES
// =========================================================

export interface CafeSettings {
  // Restaurant
  restaurantName: string;
  restaurantPhone: string;
  restaurantAddress: string;

  // Gaming
  gamingDurationMinutes: number;
  gamingClosingCountdownMinutes: number;

  // Waiting Lounge / Queue
  queueWaitTimePerPositionMinutes: number;
  queueProjectedUsageMinutes: number;

  // Reservations
  reservationTurnoverBufferMinutes: number;

  // Reservation Payment
  reservationAmount: number;
  reservationPartialPaymentAmount: number;
  reservationPaymentRequired: boolean;

  // Customer Notifications
  queueNotificationsEnabled: boolean;
  reservationNotificationsEnabled: boolean;

  // Lucky Draw
  // The admin can enable or disable Lucky Draw.
  luckyDrawEnabled: boolean;
}
