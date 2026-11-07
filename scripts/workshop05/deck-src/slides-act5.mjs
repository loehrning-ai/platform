/**
 * Act 5, the line and the visit (S18 ladder, S19 judge, S20 visit, S21 after). The data ladder votes on rung labels;
 * the four gates are real buttons driven by lib/w05-gates.js (anchor #w05-gates-anchor).
 */
import { makeParts } from "./slides-parts.mjs";

export default function makeAct5(H) {
  const { s, stagger, ico, ico5, arcStyle, hd, foot, esc } = H;
  const P = makeParts(H);
  const { split, pollOpt } = P;

  /* ── S18 ladder ──────────────────────────────────────────────────── */
  const GATES = ["subscription", "contract", "security", "transfer"];

  function ladder(d, c) {
    const x = c.s.ladder;
    const rungs = split(x.rungs)
      .map((label, i) => `<button class="poll__opt ld__rung ld__rung--${i + 1}" type="button" data-poll="ladder" data-value="${i}"${s(0, { fx: "pop", win: stagger(i, 4, 0.4, 0, 1), out: 3 })}><span>${esc(label)}</span><span data-poll-n${s(0, { fx: "fade", out: 2 })}>0</span></button>`)
      .join("");
    const gates = split(x.gates)
      .map((label, i) => `<button class="w05-gate" type="button" data-gate="${GATES[i]}" aria-pressed="false"><i class="w05-gate__lock" aria-hidden="true"></i><span>${esc(label)}</span></button>`)
      .join("");
    return `${hd(x.question, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage ld__stage">
<div class="ld__left">
<div class="ld__rungs">${rungs}</div>
<i class="ld__block" role="img" aria-label="${esc(split(x.rungs)[2])}"${s(1, { fx: "move", win: "0,1", out: 3 })} style="--dx:0px;--dy:420px">${ico("table")}</i>
<p class="ld__caution"${s(1, { fx: "fade", win: ".3,1", out: 2 })}>${esc(x.caution)}</p>
<a class="ld__a2" href="#a2" aria-label="${esc(x.accounts)}"${s(0, { fx: "fade", win: ".5,1", out: 3 })}>${ico("book")}</a>
<div class="w05-cloud ld__cloud" data-gate-cloud${s(3, { fx: "fade", win: "0,.6", keep: false })}></div>
<p class="ld__light"${s(3, { fx: "fade", win: ".3,1", out: 4 })}>${esc(x.light)}</p>
</div>
<div class="ld__right">
<div id="w05-gates-anchor" class="w05-gates ld__gates"${s(2, { fx: "none", win: "0,1", out: 5 })}>${gates}</div>
<p class="ld__abroad"${s(4, { fx: "fade", win: "0,.6", out: 5 })}>${esc(x.abroad)}</p>
<p class="ld__health"${s(5, { fx: "fade", win: "0,.5" })}>${esc(x.health)}</p>
<p class="ld__adviser"${s(5, { fx: "fade", win: ".3,1" })}>${esc(x.adviser)}</p>
</div>
</div>
${foot(c, 18)}`;
  }

  /* ── S19 judge ───────────────────────────────────────────────────── */
  function judge(d, c) {
    const x = c.s.judge;
    const cites = [0, 1, 2, 3, 4]
      .map((i) => `<div class="jd__cite" style="--w:${[92, 78, 86, 64, 88][i]}%"><i class="sk"${s(0, { fx: "type", ease: "linear", win: stagger(i, 5, 0.3, 0, 1) })}></i><i${s(1, { fx: "strike", win: stagger(i, 5, 0.3, 0, 0.9) })}></i></div>`)
      .join("");
    return `${hd(x.lines, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage jd__stage">
<div class="jd__paper surface" aria-hidden="true">${cites}</div>
<div class="jd__right">
<blockquote class="jd__quote"${s(1, { fx: "type", ease: "linear", win: "0,.7" })}><p class="qd" lang="en">${esc(x.quote)}</p>${x.gloss ? `<p class="qd-gloss">${esc(x.gloss)}</p>` : ""}</blockquote>
<p class="jd__src src"${s(1, { fx: "fade", win: ".5,1" })}>${esc(x.source)}</p>
<p class="jd__fine"${s(1, { fx: "pop", win: ".6,1" })}>${ico("euro")}<span>${esc(x.fine)}</span></p>
<div class="jd__sign"${s(2, { fx: "fade", win: "0,.4" })}>
<i class="jd__who" aria-hidden="true">${ico("user")}</i>
<svg class="jd__line" viewBox="0 0 400 20" aria-hidden="true"><path d="M2 14 C 60 2, 120 22, 200 10 S 340 6, 398 12" pathLength="1"${s(2, { fx: "draw", win: ".2,1" })}/></svg>
<p class="jd__says"${s(2, { fx: "fade", win: ".4,1" })}>${esc(x.sign)}</p>
</div>
</div>
</div>
${foot(c, 19)}`;
  }

  /* ── S20 visit ───────────────────────────────────────────────────── */
  function visit(d, c) {
    const x = c.s.visit;
    const marks = [
      ["m1", "user"],
      ["m2", "file"],
      ["m3", "pen"],
      ["m4", "copy"],
      ["m5", "calendar"],
    ];
    const html = marks
      .map(([key, icon], i) => {
        const last = i === marks.length - 1;
        return `<li class="vs__mark${last ? " vs__mark--paper" : ""}"${s(i + 1, { fx: "pop", win: "0,.5", ...(last ? {} : { out: 6 }) })}><i class="vs__dot">${ico(icon)}</i><p>${esc(x[key])}</p></li>`;
      })
      .join("");
    return `<header class="hd"></header>
<div class="stage vs__stage">
<div class="vs__open">
<div class="door__shape vs__door" aria-hidden="true"><i class="door__frame"></i><i class="door__leaf w05-swing"${s(0, { fx: "none", win: "0,.9", keep: true })}></i></div>
<div class="vs__who">
<p class="vs__date"${s(0, { fx: "fade", win: ".1,.6", out: 1 })}>${ico5("clock")}<span>${esc(x.date)}</span></p>
<p class="vs__inspector"${s(0, { fx: "fade", win: ".4,1", out: 3 })}>${esc(x.who)}</p>
</div>
</div>
<ol class="vs__line">${html}</ol>
<i class="vs__rail" aria-hidden="true"${s(1, { fx: "line", win: "0,1", out: 6 })}></i>
<p class="vs__last"${s(6, { fx: "fade", win: "0,.6" })}>${esc(x.last)}</p>
</div>
${foot(c, 20)}`;
  }

  /* ── S21 after ───────────────────────────────────────────────────── */
  const KEY_APPEAL = 1;

  function after(d, c) {
    const x = c.s.after;
    const opts = x.options.map((label, i) => pollOpt("appeal", i, label, 0, `af__opt${i === KEY_APPEAL ? " is-key" : ""}`, { win: stagger(i, 4, 0.4, 0, 1), out: 1 })).join("");
    const cells = split(x.chain);
    const tokens = split(x.tokens);
    const days = [3, 8, 15, 15, 5];
    const bars = cells
      .map((label, i) => `<li class="af__seg af__seg--${i}" style="--d:${days[i]}"${s(1, { fx: "fade", win: stagger(i, 5, 0.3, 0, 1) })}>
<span class="af__tok fig">${esc(tokens[i])}</span>
<i class="af__bar${i === 2 ? " af__bar--invented" : ""}"${s(1, { fx: "line", win: stagger(i, 5, 0.3, 0.1, 1) })}></i>
<span class="af__lab fig">${esc(label)}</span></li>`)
      .join("");
    return `${hd(x.question, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage af__stage">
<div class="af__opts">${opts}</div>
<ol class="af__chain">${bars}</ol>
<p class="af__nostop"${s(1, { fx: "fade", win: ".6,1" })}>${esc(x.noStop)}</p>
<div class="af__end">
<p class="af__warn"${s(2, { fx: "pop", win: "0,.5", out: 3 })}>${ico("alert")}<span>${esc(x.warnings)}</span></p>
<p class="af__half"${s(2, { fx: "pop", win: ".3,.9", out: 3 })}><i class="af__coin" aria-hidden="true">${ico5("coin")}</i><span>${esc(x.half)}</span></p>
</div>
<p class="af__bands"${s(3, { fx: "fade", win: "0,.6" })}>${ico("scale")}<span>${esc(x.bands)}</span></p>
</div>
${foot(c, 21)}`;
  }

  return { ladder, judge, visit, after };
}
