import { EU_AI_ACT_OG_SIZE, euAiActOgAlt, renderEuAiActOgCard } from "./og-card";

// German card. The English one is opengraph-image.en.tsx (see og-card.tsx).
export const alt = euAiActOgAlt("de");
export const size = EU_AI_ACT_OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderEuAiActOgCard("de");
}
