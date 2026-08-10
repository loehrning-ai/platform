"use client";

import type { ReactNode, ElementType } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";

/* ──────────────────────────────────────────────────────────────
   AI-Native Arbeitskurs, design primitives
   Translated from Claude Design's common.jsx, typed + Framer Motion.
   ────────────────────────────────────────────────────────────── */

/* Marginalia — numbered § marker in the left margin (lg+ visible) */
export function Marginalia({ num, label }: { num: string; label: string }) {
  return (
    <div className="ai-marginalia" aria-hidden="true">
      <span className="num">§ {num}</span>
      {label}
    </div>
  );
}

/* SectionShell — light or dark section with optional marginalia track */
interface SectionShellProps {
  readonly id?: string;
  readonly num?: string;
  readonly label?: string;
  readonly dark?: boolean;
  readonly dotGrid?: boolean;
  readonly className?: string;
  readonly innerClassName?: string;
  readonly children: ReactNode;
}

export function SectionShell({
  id,
  num,
  label,
  dark = false,
  dotGrid = false,
  className,
  innerClassName,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-24 md:py-28",
        dark && "dark-section bg-[var(--color-dark-bg)]",
        dotGrid && (dark ? "bg-dot-pattern-dark" : "bg-dot-pattern"),
        className,
      )}
    >
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        {num && label && <Marginalia num={num} label={label} />}
        <div
          className={cn(
            "mx-auto max-w-[960px]",
            num && label && "ai-section-inner--with-marginalia",
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

/* VoiceAnchor — oversized editorial pull-quote */
export function VoiceAnchor({
  children,
  author,
  className,
}: {
  readonly children: ReactNode;
  readonly author?: string;
  readonly className?: string;
}) {
  return (
    <div
      className={cn("relative max-w-[720px] py-3 pl-8", className)}
    >
      <p className="ai-voice-anchor text-foreground">{children}</p>
      {author && (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          {author}
        </p>
      )}
    </div>
  );
}

/* TierChip — mono underline badge for FREE courses only */
export function TierChip({
  tier,
  locale = "de",
}: {
  tier: "FREE";
  locale?: Locale;
}) {
  void tier; // always "FREE", the type guards against accidental extension
  return (
    <span className="inline-flex items-baseline gap-1.5 border-b-2 pb-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand-orange">
      {locale === "en" ? "FREE" : "KOSTENLOS"}
    </span>
  );
}

/* ModNumber — 48×48 Kupfer square for module numbering */
export function ModNumber({ num }: { num: string }) {
  return (
    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-brand-orange font-mono text-[15px] font-bold tracking-[0.02em] text-white">
      {num}
    </span>
  );
}

/* ClipHeading — stable editorial heading with a layout-safe wrapper. */
interface ClipHeadingProps {
  readonly as?: ElementType;
  readonly className?: string;
  readonly style?: React.CSSProperties;
  readonly children: ReactNode;
  readonly delay?: number;
}

export function ClipHeading({
  as: Tag = "h2",
  className,
  style,
  children,
  delay = 0,
}: ClipHeadingProps) {
  void delay;
  const HeadingTag = Tag;
  // No overflow clipping: it would crop descenders on tight headings.
  return (
    <span className="block">
      <HeadingTag className={className} style={style}>
        {children}
      </HeadingTag>
    </span>
  );
}

/* DrawRule — animated hairline, scaleX from 0 to 1 */
export function DrawRule({
  className,
  dark = false,
  delay = 0,
}: {
  readonly className?: string;
  readonly dark?: boolean;
  readonly delay?: number;
}) {
  void delay;
  return (
    <div
      style={{ transformOrigin: "left" }}
      className={cn(
        "h-px w-full",
        dark ? "bg-[var(--color-dark-border)]" : "bg-border",
        className,
      )}
    />
  );
}

/* CountUp — animates a number from 0 to `value` on viewport enter */
export function CountUp({
  value,
  suffix,
  duration = 1.8,
  className,
}: {
  readonly value: number;
  readonly suffix?: string;
  readonly duration?: number;
  readonly className?: string;
}) {
  void duration;

  return (
    <span
      className={cn(
        "font-mono font-bold tracking-[-0.02em] text-brand-orange",
        className,
      )}
    >
      <span>{Math.round(value)}</span>
      {suffix && (
        <span className="text-[0.55em] text-muted-foreground">{suffix}</span>
      )}
    </span>
  );
}

/* FadeBlock — simple opacity + y fade-in, single child */
export function FadeBlock({
  children,
  delay = 0,
  className,
}: {
  readonly children: ReactNode;
  readonly delay?: number;
  readonly className?: string;
}) {
  void delay;
  return (
    <div className={className}>
      {children}
    </div>
  );
}

/* Eyebrow — Kupfer mono overline used by most section tops */
export function Eyebrow({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange",
        className,
      )}
    >
      {children}
    </p>
  );
}
