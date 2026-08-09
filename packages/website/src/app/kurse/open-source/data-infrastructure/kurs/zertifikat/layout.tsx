import type { Metadata } from "next";
import { getDataInfraCourseCopy } from "@/lib/data-infrastructure/course-copy";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/data-infrastructure/kurs/zertifikat";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getDataInfraCourseCopy(locale).certificateMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "data-infrastructure",
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
  readonly children: React.ReactNode;
}) {
  return children;
}
