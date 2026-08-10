import type { Metadata } from "next";
import { getRequestLocale } from "@/lib/i18n/request-locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: locale === "en" ? "Account · Privacy" : "Konto · Datenschutz",
    description:
      locale === "en"
        ? "Export account data, reset course progress, or delete the learning account."
        : "Kontodaten exportieren, Kursfortschritt zurücksetzen oder das Lernkonto löschen.",
    robots: { index: false, follow: false },
    // Protected utility page: suppress the canonical inherited from root.
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
  };
}

export default function KontoDatenschutzLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
