/**
 * The Workshop 05 deck as HTML on the shared deck engine (lib/scenes.js, lib/engine.css): 16 main slides and the appendix a1 to
 * a4. Every visible word comes from deck-copy.json (c.s.<slide>.<element>), every computed number from data.mjs (d.vars), every
 * take line from a recording (take.mjs). The German and the English edition share one structure and one set of numbers.
 *
 * Motion: an element with data-step="k" arrives on press k of its slide; the element language of motion.mjs writes the windows
 * (out first, then in), the zone and the single motion family of each press. Durations come from `ms` below. Paths are written
 * as "./lib/" and "./assets/"; build.mjs moves them one folder up for the English edition.
 *
 * Counting rule of the words test: an element is visible from its data-step to just before its data-out. Exempt classes: .qd
 * (quote), .qd-gloss (gloss), .prompt-body (kit prompt), .fig (figure cells and chrome), .out (recorded lines), .focus, .foot.
 */
import { build, esc } from "./motion.mjs";
import { foot } from "./slides-parts.mjs";
import { APPENDIX } from "./slides-appendix.mjs";
import * as intro from "./slides-intro.mjs";
import * as kitSlides from "./slides-kit.mjs";
import * as rules from "./slides-rules.mjs";
import { sectors } from "./slides-sectors.mjs";
import { why } from "./slides-why.mjs";
import { letter, we } from "./slides-case.mjs";
import { time } from "./slides-time.mjs";
import { watch } from "./slides-watch.mjs";
import { safety } from "./slides-safety.mjs";
import { close } from "./slides-close.mjs";
import { AGENDA_MINUTES } from "./data.mjs";

export { esc };
export const MAIN_TOTAL = 16;

const DEFAULT_MS = 1200;
/** Press lengths in ms per slide: presses after the first, and the overrides of the motion law (never above 1600). */
const press = (steps, over = {}) => Array.from({ length: steps + 1 }, (_, i) => over[i] ?? DEFAULT_MS);

/**
 * The slides in deck order (REDESIGN-3 D4): id, presses after the first, milliseconds per press, minutes, body. `look` adds
 * the class of another slide whose CSS a slide shares (none does now).
 */
export const SLIDES = [
  { id: "cover", steps: 0, ms: press(0, { 0: 1600 }), minutes: 1, body: intro.cover },
  { id: "today", steps: 3, ms: press(3, { 0: 1400, 1: 1400, 2: 1400, 3: 1400 }), minutes: 3, body: intro.today },
  { id: "why", steps: 7, ms: press(7, { 0: 1400, 5: 1600, 6: 1600 }), minutes: 5, body: why },
  { id: "sectors", steps: 4, ms: press(4, { 0: 1600, 1: 1600, 2: 1400 }), minutes: 4, body: sectors },
  { id: "we", steps: 3, ms: press(3, { 0: 1400 }), minutes: 4, body: we },
  { id: "letter", steps: 7, ms: press(7, { 0: 1600, 1: 1400, 6: 1400 }), minutes: 7, body: letter },
  { id: "time", steps: 3, ms: press(3, { 1: 1400, 2: 1400 }), minutes: 4, body: time },
  { id: "kit", steps: 3, ms: press(3), minutes: 5, body: kitSlides.kit },
  { id: "step1", steps: 2, ms: press(2, { 2: 1500 }), minutes: 6, body: kitSlides.step1, layout: "take" },
  { id: "step2", steps: 2, ms: press(2, { 2: 1500 }), minutes: 9, body: kitSlides.step2, layout: "take" },
  { id: "tests", steps: 4, ms: press(4), minutes: 5, body: kitSlides.tests },
  { id: "step3", steps: 3, ms: press(3, { 1: 1500 }), minutes: 8, body: kitSlides.step3, layout: "take" },
  { id: "register", steps: 7, ms: press(7, { 3: 1600 }), minutes: 11, body: rules.register, layout: "take" },
  { id: "watch", steps: 4, ms: press(4), minutes: 8, body: watch },
  { id: "safety", steps: 5, ms: press(5), minutes: 6, body: safety },
  { id: "close", steps: 2, ms: press(2), minutes: 4, body: close },
  ...["a1", "a2", "a3", "a4"].map((id) => ({ id, steps: 0, ms: [600], minutes: 0, kind: "appendix", appendix: APPENDIX[id] })),
];

const MAIN_MINUTES = SLIDES.filter((slide) => slide.kind !== "appendix").map((slide) => slide.minutes);
if (MAIN_MINUTES.join() !== AGENDA_MINUTES.join()) throw new Error(`slides.mjs minutes ${MAIN_MINUTES} differ from the agenda ${AGENDA_MINUTES}`);

/** Every section of one edition. data-label is the label of the first notes line ("NN · Label"). takes: loadTakes(lang). */
export function renderSlides(c, d, takes) {
  return SLIDES.map((slide, index) => {
    if (slide.ms.length !== slide.steps + 1) throw new Error(`${slide.id}: ${slide.ms.length} durations for ${slide.steps + 1} presses`);
    if (Math.max(...slide.ms) > 1600) throw new Error(`${slide.id}: a press longer than 1600 ms`);
    const kind = slide.kind ?? "main";
    const label = c.notes[index].split("\n")[0].replace(/^[^·]*·\s*/, "");
    let inner;
    if (slide.appendix) inner = slide.appendix(d, c, MAIN_TOTAL);
    else {
      const r = build((it, ctx) => slide.body(it, ctx, d, c, takes));
      const footer = foot(c, index + 1, MAIN_TOTAL);
      inner = r.raw ? r.raw(footer) : `<header class="hd${r.head ? "" : " hd--empty"}">${r.head}</header>\n<div class="stage">\n${r.stage}\n</div>\n${footer}`;
    }
    const layout = `${slide.look ? ` ${slide.look}` : ""}${slide.layout ? ` slide--${slide.layout}` : ""}`;
    return `<section class="slide ${slide.id}${layout}" id="${slide.id}" data-kind="${kind}" data-label="${esc(label)}" data-seconds="${slide.minutes * 60}" data-step-total="${slide.steps}" data-step-current="0" data-durations="${slide.ms.join(",")}">
${inner}
</section>`;
  });
}
