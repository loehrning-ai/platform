import type { Metadata } from "next";
import { getCodexCourseCopy } from "@/lib/codex/course-copy";
import { getCodexLocaleRegistry } from "@/lib/codex/data";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

const CANONICAL_PATH = "/kurse/open-source/codex/verifizierung";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  (await getCodexLocaleRegistry()).get(locale);
  const copy = getCodexCourseCopy(locale).verificationMetadata;
  return buildTechnicalCourseMetadata({
    courseSlug: "codex",
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
  readonly children: React.ReactNode;
}) {
  return children;
}
