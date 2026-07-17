import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop-Quiz: KI und Gesellschaft",
  description:
    "15 Fragen zu KI und Arbeit, Deepfakes und KI-Ethik. 70% zum Bestehen, 20 Minuten Zeitlimit.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

export default function QuizLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
