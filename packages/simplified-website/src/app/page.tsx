import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero";
import { CredibilityStrip } from "@/components/home/credibility-strip";
import { Offering } from "@/components/home/offering";
import { Workflow } from "@/components/home/workflow";
import { FinalCta } from "@/components/home/final-cta";
import { ScrollProgress } from "@/components/ui/scroll-progress";

// The root layout template ("%s | loehrning.ai") appends the site name, so the
// title itself stays descriptive and suffix-free (no "loehrning.ai | loehrning.ai").
export const metadata: Metadata = {
  title: "Kostenlose deutsche KI-Lernplattform von Tim Löhr",
  description:
    "Kostenlose KI-Kurse, Bücher, Demos und Vorlagen auf Deutsch, ohne Konto und ohne Paywall. Betrieben von Tim Löhr, Data Engineer.",
};

export default function HomePage() {
  return (
    <>
      {/* Scroll progress — 2px Kupfer line at viewport top */}
      <ScrollProgress />

      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Course-first resource overview */}
      <Offering />

      {/* 3. Learning workflow */}
      <Workflow />

      {/* 4. Platform principles */}
      <CredibilityStrip />

      {/* 5. Closing resource CTA */}
      <FinalCta />
    </>
  );
}
