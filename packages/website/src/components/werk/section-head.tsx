import type { ReactNode } from "react";
import { cx } from "./cx";

export type SectionHeadProps = {
  readonly title: ReactNode;
  /** id for the heading, so the section can use aria-labelledby. */
  readonly id?: string;
  readonly as?: "h2" | "h3";
  /** Short factual note, right-aligned on wide screens ("Kostenlos, ohne Konto"). */
  readonly caption?: ReactNode;
  /** Optional one-line description under the heading. */
  readonly description?: ReactNode;
  readonly className?: string;
};

/**
 * Section head with a Kopflinie: a 2px ink rule, then the heading and an
 * optional right-aligned caption on one baseline. Replaces orange left rules
 * and eyebrow-plus-heading stacks. Content below should start about mt-8.
 */
export function SectionHead({
  title,
  id,
  as: Heading = "h2",
  caption,
  description,
  className,
}: SectionHeadProps) {
  return (
    <header className={cx("border-t-2 border-foreground pt-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Heading
          id={id}
          className={cx(
            "font-bold text-foreground",
            Heading === "h2" ? "text-fluid-h2" : "text-fluid-h3",
          )}
        >
          {title}
        </Heading>
        {caption ? (
          <p className="text-caption text-muted-foreground tabular-nums">{caption}</p>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 max-w-[64ch] text-body text-muted-foreground text-pretty">
          {description}
        </p>
      ) : null}
    </header>
  );
}
