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
        ? "Course completion record: AI and Society"
        : "Lernnachweis: KI und Gesellschaft",
    description:
      locale === "en"
        ? "Download a locally generated course completion record. It is unsigned, not server-verified, and not an official or professional qualification."
        : "Lade einen lokal erzeugten Lernnachweis herunter. Er ist nicht signiert, nicht servergeprüft und keine amtliche oder berufliche Qualifikation.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function ZertifikatLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
