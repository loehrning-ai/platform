"use client";

import { useEffect, useRef, useState } from "react";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";

/* BeforeAfter — drag-slider comparing manual workflow vs Claude-assisted.
 * Auto-hint jiggles once on viewport enter, cancels on user drag. */

const TASK = {
  title: "Wettbewerber-Briefing",
  before: {
    time: "4 h 30 min",
    steps: [
      "Google-Suche",
      "20 Tabs öffnen",
      "Kopieren in Word",
      "Struktur überlegen",
      "Tippen, kürzen",
      "Schlussredaktion",
    ],
  },
  after: {
    time: "18 min",
    steps: [
      "Claude mit 5 URLs briefen",
      "Struktur + Tone-Prompt",
      "Verifizieren",
      "Fertig",
    ],
  },
} as const;

export function AiNativeBeforeAfter() {
  const [x, setX] = useState(50);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const userInteracted = useRef(false);
  const hasHinted = useRef(false);

  /* Drag handling */
  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const clientX =
        "touches" in e && e.touches.length > 0
          ? e.touches[0].clientX
          : (e as MouseEvent).clientX;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setX(Math.max(4, Math.min(96, pct)));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  /* Hint animation — one-shot on viewport enter, respects reduced motion */
  useEffect(() => {
    if (!wrapRef.current) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) return;

    const el = wrapRef.current;
    let rafId = 0;
    let startTs: number | null = null;
    const DURATION = 4200;
    const keyframes = [
      { t: 0, x: 50 },
      { t: 0.08, x: 50 },
      { t: 0.32, x: 22 },
      { t: 0.45, x: 22 },
      { t: 0.72, x: 78 },
      { t: 0.85, x: 78 },
      { t: 1, x: 50 },
    ];
    const getX = (p: number) => {
      for (let i = 0; i < keyframes.length - 1; i++) {
        const a = keyframes[i];
        const b = keyframes[i + 1];
        if (p >= a.t && p <= b.t) {
          const local = (p - a.t) / (b.t - a.t);
          const eased = 0.5 - 0.5 * Math.cos(Math.PI * local);
          return a.x + (b.x - a.x) * eased;
        }
      }
      return 50;
    };
    const step = (ts: number) => {
      if (userInteracted.current) return;
      if (startTs === null) startTs = ts;
      const p = Math.min(1, (ts - startTs) / DURATION);
      setX(getX(p));
      if (p < 1) rafId = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !hasHinted.current &&
            !userInteracted.current
          ) {
            hasHinted.current = true;
            rafId = requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const markInteracted = () => {
    userInteracted.current = true;
  };

  return (
    <SectionShell num="I" label="AI-native vs. alt">
      <Eyebrow>Warum überhaupt</Eyebrow>
      <ClipHeading
        as="h2"
        className="mt-2.5 font-bold leading-none tracking-[-0.035em]"
        style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
      >
        Gleiche Aufgabe.
        <br />
        Halbiert. Geviertelt. Manchmal 20×.
      </ClipHeading>
      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[620px] text-[17px] text-muted-foreground">
          Ziehe den Slider: links wie es heute gemacht wird, rechts wie es
          AI-native geht.
        </p>
      </FadeBlock>

      <FadeBlock delay={2}>
        <div
          ref={wrapRef}
          className="relative mt-10 grid min-h-[420px] select-none border border-border bg-card/50"
        >
          {/* BEFORE pane */}
          <div
            className="col-start-1 row-start-1 overflow-hidden p-7"
            style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}
          >
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              vorher · ohne AI
            </span>
            <div className="mt-12 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {TASK.title}
            </div>
            <div
              className="mt-3 font-mono font-bold tracking-[-0.02em] text-foreground"
              style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}
            >
              {TASK.before.time}
            </div>
            <ul className="mt-5 space-y-2">
              {TASK.before.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="min-w-6 font-mono text-[11px] text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-[3px]">
              {Array.from({ length: 30 }).map((_, i) => (
                <span
                  key={i}
                  className="h-2.5 flex-1 bg-foreground/70"
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* AFTER pane */}
          <div
            className="col-start-1 row-start-1 overflow-hidden p-7"
            style={{ clipPath: `inset(0 0 0 ${x}%)` }}
          >
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
              nachher · AI-native
            </span>
            <div className="mt-12 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {TASK.title}
            </div>
            <div
              className="mt-3 font-mono font-bold tracking-[-0.02em] text-brand-orange"
              style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}
            >
              {TASK.after.time}
            </div>
            <ul className="mt-5 space-y-2">
              {TASK.after.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <span className="min-w-6 font-mono text-[11px] text-brand-orange">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-[3px]">
              {Array.from({ length: 30 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 flex-1 ${
                    i < 2 ? "bg-brand-orange" : "bg-foreground/12"
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Divider + handle */}
          <button
            type="button"
            aria-label="Vergleichs-Slider ziehen"
            className="col-start-1 row-start-1 w-0.5 justify-self-start bg-brand-orange"
            style={{ marginLeft: `calc(${x}% - 1px)`, cursor: "ew-resize" }}
            onMouseDown={() => {
              dragging.current = true;
              markInteracted();
            }}
            onTouchStart={() => {
              dragging.current = true;
              markInteracted();
            }}
          >
            <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 border-2 border-foreground bg-brand-orange px-2.5 py-2 font-mono text-[11px] text-white shadow-[3px_3px_0_0_var(--color-foreground)]">
              ⇆
            </span>
          </button>
        </div>
      </FadeBlock>

      <FadeBlock delay={3}>
        <p className="mt-5 font-mono text-[12.5px] tracking-[0.02em] text-muted-foreground">
          Beispiel aus unserer Pilotphase. Zeiten variieren. Die Richtung nicht.
        </p>
      </FadeBlock>
    </SectionShell>
  );
}
