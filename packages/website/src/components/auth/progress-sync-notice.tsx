"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { trackProgressSyncFailure } from "@/lib/analytics/events";
import {
  getProgressSyncFailure,
  getServerProgressSyncFailure,
  subscribeProgressSyncFailure,
  type ProgressSyncFailure,
} from "@/lib/progress/sync-status";
import type { Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    permanent:
      "Synchronisierung angehalten. Dein Fortschritt ist in diesem Browser gespeichert, neue Änderungen erreichen andere Geräte aber nicht.",
    retry_exhausted:
      "Synchronisierung fehlgeschlagen. Dein Fortschritt ist in diesem Browser gespeichert und wird später übertragen.",
    startup:
      "Synchronisierung konnte nicht starten. Dein Fortschritt ist in diesem Browser gespeichert.",
  },
  en: {
    permanent:
      "Sync stopped. Your progress is saved in this browser, but new changes do not reach other devices.",
    retry_exhausted:
      "Sync failed. Your progress is saved in this browser and will be sent later.",
    startup: "Sync could not start. Your progress is saved in this browser.",
  },
} as const;

/**
 * Renders the current progress-sync failure, or nothing when sync is healthy.
 *
 * Reads only the standalone sync-status store — never the Supabase browser
 * client — so mounting it on a page does not pull the SDK into first-load JS.
 *
 * Each failure kind is reported at most once per mounted notice. The report
 * runs from an effect, never from render: the store notifies on every change
 * and a render-path call would emit duplicates. Only the failure kind is sent.
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
  const reportedFailures = useRef<ReadonlySet<ProgressSyncFailure>>(new Set());

  useEffect(() => {
    if (!failure || reportedFailures.current.has(failure)) return;
    reportedFailures.current = new Set([...reportedFailures.current, failure]);
    trackProgressSyncFailure(failure);
  }, [failure]);

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
