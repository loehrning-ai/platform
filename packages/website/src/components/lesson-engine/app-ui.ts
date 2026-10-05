/**
 * Class recipes of the course app: the in-course design system shared by
 * the course hub, the lesson reader, the outline, the final quiz and the
 * certificate (docs/lesson-engine.md, "Course app").
 *
 * Paper grounds, rounded 20-28px sheets, layered soft depth through the
 * `shadow-lab*` tokens only, Kobalt as the interactive accent and Figtree in
 * sentence case. No Kopflinien, no mono caps, no hairline ledgers, no square
 * boxes, no poster numerals and no scene-coloured headings.
 */

/** Visible focus for every control on paper. */
export const APP_FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper";

/** The default raised sheet. */
export const APP_CARD =
  "rounded-[24px] border border-lab-line/80 bg-card shadow-lab";

/** A lighter sheet for rows inside a card. */
export const APP_INSET = "rounded-[20px] bg-paper";

/** Primary action: Kobalt pill, paper text (7.6:1). */
export const APP_PRIMARY =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lab-accent px-6 py-2.5 text-center text-[15px] font-semibold leading-snug text-paper shadow-lab-sm transition-[background-color,transform] duration-150 hover:bg-[#1f3a99] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${APP_FOCUS}`;

/** Secondary action: paper pill with a visible edge. */
export const APP_SECONDARY =
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-5 text-[15px] font-semibold text-foreground transition-[background-color,border-color] duration-150 hover:border-lab-accent/60 hover:bg-lab-accent-soft motion-reduce:transition-none ${APP_FOCUS}`;

/** Quiet text action, for example "back to the course". */
export const APP_GHOST =
  `inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-lab-accent-soft hover:text-foreground motion-reduce:transition-none ${APP_FOCUS}`;

/** Small sentence-case eyebrow above a heading (never mono caps). */
export const APP_EYEBROW = "text-sm font-semibold text-lab-accent";

/** Soft pill for metadata (duration, module). */
export const APP_PILL =
  "inline-flex min-h-7 items-center gap-1.5 rounded-full bg-paper/80 px-2.5 text-[12px] font-medium text-muted-foreground ring-1 ring-lab-line sm:min-h-8 sm:px-3 sm:text-[13px]";

/** Shared easing of every course-app transition. */
export const APP_EASE = [0.16, 1, 0.3, 1] as const;

/** A spring for cards that settle into place (finite, no overshoot loop). */
export const APP_SPRING = { type: "spring", stiffness: 260, damping: 26, mass: 0.9 } as const;

/** Window event LessonFlow fires once the learner moved past "Verstehen". */
export const CONCEPT_SEEN_EVENT = "lesson-engine:concept-seen";
