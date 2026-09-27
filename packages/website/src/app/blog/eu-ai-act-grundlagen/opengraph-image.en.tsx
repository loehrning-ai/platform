import { EU_AI_ACT_OG_SIZE, euAiActOgAlt, renderEuAiActOgCard } from "./og-card";

// English card, re-exported by /en/blog/eu-ai-act-grundlagen through the
// generated mirror (scripts/generate-english-route-mirror.mjs).
export const alt = euAiActOgAlt("en");
export const size = EU_AI_ACT_OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderEuAiActOgCard("en");
}
