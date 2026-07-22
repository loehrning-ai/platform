import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Certificate: Data Science Fundamentals",
  description: "Download your Data Science Fundamentals certificate of completion.",
  robots: { index: false, follow: false },
  // Utility page: suppress any inherited canonical.
  alternates: { canonical: null },
};

export default function ZertifikatLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
