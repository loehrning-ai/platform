import type { Metadata } from "next";
import { DemosGalleryView } from "@/components/ai-native/demos-gallery-view";

export const metadata: Metadata = {
  title: "Praxisbeispiele: AI-Native Arbeitskurs",
  description:
    "Neun kursgebundene Praxisbeispiele aus dem AI-Native-Kurs: RAG-Assistent, Compliance-Scanner, ROI-Rechner, Invoice-OCR, Agent-Workflows, n8n-Flows und mehr. Simuliert im Browser.",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://loehrning.ai/ai-native/demos" },
  openGraph: {
    title: "AI-Native Arbeitskurs · KI-Praxisbeispiele",
    description:
      "9 kursgebundene Praxisbeispiele. Simuliert, quelloffen, im Browser.",
    url: "https://loehrning.ai/ai-native/demos",
    type: "website",
  },
};

export default function AiNativeDemosPage() {
  return <DemosGalleryView />;
}
