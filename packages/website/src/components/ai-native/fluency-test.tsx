"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import {
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
} from "@/components/course/technical-course-landing";
import { EASE_OUT_EXPO } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { withMotionProvider } from "@/components/motion/with-motion-provider";

/* AI-Native Fluency Test
 * 10 scenarios across 5 dimensions. One question at a time, step dots,
 * auto-advance after selection, results panel with per-dimension bars +
 * weakest-dimension callout. */

type Dimension =
  "drafting" | "delegation" | "automation" | "knowledge" | "governance";

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
    shortDesc:
      "Welche wiederkehrenden Schritte haben ausdrückliche Kontrollen?",
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
  readonly options: readonly {
    readonly label: string;
    readonly score: 0 | 1 | 2 | 3;
  }[];
}

const SCENARIOS: readonly Scenario[] = [
  {
    id: "s1",
    dimension: "drafting",
    question: "Eine Kundenmail braucht heute eine Antwort. Wie beginnst du?",
    options: [
      {
        label: "Ich schreibe sie in einem leeren Dokument vollständig selbst",
        score: 0,
      },
      {
        label: "Ich lasse aus wenigen Stichpunkten einen Entwurf erstellen",
        score: 1,
      },
      {
        label:
          "Ich gebe freigegebene Mail, Rolle, Kontext, Auftrag und Ausgabegrenzen vor",
        score: 2,
      },
      {
        label:
          "Ich nutze einen gepflegten Skill mit Pflichtkontext und Review-Checkliste",
        score: 3,
      },
    ],
  },
  {
    id: "s2",
    dimension: "delegation",
    question: "Du brauchst eine Stellenausschreibung.",
    options: [
      { label: "Ich schreibe sie vollständig selbst", score: 0 },
      {
        label: "Ich fordere ohne weitere Angaben eine Stellenausschreibung an",
        score: 1,
      },
      {
        label:
          "Ich gebe Rolle, freigegebenen Firmenkontext, Tätigkeitsprofil, Gehaltsrahmen und Format vor",
        score: 2,
      },
      {
        label:
          "Ich nutze ein gepflegtes Project mit Quellenmaterial und Freigabekriterien",
        score: 3,
      },
    ],
  },
  {
    id: "s3",
    dimension: "automation",
    question: "Eine Website-Anfrage geht ein.",
    options: [
      { label: "Ich übertrage sie manuell aus der E-Mail ins CRM", score: 0 },
      { label: "Das Formular schreibt direkt ins CRM", score: 1 },
      {
        label: "Nach dem CRM-Eintrag entsteht ein Antwortentwurf zur Prüfung",
        score: 2,
      },
      {
        label:
          "Ein überwachter Ablauf validiert, weist einen Review zu und führt ein Audit-Protokoll",
        score: 3,
      },
    ],
  },
  {
    id: "s4",
    dimension: "knowledge",
    question:
      "Eine Führungskraft fragt nach einer Entscheidung aus dem Januar.",
    options: [
      { label: "Ich antworte aus dem Gedächtnis", score: 0 },
      {
        label: "Ich suche getrennt in E-Mail, Notizen und Dateiablage",
        score: 1,
      },
      { label: "Ich durchsuche eine gepflegte Wissensbasis", score: 2 },
      {
        label:
          "Ich rufe Entscheidung, Quelle, verantwortliche Person und spätere Änderungen zusammen ab",
        score: 3,
      },
    ],
  },
  {
    id: "s5",
    dimension: "governance",
    question:
      "Eine Person fragt, ob Kundendaten in ein KI-Werkzeug eingegeben werden dürfen.",
    options: [
      { label: "Ich weiß es nicht", score: 0 },
      { label: "Ich nehme pauschal an, die DSGVO verbiete es", score: 1 },
      {
        label:
          "Ich klassifiziere die Daten und prüfe Werkzeug sowie Verarbeitungsbedingungen",
        score: 2,
      },
      {
        label:
          "Ich wende Organisationsrichtlinie, Werkzeugregister und Eskalationsweg an",
        score: 3,
      },
    ],
  },
  {
    id: "s6",
    dimension: "drafting",
    question: "Du brauchst eine Gliederung für eine Präsentation.",
    options: [
      {
        label: "Ich entwickle und formatiere sie vollständig selbst",
        score: 0,
      },
      {
        label: "Ich fordere ohne Quellen eine Präsentation zum Thema an",
        score: 1,
      },
      {
        label:
          "Ich gebe Quellenmaterial, Zielgruppe, Länge, Ton und Ausgabestruktur vor",
        score: 2,
      },
      {
        label:
          "Ich nutze ein gepflegtes Muster mit Quellen und Review-Checkliste je Folie",
        score: 3,
      },
    ],
  },
  {
    id: "s7",
    dimension: "delegation",
    question: "Du erstellst einen Wochenbericht für eine Führungskraft.",
    options: [
      {
        label: "Ich schreibe ihn am Ende der Woche vollständig selbst",
        score: 0,
      },
      { label: "Ich lasse Stichpunkte in Fließtext umwandeln", score: 1 },
      {
        label:
          "Ich erstelle einen Entwurf aus gepflegten Notizen und prüfe jede Aussage",
        score: 2,
      },
      {
        label:
          "Ein geplanter Entwurf enthält Quellenlinks, Ausnahmehinweise und menschliche Freigabe",
        score: 3,
      },
    ],
  },
  {
    id: "s8",
    dimension: "automation",
    question: "Ein Besprechungstranskript liegt vor.",
    options: [
      { label: "Ich lese es und extrahiere Aufgaben manuell", score: 0 },
      { label: "Ich lasse Aufgaben ohne festes Schema extrahieren", score: 1 },
      {
        label:
          "Ich nutze ein gepflegtes Muster und prüfe Namen, Termine und Verantwortliche",
        score: 2,
      },
      {
        label:
          "Ein Ablauf validiert den Entwurf und holt Freigaben ein, bevor nachgelagerte Systeme schreiben",
        score: 3,
      },
    ],
  },
  {
    id: "s9",
    dimension: "knowledge",
    question: "Du liest eine Quelle, die für die aktuelle Arbeit relevant ist.",
    options: [
      { label: "Ich lasse den Browser-Tab geöffnet", score: 0 },
      { label: "Ich speichere die URL in einer Notiz", score: 1 },
      {
        label:
          "Ich erfasse Titel, Datum, Quelle und eine eigene Zusammenfassung",
        score: 2,
      },
      {
        label:
          "Ich verknüpfe sie mit aktueller Arbeit und dokumentiere, welche Aussage sie stützt oder infrage stellt",
        score: 3,
      },
    ],
  },
  {
    id: "s10",
    dimension: "governance",
    question:
      "Ein neuer KI-gestützter Ablauf soll pilotiert werden. Was prüfst du?",
    options: [
      { label: "Ob die Demonstration funktioniert", score: 0 },
      { label: "Ob personenbezogene Daten verarbeitet werden", score: 1 },
      {
        label:
          "Zweck, Daten, Rollen, Risikoklassifikation, Anbieterbedingungen und menschliche Prüfung",
        score: 2,
      },
      {
        label:
          "Ein dokumentiertes Pilot-Gate mit Verantwortlichen, Belegen, nötiger Rechtsprüfung und Stoppbedingung",
        score: 3,
      },
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
      {
        label: "Provide the email, role, context, task and output constraints",
        score: 2,
      },
      {
        label:
          "Use a maintained Skill with required context and a review checklist",
        score: 3,
      },
    ],
  },
  {
    id: "s2",
    dimension: "delegation",
    question: "You need to draft a job description.",
    options: [
      { label: "Open a blank document and draft it manually", score: 0 },
      { label: "Ask Claude to write a job description", score: 1 },
      {
        label:
          "Provide role, company context, responsibilities, range and format",
        score: 2,
      },
      {
        label:
          "Use a maintained Project with source material and explicit approval criteria",
        score: 3,
      },
    ],
  },
  {
    id: "s3",
    dimension: "automation",
    question: "A website enquiry enters your organization.",
    options: [
      { label: "Copy it from email into the CRM", score: 0 },
      { label: "Send the form directly to the CRM", score: 1 },
      {
        label: "Create a reply draft after the CRM record is written",
        score: 2,
      },
      {
        label:
          "Use a monitored workflow with validation, human approval and an audit trail",
        score: 3,
      },
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
      {
        label:
          "Retrieve the decision, source note, owner and later changes together",
        score: 3,
      },
    ],
  },
  {
    id: "s5",
    dimension: "governance",
    question:
      "A colleague asks whether customer data may be entered into an AI tool.",
    options: [
      { label: "Say that you are not sure", score: 0 },
      { label: "Assume it is prohibited because of the GDPR", score: 1 },
      {
        label:
          "Classify the data and check the approved tool and processing terms",
        score: 2,
      },
      {
        label:
          "Apply the organization policy, approved-tool register and escalation route",
        score: 3,
      },
    ],
  },
  {
    id: "s6",
    dimension: "drafting",
    question: "You need an outline for a presentation.",
    options: [
      { label: "Brainstorm and format it manually", score: 0 },
      { label: "Ask Claude to make a presentation about the topic", score: 1 },
      {
        label:
          "Provide source material, audience, length, tone and output structure",
        score: 2,
      },
      {
        label:
          "Use a maintained pattern with citations and a slide-level review checklist",
        score: 3,
      },
    ],
  },
  {
    id: "s7",
    dimension: "delegation",
    question: "You prepare a weekly report for a manager.",
    options: [
      { label: "Write it manually at the end of the week", score: 0 },
      { label: "Ask Claude to turn notes into prose", score: 1 },
      {
        label: "Create a draft from maintained notes and verify every claim",
        score: 2,
      },
      {
        label:
          "Use a scheduled draft with source links, exception flags and human approval",
        score: 3,
      },
    ],
  },
  {
    id: "s8",
    dimension: "automation",
    question: "A meeting transcript is available.",
    options: [
      { label: "Read it and extract actions manually", score: 0 },
      { label: "Ask Claude to extract action items", score: 1 },
      {
        label:
          "Use a maintained summary pattern and review names, dates and owners",
        score: 2,
      },
      {
        label:
          "Route a draft through validation and owner approval before writing downstream systems",
        score: 3,
      },
    ],
  },
  {
    id: "s9",
    dimension: "knowledge",
    question: "You read a source relevant to current work.",
    options: [
      { label: "Leave the browser tab open", score: 0 },
      { label: "Save the URL in a note", score: 1 },
      {
        label:
          "Capture the article with title, date, source and your own summary",
        score: 2,
      },
      {
        label:
          "Connect it to current work and record what claim it supports or challenges",
        score: 3,
      },
    ],
  },
  {
    id: "s10",
    dimension: "governance",
    question:
      "A new AI-supported workflow is proposed for a pilot. What do you review?",
    options: [
      { label: "Whether the demonstration works", score: 0 },
      { label: "Whether personal data is processed", score: 1 },
      {
        label:
          "Purpose, data, roles, risk classification, provider terms and human review",
        score: 2,
      },
      {
        label:
          "A documented pilot gate with owners, evidence, legal review where required and a stop condition",
        score: 3,
      },
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
      setTimeout(
        () => setIdx((i) => Math.min(scenarios.length - 1, i + 1)),
        220,
      );
    }
  };

  const reset = () => {
    setAnswers({});
    setIdx(0);
    setSubmitted(false);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      <TechnicalCourseFrame courseId="ai-native-fluency-result" lang={locale}>
        <header className="border-y border-foreground py-6 sm:py-8">
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
                {isEnglish ? "Local self-assessment" : "Lokale Selbstprüfung"}
              </p>
              <h1 className="mt-3 text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[48px]">
                {isEnglish ? "Your current pattern." : "Dein aktuelles Muster."}
              </h1>
              <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-muted-foreground">
                {level.desc}
              </p>
            </div>
            <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
                Score
              </p>
              <p className="mt-2 text-[48px] font-bold leading-none tracking-[-0.04em] text-foreground">
                {percent}%
              </p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                {totalScore} / {maxScore}
              </p>
              <p className="mt-3 text-base font-bold text-foreground">
                {isEnglish ? "Profile" : "Profil"}: {level.title}.
              </p>
            </aside>
          </div>
        </header>

        <div>
          <section className="mt-8">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              05 {isEnglish ? "dimensions" : "Dimensionen"}
            </p>
            <div className="mt-3 border-t border-foreground">
              {perDim.map((dimension, index) => (
                <div
                  key={dimension.id}
                  className="grid gap-2 border-b border-border py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {dimension.label}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {dimension.score}/{dimension.max}
                    </p>
                  </div>
                  <div>
                    <div
                      className="h-2 w-full overflow-hidden bg-border"
                      role="progressbar"
                      aria-label={`${dimension.label}: ${dimension.score} / ${dimension.max}`}
                      aria-valuenow={Math.round(dimension.pct * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <m.div
                        className={cn(
                          "h-full",
                          dimension.id === weakest.id
                            ? "bg-brand-orange"
                            : "bg-brand-sand",
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${dimension.pct * 100}%` }}
                        transition={{
                          duration: 0.7,
                          ease: EASE_OUT_EXPO,
                          delay: 0.1 + index * 0.08,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                      {dimension.shortDesc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 border-y border-brand-orange py-5">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {isEnglish ? "Lowest-scoring dimension" : "Niedrigster Teilwert"}:{" "}
              {weakest.label}
            </p>
            <p className="mt-2 max-w-[720px] text-sm leading-relaxed text-foreground">
              {weakest.weakestRecommendation}
            </p>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href={localizeHref("/ai-native/kurs/modul_1", locale)}
              prefetch={false}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
              data-workspace-primary-action="true"
            >
              {isEnglish ? "Start module 1" : "Modul 1 starten"}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href={localizeHref("/ai-native", locale)}
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {isEnglish ? "Course overview" : "Kursübersicht"}
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-2 border-b border-border px-2 font-mono text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {isEnglish ? "Start again" : "Nochmal bearbeiten"}
            </button>
          </div>
        </div>
      </TechnicalCourseFrame>
    );
  }

  /* ─── Question view ─── */
  return (
    <TechnicalCourseFrame courseId="ai-native-fluency-test" lang={locale}>
      <header className="border-y border-foreground py-6 sm:py-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {isEnglish ? "Workflow self-assessment" : "Workflow-Selbsttest"}
            </p>
            <h1 className="mt-3 text-[38px] font-bold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-[48px]">
              {isEnglish ? "How do you work today?" : "Wie arbeitest du heute?"}
            </h1>
            <p className="mt-4 max-w-[680px] text-sm leading-relaxed text-muted-foreground">
              {isEnglish
                ? "Ten workplace scenarios across five dimensions. The result stays local and is neither a standardized test nor a comparison with other people."
                : "Zehn Arbeitsszenarien in fünf Dimensionen. Das Ergebnis bleibt lokal und ist weder standardisierter Test noch Vergleich mit anderen Personen."}
            </p>
          </div>

          <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div className="flex items-baseline justify-between gap-4 font-mono text-xs text-muted-foreground">
              <span>
                {String(idx + 1).padStart(2, "0")} /{" "}
                {String(scenarios.length).padStart(2, "0")}
              </span>
              <span>
                {answered}/{scenarios.length}{" "}
                {isEnglish ? "answered" : "beantwortet"}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden bg-border"
              role="progressbar"
              aria-label={
                isEnglish ? "Answered scenarios" : "Beantwortete Szenarien"
              }
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={scenarios.length}
            >
              <m.div
                className="h-full bg-brand-orange"
                animate={{ width: `${(answered / scenarios.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </aside>
        </div>
      </header>

      <div>
        <nav
          aria-label={isEnglish ? "Assessment scenarios" : "Testszenarien"}
          className="mt-6 flex flex-wrap gap-1.5"
        >
          {scenarios.map((scenario, scenarioIndex) => {
            const done = answers[scenario.id] != null;
            const currentScenario = scenarioIndex === idx;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setIdx(scenarioIndex)}
                aria-label={`${isEnglish ? "Scenario" : "Szenario"} ${scenarioIndex + 1}`}
                aria-current={currentScenario ? "step" : undefined}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center border p-0 font-mono text-xs font-bold transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                  currentScenario
                    ? "border-foreground bg-foreground text-background"
                    : done
                      ? "border-brand-orange text-brand-orange"
                      : "border-border bg-transparent text-muted-foreground hover:border-foreground",
                )}
              >
                {scenarioIndex + 1}
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <m.section
            key={current.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            className="mt-8"
            aria-labelledby={`scenario-heading-${current.id}`}
          >
            <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-brand-orange">
              {isEnglish ? "Scenario" : "Szenario"}{" "}
              {String(idx + 1).padStart(2, "0")} ·{" "}
              {
                dimensions.find(
                  (dimension) => dimension.id === current.dimension,
                )?.label
              }
            </p>
            <h2
              id={`scenario-heading-${current.id}`}
              className="mt-2 max-w-[800px] text-[26px] font-bold leading-tight tracking-[-0.025em] text-foreground sm:text-[32px]"
            >
              „{current.question}“
            </h2>

            <div className="mt-5 grid border-t border-foreground">
              {current.options.map((option, optionIndex) => {
                const selected = answers[current.id] === optionIndex;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => selectAnswer(optionIndex)}
                    aria-pressed={selected}
                    className={cn(
                      "flex min-h-12 items-start gap-3 border-b border-border px-3 py-3 text-left transition-[background-color,border-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
                      selected
                        ? "border-l-2 border-l-brand-orange bg-[var(--color-kupfer-mist)]"
                        : "hover:bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "w-5 shrink-0 font-mono text-[13px] font-bold",
                        selected
                          ? "text-brand-orange"
                          : "text-muted-foreground",
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="flex-1 text-sm leading-relaxed text-foreground">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </m.section>
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className={cn(
              "inline-flex min-h-11 items-center px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange",
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
              className="inline-flex min-h-11 items-center border-b-2 border-foreground px-3 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand-orange hover:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
            >
              {isEnglish ? "Next" : "Weiter"} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={answered < scenarios.length}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
              data-workspace-primary-action="true"
            >
              {isEnglish ? "Calculate result" : "Ergebnis berechnen"}
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <details className="mt-8 border-y border-border">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            {isEnglish
              ? "Need the foundation first?"
              : "Fehlt noch die Grundlage?"}
            <span className="text-brand-orange" aria-hidden="true">
              +
            </span>
          </summary>
          <p className="border-t border-border py-4 text-sm leading-relaxed text-muted-foreground">
            <Link
              href={localizeHref("/ki-fuehrerschein", locale)}
              className="border-b border-brand-orange text-brand-orange transition-colors hover:text-brand-amber"
            >
              {isEnglish ? "AI Fundamentals" : "KI-Führerschein"}
            </Link>{" "}
            {isEnglish
              ? "is free and recommended before this course."
              : "ist kostenlos und vor diesem Kurs empfohlen."}
          </p>
        </details>
      </div>
    </TechnicalCourseFrame>
  );
}

export const FluencyTest = withMotionProvider(FluencyTestContent);
