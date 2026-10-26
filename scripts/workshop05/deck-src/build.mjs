#!/usr/bin/env node
/**
 * Builds the Workshop 05 deck in two editions from one copy source:
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/slides.html      (German)
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/en/slides.html   (English)
 * plus presenter.html (one presenter view for both editions; the deck opens it with ?deck=<edition>).
 * The English edition sits under en/ like every English deck, with its own deck id "<slug>:en", so
 * its storage keys and presenter channel never mix with the German one.
 *
 * Words: deck-copy.json (de, en; the notes are the presenter notes, Time / Say / Students / Cue / Remember).
 * Facts: data.mjs, read from the kit sources (scripts/workshop05/kit, kit-de). Slides: slides.mjs.
 * Runtime, hand-written in the deck folder: lib/deck.css, lib/deck-stage.js, lib/scenes.js,
 * lib/presenter.{js,css}, lib/deck-keys.js (a synced copy of scripts/workshops/deck-keys.js).
 *
 * Usage (from the repository root):
 *   node scripts/workshop05/deck-src/build.mjs           writes the three pages
 *   node scripts/workshop05/deck-src/build.mjs --check   writes nothing, exits 1 when a page differs
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLAUDE_UI } from "../../../packages/website/src/lib/claude-ui.ts";
import { deckData } from "./data.mjs";
import { SLIDES, esc, renderSlides } from "./slides.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../..");
export const SLUG = "audit-vorbereitung-mit-ki";
export const OUT_DIR = path.join(REPO, "packages/website/public/workshops", SLUG);
export const EDITIONS = { de: "slides.html", en: "en/slides.html" };
/** From an edition to the deck folder root: "./" for slides.html, "../" for en/slides.html. */
const ROOT = { de: "./", en: "../" };
export const DECK_IDS = { de: SLUG, en: `${SLUG}:en` };
export const MAIN_SECONDS = 5400;
export const MAIN_SLIDES = 11;

/** Words a deck must never show (the shared copy lint covers the rest; this is the deck's own floor). */
const BANNED = [
  /[\u2012-\u2015]/,
  /\b(by friday|bis freitag|your boss|dein chef|urgent|dringend|countdown|game changer|seamless|revolution)\b/i,
  /\b(stamp|stempel)/i,
];

const DEMO = { de: "/demos/audit-vorbereitung-mit-ki", en: "/en/demos/audit-vorbereitung-mit-ki" };
const WORKSHOP = { de: "/workshops/audit-vorbereitung-mit-ki", en: "/en/workshops/audit-vorbereitung-mit-ki" };

function copyFor(lang) {
  const all = JSON.parse(readFileSync(path.join(HERE, "deck-copy.json"), "utf8"));
  const c = all[lang];
  const ui = CLAUDE_UI[lang];
  const suffix = lang === "en" ? "-en" : "";
  return {
    ...c,
    codeExec: ui.app.steps[0],
    ui2: {
      adminNote: ui.app.adminNote,
      plans: ui.project.plans,
      source: lang === "de" ? "Claude Help Center 12512180 und 9517075, gelesen am 25.10.2026" : "Claude Help Center 12512180 and 9517075, read on 25 Oct 2026",
    },
    qr: {
      kit: `qr-kit${suffix}.svg`,
      probe: `qr-probe${suffix}.svg`,
      own: `qr-own${suffix}.svg`,
      skill: `qr-skill${suffix}.svg`,
    },
  };
}

function chrome(c, lang) {
  const ui = c.ui;
  return `<a class="deck-back" href="${WORKSHOP[lang]}" aria-label="${esc(c.backLabel)}"><span aria-hidden="true">←</span> ${esc(c.back)}</a>
<div class="toolbar glass" role="toolbar" aria-label="${esc(ui.toolbar)}">
  <button type="button" class="tb" data-action="prev" aria-label="${esc(ui.prev)}"><span aria-hidden="true">←</span></button>
  <span class="tb-pos" data-pos aria-live="polite"></span>
  <button type="button" class="tb" data-action="next" aria-label="${esc(ui.next)}"><span aria-hidden="true">→</span></button>
  <button type="button" class="tb tb-text" data-action="reset">${esc(ui.reset)} <kbd>R</kbd></button>
  <button type="button" class="tb tb-text tb-presenter" data-action="presenter">${esc(ui.presenter)} <kbd>P</kbd></button>
</div>
<aside class="rotate glass" data-rotate hidden>
  <p>${esc(ui.rotate)}</p>
  <a href="${DEMO[lang]}">${esc(ui.rotateLink)}</a>
  <button type="button" class="tb" data-rotate-close aria-label="${esc(ui.close)}"><span aria-hidden="true">×</span></button>
</aside>`;
}

export function buildEdition(lang, d = deckData(lang)) {
  const c = copyFor(lang);
  if (c.notes.length !== SLIDES.length) throw new Error(`${lang}: ${c.notes.length} notes for ${SLIDES.length} slides`);
  const sections = renderSlides(c, d);
  const runtime = {
    lang,
    edition: EDITIONS[lang],
    other: EDITIONS[lang === "de" ? "en" : "de"],
    presenter: `${ROOT[lang]}presenter.html`,
    ui: c.ui,
    status: c.status,
  };
  const html = `<!doctype html>
<html lang="${lang}" data-deck-id="${DECK_IDS[lang]}" data-edition="${EDITIONS[lang]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#F3F0E9" />
<title>${esc(c.htmlTitle)}</title>
<meta name="description" content="${esc(c.description)}" />
<link rel="icon" href="./assets/favicon.svg" />
<link rel="alternate" hreflang="${lang === "de" ? "en" : "de"}" href="${ROOT[lang]}${runtime.other}" />
<link rel="stylesheet" href="./lib/deck.css" />
<script src="./lib/deck-keys.js"></script>
<script src="./lib/scenes.js" defer></script>
<script src="./lib/deck-stage.js" defer></script>
</head>
<body>
<script type="application/json" id="deck-ui">${JSON.stringify(runtime).replace(/</g, "\\u003c")}</script>
<script type="application/json" id="speaker-notes">${JSON.stringify(c.notes, null, 0).replace(/</g, "\\u003c")}</script>
${chrome(c, lang)}
<deck-stage>
${sections.join("\n")}
</deck-stage>
</body>
</html>
`;
  check(lang, html, sections);
  // slides.mjs and the head point at the deck folder as "./"; the English edition sits one folder down.
  return lang === "de" ? html : html.replace(/(src|href)="\.\/(assets|lib)\//g, `$1="${ROOT[lang]}$2/`);
}

function check(lang, html, sections) {
  const attr = (s, name) => new RegExp(`${name}="([^"]*)"`).exec(s.slice(0, s.indexOf(">")))?.[1];
  const mains = sections.filter((s) => attr(s, "data-kind") === "main");
  const seconds = mains.reduce((sum, s) => sum + Number(attr(s, "data-seconds")), 0);
  if (mains.length !== MAIN_SLIDES || seconds !== MAIN_SECONDS) {
    throw new Error(`${lang}: ${mains.length} main slides, ${seconds} s (want ${MAIN_SLIDES} and ${MAIN_SECONDS})`);
  }
  const text = html.replace(/<script type="application\/json" id="deck-ui">[\s\S]*?<\/script>/, "");
  for (const pattern of BANNED) {
    const hit = pattern.exec(text);
    if (hit) throw new Error(`${lang}: banned ${JSON.stringify(hit[0])} near ${JSON.stringify(text.slice(Math.max(0, hit.index - 60), hit.index + 40))}`);
  }
  for (const needle of ["/Users/", "/private/", "mavengence", "facilitator/", "CLAUDE.md"]) {
    if (html.includes(needle)) throw new Error(`${lang}: internal string ${needle}`);
  }
  const denylist = (process.env.PUBLIC_NAME_DENYLIST ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const name of denylist) if (html.toLowerCase().includes(name)) throw new Error(`${lang}: a denylisted name is in the deck`);
}

function presenterPage() {
  return readFileSync(path.join(HERE, "presenter.html"), "utf8");
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const outputs = [
    ...Object.entries(EDITIONS).map(([lang, file]) => [file, buildEdition(lang)]),
    ["presenter.html", presenterPage()],
  ];
  const drift = [];
  for (const [file, html] of outputs) {
    const target = path.join(OUT_DIR, file);
    const current = existsSync(target) ? readFileSync(target, "utf8") : null;
    if (current === html) continue;
    if (checkOnly) drift.push(file);
    else {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, html);
      console.log(`wrote ${path.relative(REPO, target)} (${Buffer.byteLength(html)} bytes)`);
    }
  }
  // The English edition moved to en/slides.html (next.config.ts redirects the old path).
  const retired = path.join(OUT_DIR, "slides.en.html");
  if (existsSync(retired)) {
    if (checkOnly) drift.push("slides.en.html (retired)");
    else rmSync(retired);
  }
  if (drift.length) {
    console.error(`deck drift, run node scripts/workshop05/deck-src/build.mjs: ${drift.join(", ")}`);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
