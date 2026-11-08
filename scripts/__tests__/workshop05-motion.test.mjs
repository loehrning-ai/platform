/**
 * Workshop 05 deck, motion law (M1 to M8), read from the BUILT pages (both editions, and the take slides built from synthetic
 * recordings too). One moving idea per press, out first and then in, only the engine's own effects, no typing, no loops, no
 * timers, press lengths of at most 1600 ms, takes that come in line by line, and a cover that has no press at all.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildEdition } from "../workshop05/deck-src/build.mjs";
import { deckData } from "../workshop05/deck-src/data.mjs";
import { fixtureTakes } from "../workshop05/deck-src/fixture-takes.mjs";
import { LANGS, readPage, slidesOf } from "../workshop05/deck-src/deck-html.mjs";

const LIB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../packages/website/public/workshops/audit-vorbereitung-mit-ki/lib");
const read = (name) => readFileSync(path.join(LIB, name), "utf8");

const ALLOWED_FX = ["fade", "none", "line", "draw", "pop", "move"];
/** Effects that count as the one moving idea of a press (fade and a plain none are not ideas). */
const FAMILY_FX = ["line", "draw", "pop", "move"];

const pages = Object.fromEntries(
  LANGS.flatMap((lang) => {
    const d = deckData(lang);
    return [[`${lang}`, readPage(lang)], [`${lang}+takes`, buildEdition(lang, d, fixtureTakes(lang, { d }))], [`${lang}+differs`, buildEdition(lang, d, fixtureTakes(lang, { d, differs: true }))]];
  }),
);

/** Every element with a data-step, with its slide, its stepped ancestors and its attributes. */
function stepped(slide) {
  const out = [];
  const walk = (node, ancestors) => {
    if (!node.tag) return;
    const isStep = node.attrs?.["data-step"] !== undefined;
    if (isStep) out.push({ node, a: node.attrs, top: !ancestors.some((n) => n.attrs?.["data-step"] !== undefined) });
    for (const child of node.children ?? []) walk(child, [...ancestors, node]);
  };
  for (const child of slide.children ?? []) walk(child, []);
  return out;
}
const num = (value) => Number(value);
const window = (value) => String(value).split(",").map(Number);
/** The motion family an entering element contributes. */
function family(a) {
  if (a["data-count"] !== undefined) return "count";
  if (a["data-fill"] !== undefined) return "fill";
  if (a.class?.split(/\s+/).includes("w05-sweep")) return "count"; // the scan band runs with the numbers it belongs to
  return FAMILY_FX.includes(a["data-fx"]) ? a["data-fx"] : null;
}

const mainOf = (html) => slidesOf(html).filter((s) => s.attrs["data-kind"] === "main");

for (const [key, html] of Object.entries(pages)) {
  test(`${key} M1: at most one moving idea per press (line, draw, pop, move, count or fill; the rest fades)`, () => {
    for (const slide of slidesOf(html)) {
      const byPress = new Map();
      for (const { a } of stepped(slide)) {
        const f = family(a);
        if (f === null) continue;
        const press = num(a["data-step"]);
        byPress.set(press, new Set([...(byPress.get(press) ?? []), f]));
      }
      for (const [press, set] of byPress) assert.ok(set.size <= 1, `${key} ${slide.attrs.id} press ${press}: ${[...set].join(", ")}`);
    }
  });

  test(`${key} M2: out first, then in: leavers carry data-out-win 0,.25; entrants into the zone of a leaver start at .3 or later; one zone shows one element`, () => {
    for (const slide of mainOf(html)) {
      const els = stepped(slide);
      const total = num(slide.attrs["data-step-total"]);
      if (slide.attrs.id !== "cover") assert.ok(els.length > 3, `${key} ${slide.attrs.id}: the slide has stepped elements`);
      for (const { a } of els) if (a["data-out"] !== undefined) assert.equal(a["data-out-win"], "0,.25", `${key} ${slide.attrs.id}: ${a["data-id"]} leaves at ${a["data-out"]}`);
      for (const { a, top } of els.filter((e) => e.top)) assert.ok(a["data-zone"], `${key} ${slide.attrs.id}: ${a["data-id"] ?? a.class} has a zone`);
      for (let press = 1; press <= total; press += 1) {
        const leavers = els.filter((e) => e.top && e.a["data-out"] !== undefined && num(e.a["data-out"]) === press);
        const zonesLeaving = new Set(leavers.map((e) => e.a["data-zone"]));
        for (const { a } of els.filter((e) => e.top && num(e.a["data-step"]) === press && zonesLeaving.has(e.a["data-zone"]))) {
          assert.ok(a["data-win"] && window(a["data-win"])[0] >= 0.3, `${key} ${slide.attrs.id} press ${press}: ${a["data-id"]} enters into a leaving zone at ${a["data-win"]}`);
        }
      }
      // after each press, no two elements of one zone are on screen
      for (let press = 0; press <= total; press += 1) {
        const shown = els.filter((e) => e.top && num(e.a["data-step"]) <= press && (e.a["data-out"] === undefined || num(e.a["data-out"]) > press));
        const seen = new Map();
        for (const { a } of shown) {
          const zone = a["data-zone"];
          assert.ok(!seen.has(zone), `${key} ${slide.attrs.id} press ${press}: zone ${zone} holds ${seen.get(zone)} and ${a["data-id"]}`);
          seen.set(zone, a["data-id"]);
        }
      }
    }
  });

  test(`${key} M3 and M4: only the allowed effects, no typing, no clip reveal`, () => {
    for (const m of html.matchAll(/data-fx="([^"]*)"/g)) assert.ok(ALLOWED_FX.includes(m[1]), `${key}: data-fx ${m[1]}`);
    assert.doesNotMatch(html, /data-fx="type"|clip-path/);
  });

  test(`${key} M5: press lengths of at most 1600 ms, one per press, and no inline duration`, () => {
    for (const slide of slidesOf(html)) {
      const durations = slide.attrs["data-durations"].split(",").map(Number);
      assert.equal(durations.length, num(slide.attrs["data-step-total"]) + 1, `${key} ${slide.attrs.id}: one duration per press plus the entry`);
      for (const ms of durations) assert.ok(ms > 0 && ms <= 1600, `${key} ${slide.attrs.id}: ${ms} ms`);
    }
    assert.doesNotMatch(html, /style="[^"]*(?:transition|animation)[^"]*"/);
    assert.doesNotMatch(html, /\sdata-(?:duration|delay)=/);
  });

  test(`${key} M5: a count-up ends inside its press window`, () => {
    for (const slide of slidesOf(html)) {
      for (const { a } of stepped(slide).filter((e) => e.a["data-count"] !== undefined)) {
        const [from, to] = window(a["data-win"] ?? "0,1");
        assert.ok(from >= 0 && to <= 1 && to > from, `${key} ${slide.attrs.id}: ${a["data-win"]}`);
        const parts = a["data-count"].split(",");
        assert.equal(parts[0], "0", "a count starts at 0");
      }
    }
  });

  test(`${key} M7: the lines of a take come in 30 to 40 ms apart, at most 16 items, 700 ms from the first to the last`, () => {
    for (const slide of mainOf(html)) {
      const answers = [];
      const walk = (n) => {
        if (!n.tag) return;
        if ((n.attrs?.class ?? "").split(/\s+/).includes("cw-answer")) answers.push(n);
        (n.children ?? []).forEach(walk);
      };
      walk(slide);
      for (const answer of answers) {
        const press = num(answer.attrs["data-step"]);
        const ms = num(slide.attrs["data-durations"].split(",")[press]);
        const rows = [];
        const collect = (n) => {
          if (!n.tag) return;
          if (n !== answer && n.attrs?.["data-take"] !== undefined && n.tag !== "table") rows.push(n);
          (n.children ?? []).forEach(collect);
        };
        collect(answer);
        const starts = [...new Set(rows.map((n) => n.attrs["data-win"].split(",")[0]))].map(Number);
        assert.ok(starts.length <= 16, `${key} ${slide.attrs.id}: ${starts.length} items`);
        starts.slice(1).forEach((v, i) => assert.ok((v - starts[i]) * ms >= 29 && (v - starts[i]) * ms <= 41, `${key} ${slide.attrs.id}: gap ${((v - starts[i]) * ms).toFixed(1)} ms`));
        if (starts.length) assert.ok((starts.at(-1) - starts[0]) * ms <= 700);
      }
    }
  });

  test(`${key} M8: the cover has no press, no data-fx and a static globe; its entry is CSS only`, () => {
    const cover = slidesOf(html)[0];
    assert.equal(cover.attrs.id, "cover");
    assert.equal(cover.attrs["data-step-total"], "0");
    const raw = html.slice(html.indexOf('id="cover"'), html.indexOf("</section>", html.indexOf('id="cover"')));
    assert.doesNotMatch(raw, /data-fx=|data-step=/);
    assert.match(raw, /data-speed="0"/);
    assert.match(raw, /data-globe-steps="0:macedonia@1\.5"/);
  });
}

test("M6: no loop and no timer in deck.css, w05-fx.css or w05-tally.js", () => {
  for (const name of ["deck.css", "w05-fx.css"]) {
    assert.doesNotMatch(read(name), /\binfinite\b|animation-iteration-count/, name);
  }
  assert.doesNotMatch(read("w05-tally.js"), /setInterval|setTimeout|requestAnimationFrame|\bloop\b/);
});

test("M8: the cover entry in w05-fx.css is a 300 ms rise of 8 px, the subtitle 150 ms later, none in preview or reduced motion", () => {
  const css = read("w05-fx.css");
  assert.match(css, /@keyframes w05-rise\{from\{opacity:0;transform:translateY\(8px\)\}to\{opacity:1;transform:none\}\}/);
  assert.match(css, /\.cover__title\{animation:w05-rise 300ms /);
  assert.match(css, /\.cover__sub\{animation:w05-rise 300ms [^;]* 150ms both\}/);
  assert.match(css, /html\[data-deck-preview\] \.cover__title,html\[data-deck-preview\] \.cover__sub\{animation:none\}/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{[^}]*\.cover__title,\.cover__sub\{animation:none\}/s);
});

test("M10: the ghost bars of the close slide are horizontal line elements, one per option, replacing nothing static", () => {
  for (const lang of LANGS) {
    const close = slidesOf(pages[lang]).find((s) => s.attrs.id === "close");
    const bars = stepped(close).filter((e) => (e.a.class ?? "").split(/\s+/).includes("gb__bar"));
    assert.equal(bars.length, 4);
    for (const { a } of bars) assert.equal(a["data-fx"], "line");
    assert.doesNotMatch(read("deck.css") + read("w05-fx.css"), /w05-ghost/);
  }
});
