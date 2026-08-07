import type { Metadata } from "next";
import { WORKSHOPS } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

// Agrees with the count instead of hardcoding a number and a singular noun.
// This read "2 kostenloses Selbstlern-Workshop-Kit" once the second workshop
// shipped, and described only the first one.
const countPhrase =
  WORKSHOPS.length === 1
    ? "Ein kostenloser Selbstlern-Workshop"
    : `${WORKSHOPS.length} kostenlose Selbstlern-Workshops`;

export const metadata: Metadata = {
  title: "Workshops für KI im Mittelstand",
  description: `${countPhrase} zum Nachbauen: in der Claude-App mitbauen, ohne Code, ohne Anmeldung. Material zum Mitnehmen.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/workshops" },
  openGraph: {
    title: "Workshops für KI im Mittelstand",
    // Deliberately does not enumerate the downloads: they differ per
    // workshop, so any fixed list goes stale. The analyst workshop shipped
    // two, not the "Slides, Field Card und Übungs-Kit" this used to promise.
    description:
      "Selbstlern-Workshops zum Nachbauen: in der Claude-App mitbauen und das Material mitnehmen. Kostenlos, ohne Anmeldung.",
    url: "https://loehrning.ai/workshops",
    type: "website",
  },
};

export default function WorkshopsPage() {
  const jsonLd = {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Workshops",
        description:
          "Selbstlern-Workshops für KI im Mittelstand mit Download-Material zum Nachbauen.",
        inLanguage: "de-DE",
        url: `${SITE_URL}/workshops`,
        publisher: { "@id": ORG_ID },
        hasPart: WORKSHOPS.map((workshop) => ({
          "@type": "LearningResource",
          name: workshop.title,
          description: workshop.description,
          url: `${SITE_URL}/workshops/${workshop.slug}`,
          inLanguage: "de-DE",
          isAccessibleForFree: true,
          learningResourceType: "Workshop",
          educationalUse: "self-study",
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} id="workshops-jsonld" />
      <WorkshopsContent workshops={WORKSHOPS} />
    </>
  );
}
