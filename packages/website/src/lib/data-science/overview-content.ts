import type { ComponentType } from "react";
import type { Locale } from "@/lib/i18n/locale";
import type { DsChapterBodyProps } from "./chapters";

/**
 * The overview chapter on its own.
 *
 * The course landing page renders this one component. Reaching it through the
 * full chapter loader map would put every other chapter's client simulators in
 * the landing page's client entry.
 */
const OVERVIEW_LOADERS: Readonly<
  Record<Locale, () => Promise<{ default: ComponentType<DsChapterBodyProps> }>>
> = {
  en: () => import("@/components/data-science/chapters/ch-overview"),
  de: () => import("@/components/data-science/chapters/de/ch-overview"),
};

export async function getDsOverviewComponent(
  locale: Locale,
): Promise<ComponentType<DsChapterBodyProps>> {
  return (await OVERVIEW_LOADERS[locale]()).default;
}
