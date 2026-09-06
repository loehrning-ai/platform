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
        ? "Certificate of participation: AI-Native Workflow Course"
        : "Teilnahmebestätigung: AI-Native Arbeitskurs",
    description:
      locale === "en"
        ? "Download a locally generated certificate of participation. It is unsigned, not server-verified and not an external assessment."
        : "Lade eine lokal erzeugte Teilnahmebestätigung herunter. Sie ist nicht signiert, nicht servergeprüft und keine externe Prüfungsleistung.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function AiNativeZertifikatLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
