
import { useEffect, useState } from "react";

import { useSettings } from "../../context/SettingsContext";
import type { CafeSettings } from "../../types/Settings";

// =========================================================
// SMART CAFE - ADMIN SETTINGS PAGE
// =========================================================
//
// The admin edits a draft first. Changes are applied to
// SettingsContext only after Save Changes is clicked.
//
// =========================================================

type NumericSettingKey =
  | "gamingDurationMinutes"
  | "gamingClosingCountdownMinutes"
  | "queueWaitTimePerPositionMinutes"
  | "queueProjectedUsageMinutes"
  | "reservationTurnoverBufferMinutes"
  | "reservationAmount"
  | "reservationPartialPaymentAmount";

export default function AdminSettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettings();

  const [draftSettings, setDraftSettings] =
    useState<CafeSettings>(settings);

  const [numberInputs, setNumberInputs] =
    useState<Partial<Record<NumericSettingKey, string>>>({});

  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Synchronize the draft when the saved settings change.
  useEffect(() => {
    setDraftSettings(settings);
    setNumberInputs({});
    setHasChanges(false);
    setValidationError("");
  }, [settings]);

  // Update the draft without saving it immediately.
  function updateDraft(updates: Partial<CafeSettings>) {
    setDraftSettings((current) => ({
      ...current,
      ...updates,
    }));

    setHasChanges(true);
    setSaved(false);
    setValidationError("");
  }

  function getNumberInputValue(key: NumericSettingKey) {
    const temporaryValue = numberInputs[key];

    return temporaryValue !== undefined
      ? temporaryValue
      : String(draftSettings[key]);
  }

  // Allow temporary empty values while typing.
  function handleNumberChange(
    key: NumericSettingKey,
    value: string,
  ) {
    if (value !== "" && !/^\d*\.?\d*$/.test(value)) {
      return;
    }

    setNumberInputs((current) => ({
      ...current,
      [key]: value,
    }));

    setHasChanges(true);
    setSaved(false);
    setValidationError("");
  }

  // Copy a valid typed number into the draft.
  function handleNumberBlur(key: NumericSettingKey) {
    const rawValue = numberInputs[key];

    if (rawValue === undefined || rawValue === "") {
      return;
    }

    const numberValue = Number(rawValue);

    if (!Number.isFinite(numberValue)) {
      return;
    }

    setDraftSettings((current) => ({
      ...current,
      [key]: numberValue,
    }));

    setNumberInputs((current) => {
      const updated = { ...current };
      delete updated[key];
      return updated;
    });
  }

  function validateSettings(values: CafeSettings): string {
    if (
      values.gamingDurationMinutes < 5 ||
      values.gamingDurationMinutes > 1440
    ) {
      return "Gaming duration must be between 5 and 1440 minutes.";
    }

    if (
      values.gamingClosingCountdownMinutes < 0 ||
      values.gamingClosingCountdownMinutes > 60
    ) {
      return "Gaming closing countdown must be between 0 and 60 minutes.";
    }

    if (
      values.gamingClosingCountdownMinutes >
      values.gamingDurationMinutes
    ) {
      return "Gaming closing countdown cannot be greater than the gaming duration.";
    }

    if (
      values.queueWaitTimePerPositionMinutes < 1 ||
      values.queueWaitTimePerPositionMinutes > 120
    ) {
      return "Queue wait time must be between 1 and 120 minutes.";
    }

    if (
      values.queueProjectedUsageMinutes < 5 ||
      values.queueProjectedUsageMinutes > 1440
    ) {
      return "Queue projected usage must be between 5 and 1440 minutes.";
    }

    if (
      values.reservationTurnoverBufferMinutes < 0 ||
      values.reservationTurnoverBufferMinutes > 120
    ) {
      return "Reservation turnover buffer must be between 0 and 120 minutes.";
    }

    if (values.reservationAmount < 0) {
      return "Reservation amount cannot be negative.";
    }

    if (values.reservationPartialPaymentAmount < 0) {
      return "Reservation partial payment cannot be negative.";
    }

    if (
      values.reservationPartialPaymentAmount >
      values.reservationAmount
    ) {
      return "Reservation partial payment cannot be greater than the reservation amount.";
    }

    return "";
  }

  // Save all draft values after validation.
  function handleSave() {
    const cleanedSettings: CafeSettings = {
      ...draftSettings,
    };

    const numericKeys: NumericSettingKey[] = [
      "gamingDurationMinutes",
      "gamingClosingCountdownMinutes",
      "queueWaitTimePerPositionMinutes",
      "queueProjectedUsageMinutes",
      "reservationTurnoverBufferMinutes",
      "reservationAmount",
      "reservationPartialPaymentAmount",
    ];

    for (const key of numericKeys) {
      const rawValue = numberInputs[key];

      // An empty number field must not silently save an
      // old value while displaying an empty input.
      if (rawValue === "") {
        setValidationError(
          "Please enter a number in every numeric field.",
        );
        setSaved(false);
        return;
      }

      if (rawValue !== undefined) {
        const numberValue = Number(rawValue);

        if (!Number.isFinite(numberValue)) {
          setValidationError(
            "Please enter valid numbers in the settings.",
          );
          setSaved(false);
          return;
        }

        cleanedSettings[key] = numberValue;
      }
    }

    const error = validateSettings(cleanedSettings);

    if (error) {
      setValidationError(error);
      setSaved(false);
      return;
    }

    updateSettings(cleanedSettings);
    setDraftSettings(cleanedSettings);
    setNumberInputs({});
    setHasChanges(false);
    setValidationError("");
    setSaved(true);
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Reset all Smart Cafe settings to their default values?",
    );

    if (!confirmed) {
      return;
    }

    resetSettings();
    setNumberInputs({});
    setHasChanges(false);
    setValidationError("");
    setSaved(true);
  }

  // Reusable numeric field to keep the page consistent.
  function numberField(
    key: NumericSettingKey,
    label: string,
    min: number,
    max?: number,
    help?: string,
  ) {
    return (
      <label className="admin-settings-field" key={key}>
        <span>{label}</span>

        <input
          type="number"
          min={min}
          max={max}
          value={getNumberInputValue(key)}
          onChange={(event) =>
            handleNumberChange(key, event.target.value)
          }
          onBlur={() => handleNumberBlur(key)}
        />

        {help && <small>{help}</small>}
      </label>
    );
  }

  return (
    <div className="admin-settings-page">
      {/* Page header and primary save button */}
      <div className="admin-page-header">
        <div>
          <h1>Admin Settings</h1>
          <p>
            Manage Smart Cafe business rules and application
            configuration.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {saved && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
                border: "1px solid #bbf7d0",
              }}
              role="status"
            >
              ✓ Settings saved successfully
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              padding: "11px 20px",
              borderRadius: "9px",
              border: "none",
              background: hasChanges ? "#2563eb" : "#9ca3af",
              color: "#fff",
              cursor: hasChanges ? "pointer" : "not-allowed",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Validation message */}
      {validationError && (
        <div className="admin-settings-error" role="alert">
          <strong>Unable to save settings:</strong>
          <div>{validationError}</div>
        </div>
      )}

      {/* Unsaved changes warning */}
      {hasChanges && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
          }}
        >
          You have unsaved changes. Click
          <strong> Save Changes </strong>
          to apply them.
        </div>
      )}

      {/* Restaurant information */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Restaurant Information</h2>
          <p>
            Basic information displayed throughout Smart Cafe.
          </p>
        </div>

        <div className="admin-settings-grid">
          <label className="admin-settings-field">
            <span>Restaurant Name</span>
            <input
              type="text"
              value={draftSettings.restaurantName}
              onChange={(event) =>
                updateDraft({
                  restaurantName: event.target.value,
                })
              }
            />
          </label>

          <label className="admin-settings-field">
            <span>Phone Number</span>
            <input
              type="text"
              value={draftSettings.restaurantPhone}
              onChange={(event) =>
                updateDraft({
                  restaurantPhone: event.target.value,
                })
              }
            />
          </label>

          <label className="admin-settings-field admin-settings-full">
            <span>Address</span>
            <textarea
              value={draftSettings.restaurantAddress}
              onChange={(event) =>
                updateDraft({
                  restaurantAddress: event.target.value,
                })
              }
              rows={3}
            />
          </label>
        </div>
      </section>

      {/* Gaming settings */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Gaming</h2>
          <p>
            Control gaming session duration and the closing
            countdown.
          </p>
        </div>

        <div className="admin-settings-grid">
          {numberField(
            "gamingDurationMinutes",
            "Gaming Duration (minutes)",
            5,
            1440,
            "Default: 60 minutes per order.",
          )}

          {numberField(
            "gamingClosingCountdownMinutes",
            "Closing Countdown (minutes)",
            0,
            60,
            "Default: 5 minutes before gaming ends.",
          )}
        </div>
      </section>

      {/* Waiting lounge and queue settings */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Waiting Lounge & Queue</h2>
          <p>
            Configure estimated waiting times and projected
            table usage.
          </p>
        </div>

        <div className="admin-settings-grid">
          {numberField(
            "queueWaitTimePerPositionMinutes",
            "Wait Time Per Position (minutes)",
            1,
            120,
            "Default: 10 minutes per queue position.",
          )}

          {numberField(
            "queueProjectedUsageMinutes",
            "Projected Table Usage (minutes)",
            5,
            1440,
            "Used when estimating future table availability.",
          )}
        </div>

        <div className="admin-settings-toggle">
          <div>
            <strong>Queue Notifications</strong>
            <p>
              Enable customer notifications related to the
              Waiting Lounge queue.
            </p>
          </div>

          <input
            type="checkbox"
            checked={draftSettings.queueNotificationsEnabled}
            onChange={(event) =>
              updateDraft({
                queueNotificationsEnabled: event.target.checked,
              })
            }
            aria-label="Enable queue notifications"
          />
        </div>
      </section>

      {/* Reservation settings */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Reservations</h2>
          <p>
            Configure reservation protection and payment
            behaviour.
          </p>
        </div>

        <div className="admin-settings-grid">
          {numberField(
            "reservationTurnoverBufferMinutes",
            "Turnover Buffer (minutes)",
            0,
            120,
            "Default: 10 minutes after a reservation ends.",
          )}

          {numberField(
            "reservationAmount",
            "Reservation Amount (₹)",
            0,
            undefined,
            "Reservation amount configured by the admin.",
          )}

          {numberField(
            "reservationPartialPaymentAmount",
            "Partial Payment Amount (₹)",
            0,
            undefined,
            "Cannot be greater than the reservation amount.",
          )}
        </div>

        <div className="admin-settings-toggle">
          <div>
            <strong>Require Reservation Payment</strong>
            <p>
              When disabled, customers can reserve without
              paying an advance.
            </p>
          </div>

          <input
            type="checkbox"
            checked={draftSettings.reservationPaymentRequired}
            onChange={(event) =>
              updateDraft({
                reservationPaymentRequired: event.target.checked,
              })
            }
            aria-label="Require reservation payment"
          />
        </div>

        <div className="admin-settings-toggle">
          <div>
            <strong>Reservation Notifications</strong>
            <p>
              Enable customer notifications related to
              reservations.
            </p>
          </div>

          <input
            type="checkbox"
            checked={
              draftSettings.reservationNotificationsEnabled
            }
            onChange={(event) =>
              updateDraft({
                reservationNotificationsEnabled:
                  event.target.checked,
              })
            }
            aria-label="Enable reservation notifications"
          />
        </div>
      </section>

      {/* Lucky Draw settings */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Lucky Draw</h2>
          <p>
            Control whether the Smart Cafe Lucky Draw feature
            is available to customers.
          </p>
        </div>

        <div className="admin-settings-toggle">
          <div>
            <strong>Enable Lucky Draw</strong>
            <p>
              When enabled, customers can access the Lucky Draw
              feature once the customer-facing page is
              implemented. Save changes to apply this setting.
            </p>
          </div>

          <input
            type="checkbox"
            checked={draftSettings.luckyDrawEnabled}
            onChange={(event) =>
              updateDraft({
                luckyDrawEnabled: event.target.checked,
              })
            }
            aria-label="Enable Lucky Draw"
          />
        </div>
      </section>

      {/* Bottom save action */}
      <section
        className="admin-settings-card"
        style={{
          position: "sticky",
          bottom: "16px",
          zIndex: 10,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "6px" }}>
              Save Settings
            </h2>
            <p style={{ margin: 0, color: "#6b7280" }}>
              Review your changes and save them when ready.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              padding: "12px 24px",
              borderRadius: "9px",
              border: "none",
              background: hasChanges ? "#2563eb" : "#9ca3af",
              color: "#fff",
              cursor: hasChanges ? "pointer" : "not-allowed",
              fontWeight: 700,
              fontSize: "15px",
              minWidth: "150px",
            }}
          >
            Save Changes
          </button>
        </div>
      </section>

      {/* Reset settings */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <h2>Reset Settings</h2>
          <p>
            Restore all settings to the original Smart Cafe
            defaults.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #dc2626",
            background: "#fff",
            color: "#dc2626",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Reset to Defaults
        </button>
      </section>
    </div>
  );
}
