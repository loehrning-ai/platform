import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * Section — shared responsive vertical-rhythm primitive (responsive-layout hardening)
 *
 * Replaces the ~68 hand-rolled, non-responsive `py-NN` sections across the site
 * with ONE source of truth for fold height + vertical padding that scales with
 * the viewport. This is the home that makes the homepage hero whitespace bug
 * (min-h-screen + flex-1 spacer) impossible to re-introduce.
 *
 * spacing — vertical rhythm, steps DOWN on small/short screens:
 *   "default" → py-16 sm:py-20 lg:py-24   (most sections)
 *   "hero"    → py-20 sm:py-24 lg:py-32   (above-the-fold heroes)
 *   "compact" → py-10 sm:py-12 lg:py-16   (tight bands, CTAs)
 *   "none"    → no vertical padding (caller controls)
 *
 * fold   — apply `min-h-[100svh]` using the SMALL viewport unit (mobile-safe,
 *          unlike min-h-screen=100vh which miscounts the URL bar). Opt-in only.
 * center — when used with `fold`, vertically centers content so a short content
 *          block can never strand a full-viewport void (the hero anti-pattern).
 */

type Spacing = "default" | "hero" | "compact" | "none";

const SPACING: Record<Spacing, string> = {
  default: "py-16 sm:py-20 lg:py-24",
  hero: "py-20 sm:py-24 lg:py-32",
  compact: "py-10 sm:py-12 lg:py-16",
  none: "",
};

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  spacing?: Spacing;
  fold?: boolean;
  center?: boolean;
  as?: ElementType;
}

export function Section({
  children,
  className,
  spacing = "default",
  fold = false,
  center = false,
  as: Tag = "section",
  ...rest
}: SectionProps) {
  return (
    <Tag
      className={cn(
        "relative w-full",
        SPACING[spacing],
        fold && "min-h-[100svh]",
        fold && center && "flex flex-col justify-center",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
