"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import {
  ClipHeading,
  Eyebrow,
  FadeBlock,
  CountUp,
} from "@/components/ai-native/primitives";
import { BrandButton } from "@/components/ui/brand-button";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";

/* AI-Native Fluency Test
 * 10 scenarios across 5 dimensions. One question at a time, step dots,
 * auto-advance after selection, results panel with per-dimension bars +
 * weakest-dimension callout. */

type Dimension = "drafting" | "delegation" | "automation" | "knowledge" | "governance";

interface DimensionMeta {
  readonly id: Dimension;
  readonly label: string;
  readonly shortDesc: string;
  readonly weakestRecommendation: string;
}

const DIMENSIONS: readonly DimensionMeta[] = [
  {
    id: "drafting",
    label: "Drafting",
    shortDesc: "Erzeugst du Text-Entwürfe mit Claude oder selbst?",
    weakestRecommendation:
      "Du tippst noch zu viel selbst. Modul 1 · Lektion 1.1 (Claude-Brief-Methode) plus Lektion 1.4 (10 Use-Cases) sind dein direkter Sprung.",
  },
  {
    id: "delegation",
    label: "Delegation",
    shortDesc: "Übergibst du ganze Aufgaben mit Kontext?",
    weakestRecommendation:
      "Du arbeitest mit Claude, aber briefst ihn nicht systematisch. Modul 1 · Lektion 1.3 (Orchestrator) plus Modul 2 · Lektion 2.1 (Projects) decken das ab.",
  },
  {
    id: "automation",
    label: "Automation",
    shortDesc: "Laufen Workflows im Hintergrund für dich?",
    weakestRecommendation:
      "Du machst Dinge noch manuell, die vorbereitet werden könnten. Modul 4 · Sandbox-Builds 4.2 bis 4.4 geben dir drei prüfbare Muster.",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    shortDesc: "Ist dein Wissen AI-abfragbar?",
    weakestRecommendation:
      "Dein Wissen ist noch nicht AI-abfragbar. Modul 3 (Obsidian + Claude) ist dein nächster Schritt.",
  },
  {
    id: "governance",
    label: "Governance",
    shortDesc: "Kennst du die DSGVO/AI-Act-Grenzen?",
    weakestRecommendation:
      "Du bist bei Compliance unsicher. Starte mit dem kostenlosen KI-Führerschein, dann Modul 4 · Lektion 4.6 (Annex III).",
  },
];

interface Scenario {
  readonly id: string;
  readonly dimension: Dimension;
  readonly question: string;
  readonly options: readonly { readonly label: string; readonly score: 0 | 1 | 2 | 3 }[];
}

const SCENARIOS: readonly Scenario[] = [
  {
    id: "s1",
    dimension: "drafting",
    question: "Kundenmail auf deinem Desktop, Antwort muss heute raus. Wie startest du?",
    options: [
      { label: "Ich öffne Google Docs und tippe", score: 0 },
      { label: "Ich öffne Claude, tippe kurze Stichworte", score: 1 },
      { label: "Ich öffne Claude, kopiere die Kundenmail rein, gebe Rolle+Kontext+Auftrag", score: 2 },
      { label: "Ich habe eine Skill dafür, rufe /kunden-antwort auf", score: 3 },
    ],
  },
  {
    id: "s2",
    dimension: "delegation",
    question: "Du musst eine Stellenausschreibung schreiben.",
    options: [
      { label: "Ich öffne Word und tippe", score: 0 },
      { label: "Ich bitte Claude: 'schreib eine Stellenausschreibung'", score: 1 },
      { label: "Ich gebe Claude: Rolle, Firmen-Kontext, Tätigkeitsprofil, Gehaltsrange", score: 2 },
      { label: "Ich habe ein Claude-Project mit vollständigem Briefing, ein Satz reicht", score: 3 },
    ],
  },
  {
    id: "s3",
    dimension: "automation",
    question: "Du erhältst eine Website-Formular-Anfrage.",
    options: [
      { label: "Ich sehe sie in Email, übertrage manuell ins CRM", score: 0 },
      { label: "Formular schreibt direkt ins CRM", score: 1 },
      { label: "Formular schreibt ins CRM UND triggert Claude-Prompt für Erst-Antwort", score: 2 },
      { label: "Der gesamte Prozess läuft ohne mich", score: 3 },
    ],
  },
  {
    id: "s4",
    dimension: "knowledge",
    question: "Vorgesetzter fragt: 'Was haben wir im Januar zum Thema X entschieden?'",
    options: [
      { label: "Ich suche in meinem Kopf", score: 0 },
      { label: "Ich suche in Emails + Notion + Dateiablage", score: 1 },
      { label: "Ich frage Copilot for Obsidian", score: 2 },
      { label: "Ich habe Skill /entscheidungs-log", score: 3 },
    ],
  },
  {
    id: "s5",
    dimension: "governance",
    question: "Kollege fragt, ob er ChatGPT mit Kundendaten nutzen darf.",
    options: [
      { label: "'Ich weiß nicht genau'", score: 0 },
      { label: "'Ich glaube nicht, wegen DSGVO'", score: 1 },
      { label: "Ich kann klassifizieren und konkret empfehlen", score: 2 },
      { label: "Unsere Firma hat eine KI-Richtlinie, ich verweise drauf", score: 3 },
    ],
  },
  {
    id: "s6",
    dimension: "drafting",
    question: "Du brauchst Stichpunkte für eine Präsentation.",
    options: [
      { label: "Stundenlang Brainstormen, dann formatieren", score: 0 },
      { label: "Claude fragen: 'mach mir eine Präsentation zu X'", score: 1 },
      { label: "Claude: Rohmaterial geben, Audience + Länge + Stil spezifizieren", score: 2 },
      { label: "/praesentation-struktur Skill mit festem Format", score: 3 },
    ],
  },
  {
    id: "s7",
    dimension: "delegation",
    question: "Wöchentlicher Bericht an Vorgesetzte.",
    options: [
      { label: "Ich schreibe ihn Freitag nachmittag von Hand", score: 0 },
      { label: "Ich lass Claude aus Stichworten schreiben", score: 1 },
      { label: "Claude holt aus meinem Obsidian die Woche, schreibt Draft", score: 2 },
      { label: "n8n-Flow läuft Freitag 15 Uhr automatisch, ich review + schicke Freitag 16 Uhr", score: 3 },
    ],
  },
  {
    id: "s8",
    dimension: "automation",
    question: "Meeting-Transkript von tl;dv.",
    options: [
      { label: "Ich lese es durch, extrahiere manuell Action-Items", score: 0 },
      { label: "Ich schicke es an Claude, lass Action-Items extrahieren", score: 1 },
      { label: "Skill /meeting-summary-de läuft auf jeden tl;dv-Link", score: 2 },
      { label: "n8n-Flow: tl;dv → Skill → Notion-Datenbank → Slack-Notification", score: 3 },
    ],
  },
  {
    id: "s9",
    dimension: "knowledge",
    question: "Du liest eine relevante Web-Quelle.",
    options: [
      { label: "Ich speichere den Tab und lese später (nie)", score: 0 },
      { label: "Ich kopiere die URL in eine Notiz", score: 1 },
      { label: "Obsidian Web Clipper: Artikel landet automatisch in Inbox mit AI-Summary", score: 2 },
      { label: "Zusätzlich: Smart Connections zeigt mir sofort, zu welchen meiner Projekte der Artikel relevant ist", score: 3 },
    ],
  },
  {
    id: "s10",
    dimension: "governance",
    question: "Neuer AI-Workflow in deiner Firma soll pilotiert werden. Was prüfst du?",
    options: [
      { label: "Ob es funktioniert", score: 0 },
      { label: "Ob DSGVO-relevante Daten fließen", score: 1 },
      { label: "DSGVO + Annex-III-Klassifikation (ist es Hochrisiko?) + AVVs", score: 2 },
      { label: "Standard-Audit-Checkliste: DSGVO, EU-AI-Act, Art. 22, AVVs, FRIA falls nötig, Betriebsrat", score: 3 },
    ],
  },
];

type Answers = Record<string, number>;

export function FluencyTest() {
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const current = SCENARIOS[idx];
  const answered = Object.keys(answers).length;

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
    // Auto-advance after a beat (skips if last)
    if (idx < SCENARIOS.length - 1) {
      setTimeout(() => setIdx((i) => Math.min(SCENARIOS.length - 1, i + 1)), 220);
    }
  };

  const reset = () => {
    setAnswers({});
    setIdx(0);
    setSubmitted(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Scoring */
  const totalScore = useMemo(
    () =>
      Object.entries(answers).reduce((sum, [sid, optIdx]) => {
        const s = SCENARIOS.find((x) => x.id === sid);
        return sum + (s?.options[optIdx]?.score ?? 0);
      }, 0),
    [answers],
  );
  const maxScore = SCENARIOS.length * 3;
  const percent = Math.round((totalScore / maxScore) * 100);

  const perDim = useMemo(
    () =>
      DIMENSIONS.map((d) => {
        const items = SCENARIOS.filter((s) => s.dimension === d.id);
        const scored = items.reduce((sum, s) => {
          const oi = answers[s.id];
          return sum + (oi != null ? (s.options[oi]?.score ?? 0) : 0);
        }, 0);
        const max = items.length * 3;
        return { ...d, score: scored, max, pct: max > 0 ? scored / max : 0 };
      }),
    [answers],
  );

  const weakest = useMemo(
    () => perDim.reduce((w, d) => (d.pct < w.pct ? d : w), perDim[0]),
    [perDim],
  );

  const level =
    percent < 25
      ? {
          title: "Explorer",
          desc: "Du nutzt KI gelegentlich. Modul 1 ist für dich entworfen.",
        }
      : percent < 50
        ? {
            title: "User",
            desc: "Du bist dabei, aber orchestrierst nicht. Der Arbeitskurs schliesst die Lücke.",
          }
        : percent < 75
          ? {
              title: "Practitioner",
              desc: "Du bist weiter als 80 % deiner Kollegen. Modul 3 - 4 hebt dich auf Operator-Level.",
            }
          : {
              title: "Operator",
              desc: "Du arbeitest schon AI-native. Der Arbeitskurs gibt dir die systematische Sprache dafür.",
            };

  /* ─── Result view ─── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-14 md:py-20">
        <Eyebrow>Dein Ergebnis</Eyebrow>
        <ClipHeading
          as="h1"
          className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Hier stehst du.
        </ClipHeading>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <FadeBlock delay={1}>
            <div className="border-t-[3px] border-brand-orange pt-5">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                Score
              </p>
              <div className="mt-3 flex items-baseline gap-3">
                <CountUp
                  value={percent}
                  suffix="%"
                  className="text-[clamp(3.5rem,8vw,5rem)]"
                />
                <span className="font-mono text-[14px] text-muted-foreground">
                  {totalScore} / {maxScore}
                </span>
              </div>
              <p className="mt-5 text-[22px] font-bold tracking-[-0.02em] text-foreground">
                Level: {level.title}.
              </p>
              <p className="mt-2 max-w-[480px] text-[15.5px] leading-[1.65] text-muted-foreground">
                {level.desc}
              </p>
            </div>
          </FadeBlock>

          <FadeBlock delay={2}>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                5 Dimensionen
              </p>
              <div className="mt-4 grid gap-5">
                {perDim.map((d, i) => (
                  <FadeBlock key={d.id} delay={3 + i}>
                    <div>
                      <div className="mb-1.5 flex items-baseline justify-between">
                        <span className="text-[14px] font-semibold text-foreground">
                          {d.label}
                        </span>
                        <span className="font-mono text-[12px] text-muted-foreground">
                          {d.score}/{d.max}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden bg-border">
                        <m.div
                          className={cn(
                            "h-full",
                            d.id === weakest.id ? "bg-brand-orange" : "bg-brand-sand",
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${d.pct * 100}%` }}
                          transition={{ duration: 0.7, ease: EASE_OUT_EXPO, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                      <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                        {d.shortDesc}
                      </p>
                    </div>
                  </FadeBlock>
                ))}
              </div>
            </div>
          </FadeBlock>
        </div>

        <FadeBlock delay={7}>
          <div className="mt-14 border-l-[3px] border-brand-orange bg-[var(--color-kupfer-mist)] px-8 py-7">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              Schwächste Dimension: {weakest.label}
            </p>
            <p className="mt-3 max-w-[640px] text-[17px] leading-[1.55] text-foreground">
              {weakest.weakestRecommendation}
            </p>
          </div>
        </FadeBlock>

        <FadeBlock delay={8}>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <BrandButton href="/ai-native/kurs/modul_1" variant="primary" surface="light">
              Kurs starten <ArrowRight size={14} />
            </BrandButton>
            <BrandButton href="/ai-native" variant="outline" surface="light">
              Zurück zur Übersicht
            </BrandButton>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 p-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-brand-orange"
            >
              <RotateCcw size={12} /> Nochmal machen
            </button>
          </div>
        </FadeBlock>
      </div>
    );
  }

  /* ─── Question view ─── */
  return (
    <div className="mx-auto max-w-[960px] px-6 py-14 md:py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-5">
        <div>
          <Eyebrow>Fluency-Test</Eyebrow>
          <ClipHeading
            as="h1"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Wo stehst du?
          </ClipHeading>
        </div>
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
          {String(idx + 1).padStart(2, "0")} / {String(SCENARIOS.length).padStart(2, "0")}
        </span>
      </div>

      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[640px] text-[16px] leading-[1.65] text-muted-foreground">
          10 Szenarien aus dem Mittelstand-Alltag. 5 Dimensionen. Nach ca. 5
          Minuten weisst du, wo du stehst, und welches Modul dein nächster
          Schritt ist.
        </p>
      </FadeBlock>

      {/* Progress bar */}
      <div className="mt-10 flex items-center gap-3.5">
        <div className="h-0.5 flex-1 overflow-hidden bg-border">
          <m.div
            className="h-full bg-brand-orange"
            animate={{ width: `${(answered / SCENARIOS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          {answered}/{SCENARIOS.length}
        </span>
      </div>

      {/* Step dots */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {SCENARIOS.map((s, i) => {
          const done = answers[s.id] != null;
          const cur = i === idx;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Szenario ${i + 1}`}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center border p-0 font-mono text-[11px] font-bold transition-[background-color,border-color,color,opacity,transform,box-shadow]",
                cur
                  ? "border-foreground bg-foreground text-background"
                  : done
                    ? "border-brand-orange bg-brand-orange text-white"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Current scenario */}
      <AnimatePresence mode="wait">
        <m.div
          key={current.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          className="mt-14"
        >
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
            Szenario {String(idx + 1).padStart(2, "0")} ·{" "}
            {DIMENSIONS.find((d) => d.id === current.dimension)?.label}
          </p>
          <h2
            className="mt-3 font-bold leading-[1.15] tracking-[-0.03em] text-foreground"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
          >
            „{current.question}"
          </h2>

          <div className="mt-8 grid gap-2.5">
            {current.options.map((opt, i) => {
              const selected = answers[current.id] === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectAnswer(i)}
                  className={cn(
                    "flex items-start gap-3.5 border p-4 text-left transition-[background-color,border-color,color,opacity,transform,box-shadow] duration-150",
                    selected
                      ? "border-brand-orange border-l-[3px] bg-[var(--color-kupfer-mist)]"
                      : "border-border bg-card/30 hover:border-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 pt-0.5 font-mono text-[13px] font-bold",
                      selected ? "text-brand-orange" : "text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-[14.5px] leading-[1.5] text-foreground">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </m.div>
      </AnimatePresence>

      {/* Footer nav */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className={cn(
            "font-mono text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
            idx === 0
              ? "cursor-not-allowed text-muted"
              : "text-muted-foreground hover:text-brand-orange",
          )}
        >
          ← Zurück
        </button>
        {idx < SCENARIOS.length - 1 ? (
          <button
            type="button"
            onClick={() => setIdx(Math.min(SCENARIOS.length - 1, idx + 1))}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange transition-colors hover:text-brand-amber"
          >
            Weiter →
          </button>
        ) : (
          <BrandButton
            variant="primary"
            surface="light"
            onClick={() => setSubmitted(true)}
            disabled={answered < SCENARIOS.length}
          >
            Auswerten <ArrowRight size={14} />
          </BrandButton>
        )}
      </div>

      {/* Cross-link to KI-F */}
      <FadeBlock delay={2}>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Noch ganz am Anfang?{" "}
          <Link
            href="/ki-fuehrerschein"
            className="text-brand-orange underline decoration-brand-orange/40 underline-offset-4 hover:text-brand-amber"
          >
            KI-Führerschein
          </Link>{" "}
          ist kostenlos und zählt als Prerequisite.
        </p>
      </FadeBlock>
    </div>
  );
}
