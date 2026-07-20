import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lernnachweis prüfen: KI und Gesellschaft",
  description:
    "Prüfseite für Lernnachweis-Daten aus dem QR-Code für den Kurs KI und Gesellschaft. Der Code ist ein lesbarer Zertifikatsdatensatz, keine kryptografische Signatur.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function VerifizierungLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
