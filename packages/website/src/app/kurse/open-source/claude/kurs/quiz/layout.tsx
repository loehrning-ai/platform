import type { Metadata } from "next";
import { getClaudeCourseBundle } from "@/lib/claude-course/localization";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildTechnicalCourseMetadata } from "@/lib/technical-courses/routes";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const bundle = await getClaudeCourseBundle(locale);
  return buildTechnicalCourseMetadata({
    courseSlug: "claude",
    locale,
    target: { kind: "quiz" },
    title:
      locale === "de"
        ? `Abschlussquiz: ${bundle.config.title}`
        : `Workshop quiz: ${bundle.config.title}`,
    description:
      locale === "de"
        ? "19 Übungsfragen, 70 Prozent zum Bestehen, 25 Minuten Zeitlimit."
        : "19 practice questions, 70 percent to pass, and a 25-minute time limit.",
    availableContentLocales: ["de", "en"],
  });
}

export default function QuizLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
