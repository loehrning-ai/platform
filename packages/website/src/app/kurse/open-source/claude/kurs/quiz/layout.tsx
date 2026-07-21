import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workshop Quiz: Claude Course",
  description:
    "15 practice questions on prompting Claude effectively. 70% to pass, 20-minute time limit.",
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
