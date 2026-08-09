import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { DsChapterBodyProps } from "./chapters";
import { getDsChapterMeta, type ChapterMeta, type DsChapterId } from "./types";

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
    subtitle: "Stichprobe, Grundgesamtheit und Arbeitszyklus",
  },
  explore: {
    title: "Exploration",
    subtitle: "Verteilungen, Ausreißer und Korrelationen",
  },
  clean: {
    title: "Datenbereinigung",
    subtitle: "Fehlwerte, Skalierung und Leakage",
  },
  feature: {
    title: "Merkmale",
    subtitle: "Kodierung, Interaktionen und Auswahl",
  },
  model: { title: "Modellierung", subtitle: "Bias und Varianz" },
  eval: {
    title: "Evaluation",
    subtitle: "Konfusionsmatrix, Schwellenwert und ROC/PR",
  },
  interp: { title: "Interpretation", subtitle: "SHAP und Merkmalswichtigkeit" },
  exp: { title: "Experimente", subtitle: "A/B-Tests, Power und MDE" },
  causal: {
    title: "Kausalität",
    subtitle: "DAGs, Confounder und Backdoor-Pfade",
  },
  peek: {
    title: "Peeking und CUPED",
    subtitle: "Stoppen, Multiplizität und Kovariatenanpassung",
  },
  deploy: { title: "Betrieb", subtitle: "Drift, Monitoring und Retraining" },
  cap: {
    title: "Abschlussprojekt",
    subtitle: "Vom Datenaudit bis zur Deployment-Prüfung",
  },
};

type DsCoreChapterComponent = ComponentType<DsChapterBodyProps>;
type DsCoreLoader = () => Promise<{ default: DsCoreChapterComponent }>;

const LOADERS: Readonly<
  Record<Locale, Record<DsTranslatedCoreChapterId, DsCoreLoader>>
> = {
  en: {
    home: () => import("@/components/data-science/chapters/ch-overview"),
    fund: () => import("@/components/data-science/chapters/ch01-fundamentals"),
    explore: () => import("@/components/data-science/chapters/ch02-explore"),
    clean: () => import("@/components/data-science/chapters/ch03-clean"),
    feature: () => import("@/components/data-science/chapters/ch04-feature"),
    model: () => import("@/components/data-science/chapters/ch05-model"),
    eval: () => import("@/components/data-science/chapters/ch06-evaluate"),
    interp: () => import("@/components/data-science/chapters/ch07-interpret"),
    exp: () => import("@/components/data-science/chapters/ch08-experiment"),
    causal: () => import("@/components/data-science/chapters/ch09-causal"),
    peek: () => import("@/components/data-science/chapters/ch10-peeking"),
    deploy: () => import("@/components/data-science/chapters/ch11-deploy"),
    cap: () => import("@/components/data-science/chapters/ch12-capstone"),
  },
  de: {
    home: () => import("@/components/data-science/chapters/de/ch-overview"),
    fund: () =>
      import("@/components/data-science/chapters/de/ch01-fundamentals"),
    explore: () => import("@/components/data-science/chapters/de/ch02-explore"),
    clean: () => import("@/components/data-science/chapters/de/ch03-clean"),
    feature: () => import("@/components/data-science/chapters/de/ch04-feature"),
    model: () => import("@/components/data-science/chapters/de/ch05-model"),
    eval: () => import("@/components/data-science/chapters/de/ch06-evaluate"),
    interp: () =>
      import("@/components/data-science/chapters/de/ch07-interpret"),
    exp: () => import("@/components/data-science/chapters/de/ch08-experiment"),
    causal: () => import("@/components/data-science/chapters/de/ch09-causal"),
    peek: () => import("@/components/data-science/chapters/de/ch10-peeking"),
    deploy: () => import("@/components/data-science/chapters/de/ch11-deploy"),
    cap: () => import("@/components/data-science/chapters/de/ch12-capstone"),
  },
};

const caches: Record<
  Locale,
  Map<DsTranslatedCoreChapterId, DsCoreChapterComponent>
> = {
  de: new Map(),
  en: new Map(),
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

export async function getDsTranslatedCoreChapterComponent(
  id: DsTranslatedCoreChapterId,
  locale: Locale,
): Promise<DsCoreChapterComponent | undefined> {
  if (!isDsTranslatedCoreChapterId(id)) return undefined;
  const cached = caches[locale].get(id);
  if (cached) return cached;
  const loaded = await LOADERS[locale][id]();
  caches[locale].set(id, loaded.default);
  return loaded.default;
}

export async function getAllDsTranslatedCoreChapters(locale: Locale): Promise<
  readonly {
    readonly id: DsTranslatedCoreChapterId;
    readonly meta: ChapterMeta;
    readonly component: DsCoreChapterComponent;
  }[]
> {
  return Promise.all(
    DS_TRANSLATED_CORE_CHAPTER_IDS.map(async (id) => {
      const component = await getDsTranslatedCoreChapterComponent(id, locale);
      if (!component) {
        throw new Error(
          `Missing reviewed ${locale} Data Science chapter ${id}.`,
        );
      }
      return {
        id,
        meta: getDsTranslatedCoreChapterMeta(id, locale),
        component,
      };
    }),
  );
}

export function __resetDsTranslatedCoreChapterCacheForTests(): void {
  caches.de.clear();
  caches.en.clear();
}
