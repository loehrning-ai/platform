"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
 * BrandButton — loehrning.ai signature button
 *
 * Brutalist offset-shadow style: hard border + offset dark shadow.
 * Hover lifts up; active presses down.
 *
 * variant:
 *   "primary"  — Kupfer (#C4431A) fill, white text
 *   "outline"  — transparent fill, brand-colored border
 *   "ghost"    — no border, flat text link style
 *
 * surface:
 *   "dark"  — border and shadow in foreground/cream tone (on dark bg)
 *   "light" — border and shadow in near-black Druckertinte (on Kalkweiß)
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
}

const sizeMap = {
  sm: "px-5 py-2.5 text-xs gap-1.5",
  md: "px-7 py-3.5 text-[0.9375rem] gap-2",
  lg: "px-9 py-4.5 text-base gap-2.5",
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
}: BrandButtonProps) {
  const base = cn(
    // Layout
    "inline-flex items-center justify-center font-bold tracking-wide uppercase",
    // Gate nowrap: long German CTAs (+ arrow + lg padding) could exceed a ~320px
    // column and leak a horizontal scrollbar. Wrap on phones, nowrap from sm up.
    "select-none max-w-full whitespace-normal text-center sm:whitespace-nowrap",
    // Shape — warm rounded (CI v3.1)
    "rounded-lg",
    // Transition
    "transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-200 ease-out",
    sizeMap[size],
    // Disabled
    disabled && "pointer-events-none opacity-40",
  );

  const variants: Record<string, Record<string, string>> = {
    primary: {
      dark: cn(
        // kupfer-dark (#A5370F) is NOT remapped on dark, so white-on-fill stays
        // 6.66:1 (WCAG AA) even inside a .dark-section.
        "bg-[var(--color-kupfer-dark)] text-white shadow-card",
        "hover:-translate-y-0.5 hover:shadow-card-hover",
        "active:translate-y-0 active:shadow-tile",
      ),
      light: cn(
        "bg-brand-orange text-white shadow-card",
        "hover:-translate-y-0.5 hover:shadow-card-hover",
        "active:translate-y-0 active:shadow-tile",
      ),
    },
    outline: {
      dark: cn(
        "bg-transparent text-foreground",
        "border border-[rgba(243,240,233,0.3)]",
        "hover:-translate-y-0.5 hover:border-[rgba(243,240,233,0.6)] hover:bg-[rgba(243,240,233,0.05)]",
        "active:translate-y-0",
      ),
      light: cn(
        "bg-card text-foreground",
        "border border-border shadow-card",
        "hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-card-hover",
        "active:translate-y-0 active:shadow-tile",
      ),
    },
    ghost: {
      dark: cn(
        "bg-transparent text-muted-foreground border-0 shadow-none",
        "hover:text-foreground hover:underline underline-offset-4",
      ),
      light: cn(
        "bg-transparent text-muted-foreground border-0 shadow-none",
        "hover:text-foreground hover:underline underline-offset-4",
      ),
    },
  };

  const classes = cn(base, variants[variant][surface], className);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        aria-disabled={disabled}
        // A disabled link must leave the tab order and swallow activation:
        // aria-disabled alone keeps it focusable and Enter still navigates.
        tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
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
