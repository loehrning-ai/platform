import type { JsonLdGraph } from "@/lib/seo/json-ld";
import { ORG_ID, PERSON_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import {
  ORGANIZATION_SAME_AS_URLS,
  PERSON_SAME_AS_URLS,
  SITE_ENTITY,
  SITE_LANGUAGES,
  TIM_ENTITY,
} from "@/lib/seo/entity";

// Site-wide JSON-LD graph rendered once in the root layout. It lives here so
// tests can verify the exact emitted graph without importing the font pipeline.
export const SITE_GRAPH: JsonLdGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "loehrning.ai",
      url: SITE_URL,
      // Dedicated square logo asset (512x512) per Google Organization logo
      // guidance; the 1200x630 OG image stays a social-preview asset only.
      logo: `${SITE_URL}/logo-square-512.png`,
      description: SITE_ENTITY.description,
      foundingDate: "2026",
      founder: { "@id": PERSON_ID },
      areaServed: ["DE", "AT", "CH"],
      knowsAbout: [
        "EU AI Act",
        "KI-Kompetenz",
        "Data Engineering",
        "AI-native Workflows",
      ],
      sameAs: [...ORGANIZATION_SAME_AS_URLS],
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: TIM_ENTITY.displayName,
      givenName: TIM_ENTITY.givenName,
      familyName: TIM_ENTITY.familyName,
      jobTitle: TIM_ENTITY.role,
      url: TIM_ENTITY.profileUrl,
      image: TIM_ENTITY.portraitUrl,
      alumniOf: [
        {
          "@type": "CollegeOrUniversity",
          name: "Friedrich-Alexander-Universität Erlangen-Nürnberg",
          url: "https://www.fau.de/",
        },
      ],
      knowsLanguage: ["de", "en"],
      knowsAbout: [...TIM_ENTITY.knowsAbout],
      sameAs: [...PERSON_SAME_AS_URLS],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: "loehrning.ai",
      inLanguage: [...SITE_LANGUAGES],
      publisher: { "@id": ORG_ID },
    },
  ],
};
