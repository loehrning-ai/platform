"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
 * BrandButton — loehrning.ai signature button
 *
 * Warm editorial control: compact, tactile, and intentionally softer than the
 * remaining brutalist frames. Color inversion and a small lift signal action.
 *
 * variant:
 *   "primary"  — Kupfer (#A5370F) fill, white text
 *   "outline"  — transparent fill, brand-colored border
 *   "ghost"    — no border, flat text link style
 *
 * surface:
 *   "dark"  — light structural boundary on a dark surface
 *   "light" — Schiefer structural boundary on Kalkweiß
 */

interface BrandButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  surface?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  external?: boolean;
  prefetch?: boolean;
}

const sizeMap = {
  sm: "px-4 py-2 text-xs gap-2",
  md: "px-6 py-3 text-sm gap-2",
  lg: "px-8 py-3 text-base gap-3",
};

export function BrandButton({
  children,
  href,
  onClick,
  variant = "primary",
  surface = "light",
  size = "md",
  disabled = false,
  className,
  external,
  prefetch,
}: BrandButtonProps) {
  const base = cn(
    // Layout
    "inline-flex min-h-11 items-center justify-center font-semibold tracking-[-0.01em]",
    // Gate nowrap: long German CTAs (+ arrow + lg padding) could exceed a ~320px
    // column and leak a horizontal scrollbar. Wrap on phones, nowrap from sm up.
    "select-none max-w-full whitespace-normal text-center sm:whitespace-nowrap",
    // Shape — soft studio label, still clearly bounded and never a pill
    "rounded-xl border shadow-card",
    // Transition
    "transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card-hover motion-reduce:transform-none motion-reduce:transition-none",
    sizeMap[size],
    // Disabled
    disabled && "pointer-events-none opacity-40",
  );

  const variants: Record<string, Record<string, string>> = {
    primary: {
      dark: cn(
        // kupfer-dark (#A5370F) is NOT remapped on dark, so white-on-fill stays
        // 6.66:1 (WCAG AA) even inside a .dark-section.
        "border-[var(--color-kupfer-dark)] bg-[var(--color-kupfer-dark)] text-white",
        "hover:border-foreground hover:bg-foreground hover:text-background",
      ),
      light: cn(
        "border-brand-orange bg-brand-orange text-white",
        "hover:border-foreground hover:bg-foreground hover:text-background",
      ),
    },
    outline: {
      dark: cn(
        "bg-transparent text-foreground",
        "border-[rgba(243,240,233,0.4)]",
        "hover:border-foreground hover:bg-[rgba(243,240,233,0.08)]",
      ),
      light: cn(
        "border-border bg-background text-foreground",
        "hover:border-foreground hover:bg-card",
      ),
    },
    ghost: {
      dark: cn(
        "border-transparent bg-transparent text-muted-foreground shadow-none",
        "hover:text-foreground hover:underline underline-offset-4",
      ),
      light: cn(
        "border-transparent bg-transparent text-muted-foreground shadow-none",
        "hover:text-foreground hover:underline underline-offset-4",
      ),
    },
  };

  const classes = cn(base, variants[variant][surface], className);

  if (href && disabled) {
    return (
      <span className={classes} aria-disabled="true">
        {children}
      </span>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        prefetch={prefetch}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
