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
    target: { kind: "certificate" },
    title:
      locale === "de"
        ? `Teilnahmebestätigung: ${bundle.config.title}`
        : `Certificate: ${bundle.config.title}`,
    description:
      locale === "de"
        ? "Erzeuge nach erfolgreichem Abschluss eine lokale PDF-Teilnahmebestätigung."
        : "Generate a local PDF certificate after completing the course requirements.",
    availableContentLocales: ["de", "en"],
  });
}

export default function ZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
