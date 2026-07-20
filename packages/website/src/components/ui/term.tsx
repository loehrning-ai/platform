"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { trackTermOpened } from "@/lib/analytics";

export interface TermProps {
  /** Stable id used for analytics dedup; defaults to a slugified label. */
  id?: string;
  /** Display text (falls back to children if provided). */
  label: string;
  /** One-sentence definition shown in tooltip/popover. */
  short: string;
  /** Optional visible replacement for the label. */
  children?: ReactNode;
  /** testid hook */
  testId?: string;
}

/**
 * Inline glossary wrapper. Renders text with a dotted underline and a
 * native `title` tooltip for hover readers, plus a click/tap-to-open
 * popover for mobile and keyboard users. Outside-click + Escape close
 * the popover. Fires trackTermOpened() once per mount.
 */
export function Term({ id, label, short, children, testId }: TermProps) {
  const [open, setOpen] = useState(false);
  const openedOnce = useRef(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const effectiveId =
    id ??
    label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

  useEffect(() => {
    if (!open) return;
    if (!openedOnce.current) {
      openedOnce.current = true;
      try {
        trackTermOpened(effectiveId);
      } catch {
        // ignore analytics failure
      }
    }

    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, effectiveId]);

  // Consume the click: Terms can sit inside <Link> cards (e.g. the
  // inline cards on the homepage — without preventDefault the tap that
  // should open the definition navigates the parent link away instead
  // (performance hardening, caught by the BAFA E2E).
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen((v) => !v);
    }
  };

  return (
    <span
      ref={wrapperRef}
      data-testid={testId}
      className="relative inline-block"
    >
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-describedby={open ? `term-${effectiveId}-tip` : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={short}
        className="cursor-help underline decoration-dotted decoration-muted-foreground/60 underline-offset-2 hover:decoration-brand-orange"
      >
        {children ?? label}
      </span>
      {open ? (
        <span
          id={`term-${effectiveId}-tip`}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 block w-64 max-w-[calc(100vw-2rem)] border border-brand-orange/40 bg-card p-3 text-[11px] leading-relaxed text-muted-foreground shadow-lg"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-brand-orange">
            {label}
          </span>
          <span className="mt-1 block normal-case">{short}</span>
        </span>
      ) : null}
    </span>
  );
}
