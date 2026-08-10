import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDataEngineeringFundamentalsCourseCopy } from "@/lib/data-engineering-fundamentals/course-copy";
import { getDefLocaleRegistry } from "@/lib/data-engineering-fundamentals/content";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

const CANONICAL_PATH =
  "/kurse/open-source/data-engineering-fundamentals/zertifikat";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getDefLocaleRegistry()).get(locale);
  const copy =
    getDataEngineeringFundamentalsCourseCopy(locale).certificateMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-engineering-fundamentals",
    locale,
    target: { kind: "certificate" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}
export default function ZertifikatLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
