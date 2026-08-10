import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { DsChapterBodyProps } from "./chapters";
import type { ChapterMeta } from "./types";
import {
  DS_TRANSLATED_CORE_CHAPTER_IDS,
  getDsTranslatedCoreChapterMeta,
  isDsTranslatedCoreChapterId,
  type DsTranslatedCoreChapterId,
} from "./localized-core-meta";

export * from "./localized-core-meta";

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
