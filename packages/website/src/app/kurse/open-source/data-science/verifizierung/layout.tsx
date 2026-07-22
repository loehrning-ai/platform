import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify certificate data: Data Science Fundamentals",
  description:
    "Verification page for Data Science Fundamentals certificate data encoded in a QR code. The code is a readable certificate record, not a cryptographic signature.",
  robots: { index: false, follow: false },
  // Utility page: suppress any inherited canonical.
  alternates: { canonical: null },
};

export default function VerifizierungLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
