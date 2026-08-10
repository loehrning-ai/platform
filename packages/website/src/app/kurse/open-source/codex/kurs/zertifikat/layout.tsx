import type { Metadata } from "next";
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/codex/kurs/zertifikat";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getCodexLocaleRegistry()).get(locale);
  const copy = getCodexCourseCopy(locale).certificateMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "codex",
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
