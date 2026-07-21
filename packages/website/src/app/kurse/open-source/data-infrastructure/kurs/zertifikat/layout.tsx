import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificate: Data Infrastructure",
  description: "Download your Data Infrastructure certificate of completion.",
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
