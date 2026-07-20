import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lernnachweis: KI und Gesellschaft",
  description:
    "Lade eine lokal erzeugte Teilnahmebestätigung für den Kurs KI und Gesellschaft herunter. Nicht signiert, nicht servergeprüft, keine behördliche oder rechtliche Bescheinigung.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function ZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
