import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop-Quiz: EU AI Act Kurs",
  description:
    "27 Praxisfragen zur EU-KI-Verordnung. 70% zum Bestehen, 30 Minuten Zeitlimit. Teste dein Regulierungswissen.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the kurs layout.
  alternates: { canonical: null },
};

export default function QuizLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
