import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konto · Datenschutz",
  robots: { index: false },
  // Utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

export default function KontoDatenschutzLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
