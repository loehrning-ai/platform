"use client";

// ─── Gamification toast provider (shared course architecture) ──
//
// Subscribes to the ONE unified progress store and surfaces two kinds of
// reward toasts, wired to the cross-course gamification ledger:
//   • XP toasts   — when cumulative xp increases (lesson, section, quiz, …)
//   • badge toasts — when a new badge is awarded
//
// Pure presentation: it never writes to the store, only diffs successive
// emissions. Framer Motion handles entrance/exit; `MotionProvider`
// (layout.tsx) already maps everything to prefers-reduced-motion, and we
// additionally drop the slide offset + lengthen the auto-dismiss so a
// reduced-motion user still gets time to read a fade-only toast.
//
// Mounted once in the root layout so any course (or the /kurse hub) that
// touches the store gets toasts for free, no per-page wiring.

import { useEffect, useRef, useState, type JSX } from "react";
import { m, AnimatePresence, LazyMotion, useReducedMotion } from "framer-motion";
import { Sparkles, Award } from "lucide-react";
import { subscribe } from "@/lib/progress/store";
import { getBadgeDefinition } from "@/lib/progress/badges";
import type { UnifiedProgress } from "@/lib/progress/types";
import { EASE_OUT_EXPO } from "@/lib/animations";

// Scoped domMax load (performance hardening): the toast stack uses the `layout`
// prop (smooth reflow when a toast above disappears), which needs the
// projection engine from domMax — the root MotionProvider only ships
// domAnimation. Because this provider is mounted in the root layout, a static
// domMax import would land in the shared First Load JS of every page; the
// async bundle below instead arrives as a small lazy chunk after hydration,
// long before the first toast can fire (toasts require store activity).
const loadDomMax = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

type ToastKind = "xp" | "badge";

interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly title: string;
  readonly detail: string;
}

const AUTO_DISMISS_MS = 3600;
const MAX_VISIBLE = 3;

export function ProgressToastProvider(): JSX.Element {
  const prefersReduced = useReducedMotion();
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(1);
  // Snapshot of the last seen ledger so we only toast *new* gains. Seeded on
  // the first emission (the store calls the subscriber immediately) so we
  // never replay a returning learner's entire history on mount.
  const seen = useRef<{ xp: number; badges: Set<string> } | null>(null);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    function push(kind: ToastKind, title: string, detail: string): void {
      const id = nextId.current++;
      setToasts((prev) => {
        const next = [...prev, { id, kind, title, detail }];
        return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
      });
      const t = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, t);
    }

    function dismiss(id: number): void {
      const t = timers.current.get(id);
      if (t) {
        clearTimeout(t);
        timers.current.delete(id);
      }
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }

    const unsubscribe = subscribe((state: UnifiedProgress) => {
      const currentBadges = new Set(Object.keys(state.badges));
      if (seen.current === null) {
        // First emission = baseline; do not toast existing progress.
        seen.current = { xp: state.xp, badges: currentBadges };
        return;
      }
      const prev = seen.current;

      // Badge toasts first (the bigger reward), then the XP nudge.
      for (const id of currentBadges) {
        if (!prev.badges.has(id)) {
          const def = getBadgeDefinition(id);
          push("badge", def ? def.label : "Neues Abzeichen", def ? def.description : "Abzeichen freigeschaltet.");
        }
      }
      if (state.xp > prev.xp) {
        const delta = state.xp - prev.xp;
        push("xp", `+${delta} XP`, `${state.xp} XP gesammelt`);
      }

      seen.current = { xp: state.xp, badges: currentBadges };
    });

    const localTimers = timers.current;
    return () => {
      unsubscribe();
      localTimers.forEach((t) => clearTimeout(t));
      localTimers.clear();
    };
    // Run once: subscribe handles all updates internally.
  }, []);

  function handleDismiss(id: number): void {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }

  const offset = prefersReduced ? 0 : 16;

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      <LazyMotion features={loadDomMax} strict>
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <m.div
              key={toast.id}
              layout={!prefersReduced}
              initial={{ opacity: 0, x: offset, scale: prefersReduced ? 1 : 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: offset, scale: prefersReduced ? 1 : 0.96 }}
              transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
              className="pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => handleDismiss(toast.id)}
                aria-label={`${toast.title}. ${toast.detail}. Schließen.`}
                className={
                  "group flex min-w-[220px] max-w-[320px] items-start gap-3 border-2 border-foreground bg-card px-4 py-3 text-left shadow-[4px_4px_0_0_var(--color-foreground)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    toast.kind === "badge"
                      ? "mt-0.5 shrink-0 text-brand-orange"
                      : "mt-0.5 shrink-0 text-brand-sand"
                  }
                >
                  {toast.kind === "badge" ? <Award size={18} /> : <Sparkles size={18} />}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-foreground">
                    {toast.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-tight text-muted-foreground">
                    {toast.detail}
                  </span>
                </span>
              </button>
            </m.div>
          ))}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
