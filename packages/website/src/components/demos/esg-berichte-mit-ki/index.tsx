/*
 * DEMO · /demos/esg-berichte-mit-ki (and /en/demos/esg-berichte-mit-ki)
 * Workshop 04 "Nachweisprobe" on the v4 shell (Glas). Server component: picks
 * the locale pack, reads the kit's own lines from the shipped zip
 * (kit-text.ts) and the take-home links from the registries, and renders the
 * client demo with them, so the browser bundle holds one language and the
 * page quotes exactly the files a visitor downloads. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { SCENE } from "@/lib/demo-cases/esg-berichte-mit-ki/claude-runs";
import { COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/copy";
import { kitText } from "@/lib/demo-cases/esg-berichte-mit-ki/kit-text";
import { takeHomeFor } from "@/lib/demo-takehome";
import { downloadPathFor, VORLAGEN } from "@/lib/vorlagen/registry";
import Demo from "./demo";
import type { TakeHomeFiles, TakeHomeKey } from "./takehome";

const SLUG = "esg-berichte-mit-ki";
const SKILL = "esg-nachweise";

const TEMPLATES: readonly (readonly [TakeHomeKey, string])[] = [
  ["card", "esg-nachweisprobe"],
  ["instructions", "esg-projektanweisungen"],
  ["register", "esg-nachweisregister"],
  ["mail", "esg-mail-fehlendes-dokument"],
  ["checklist", "esg-ordner-checkliste"],
];

function filesFor(locale: "de" | "en"): TakeHomeFiles {
  const kit = takeHomeFor(SLUG)?.kit[locale];
  if (!kit) throw new Error(`${SLUG}: no take-home kit for ${locale}`);
  const templates = TEMPLATES.map(([key, slug]) => {
    const entry = VORLAGEN.find((item) => item.slug === slug);
    if (!entry) throw new Error(`${SLUG}: ${slug} is not in the template registry`);
    return { key, href: downloadPathFor(slug, locale), download: entry.downloadNames[locale] };
  });
  const kitName = kit.href.split("/").pop() ?? kit.href;
  // The prompts exactly as they were sent for the recordings under the demo.
  const prompts = (SCENE?.prompts ?? [])
    .filter((prompt) => prompt.locale === locale)
    .map((prompt) => SCENE?.recordings.find((take) => take.id === prompt.withSkill[0])?.prompt ?? "")
    .filter(Boolean);
  return {
    links: [{ key: "skill", href: `/skills/${SKILL}.zip`, download: `${SKILL}.zip` }, ...templates, { key: "kit", href: kit.href, download: kitName }],
    shown: kit.shown.map((path) => path.split("/").pop() ?? path),
    prompts,
  };
}

export default function EsgBerichteMitKiDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} kit={kitText(locale)} files={filesFor(locale)} />;
}
