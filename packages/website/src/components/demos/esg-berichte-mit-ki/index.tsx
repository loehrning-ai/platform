/*
 * DEMO · /demos/esg-berichte-mit-ki (and /en/demos/esg-berichte-mit-ki)
 * Workshop 04 "Nachweisprobe" on the v4 shell (Glas), played in a depiction
 * of the Claude app. Server component: picks the locale pack and the app's
 * words, reads the kit's files from the shipped zip (kit-text.ts,
 * app-data.server.ts), the recorded runs and the take-home links, and renders
 * the client demo with them, so the browser bundle holds one language and the
 * page quotes exactly the files a visitor downloads. The hub miniature is
 * tile.tsx (+ tile-motion.ts); the contract of this folder is checked by
 * src/components/demos/demo-contract.test.ts.
 */
import type { DemoComponentProps } from "../demo-page";
import { APP_COPY } from "@/lib/demo-cases/esg-berichte-mit-ki/app-copy";
import { appData } from "@/lib/demo-cases/esg-berichte-mit-ki/app-data.server";
import { kitPrompts } from "@/lib/demo-cases/esg-berichte-mit-ki/app-recordings";
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
  // The kit's five prompts, exactly as they were sent for the recordings in the window.
  const prompts = kitPrompts(locale).map((prompt) => prompt.text);
  return {
    links: [{ key: "skill", href: `/skills/${SKILL}.zip`, download: `${SKILL}.zip` }, ...templates, { key: "kit", href: kit.href, download: kitName }],
    shown: kit.shown.map((path) => path.split("/").pop() ?? path),
    prompts,
  };
}

export default function EsgBerichteMitKiDemo({ locale }: DemoComponentProps) {
  return <Demo pack={COPY[locale]} kit={kitText(locale)} copy={APP_COPY[locale]} data={appData(locale)} files={filesFor(locale)} />;
}
