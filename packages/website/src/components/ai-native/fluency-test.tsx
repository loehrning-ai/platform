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
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

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
    shortDesc: "Wie kommst du von Quellenmaterial zu einem prüfbaren Entwurf?",
    weakestRecommendation:
      "Beginne mit Modul 1, Lektion 1.1 und 1.4. Sie behandeln begrenzte Briefings und wiederkehrende Entwurfsaufgaben.",
  },
  {
    id: "delegation",
    label: "Delegation",
    shortDesc: "Definierst du Kontext, Grenzen und Prüfkriterien?",
    weakestRecommendation:
      "Nutze Modul 1, Lektion 1.3 und Modul 2, Lektion 2.1, um Aufgaben und ihren dauerhaften Kontext zu definieren.",
  },
  {
    id: "automation",
    label: "Automation",
    shortDesc: "Welche wiederkehrenden Schritte haben ausdrückliche Kontrollen?",
    weakestRecommendation:
      "Nutze die drei begrenzten Workflow-Übungen in Modul 4, Lektion 4.2 bis 4.4.",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    shortDesc: "Kannst du Entscheidungen mit ihrem Quellenkontext abrufen?",
    weakestRecommendation:
      "Modul 3 behandelt gepflegte Notizen, Abruf und Quellenprüfung mit Obsidian und Claude.",
  },
  {
    id: "governance",
    label: "Governance",
    shortDesc: "Erkennst du Daten- und Regulierungsprüfpunkte?",
    weakestRecommendation:
      "Prüfe zuerst den KI-Führerschein und danach Modul 4, Lektion 4.6. Das Material dient der Bildung und ist keine Rechtsberatung.",
  },
];

const DIMENSIONS_EN: readonly DimensionMeta[] = [
  {
    id: "drafting",
    label: "Drafting",
    shortDesc: "How do you move from source material to a reviewable draft?",
    weakestRecommendation:
      "Start with module 1, lessons 1.1 and 1.4. They cover bounded briefs and repeatable drafting tasks.",
  },
  {
    id: "delegation",
    label: "Delegation",
    shortDesc: "Do you provide context, constraints and review criteria?",
    weakestRecommendation:
      "Use module 1, lesson 1.3 and module 2, lesson 2.1 to define a task and maintain its context.",
  },
  {
    id: "automation",
    label: "Automation",
    shortDesc: "Which repeated steps have explicit controls?",
    weakestRecommendation:
      "Use the three bounded workflow exercises in module 4, lessons 4.2 to 4.4.",
  },
  {
    id: "knowledge",
    label: "Knowledge",
    shortDesc: "Can you retrieve decisions with their source context?",
    weakestRecommendation:
      "Module 3 covers maintained notes, retrieval and source review with Obsidian and Claude.",
  },
  {
    id: "governance",
    label: "Governance",
    shortDesc: "Can you identify data and regulatory review points?",
    weakestRecommendation:
      "Review AI Fundamentals first, then module 4, lesson 4.6. The material is educational and not legal advice.",
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
    question: "Eine Kundenmail braucht heute eine Antwort. Wie beginnst du?",
    options: [
      { label: "Ich schreibe sie in einem leeren Dokument vollständig selbst", score: 0 },
      { label: "Ich lasse aus wenigen Stichpunkten einen Entwurf erstellen", score: 1 },
      { label: "Ich gebe freigegebene Mail, Rolle, Kontext, Auftrag und Ausgabegrenzen vor", score: 2 },
      { label: "Ich nutze einen gepflegten Skill mit Pflichtkontext und Review-Checkliste", score: 3 },
    ],
  },
  {
    id: "s2",
    dimension: "delegation",
    question: "Du brauchst eine Stellenausschreibung.",
    options: [
      { label: "Ich schreibe sie vollständig selbst", score: 0 },
      { label: "Ich fordere ohne weitere Angaben eine Stellenausschreibung an", score: 1 },
      { label: "Ich gebe Rolle, freigegebenen Firmenkontext, Tätigkeitsprofil, Gehaltsrahmen und Format vor", score: 2 },
      { label: "Ich nutze ein gepflegtes Project mit Quellenmaterial und Freigabekriterien", score: 3 },
    ],
  },
  {
    id: "s3",
    dimension: "automation",
    question: "Eine Website-Anfrage geht ein.",
    options: [
      { label: "Ich übertrage sie manuell aus der E-Mail ins CRM", score: 0 },
      { label: "Das Formular schreibt direkt ins CRM", score: 1 },
      { label: "Nach dem CRM-Eintrag entsteht ein Antwortentwurf zur Prüfung", score: 2 },
      { label: "Ein überwachter Ablauf validiert, weist einen Review zu und führt ein Audit-Protokoll", score: 3 },
    ],
  },
  {
    id: "s4",
    dimension: "knowledge",
    question: "Eine Führungskraft fragt nach einer Entscheidung aus dem Januar.",
    options: [
      { label: "Ich antworte aus dem Gedächtnis", score: 0 },
      { label: "Ich suche getrennt in E-Mail, Notizen und Dateiablage", score: 1 },
      { label: "Ich durchsuche eine gepflegte Wissensbasis", score: 2 },
      { label: "Ich rufe Entscheidung, Quelle, verantwortliche Person und spätere Änderungen zusammen ab", score: 3 },
    ],
  },
  {
    id: "s5",
    dimension: "governance",
    question: "Eine Person fragt, ob Kundendaten in ein KI-Werkzeug eingegeben werden dürfen.",
    options: [
      { label: "Ich weiß es nicht", score: 0 },
      { label: "Ich nehme pauschal an, die DSGVO verbiete es", score: 1 },
      { label: "Ich klassifiziere die Daten und prüfe Werkzeug sowie Verarbeitungsbedingungen", score: 2 },
      { label: "Ich wende Organisationsrichtlinie, Werkzeugregister und Eskalationsweg an", score: 3 },
    ],
  },
  {
    id: "s6",
    dimension: "drafting",
    question: "Du brauchst eine Gliederung für eine Präsentation.",
    options: [
      { label: "Ich entwickle und formatiere sie vollständig selbst", score: 0 },
      { label: "Ich fordere ohne Quellen eine Präsentation zum Thema an", score: 1 },
      { label: "Ich gebe Quellenmaterial, Zielgruppe, Länge, Ton und Ausgabestruktur vor", score: 2 },
      { label: "Ich nutze ein gepflegtes Muster mit Quellen und Review-Checkliste je Folie", score: 3 },
    ],
  },
  {
    id: "s7",
    dimension: "delegation",
    question: "Du erstellst einen Wochenbericht für eine Führungskraft.",
    options: [
      { label: "Ich schreibe ihn am Ende der Woche vollständig selbst", score: 0 },
      { label: "Ich lasse Stichpunkte in Fließtext umwandeln", score: 1 },
      { label: "Ich erstelle einen Entwurf aus gepflegten Notizen und prüfe jede Aussage", score: 2 },
      { label: "Ein geplanter Entwurf enthält Quellenlinks, Ausnahmehinweise und menschliche Freigabe", score: 3 },
    ],
  },
  {
    id: "s8",
    dimension: "automation",
    question: "Ein Besprechungstranskript liegt vor.",
    options: [
      { label: "Ich lese es und extrahiere Aufgaben manuell", score: 0 },
      { label: "Ich lasse Aufgaben ohne festes Schema extrahieren", score: 1 },
      { label: "Ich nutze ein gepflegtes Muster und prüfe Namen, Termine und Verantwortliche", score: 2 },
      { label: "Ein Ablauf validiert den Entwurf und holt Freigaben ein, bevor nachgelagerte Systeme schreiben", score: 3 },
    ],
  },
  {
    id: "s9",
    dimension: "knowledge",
    question: "Du liest eine Quelle, die für die aktuelle Arbeit relevant ist.",
    options: [
      { label: "Ich lasse den Browser-Tab geöffnet", score: 0 },
      { label: "Ich speichere die URL in einer Notiz", score: 1 },
      { label: "Ich erfasse Titel, Datum, Quelle und eine eigene Zusammenfassung", score: 2 },
      { label: "Ich verknüpfe sie mit aktueller Arbeit und dokumentiere, welche Aussage sie stützt oder infrage stellt", score: 3 },
    ],
  },
  {
    id: "s10",
    dimension: "governance",
    question: "Ein neuer KI-gestützter Ablauf soll pilotiert werden. Was prüfst du?",
    options: [
      { label: "Ob die Demonstration funktioniert", score: 0 },
      { label: "Ob personenbezogene Daten verarbeitet werden", score: 1 },
      { label: "Zweck, Daten, Rollen, Risikoklassifikation, Anbieterbedingungen und menschliche Prüfung", score: 2 },
      { label: "Ein dokumentiertes Pilot-Gate mit Verantwortlichen, Belegen, nötiger Rechtsprüfung und Stoppbedingung", score: 3 },
    ],
  },
];

const SCENARIOS_EN: readonly Scenario[] = [
  {
    id: "s1",
    dimension: "drafting",
    question: "A customer email requires a response today. How do you begin?",
    options: [
      { label: "Open a blank document and write from scratch", score: 0 },
      { label: "Ask Claude to draft a reply from a few notes", score: 1 },
      { label: "Provide the email, role, context, task and output constraints", score: 2 },
      { label: "Use a maintained Skill with required context and a review checklist", score: 3 },
    ],
  },
  {
    id: "s2",
    dimension: "delegation",
    question: "You need to draft a job description.",
    options: [
      { label: "Open a blank document and draft it manually", score: 0 },
      { label: "Ask Claude to write a job description", score: 1 },
      { label: "Provide role, company context, responsibilities, range and format", score: 2 },
      { label: "Use a maintained Project with source material and explicit approval criteria", score: 3 },
    ],
  },
  {
    id: "s3",
    dimension: "automation",
    question: "A website enquiry enters your organization.",
    options: [
      { label: "Copy it from email into the CRM", score: 0 },
      { label: "Send the form directly to the CRM", score: 1 },
      { label: "Create a reply draft after the CRM record is written", score: 2 },
      { label: "Use a monitored workflow with validation, human approval and an audit trail", score: 3 },
    ],
  },
  {
    id: "s4",
    dimension: "knowledge",
    question: "A manager asks what was decided about a topic in January.",
    options: [
      { label: "Answer from memory", score: 0 },
      { label: "Search email, notes and folders separately", score: 1 },
      { label: "Search a maintained knowledge base", score: 2 },
      { label: "Retrieve the decision, source note, owner and later changes together", score: 3 },
    ],
  },
  {
    id: "s5",
    dimension: "governance",
    question: "A colleague asks whether customer data may be entered into an AI tool.",
    options: [
      { label: "Say that you are not sure", score: 0 },
      { label: "Assume it is prohibited because of the GDPR", score: 1 },
      { label: "Classify the data and check the approved tool and processing terms", score: 2 },
      { label: "Apply the organization policy, approved-tool register and escalation route", score: 3 },
    ],
  },
  {
    id: "s6",
    dimension: "drafting",
    question: "You need an outline for a presentation.",
    options: [
      { label: "Brainstorm and format it manually", score: 0 },
      { label: "Ask Claude to make a presentation about the topic", score: 1 },
      { label: "Provide source material, audience, length, tone and output structure", score: 2 },
      { label: "Use a maintained pattern with citations and a slide-level review checklist", score: 3 },
    ],
  },
  {
    id: "s7",
    dimension: "delegation",
    question: "You prepare a weekly report for a manager.",
    options: [
      { label: "Write it manually at the end of the week", score: 0 },
      { label: "Ask Claude to turn notes into prose", score: 1 },
      { label: "Create a draft from maintained notes and verify every claim", score: 2 },
      { label: "Use a scheduled draft with source links, exception flags and human approval", score: 3 },
    ],
  },
  {
    id: "s8",
    dimension: "automation",
    question: "A meeting transcript is available.",
    options: [
      { label: "Read it and extract actions manually", score: 0 },
      { label: "Ask Claude to extract action items", score: 1 },
      { label: "Use a maintained summary pattern and review names, dates and owners", score: 2 },
      { label: "Route a draft through validation and owner approval before writing downstream systems", score: 3 },
    ],
  },
  {
    id: "s9",
    dimension: "knowledge",
    question: "You read a source relevant to current work.",
    options: [
      { label: "Leave the browser tab open", score: 0 },
      { label: "Save the URL in a note", score: 1 },
      { label: "Capture the article with title, date, source and your own summary", score: 2 },
      { label: "Connect it to current work and record what claim it supports or challenges", score: 3 },
    ],
  },
  {
    id: "s10",
    dimension: "governance",
    question: "A new AI-supported workflow is proposed for a pilot. What do you review?",
    options: [
      { label: "Whether the demonstration works", score: 0 },
      { label: "Whether personal data is processed", score: 1 },
      { label: "Purpose, data, roles, risk classification, provider terms and human review", score: 2 },
      { label: "A documented pilot gate with owners, evidence, legal review where required and a stop condition", score: 3 },
    ],
  },
];

type Answers = Record<string, number>;

function FluencyTestContent({ locale = "de" }: { readonly locale?: Locale }) {
  const isEnglish = locale === "en";
  const scenarios = isEnglish ? SCENARIOS_EN : SCENARIOS;
  const dimensions = isEnglish ? DIMENSIONS_EN : DIMENSIONS;
  const [answers, setAnswers] = useState<Answers>({});
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const current = scenarios[idx];
  const answered = Object.keys(answers).length;

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
    // Auto-advance after a beat (skips if last)
    if (idx < scenarios.length - 1) {
      setTimeout(() => setIdx((i) => Math.min(scenarios.length - 1, i + 1)), 220);
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
        const s = scenarios.find((x) => x.id === sid);
        return sum + (s?.options[optIdx]?.score ?? 0);
      }, 0),
    [answers, scenarios],
  );
  const maxScore = scenarios.length * 3;
  const percent = Math.round((totalScore / maxScore) * 100);

  const perDim = useMemo(
    () =>
      dimensions.map((d) => {
        const items = scenarios.filter((s) => s.dimension === d.id);
        const scored = items.reduce((sum, s) => {
          const oi = answers[s.id];
          return sum + (oi != null ? (s.options[oi]?.score ?? 0) : 0);
        }, 0);
        const max = items.length * 3;
        return { ...d, score: scored, max, pct: max > 0 ? scored / max : 0 };
      }),
    [answers, dimensions, scenarios],
  );

  const weakest = useMemo(
    () => perDim.reduce((w, d) => (d.pct < w.pct ? d : w), perDim[0]),
    [perDim],
  );

  const level =
    percent < 25
      ? {
          title: "Explorer",
          desc: isEnglish
            ? "Your answers show limited use of documented AI-supported workflows. Start with module 1."
            : "Deine Antworten zeigen wenig dokumentierte KI-gestützte Abläufe. Beginne mit Modul 1.",
        }
      : percent < 50
        ? {
            title: "User",
            desc: isEnglish
              ? "You use AI tools, but context and review criteria are not yet consistent. Modules 1 and 2 address that gap."
              : "Du nutzt KI-Werkzeuge, aber Kontext und Prüfkriterien sind noch nicht konsistent. Die Module 1 und 2 behandeln diese Lücke.",
          }
        : percent < 75
          ? {
              title: "Practitioner",
              desc: isEnglish
                ? "You use several structured practices. Modules 3 and 4 focus on maintained knowledge and controlled automation."
                : "Du nutzt mehrere strukturierte Praktiken. Die Module 3 und 4 behandeln gepflegtes Wissen und kontrollierte Automatisierung.",
            }
          : {
              title: "Operator",
              desc: isEnglish
                ? "Your answers show a documented working method. Use the course to test it against explicit exercises and controls."
                : "Deine Antworten zeigen eine dokumentierte Arbeitsmethode. Nutze den Kurs, um sie anhand klarer Übungen und Kontrollen zu prüfen.",
            };

  /* ─── Result view ─── */
  if (submitted) {
    return (
      <div className="mx-auto max-w-[960px] px-6 py-14 md:py-20">
        <Eyebrow>{isEnglish ? "Your self-assessment" : "Deine Selbstprüfung"}</Eyebrow>
        <ClipHeading
          as="h1"
          className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          {isEnglish ? "Your current pattern." : "Dein aktuelles Muster."}
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
                {isEnglish ? "Profile" : "Profil"}: {level.title}.
              </p>
              <p className="mt-2 max-w-[480px] text-[15.5px] leading-[1.65] text-muted-foreground">
                {level.desc}
              </p>
            </div>
          </FadeBlock>

          <FadeBlock delay={2}>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                5 {isEnglish ? "dimensions" : "Dimensionen"}
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
              {isEnglish ? "Lowest-scoring dimension" : "Niedrigster Teilwert"}: {weakest.label}
            </p>
            <p className="mt-3 max-w-[640px] text-[17px] leading-[1.55] text-foreground">
              {weakest.weakestRecommendation}
            </p>
          </div>
        </FadeBlock>

        <FadeBlock delay={8}>
          <div className="mt-10 flex flex-wrap items-center gap-3.5">
            <BrandButton
              href={localizeHref("/ai-native/kurs/modul_1", locale)}
              prefetch={false}
              variant="primary"
              surface="light"
            >
              {isEnglish ? "Start the course" : "Kurs starten"} <ArrowRight size={14} />
            </BrandButton>
            <BrandButton href={localizeHref("/ai-native", locale)} variant="outline" surface="light">
              {isEnglish ? "Back to overview" : "Zurück zur Übersicht"}
            </BrandButton>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 p-3.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-brand-orange"
            >
              <RotateCcw size={12} /> {isEnglish ? "Start again" : "Nochmal bearbeiten"}
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
          <Eyebrow>{isEnglish ? "Workflow self-assessment" : "Workflow-Selbsttest"}</Eyebrow>
          <ClipHeading
            as="h1"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            {isEnglish ? "How do you work today?" : "Wie arbeitest du heute?"}
          </ClipHeading>
        </div>
        <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
          {String(idx + 1).padStart(2, "0")} / {String(scenarios.length).padStart(2, "0")}
        </span>
      </div>

      <FadeBlock delay={1}>
        <p className="mt-4 max-w-[640px] text-[16px] leading-[1.65] text-muted-foreground">
          {isEnglish
            ? "Ten workplace scenarios across five dimensions. The result is a local self-assessment, not a standardized test or comparison with other people."
            : "Zehn Arbeitsszenarien in fünf Dimensionen. Das Ergebnis ist eine lokale Selbstprüfung, kein standardisierter Test und kein Vergleich mit anderen Personen."}
        </p>
      </FadeBlock>

      {/* Progress bar */}
      <div className="mt-10 flex items-center gap-3.5">
        <div className="h-0.5 flex-1 overflow-hidden bg-border">
          <m.div
            className="h-full bg-brand-orange"
            animate={{ width: `${(answered / scenarios.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
          {answered}/{scenarios.length}
        </span>
      </div>

      {/* Step dots */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {scenarios.map((s, i) => {
          const done = answers[s.id] != null;
          const cur = i === idx;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`${isEnglish ? "Scenario" : "Szenario"} ${i + 1}`}
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
            {isEnglish ? "Scenario" : "Szenario"} {String(idx + 1).padStart(2, "0")} ·{" "}
            {dimensions.find((d) => d.id === current.dimension)?.label}
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
          ← {isEnglish ? "Back" : "Zurück"}
        </button>
        {idx < scenarios.length - 1 ? (
          <button
            type="button"
            onClick={() => setIdx(Math.min(scenarios.length - 1, idx + 1))}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange transition-colors hover:text-brand-amber"
          >
            {isEnglish ? "Next" : "Weiter"} →
          </button>
        ) : (
          <BrandButton
            variant="primary"
            surface="light"
            onClick={() => setSubmitted(true)}
            disabled={answered < scenarios.length}
          >
            {isEnglish ? "Calculate result" : "Ergebnis berechnen"} <ArrowRight size={14} />
          </BrandButton>
        )}
      </div>

      {/* Cross-link to KI-F */}
      <FadeBlock delay={2}>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {isEnglish ? "Need the foundation first?" : "Fehlt noch die Grundlage?"}{" "}
          <Link
            href={localizeHref("/ki-fuehrerschein", locale)}
            className="text-brand-orange underline decoration-brand-orange/40 underline-offset-4 hover:text-brand-amber"
          >
            {isEnglish ? "AI Fundamentals" : "KI-Führerschein"}
          </Link>{" "}
          {isEnglish
            ? "is free and recommended before this course."
            : "ist kostenlos und vor diesem Kurs empfohlen."}
        </p>
      </FadeBlock>
    </div>
  );
}

export const FluencyTest = withMotionProvider(FluencyTestContent);
