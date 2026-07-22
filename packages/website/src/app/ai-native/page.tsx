import type { Metadata } from "next";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { AiNativeContinueBanner } from "@/components/ai-native/continue-banner";
import { AiNativeHero } from "@/components/ai-native/hero";
import { AiNativeModulesOverview } from "@/components/ai-native/modules-overview";
import { AiNativeSkillGraph } from "@/components/ai-native/skill-graph";
import { AiNativeWeekInLife } from "@/components/ai-native/week-in-life";
import { AiNativeBundleShowcase } from "@/components/ai-native/bundle-showcase";
import { AiNativeChallengeOfTheWeek } from "@/components/ai-native/challenge-of-the-week";
import { AiNativeTimAnchor } from "@/components/ai-native/tim-anchor";
import { AiNativeFaqSection } from "@/components/ai-native/faq-section";
import { AiNativeCrossSell } from "@/components/ai-native/cross-sell";
import { AiNativeFinalCta } from "@/components/ai-native/final-cta";

export const metadata: Metadata = {
  title: "AI-Native Arbeitskurs: Arbeiten mit Claude",
  description:
    "Kostenloser AI-Native Arbeitskurs für Mitarbeiter, Selbstständige und Studierende. 27 Lektionen, 4 Module, Claude-first, auf Deutsch. Erfordert ein kostenloses Lernkonto.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native" },
  openGraph: {
    title: "AI-Native Arbeitskurs: Arbeiten mit Claude",
    description:
      "Komplett kostenlos, mit Lernkonto. 27 Lektionen, 4 Module, auf Deutsch. Mit Skills-Mustern, Prompts, Vault-Struktur und n8n-Flow-Beispielen.",
    url: "https://loehrning.ai/ai-native",
    type: "website",
  },
};

// Breadcrumb + Course @graph (shared course architecture): mirrors the KI-Führerschein
// and EU-AI-Act landing pages so all three courses emit a breadcrumb trail and
// a free-access Course node. The breadcrumb runs Start → Kurse → AI-Native so
// the new /kurse hub is part of the indexed trail.
const courseJsonLd = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Kurse",
          item: `${SITE_URL}/kurse`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "AI-Native Arbeitskurs",
          item: `${SITE_URL}/ai-native`,
        },
      ],
    },
    {
      "@type": "Course",
      name: "AI-Native Arbeitskurs",
      description:
        "Claude-first AI-Arbeitsweise für Mittelstand. 27 Lektionen, 4 Module, kostenlos mit Lernkonto, mit prüfbaren Sandbox-Übungen.",
      provider: { "@id": ORG_ID },
      isAccessibleForFree: true,
      inLanguage: "de",
      educationalLevel: "Intermediate",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT12H",
        inLanguage: "de",
      },
    },
  ],
};

export default function AiNativePage() {
  return (
    <>
      <JsonLd data={courseJsonLd} id="ai-native-landing-jsonld" />
      <ScrollProgress />

      {/* Continue-where-you-left-off banner (renders only when progress exists) */}
      <AiNativeContinueBanner />

      {/* Hero */}
      <AiNativeHero />

      {/* Module overview */}
      <AiNativeModulesOverview />

      {/* Skill graph */}
      <AiNativeSkillGraph />

      {/* Week-in-life timeline */}
      <AiNativeWeekInLife />

      {/* Learning materials */}
      <AiNativeBundleShowcase />

      {/* AI Challenge of the Week */}
      <AiNativeChallengeOfTheWeek />

      {/* Author section */}
      <AiNativeTimAnchor />

      {/* FAQ */}
      <AiNativeFaqSection />

      {/* Demo cross-link */}
      <AiNativeCrossSell />

      {/* Final call to action */}
      <AiNativeFinalCta />

      {/* Trimmed in AI-native demo gallery implementation: BeforeAfter, PromptPlayground,
          TerminalDemo, their content lives richer in /ai-native/demos
          (ChatDemo, ComplianceDemo, WorkflowDemo, DocDemo). Components
          preserved in git history + src/ for future restore. */}
    </>
  );
}
