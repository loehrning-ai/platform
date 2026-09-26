import type { ReactNode } from "react";
import { cx } from "./cx";

export type KickerProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly as?: "p" | "span" | "div";
};

/**
 * Sentence-case label that replaces the mono all-caps eyebrow: 14px, 600,
 * +0.02em, Schiefer, tabular figures. Use it in a page hero, a cover band or
 * an object header ("Workshop 03 · 75 Min."). Section heads get no kicker;
 * the Kopflinie does that job.
 */
export function Kicker({ children, className, as: Tag = "p" }: KickerProps) {
  return (
    <Tag className={cx("text-label text-muted-foreground tabular-nums", className)}>
      {children}
    </Tag>
  );
}
