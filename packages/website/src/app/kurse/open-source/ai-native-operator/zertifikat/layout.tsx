import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificate: The AI-Native Operator",
  description: "Download your AI-Native Operator certificate of completion.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the course layout.
  alternates: { canonical: null },
};

export default function ZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
