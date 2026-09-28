import { JAV_OG_SIZE, javOgAlt, renderJavOgCard } from "./og-card";

// German card. The English one is opengraph-image.en.tsx (see og-card.tsx).
export const alt = javOgAlt("de");
export const size = JAV_OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderJavOgCard("de");
}
