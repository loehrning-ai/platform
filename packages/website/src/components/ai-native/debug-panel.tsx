"use client";

import { useEffect, useState } from "react";
import { getRecentEvents } from "@/lib/ai-native/analytics";
import { UNIFIED_STORAGE_KEY } from "@/lib/progress/types";

/**
 * AiNativeDebugPanel — dev-only overlay (cmd+shift+D) showing:
 *   - Current progress snapshot from localStorage
 *   - Reveal index for the current lesson (if any)
 *   - Recent analytics events (ring buffer of 50)
 *   - Active widget kinds on the page (via window.__aiNativeWidgets)
 *
 * Rendered only when NODE_ENV === "development". No-op in production.
 *
 * See: AI-native lesson system.
 */

interface AiNativeWidgetHandle {
  readonly kind: string;
  readonly placement: string;
  readonly lessonId?: string;
}

declare global {
   
  var __aiNativeWidgets: AiNativeWidgetHandle[] | undefined;
}

export function AiNativeDebugPanel() {
  const [open, setOpen] = useState(false);
  const [progressRaw, setProgressRaw] = useState<string | null>(null);
  const [revealIndex, setRevealIndex] = useState<number | null>(null);
  const [events, setEvents] = useState(getRecentEvents());

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const refresh = () => {
      try {
        setProgressRaw(localStorage.getItem(UNIFIED_STORAGE_KEY));
      } catch {
        setProgressRaw("(localStorage unavailable)");
      }
      const idx = document.documentElement.dataset.revealIndex;
      setRevealIndex(idx ? Number(idx) : null);
      setEvents(getRecentEvents());
    };
    refresh();
    const id = window.setInterval(refresh, 500);
    return () => window.clearInterval(id);
  }, [open]);

  // Hard-gate to dev mode — renders nothing in production.
  if (process.env.NODE_ENV !== "development") return null;
  if (!open) return null;

  const widgets = globalThis.__aiNativeWidgets ?? [];

  return (
    <div
      role="dialog"
      aria-label="AI-Native debug panel"
      className="fixed right-4 bottom-4 z-[9999] max-h-[70vh] w-[380px] overflow-auto overscroll-contain border-2 border-brand-orange bg-[var(--color-dark-bg)] p-3 font-mono text-[11px] text-[var(--color-dark-fg)] shadow-[6px_6px_0_0_#000]"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold uppercase tracking-[0.14em] text-brand-orange">
          AI-NATIVE DEBUG
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[var(--color-dark-muted)] transition-colors hover:text-brand-orange"
          aria-label="Schließen"
        >
          ✕
        </button>
      </div>

      <section className="mb-3 border-t border-[var(--color-dark-border)] pt-2">
        <p className="mb-1 font-bold text-brand-amber">Reveal Index</p>
        <p>{revealIndex === null ? "(not set)" : revealIndex}</p>
      </section>

      <section className="mb-3 border-t border-[var(--color-dark-border)] pt-2">
        <p className="mb-1 font-bold text-brand-amber">
          Active Widgets ({widgets.length})
        </p>
        {widgets.length === 0 ? (
          <p className="text-[var(--color-dark-muted)]">(none)</p>
        ) : (
          <ul className="space-y-0.5">
            {widgets.map((w, i) => (
              <li key={i}>
                {w.kind} @ {w.placement}
                {w.lessonId ? ` (${w.lessonId})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-3 border-t border-[var(--color-dark-border)] pt-2">
        <p className="mb-1 font-bold text-brand-amber">
          Recent Events ({events.length})
        </p>
        {events.length === 0 ? (
          <p className="text-[var(--color-dark-muted)]">(no events)</p>
        ) : (
          <ul className="space-y-0.5 text-[10.5px]">
            {events.slice(-10).reverse().map((e, i) => (
              <li key={i} className="break-all">
                <span className="text-brand-orange">{e.event.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-[var(--color-dark-border)] pt-2">
        <p className="mb-1 font-bold text-brand-amber">Progress (localStorage)</p>
        <pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-all text-[10.5px] text-[var(--color-dark-muted)]">
          {progressRaw ?? "(empty)"}
        </pre>
      </section>
    </div>
  );
}
