import type { ReactNode } from "react";
import { cx } from "./cx";
import { Pictogram } from "./pictogram";

export type ChipVariant = "meta" | "pass" | "gap";

const BASE =
  "inline-flex h-7 items-center gap-1.5 border px-2.5 text-label whitespace-nowrap";

const VARIANTS: Record<ChipVariant, string> = {
  meta: "border-border text-muted-foreground",
  pass: "border-pass text-pass",
  gap: "border-dashed border-foreground text-foreground",
};

/**
 * Filter chip classes for interactive toggles (the element itself lives in the
 * page, usually a button with aria-pressed). Square, 44px target, ink fill
 * when pressed.
 */
export const FILTER_CHIP_CLASS =
  "inline-flex min-h-11 items-center gap-2 border border-border px-3 text-label text-foreground transition-colors duration-[120ms] hover:border-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background motion-reduce:transition-none";

export type ChipProps = {
  readonly children: ReactNode;
  readonly variant?: ChipVariant;
  readonly className?: string;
};

/**
 * Static square chip with a control-edge border: format and language
 * ("HTML · EN"), mode ("Synthetisch"), or a verdict. The pass chip carries
 * the pass pictogram and the gap chip the gap pictogram, so state never
 * depends on colour alone; the children must still say the word.
 */
export function Chip({ children, variant = "meta", className }: ChipProps) {
  return (
    <span className={cx(BASE, VARIANTS[variant], className)} data-chip={variant}>
      {variant === "pass" ? <Pictogram name="pass" className="size-3.5" /> : null}
      {variant === "gap" ? <Pictogram name="gap" className="size-3.5" /> : null}
      {children}
    </span>
  );
}
