import type { ReactNode } from "react";
import { cx } from "./cx";
import { Pictogram } from "./pictogram";

export type QuestionCardProps = {
  /** The one question the workshop holds fixed. */
  readonly question: ReactNode;
  /** Small label above the question ("Eine Frage, fest gehalten"). */
  readonly label?: ReactNode;
  /**
   * `paper` is the Bogen sheet; `sky` is the old pastel sheet (brand-sky at
   * 40% over paper) for a cover. There is no graphit tone any more.
   */
  readonly tone?: "paper" | "sky";
  /** `hero` sets the question larger, for a cover. */
  readonly size?: "default" | "hero";
  /**
   * `compact` tightens the card below sm (smaller pictogram, padding and
   * question type) and hands back the default values from sm.
   */
  readonly density?: "default" | "compact";
  readonly className?: string;
};

/**
 * The deck's q-card: square question pictogram, small label, the question,
 * an ink outline, and a Mennige bar on the left. It is the only element on
 * the site with a left bar, and it appears at most once per page.
 *
 * Both tones are light grounds with the page's ink and Schiefer text
 * (Schiefer 6.2:1 on the sky sheet). The bar stays true Mennige, a non-text
 * mark above the 3:1 floor on either sheet.
 */
export function QuestionCard({
  question,
  label,
  tone = "paper",
  size = "default",
  density = "default",
  className,
}: QuestionCardProps) {
  const sky = tone === "sky";
  const compact = density === "compact";

  return (
    <figure
      data-question-card={tone}
      className={cx(
        "relative grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-4 border py-5 pl-7 pr-6 sm:grid-cols-[2.5rem_minmax(0,1fr)]",
        compact &&
          "grid-cols-[1.5rem_minmax(0,1fr)] gap-3 py-3.5 pl-5 pr-4 sm:gap-4 sm:py-5 sm:pl-7 sm:pr-6",
        sky ? "border-foreground bg-sky-sheet" : "border-foreground bg-card",
        className,
      )}
    >
      <span
        aria-hidden="true"
        data-question-card-bar=""
        className="absolute -inset-y-px -left-px w-1.5 bg-mennige"
      />
      <Pictogram
        name="question"
        strokeWidth={2}
        className={cx("size-8 text-foreground sm:size-10", compact && "size-6")}
      />
      <div className="min-w-0">
        {label ? (
          <figcaption className="text-label text-muted-foreground">{label}</figcaption>
        ) : null}
        <blockquote
          className={cx(
            "font-semibold text-foreground text-pretty",
            label ? "mt-1" : undefined,
            size === "hero"
              ? "text-[1.375rem] leading-snug sm:text-[1.75rem] sm:leading-[1.2]"
              : "text-[1.25rem] leading-snug sm:text-[1.375rem]",
            compact && "text-[1.0625rem]",
          )}
        >
          {question}
        </blockquote>
      </div>
    </figure>
  );
}
