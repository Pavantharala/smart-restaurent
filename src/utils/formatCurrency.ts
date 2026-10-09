// ============================================================
// SMART RESTAURANT - CURRENCY FORMATTER
// ============================================================
// This small utility keeps currency formatting consistent
// throughout the application.
//
// If the restaurant changes currency in the future,
// this is one of the places that can be updated.
// ============================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}