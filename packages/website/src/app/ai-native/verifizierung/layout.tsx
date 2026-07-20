import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zertifikatdaten prüfen: AI-Native Arbeitskurs",
  description:
    "Prüfseite für AI-Native-Arbeitskurs-Zertifikatdaten aus dem QR-Code. Der Code ist ein lesbarer Zertifikatsdatensatz, keine kryptografische Signatur.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

export default function AiNativeVerifizierungLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
