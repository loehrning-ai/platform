/**
 * S07 time (REDESIGN-3 D4, round 4): by hand against the kit with Claude, on one calendar of four working days. Two hero
 * numbers carry the slide: "4 days" (the invented week, labelled) and the recorded total (read from stats.duration_ms, never
 * typed). Press 0: the four days, the letter on Monday, the yardstick of the notice. Press 1: the week by hand rises into
 * the four day slots as flat cards, day by day (round 5, D2). Press 2: with Claude, a hairline at Monday morning is the true scale of the four recorded
 * steps; a loupe opens out of it and lays the same steps out large, each as long as its recording took (a missing
 * recording says so). Press 3: the one survey number there is on time spent on rules. A toggle folds one lane away
 * (lib/w05-scrub.js); it never moves the deck. No hour count is invented: the scale is the calendar of the case.
 */
import { esc, fill, spread } from "./motion.mjs";
import { durationText, icon, rise, target, toggle } from "./scene.mjs";
import { modelName, recordedOn, turnOf } from "./take.mjs";
import { cap, head, src } from "./slides-intro.mjs";

/** The four turns the kit takes, in order: chain steps 1 to 3 and the register step 4. */
const TURNS = [["chain", "step1"], ["chain", "step2"], ["chain", "step3"], ["register", "step4"]];
/** World Bank Enterprise Surveys: percent of senior managers' time on regulation (2019 and 2023 waves). */
const WB = [2.5, 5.8];
/** The large drawing of each day by hand. */
const HAND_ICONS = ["letter", "binder-gap", "clock", "sheet-miss"];

/** The recorded steps of this edition: [{ ms, text }] or null when a recording or a duration is missing. */
export function recordedSteps(takes) {
  const steps = TURNS.map(([key, slot]) => {
    const rec = takes?.[key];
    if (!rec) return null;
    const turn = turnOf(rec, key, slot);
    const text = durationText(turn);
    return text ? { ms: turn.stats.duration_ms, text } : null;
  });
  return steps.every(Boolean) ? steps : null;
}

/** The Claude lane: the true-scale hairline, the wedge of the loupe and the loupe with the four steps at their recorded length. */
/** The recorded total of the four steps as text ("4 min 15 s"), or null when a step is not recorded. */
export function recordedTotal(steps) {
  return steps ? durationText({ stats: { duration_ms: steps.reduce((s, x) => s + x.ms, 0) } }) : null;
}

function claudeLane(it, t, d, takes, steps) {
  if (!steps) return { hero: t.none, html: `${it({ tag: "i", cls: "tc__hair", k: 2, fx: "line", win: "0,.3" })}${it({ tag: "span", cls: "tc__chip tc__chip--none", k: 2, win: ".5,1", text: t.none })}` };
  const total = steps.reduce((s, x) => s + x.ms, 0);
  const totalText = recordedTotal(steps);
  const chip = fill(t.chip, { date: recordedOn(takes.chain.recorded_at, d.lang), model: modelName(takes.chain.model), total: totalText });
  let at = 0;
  const bars = steps
    .map((s, i) => {
      const left = (at / total) * 100;
      at += s.ms;
      const width = (s.ms / total) * 100;
      // the step's bar grows from its left end (the press's one moving idea); its label fades in once the bar is there
      return `<span class="tc__s" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%">${it({ tag: "i", cls: "tc__f", k: 2, fx: "line", win: spread(i, 4, 0.4, 0.3) })}${it({ tag: "b", cls: "tc__no", k: 2, win: spread(i, 4, 0.6, 0.3), text: String(i + 1) })}</span>`;
    })
    .join("");
  const legend = steps.map((s, i) => it({ tag: "span", cls: "tc__lg", k: 2, win: spread(i, 4, 0.6, 0.3), html: `<b>${i + 1}</b><em>${esc(t.steps[i])}</em><small>${esc(s.text)}</small>` })).join("");
  const html = [
    `<span class="tc__track" aria-hidden="true"></span>`,
    it({ tag: "i", cls: "tc__hair", k: 2, win: "0,.25" }),
    it({ tag: "span", cls: "tc__true", k: 2, win: ".1,.35", text: t.trueScale }),
    it({ tag: "span", cls: "tc__wedge", k: 2, win: ".2,.5", html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polygon points="0,0 1,0 100,100 0,100"/></svg>' }),
    it({ tag: "div", cls: "tc__loupe", k: 2, win: ".25,.55", html: `<p class="tc__lt">${esc(fill(t.loupe, { total: totalText }))}</p><div class="tc__bar">${bars}</div><p class="tc__legend">${legend}</p><p class="tc__chip">${esc(chip)}</p>` }),
  ].join("");
  return { hero: totalText, html };
}

export function time(it, ctx, d, c, takes) {
  const t = c.s.time;
  const days = t.days.map((x, i) => `<b class="tf__d tf__d--${i}">${esc(x)}</b>`).join("");
  const axis = it({
    id: "ax", tag: "div", cls: "tf fig", zone: "ax", fx: "none",
    html: `${days}${it({ tag: "span", cls: "tf__ev tf__ev--letter", k: 0, win: ".1,.5", html: `${icon("letter")}${esc(t.letterAt)}` })}${it({ tag: "i", cls: "tf__yard", k: 0, fx: "line", win: ".2,.8" })}${it({ tag: "span", cls: "tf__yl", k: 0, win: ".6,1", text: t.yard })}${it({ tag: "span", cls: "tf__ev tf__ev--visit", k: 0, win: ".6,1", html: `${icon("inspector")}${esc(t.visitAt)}` })}`,
  });
  // the four days by hand: flat cards that rise into the outlined slots of the entry, each with its large drawing
  const ghosts = t.hand.map((_, i) => `<i class="tl-g tl-g--${i}" aria-hidden="true"></i>`).join("");
  // the Monday letter, large in its slot on the entry (it fades: the yardstick is the press's one line); the card covers it on 1
  const monday = it({ tag: "span", cls: "tl-mon", k: 0, out: 1, win: ".1,.6", html: icon("letter", { cls: "dr" }) });
  const hand = ghosts + monday + t.hand.map((x, i) => rise(it, { cls: `tl-c tl-c--${i}`, k: 1, win: spread(i, 4, 0, 0.55), html: `${icon(HAND_ICONS[i], { cls: "dr" })}<span>${esc(x)}</span>` })).join("");
  const steps = recordedSteps(takes);
  const claude = claudeLane(it, t, d, takes, steps);
  // the two hero numbers, one per lane: the invented four days and the recorded total
  // on the entry both hero places hold a question mark: the slide asks before it answers
  const ask = (out) => it({ tag: "p", cls: "tln__n tln__q", k: 0, out, html: "<b>?</b>" });
  const heroHand = `<div class="tln__hero">${ask(1)}${it({ tag: "p", cls: "tln__n", k: 1, win: ".5,1", html: `<b>${esc(t.handN)}</b>` })}</div>`;
  // "4 min 15 s" breaks after the minutes, so the number stands as large as "4 days"; it is labelled as Claude's run time and
  // says once what it leaves out (the papers must already be in one folder; reading and checking stay with the firm)
  const heroClaude = `<div class="tln__hero">${ask(2)}${it({ tag: "p", cls: "tln__rl", k: 2, win: ".4,.8", text: t.runLabel })}${it({ tag: "p", cls: "tln__n", k: 2, win: ".45,.9", html: `<b>${esc(claude.hero).replace(/ min /, " min<br>")}</b>` })}${steps ? it({ tag: "p", cls: "tln__hon", k: 2, win: ".6,1", text: t.honest }) : ""}</div>`;
  const lanes = it({
    id: "lanes", tag: "div", cls: "tl2s fig", zone: "lanes", fx: "none", attrs: `role="img" aria-label="${esc(t.lanesAria)}" ${target("lanes", { state: "both" })}`,
    html: `<span class="tl2s__grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><div class="tln tln--hand"><div class="tln__l"><b>${esc(t.lanes[0])}</b>${heroHand}</div><div class="tln__days">${hand}</div></div><div class="tln tln--claude"><div class="tln__l"><b>${esc(t.lanes[1])}</b>${heroClaude}</div><div class="tln__days tc">${claude.html}</div></div>`,
  });
  const wb = it({
    id: "wb", tag: "div", cls: "wb fig", zone: "wb", k: 3, fx: "none",
    html: `<p class="wb__sc">${esc(t.wbScale)}</p>` + WB.map((v, i) => `<p class="wb__r"><span class="wb__l">${esc(t.wb[i])}</span><span class="wb__t">${it({ tag: "i", cls: "wb__f", k: 3, fx: "line", win: spread(i, 2, 0.1, 0.5), attrs: `style="--w:${v}"` })}</span></p>`).join(""),
  });
  const stage = [
    it({ id: "pill", tag: "p", cls: "pill pill--quiet", zone: "pill", text: t.pill }),
    head(it, t),
    toggle(it, { id: "tg", zone: "tg", k: 2, win: ".7,1", target: "lanes", values: ["hand", "both", "claude"], labels: t.tg, aria: t.tgAria }),
    axis,
    lanes,
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    cap(it, "c2", t.c2, 2, 3),
    cap(it, "c3", t.c3, 3, null),
    src(it, "t3", t.t3, 3, null),
    wb,
  ].join("\n");
  return { head: "", stage };
}
