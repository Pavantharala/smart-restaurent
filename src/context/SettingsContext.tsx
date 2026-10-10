
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
// Stores configurable business settings.
//
// Settings are saved in localStorage so they remain
// available after the browser is refreshed.
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

  // Lucky Draw
  // Disabled until the admin enables it.
  luckyDrawEnabled: false,
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

const SettingsContext = createContext<
  SettingsContextType | undefined
>(undefined);

// =========================================================
// NORMALIZE SETTINGS
// =========================================================
//
// Merges saved settings with defaults. This also supports
// older localStorage data that has no Lucky Draw setting.
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
      Math.min(
        1440,
        Number(merged.gamingDurationMinutes) || 60,
      ),
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

    // Reservations
    reservationTurnoverBufferMinutes: Math.max(
      0,
      Math.min(
        120,
        Number(merged.reservationTurnoverBufferMinutes) || 0,
      ),
    ),

    // Reservation payment
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

    // Lucky Draw
    luckyDrawEnabled:
      typeof merged.luckyDrawEnabled === "boolean"
        ? merged.luckyDrawEnabled
        : DEFAULT_SETTINGS.luckyDrawEnabled,
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
  // Load and validate saved settings.
  const [settings, setSettings] = useState<CafeSettings>(() => {
    try {
      const stored = localStorage.getItem(
        SETTINGS_STORAGE_KEY,
      );

      if (!stored) {
        return DEFAULT_SETTINGS;
      }

      const parsed: unknown = JSON.parse(stored);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return DEFAULT_SETTINGS;
      }

      return normalizeSettings(
        parsed as Partial<CafeSettings>,
      );
    } catch (error) {
      console.error(
        "Failed to load Smart Cafe settings:",
        error,
      );

      return DEFAULT_SETTINGS;
    }
  });

  // Save settings whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error(
        "Failed to save Smart Cafe settings:",
        error,
      );
    }
  }, [settings]);

  // Update selected settings while preserving the rest.
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

  // Restore all settings to their defaults.
  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
  };

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
