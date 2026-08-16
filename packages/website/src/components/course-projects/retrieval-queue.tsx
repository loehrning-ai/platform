"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import type { CourseSlug } from "@/lib/course/types";
import {
  readCourseRetrievalQueue,
  type CourseRetrievalQueueSnapshot,
  type RetrievalStanding,
} from "@/lib/course-projects/retrieval-queue";
import type { Locale } from "@/lib/i18n/locale";
import { useLearningOwnerGeneration } from "@/lib/progress/use-learning-owner-generation";

const QUEUE_COPY = {
  de: {
    eyebrow: "Verteiltes Abrufen",
    title: "Abrufwarteschlange",
    due: (count: number) =>
      count === 1 ? "1 Abruf ist fällig" : `${count} Abrufe sind fällig`,
    current: "Aktuelle Lektion",
    unavailable:
      "Der lokale Lernstand ist für die aktuelle Identität noch nicht verfügbar.",
    unscheduled:
      "Noch kein Abrufplan. Schließe den Abruf dieser Lektionsmission ab, um den 1/7/21-Tage-Zyklus zu starten.",
    dueNow: "Jetzt fällig",
    dueInstruction:
      "Gehe zur Lektionsmission und wähle dort den Schritt Abruf.",
    legacyDue: "Erneute Evidenz erforderlich",
    legacyInstruction:
      "Dieser frühere Abruf enthält keinen neuen Ausführungsbeleg. Gehe zur Lektionsmission und schließe Ausführen, Evidenz und Revision erneut ab; erst danach ist Abruf verfügbar.",
    scheduled: "Noch nicht fällig",
    nextDue: "Fällig am",
    open: "Zur aktuellen Lektionsmission",
    legacyOpen: "Evidenz in der Lektionsmission erneuern",
    refresh: "Fälligkeit jetzt prüfen",
    checked: "Geprüft",
    otherDue: "Weitere fällige Lektionen",
    otherDueInstruction:
      "Öffne diese stabilen Lektions-IDs über die Kursnavigation. Direkte Links werden erst angezeigt, wenn die Kursroute eindeutig bekannt ist.",
    remainingDue: (count: number) => `und ${count} weitere`,
    localBoundary:
      "Die Anzeige liest nur feste Lektions-IDs, Stufen und Zeitpunkte aus dem lokalen Lernspeicher. Geschriebene Abrufe werden weder angezeigt noch gespeichert.",
    standings: {
      "repair-required": "Reparatur erforderlich",
      passed: "einmal bestanden",
      established: "Abruf gefestigt",
      "spaced-mastery": "verteilte Beherrschung",
    },
  },
  en: {
    eyebrow: "Spaced retrieval",
    title: "Retrieval queue",
    due: (count: number) =>
      count === 1 ? "1 review is due" : `${count} reviews are due`,
    current: "Current lesson",
    unavailable:
      "Local learning state is not available for the current identity yet.",
    unscheduled:
      "No retrieval schedule yet. Complete this lesson mission's retrieval to start the 1/7/21-day cycle.",
    dueNow: "Due now",
    dueInstruction: "Go to the lesson mission, then select the Retrieve step.",
    legacyDue: "Fresh evidence required",
    legacyInstruction:
      "This earlier review has no current Run receipt. Go to the lesson mission and complete Run, Inspect, and Revise again; Retrieve becomes available afterward.",
    scheduled: "Not due yet",
    nextDue: "Due on",
    open: "Go to current lesson mission",
    legacyOpen: "Re-establish lesson mission evidence",
    refresh: "Check due state now",
    checked: "Checked",
    otherDue: "Other due lessons",
    otherDueInstruction:
      "Open these stable lesson IDs from course navigation. Direct links appear only when the course route is known unambiguously.",
    remainingDue: (count: number) => `and ${count} more`,
    localBoundary:
      "This view reads only fixed lesson IDs, levels, and timestamps from local learning storage. Written recall is neither displayed nor stored.",
    standings: {
      "repair-required": "repair required",
      passed: "passed once",
      established: "retrieval established",
      "spaced-mastery": "spaced mastery",
    },
  },
} as const;

const MAX_VISIBLE_DUE_LESSONS = 8;

export interface RetrievalQueueProps {
  readonly courseSlug: CourseSlug;
  readonly currentLessonId: string;
  readonly locale: Locale;
  readonly resetAt: string | null;
  /** Bumps after an in-page retrieval attempt; no polling is required. */
  readonly scheduleRevision?: number;
}

function formatTimestamp(timestamp: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function standingLabel(standing: RetrievalStanding, locale: Locale): string {
  return QUEUE_COPY[locale].standings[standing];
}

export function RetrievalQueue({
  courseSlug,
  currentLessonId,
  locale,
  resetAt,
  scheduleRevision = 0,
}: RetrievalQueueProps): JSX.Element {
  const copy = QUEUE_COPY[locale];
  const ownerGeneration = useLearningOwnerGeneration();
  const [snapshot, setSnapshot] = useState<CourseRetrievalQueueSnapshot | null>(
    null,
  );

  const refresh = useCallback(() => {
    setSnapshot(
      readCourseRetrievalQueue(
        courseSlug,
        currentLessonId,
        resetAt,
        Date.now(),
        ownerGeneration,
      ),
    );
  }, [courseSlug, currentLessonId, ownerGeneration, resetAt]);

  useEffect(() => {
    refresh();
  }, [refresh, scheduleRevision]);

  const available = snapshot?.available ?? false;
  const dueCount = available && snapshot ? snapshot.dueCount : 0;
  const current = available && snapshot ? snapshot.currentLesson : null;
  const legacyDue = current?.due === true && current.nextDueAt === null;
  const otherDueLessonIds =
    available && snapshot
      ? snapshot.dueLessonIds.filter((lessonId) => lessonId !== currentLessonId)
      : [];
  const visibleOtherDueLessonIds = otherDueLessonIds.slice(
    0,
    MAX_VISIBLE_DUE_LESSONS,
  );
  const remainingDueCount =
    otherDueLessonIds.length - visibleOtherDueLessonIds.length;

  return (
    <section
      aria-labelledby="course-retrieval-queue-title"
      className="mb-8 min-w-0 border-2 border-foreground bg-card"
    >
      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 p-5 sm:p-6">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-brand-orange-dark">
            {copy.eyebrow}
          </p>
          <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <h2
              id="course-retrieval-queue-title"
              className="break-words text-2xl font-black tracking-[-0.03em] text-foreground"
            >
              {copy.title}
            </h2>
            <p
              role="status"
              aria-live="polite"
              className="font-mono text-xs font-black uppercase tracking-[0.08em] text-foreground"
            >
              {available ? copy.due(dueCount) : copy.unavailable}
            </p>
          </div>

          <div className="mt-5 border-l-4 border-brand-orange bg-background p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-brand-orange-dark">
              {copy.current}
            </p>
            {!available ? (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {copy.unavailable}
              </p>
            ) : current === null ? (
              <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
                {copy.unscheduled}
              </p>
            ) : (
              <div className="mt-2 text-sm leading-relaxed text-foreground">
                <p className="font-black">
                  {legacyDue
                    ? copy.legacyDue
                    : current.due
                      ? copy.dueNow
                      : copy.scheduled}{" "}
                  · {standingLabel(current.standing, locale)}
                </p>
                {current.nextDueAt ? (
                  <p className="mt-1 text-muted-foreground">
                    {copy.nextDue}:{" "}
                    <time dateTime={current.nextDueAt}>
                      {formatTimestamp(current.nextDueAt, locale)}
                    </time>
                  </p>
                ) : null}
                {current.due ? (
                  <>
                    <p className="mt-2 text-muted-foreground">
                      {legacyDue ? copy.legacyInstruction : copy.dueInstruction}
                    </p>
                    <a
                      href="#lesson-mission-control"
                      className="mt-4 inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-brand-orange px-4 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-white outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {legacyDue ? copy.legacyOpen : copy.open}
                    </a>
                  </>
                ) : null}
              </div>
            )}
          </div>
          <p className="mt-4 max-w-[76ch] text-xs leading-relaxed text-muted-foreground">
            {copy.localBoundary}
          </p>
          {otherDueLessonIds.length > 0 ? (
            <div className="mt-5 border-t-2 border-foreground pt-4">
              <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
                {copy.otherDue} · {otherDueLessonIds.length}
              </h3>
              <p className="mt-2 max-w-[76ch] text-xs leading-relaxed text-muted-foreground">
                {copy.otherDueInstruction}
              </p>
              <ul
                aria-label={copy.otherDue}
                className="mt-3 flex min-w-0 flex-wrap gap-2"
              >
                {visibleOtherDueLessonIds.map((lessonId) => (
                  <li
                    key={lessonId}
                    className="max-w-full border border-foreground bg-background px-3 py-2 font-mono text-[10px] font-black [overflow-wrap:anywhere]"
                  >
                    {lessonId}
                  </li>
                ))}
                {remainingDueCount > 0 ? (
                  <li className="border border-dashed border-foreground px-3 py-2 font-mono text-[10px] font-black">
                    {copy.remainingDue(remainingDueCount)}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col items-start justify-between gap-3 border-t-2 border-foreground p-4 lg:items-end lg:border-l-2 lg:border-t-0">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-foreground px-4 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-background outline-none hover:border-brand-orange hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {copy.refresh}
          </button>
          {snapshot ? (
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              {copy.checked}:{" "}
              <time dateTime={snapshot.checkedAt}>
                {formatTimestamp(snapshot.checkedAt, locale)}
              </time>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
