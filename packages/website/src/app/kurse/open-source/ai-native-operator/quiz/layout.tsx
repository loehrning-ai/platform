import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop Quiz: The AI-Native Operator",
  description:
    "22 practice questions pooled from the 9 module knowledge-checks. 70% to pass, 28-minute time limit.",
  robots: { index: false, follow: false },
  // Utility page: suppress the canonical inherited from the course layout.
  alternates: { canonical: null },
};

export default function QuizLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
