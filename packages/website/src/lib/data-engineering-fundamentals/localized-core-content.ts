import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { ChapterBodyProps } from "./content";
import {
  getDefChapterMeta,
  type ChapterMeta,
  type DefChapterId,
} from "./types";

/**
 * Translation tranche 1. It is intentionally separate from the public route
 * loader until all twelve chapters have reviewed German content.
 */
export const DEF_TRANSLATED_CORE_CHAPTER_IDS = [
  "home",
  "fund",
  "ingest",
  "stream",
  "store",
  "comp",
] as const satisfies readonly DefChapterId[];

export type DefTranslatedCoreChapterId =
  (typeof DEF_TRANSLATED_CORE_CHAPTER_IDS)[number];

export interface DefCoreContentIdentity {
  readonly chapterIds: readonly DefTranslatedCoreChapterId[];
  readonly progressKeys: readonly DefTranslatedCoreChapterId[];
  readonly sectionIdsByChapter: Readonly<
    Record<DefTranslatedCoreChapterId, readonly string[]>
  >;
  readonly simulatorIdsByChapter: Readonly<
    Record<DefTranslatedCoreChapterId, readonly string[]>
  >;
  readonly checkpointKeys: readonly string[];
  readonly scoringKeys: readonly string[];
  readonly codeArtifacts: readonly string[];
}

export const DEF_TRANSLATED_CORE_IDENTITY: DefCoreContentIdentity = {
  chapterIds: DEF_TRANSLATED_CORE_CHAPTER_IDS,
  progressKeys: DEF_TRANSLATED_CORE_CHAPTER_IDS,
  sectionIdsByChapter: {
    home: [],
    fund: ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8"],
    ingest: ["1.1", "1.2", "1.3", "1.4"],
    stream: ["2.1", "2.2", "2.3"],
    store: ["3.1", "3.2", "3.3"],
    comp: ["4.1", "4.2"],
  },
  simulatorIdsByChapter: {
    home: ["pipeline-bar"],
    fund: [
      "layer-cake",
      "byte-trace",
      "scanner",
      "sql-decoder-stage",
      "connector-switcher",
    ],
    ingest: ["watermark-sim"],
    stream: ["conveyor-sim"],
    store: ["cumulative-sim"],
    comp: ["shuffle-sim"],
  },
  checkpointKeys: [],
  scoringKeys: [],
  codeArtifacts: [
    "kafka_to_warehouse_events.sql",
    "fct_events_dedup.sql",
    "user_lifetime_points.sql",
  ],
};

const GERMAN_META: Readonly<
  Record<DefTranslatedCoreChapterId, Pick<ChapterMeta, "title" | "subtitle">>
> = {
  home: { title: "Überblick", subtitle: "Die Pipeline vom Anfang bis zum Ende" },
  fund: { title: "Grundlagen", subtitle: "Speicher, Formate und Engines" },
  ingest: { title: "Datenaufnahme", subtitle: "Wo Daten entstehen" },
  stream: { title: "Streaming", subtitle: "Die Brücke zum Warehouse" },
  store: { title: "Speicherung", subtitle: "Wo Daten liegen" },
  comp: { title: "Verarbeitung", subtitle: "Wie Daten gelesen werden" },
};

type DefCoreChapterComponent = ComponentType<ChapterBodyProps>;
type DefCoreLoader = () => Promise<{ default: DefCoreChapterComponent }>;

const LOADERS: Readonly<
  Record<Locale, Record<DefTranslatedCoreChapterId, DefCoreLoader>>
> = {
  en: {
    home: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch-overview"),
    fund: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch0-fundamentals"),
    ingest: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch1-ingest"),
    stream: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch1-5-streaming"),
    store: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch2-store"),
    comp: () =>
      import("@/components/data-engineering-fundamentals/chapters/ch3-compute"),
  },
  de: {
    home: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch-overview"),
    fund: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch0-fundamentals"),
    ingest: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch1-ingest"),
    stream: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch1-5-streaming"),
    store: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch2-store"),
    comp: () =>
      import("@/components/data-engineering-fundamentals/chapters/de/ch3-compute"),
  },
};

const caches: Record<
  Locale,
  Map<DefTranslatedCoreChapterId, DefCoreChapterComponent>
> = {
  de: new Map(),
  en: new Map(),
};

export function isDefTranslatedCoreChapterId(
  value: unknown,
): value is DefTranslatedCoreChapterId {
  return (
    typeof value === "string" &&
    (DEF_TRANSLATED_CORE_CHAPTER_IDS as readonly string[]).includes(value)
  );
}

export function getDefTranslatedCoreChapterMeta(
  id: DefTranslatedCoreChapterId,
  locale: Locale,
): ChapterMeta {
  const source = getDefChapterMeta(id);
  return locale === "en" ? source : { ...source, ...GERMAN_META[id] };
}

export async function getDefTranslatedCoreChapterComponent(
  id: DefTranslatedCoreChapterId,
  locale: Locale,
): Promise<DefCoreChapterComponent | undefined> {
  if (!isDefTranslatedCoreChapterId(id)) return undefined;
  const cached = caches[locale].get(id);
  if (cached) return cached;
  const loader = LOADERS[locale][id];
  if (!loader) return undefined;
  const loaded = await loader();
  caches[locale].set(id, loaded.default);
  return loaded.default;
}

export async function getAllDefTranslatedCoreChapters(locale: Locale): Promise<
  readonly {
    readonly id: DefTranslatedCoreChapterId;
    readonly meta: ChapterMeta;
    readonly component: DefCoreChapterComponent;
  }[]
> {
  return Promise.all(
    DEF_TRANSLATED_CORE_CHAPTER_IDS.map(async (id) => {
      const component = await getDefTranslatedCoreChapterComponent(id, locale);
      if (!component) {
        throw new Error(
          `Missing reviewed ${locale} Data Engineering Fundamentals chapter ${id}.`,
        );
      }
      return {
        id,
        meta: getDefTranslatedCoreChapterMeta(id, locale),
        component,
      };
    }),
  );
}

export function __resetDefTranslatedCoreChapterCacheForTests(): void {
  caches.de.clear();
  caches.en.clear();
}
