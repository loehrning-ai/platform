import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
 * Badge — Berliner Werkzeug v3.0
 *
 * Bauhaus-style rectangular label tag. Hard corners, 1px outline border,
 * uppercase monospaced lettering. No fill, no rounded ends.
 *
 * variant:
 *   "kupfer"  — Kupfer border + text (brand accent, CTAs, featured)
 *   "green"   — risk-green (compliant, active, minimal risk)
 *   "yellow"  — risk-yellow (caution, limited, moderate)
 *   "red"     — risk-red (critical, high, blocked)
 *   "neutral" — stone border + text (default, secondary)
 *   "sand"    — sand border + text (tier labels, soft categories)
 */

interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: "kupfer" | "green" | "yellow" | "red" | "neutral" | "sand";
  readonly className?: string;
}

const variantClasses = {
  kupfer:  "border-brand-orange text-brand-orange",
  green:   "border-risk-green text-risk-green",
  yellow:  "border-risk-yellow text-risk-yellow",
  red:     "border-risk-red text-risk-red",
  neutral: "border-border text-muted-foreground",
  sand:    "border-brand-sand text-brand-sand",
} as const;

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-[0.1em]",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
