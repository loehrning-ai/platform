import type { Metadata } from "next";
import { WORKSHOPS } from "@/lib/workshops";
import { WorkshopsContent } from "./workshops-content";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Workshops für KI im Mittelstand",
  description:
    `${WORKSHOPS.length} Live-Workshop aus der kostenlosen KI-Lernplattform: gemeinsam einen KI-Analysten für einen echten Monatsbericht bauen, in der Claude-App, ohne Code.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/workshops" },
  openGraph: {
    title: "Workshops für KI im Mittelstand",
    description:
      "Live-Workshops mit Download-Material: Slides, Field Card und Übungs-Kit, kostenlos und ohne Anmeldung.",
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
          "Live-Workshops für KI im Mittelstand mit Download-Material zum Nachbauen.",
        inLanguage: "de-DE",
        url: `${SITE_URL}/workshops`,
        publisher: { "@id": ORG_ID },
        hasPart: WORKSHOPS.map((workshop) => ({
          "@type": "Event",
          name: workshop.title,
          description: workshop.description,
          url: `${SITE_URL}/workshops/${workshop.slug}`,
          inLanguage: "de-DE",
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          isAccessibleForFree: true,
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
