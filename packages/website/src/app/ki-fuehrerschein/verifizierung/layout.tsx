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
        ? "Read course-record data: Everyday AI Literacy"
        : "Teilnahmedaten lesen: KI-Führerschein",
    description:
      locale === "en"
        ? "Read the course-record data contained in a QR link. The data is not a cryptographic signature or server-side verification."
        : "Lies die Teilnahmedaten aus einem QR-Link. Die Daten sind keine kryptografische Signatur oder serverseitige Verifizierung.",
    robots: { index: false, follow: false },
    alternates: { canonical: null },
  };
}

export default function VerifizierungLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return children;
}
