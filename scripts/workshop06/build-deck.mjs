#!/usr/bin/env node
/**
 * Builds the deck of Workshop 06 ("Welches Angebot ist günstiger?") into
 * packages/website/public/workshops/angebote-mit-ki-vergleichen/slides.html.
 *
 * source/deck.html is rotfaden's single-file deck (example angebote-mit-ki-vergleichen, rotfaden commit b31ba1c),
 * byte for byte. This script applies the site's edits to it, nothing else; PORT-LOG.md lists them as items 6 to 9:
 *
 *   6  links to this site: the closing slide names the demo page and carries a QR code to it, the kit slide a
 *      QR code to the kit page, the footer drops the repository that is not public yet
 *   7  the site's frame: the loehrning.ai mark and author, "← Workshop" back to the workshop page, the toolbar
 *      always shown with "Neu starten R" and "Moderation P", like the decks of Workshops 01 to 05
 *   8  three presenter notes in the site's words: no boss ("an die Chefin weitergeben" becomes "so weitergeben")
 *      and no stamp (the "Ungeprüft" mark on scene 4 is "das Urteil", as its class "verdict" says)
 *   9  the objective, word for word as the workshop page and the demo state it, on the arc slide
 *
 * Every edit must match its anchor exactly once, so a new rotfaden build fails here instead of drifting.
 * The key handler stays untouched; scripts/workshops/sync-deck-keys.mjs pins the result by sha256.
 *
 * Usage (from the repository root):
 *   node scripts/workshop06/build-deck.mjs           writes slides.html
 *   node scripts/workshop06/build-deck.mjs --check   writes nothing and exits 1 when slides.html differs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../..");
const WEBSITE = path.join(REPO_ROOT, "packages/website");
export const SLUG = "angebote-mit-ki-vergleichen";
export const SOURCE = path.join(HERE, "source/deck.html");
export const OUT = path.join(WEBSITE, "public/workshops", SLUG, "slides.html");

const SITE = "https://loehrning.ai";
export const DEMO_URL = `${SITE}/demos/${SLUG}`;
export const KIT_URL = `${SITE}/workshops/${SLUG}/kit`;
const shown = (url) => url.replace(/^https:\/\//, "");

/** The objective as the workshop page and the demo print it (demo.json "promise"; a vitest holds them equal). */
export const OBJECTIVE =
  "Danach kannst du Angebote auf einer gemeinsamen Basis vergleichen: gleiche Menge, je Stück, bis ins Werk, mit Einmalkosten und Skonto.";

/** The Ö of the loehrning.ai mark (brand package v5.3): two squares over a square ring, in the accent. */
const MARK =
  '<svg class="oe" viewBox="18 8 60 80" aria-hidden="true" focusable="false"><rect x="26" y="8" width="16" height="16"/><rect x="54" y="8" width="16" height="16"/><path d="M18 34 H78 V88 H18 Z M36 52 H60 V70 H36 Z" fill-rule="evenodd"/></svg>';

const SITE_CSS = `<style id="site-edition">
/* loehrning.ai edition of the rotfaden deck: scripts/workshop06/build-deck.mjs, PORT-LOG items 6 and 7. */
.chrome-top .brand { text-transform: none; letter-spacing: .02em; }
.chrome-top .brand::before { display: none; }
.chrome-top .brand .oe { width: 18px; height: 24px; flex: none; fill: var(--accent); }
.site-back { position: fixed; top: 16px; left: 16px; z-index: 100; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 14px;
  font: 600 14px/1 var(--font-mono); letter-spacing: .02em; color: var(--fg); background: var(--bg); border: 2px solid var(--fg); border-radius: var(--radius); text-decoration: none; }
.site-back:hover { background: var(--fg); color: var(--bg); }
.site-back:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
body.aud .site-back, body.presenting .site-back, html.rf-export .site-back { display: none; }
#controls { opacity: 1; pointer-events: auto; }
#controls button { text-transform: none; letter-spacing: .02em; white-space: nowrap; }
#controls kbd { font: inherit; margin-left: 8px; padding: 1px 5px; border: 1.5px solid currentColor; }
body.presenting #controls { display: none; }
/* A phone held upright: the slide is small and the bars are wide, so the toolbar keeps back, next and reset. */
@media (max-width: 640px) { #controls [data-act="full"], #controls [data-act="present"], #controls .where { display: none; } #rotate { top: 72px; bottom: auto; } }
/* A phone held sideways has no bars: the toolbar comes back to rotfaden's own rule (a tap in the middle shows it). */
@media (max-height: 520px) {
  #controls { opacity: 0; pointer-events: none; }
  body.show-controls #controls, #controls:focus-within { opacity: 1; pointer-events: auto; }
  .site-back { padding: 0 13px; }
  .site-back-label { display: none; }
}
.site-cover-brand { display: inline-flex; align-items: center; gap: 16px; margin: 40px 0 0; font: 600 28px/1 var(--font-mono); letter-spacing: .02em; color: var(--fg); }
.site-cover-brand .oe { width: 24px; height: 32px; fill: var(--accent); }
.site-take { display: flex; align-items: center; gap: 40px; }
.site-take .src { white-space: normal; }
.site-qr { width: 200px; height: 200px; padding: 14px; flex: none; }
[data-n="12"] .file { min-height: 300px; }
</style>
`;

async function qrSvg(url) {
  const require = createRequire(path.join(WEBSITE, "package.json"));
  const QRCode = require("qrcode");
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#121212", light: "#ffffff" } });
  return svg.trim().replace(/<svg([^>]*)>/, `<svg$1 aria-hidden="true" focusable="false">`);
}

/** [PORT-LOG item, anchor in rotfaden's deck, replacement]. Each anchor occurs exactly once. */
async function edits() {
  const demoQr = await qrSvg(DEMO_URL);
  const kitQr = await qrSvg(KIT_URL);
  return [
    // 6: links to this site.
    [
      6,
      `    <p class="lead mt-32" data-step="1">Erst die Basis, dann der Vergleich.</p>
    <p class="src" data-step="1" data-literal>Kit und Demo: loehrning-ai.github.io/rotfaden/w06</p>`,
      `    <div class="site-take mt-32" data-step="1">
      <div class="qr site-qr" role="img" aria-label="QR-Code zu ${shown(DEMO_URL)}">${demoQr}</div>
      <div><p class="lead">Erst die Basis, dann der Vergleich.</p>
      <p class="src mt-16" data-literal>Kit und Demo: ${shown(DEMO_URL)}</p></div>
    </div>`,
    ],
    [
      6,
      `      <div class="file" data-step="3" data-focus="3"><span class="ear">ANSWERS.md</span><p class="what">Jede Zeile zum Prüfen, erst danach öffnen.</p></div>
    </div>`,
      `      <div class="file" data-step="3" data-focus="3"><span class="ear">ANSWERS.md</span><p class="what">Jede Zeile zum Prüfen, erst danach öffnen.</p></div>
    </div>
    <div class="site-take" data-step="0">
      <div class="qr site-qr" role="img" aria-label="QR-Code zu ${shown(KIT_URL)}">${kitQr}</div>
      <p class="src" data-literal>Das Kit: ${shown(KIT_URL)}</p>
    </div>`,
    ],
    [6, `<span>Erfundener Fall · github.com/loehrning-ai/rotfaden</span>`, `<span>Erfundener Fall · loehrning.ai</span>`],
    // 7: the site's frame.
    [7, `<title>Welches Angebot ist günstiger?</title>`, `<title>Welches Angebot ist günstiger? · Deck · loehrning.ai</title>`],
    [7, `</head>\n`, `${SITE_CSS}</head>\n`],
    [
      7,
      `<div id="viewport">`,
      `<a class="site-back" href="/workshops/${SLUG}" aria-label="Zurück zur Workshop-Seite"><span aria-hidden="true">←</span><span class="site-back-label">Workshop</span></a>\n<div id="viewport">`,
    ],
    [7, `<span class="brand">rotfaden</span>`, `<span class="brand">${MARK}loehrning.ai</span>`],
    [7, `"author": "rotfaden"`, `"author": "loehrning.ai"`],
    [
      7,
      `Eine Antwort, die du prüfen kannst.</p>\n`,
      `Eine Antwort, die du prüfen kannst.</p>\n        <p class="site-cover-brand" data-step="0" style="--order:3">${MARK}loehrning.ai</p>\n`,
    ],
    [7, `<p class="tag-sq" data-step="0" data-literal>Workshop · 90 Minuten · Erfundener Fall</p>`, `<p class="tag-sq" data-step="0" data-literal>Workshop 06 · 90 Minuten · Erfundener Fall</p>`],
    [
      7,
      `    '<button type="button" data-act="present">' + esc(UI.present) + '</button>' +
    '<button type="button" data-act="reset">' + esc(UI.reset) + '</button>' +`,
      `    '<button type="button" data-act="reset">' + esc(UI.reset) + '<kbd>R</kbd></button>' +
    '<button type="button" data-act="present">' + esc(UI.present) + '<kbd>P</kbd></button>' +`,
    ],
    [7, `present: 'Referentenansicht',`, `present: 'Moderation',`],
    [7, `reset: 'Neustart',`, `reset: 'Neu starten',`],
    // 8: no boss in the notes.
    [8, `Wer würde diese Antwort an die Chefin weitergeben?`, `Wer würde diese Antwort so weitergeben?`],
    [8, `"Der Stempel: ungeprüft"`, `"Das Urteil: ungeprüft"`],
    [8, `der Stempel bleibt.`, `das Urteil bleibt.`],
    // 9: the objective on the arc slide.
    [
      9,
      `    <p class="lead" data-step="2" data-focus="2">Du gehst mit <b>einer ausgefüllten Vergleichsbasis</b> für einen eigenen Einkauf und einem Prompt für deinen Claude.</p>`,
      `    <div data-step="2"><p class="lead" data-focus="2">${OBJECTIVE}</p>
    <p class="src mt-16">Du gehst mit einer ausgefüllten Vergleichsbasis für einen eigenen Einkauf und einem Prompt für deinen Claude.</p></div>`,
    ],
    [
      9,
      `"Du gehst mit einer ausgefüllten Vergleichsbasis für einen eigenen Einkauf und einem Prompt für deinen Claude. An keiner Station`,
      `"Das Lernziel, einmal laut: ${OBJECTIVE} Du gehst mit einer ausgefüllten Vergleichsbasis für einen eigenen Einkauf und einem Prompt für deinen Claude. An keiner Station`,
    ],
    [9, `"Was du mitnimmst: eine ausgefüllte Vergleichsbasis und einen Prompt"`, `"Das Lernziel, darunter was du mitnimmst: eine ausgefüllte Vergleichsbasis und einen Prompt"`],
  ];
}

export async function buildDeck(source = readFileSync(SOURCE, "utf8")) {
  let out = source;
  for (const [item, anchor, replacement] of await edits()) {
    const count = out.split(anchor).length - 1;
    if (count !== 1) throw new Error(`PORT-LOG item ${item}: the anchor occurs ${count} times, expected once:\n${anchor.slice(0, 160)}`);
    out = out.replace(anchor, () => replacement);
  }
  return out;
}

async function main() {
  const check = process.argv.includes("--check");
  const text = await buildDeck();
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  const rel = path.relative(REPO_ROOT, OUT);
  if (current === text) {
    console.log(`${rel} is up to date`);
    return;
  }
  if (check) {
    console.error(`${rel} differs from scripts/workshop06/source/deck.html plus build-deck.mjs; run node scripts/workshop06/build-deck.mjs`);
    process.exit(1);
  }
  writeFileSync(OUT, text);
  console.log(`wrote ${rel}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
