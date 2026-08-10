import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "eu-ai-act-kurs",
    await getRequestLocale(),
  );
  return {
    title:
      locale === "en"
        ? "Workshop quiz: EU AI Act Course"
        : "Workshop-Quiz: EU AI Act Kurs",
    description:
      locale === "en"
        ? "Twenty-seven practical questions on the EU AI Act. Pass mark: 70 percent. Time limit: 30 minutes."
        : "27 Praxisfragen zur EU-KI-Verordnung. 70% zum Bestehen, 30 Minuten Zeitlimit.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function QuizLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
