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
        ? "Certificate of participation: EU AI Act Course"
        : "Teilnahmebestätigung: EU AI Act Kurs",
    description:
      locale === "en"
        ? "Download a locally generated certificate of participation. It is unsigned, not server-verified, and not evidence of legal compliance."
        : "Lade eine lokal erzeugte Teilnahmebestätigung herunter. Sie ist nicht signiert, nicht servergeprüft und keine Rechts- oder Compliance-Bestätigung.",
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
