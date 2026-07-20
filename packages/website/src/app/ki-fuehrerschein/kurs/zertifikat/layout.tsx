import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zertifikat: KI-Führerschein",
  description:
    "Lade eine lokal erzeugte Teilnahmebestätigung für den KI-Führerschein herunter. Nicht signiert, nicht servergeprüft, keine behördliche oder rechtliche Bescheinigung.",
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
