/**
 * S07 time (REDESIGN-3 D4): by hand against the kit with Claude, on one working-day floor. Press 0: the days and the
 * yardstick of the papers. Press 1: the invented week by hand stands up, day by day. Press 2: on the Claude lane a hairline
 * at Monday opens into the four recorded steps, each as long as its recording took (stats.duration_ms, never typed; a missing
 * recording says so). Press 3: the one survey number there is on time spent on rules. A toggle folds one lane away
 * (lib/w05-scrub.js); it never moves the deck.
 */
import { esc, fill, spread } from "./motion.mjs";
import { durationText, icon, standUp, target, toggle } from "./scene.mjs";
import { modelName, recordedOn, turnOf } from "./take.mjs";
import { cap, head, src } from "./slides-intro.mjs";

/** The four turns the kit takes, in order: chain steps 1 to 3 and the register step 4. */
const TURNS = [["chain", "step1"], ["chain", "step2"], ["chain", "step3"], ["register", "step4"]];
/** World Bank Enterprise Surveys: percent of senior managers' time on regulation (TIME-44 2019, TIME-43 2023). */
const WB = [2.5, 5.8];

/** The recorded steps of this edition: [{ ms, text }] or null when a recording or a duration is missing. */
function recordedSteps(takes) {
  const steps = TURNS.map(([key, slot]) => {
    const rec = takes?.[key];
    if (!rec) return null;
    const turn = turnOf(rec, key, slot);
    const text = durationText(turn);
    return text ? { ms: turn.stats.duration_ms, text } : null;
  });
  return steps.every(Boolean) ? steps : null;
}

export function time(it, ctx, d, c, takes) {
  const t = c.s.time;
  const days = t.days.map((x, i) => `<b class="tf__d tf__d--${i}">${esc(x)}</b>`).join("");
  const axis = it({
    id: "ax", tag: "div", cls: "tf fig", zone: "ax", fx: "none",
    html: `${days}${it({ tag: "span", cls: "tf__ev tf__ev--letter", k: 0, win: ".1,.5", html: `${icon("letter")}${esc(t.letterAt)}` })}${it({ tag: "i", cls: "tf__yard", k: 0, fx: "line", win: ".2,.8" })}${it({ tag: "span", cls: "tf__yl", k: 0, win: ".6,1", text: t.yard })}${it({ tag: "span", cls: "tf__ev tf__ev--visit", k: 0, win: ".6,1", html: `${icon("inspector")}${esc(t.visitAt)}` })}`,
  });
  // the four days by hand: tall cards that stand up into the outlined slots of the entry, each with its large drawing
  const HAND_ICONS = ["letter", "binder-gap", "clock", "sheet-miss"];
  const ghosts = t.hand.map((_, i) => `<i class="tl-g tl-g--${i}" aria-hidden="true"></i>`).join("");
  const hand = ghosts + t.hand.map((x, i) => standUp(it, { cls: `tl-c tl-c--${i}`, k: 1, win: spread(i, 4, 0, 0.55), html: `${icon(HAND_ICONS[i], { cls: "dr" })}<span>${esc(x)}</span>` })).join("");
  const steps = recordedSteps(takes);
  let claude;
  if (steps) {
    const total = steps.reduce((s, x) => s + x.ms, 0);
    const rec = takes.chain;
    const totalText = durationText({ stats: { duration_ms: total } });
    const chip = fill(t.chip, { date: recordedOn(rec.recorded_at, d.lang), model: modelName(rec.model), total: totalText });
    let at = 0;
    const bars = steps
      .map((s, i) => {
        const left = (at / total) * 100;
        at += s.ms;
        const width = (s.ms / total) * 100;
        return `<span class="tc__s tc__s--${i}" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%">${it({ tag: "i", cls: "tc__f", k: 2, fx: "line", win: spread(i, 4, 0.35, 0.3), html: `<b>${i + 1}</b>` })}</span>`;
      })
      .join("");
    const legend = steps.map((s, i) => it({ tag: "span", cls: "tc__lg", k: 2, win: spread(i, 4, 0.55, 0.3), html: `<b>${i + 1}</b>${esc(t.steps[i])}<small>${esc(s.text)}</small>` })).join("");
    // the four minutes true to scale: 4 of the 480 minutes of a working day is under 1 % of the Monday column, a 3 px tick.
    // The steps themselves are drawn in a loupe beside it, outlined and labelled as enlarged (the scale is never implied).
    claude = [
      it({ tag: "i", cls: "tc__hair", k: 2, fx: "line", win: "0,.3" }),
      it({ tag: "span", cls: "tc__true", k: 2, win: ".1,.4", html: `<b>${esc(totalText)}</b>${esc(t.trueScale)}` }),
      it({ tag: "span", cls: "tc__wedge", k: 2, win: ".2,.5", html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><polygon points="0,2 100,0 100,100 0,24"/></svg>' }),
      it({ tag: "div", cls: "tc__loupe", k: 2, win: ".25,.55", html: `<p class="tc__lt">${esc(fill(t.loupe, { total: totalText }))}</p><div class="tc__bar">${bars}</div><p class="tc__legend">${legend}</p><p class="tc__chip">${esc(chip)}</p>` }),
    ].join("");
  } else {
    claude = `${it({ tag: "i", cls: "tc__hair", k: 2, fx: "line", win: "0,.3" })}${it({ tag: "span", cls: "tc__chip tc__chip--none", k: 2, win: ".5,1", text: t.none })}`;
  }
  const lanes = it({
    id: "lanes", tag: "div", cls: "tl2s fig", zone: "lanes", fx: "none", attrs: `role="img" aria-label="${esc(t.lanesAria)}" ${target("lanes", { state: "both" })}`,
    html: `<span class="tl2s__grid" aria-hidden="true"><i></i><i></i><i></i></span><div class="tln tln--hand"><b class="tln__l">${esc(t.lanes[0])}</b><div class="tln__days w05-s3d">${hand}</div></div><div class="tln tln--claude"><b class="tln__l">${esc(t.lanes[1])}</b><div class="tln__days tc">${claude}</div></div>`,
  });
  const wb = it({
    id: "wb", tag: "div", cls: "wb fig", zone: "wb", k: 3, fx: "none",
    html: `<p class="wb__sc">${esc(t.wbScale)}</p>` + WB.map((v, i) => `<p class="wb__r"><span class="wb__t">${it({ tag: "i", cls: "wb__f", k: 3, fx: "line", win: spread(i, 2, 0.1, 0.5), attrs: `style="--w:${v}"` })}</span><span class="wb__l">${esc(t.wb[i])}</span></p>`).join(""),
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
