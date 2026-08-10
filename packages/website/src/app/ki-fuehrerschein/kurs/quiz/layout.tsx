import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ki-fuehrerschein",
    await getRequestLocale(),
  );
  return {
    title:
      locale === "en"
        ? "Workshop quiz: Everyday AI Literacy"
        : "Workshop-Quiz: KI-Führerschein",
    description:
      locale === "en"
        ? "Twenty practical questions on everyday AI literacy. Pass mark: 70 percent. Time limit: 25 minutes."
        : "20 Praxisfragen zur KI-Kompetenz. 70% zum Bestehen, 25 Minuten Zeitlimit.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function QuizLayout({ children }: { readonly children: ReactNode }) {
  return children;
}
