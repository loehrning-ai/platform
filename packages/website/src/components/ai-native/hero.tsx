"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { m } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { AI_NATIVE_TRUST_SIGNALS } from "@/lib/ai-native/content";
import { useMotionAllowed } from "@/lib/animation-policy";

/* Cycling demo prompts — design-only content, lives inline with hero */
const DEMO_PROMPTS = [
  {
    cmd: "du > Claude: finde alle Verträge mit Preisanpassungsklausel",
    out: "12 Treffer. Sortiert nach Risiko. Rahmenvertrag #4712 (hoch), Lieferant Bosch (mittel), 10 weitere. PDF-Briefing liegt in /dokumente/review.md.",
    tag: "Claude Code · agentic search",
  },
  {
    cmd: "du > Claude: baue den Angebots-Vergleich aus PDF-Ordner",
    out: "3 Angebote extrahiert. Tabelle mit 14 Zeilen, 8 Spalten. Ausreißer markiert (Lieferzeit Angebot B, Zahlungsziel Angebot C). Export als .xlsx.",
    tag: "structured output · batch",
  },
  {
    cmd: "du > Claude: refactor dieses Skript, aber behalte die Logik",
    out: "Skript zerlegt in 4 Funktionen, Typ-Annotationen ergänzt, 23 Tests geschrieben, alle grün. Diff liegt im Branch ai/refactor-invoice.",
    tag: "sub-agents · verify",
  },
  {
    cmd: "du > Claude: mach ein Onboarding-Memo für den neuen Praktikanten",
    out: "Memo entworfen · 1 Seite · Ton: freundlich, konkret · beinhaltet Repo-Links, Meeting-Rhythmus, erste 3 Tasks. Draft in /hr/onboarding_v3.md.",
    tag: "context-rich · draft",
  },
] as const;

type Phase = "typing" | "output" | "hold" | "fadeout";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function usePaletteInView(): readonly [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin: "120px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, inView] as const;
}

function CommandPalette() {
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const [paletteRef, paletteInView] = usePaletteInView();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const cur = DEMO_PROMPTS[idx];

  useEffect(() => {
    if (reducedMotion) {
      // Static: show the first prompt fully with output — no cycling.
      setTyped(DEMO_PROMPTS[0].cmd);
      setPhase("hold");
      return;
    }
    // Preserve the current frame while the terminal is offscreen or the tab is
    // hidden. Resume the same prompt when it becomes observable again.
    if (!motionAllowed || !paletteInView) return;
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (typed.length < cur.cmd.length) {
        timer = setTimeout(
          () => setTyped(cur.cmd.slice(0, typed.length + 1)),
          18 + Math.random() * 22,
        );
      } else {
        timer = setTimeout(() => setPhase("output"), 420);
      }
    } else if (phase === "output") {
      timer = setTimeout(() => setPhase("hold"), 900);
    } else if (phase === "hold") {
      timer = setTimeout(() => setPhase("fadeout"), 3200);
    } else if (phase === "fadeout") {
      timer = setTimeout(() => {
        setTyped("");
        setPhase("typing");
        setIdx((i) => (i + 1) % DEMO_PROMPTS.length);
      }, 500);
    }
    return () => clearTimeout(timer);
  }, [
    typed,
    phase,
    cur.cmd,
    reducedMotion,
    motionAllowed,
    paletteInView,
  ]);

  const showOutput = phase === "output" || phase === "hold" || phase === "fadeout";

  return (
    <div ref={paletteRef} className="relative">
      {/* Self-contained dark "terminal window" on the now-light hero. The
          `dark-section` class scopes the dark token overrides (incl. the
          AA-on-dark Kupfer accent #e07050) and paints the solid dark
          background, so this code window stays readable + AA even though its
          parent section is light. */}
      <div className="dark-section overflow-hidden border border-[var(--color-dark-border)] bg-[var(--color-dark-bg)]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-[var(--color-dark-border)] px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-dark-muted)]">
          <span>claude · live demo</span>
          <span className="flex gap-1.5">
            {DEMO_PROMPTS.map((_, i) => (
              <span
                key={i}
                className={`h-0.5 w-4 transition-colors ${
                  i === idx ? "bg-brand-orange" : "bg-[rgba(243,240,233,0.2)]"
                }`}
              />
            ))}
          </span>
        </div>
        {/* body */}
        <div className="px-5 py-6">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-brand-amber">
            {cur.tag}
          </p>
          <div className="mt-3 flex min-h-[64px] items-start gap-2 font-mono text-[13.5px] leading-[1.55] text-[var(--color-dark-fg)]">
            <span className="shrink-0 text-brand-orange">▸</span>
            <span className="min-w-0 break-words">
              {typed}
              {phase === "typing" && !reducedMotion && (
                <span className="ai-cursor" aria-hidden="true" />
              )}
            </span>
          </div>
          <div className="mt-5 min-h-[104px]">
            {showOutput && (
              <m.div
                key={`${idx}-out`}
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: phase === "fadeout" ? 0 : 1,
                  y: 0,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="border-l-2 border-brand-orange/60 pl-3 text-[13px] leading-[1.6] text-[var(--color-dark-muted)]"
              >
                {cur.out}
              </m.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiNativeHero() {
  return (
    <section className="relative flex min-h-[100dvh] items-start bg-background px-6 pb-12 pt-24 md:pt-28 lg:items-center lg:px-12 lg:pb-14">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* LEFT — copy + CTAs */}
          <div>
            <div>
              <span className="inline-flex items-center gap-2 border border-brand-orange/35 bg-brand-orange/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                <Zap size={12} />
                AI-Native Arbeitskurs · alle Module kostenlos
              </span>
            </div>

            <h1
              /* bg-background is visually a no-op here (light text box on the
                 identical light section background) but gives axe an opaque
                 background to resolve against. The revealUp clipPath on the h1
                 otherwise blocks axe's background walk-up to the <section>, so
                 supplying the same light canvas keeps the kupfer word's contrast
                 measured against the real background. */
              className="mt-5 bg-background font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4.75rem)" }}
            >
              Kontext geben.
              <br />
              <span className="text-brand-orange">Output prüfen.</span>
            </h1>

            <p className="mt-5 max-w-[520px] text-[17px] leading-[1.55] text-muted-foreground">
              AI-native arbeiten heißt:{" "}
              <strong className="text-foreground">
                Intent formulieren, Kontext geben, Output verifizieren.
              </strong>{" "}
              In vier Modulen, 27 Lektionen, auf Deutsch, mit Claude als
              Standard-Werkzeug.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <BrandButton
                href="/ai-native/kurs/modul_1"
                prefetch={false}
                variant="primary"
              >
                Kostenlos mit Lernkonto starten <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href="/ai-native/fluency-test"
                variant="outline"
              >
                Fluency-Test · 5 Min
              </BrandButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>
                <span className="text-brand-orange">▸</span> 27 Lektionen
              </span>
              <span>
                <span className="text-brand-orange">▸</span> 4 Module
              </span>
              <span>
                <span className="text-brand-orange">▸</span> 15 h · selbst-paced
              </span>
              <span>
                <span className="text-brand-orange">▸</span> Claude-first · deutsch
              </span>
            </div>

            {/* Trust signals — hidden on short viewports to keep hero in one screen */}
            <div>
              <ul className="mt-6 hidden space-y-1.5 text-[13px] text-muted-foreground md:block">
                {AI_NATIVE_TRUST_SIGNALS.map((signal, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-px w-4 shrink-0 bg-brand-sand/50" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick-nav footer — preserves AI-native navigation links; hidden on shorter screens */}
            <div className="mt-6 hidden flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground lg:flex">
              <a
                href="/ai-native/demos"
                className="transition-colors hover:text-brand-orange"
              >
                → 12 Demos ausprobieren
              </a>
              <a
                href="/ai-native/glossar"
                className="transition-colors hover:text-brand-orange"
              >
                → Glossar ({">"}70 Begriffe)
              </a>
              <a
                href="/ai-native/capstone-gallery"
                className="transition-colors hover:text-brand-orange"
              >
                → Capstone Gallery
              </a>
              <a
                href="/ki-fuehrerschein"
                className="transition-colors hover:text-brand-orange"
              >
                → KI-Führerschein
              </a>
            </div>
          </div>

          {/* RIGHT — live command palette */}
          <div>
            <CommandPalette />
          </div>
        </div>
      </div>
    </section>
  );
}
