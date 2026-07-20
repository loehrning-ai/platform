import type { ReactNode } from "react";
import { ENTITY_IDS, SITE_ORIGIN } from "@/lib/seo/entity";

export type JsonLdGraph = {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
};

export type JsonLdSingle = Record<string, unknown> & { "@context"?: string; "@type": string };

function serializeJsonLd(data: JsonLdGraph | JsonLdSingle): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function JsonLd({ data, id }: { data: JsonLdGraph | JsonLdSingle; id?: string }): ReactNode {
  const json = serializeJsonLd(data);
  return (
    <script
      type="application/ld+json"
      id={id}
      // Escape HTML-significant characters so future editorial contributions
      // cannot terminate the script element even though the payload is JSON.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export const SITE_URL = SITE_ORIGIN;
export const ORG_ID = ENTITY_IDS.organization;
export const PERSON_ID = ENTITY_IDS.person;
export const WEBSITE_ID = ENTITY_IDS.website;
