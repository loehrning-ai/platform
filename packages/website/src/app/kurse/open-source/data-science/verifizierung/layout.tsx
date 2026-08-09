import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getDataScienceCourseCopy } from "@/lib/data-science/course-copy";
import { getDsLocaleRegistry } from "@/lib/data-science/content";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-science/verifizierung";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getDsLocaleRegistry()).get(locale);
  const copy = getDataScienceCourseCopy(locale).verificationMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-science",
    locale,
    target: { kind: "verification" },
    title: copy.title,
    description: copy.description,
    availableContentLocales: contentLocalesForPath(CANONICAL_PATH),
  });
}

export default function VerifizierungLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
