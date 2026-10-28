#!/usr/bin/env node
/**
 * Builds the Workshop 04 deck in two editions from one source:
 *   packages/website/public/workshops/esg-berichte-mit-ki/slides.html      (German)
 *   packages/website/public/workshops/esg-berichte-mit-ki/en/slides.html   (English)
 *
 * Words and markup: slides-a.mjs, slides-b.mjs (one function per slide), parts.mjs (helpers and the
 * bound figures), notes.mjs (presenter notes). The five prompts and the objective are read from the
 * published kit zips, so the deck can never drift from the kit. QR codes come from qrSvg.
 * Runtime, synced from scripts/workshops/deck-engine: lib/engine.css, scenes.js, globe.js, geo.js,
 * deck-stage.js, icons.svg. Slide styles: lib/deck.css (hand-written).
 *
 * Usage (from the repository root):
 *   node scripts/workshop04/deck-src/build.mjs           writes both editions
 *   node scripts/workshop04/deck-src/build.mjs --check   writes nothing, exits 1 when a page differs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { qrSvg } from "../export-esg-passport.mjs";
import { readKitArchive } from "../kit-archive.mjs";
import { KITS, zipPath } from "../kit-v3.mjs";
import { NOTES } from "./notes.mjs";
import { context } from "./parts.mjs";
import { cover, host, kitSlide, news, requests, review, rule, today, winery } from "./slides-a.mjs";
import { capAppendix, caseAppendix, late, measured, project, register, sources, step1, step2, step3, takeHome } from "./slides-b.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
export const SLUG = "esg-berichte-mit-ki";
export const OUT_DIR = path.join(REPO, "packages/website/public/workshops", SLUG);
export const EDITIONS = { de: "slides.html", en: "en/slides.html" };
export const MAIN_MINUTES = 60;

/** Copy the deck must never show; the shared copy lint covers the rest. */
const BANNED = [/[\u2012-\u2015]/, /\b(countdown|urgent|dringend|freitag|friday|game changer|seamless|nahtlos|magisch|revolution)\b/i, /\b(stamp|stempel)/i, /logo/i, /backdrop-filter/];

const KIT_META = {
  de: { project: "Crvena Zemja Nachweise", invoice: "rechnung-EL-25-09.png", objectiveLabel: "**Lernziel:**" },
  en: { project: "Crvena Zemja Evidence", invoice: "invoice-EL-25-09.png", objectiveLabel: "**Learning objective:**" },
};

/** Prompts (code block under "## Schritt N" / "## Step N") and the objective, from the kit zip. */
export function readKit(lang) {
  const entries = new Map(readKitArchive(readFileSync(zipPath(lang)), { prefix: `${KITS[lang].name}/` }));
  const start = entries.get(KITS[lang].start)?.toString("utf8");
  if (!start) throw new Error(`${lang}: kit lacks ${KITS[lang].start}`);
  const prompts = new Map();
  for (const part of start.split(/\n(?=## )/)) {
    const step = /^## (?:Schritt|Step) (\d)/.exec(part)?.[1];
    const block = /```\n([\s\S]*?)```/.exec(part)?.[1];
    if (step && block) prompts.set(Number(step), block.trim());
  }
  for (const n of [1, 2, 3, 4, 5]) if (!prompts.has(n)) throw new Error(`${lang}: kit lacks prompt ${n}`);
  const meta = KIT_META[lang];
  const at = start.indexOf(meta.objectiveLabel);
  if (at < 0) throw new Error(`${lang}: kit names no objective`);
  const objectiveText = start.slice(at + meta.objectiveLabel.length).split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim();
  const invoicePath = [...entries.keys()].find((name) => name.endsWith(meta.invoice));
  if (!invoicePath) throw new Error(`${lang}: kit lacks ${meta.invoice}`);
  return { prompts, objective: objectiveText, project: meta.project, zip: `${KITS[lang].name}.zip`, invoice: meta.invoice };
}

const HEAD = {
  de: {
    title: "ESG-Berichte mit KI · Workshop 04 · loehrning.ai",
    description: "Deck zu Workshop 04: Jede ESG-Antwort, die die Firma verlässt, trägt ihren Nachweis. Ein erfundenes Weingut, 13 Dateien, drei Anfragen.",
    alternate: '<link rel="alternate" hreflang="en" href="./en/slides.html" />',
    skip: "Zum Deck springen",
    back: { href: "/workshops/esg-berichte-mit-ki", label: "Zurück zur Workshop-Seite" },
    main: "Workshop 04, ESG-Berichte mit KI",
    rotate: { href: "/demos/esg-berichte-mit-ki", label: "die Demo ansehen" },
    deckId: SLUG,
  },
  en: {
    title: "ESG reports with AI · Workshop 04 · loehrning.ai",
    description: "Deck for Workshop 04: every ESG answer that leaves the company carries its evidence. One invented winery, 13 files, three requests.",
    alternate: '<link rel="alternate" hreflang="de" href="../slides.html" />',
    skip: "Skip to the deck",
    back: { href: "/en/workshops/esg-berichte-mit-ki", label: "Back to the workshop page" },
    main: "Workshop 04, ESG reports with AI",
    rotate: { href: "/en/demos/esg-berichte-mit-ki", label: "open the demo" },
    deckId: `${SLUG}:en`,
  },
};

const SLIDES = [cover, host, news, winery, requests, today, rule, kitSlide, review, project, step1, step2, step3, register, late, measured, takeHome, sources, capAppendix, caseAppendix];

/** "1 min 30 s" → 90 */
function seconds(time) {
  const min = /(\d+) min/.exec(time)?.[1] ?? 0;
  const sec = /(\d+) s/.exec(time)?.[1] ?? 0;
  return Number(min) * 60 + Number(sec);
}

/** Notes are as many as slides, and the planned times of the main slides sum to the hour. */
function checkNotes(lang, sections) {
  const notes = NOTES[lang];
  if (notes.length !== sections.length) throw new Error(`${lang}: ${notes.length} notes for ${sections.length} slides`);
  const total = notes.reduce((sum, n) => sum + seconds(/^Time: (.*)$/m.exec(n)?.[1] ?? ""), 0);
  if (total !== MAIN_MINUTES * 60) throw new Error(`${lang}: notes plan ${total} s, not ${MAIN_MINUTES} min`);
}

export async function render(lang) {
  const c = context(lang, readKit(lang));
  const site = lang === "de" ? "https://loehrning.ai" : "https://loehrning.ai/en";
  const qr = { kit: await qrSvg(`${site}/workshops/${SLUG}`), demo: await qrSvg(`${site}/demos/${SLUG}`) };
  const sections = SLIDES.map((slide) => (slide === kitSlide ? slide(c, qr.kit) : slide === takeHome ? slide(c, qr.demo) : slide(c)));
  checkNotes(lang, sections);
  const h = HEAD[lang];
  const lib = c.lib;
  const root = lang === "de" ? "." : "..";
  const notesJson = JSON.stringify(NOTES[lang]).replace(/</g, "\\u003c");
  const html = `<!doctype html>
<html lang="${lang}" data-theme="light" data-deck-id="${h.deckId}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#F3F0E9" />
<title>${h.title}</title>
<meta name="description" content="${h.description}" />
${h.alternate}
<link rel="icon" href="${root}/assets/favicon.svg" />
<link rel="stylesheet" href="${lib}/tokens.css" />
<link rel="stylesheet" href="${lib}/engine.css" />
<link rel="stylesheet" href="${lib}/deck.css" />
<script src="${lib}/deck-keys.js"></script>
<script src="${lib}/deck-stage.js"></script>
</head>
<body>
<a class="skip-link" href="#deck">${h.skip}</a>
<a class="deck-back" href="${h.back.href}" aria-label="${h.back.label}">← Workshop</a>
<main aria-label="${h.main}">
<deck-stage id="deck" data-rotate-href="${h.rotate.href}" data-rotate-label="${h.rotate.label}">
${sections.join("\n")}
</deck-stage>
</main>
<script type="application/json" id="speaker-notes">${notesJson}</script>
<script src="${lib}/scenes.js"></script>
<script src="${lib}/geo.js"></script>
<script src="${lib}/globe.js"></script>
</body>
</html>
`;
  for (const pattern of BANNED) {
    const hit = pattern.exec(html.replace(/<svg role="img"[\s\S]*?<\/svg>/g, ""));
    if (hit) throw new Error(`${lang}: deck shows banned copy "${hit[0]}"`);
  }
  if (Buffer.byteLength(html) > 160_000) throw new Error(`${lang}: ${Buffer.byteLength(html)} bytes, budget 160 000`);
  return html;
}

async function main() {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [lang, name] of Object.entries(EDITIONS)) {
    const out = path.join(OUT_DIR, name);
    const html = await render(lang);
    let current = "";
    try {
      current = readFileSync(out, "utf8");
    } catch {
      current = "";
    }
    if (check) {
      if (current !== html) {
        console.error(`${name} differs from its source; run node scripts/workshop04/deck-src/build.mjs`);
        stale += 1;
      }
    } else if (current !== html) {
      writeFileSync(out, html);
      console.log(`wrote ${name} (${Buffer.byteLength(html)} bytes)`);
    } else console.log(`${name} unchanged`);
  }
  if (stale) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
