"use client";

import { useState, useRef, type JSX } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { DemoOverline } from "./_shared";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/**
 * MaturityDemo — 5-question AI-readiness assessment → classified band.
 *
 * Provenance: first-party loehrning.ai implementation by Tim Löhr.
 * Ported 2026-04-21. See AI-native demo gallery implementation.
 */

interface QuestionOption {
  readonly text: string;
  readonly score: number;
}

interface Question {
  readonly question: string;
  readonly dimension: string;
  readonly options: readonly QuestionOption[];
}

const QUESTIONS: readonly Question[] = [
  {
    question: "Wie verwalten Sie aktuell Unternehmensdaten?",
    dimension: "Daten",
    options: [
      { text: "Dateiserver, Excel, Outlook-Ordner", score: 1 },
      { text: "ERP/CRM vorhanden, getrennte Silos", score: 2 },
      { text: "Integriert, aber wenig strukturiert", score: 3 },
      { text: "Data Warehouse + zentrales Governance", score: 4 },
    ],
  },
  {
    question: "Haben Sie bereits KI-Projekte umgesetzt?",
    dimension: "KI-Einsatz",
    options: [
      { text: "Nein, noch nicht", score: 1 },
      { text: "Einzelne Pilotversuche", score: 2 },
      { text: "2–3 produktive Anwendungen", score: 3 },
      { text: "Skalierter KI-Einsatz über Abteilungen", score: 4 },
    ],
  },
  {
    question: "Wie ist Ihr Datenschutz-Setup?",
    dimension: "Governance",
    options: [
      { text: "DSGVO-Grundlagen, keine klare AI-Policy", score: 1 },
      { text: "Schriftliche AI-Richtlinie in Arbeit", score: 2 },
      { text: "AI-Policy + DSFA-Prozess etabliert", score: 3 },
      { text: "ISO 42001 zertifiziert oder auf Kurs", score: 4 },
    ],
  },
  {
    question: "Welche Kompetenzen sind intern vorhanden?",
    dimension: "Kompetenz",
    options: [
      { text: "Kein KI-Know-how, Bedarf nach Schulung", score: 1 },
      { text: "Einzelne Power-User, kein Team", score: 2 },
      { text: "Dediziertes Data/ML-Team (< 5 FTE)", score: 3 },
      { text: "Mehrere KI-Teams, CoE-Struktur", score: 4 },
    ],
  },
  {
    question: "Wie messen Sie den Erfolg digitaler Initiativen?",
    dimension: "Messung",
    options: [
      { text: "Gar nicht oder nur Bauchgefühl", score: 1 },
      { text: "KPIs auf Projekt-Basis, unregelmäßig", score: 2 },
      { text: "Klare OKRs pro Initiative", score: 3 },
      { text: "Integrierte Wirtschaftlichkeits-Rechnung", score: 4 },
    ],
  },
];

interface MaturityBand {
  readonly min: number;
  readonly max: number;
  readonly label: string;
  readonly description: string;
  /** Tailwind text-color utility for the band accent. */
  readonly accentClass: string;
  /** Tailwind bg utility for the progress bar fill. */
  readonly fillClass: string;
}

const BANDS: readonly MaturityBand[] = [
  {
    min: 5,
    max: 9,
    label: "Explorer",
    description:
      "Sie sind am Anfang, und das ist kein Nachteil. Wer jetzt sauber aufbaut, überholt in 18 Monaten.",
    accentClass: "text-brand-amber",
    fillClass: "bg-brand-amber",
  },
  {
    min: 10,
    max: 13,
    label: "Starter",
    description:
      "Grundlagen vorhanden. Nächster Schritt: 1 Pilot mit hartem ROI, nicht 5 mit weichen Zielen.",
    accentClass: "text-brand-orange",
    fillClass: "bg-brand-orange",
  },
  {
    min: 14,
    max: 17,
    label: "Operator",
    description:
      "Sie produzieren Wert. Jetzt geht's um Skalierung und die Verhinderung von AI-Sprawl.",
    accentClass: "text-[var(--color-kupfer-light)]",
    fillClass: "bg-[var(--color-kupfer-light)]",
  },
  {
    min: 18,
    max: 20,
    label: "Leader",
    description:
      "Top 8 % des deutschen Mittelstands. Thema: Talent halten, Lead nicht verlieren.",
    accentClass: "text-[#22c55e]",
    fillClass: "bg-[#22c55e]",
  },
];

function findBand(total: number): MaturityBand {
  return BANDS.find((b) => total >= b.min && total <= b.max) ?? BANDS[0];
}

export function MaturityDemo(): JSX.Element {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = step >= QUESTIONS.length;
  const total = Object.values(answers).reduce((s, v) => s + v, 0);
  const band = findBand(total);

  function pickOption(opt: QuestionOption) {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setAnswers((prev) => ({ ...prev, [step]: opt.score }));
    const delay = reducedMotion ? 0 : 150;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setStep((s) => s + 1), delay);
  }

  function restart() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStep(0);
    setAnswers({});
  }

  const current = QUESTIONS[step];

  return (
    <div
      className="flex flex-col gap-5 overflow-hidden"
      role="region"
      aria-label="Reifegrad-Assessment"
    >
      <div>
        <DemoOverline>Reifegrad-Assessment · 5 Fragen</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          Wo steht Ihr <span className="text-brand-orange">Unternehmen.</span>
        </h3>
      </div>

      {!done && (
        <div
          className="flex gap-1"
          aria-label={`Frage ${step + 1} von ${QUESTIONS.length}`}
        >
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-[3px] flex-1 transition-colors",
                i < step
                  ? "bg-brand-orange"
                  : i === step
                    ? "bg-foreground"
                    : "bg-border",
              )}
            />
          ))}
        </div>
      )}

      {!done ? (
        <div className="flex flex-1 flex-col">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            Frage {step + 1} / {QUESTIONS.length}
          </div>
          <h4 className="mb-4 text-[20px] font-bold tracking-[-0.02em] text-foreground md:text-[22px]">
            {current.question}
          </h4>
          <div className="flex flex-col gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickOption(opt)}
                className={cn(
                  "flex items-center gap-3 border border-border bg-card/60 px-4 py-3 text-left text-[14px] transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-brand-orange hover:bg-foreground hover:text-background hover:shadow-[4px_4px_0_0_var(--color-brand-orange)]",
                )}
              >
                <span className="min-w-[22px] font-mono text-[12px] font-bold text-brand-orange">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <m.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="flex flex-col gap-5"
        >
          {/* Headline result card — dark */}
          <div
            className="dark-section border-t-4 bg-[var(--color-dark-bg)] px-6 py-7"
            style={{
              borderTopColor:
                band.label === "Explorer"
                  ? "var(--color-brand-amber)"
                  : band.label === "Starter"
                    ? "var(--color-brand-orange)"
                    : band.label === "Operator"
                      ? "var(--color-kupfer-light)"
                      : "#22c55e",
            }}
          >
            <div
              className={cn(
                "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                band.accentClass,
              )}
            >
              Ihr Reifegrad
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <div className="text-[40px] font-bold leading-none tracking-[-0.04em] text-[var(--color-dark-fg)] md:text-[48px]">
                {band.label}.
              </div>
              <div
                className={cn(
                  "font-mono text-[32px] font-bold md:text-[36px]",
                  band.accentClass,
                )}
              >
                {total}/20
              </div>
            </div>
            <p className="mt-3.5 max-w-[540px] text-[14px] leading-[1.55] text-[var(--color-dark-fg)]/85 md:text-[15px]">
              {band.description}
            </p>
          </div>

          {/* Per-dimension bars */}
          <div>
            <div className="mb-2.5">
              <DemoOverline>Ihr Profil nach Dimension</DemoOverline>
            </div>
            <div className="flex flex-col gap-2">
              {QUESTIONS.map((q, i) => {
                const score = answers[i] ?? 0;
                const pct = (score / 4) * 100;
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[110px_1fr_38px] items-center gap-3 md:grid-cols-[180px_1fr_40px]"
                  >
                    <div className="truncate text-[12px] text-muted-foreground">
                      {q.dimension}
                    </div>
                    <div className="relative h-2.5 bg-border">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                        className={cn(
                          "absolute inset-y-0 left-0",
                          band.fillClass,
                        )}
                      />
                    </div>
                    <div className="text-right font-mono text-[11px] font-bold text-foreground">
                      {score}/4
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={restart}
              className="border border-foreground bg-transparent px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              ↺ Neu starten
            </button>
            <Link
              href="/ai-native/kurs/modul_1"
              className="inline-flex flex-1 items-center justify-center border-2 border-foreground bg-brand-orange px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
            >
              Weiterlernen →
            </Link>
          </div>
        </m.div>
      )}
    </div>
  );
}

export default MaturityDemo;
