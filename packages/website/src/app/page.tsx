import { HeroSection } from "@/components/home/hero";
import { CredibilityStrip } from "@/components/home/credibility-strip";
import { Offering } from "@/components/home/offering";
import { Workflow } from "@/components/home/workflow";
import { FinalCta } from "@/components/home/final-cta";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

// The root layout template ("%s | loehrning.ai") appends the site name, so the
// title itself stays descriptive and suffix-free (no "loehrning.ai | loehrning.ai").
export const metadata = createPublicPageMetadata({
  title: "Kostenlose deutsche KI-Lernplattform von Tim Löhr",
  description:
    "Kostenlose KI-Kurse, Bücher und Demos ohne Paywall. Ressourcen und technische Kursreader sind ohne Konto nutzbar; vier deutsche Kernkurse nutzen ein kostenloses Lernkonto.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      {/* Scroll progress — 2px Kupfer line at viewport top */}
      <ScrollProgress />

      {/* 1. Hero — the promise, stated once */}
      <HeroSection />

      {/* 2. Kurse — the learning path + deeper labs */}
      <Offering />

      {/* 3. Ressourcen — supporting material, one clear home */}
      <Workflow />

      {/* 4. Platform principles / trust */}
      <CredibilityStrip />

      {/* 5. Closing CTA */}
      <FinalCta />
    </>
  );
}
