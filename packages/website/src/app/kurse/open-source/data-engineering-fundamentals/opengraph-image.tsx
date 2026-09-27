import { ImageResponse } from "next/og";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { COURSE_PLAKAT } from "@/lib/plakat/palettes";
import { CourseOgCard, courseOgFonts } from "../../course-og-card";

// ─── OG/Twitter image ────────────────────────────
// This course resolves as a static folder, shadowing the [slug]
// dynamic-segment subtree (and its own opengraph-image.tsx/twitter-
// image.tsx) for this one path. Without a local image route here, the
// social-share preview would 404 once this course leaves
// generateStaticParams's IMPORTED_COURSE_CATALOG-filtered view. Only this
// one course lives here, so the card needs no dynamic params.

export const alt = "Data Engineering Fundamentals: interactive course";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** A Technikkurs in the Bloom scene, without a numeral (SPEC §2.2, D9). */
export default async function Image() {
  const locale = await getRequestLocale();
  const copy = getDataEngineeringFundamentalsCourseCopy(locale).socialImage;

  return new ImageResponse(
    <CourseOgCard
      scene={COURSE_PLAKAT["data-engineering-fundamentals"]}
      caps={copy.eyebrow}
      title="Data Engineering Fundamentals"
      titleSize={76}
      subtitle={copy.description}
      trailing="/kurse/open-source"
    />,
    { ...size, fonts: await courseOgFonts() },
  );
}
