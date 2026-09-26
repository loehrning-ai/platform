import { cx } from "@/components/werk";

/**
 * One recipe for every course reader's lesson list (course/kurs, Claude,
 * Codex, data infrastructure, operator, AI-Native, DEF, Data Science).
 * Werkzeichnung marks the current lesson by tone, weight and a small ink
 * square, never by an orange left bar or a pastel fill.
 */

/** Row geometry shared by active and idle items: 44px target, no left rule. */
export const LESSON_SIDEBAR_ITEM_BASE_CLASS =
  "flex min-h-11 w-full min-w-0 items-start gap-2 border-l-0 px-2.5 py-2.5 text-left text-[0.875rem] leading-[1.35] outline-none transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-orange motion-reduce:transition-none";

/** The current lesson: tonal fill, 600 weight, ink text. */
export const LESSON_SIDEBAR_ITEM_ACTIVE_CLASS =
  "bg-card-hover font-semibold text-foreground";

/** Every other lesson. */
export const LESSON_SIDEBAR_ITEM_IDLE_CLASS =
  "text-muted-foreground hover:bg-card-hover hover:text-foreground";

/** Leading 10px ink square for the current lesson (aria-hidden span). */
export const LESSON_SIDEBAR_ACTIVE_MARKER_CLASS =
  "mt-[0.3em] block size-2.5 shrink-0 bg-foreground";

/** Lesson number in the leading slot for lessons that are not current. */
export const LESSON_SIDEBAR_NUMBER_CLASS =
  "w-4 shrink-0 text-center text-label text-muted-foreground tabular-nums";

/** Track or module group label above a run of lessons, sentence case. */
export const LESSON_SIDEBAR_GROUP_LABEL_CLASS =
  "mb-2 mt-6 text-label text-muted-foreground first:mt-0";

/** Full class list for one lesson row. */
export function lessonSidebarItemClass(active: boolean): string {
  return cx(
    LESSON_SIDEBAR_ITEM_BASE_CLASS,
    active ? LESSON_SIDEBAR_ITEM_ACTIVE_CLASS : LESSON_SIDEBAR_ITEM_IDLE_CLASS,
  );
}

/**
 * Readers that keep the number visible on every row (Claude, Codex, data
 * infrastructure, operator, Data Science, data engineering) mark the current
 * row with a 6px ink square in the left padding instead of replacing the
 * number. The square sits on the first text line.
 */
export const LESSON_SIDEBAR_ITEM_SQUARE_MARKER_CLASS =
  "relative before:absolute before:left-0 before:top-[1.05rem] before:size-1.5 before:bg-foreground";

/**
 * A lesson or chapter number that stays visible in every row: 12px, 600,
 * tabular. Never Mennige (Mennige text on the tonal fill is 4.4:1) and never
 * mono.
 */
export const LESSON_SIDEBAR_INDEX_CLASS =
  "w-6 shrink-0 text-center text-xs font-semibold tabular-nums";

/** Row classes for a numbered reader: tonal fill, 600 and the ink square. */
export function lessonSidebarLinkClass(active: boolean): string {
  return cx(
    LESSON_SIDEBAR_ITEM_BASE_CLASS,
    active
      ? cx(LESSON_SIDEBAR_ITEM_ACTIVE_CLASS, LESSON_SIDEBAR_ITEM_SQUARE_MARKER_CLASS)
      : LESSON_SIDEBAR_ITEM_IDLE_CLASS,
  );
}

/** Number classes for a numbered reader: ink on the current row. */
export function lessonSidebarIndexClass(active: boolean): string {
  return cx(
    LESSON_SIDEBAR_INDEX_CLASS,
    active ? "text-foreground" : "text-muted-foreground",
  );
}

/** Shorthand used by every reader: the idle and active rows together. */
export const LESSON_SIDEBAR_ITEM_CLASS = {
  active: lessonSidebarItemClass(true),
  idle: lessonSidebarItemClass(false),
} as const;
