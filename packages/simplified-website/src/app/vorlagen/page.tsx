import type { Metadata } from "next";
import { getAllVorlagenMeta } from "@/lib/vorlagen";
import { VorlagenContent } from "./vorlagen-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

const VORLAGEN = getAllVorlagenMeta();

export const metadata: Metadata = {
  title: "Governance-Vorlagen für KI im Mittelstand",
  description:
    `${VORLAGEN.length} Governance-Vorlagen aus der kostenlosen KI-Lernplattform: Kursbegleitende Arbeitsblätter für EU AI Act, KI-Governance und Pilot-Steuerung.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/vorlagen" },
  openGraph: {
    title: "Governance-Vorlagen für KI im Mittelstand",
    description:
      `${VORLAGEN.length} kostenlose Governance-Vorlagen. Markdown, PDF und CSV sind ohne Anmeldung abrufbar.`,
    url: "https://loehrning.ai/vorlagen",
    type: "website",
  },
};

export default function VorlagenPage() {
  const vorlagen = VORLAGEN;

  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Governance-Vorlagen",
        description:
          "Praxisfertige Governance- und Compliance-Vorlagen für KI-Kompetenz, AI Act und Pilotsteuerung.",
        inLanguage: "de-DE",
        url: `${SITE_URL}/vorlagen`,
        publisher: { "@id": ORG_ID },
        hasPart: vorlagen.map((v) => ({
          "@type": "HowTo",
          name: v.title,
          description: v.jobToBeDone,
          url: `${SITE_URL}/vorlagen/${v.slug}`,
          inLanguage: "de-DE",
          isAccessibleForFree: true,
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id="vorlagen-jsonld" />
      <VorlagenContent vorlagen={vorlagen} />
    </>
  );
}
