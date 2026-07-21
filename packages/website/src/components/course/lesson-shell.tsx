"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { m } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useFocusTrap } from "@/lib/a11y/use-focus-trap";

/**
 * Shared, structure-agnostic lesson-reader chrome:
 * desktop sidebar rail + mobile nav drawer (toggle, backdrop, focus trap,
 * inert-sibling sweep, aria wiring), extracted from lesson-layout.tsx. It
 * knows nothing about lessons — `sidebar`/`children` are opaque ReactNode
 * slots — so any course plan building its own bespoke content module can
 * consume this instead of re-deriving nav chrome from its source site's
 * vanilla JS. `navOpen`/`onNavOpenChange` are controlled: the caller owns
 * when the drawer closes (e.g. on lesson selection).
 */
export interface LessonShellProps {
  /** Rendered in both the always-visible desktop rail and the mobile drawer. */
  readonly sidebar: ReactNode;
  /** Main content area. */
  readonly children: ReactNode;
  readonly navOpen: boolean;
  readonly onNavOpenChange: (open: boolean) => void;
  /** aria-label for the mobile drawer's dialog role. */
  readonly navLabel: string;
  /** id shared between the toggle's aria-controls and the drawer element. */
  readonly navId?: string;
}

export function LessonShell({
  sidebar,
  children,
  navOpen,
  onNavOpenChange,
  navLabel,
  navId = "mobile-lesson-nav",
}: LessonShellProps) {
  const closeNav = useCallback(() => onNavOpenChange(false), [onNavOpenChange]);
  const drawerRef = useFocusTrap<HTMLElement>(navOpen, closeNav);
  const shellRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  // Keep sibling content behind the mobile drawer out of the accessibility tree.
  useEffect(() => {
    const shell = shellRef.current;
    const drawer = drawerRef.current;
    const toggle = toggleButtonRef.current;
    if (!navOpen || !shell || !drawer) return;

    // The backdrop overlay stays interactive (data-sidebar-backdrop): marking
    // it inert would remove it from hit-testing and kill its click-to-close.
    const toInert = Array.from(shell.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement &&
        el !== drawer &&
        !el.contains(drawer) &&
        !el.contains(toggle) &&
        !el.hasAttribute("data-sidebar-backdrop"),
    );
    for (const el of toInert) {
      el.setAttribute("inert", "");
    }

    return () => {
      for (const el of toInert) {
        el.removeAttribute("inert");
      }
    };
  }, [navOpen, drawerRef]);

  return (
    <div ref={shellRef} className="flex min-h-[calc(100svh-7rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-border bg-background p-4 md:block lg:w-64">
        {sidebar}
      </aside>

      {/* Mobile toggle */}
      <button
        ref={toggleButtonRef}
        type="button"
        onClick={() => onNavOpenChange(!navOpen)}
        aria-expanded={navOpen}
        aria-controls={navId}
        aria-label={navOpen ? "Navigation schließen" : "Navigation öffnen"}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center border-2 border-foreground bg-brand-orange text-white shadow-[4px_4px_0_0_var(--color-foreground)] md:hidden"
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {navOpen && (
        <>
          <div
            data-sidebar-backdrop
            className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
            role="presentation"
            onClick={() => {
              onNavOpenChange(false);
              toggleButtonRef.current?.focus();
            }}
          />
          <m.aside
            ref={drawerRef}
            id={navId}
            role="dialog"
            aria-modal="true"
            aria-label={navLabel}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-30 w-72 overflow-y-auto overscroll-contain border-r border-border bg-background p-4 pt-20 md:hidden"
          >
            {sidebar}
          </m.aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
