import type { Locale } from "@/lib/i18n/locale";
import { getDsChapterMeta, type ChapterMeta, type DsChapterId } from "./types";

/**
 * Data half of the reviewed Data Science bundle: chapter ids, identity and the
 * German meta overrides.
 *
 * Deliberately free of component imports. The overview route needs only this
 * data, and importing the sibling loader module instead pulled all 26 chapter
 * server components — and through them 34 client simulators — into that
 * route's eager client entry, for a page that renders none of them.
 */

/**
 * Reviewed translation bundle for the overview and chapters 01-12.
 * It remains separate from public route selection until integration is approved.
 */
export const DS_TRANSLATED_CORE_CHAPTER_IDS = [
  "home",
  "fund",
  "explore",
  "clean",
  "feature",
  "model",
  "eval",
  "interp",
  "exp",
  "causal",
  "peek",
  "deploy",
  "cap",
] as const satisfies readonly DsChapterId[];

export type DsTranslatedCoreChapterId =
  (typeof DS_TRANSLATED_CORE_CHAPTER_IDS)[number];

export interface DsCoreContentIdentity {
  readonly chapterIds: readonly DsTranslatedCoreChapterId[];
  readonly progressKeys: readonly Exclude<DsTranslatedCoreChapterId, "home">[];
  readonly sectionIdsByChapter: Readonly<
    Record<DsTranslatedCoreChapterId, readonly string[]>
  >;
  readonly simulatorIdsByChapter: Readonly<
    Record<DsTranslatedCoreChapterId, readonly string[]>
  >;
  readonly checkpointKeys: readonly string[];
  readonly scoringKeys: readonly string[];
}

export const DS_TRANSLATED_CORE_IDENTITY: DsCoreContentIdentity = {
  chapterIds: DS_TRANSLATED_CORE_CHAPTER_IDS,
  progressKeys: [
    "fund",
    "explore",
    "clean",
    "feature",
    "model",
    "eval",
    "interp",
    "exp",
    "causal",
    "peek",
    "deploy",
    "cap",
  ],
  sectionIdsByChapter: {
    home: [],
    fund: ["01.1", "01.2"],
    explore: ["01", "02", "03"],
    clean: ["03.1", "03.2", "03.3", "03.4"],
    feature: ["04.1", "04.2", "04.3", "04.4"],
    model: ["05.1", "05.2"],
    eval: ["06.1", "06.2"],
    interp: ["07.1", "07.2", "07.3", "07.4"],
    exp: ["08.1", "08.2"],
    causal: ["09.1", "09.2", "09.3", "09.4", "09.5"],
    peek: ["10.1", "10.2", "10.3", "10.4"],
    deploy: ["11.1", "11.2", "11.3", "11.4"],
    cap: ["12.1", "12.2", "12.3", "12.4"],
  },
  simulatorIdsByChapter: {
    home: ["flowing-pipeline"],
    fund: ["galton-sim"],
    explore: [
      "distribution-explorer",
      "outlier-detector",
      "correlation-matrix",
    ],
    clean: [
      "missingness-sim",
      "imputation-race",
      "scaler-demo",
      "leakage-detector",
    ],
    feature: [
      "encoding-comparison",
      "polynomial-expansion",
      "feature-selection-sim",
      "interaction-terms",
    ],
    model: ["bias-variance-sim"],
    eval: ["threshold-sim"],
    interp: [
      "shap-waterfall-sim",
      "lime-explainer",
      "permutation-importance",
      "global-vs-local",
    ],
    exp: ["ab-sim"],
    causal: [
      "confounding-simulator",
      "dag-builder",
      "dag-viewer",
      "difference-in-differences",
      "instrumental-variable",
    ],
    peek: [
      "peeking-simulator",
      "multiple-testing",
      "cuped-explainer",
      "power-calculator",
    ],
    deploy: [
      "model-serving-architecture",
      "drift-simulator",
      "shadow-deployment",
      "feature-store-diagram",
    ],
    cap: [
      "dataset-explorer",
      "pipeline-progress",
      "precision-recall-tradeoff",
      "post-deploy-checklist",
    ],
  },
  checkpointKeys: [],
  scoringKeys: [],
};

const GERMAN_META: Readonly<
  Record<DsTranslatedCoreChapterId, Pick<ChapterMeta, "title" | "subtitle">>
> = {
  home: {
    title: "Überblick",
    subtitle: "Zwölf Kapitel und lokale Lehrmodelle",
  },
  fund: {
    title: "Grundlagen",
    subtitle: "Stichprobe gegen Grundgesamtheit, dann der Zyklus",
  },
  explore: {
    title: "Exploration",
    subtitle: "Verteilungen · Ausreißer · Korrelation",
  },
  clean: {
    title: "Datenbereinigung",
    subtitle: "Fehlwerte · Skalierung · Leakage",
  },
  feature: {
    title: "Merkmale",
    subtitle: "Kodierung · Interaktionen · Auswahl",
  },
  model: { title: "Modellierung", subtitle: "Bias und Varianz" },
  eval: {
    title: "Evaluation",
    subtitle: "Konfusionsmatrix · Schwellenwert · ROC/PR",
  },
  interp: { title: "Interpretation", subtitle: "SHAP · Merkmalswichtigkeit" },
  exp: { title: "Experimente", subtitle: "A/B · Power · MDE" },
  causal: {
    title: "Kausalität",
    subtitle: "DAGs · Confounder · Backdoor-Pfade",
  },
  peek: {
    title: "Peeking und CUPED",
    subtitle: "Stoppen, Multiplizität und Kovariatenanpassung",
  },
  deploy: { title: "Betrieb", subtitle: "Drift · Monitoring · Retraining" },
  cap: {
    title: "Abschlussprojekt",
    subtitle: "Vom Datenaudit bis zur Deployment-Prüfung",
  },
};

export function isDsTranslatedCoreChapterId(
  value: unknown,
): value is DsTranslatedCoreChapterId {
  return (
    typeof value === "string" &&
    (DS_TRANSLATED_CORE_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

export function getDsTranslatedCoreChapterMeta(
  id: DsTranslatedCoreChapterId,
  locale: Locale,
): ChapterMeta {
  const source = getDsChapterMeta(id);
  return locale === "en" ? source : { ...source, ...GERMAN_META[id] };
}
