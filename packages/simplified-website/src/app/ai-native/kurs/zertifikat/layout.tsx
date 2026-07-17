import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zertifikat: AI-Native Arbeitskurs",
  description:
    "Lade eine lokal erzeugte Teilnahmebestätigung für den AI-Native Arbeitskurs herunter. Nicht signiert und nicht servergeprüft.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

export default function AiNativeZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
