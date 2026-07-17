import type { Metadata } from "next";
import { FluencyTest } from "@/components/ai-native/fluency-test";

export const metadata: Metadata = {
  title: "AI-Native Fluency Test: 10 Szenarien",
  description:
    "In 5 Minuten herausfinden, wo du in 5 AI-Fluency-Dimensionen stehst: Drafting, Delegation, Automation, Knowledge, Governance. Kostenloser Selbsttest ohne Anmeldung.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native/fluency-test" },
  openGraph: {
    title: "AI-Native Fluency Test: 5 Minuten, 5 Dimensionen",
    description:
      "10 Szenarien, die dir zeigen, wo du AI-nativ arbeitest und wo nicht. Kostenlos ohne Anmeldung.",
    url: "https://loehrning.ai/ai-native/fluency-test",
    type: "website",
  },
};

export default function FluencyTestPage() {
  return <FluencyTest />;
}
