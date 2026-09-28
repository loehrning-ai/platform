import type { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";
import { OG_SIZE } from "@/lib/plakat/og";
import { blogStandMonth, renderBlogOgCard } from "../_components/blog-og-card";

// The share card for Nº 02, one layout per locale, in the /blog scene (IDEA,
// blog-og-card.tsx). opengraph-image.tsx serves German; opengraph-image.en.tsx
// is the sibling the /en mirror re-exports (scripts/generate-english-route-
// mirror.mjs), so /en/blog/ki-in-der-ausbildung shares an English card.

const SLUG = "ki-in-der-ausbildung";
function standLabel(locale: JavCardLocale): string {
  return blogStandMonth(SLUG, locale);
}

const CARD_COPY = {
  de: {
    title: "KI in der Ausbildung.",
    subtitle: "Fragen für JAV und Betriebsrat, jede mit Rechtsgrundlage.",
    alt: (stand: string) =>
      `KI in der Ausbildung: Fragen für JAV und Betriebsrat, mit Rechtsgrundlagen, Stand ${stand}.`,
    stand: (stand: string) => `Stand ${stand}`,
  },
  en: {
    title: "AI in apprenticeships.",
    subtitle: "Questions for youth reps and works councils, each with its legal basis.",
    alt: (stand: string) =>
      `AI in apprenticeships: questions for youth representatives and works councils, with legal bases, as of ${stand}.`,
    stand: (stand: string) => `As of ${stand}`,
  },
} as const;

export type JavCardLocale = keyof typeof CARD_COPY;

export function javOgAlt(locale: JavCardLocale): string {
  return CARD_COPY[locale].alt(standLabel(locale));
}

export const JAV_OG_SIZE = { ...OG_SIZE };

export function renderJavOgCard(locale: JavCardLocale): Promise<ImageResponse> {
  const copy = CARD_COPY[locale];
  return renderBlogOgCard({
    caps: `Blog · Nº ${getPostNumberLabel(SLUG)}`,
    title: copy.title,
    subtitle: copy.subtitle,
    trailing: copy.stand(standLabel(locale)),
  });
}
