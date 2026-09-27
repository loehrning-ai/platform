import { JAV_OG_SIZE, javOgAlt, renderJavOgCard } from "./og-card";

// English card, re-exported by /en/blog/ki-in-der-ausbildung through the
// generated mirror (scripts/generate-english-route-mirror.mjs).
export const alt = javOgAlt("en");
export const size = JAV_OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderJavOgCard("en");
}
