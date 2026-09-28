import type { ImageResponse } from "next/og";
import { getPostNumberLabel } from "@/lib/blog-metadata";
import { OG_SIZE } from "@/lib/plakat/og";
import { blogStandMonth, renderBlogOgCard } from "../_components/blog-og-card";

// The share card for Nº 01, one layout per locale, in the /blog scene (IDEA,
// blog-og-card.tsx). opengraph-image.tsx serves German; opengraph-image.en.tsx
// is the sibling the /en mirror re-exports (scripts/generate-english-route-
// mirror.mjs). Both run on Node: the fonts and the halftone are read from the
// project root.

const SLUG = "eu-ai-act-grundlagen";

const CARD_COPY = {
  de: {
    alt: "Der EU AI Act: was er bedeutet, wenn du keine Juristin bist. Zeitplan, AI Omnibus und deine Rechte, Stand Juli 2026.",
    title: "Der EU AI\u00a0Act.",
    subtitle: "Was er bedeutet, wenn du keine Juristin bist.",
    stand: (month: string) => `Stand ${month}`,
  },
  en: {
    alt: "The EU AI Act: what it means if you are not a lawyer. Timeline, AI Omnibus and your rights, as of July 2026.",
    title: "The EU AI\u00a0Act.",
    subtitle: "What it means if you are not a lawyer.",
    stand: (month: string) => `As of ${month}`,
  },
} as const;

export type EuAiActCardLocale = keyof typeof CARD_COPY;

export function euAiActOgAlt(locale: EuAiActCardLocale): string {
  return CARD_COPY[locale].alt;
}

export const EU_AI_ACT_OG_SIZE = { ...OG_SIZE };

export function renderEuAiActOgCard(locale: EuAiActCardLocale): Promise<ImageResponse> {
  const copy = CARD_COPY[locale];
  return renderBlogOgCard({
    caps: `Blog · Nº ${getPostNumberLabel(SLUG)}`,
    title: copy.title,
    subtitle: copy.subtitle,
    trailing: copy.stand(blogStandMonth(SLUG, locale)),
  });
}
