import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop-Quiz: KI-Führerschein",
  description:
    "20 Praxisfragen zum EU AI Act Art. 4. 70% zum Bestehen, 25 Minuten Zeitlimit. Teste deine KI-Kompetenz.",
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
