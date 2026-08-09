"use client";

import { useState, useRef, type JSX } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { DemoOverline } from "./_shared";
import { useDemoLocale } from "@/components/demos/demo-locale";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
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

const QUESTIONS: Readonly<Record<Locale, readonly Question[]>> = {
  de: [
    {
      question: "Wie verwalten Sie derzeit Unternehmensdaten?",
      dimension: "Daten",
      options: [
        { text: "Dateiserver, Tabellen und persönliche Ablagen", score: 1 },
        { text: "ERP oder CRM mit getrennten Datensilos", score: 2 },
        {
          text: "Teilweise integriert, aber uneinheitlich beschrieben",
          score: 3,
        },
        { text: "Zentrale Plattform mit dokumentierter Governance", score: 4 },
      ],
    },
    {
      question: "Welchen Betriebsstand haben Ihre KI-Anwendungen?",
      dimension: "KI-Einsatz",
      options: [
        { text: "Noch keine Anwendung", score: 1 },
        { text: "Einzelne, zeitlich begrenzte Pilotversuche", score: 2 },
        { text: "Zwei oder drei produktive Anwendungen", score: 3 },
        {
          text: "Mehrere produktive Anwendungen mit gemeinsamem Betriebsmodell",
          score: 4,
        },
      ],
    },
    {
      question: "Wie sind Datenschutz und KI-Governance organisiert?",
      dimension: "Governance",
      options: [
        {
          text: "Allgemeine Datenschutzregeln, keine KI-spezifische Regelung",
          score: 1,
        },
        { text: "Eine schriftliche KI-Richtlinie wird erstellt", score: 2 },
        { text: "KI-Richtlinie und DSFA-Prozess sind eingeführt", score: 3 },
        {
          text: "Kontrollen, Zuständigkeiten und Prüfintervalle sind dokumentiert",
          score: 4,
        },
      ],
    },
    {
      question: "Welche KI- und Datenkompetenzen sind intern verfügbar?",
      dimension: "Kompetenz",
      options: [
        { text: "Keine benannte Zuständigkeit oder Schulung", score: 1 },
        { text: "Einzelne erfahrene Nutzer, aber kein festes Team", score: 2 },
        {
          text: "Benanntes Daten- oder ML-Team mit begrenzter Kapazität",
          score: 3,
        },
        {
          text: "Mehrere Teams mit geklärten Rollen und gemeinsamer Koordination",
          score: 4,
        },
      ],
    },
    {
      question: "Wie messen Sie den Nutzen digitaler Initiativen?",
      dimension: "Messung",
      options: [
        { text: "Keine festgelegten Messgrößen", score: 1 },
        { text: "Projektbezogene Kennzahlen, unregelmäßig geprüft", score: 2 },
        {
          text: "Messgrößen, Zielwerte und Prüftermine je Initiative",
          score: 3,
        },
        {
          text: "Nutzen, Kosten und Risiken werden gemeinsam und regelmäßig geprüft",
          score: 4,
        },
      ],
    },
  ],
  en: [
    {
      question: "How does your organization currently manage company data?",
      dimension: "Data",
      options: [
        { text: "File servers, spreadsheets, and personal folders", score: 1 },
        { text: "ERP or CRM systems with separate data silos", score: 2 },
        { text: "Partly integrated, but described inconsistently", score: 3 },
        { text: "Central platform with documented governance", score: 4 },
      ],
    },
    {
      question: "What is the operating status of your AI applications?",
      dimension: "AI use",
      options: [
        { text: "No application yet", score: 1 },
        { text: "Individual, time-bounded pilots", score: 2 },
        { text: "Two or three production applications", score: 3 },
        {
          text: "Several production applications with a shared operating model",
          score: 4,
        },
      ],
    },
    {
      question: "How are data protection and AI governance organized?",
      dimension: "Governance",
      options: [
        {
          text: "General data-protection rules, no AI-specific policy",
          score: 1,
        },
        { text: "A written AI policy is being prepared", score: 2 },
        {
          text: "An AI policy and impact-assessment process are in place",
          score: 3,
        },
        {
          text: "Controls, owners, and review intervals are documented",
          score: 4,
        },
      ],
    },
    {
      question: "Which AI and data capabilities are available internally?",
      dimension: "Capability",
      options: [
        { text: "No named owner or training", score: 1 },
        { text: "Individual experienced users, but no defined team", score: 2 },
        { text: "A named data or ML team with limited capacity", score: 3 },
        {
          text: "Several teams with defined roles and shared coordination",
          score: 4,
        },
      ],
    },
    {
      question: "How do you measure the value of digital initiatives?",
      dimension: "Measurement",
      options: [
        { text: "No defined measures", score: 1 },
        { text: "Project-specific metrics reviewed irregularly", score: 2 },
        {
          text: "Measures, target values, and review dates for each initiative",
          score: 3,
        },
        {
          text: "Value, cost, and risk are reviewed together and regularly",
          score: 4,
        },
      ],
    },
  ],
};

const COPY = {
  de: {
    region: "Selbsteinschätzung zum KI-Betriebsstand",
    overline: "Reifegrad-Selbsteinschätzung · 5 Fragen",
    heading: "Betriebsstand einschätzen.",
    progress: (current: number, total: number) =>
      `Frage ${current} von ${total}`,
    question: "Frage",
    result: "Ergebnis der Selbsteinschätzung",
    profile: "Antworten nach Dimension",
    boundary:
      "Kein Benchmark: Das Ergebnis basiert ausschließlich auf diesen fünf Selbstauskünften.",
    restart: "Neu starten",
    continue: "Im Kurs weiterlernen",
  },
  en: {
    region: "AI maturity self-assessment",
    overline: "Maturity self-assessment · 5 questions",
    heading: "Assess the operating baseline.",
    progress: (current: number, total: number) =>
      `Question ${current} of ${total}`,
    question: "Question",
    result: "Self-assessment result",
    profile: "Responses by dimension",
    boundary:
      "Not a benchmark: the result is based only on these five self-reported answers.",
    restart: "Restart",
    continue: "Continue in the course",
  },
} as const;

interface MaturityBand {
  readonly min: number;
  readonly max: number;
  readonly label: string;
  readonly description: Readonly<Record<Locale, string>>;
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
    description: {
      de: "In mehreren Bereichen fehlen Grundlagen. Dokumentieren Sie zuerst Datenzugriff, Zuständigkeiten und einen abgegrenzten Anwendungsfall.",
      en: "Several foundations are missing. First document data access, ownership, and one bounded use case.",
    },
    accentClass: "text-brand-amber",
    fillClass: "bg-brand-amber",
  },
  {
    min: 10,
    max: 13,
    label: "Starter",
    description: {
      de: "Einzelne Grundlagen bestehen. Begrenzen Sie einen Pilotfall und definieren Sie Messgröße, Datenzugriff und Abbruchkriterium.",
      en: "Some foundations are in place. Bound one pilot and define its measure, data access, and stopping condition.",
    },
    accentClass: "text-brand-orange",
    fillClass: "bg-brand-orange",
  },
  {
    min: 14,
    max: 17,
    label: "Operator",
    description: {
      de: "Mehrere Voraussetzungen bestehen. Prüfen Sie Skalierung, Zuständigkeiten und gemeinsame Regeln für parallel eingesetzte Werkzeuge.",
      en: "Several prerequisites are in place. Review scaling, ownership, and shared controls for tools used in parallel.",
    },
    accentClass: "text-[var(--color-kupfer-light)]",
    fillClass: "bg-[var(--color-kupfer-light)]",
  },
  {
    min: 18,
    max: 20,
    label: "Leader",
    description: {
      de: "Die Selbstauskunft zeigt in allen fünf Bereichen einen hohen Stand. Prüfen Sie die Angaben anhand von Nachweisen und festen Prüfterminen.",
      en: "The answers indicate a high baseline in all five areas. Verify them against evidence and scheduled review dates.",
    },
    accentClass: "text-risk-green",
    fillClass: "bg-risk-green",
  },
];

function findBand(total: number): MaturityBand {
  return BANDS.find((b) => total >= b.min && total <= b.max) ?? BANDS[0];
}

export function MaturityDemo(): JSX.Element {
  const { locale } = useDemoLocale();
  const questions = QUESTIONS[locale];
  const copy = COPY[locale];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const done = step >= questions.length;
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

  const current = questions[step];

  return (
    <div
      className="flex flex-col gap-5 overflow-hidden"
      role="region"
      aria-label={copy.region}
    >
      <div>
        <DemoOverline>{copy.overline}</DemoOverline>
        <h3 className="mt-2 text-[24px] font-bold tracking-[-0.03em] text-foreground md:text-[26px]">
          {copy.heading}
        </h3>
      </div>

      {!done && (
        <div
          className="flex gap-1"
          aria-label={copy.progress(step + 1, questions.length)}
        >
          {questions.map((_, i) => (
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
            {copy.question} {step + 1} / {questions.length}
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
                      : "var(--color-risk-green)",
            }}
          >
            <div
              className={cn(
                "font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                band.accentClass,
              )}
            >
              {copy.result}
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
              {band.description[locale]}
            </p>
            <p className="mt-3 max-w-[540px] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-dark-muted)]">
              {copy.boundary}
            </p>
          </div>

          {/* Per-dimension bars */}
          <div>
            <div className="mb-2.5">
              <DemoOverline>{copy.profile}</DemoOverline>
            </div>
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => {
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
              ↺ {copy.restart}
            </button>
            <Link
              href={localizeHref("/ai-native/kurs/modul_1", locale)}
              prefetch={false}
              className="inline-flex flex-1 items-center justify-center border-2 border-foreground bg-brand-orange px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[4px_4px_0_0_var(--color-foreground)] transition-[background-color,border-color,color,opacity,transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-foreground)]"
            >
              {copy.continue} →
            </Link>
          </div>
        </m.div>
      )}
    </div>
  );
}

export default MaturityDemo;
