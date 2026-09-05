import type { CSSProperties } from "react";
import Link from "next/link";
import { DataScienceLocaleProvider } from "@/components/data-science/locale-context";
import { LazyFlowingPipeline } from "@/components/data-science/lazy-flowing-pipeline";
import { dsChapterHref } from "@/lib/data-science/routes";
import type { DsChapterId } from "@/lib/data-science/types";

interface StageCard {
  readonly id: DsChapterId;
  readonly n: string;
  readonly title: string;
  readonly tag: string;
  readonly blurb: string;
  readonly hue: string;
}

const STAGES: readonly StageCard[] = [
  {
    id: "fund",
    n: "01",
    title: "Grundlagen",
    tag: "Stichprobe und Grundgesamtheit",
    blurb: "Zieh Stichproben und sieh zu, wie ihre Mittelwerte zusammenrücken.",
    hue: "#5B3EE8",
  },
  {
    id: "explore",
    n: "02",
    title: "Exploration",
    tag: "erst prüfen, dann modellieren",
    blurb: "Untersuche Verteilungen, Ausreißer und Korrelationsstrukturen.",
    hue: "#1CA5D9",
  },
  {
    id: "clean",
    n: "03",
    title: "Bereinigung",
    tag: "fehlend · verschoben · undicht",
    blurb:
      "Imputiere und skaliere Daten, ohne Informationen aus der Zukunft einzuschleusen.",
    hue: "#1FAF7E",
  },
  {
    id: "feature",
    n: "04",
    title: "Merkmale",
    tag: "Information gezielt abbilden",
    blurb: "Kodiere Kategorien, bilde Interaktionen und wähle Merkmale aus.",
    hue: "#6BCF3F",
  },
  {
    id: "model",
    n: "05",
    title: "Modellierung",
    tag: "Bias und Varianz",
    blurb: "Passe Modelle an und vergleiche Trainings- und Testfehler.",
    hue: "#E8A031",
  },
  {
    id: "eval",
    n: "06",
    title: "Evaluation",
    tag: "belastbare Kennzahlen",
    blurb:
      "Arbeite mit Konfusionsmatrix, ROC, Kalibrierung und Schwellenwerten.",
    hue: "#F25F3A",
  },
  {
    id: "interp",
    n: "07",
    title: "Interpretation",
    tag: "Ursachen im Modell prüfen",
    blurb: "Nutze SHAP, Permutationswichtigkeit und partielle Abhängigkeiten.",
    hue: "#E8318F",
  },
  {
    id: "exp",
    n: "08",
    title: "Experimente",
    tag: "Wirkung kontrolliert messen",
    blurb: "Plane A/B-Tests, Power und MDE und werte 10k Besucher aus.",
    hue: "#5B3EE8",
  },
  {
    id: "causal",
    n: "09",
    title: "Kausalität",
    tag: "mehr als Korrelation",
    blurb: "Analysiere DAGs, Confounder und Backdoor-Pfade.",
    hue: "#1CA5D9",
  },
  {
    id: "peek",
    n: "10",
    title: "Peeking",
    tag: "wenn p-Werte täuschen",
    blurb: "Führe 50 Experimente parallel aus und beobachte falsche Positive.",
    hue: "#D83A3A",
  },
  {
    id: "deploy",
    n: "11",
    title: "Betrieb",
    tag: "Modelle in Produktion",
    blurb:
      "Überwache Drift. Trainiere auf ein Signal hin, nicht nach Kalender.",
    hue: "#1FAF7E",
  },
  {
    id: "cap",
    n: "12",
    title: "Abschlussprojekt",
    tag: "der vollständige Zyklus",
    blurb: "Einmal ganz durch: Rauschen → Entscheidung → Feedback.",
    hue: "#E8318F",
  },
];

const HUE_INK: Record<string, string> = {
  "#5B3EE8": "#4A2FCC",
  "#1CA5D9": "#137A9C",
  "#1FAF7E": "#178060",
  "#6BCF3F": "#447F1C",
  "#E8A031": "#946012",
  "#F25F3A": "#BE4020",
  "#E8318F": "#BE216F",
  "#D83A3A": "#B02A2A",
};

const OUTCOMES = [
  {
    icon: "◇",
    t: "Einen unbekannten Datensatz systematisch untersuchen",
    d: "Verteilungen, Fehlwerte und Korrelationen prüfen, mit einer klaren Checkliste für die ersten 30 Minuten.",
  },
  {
    icon: "○",
    t: "Ein Modell ohne verstecktes Leakage trainieren",
    d: "Leakage erkennen, Daten sauber aufteilen und die Kennzahl vor dem Algorithmus festlegen.",
  },
  {
    icon: "△",
    t: "Eine Konfusionsmatrix korrekt auswerten",
    d: "Schwellenwerte, Precision und Recall, Kalibrierung und Klassenungleichgewicht einordnen.",
  },
  {
    icon: "□",
    t: "Einen belastbaren A/B-Test entwerfen",
    d: "Power, MDE, Stichprobengröße, Neuheitseffekte, SRM-Prüfungen und CUPED berücksichtigen.",
  },
  {
    icon: "◈",
    t: "Korrelation und Kausalität unterscheiden",
    d: "DAGs, Confounder und Backdoor-Pfade prüfen und Regression gezielt einsetzen.",
  },
  {
    icon: "✕",
    t: "Ein Modell in Produktion stabil betreiben",
    d: "Drift überwachen, Retraining auslösen, Shadow Mode nutzen und Rollbacks vorbereiten.",
  },
] as const;

const TOOLS = [
  { n: "pandas", r: "Dataframes" },
  { n: "scikit-learn", r: "klassisches ML" },
  { n: "numpy", r: "Arrays" },
  { n: "PyTorch", r: "Deep Learning" },
  { n: "statsmodels", r: "Inferenz und GLMs" },
  { n: "scipy.stats", r: "Tests und Verteilungen" },
  { n: "SHAP", r: "Interpretierbarkeit" },
  { n: "Jupyter · Hex", r: "Notebooks" },
  { n: "MLflow", r: "Experiment-Tracking" },
  { n: "Feast", r: "Feature Store" },
  { n: "Great Expectations", r: "Datenqualität" },
  { n: "A/B platform", r: "Experimente" },
] as const;

export default function ChOverviewDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <section className="ov-hero">
        <div className="ov-hero-copy">
          <div className="ov-hero-eyebrow">Data Science Fundamentals · v8</div>
          <h1 className="ov-hero-title">
            Data Science bedeutet,
            <br />
            <span className="accent">aus Daten Entscheidungen abzuleiten.</span>
          </h1>
          <p className="ov-hero-hook">
            Zwölf Kapitel, ein Arbeitszyklus. Jedes Kapitel beginnt mit
            <strong> einer Simulation, an der du drehst</strong>, und erklärt
            Begriffe, Verfahren und Grenzen daran.
          </p>
          <div className="ov-hero-cta">
            <Link
              className="btn btn-primary ov-cta-btn"
              href={dsChapterHref("fund")}
              prefetch={false}
            >
              Beginnen &nbsp;→
            </Link>
          </div>
          <div className="ov-hero-stats">
            <div className="ov-stat">
              <div className="k">12</div>
              <div className="v">Kapitel</div>
            </div>
            <div className="ov-stat">
              <div className="k">22</div>
              <div className="v">interaktive Simulationen</div>
            </div>
            <div className="ov-stat">
              <div className="k">~2h</div>
              <div className="v">vom Anfang bis zum Ende</div>
            </div>
          </div>
        </div>
        <div className="ov-hero-sim">
          <LazyFlowingPipeline />
        </div>
      </section>

      <section className="section ov-outcomes-section">
        <div className="ov-section-head">
          <div className="ov-kicker">Ergebnisse</div>
          <h2 className="ov-h2">
            Verfahren anwenden und ihre
            <br />
            <em> Aussagekraft prüfen.</em>
          </h2>
        </div>
        <div className="ov-outcomes">
          {OUTCOMES.map((outcome) => (
            <div className="ov-outcome" key={outcome.t}>
              <div className="ov-outcome-icon">{outcome.icon}</div>
              <div className="ov-outcome-t">{outcome.t}</div>
              <div className="ov-outcome-d">{outcome.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section ov-curriculum-section">
        <div className="ov-section-head">
          <div className="ov-kicker">Lehrplan</div>
          <h2 className="ov-h2">
            Zwölf Kapitel: Modell entwickeln,
            <br />
            Wirkung nachweisen.
          </h2>
          <p className="ov-lede">
            Die erste Hälfte behandelt den Modellaufbau. Die zweite Hälfte
            prüft,
            <em> ob das Ergebnis trägt</em>: Evaluation, Interpretation,
            Experimente und Betrieb.
          </p>
        </div>
        <div className="ov-curriculum">
          {STAGES.map((stage) => (
            <Link
              key={stage.id}
              className="ov-course"
              style={
                {
                  "--hue": stage.hue,
                  "--hue-ink": HUE_INK[stage.hue] || stage.hue,
                } as CSSProperties
              }
              href={dsChapterHref(stage.id)}
              prefetch={false}
            >
              <div className="ov-course-top">
                <span className="ov-course-n">{stage.n}</span>
                <span
                  className="ov-course-dot"
                  style={{ background: stage.hue, color: stage.hue }}
                />
              </div>
              <div className="ov-course-title">{stage.title}</div>
              <div className="ov-course-tag">{stage.tag}</div>
              <div className="ov-course-blurb">{stage.blurb}</div>
              <div className="ov-course-cta">Kapitel öffnen &nbsp;→</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="ov-section-head ov-sh-tight">
          <div className="ov-kicker">Werkzeuge im Kurs</div>
          <h2 className="ov-h2">
            Verbreitete Open-Source-Werkzeuge
            <br />
            für den Data-Science-Alltag.
          </h2>
          <p className="ov-lede">
            Die Simulationen zeigen das <em>Verhalten</em> dieser Werkzeuge. Die
            Konzepte tragen auch auf anderen Stacks.
          </p>
        </div>
        <div className="ov-tools">
          {TOOLS.map((tool) => (
            <div key={tool.n} className="ov-tool">
              <div className="ov-tool-n">{tool.n}</div>
              <div className="ov-tool-r">{tool.r}</div>
            </div>
          ))}
        </div>
      </section>
    </DataScienceLocaleProvider>
  );
}
