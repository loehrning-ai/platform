import type { Metadata } from "next";
import { UeberMichContent } from "./ueber-mich-content";
import { JsonLd, PERSON_ID, SITE_URL } from "@/lib/seo/json-ld";
import { SAME_AS_URLS, TIM_ENTITY } from "@/lib/seo/entity";

// Neutral biographic phrasing per TIM_ENTITY.noEndorsementNotice (public-content governance).
// Former employers appear as biography only, never as endorsements.
const PAGE_DESCRIPTION =
  "Tim Löhr betreibt loehrning.ai als freie deutsche KI-Lernplattform. Frühere Stationen bei Apple, Red Bull und Meta dienen der biografischen Einordnung.";
// Social title carries name + role so LinkedIn/X shares render a personal
// card instead of the generic site card. The root og-image is inherited.
const SOCIAL_TITLE = `${TIM_ENTITY.displayName}: ${TIM_ENTITY.role}`;

export const metadata: Metadata = {
  title: "Über Tim Löhr",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/ueber-mich" },
  robots: { index: true, follow: true },
  openGraph: {
    title: SOCIAL_TITLE,
    description: PAGE_DESCRIPTION,
    url: TIM_ENTITY.profileUrl,
    type: "profile",
    firstName: TIM_ENTITY.givenName,
    lastName: TIM_ENTITY.familyName,
    images: [
      {
        url: TIM_ENTITY.portraitUrl,
        width: 800,
        height: 800,
        alt: `Porträt von ${TIM_ENTITY.displayName}`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SOCIAL_TITLE,
    description: PAGE_DESCRIPTION,
    images: [TIM_ENTITY.portraitUrl],
  },
};

const UEBER_MICH_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Über Tim Löhr", item: `${SITE_URL}/ueber-mich` },
      ],
    },
    {
      "@type": "ProfilePage",
      mainEntity: { "@id": PERSON_ID },
      url: `${SITE_URL}/ueber-mich`,
      name: "Über Tim Löhr",
      inLanguage: "de-DE",
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: TIM_ENTITY.displayName,
      jobTitle: TIM_ENTITY.role,
      url: TIM_ENTITY.profileUrl,
      image: TIM_ENTITY.portraitUrl,
      sameAs: [...SAME_AS_URLS],
      knowsAbout: [...TIM_ENTITY.knowsAbout],
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "Friedrich-Alexander-Universität Erlangen-Nürnberg",
        url: "https://www.fau.de",
      },
    },
  ],
};

export default function UeberMichPage() {
  return (
    <>
      <JsonLd data={UEBER_MICH_GRAPH} id="ueber-mich-jsonld" />
      <UeberMichContent />
    </>
  );
}
