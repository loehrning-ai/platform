import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zertifikat: EU AI Act Kurs",
  description:
    "Laden Sie eine lokal erzeugte Teilnahmebestätigung für den EU AI Act Kurs herunter. Nicht signiert, nicht servergeprüft, keine Rechts- oder Compliance-Bestätigung.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the kurs layout.
  alternates: { canonical: null },
};

export default function ZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
