"use client";

import { useSyncExternalStore } from "react";
import {
  getProgressSyncFailure,
  getServerProgressSyncFailure,
  subscribeProgressSyncFailure,
} from "@/lib/progress/sync-status";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    permanent:
      "Die Server-Synchronisierung wurde wegen einer nicht wiederholbaren Antwort angehalten. Dein Fortschritt bleibt in diesem Browser gespeichert, ist auf anderen Geräten aber möglicherweise nicht aktuell.",
    retry_exhausted:
      "Die Server-Synchronisierung ist nach mehreren Versuchen weiterhin fehlgeschlagen. Dein Fortschritt bleibt in diesem Browser gespeichert und wird bei einer neuen Änderung oder wiederhergestellter Verbindung erneut übertragen.",
    startup:
      "Die Server-Synchronisierung konnte nicht gestartet werden. Dein Fortschritt bleibt in diesem Browser gespeichert, bis die Verbindung erneut geprüft werden kann.",
  },
  en: {
    permanent:
      "Server synchronisation stopped after a non-retryable response. Your progress remains stored in this browser, but it may not be current on other devices.",
    retry_exhausted:
      "Server synchronisation still failed after several attempts. Your progress remains stored in this browser and will be sent again after a new change or when the connection is restored.",
    startup:
      "Server synchronisation could not start. Your progress remains stored in this browser until the connection can be checked again.",
  },
} as const;

/**
 * Renders the current progress-sync failure, or nothing when sync is healthy.
 *
 * Reads only the standalone sync-status store — never the Supabase browser
 * client — so mounting it on a page does not pull the SDK into first-load JS.
 */
export function ProgressSyncNotice({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const failure = useSyncExternalStore(
    subscribeProgressSyncFailure,
    getProgressSyncFailure,
    getServerProgressSyncFailure,
  );
  if (!failure) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      data-progress-sync-notice={failure}
      className={
        className ??
        "mt-4 border border-amber-700 border-l-[3px] bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-foreground"
      }
    >
      {COPY[locale][failure]}
    </p>
  );
}
