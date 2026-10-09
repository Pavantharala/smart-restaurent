import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { CafeSettings } from "../types/Settings";

// =========================================================
// SMART CAFE - SETTINGS CONTEXT
// =========================================================
//
// This context stores the restaurant's configurable
// business settings.
//
// Admin can change these values from:
//
// /admin/settings
//
// Other parts of the application can then read the
// settings instead of using hard-coded numbers.
//
// =========================================================

const SETTINGS_STORAGE_KEY = "smart-cafe-settings";

// =========================================================
// DEFAULT SETTINGS
// =========================================================

const DEFAULT_SETTINGS: CafeSettings = {
  // Restaurant
  restaurantName: "Smart Cafe",
  restaurantPhone: "",
  restaurantAddress: "",

  // Gaming
  gamingDurationMinutes: 60,
  gamingClosingCountdownMinutes: 5,

  // Waiting Lounge / Queue
  queueWaitTimePerPositionMinutes: 10,
  queueProjectedUsageMinutes: 60,

  // Reservations
  reservationTurnoverBufferMinutes: 10,

  // Reservation Payment
  reservationAmount: 200,
  reservationPartialPaymentAmount: 100,
  reservationPaymentRequired: false,

  // Notifications
  queueNotificationsEnabled: true,
  reservationNotificationsEnabled: true,
};

// =========================================================
// CONTEXT TYPE
// =========================================================

interface SettingsContextType {
  settings: CafeSettings;

  updateSettings: (updates: Partial<CafeSettings>) => void;

  resetSettings: () => void;
}

// =========================================================
// CREATE CONTEXT
// =========================================================

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

// =========================================================
// NORMALIZE SETTINGS
// =========================================================
//
// This protects the application if incorrect values are
// stored in localStorage.
//
// =========================================================

function normalizeSettings(
  value: Partial<CafeSettings>,
): CafeSettings {
  const merged: CafeSettings = {
    ...DEFAULT_SETTINGS,
    ...value,
  };

  return {
    ...merged,

    // Restaurant
    restaurantName:
      typeof merged.restaurantName === "string"
        ? merged.restaurantName
        : DEFAULT_SETTINGS.restaurantName,

    restaurantPhone:
      typeof merged.restaurantPhone === "string"
        ? merged.restaurantPhone
        : DEFAULT_SETTINGS.restaurantPhone,

    restaurantAddress:
      typeof merged.restaurantAddress === "string"
        ? merged.restaurantAddress
        : DEFAULT_SETTINGS.restaurantAddress,

    // Gaming
    gamingDurationMinutes: Math.max(
      5,
      Math.min(1440, Number(merged.gamingDurationMinutes) || 60),
    ),

    gamingClosingCountdownMinutes: Math.max(
      0,
      Math.min(
        60,
        Number(merged.gamingClosingCountdownMinutes) || 0,
      ),
    ),

    // Queue
    queueWaitTimePerPositionMinutes: Math.max(
      1,
      Math.min(
        120,
        Number(merged.queueWaitTimePerPositionMinutes) || 10,
      ),
    ),

    queueProjectedUsageMinutes: Math.max(
      5,
      Math.min(
        1440,
        Number(merged.queueProjectedUsageMinutes) || 60,
      ),
    ),

    // Reservation
    reservationTurnoverBufferMinutes: Math.max(
      0,
      Math.min(
        120,
        Number(merged.reservationTurnoverBufferMinutes) || 0,
      ),
    ),

    // Payment
    reservationAmount: Math.max(
      0,
      Number(merged.reservationAmount) || 0,
    ),

    reservationPartialPaymentAmount: Math.max(
      0,
      Math.min(
        Number(merged.reservationAmount) || 0,
        Number(merged.reservationPartialPaymentAmount) || 0,
      ),
    ),

    reservationPaymentRequired:
      Boolean(merged.reservationPaymentRequired),

    // Notifications
    queueNotificationsEnabled:
      Boolean(merged.queueNotificationsEnabled),

    reservationNotificationsEnabled:
      Boolean(merged.reservationNotificationsEnabled),
  };
}

// =========================================================
// PROVIDER
// =========================================================

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  // =======================================================
  // LOAD SETTINGS
  // =======================================================

  const [settings, setSettings] = useState<CafeSettings>(() => {
    try {
      const stored = localStorage.getItem(
        SETTINGS_STORAGE_KEY,
      );

      if (!stored) {
        return DEFAULT_SETTINGS;
      }

      const parsed = JSON.parse(stored);

      return normalizeSettings(parsed);
    } catch (error) {
      console.error(
        "Failed to load Smart Cafe settings:",
        error,
      );

      return DEFAULT_SETTINGS;
    }
  });

  // =======================================================
  // SAVE SETTINGS
  // =======================================================

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  }, [settings]);

  // =======================================================
  // UPDATE SETTINGS
  // =======================================================

  const updateSettings = (
    updates: Partial<CafeSettings>,
  ) => {
    setSettings((currentSettings) =>
      normalizeSettings({
        ...currentSettings,
        ...updates,
      }),
    );
  };

  // =======================================================
  // RESET SETTINGS
  // =======================================================

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
    }),
    [settings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// =========================================================
// CUSTOM HOOK
// =========================================================

export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider",
    );
  }

  return context;
}