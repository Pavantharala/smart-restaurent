
import { useEffect, useRef, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import type { QueueEntry } from "../types/Queue";
import "./QueueReadyNotification.css";

interface QueueReadyNotificationProps {
  queueEntry: QueueEntry;
}

export default function QueueReadyNotification({
  queueEntry,
}: QueueReadyNotificationProps) {
  const { settings } = useSettings();
  const previousStatus = useRef(queueEntry.status);
  const [showNotice, setShowNotice] = useState(false);

  useEffect(() => {
    const becameReady =
      previousStatus.current !== "table-ready" &&
      queueEntry.status === "table-ready";

    previousStatus.current = queueEntry.status;

    if (
      !becameReady ||
      !settings.queueNotificationsEnabled ||
      !queueEntry.notifyWhenReady
    ) {
      return;
    }

    setShowNotice(true);

    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Your table is ready!", {
          body: "Please proceed to your assigned table.",
        });
      } catch (error) {
        console.warn("Browser notification unavailable:", error);
      }
    }
  }, [
    queueEntry.status,
    queueEntry.notifyWhenReady,
    settings.queueNotificationsEnabled,
  ]);

  if (!showNotice || queueEntry.status !== "table-ready") {
    return null;
  }

  return (
    <section
      className="queue-ready-notification"
      role="status"
      aria-live="polite"
    >
      <CheckCircle size={24} />

      <div>
        <strong>Your table is ready!</strong>
        <p>Please proceed to your assigned table.</p>
      </div>

      <button
        type="button"
        onClick={() => setShowNotice(false)}
        aria-label="Dismiss notification"
      >
        Dismiss
      </button>
    </section>
  );
}
