// =========================================================
// SMART CAFE - ADMIN SETTINGS PAGE
// =========================================================

import { useEffect, useState } from "react";

import {
  useSettings,
} from "../../context/SettingsContext";

import type { CafeSettings } from "../../types/Settings";

// =========================================================
// SMART CAFE - ADMIN SETTINGS
// =========================================================
//
// This page allows the admin to configure Smart Cafe
// business rules without changing source code.
//
// IMPORTANT:
//
// Admin edits a local draft first.
//
// SettingsContext is updated only when:
//     Save Changes
//
// is clicked.
//
// Validation happens before saving.
//
// =========================================================

export default function AdminSettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
  } = useSettings();

  // =======================================================
  // DRAFT SETTINGS
  // =======================================================
  //
  // The admin edits the draft first.
  //
  // The real SettingsContext is updated only after
  // clicking Save Changes.
  //
  // =======================================================

  const [draftSettings, setDraftSettings] =
    useState(settings);

  // =======================================================
  // TEMPORARY NUMBER INPUT VALUES
  // =======================================================
  //
  // Number inputs are temporarily stored as strings
  // while the user is typing.
  //
  // This allows:
  //
  // 10 -> "" -> 20
  //
  // without React forcing a number immediately.
  //
  // =======================================================

  const [numberInputs, setNumberInputs] =
    useState<Record<string, string>>({});

  // =======================================================
  // SAVE STATE
  // =======================================================

  const [saved, setSaved] =
    useState(false);

  // =======================================================
  // DIRTY STATE
  // =======================================================
  //
  // true = there are unsaved changes.
  //
  // =======================================================

  const [hasChanges, setHasChanges] =
    useState(false);

  // =======================================================
  // VALIDATION ERROR
  // =======================================================
  //
  // Stores a user-friendly validation message.
  //
  // Empty string = no validation error.
  //
  // =======================================================

  const [validationError, setValidationError] =
    useState("");

  // =======================================================
  // SYNCHRONIZE DRAFT WHEN SETTINGS CHANGE
  // =======================================================

  useEffect(() => {
    setDraftSettings(settings);
    setNumberInputs({});
    setHasChanges(false);
    setValidationError("");
  }, [settings]);

  // =======================================================
  // UPDATE DRAFT VALUE
  // =======================================================

  function updateDraft(
    updates: Partial<typeof settings>,
  ) {
    setDraftSettings((current) => ({
      ...current,
      ...updates,
    }));

    setHasChanges(true);

    setSaved(false);

    // Clear an old validation message when the admin
    // starts correcting a setting.
    setValidationError("");
  }

  // =======================================================
  // GET NUMBER INPUT VALUE
  // =======================================================

  function getNumberInputValue(
    key: keyof typeof settings,
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        numberInputs,
        key,
      )
    ) {
      return numberInputs[key];
    }

    return String(draftSettings[key]);
  }

  // =======================================================
  // HANDLE NUMBER TYPING
  // =======================================================

  function handleNumberChange(
    key:
      | "gamingDurationMinutes"
      | "gamingClosingCountdownMinutes"
      | "queueWaitTimePerPositionMinutes"
      | "queueProjectedUsageMinutes"
      | "reservationTurnoverBufferMinutes"
      | "reservationAmount"
      | "reservationPartialPaymentAmount",
    value: string,
  ) {
    // -----------------------------------------------------
    // Allow empty input while editing.
    // -----------------------------------------------------

    if (value === "") {
      setNumberInputs((current) => ({
        ...current,
        [key]: "",
      }));

      setHasChanges(true);
      setSaved(false);
      setValidationError("");

      return;
    }

    // -----------------------------------------------------
    // Only allow numbers and decimal values.
    // -----------------------------------------------------

    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // -----------------------------------------------------
    // Store temporary text.
    // -----------------------------------------------------

    setNumberInputs((current) => ({
      ...current,
      [key]: value,
    }));

    setHasChanges(true);
    setSaved(false);

    // Clear previous validation error.
    setValidationError("");
  }

  // =======================================================
  // HANDLE NUMBER BLUR
  // =======================================================
  //
  // Convert temporary text into the draft settings.
  //
  // IMPORTANT:
  //
  // This does NOT save to SettingsContext.
  //
  // =======================================================

  function handleNumberBlur(
    key:
      | "gamingDurationMinutes"
      | "gamingClosingCountdownMinutes"
      | "queueWaitTimePerPositionMinutes"
      | "queueProjectedUsageMinutes"
      | "reservationTurnoverBufferMinutes"
      | "reservationAmount"
      | "reservationPartialPaymentAmount",
  ) {
    const rawValue =
      numberInputs[key];

    // -----------------------------------------------------
    // Empty input
    // -----------------------------------------------------
    //
    // Do not overwrite the existing draft value.
    //
    // The save validation will handle invalid states.
    //
    // -----------------------------------------------------

    if (
      rawValue === undefined ||
      rawValue === ""
    ) {
      setNumberInputs((current) => {
        const updated = {
          ...current,
        };

        delete updated[key];

        return updated;
      });

      return;
    }

    const numberValue =
      Number(rawValue);

    // -----------------------------------------------------
    // Ignore invalid numeric values.
    // -----------------------------------------------------

    if (!Number.isFinite(numberValue)) {
      return;
    }

    // -----------------------------------------------------
    // Update ONLY the draft.
    // -----------------------------------------------------

    updateDraft({
      [key]: numberValue,
    });

    // -----------------------------------------------------
    // Remove temporary value.
    // -----------------------------------------------------

    setNumberInputs((current) => {
      const updated = {
        ...current,
      };

      delete updated[key];

      return updated;
    });
  }

  // =======================================================
  // VALIDATE SETTINGS
  // =======================================================
  //
  // Returns:
  //
  // "" = valid
  //
  // "message" = invalid
  //
  // =======================================================

  function validateSettings(
    values: CafeSettings,
  ): string {
    // -----------------------------------------------------
    // Gaming duration
    // -----------------------------------------------------

    if (
      values.gamingDurationMinutes < 5 ||
      values.gamingDurationMinutes > 1440
    ) {
      return (
        "Gaming duration must be between 5 and 1440 minutes."
      );
    }

    // -----------------------------------------------------
    // Gaming closing countdown
    // -----------------------------------------------------

    if (
      values.gamingClosingCountdownMinutes < 0 ||
      values.gamingClosingCountdownMinutes > 60
    ) {
      return (
        "Gaming closing countdown must be between 0 and 60 minutes."
      );
    }

    // -----------------------------------------------------
    // Gaming relationship
    // -----------------------------------------------------
    //
    // Closing countdown cannot be longer than the
    // complete gaming session.
    //
    // Example:
    //
    // Gaming = 30 minutes
    // Closing = 40 minutes
    //
    // Invalid.
    //
    // -----------------------------------------------------

    if (
      values.gamingClosingCountdownMinutes >
      values.gamingDurationMinutes
    ) {
      return (
        "Gaming closing countdown cannot be greater than the gaming duration."
      );
    }

    // -----------------------------------------------------
    // Queue wait time
    // -----------------------------------------------------

    if (
      values.queueWaitTimePerPositionMinutes < 1 ||
      values.queueWaitTimePerPositionMinutes > 120
    ) {
      return (
        "Queue wait time must be between 1 and 120 minutes."
      );
    }

    // -----------------------------------------------------
    // Queue projected usage
    // -----------------------------------------------------

    if (
      values.queueProjectedUsageMinutes < 5 ||
      values.queueProjectedUsageMinutes > 1440
    ) {
      return (
        "Queue projected usage must be between 5 and 1440 minutes."
      );
    }

    // -----------------------------------------------------
    // Reservation turnover buffer
    // -----------------------------------------------------

    if (
      values.reservationTurnoverBufferMinutes < 0 ||
      values.reservationTurnoverBufferMinutes > 120
    ) {
      return (
        "Reservation turnover buffer must be between 0 and 120 minutes."
      );
    }

    // -----------------------------------------------------
    // Reservation amount
    // -----------------------------------------------------

    if (
      values.reservationAmount < 0
    ) {
      return (
        "Reservation amount cannot be negative."
      );
    }

    // -----------------------------------------------------
    // Partial payment
    // -----------------------------------------------------

    if (
      values.reservationPartialPaymentAmount < 0
    ) {
      return (
        "Reservation partial payment cannot be negative."
      );
    }

    // -----------------------------------------------------
    // Partial payment relationship
    // -----------------------------------------------------
    //
    // Example:
    //
    // Reservation amount = ₹200
    // Partial payment = ₹300
    //
    // Invalid.
    //
    // -----------------------------------------------------

    if (
      values.reservationPartialPaymentAmount >
      values.reservationAmount
    ) {
      return (
        "Reservation partial payment cannot be greater than the reservation amount."
      );
    }

    // -----------------------------------------------------
    // All validation passed.
    // -----------------------------------------------------

    return "";
  }

  // =======================================================
  // SAVE ALL CHANGES
  // =======================================================

  function handleSave() {
    // -----------------------------------------------------
    // Make a copy of the draft.
    // -----------------------------------------------------

    const cleanedSettings: CafeSettings = {
      ...draftSettings,
    };

    // -----------------------------------------------------
    // Convert temporary number inputs into numbers.
    // -----------------------------------------------------

    (
      [
        "gamingDurationMinutes",
        "gamingClosingCountdownMinutes",
        "queueWaitTimePerPositionMinutes",
        "queueProjectedUsageMinutes",
        "reservationTurnoverBufferMinutes",
        "reservationAmount",
        "reservationPartialPaymentAmount",
      ] as const
    ).forEach((key) => {
      const rawValue =
        numberInputs[key];

      if (
        rawValue !== undefined &&
        rawValue !== ""
      ) {
        const numberValue =
          Number(rawValue);

        if (Number.isFinite(numberValue)) {
          cleanedSettings[key] =
            numberValue;
        }
      }
    });

    // =====================================================
    // VALIDATION
    // =====================================================

    const error =
      validateSettings(cleanedSettings);

    // -----------------------------------------------------
    // Stop if validation fails.
    // -----------------------------------------------------

    if (error) {
      setValidationError(error);
      setSaved(false);

      return;
    }

    // -----------------------------------------------------
    // Validation passed.
    // -----------------------------------------------------

    setValidationError("");

    // =====================================================
    // SAVE TO SETTINGS CONTEXT
    // =====================================================

    updateSettings(
      cleanedSettings,
    );

    // -----------------------------------------------------
    // Clear temporary inputs.
    // -----------------------------------------------------

    setNumberInputs({});

    setHasChanges(false);

    // -----------------------------------------------------
    // Show success message.
    // -----------------------------------------------------

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  // =======================================================
  // RESET SETTINGS
  // =======================================================

  function handleReset() {
    const confirmed =
      window.confirm(
        "Reset all Smart Cafe settings to their default values?",
      );

    if (!confirmed) {
      return;
    }

    // -----------------------------------------------------
    // Reset Context
    // -----------------------------------------------------

    resetSettings();

    // -----------------------------------------------------
    // Clear temporary values.
    // -----------------------------------------------------

    setNumberInputs({});

    setHasChanges(false);

    setValidationError("");

    // -----------------------------------------------------
    // Show success message.
    // -----------------------------------------------------

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="admin-settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-page-header">

        <div>

          <h1>
            Admin Settings
          </h1>

          <p>
            Manage Smart Cafe business rules and
            application configuration.
          </p>

        </div>

        {/* ===============================================
            SAVE AREA
        =============================================== */}

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
              background: hasChanges
                ? "#2563eb"
                : "#9ca3af",
              color: "#fff",
              cursor: hasChanges
                ? "pointer"
                : "not-allowed",
              fontWeight: 700,
              fontSize: "14px",
              boxShadow: hasChanges
                ? "0 2px 6px rgba(37, 99, 235, 0.25)"
                : "none",
            }}
          >
            Save Changes
          </button>

        </div>

      </div>


      {/* =================================================
          VALIDATION ERROR
      ================================================= */}

      {validationError && (
        <div className="admin-settings-error">
          <strong>Unable to save settings:</strong>
          <div>
            {validationError}
          </div>
        </div>
      )}


      {/* =================================================
          UNSAVED CHANGES NOTICE
      ================================================= */}

      {hasChanges && (
        <div
          style={{
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            fontWeight: 500,
          }}
        >
          You have unsaved changes. Click
          <strong> Save Changes </strong>
          to apply them.
        </div>
      )}


      {/* =================================================
          RESTAURANT INFORMATION
      ================================================= */}

      <section className="admin-settings-card">

        <div className="admin-settings-card-header">

          <h2>
            Restaurant Information
          </h2>

          <p>
            Basic information displayed throughout
            the Smart Cafe application.
          </p>

        </div>


        <div className="admin-settings-grid">

          <label className="admin-settings-field">

            <span>
              Restaurant Name
            </span>

            <input
              type="text"
              value={
                draftSettings.restaurantName
              }
              onChange={(event) =>
                updateDraft({
                  restaurantName:
                    event.target.value,
                })
              }
            />

          </label>


          <label className="admin-settings-field">

            <span>
              Phone Number
            </span>

            <input
              type="text"
              value={
                draftSettings.restaurantPhone
              }
              onChange={(event) =>
                updateDraft({
                  restaurantPhone:
                    event.target.value,
                })
              }
            />

          </label>


          <label className="admin-settings-field admin-settings-full">

            <span>
              Address
            </span>

            <textarea
              value={
                draftSettings.restaurantAddress
              }
              onChange={(event) =>
                updateDraft({
                  restaurantAddress:
                    event.target.value,
                })
              }
              rows={3}
            />

          </label>

        </div>

      </section>


      {/* =================================================
          GAMING
      ================================================= */}

      <section className="admin-settings-card">

        <div className="admin-settings-card-header">

          <h2>
            Gaming
          </h2>

          <p>
            Control gaming session duration and the
            final closing countdown.
          </p>

        </div>


        <div className="admin-settings-grid">

          <label className="admin-settings-field">

            <span>
              Gaming Duration (minutes)
            </span>

            <input
              type="number"
              min="5"
              max="1440"
              value={getNumberInputValue(
                "gamingDurationMinutes",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "gamingDurationMinutes",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "gamingDurationMinutes",
                )
              }
            />

            <small>
              Default: 60 minutes per order.
            </small>

          </label>


          <label className="admin-settings-field">

            <span>
              Closing Countdown (minutes)
            </span>

            <input
              type="number"
              min="0"
              max="60"
              value={getNumberInputValue(
                "gamingClosingCountdownMinutes",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "gamingClosingCountdownMinutes",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "gamingClosingCountdownMinutes",
                )
              }
            />

            <small>
              Default: 5 minutes before gaming ends.
            </small>

          </label>

        </div>

      </section>


      {/* =================================================
          WAITING LOUNGE / QUEUE
      ================================================= */}

      <section className="admin-settings-card">

        <div className="admin-settings-card-header">

          <h2>
            Waiting Lounge & Queue
          </h2>

          <p>
            Configure estimated waiting times and
            projected table usage.
          </p>

        </div>


        <div className="admin-settings-grid">

          <label className="admin-settings-field">

            <span>
              Wait Time Per Position (minutes)
            </span>

            <input
              type="number"
              min="1"
              max="120"
              value={getNumberInputValue(
                "queueWaitTimePerPositionMinutes",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "queueWaitTimePerPositionMinutes",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "queueWaitTimePerPositionMinutes",
                )
              }
            />

            <small>
              Default: 10 minutes per queue
              position.
            </small>

          </label>


          <label className="admin-settings-field">

            <span>
              Projected Table Usage (minutes)
            </span>

            <input
              type="number"
              min="5"
              max="1440"
              value={getNumberInputValue(
                "queueProjectedUsageMinutes",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "queueProjectedUsageMinutes",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "queueProjectedUsageMinutes",
                )
              }
            />

            <small>
              Used when estimating future table
              availability.
            </small>

          </label>

        </div>


        <div className="admin-settings-toggle">

          <div>

            <strong>
              Queue Notifications
            </strong>

            <p>
              Enable customer notifications related
              to the Waiting Lounge queue.
            </p>

          </div>


          <input
            type="checkbox"
            checked={
              draftSettings.queueNotificationsEnabled
            }
            onChange={(event) =>
              updateDraft({
                queueNotificationsEnabled:
                  event.target.checked,
              })
            }
          />

        </div>

      </section>


      {/* =================================================
          RESERVATIONS
      ================================================= */}

      <section className="admin-settings-card">

        <div className="admin-settings-card-header">

          <h2>
            Reservations
          </h2>

          <p>
            Configure reservation protection and
            payment behaviour.
          </p>

        </div>


        <div className="admin-settings-grid">

          <label className="admin-settings-field">

            <span>
              Turnover Buffer (minutes)
            </span>

            <input
              type="number"
              min="0"
              max="120"
              value={getNumberInputValue(
                "reservationTurnoverBufferMinutes",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "reservationTurnoverBufferMinutes",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "reservationTurnoverBufferMinutes",
                )
              }
            />

            <small>
              Default: 10 minutes after a
              reservation ends.
            </small>

          </label>


          <label className="admin-settings-field">

            <span>
              Reservation Amount (₹)
            </span>

            <input
              type="number"
              min="0"
              value={getNumberInputValue(
                "reservationAmount",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "reservationAmount",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "reservationAmount",
                )
              }
            />

            <small>
              Reservation amount configured by
              the admin.
            </small>

          </label>


          <label className="admin-settings-field">

            <span>
              Partial Payment Amount (₹)
            </span>

            <input
              type="number"
              min="0"
              value={getNumberInputValue(
                "reservationPartialPaymentAmount",
              )}
              onChange={(event) =>
                handleNumberChange(
                  "reservationPartialPaymentAmount",
                  event.target.value,
                )
              }
              onBlur={() =>
                handleNumberBlur(
                  "reservationPartialPaymentAmount",
                )
              }
            />

            <small>
              Cannot be greater than the
              reservation amount.
            </small>

          </label>

        </div>


        <div className="admin-settings-toggle">

          <div>

            <strong>
              Require Reservation Payment
            </strong>

            <p>
              When disabled, customers can reserve
              without paying an advance.
            </p>

          </div>


          <input
            type="checkbox"
            checked={
              draftSettings.reservationPaymentRequired
            }
            onChange={(event) =>
              updateDraft({
                reservationPaymentRequired:
                  event.target.checked,
              })
            }
          />

        </div>


        <div className="admin-settings-toggle">

          <div>

            <strong>
              Reservation Notifications
            </strong>

            <p>
              Enable customer notifications related
              to reservations.
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
          />

        </div>

      </section>


      {/* =================================================
          BOTTOM ACTION BAR
      ================================================= */}

      <section
        className="admin-settings-card"
        style={{
          position: "sticky",
          bottom: "16px",
          zIndex: 10,
          boxShadow:
            "0 4px 20px rgba(0, 0, 0, 0.08)",
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

            <h2
              style={{
                marginBottom: "6px",
              }}
            >
              Save Settings
            </h2>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >
              Review your changes and save them
              when you're ready.
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
              background: hasChanges
                ? "#2563eb"
                : "#9ca3af",
              color: "#fff",
              cursor: hasChanges
                ? "pointer"
                : "not-allowed",
              fontWeight: 700,
              fontSize: "15px",
              minWidth: "150px",
              boxShadow: hasChanges
                ? "0 3px 8px rgba(37, 99, 235, 0.25)"
                : "none",
            }}
          >
            Save Changes
          </button>

        </div>

      </section>


      {/* =================================================
          RESET SETTINGS
      ================================================= */}

      <section className="admin-settings-card">

        <div className="admin-settings-card-header">

          <h2>
            Reset Settings
          </h2>

          <p>
            Restore all settings to the original
            Smart Cafe defaults.
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