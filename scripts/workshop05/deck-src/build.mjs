#!/usr/bin/env node
/**
 * Builds the Workshop 05 deck in two editions from one copy source, on the shared deck engine:
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/slides.html         (German)
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/en/slides.html      (English)
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/presenter.html      (German presenter view)
 *   packages/website/public/workshops/audit-vorbereitung-mit-ki/en/presenter.html   (English presenter view)
 * Each edition has its own deck id ("<slug>", "<slug>:en"), so storage keys and the presenter
 * channel never mix. P in the deck opens ./presenter.html next to the page.
 *
 * Words: deck-copy.json (de, en; the notes are the presenter notes, Time / Say / Students / Cue / Remember).
 * Facts: data.mjs, read from the kit sources (scripts/workshop05/kit, kit-de). Slides: slides.mjs.
 * Runtime: lib/deck-stage.js, lib/scenes.js, lib/globe.js, lib/geo.js, lib/engine.css, lib/icons.svg and
 * lib/presenter.* are copies of scripts/workshops/deck-engine (sync-deck-engine.mjs); lib/deck-keys.js
 * is a copy of scripts/workshops/deck-keys.js; lib/deck.css and lib/fonts.css are this deck's own.
 *
 * Usage (from the repository root):
 *   node scripts/workshop05/deck-src/build.mjs           writes the four pages
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
const PRESENTERS = { de: "presenter.html", en: "en/presenter.html" };
/** From an edition to the deck folder root: "./" for slides.html, "../" for en/slides.html. */
const ROOT = { de: "./", en: "../" };
export const DECK_IDS = { de: SLUG, en: `${SLUG}:en` };
export const MAIN_SECONDS = 5400;
export const MAIN_SLIDES = 16;

/** Words a deck must never show (the shared copy lint covers the rest; this is the deck's own floor). */
const BANNED = [
  /[\u2012-\u2015]/,
  /\b(by friday|bis freitag|freitag|friday|your boss|dein chef|chef|urgent|dringend|countdown|deadline|game changer|seamless|nahtlos|magisch|revolution\w*|konform)\b/i,
  /\b(stamp|stempel)/i,
  /(Richtig!|Super\.|überrasch|surprise|\bfuer\b|\bPunkte\b)/i,
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
    ui2: { adminNote: ui.app.adminNote, plans: ui.project.plans },
    qr: { kit: `qr-kit${suffix}.svg`, probe: `qr-probe${suffix}.svg`, skill: `qr-skill${suffix}.svg` },
  };
}

/** One edition's page; written with "./" paths, moved one folder up for the English edition. */
export function buildEdition(lang, d = deckData(lang)) {
  const c = copyFor(lang);
  if (c.notes.length !== SLIDES.length) throw new Error(`${lang}: ${c.notes.length} notes for ${SLIDES.length} slides`);
  const sections = renderSlides(c, d);
  const other = lang === "de" ? "en" : "de";
  const html = `<!doctype html>
<html lang="${lang}" data-theme="light" data-deck-id="${DECK_IDS[lang]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#F3F0E9" />
<title>${esc(c.htmlTitle)}</title>
<meta name="description" content="${esc(c.description)}" />
<link rel="alternate" hreflang="${other}" href="${lang === "de" ? "./en/slides.html" : "../slides.html"}" />
<link rel="icon" href="./assets/favicon.svg" />
<link rel="stylesheet" href="./lib/fonts.css" />
<link rel="stylesheet" href="./lib/engine.css" />
<link rel="stylesheet" href="./lib/deck.css" />
<script src="./lib/deck-keys.js"></script>
<script src="./lib/deck-stage.js"></script>
</head>
<body>
<a class="skip-link" href="#deck">${esc(c.skip)}</a>
<a class="deck-back" href="${WORKSHOP[lang]}" aria-label="${esc(c.backLabel)}">← ${esc(c.back)}</a>
<main aria-label="${esc(c.mainLabel)}">
<deck-stage id="deck" data-rotate-href="${DEMO[lang]}" data-rotate-label="${esc(c.rotateLabel)}">
${sections.join("\n")}
</deck-stage>
</main>
<script type="application/json" id="speaker-notes">${JSON.stringify(c.notes).replace(/</g, "\\u003c")}</script>
<script src="./lib/scenes.js"></script>
<script src="./lib/geo.js"></script>
<script src="./lib/globe.js"></script>
</body>
</html>
`;
  check(lang, html, sections);
  return lang === "de" ? html : html.replace(/(src|href)="\.\/(assets|lib)\//g, `$1="${ROOT[lang]}$2/`);
}

const PRESENTER_COPY = {
  de: {
    title: "Referentenansicht · Audit-Vorbereitung mit KI · loehrning.ai", back: "Zurück zur Workshop-Seite", pos: "Folie 00 / 00",
    conn: "Nicht verbunden: Deck öffnen und P drücken", wait: "Warte auf das Deck", side: "Zeit und nächste Folie", slide: "Diese Folie",
    session: "Sitzung", next: "Nächste Folie", prev: "← Zurück", forward: "Weiter →", reset: "Von vorn (r)", timers: "Zeit neu starten",
    jump: "Springen zu", keys: "→ ← Schritt. r oder Shift+R: Anfang. Esc: Anhang verlassen. Im Deck öffnet P diese Ansicht.",
  },
  en: {
    title: "Presenter view · Audit preparation with AI · loehrning.ai", back: "Back to the workshop page", pos: "Slide 00 / 00",
    conn: "Not connected: open the deck and press P", wait: "Waiting for the deck", side: "Time and next slide", slide: "This slide",
    session: "Session", next: "Next slide", prev: "← Back", forward: "Next →", reset: "From the start (r)", timers: "Restart timers",
    jump: "Jump to", keys: "→ ← step. r or Shift+R: start. Esc: leave the appendix. In the deck, P opens this view.",
  },
};

/** The presenter view next to each edition; lib/presenter.js reads ./slides.html for the notes. */
function presenterPage(lang) {
  const p = PRESENTER_COPY[lang];
  const up = ROOT[lang];
  return `<!doctype html>
<html lang="${lang}" data-deck-id="${DECK_IDS[lang]}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="theme-color" content="#f3f0e9" />
<meta name="robots" content="noindex" />
<title>${esc(p.title)}</title>
<link rel="icon" href="${up}assets/favicon.svg" />
<link rel="stylesheet" href="${up}lib/fonts.css" />
<link rel="stylesheet" href="${up}lib/presenter.css" />
<script src="${up}lib/presenter.js" defer></script>
</head>
<body data-slug="${DECK_IDS[lang]}">
<a class="deck-back" href="${WORKSHOP[lang]}" aria-label="${esc(p.back)}">← Workshop</a>
<header class="pv-head">
  <span id="pv-pos" class="pv-pos">${esc(p.pos)}</span>
  <span id="pv-label" class="pv-label"></span>
  <span class="pv-sp"></span>
  <span id="pv-step" class="pv-step"></span>
  <span id="pv-conn" class="pv-conn" data-state="waiting" role="status" aria-live="polite">${esc(p.conn)}</span>
</header>
<main class="pv-grid" id="main">
  <section class="pv-notes" aria-labelledby="pv-title">
    <h1 id="pv-title">${esc(p.wait)}</h1>
    <p id="pv-plan" class="pv-time"></p>
    <div id="pv-note" class="pv-note"></div>
  </section>
  <aside class="pv-side" aria-label="${esc(p.side)}">
    <div class="pv-box"><h2>${esc(p.slide)}</h2><div id="pv-tslide" class="pv-big">0:00</div><div id="pv-tplan" class="pv-small"></div></div>
    <div class="pv-box"><h2>${esc(p.session)}</h2><div id="pv-tsess" class="pv-big">0:00</div><div id="pv-tpace" class="pv-small"></div></div>
    <div class="pv-box pv-next" id="pv-next">
      <h2>${esc(p.next)}</h2>
      <b id="pv-nlab"></b>
      <p id="pv-ntime"></p>
      <div class="pv-frame"><iframe id="pv-next-frame" src="./slides.html?preview=1" title="${esc(p.next)}" tabindex="-1" aria-hidden="true"></iframe></div>
    </div>
  </aside>
</main>
<footer class="pv-foot">
  <button type="button" id="pv-prev" class="pv-btn">${esc(p.prev)}</button>
  <button type="button" id="pv-forward" class="pv-btn">${esc(p.forward)}</button>
  <button type="button" id="pv-reset" class="pv-btn">${esc(p.reset)}</button>
  <button type="button" id="pv-return" class="pv-btn" hidden></button>
  <button type="button" id="pv-timer-reset" class="pv-btn">${esc(p.timers)}</button>
  <label class="pv-jump" for="pv-select"><span>${esc(p.jump)}</span><select id="pv-select"></select></label>
  <span class="pv-keys">${esc(p.keys)}</span>
</footer>
</body>
</html>
`;
}

function check(lang, html, sections) {
  const attr = (s, name) => new RegExp(`${name}="([^"]*)"`).exec(s.slice(0, s.indexOf(">")))?.[1];
  const mains = sections.filter((s) => attr(s, "data-kind") === "main");
  const seconds = mains.reduce((sum, s) => sum + Number(attr(s, "data-seconds")), 0);
  if (mains.length !== MAIN_SLIDES || seconds !== MAIN_SECONDS) {
    throw new Error(`${lang}: ${mains.length} main slides, ${seconds} s (want ${MAIN_SLIDES} and ${MAIN_SECONDS})`);
  }
  // The notes are the presenter's, so they may name what the deck must not show; check the slides only.
  const text = html.replace(/<script type="application\/json" id="speaker-notes">[\s\S]*?<\/script>/, "");
  for (const pattern of BANNED) {
    const hit = pattern.exec(text);
    if (hit) throw new Error(`${lang}: banned ${JSON.stringify(hit[0])} near ${JSON.stringify(text.slice(Math.max(0, hit.index - 60), hit.index + 40))}`);
  }
  if (/[\u2012-\u2015]/.test(html)) throw new Error(`${lang}: a dash in the notes`);
  for (const needle of ["/Users/", "/private/", "mavengence", "facilitator/", "CLAUDE.md"]) {
    if (html.toLowerCase().includes(needle.toLowerCase())) throw new Error(`${lang}: internal string ${needle}`);
  }
  const denylist = (process.env.PUBLIC_NAME_DENYLIST ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const name of denylist) if (html.toLowerCase().includes(name)) throw new Error(`${lang}: a denylisted name is in the deck`);
}

/** The file's text, or null when it does not exist: one read, no exists-then-read race. */
function readIfPresent(file) {
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const outputs = [
    ...Object.entries(EDITIONS).map(([lang, file]) => [file, buildEdition(lang)]),
    ...Object.entries(PRESENTERS).map(([lang, file]) => [file, presenterPage(lang)]),
  ];
  const drift = [];
  for (const [file, html] of outputs) {
    const target = path.join(OUT_DIR, file);
    const current = readIfPresent(target);
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
