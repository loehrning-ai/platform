import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify certificate data: The AI-Native Operator",
  description:
    "Verification page for The AI-Native Operator certificate data encoded in a QR code. The code is a readable certificate record, not a cryptographic signature.",
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
