import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return {
    title:
      locale === "en"
        ? "Workshop quiz: AI-Native Workflow Course"
        : "Workshop-Quiz: AI-Native Arbeitskurs",
    description:
      locale === "en"
        ? "Twenty questions on bounded tasks, Claude workspaces, maintained knowledge and controlled automation. Pass mark: 70 percent. Time limit: 25 minutes."
        : "20 Fragen zu klaren Aufgaben, Claude-Arbeitsumgebungen, gepflegtem Wissen und kontrollierter Automatisierung. 70 Prozent zum Bestehen, 25 Minuten Zeitlimit.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function AiNativeQuizLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
