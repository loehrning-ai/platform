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
 *      always shown with "Neu starten R" and "Moderation P", like the decks of Workshops 01 to 05; a light cover
 *      (no dark slide, paper behind the stage) and the host on slide 2, which takes one of the cover's two minutes
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
/* No black ground: paper behind the stage too. The host card is the same in every workshop deck. */
:root { --letterbox: #F3F0E9; }
.slide[data-id="host"] .host-photo { position: absolute; left: 0; top: 0; bottom: 0; width: 760px; margin: 0; overflow: hidden; background: var(--card); }
.slide[data-id="host"] .host-photo img { display: block; width: calc(100% + 56px); height: 100%; margin-left: -56px; object-fit: cover; object-position: 50% 35%; }
.slide[data-id="host"] .host-copy { position: absolute; left: 856px; right: var(--mx); top: 0; bottom: 0; display: flex; flex-direction: column; justify-content: center; }
.host-kicker { margin: 0; font: 700 28px/1 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent-text); }
.host-name { margin: 24px 0 0; font-size: 150px; line-height: .92; letter-spacing: var(--track-hero); font-weight: var(--weight-h); }
.host-msc { margin: 40px 0 0; display: flex; align-items: baseline; gap: 22px; font-size: 32px; line-height: 1.3; }
.host-msc b { font-weight: 700; }
.host-msc span { font: 400 28px/1.3 var(--font-mono); color: var(--muted); }
.host-career { position: relative; margin-top: 84px; height: 230px; }
.host-track, .host-fill { position: absolute; left: 0; width: 668px; display: block; }
.host-track { top: 13px; height: 2px; background: var(--line); }
.host-fill { top: 11px; height: 6px; background: var(--fg); transform-origin: 0 50%; }
.host-stops { position: relative; display: flex; margin: 0; padding: 0; list-style: none; }
.host-stops li { width: 320px; }
.host-dot { display: block; width: 28px; height: 28px; background: var(--fg); }
.host-own .host-dot { background: var(--accent); }
.host-stops b { display: block; margin-top: 26px; font-size: 44px; line-height: 1; letter-spacing: var(--track-h); font-weight: 700; }
.host-own b { color: var(--accent-text); }
.host-stops span { display: block; margin-top: 14px; font: 400 28px/1 var(--font-mono); color: var(--muted); white-space: nowrap; }
.host-now { position: absolute; left: 640px; top: 166px; width: 240px; height: 16px; margin: 0; border: 3px solid var(--accent); border-top: 0; }
.host-now span { position: absolute; left: 0; top: 26px; font: 700 28px/1 var(--font-mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent-text); }
.host-line { margin: 40px 0 0; max-width: 900px; font-size: 34px; line-height: 1.3; color: var(--muted); }
</style>
`;

/** Slide 2, the host: the same short card as in the other workshop decks (photo, name, degree, three career stops). */
const HOST_SLIDE = `<!-- 02 host (loehrning.ai edition) -->
<section data-n="host" data-id="host" class="slide" data-title="Gastgeber" data-minutes="1" data-route="" data-no-chrome>
  <figure class="host-photo"><img src="./assets/tim-loehr.jpg" width="1100" height="1100" alt="Porträt von Tim Löhr"></figure>
  <div class="host-copy">
    <p class="host-kicker" data-step="0">Gastgeber</p>
    <h2 class="host-name" data-step="0" style="--order:1">Tim Löhr</h2>
    <p class="host-msc" data-step="0" style="--order:2"><b>M.Sc. Informatik</b><span>FAU Erlangen-Nürnberg</span></p>
    <div class="host-career">
      <i class="host-track" aria-hidden="true"></i><i class="host-fill" aria-hidden="true" data-step="0" data-motion="grow" style="--order:2"></i>
      <ol class="host-stops">
        <li data-step="0" data-motion="stamp" style="--order:2"><i class="host-dot" aria-hidden="true"></i><b>Apple</b><span>Data Scientist</span></li>
        <li data-step="0" data-motion="stamp" style="--order:3"><i class="host-dot" aria-hidden="true"></i><b>Red Bull</b><span>Data Scientist</span></li>
        <li class="host-own" data-step="0" data-motion="stamp" style="--order:4"><i class="host-dot" aria-hidden="true"></i><b>loehrning.ai</b><span>Gründer</span></li>
      </ol>
      <p class="host-now" data-step="0" style="--order:4"><span>jetzt</span></p>
    </div>
    <p class="host-line" data-step="0" style="--order:4">Jede Firma, jede Person und jede Datei in diesem Workshop ist erfunden.</p>
  </div>
</section>
`;

/** The host's presenter cue, in the shape of rotfaden's deck-meta cues. */
const HOST_CUE =
  '{"purpose": "Kurz sagen, wer durch den Workshop führt, und dass alles erfunden ist.", "action": "listen", ' +
  '"say": ["Ich bin Tim Löhr. Ich war Data Scientist bei Apple und Red Bull und baue mit loehrning.ai Workshops wie diesen. Alles, was ihr heute seht, ist erfunden."], ' +
  '"sayAt": {"0": [0]}, "revealOrder": ["Foto, Name, Studium und die Linie von Apple bis loehrning.ai"], ' +
  '"cut": "Nur den Namen sagen und weiter.", "remember": "Unter einer Minute bleiben, dann direkt zum Fall.", ' +
  '"ifItGoesWrong": "Wenn das Foto nicht lädt: Name und Linie reichen.", "clock": {"start": "1:00", "end": "2:00"}}, ';

/** deck-meta's slide list from n = 2 on moves one down for the host: one [anchor, replacement] per slide id. */
function hostRenumbering(source) {
  const meta = JSON.parse(/<script type="application\/json" id="deck-meta">([\s\S]*?)<\/script>/.exec(source)[1]);
  return meta.slides
    .filter((slide) => slide.n >= 2)
    .map((slide) => [7, `{"n": ${slide.n}, "id": "${slide.id}"`, `{"n": ${slide.n + 1}, "id": "${slide.id}"`]);
}

async function qrSvg(url) {
  const require = createRequire(path.join(WEBSITE, "package.json"));
  const QRCode = require("qrcode");
  const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#121212", light: "#ffffff" } });
  return svg.trim().replace(/<svg([^>]*)>/, `<svg$1 aria-hidden="true" focusable="false">`);
}

/** [PORT-LOG item, anchor in rotfaden's deck, replacement]. Each anchor occurs exactly once. */
async function edits(source) {
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
    // 7: a light cover, and the host on slide 2 with one of the cover's two minutes.
    [7, `class="slide dark" data-title="Welches Angebot ist günstiger?" data-minutes="2" data-no-chrome>`, `class="slide" data-title="Welches Angebot ist günstiger?" data-minutes="1" data-no-chrome>`],
    [7, `<!-- 02 02-case -->\n`, `${HOST_SLIDE}<!-- 02 02-case -->\n`],
    [7, `"clock": {"start": "0:00", "end": "2:00"}`, `"clock": {"start": "0:00", "end": "1:00"}`],
    [7, `Nie streichen. Unter zwei Minuten bleiben; den Weg zeigt die übernächste Szene.`, `Nie streichen. Unter einer Minute bleiben; den Weg zeigt die Szene nach dem Fall.`],
    [7, `{"purpose": "Den Fall zeigen`, `${HOST_CUE}{"purpose": "Den Fall zeigen`],
    [7, `"clock": [[0.0, 2.0], [2.0, 4.0],`, `"clock": [[0.0, 1.0], [1.0, 2.0], [2.0, 4.0],`],
    ...hostRenumbering(source),
    [7, `{"n": 1, "id": "cover", "kind": "main", "title": "Welches Angebot ist günstiger?", "minutes": 2.0, "steps": 2}, `,
      `{"n": 1, "id": "cover", "kind": "main", "title": "Welches Angebot ist günstiger?", "minutes": 1.0, "steps": 2}, {"n": 2, "id": "host", "kind": "main", "title": "Gastgeber", "minutes": 1.0, "steps": 0}, `],
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
  for (const [item, anchor, replacement] of await edits(source)) {
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
