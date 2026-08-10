"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { m } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import { getAiNativeTrustSignals } from "@/lib/ai-native/content";
import { useMotionAllowed } from "@/lib/animation-policy";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

/* Cycling demo prompts — design-only content, lives inline with hero */
interface DemoPrompt {
  readonly cmd: string;
  readonly out: string;
  readonly tag: string;
}

const DEMO_PROMPTS: readonly DemoPrompt[] = [
  {
    cmd: "du > Claude: finde in diesem fiktiven Ordner Verträge mit Preisanpassungsklausel",
    out: "Simulierter Suchentwurf: Fundstellen mit Dateipfad und Textausschnitt. Risikoeinstufung und Vollständigkeit sind noch zu prüfen.",
    tag: "Claude Code · begrenzte Suche · Simulation",
  },
  {
    cmd: "du > Claude: vergleiche die fiktiven Angebote in diesem PDF-Ordner",
    out: "Simulierter Tabellenentwurf mit Quellenzeilen. Lieferzeit und Zahlungsziel sind als Abweichungen markiert; Extraktion und Export brauchen Review.",
    tag: "strukturierte Ausgabe · Simulation",
  },
  {
    cmd: "du > Claude: refaktorisiere dieses Beispielskript, ohne das Verhalten zu ändern",
    out: "Simulierter Änderungsvorschlag mit getrennten Funktionen, Typen und Tests. Diff, Testabdeckung und Verhaltensgleichheit müssen geprüft werden.",
    tag: "Änderungsentwurf · Prüfung erforderlich",
  },
  {
    cmd: "du > Claude: entwirf aus diesen freigegebenen Angaben ein Onboarding-Memo",
    out: "Simulierter Einseitenentwurf mit Beispiel-Links, Terminrhythmus und ersten Aufgaben. Fachliche und personelle Freigabe ausstehend.",
    tag: "kontextgebundener Entwurf · Simulation",
  },
] as const;

const DEMO_PROMPTS_EN: readonly DemoPrompt[] = [
  {
    cmd: "you > Claude: find price-adjustment clauses in this fictional contract folder",
    out: "Simulated search draft with file paths and excerpts. Completeness and risk classification still require review.",
    tag: "Claude Code · bounded search · simulation",
  },
  {
    cmd: "you > Claude: compare the fictional quotations in this PDF folder",
    out: "Simulated table draft with source rows. Delivery-time and payment-term differences are flagged; extraction and export require review.",
    tag: "structured output · simulation",
  },
  {
    cmd: "you > Claude: refactor this sample script without changing behaviour",
    out: "Simulated change proposal with separated functions, types and tests. Review the diff, coverage and behavioural equivalence.",
    tag: "change draft · review required",
  },
  {
    cmd: "you > Claude: draft an onboarding memo from these approved details",
    out: "Simulated one-page draft with sample links, meeting cadence and initial tasks. Subject-matter and people review remain pending.",
    tag: "bounded-context draft · simulation",
  },
];

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

function CommandPalette({ locale }: { readonly locale: Locale }) {
  const reducedMotion = usePrefersReducedMotion();
  const motionAllowed = useMotionAllowed();
  const [paletteRef, paletteInView] = usePaletteInView();
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const prompts = locale === "en" ? DEMO_PROMPTS_EN : DEMO_PROMPTS;
  const cur = prompts[idx];

  useEffect(() => {
    if (reducedMotion) {
      // Static: show the first prompt fully with output — no cycling.
      setTyped(prompts[0].cmd);
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
        setIdx((i) => (i + 1) % prompts.length);
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
    prompts,
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
          <span>{locale === "en" ? "claude · simulated example" : "claude · simuliertes Beispiel"}</span>
          <span className="flex gap-1.5">
            {prompts.map((_, i) => (
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

function AiNativeHeroContent({ locale = "de" }: { readonly locale?: Locale }) {
  const isEnglish = locale === "en";
  const trustSignals = getAiNativeTrustSignals(locale);
  return (
    <section className="relative flex min-h-[100dvh] items-start bg-background px-4 pb-12 pt-24 sm:px-6 md:pt-28 lg:items-center lg:px-12 lg:pb-14">
      <div className="mx-auto w-full max-w-[1280px]">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* LEFT — copy + CTAs */}
          <div>
            <div>
              <span className="inline-flex items-center gap-2 border border-brand-orange/35 bg-brand-orange/10 px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-orange">
                <Zap size={12} />
                {isEnglish
                  ? "AI-Native Workflow Course · all modules free"
                  : "AI-Native Arbeitskurs · alle Module kostenlos"}
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
              {isEnglish ? "Define the task." : "Kontext geben."}
              <br />
              <span className="text-brand-orange">
                {isEnglish ? "Review the output." : "Output prüfen."}
              </span>
            </h1>

            <p className="mt-5 max-w-[520px] text-[17px] leading-[1.55] text-muted-foreground">
              {isEnglish ? (
                <>
                  AI-native work means defining a bounded task, supplying the
                  relevant context and checking the result against explicit
                  criteria. The course covers that method in four modules and
                  27 lessons, using Claude as the main example.
                </>
              ) : (
                <>
                  AI-native arbeiten heißt: Aufgabe abgrenzen, relevanten
                  Kontext bereitstellen und das Ergebnis anhand klarer
                  Kriterien prüfen. Der Kurs zeigt diese Methode in vier
                  Modulen und 27 Lektionen am Beispiel Claude.
                </>
              )}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <BrandButton
                href={localizeHref("/ai-native/kurs/modul_1", locale)}
                prefetch={false}
                variant="primary"
              >
                {isEnglish ? "Start with a free learning account" : "Kostenlos mit Lernkonto starten"} <ArrowRight size={15} />
              </BrandButton>
              <BrandButton
                href={localizeHref("/ai-native/fluency-test", locale)}
                variant="outline"
              >
                {isEnglish ? "Fluency self-assessment · 5 min" : "Fluency-Test · 5 Min"}
              </BrandButton>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>
                <span className="text-brand-orange">▸</span> 27 {isEnglish ? "lessons" : "Lektionen"}
              </span>
              <span>
                <span className="text-brand-orange">▸</span> 4 {isEnglish ? "modules" : "Module"}
              </span>
              <span>
                <span className="text-brand-orange">▸</span> 12 h · {isEnglish ? "self-paced" : "im eigenen Tempo"}
              </span>
              <span>
                <span className="text-brand-orange">▸</span> Claude example · {isEnglish ? "English" : "Deutsch"}
              </span>
            </div>

            {/* Trust signals — hidden on short viewports to keep hero in one screen */}
            <div>
              <ul className="mt-6 hidden space-y-1.5 text-[13px] text-muted-foreground md:block">
                {trustSignals.map((signal, i) => (
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
                href={localizeHref("/ai-native/demos", locale)}
                className="transition-colors hover:text-brand-orange"
              >
                → {isEnglish ? "Open 9 course simulations" : "9 Kurssimulationen öffnen"}
              </a>
              <a
                href={localizeHref("/ai-native/glossar", locale)}
                className="transition-colors hover:text-brand-orange"
              >
                → {isEnglish ? "Glossary (70 terms)" : "Glossar (70 Begriffe)"}
              </a>
              <a
                href={localizeHref("/ai-native/capstone-gallery", locale)}
                className="transition-colors hover:text-brand-orange"
              >
                → {isEnglish ? "Capstone publication policy" : "Capstone-Veröffentlichungsregeln"}
              </a>
              <a
                href={localizeHref("/ki-fuehrerschein", locale)}
                className="transition-colors hover:text-brand-orange"
              >
                → {isEnglish ? "AI Fundamentals" : "KI-Führerschein"}
              </a>
            </div>
          </div>

          {/* RIGHT — live command palette */}
          <div>
            <CommandPalette locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}

export const AiNativeHero = withMotionProvider(AiNativeHeroContent);
