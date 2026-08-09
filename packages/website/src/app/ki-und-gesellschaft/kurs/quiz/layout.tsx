import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ki-und-gesellschaft",
    await getRequestLocale(),
  );
  return {
    title:
      locale === "en"
        ? "Workshop quiz: AI and Society"
        : "Workshop-Quiz: KI und Gesellschaft",
    description:
      locale === "en"
        ? "Fifteen questions on AI and work, deepfakes, and bias. Pass mark: 70 percent. Time limit: 20 minutes."
        : "15 Fragen zu KI und Arbeit, Deepfakes und Bias. 70% zum Bestehen, 20 Minuten Zeitlimit.",
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
