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
        ? "Final quiz: Working with AI"
        : "Abschlussquiz: Mit KI arbeiten",
    description:
      locale === "en"
        ? "Fifteen questions on net time, triage, context, tool permissions, cited knowledge and safeguarded workflows. Pass mark: 70 percent. Time limit: 20 minutes."
        : "15 Fragen zu Netto-Zeit, Triage, Kontext, Werkzeugrechten, zitiertem Wissen und abgesicherten Abläufen. 70 Prozent zum Bestehen, 20 Minuten Zeitlimit.",
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
