import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { ChapterBodyProps } from "./content";
import {
  getDefChapterMeta,
  type ChapterMeta,
  type DefChapterId,
} from "./types";

/**
 * Translation tranche 2. It stays separate from the public route loader until
 * all twelve chapters and every reader surface form one reviewed locale bundle.
 */
export const DEF_TRANSLATED_ADVANCED_CHAPTER_IDS = [
  "orch",
  "qual",
  "disc",
  "serve",
  "gov",
  "cap",
] as const satisfies readonly DefChapterId[];

export type DefTranslatedAdvancedChapterId =
  (typeof DEF_TRANSLATED_ADVANCED_CHAPTER_IDS)[number];

export interface DefAdvancedContentIdentity {
  readonly chapterIds: readonly DefTranslatedAdvancedChapterId[];
  readonly progressKeys: readonly DefTranslatedAdvancedChapterId[];
  readonly sectionIdsByChapter: Readonly<
    Record<DefTranslatedAdvancedChapterId, readonly string[]>
  >;
  readonly simulatorIdsByChapter: Readonly<
    Record<DefTranslatedAdvancedChapterId, readonly string[]>
  >;
  readonly checkpointKeys: readonly string[];
  readonly scoringKeys: readonly string[];
  readonly codeArtifacts: readonly string[];
}

export const DEF_TRANSLATED_ADVANCED_IDENTITY: DefAdvancedContentIdentity = {
  chapterIds: DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
  progressKeys: DEF_TRANSLATED_ADVANCED_CHAPTER_IDS,
  sectionIdsByChapter: {
    orch: ["5.1", "5.2", "5.3"],
    qual: ["6.1", "6.2", "6.3"],
    disc: ["7.1", "7.2", "7.3"],
    serve: ["8.1", "8.2", "8.3"],
    gov: ["9.1", "9.2", "9.3"],
    cap: ["10.1"],
  },
  simulatorIdsByChapter: {
    orch: ["dag-diagram", "backfill-sim"],
    qual: ["trust-meter-sim"],
    disc: ["discovery-speedrun", "lineage-camera"],
    serve: ["metrics-sim"],
    gov: ["permission-gate-sim"],
    cap: ["living-pipeline"],
  },
  checkpointKeys: [],
  scoringKeys: [],
  codeArtifacts: [
    "pipeline.py · the Airflow-approved write",
    "pipeline.py · ExpectationSuite + ExternalTaskSensor",
    "dim_users.spec.yaml · dataset metadata",
    "dim_users.spec.yaml · the shipped annotation",
  ],
};

const GERMAN_META: Readonly<
  Record<
    DefTranslatedAdvancedChapterId,
    Pick<ChapterMeta, "title" | "subtitle">
  >
> = {
  orch: { title: "Orchestrierung", subtitle: "Airflow und Idempotenz" },
  qual: { title: "Qualität", subtitle: "Ausgeführt ist nicht gleich korrekt" },
  disc: { title: "Ermittlung", subtitle: "Katalog- und Lineage-Übung" },
  serve: { title: "Bereitstellung", subtitle: "Metriken und semantische Modelle" },
  gov: { title: "Governance", subtitle: "Die Deployment-Schranke" },
  cap: { title: "Abschlussprojekt", subtitle: "dim_users durchgängig aufbauen" },
};

type DefAdvancedChapterComponent = ComponentType<ChapterBodyProps>;
type DefAdvancedLoader = () => Promise<{ default: DefAdvancedChapterComponent }>;

const LOADERS: Readonly<
  Record<Locale, Record<DefTranslatedAdvancedChapterId, DefAdvancedLoader>>
> = {
  en: {
    orch: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch4-orchestrate"),
    qual: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch5-quality"),
    disc: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch6-discover"),
    serve: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch7-serve"),
    gov: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch8-govern"),
    cap: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch9-capstone"),
  },
  de: {
    orch: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch4-orchestrate"),
    qual: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch5-quality"),
    disc: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch6-discover"),
    serve: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch7-serve"),
    gov: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch8-govern"),
    cap: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch9-capstone"),
  },
};

const caches: Record<
  Locale,
  Map<DefTranslatedAdvancedChapterId, DefAdvancedChapterComponent>
> = {
  de: new Map(),
  en: new Map(),
};

export function isDefTranslatedAdvancedChapterId(
  value: unknown,
): value is DefTranslatedAdvancedChapterId {
  return (
    typeof value === "string" &&
    (DEF_TRANSLATED_ADVANCED_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

export function getDefTranslatedAdvancedChapterMeta(
  id: DefTranslatedAdvancedChapterId,
  locale: Locale,
): ChapterMeta {
  const source = getDefChapterMeta(id);
  return locale === "en" ? source : { ...source, ...GERMAN_META[id] };
}

export async function getDefTranslatedAdvancedChapterComponent(
  id: DefTranslatedAdvancedChapterId,
  locale: Locale,
): Promise<DefAdvancedChapterComponent | undefined> {
  if (!isDefTranslatedAdvancedChapterId(id)) return undefined;
  const cached = caches[locale].get(id);
  if (cached) return cached;
  const loader = LOADERS[locale][id];
  if (!loader) return undefined;
  const loaded = await loader();
  caches[locale].set(id, loaded.default);
  return loaded.default;
}

export async function getAllDefTranslatedAdvancedChapters(
  locale: Locale,
): Promise<
  readonly {
    readonly id: DefTranslatedAdvancedChapterId;
    readonly meta: ChapterMeta;
    readonly component: DefAdvancedChapterComponent;
  }[]
> {
  return Promise.all(
    DEF_TRANSLATED_ADVANCED_CHAPTER_IDS.map(async (id) => {
      const component = await getDefTranslatedAdvancedChapterComponent(
        id,
        locale,
      );
      if (!component) {
        throw new Error(
          `Missing reviewed ${locale} Data Engineering Fundamentals chapter ${id}.`,
        );
      }
      return {
        id,
        meta: getDefTranslatedAdvancedChapterMeta(id, locale),
        component,
      };
    }),
  );
}

export function __resetDefTranslatedAdvancedChapterCacheForTests(): void {
  caches.de.clear();
  caches.en.clear();
}
