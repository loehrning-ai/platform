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
        ? "Certificate of participation: Everyday AI Literacy"
        : "Teilnahmebestätigung: KI-Führerschein",
    description:
      locale === "en"
        ? "Download a locally generated certificate of participation. It is unsigned, not server-verified, and not an official credential."
        : "Lade eine lokal erzeugte Teilnahmebestätigung herunter. Sie ist nicht signiert, nicht servergeprüft und keine behördliche oder rechtliche Bescheinigung.",
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
