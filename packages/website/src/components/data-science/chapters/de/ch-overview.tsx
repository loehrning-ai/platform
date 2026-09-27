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
}

const STAGES: readonly StageCard[] = [
  {
    id: "fund",
    n: "01",
    title: "Grundlagen",
    tag: "Stichprobe und Grundgesamtheit",
    blurb: "Zieh Stichproben und sieh zu, wie ihre Mittelwerte zusammenrücken.",
  },
  {
    id: "explore",
    n: "02",
    title: "Exploration",
    tag: "erst prüfen, dann modellieren",
    blurb: "Untersuche Verteilungen, Ausreißer und Korrelationsstrukturen.",
  },
  {
    id: "clean",
    n: "03",
    title: "Bereinigung",
    tag: "Fehlwerte · Skalierung · Leakage",
    blurb:
      "Imputiere und skaliere Daten, ohne Informationen aus der Zukunft einzuschleusen.",
  },
  {
    id: "feature",
    n: "04",
    title: "Merkmale",
    tag: "Information gezielt abbilden",
    blurb: "Kodiere Kategorien, bilde Interaktionen und wähle Merkmale aus.",
  },
  {
    id: "model",
    n: "05",
    title: "Modellierung",
    tag: "Bias und Varianz",
    blurb: "Passe Modelle an und vergleiche Trainings- und Testfehler.",
  },
  {
    id: "eval",
    n: "06",
    title: "Evaluation",
    tag: "belastbare Kennzahlen",
    blurb:
      "Arbeite mit Konfusionsmatrix, ROC, Kalibrierung und Schwellenwerten.",
  },
  {
    id: "interp",
    n: "07",
    title: "Interpretation",
    tag: "Modellverhalten erklären",
    blurb: "Nutze SHAP, Permutationswichtigkeit und partielle Abhängigkeiten.",
  },
  {
    id: "exp",
    n: "08",
    title: "Experimente",
    tag: "Wirkung kontrolliert messen",
    blurb: "Plane A/B-Tests mit Power und MDE und werte 10.000 Besuche aus.",
  },
  {
    id: "causal",
    n: "09",
    title: "Kausalität",
    tag: "mehr als Korrelation",
    blurb: "Analysiere DAGs, Confounder und Backdoor-Pfade.",
  },
  {
    id: "peek",
    n: "10",
    title: "Peeking",
    tag: "wenn p-Werte täuschen",
    blurb: "Führe 50 Experimente parallel aus und zähle die falsch-positiven Ergebnisse.",
  },
  {
    id: "deploy",
    n: "11",
    title: "Betrieb",
    tag: "Modelle in Produktion",
    blurb:
      "Überwache Drift und trainiere neu, wenn ein Signal anschlägt.",
  },
  {
    id: "cap",
    n: "12",
    title: "Abschlussprojekt",
    tag: "der vollständige Zyklus",
    blurb: "Ein Betrugsdatensatz vom Audit bis zur Deployment-Prüfung.",
  },
];

const OUTCOMES = [
  "Datensätze prüfen und ohne verstecktes Leakage trainieren",
  "Konfusionsmatrix, Schwellenwerte und Kalibrierung auswerten",
  "A/B-Tests mit Power, MDE und CUPED planen",
  "Korrelation und Kausalität mit DAGs unterscheiden",
  "Drift überwachen, neu trainieren und Rollbacks vorbereiten",
] as const;

const TOOLS = [
  { n: "pandas", r: "Dataframes" },
  { n: "scikit-learn", r: "klassisches ML" },
  { n: "numpy", r: "Arrays" },
  { n: "PyTorch", r: "Deep Learning" },
  { n: "statsmodels", r: "Inferenz und GLMs" },
  { n: "scipy.stats", r: "Tests und Verteilungen" },
  { n: "SHAP", r: "Interpretierbarkeit" },
  { n: "Jupyter", r: "Notebooks" },
  { n: "MLflow", r: "Experiment-Tracking" },
  { n: "Feast", r: "Feature Store" },
  { n: "Great Expectations", r: "Datenqualität" },
  { n: "A/B-Testplattform", r: "Experimente" },
] as const;

// Werkzeichnung (design direction 7.4): ink roman headings with no italic
// accent, sentence-case kickers, square geometry, hairline lists and a
// gap-px Swiss grid for the chapters. No glyph icons, coloured dots or
// coloured borders; the hero action is the page's one Mennige element.
export default function ChOverviewDe() {
  return (
    <DataScienceLocaleProvider locale="de">
      <section className="ov-hero">
        <div className="ov-hero-copy">
          <p className="ov-hero-eyebrow">Data-Science-Kurs · kostenlos</p>
          <h1 className="ov-hero-title">
            Aus Daten entscheiden.
          </h1>
          <p className="ov-hero-hook">
            Zwölf Kapitel entlang eines Arbeitszyklus, jedes mit einer Simulation, an der du selbst drehst.
          </p>
          <div className="ov-hero-cta">
            <Link
              className="btn btn-primary ov-cta-btn"
              href={dsChapterHref("fund")}
              prefetch={false}
            >
              Kapitel 1 starten &nbsp;→
            </Link>
          </div>
          <div className="ov-hero-stats">
            <div className="ov-stat">
              <div className="k">12</div>
              <div className="v">Kapitel</div>
            </div>
            <div className="ov-stat">
              <div className="k">37</div>
              <div className="v">interaktive Simulationen</div>
            </div>
            <div className="ov-stat">
              <div className="k">2 Std.</div>
              <div className="v">ungefähre Lernzeit</div>
            </div>
          </div>
        </div>
        <div className="ov-hero-sim">
          <LazyFlowingPipeline />
        </div>
      </section>

      <section className="section ov-outcomes-section">
        <div className="ov-section-head">
          <p className="ov-kicker">Ergebnisse</p>
          <h2 className="ov-h2">Was du danach kannst</h2>
        </div>
        <ul className="ov-outcomes">
          {OUTCOMES.map((outcome) => (
            <li className="ov-outcome" key={outcome}>
              <p className="ov-outcome-t">{outcome}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="section ov-curriculum-section">
        <div className="ov-section-head">
          <p className="ov-kicker">Lehrplan</p>
          <h2 className="ov-h2">Zwölf Kapitel</h2>
        </div>
        <div className="ov-curriculum">
          {STAGES.map((stage) => (
            <Link
              key={stage.id}
              className="ov-course"
              href={dsChapterHref(stage.id)}
              prefetch={false}
            >
              <div className="ov-course-top">
                <span className="ov-course-n">{stage.n}</span>
              </div>
              <h3 className="ov-course-title">{stage.title}</h3>
              <p className="ov-course-tag">{stage.tag}</p>
              <p className="ov-course-blurb">{stage.blurb}</p>
              <p className="ov-course-cta">
                Kapitel öffnen <span aria-hidden="true">→</span>
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="ov-section-head ov-sh-tight">
          <p className="ov-kicker">Werkzeuge im Kurs</p>
          <h2 className="ov-h2">Werkzeuge, die im Kurs vorkommen.</h2>
        </div>
        <dl className="ov-tools">
          {TOOLS.map((tool) => (
            <div key={tool.n} className="ov-tool">
              <dt className="ov-tool-n">{tool.n}</dt>
              <dd className="ov-tool-r">{tool.r}</dd>
            </div>
          ))}
        </dl>
      </section>
    </DataScienceLocaleProvider>
  );
}
