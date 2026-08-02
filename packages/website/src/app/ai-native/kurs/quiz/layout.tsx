import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop-Quiz: AI-Native Arbeitskurs",
  description:
    "20 Fragen aus dem AI-Native Arbeitskurs: Orchestrieren mit Claude, der Claude-Stack, zweites Gehirn und Automatisierung. 70% zum Bestehen, 25 Minuten Zeitlimit. Kostenloses Lernkonto erforderlich.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the root layout.
  alternates: { canonical: null },
};

export default function AiNativeQuizLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
