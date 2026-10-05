import { ImageResponse } from "next/og";
import { COURSE_HUB_COPY } from "@/lib/courses/course-hub-copy";
import { ALL_COURSE_CATALOG } from "@/lib/courses/catalog";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { localizeHref } from "@/lib/i18n/locale";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CatalogOgCard, courseOgFonts } from "./course-og-card";

export const alt =
  "loehrning.ai course catalog: AI foundations, visual learning, and applied workshops in German and English";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The /kurse card stays paper, like the page (SPEC §2.3): the catalogue's
 * headline and a 2 × 2 series of track posters at full card height, the
 * Grundlagenpfad's "01" first and its "02" last, IDEA and Bloom between.
 */
export default async function Image() {
  const locale = await getRequestLocale();
  const copy = COURSE_HUB_COPY[locale];

  return new ImageResponse(
    <CatalogOgCard
      caps={copy.kicker(ALL_COURSE_CATALOG.length)}
      title={copy.heading}
      titleSize={68}
      subtitle=""
      trailing={localizeHref("/kurse", locale)}
      posters={[
        COURSE_PLAKAT["ki-fuehrerschein"],
        COURSE_PLAKAT["ai-native-operator"],
        COURSE_PLAKAT["data-science"],
        COURSE_PLAKAT["ki-und-gesellschaft"],
      ]}
    />,
    { ...size, fonts: await courseOgFonts() },
  );
}
