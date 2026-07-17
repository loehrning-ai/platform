import type { Metadata } from "next";
import { JsonLd, SITE_URL } from "@/lib/seo/json-ld";
import { StandortbestimmungClient } from "./standortbestimmung-client";

const TITLE = "KI-Check: Wo stehst du?";
const DESCRIPTION =
  "Zehn kurze Fragen zeigen dir über fünf Kompetenzfelder, wie sicher du mit KI umgehst und welcher Kurs dich am weitesten bringt. Kein Login, keine Datenspeicherung.";

export const metadata: Metadata = {
  title: `${TITLE} | KI-Kompetenzweg`,
  description: DESCRIPTION,
  robots: { index: true, follow: true },
  alternates: { canonical: "/standortbestimmung" },
  openGraph: {
    title: `${TITLE} | KI-Kompetenzweg`,
    description: DESCRIPTION,
    url: "/standortbestimmung",
    type: "website",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "KI-Check",
  url: `${SITE_URL}/standortbestimmung`,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "de-DE",
  isAccessibleForFree: true,
  description: DESCRIPTION,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
} as const;

export default function StandortbestimmungPage() {
  return (
    <>
      <JsonLd data={JSON_LD} id="ki-check-jsonld" />
      <StandortbestimmungClient />
    </>
  );
}
