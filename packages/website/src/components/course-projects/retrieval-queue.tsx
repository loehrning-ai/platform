"use client";

import { useCallback, useEffect, useState, type JSX } from "react";
import Link from "next/link";
import type { CourseSlug } from "@/lib/course/types";
import {
  readCourseRetrievalQueue,
  type CourseRetrievalQueueSnapshot,
  type RetrievalStanding,
} from "@/lib/course-projects/retrieval-queue";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { courseLessonHref } from "@/lib/courses/resume";
import { useLearningOwnerGeneration } from "@/lib/progress/use-learning-owner-generation";

const QUEUE_COPY = {
  de: {
    eyebrow: "Verteiltes Abrufen",
    title: "Abrufwarteschlange",
    due: (count: number) =>
      count === 1 ? "1 Abruf ist fällig" : `${count} Abrufe sind fällig`,
    current: "Aktuelle Lektion",
    unavailableShort: "Lokal nicht aktiviert",
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
    openDueLesson: "Fällige Lektion öffnen",
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
    unavailableShort: "Local mode inactive",
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
    openDueLesson: "Open due lesson",
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
  const [manuallyExpanded, setManuallyExpanded] = useState<boolean | null>(
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
  const expanded = manuallyExpanded ?? (available && dueCount > 0);
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
  const currentLessonHref = localizeHref(
    courseLessonHref(courseSlug, currentLessonId),
    locale,
  );
  const currentLessonPath = currentLessonHref.split("#", 1)[0];

  return (
    <section
      aria-labelledby="course-retrieval-queue-title"
      className="mb-6 min-w-0 border-2 border-foreground bg-card [overflow-wrap:anywhere]"
    >
      <div
        data-retrieval-queue-header
        className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-3 sm:flex sm:px-4"
      >
        <span className="h-3 w-3 shrink-0 rounded-full bg-brand-orange ring-4 ring-brand-orange/20" />
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs font-black uppercase tracking-[0.16em] text-brand-orange-dark">
            {copy.eyebrow}
          </span>
          <span
            id="course-retrieval-queue-title"
            className="block text-base font-black tracking-[-0.02em] text-foreground"
          >
            {copy.title}
          </span>
        </span>
        <span
          role="status"
          aria-live="polite"
          className="col-start-2 row-start-2 min-w-0 text-left font-mono text-xs font-black uppercase tracking-[0.06em] text-foreground [overflow-wrap:anywhere] sm:shrink-0 sm:text-right"
        >
          {available ? copy.due(dueCount) : copy.unavailableShort}
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="course-retrieval-queue-body"
          onClick={() => {
            setManuallyExpanded(
              (value) => !(value ?? (available && dueCount > 0)),
            );
          }}
          className="col-start-3 row-span-2 row-start-1 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border-2 border-foreground bg-background font-mono text-lg font-black outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          <span
            aria-hidden="true"
            className={`transition-transform motion-reduce:transition-none ${expanded ? "rotate-45" : ""}`}
          >
            +
          </span>
          <span className="sr-only">{copy.title}</span>
        </button>
      </div>

      <div
        id="course-retrieval-queue-body"
        hidden={!expanded}
        className="grid min-w-0 border-t-2 border-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)]"
      >
        <div className="min-w-0 p-4">
          <div className="border-l-4 border-brand-orange bg-background p-3">
            <p className="font-mono text-xs font-black uppercase tracking-[0.14em] text-brand-orange-dark">
              {copy.current}
            </p>
            {!available ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.unavailable}
              </p>
            ) : current === null ? (
              <p className="mt-1 text-sm font-semibold text-foreground">
                {copy.unscheduled}
              </p>
            ) : (
              <div className="mt-1 text-sm text-foreground">
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
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="max-w-[68ch] text-muted-foreground">
                      {legacyDue ? copy.legacyInstruction : copy.dueInstruction}
                    </p>
                    <a
                      href="#lesson-mission-control"
                      className="inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-brand-orange px-4 font-mono text-xs font-black uppercase tracking-[0.1em] text-white outline-none hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none"
                    >
                      {legacyDue ? copy.legacyOpen : copy.open}
                    </a>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {otherDueLessonIds.length > 0 ? (
            <div className="mt-3 border-t border-foreground pt-3">
              <h3 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-foreground">
                {copy.otherDue} · {otherDueLessonIds.length}
              </h3>
              <ul
                aria-label={copy.otherDue}
                className="mt-2 flex min-w-0 flex-wrap gap-2"
              >
                {visibleOtherDueLessonIds.map((lessonId) => {
                  const href = localizeHref(
                    courseLessonHref(courseSlug, lessonId),
                    locale,
                  );
                  const sameDocumentLessonFragment =
                    href.includes("#lesson=") &&
                    href.split("#", 1)[0] === currentLessonPath;
                  const label = `${copy.openDueLesson}: ${lessonId}`;
                  const className =
                    "inline-flex min-h-11 max-w-full items-center border border-foreground bg-background px-3 py-2 font-mono text-xs font-black underline-offset-4 [overflow-wrap:anywhere] hover:text-brand-orange hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

                  return (
                    <li key={lessonId} className="max-w-full">
                      {sameDocumentLessonFragment ? (
                        /* Native navigation is intentional: the block reader
                           consumes same-document lesson fragments through the
                           browser's hashchange event. */
                        <a
                          href={href}
                          aria-label={label}
                          className={className}
                          data-native-lesson-fragment="true"
                        >
                          {lessonId}
                        </a>
                      ) : (
                        <Link
                          href={href}
                          aria-label={label}
                          className={className}
                        >
                          {lessonId}
                        </Link>
                      )}
                    </li>
                  );
                })}
                {remainingDueCount > 0 ? (
                  <li className="border border-dashed border-foreground px-3 py-2 font-mono text-xs font-black">
                    {copy.remainingDue(remainingDueCount)}
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <p className="mt-3 max-w-[76ch] text-xs leading-snug text-muted-foreground">
            {copy.localBoundary}
          </p>
        </div>

        <div className="flex min-w-0 flex-col items-start justify-between gap-2 border-t-2 border-foreground p-3 lg:items-end lg:border-l-2 lg:border-t-0">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex min-h-11 items-center justify-center border-2 border-foreground bg-foreground px-4 font-mono text-xs font-black uppercase tracking-[0.1em] text-background outline-none hover:border-brand-orange hover:text-[#ffc6aa] focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {copy.refresh}
          </button>
          {snapshot ? (
            <p className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
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
