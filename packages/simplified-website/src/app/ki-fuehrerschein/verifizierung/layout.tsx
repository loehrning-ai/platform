import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zertifikatdaten prüfen: KI-Führerschein",
  description:
    "Prüfseite für KI-Führerschein-Zertifikatdaten aus dem QR-Code. Der Code ist ein lesbarer Zertifikatsdatensatz, keine kryptografische Signatur.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

export default function VerifizierungLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
