/**
 * Act 4, run it (S14 step1, S15 step2, S16 xray, S17 step3). Every AI-looking result on these slides is either computed from
 * the kit files and labelled so, or the empty frame "not recorded yet": no Claude run is shown as recorded.
 */
import { matrixData } from "./matrix-data.mjs";
import { makeParts } from "./slides-parts.mjs";

export default function makeAct4(H) {
  const { s, stagger, ico, ico5, arcStyle, chip, hd, foot, esc, fill } = H;
  const P = makeParts(H);
  const { t, split, prompt, slot, pollOpt, rungStrip } = P;

  /* ── S14 step1 ───────────────────────────────────────────────────── */
  function step1(d, c) {
    const x = c.s.step1;
    const rows = P.keyRows(d.lang);
    const table = rows
      .map((cells, i) => `<li class="out st1__row"${s(1, { fx: "fade", win: stagger(i, rows.length, 0.25, 0, 1), out: 2 })}>${cells.map((cell, j) => `<span class="st1__c${j}">${esc(cell)}</span>`).join("")}</li>`)
      .join("");
    return `${hd(x.title, { attrs: s(0, { fx: "fade" }) })}
<div class="stage st1__stage">
${prompt(c, 1, d.prompts.step1)}
<div class="st1__chips">
<span class="chip st1__chip"${s(0, { fx: "pop", win: "0,.5", out: 1 })}>${esc(x.invented)}</span>
<span class="chip st1__chip st1__chip--no"${s(0, { fx: "pop", win: ".3,.8", out: 1 })}>${esc(x.ownNot)}</span>
</div>
<ol class="st1__table" aria-label="${esc(x.cols)}">${table}</ol>
<div class="st1__side">
<p class="st1__exp"${s(1, { fx: "type", ease: "linear", win: "0,.5", out: 2 })}>${t(x.expected, { rows: rows.length, cols: 5 })}</p>
<p class="st1__comp src"${s(1, { fx: "fade", win: ".4,.8", out: 2 })}>${esc(x.computed)}</p>
<p class="st1__hint"${s(1, { fx: "fade", win: ".6,1", out: 2 })}>${esc(x.hint)}</p>
</div>
${slot(x, 2, 2, { cls: "st1__slot" })}
${rungStrip(x, "st1__rungs")}
</div>
${foot(c, 14)}`;
  }

  /* ── S15 step2 ───────────────────────────────────────────────────── */
  function step2(d, c) {
    const x = c.s.step2;
    const sample = P.sampleRows(d.lang);
    const people = d.matrix.personIds.length;
    const [naive, corrected] = split(x.formulas);
    const opts = x.options.map((label, i) => pollOpt("findings", i, label, 1, "st2__opt", { win: stagger(i, 4, 0.4, 0, 1), out: 4 })).join("");
    return `${hd(x.title, { attrs: s(0, { fx: "fade", out: 2 }) })}
<div class="stage st2__stage">
<div class="st2__left">
${prompt(c, 2, d.prompts.step2)}
${rungStrip(x, "st2__rungs")}
</div>
<div class="st2__right">
<p class="st2__q"${s(1, { fx: "fade", win: "0,.5", out: 2 })}>${t(x.question, { people })}</p>
<p class="st2__q st2__q--l3"${s(2, { fx: "fade", win: "0,.5", out: 3 })}>${esc(x.level3)}</p>
<p class="st2__q st2__q--naive"${s(3, { fx: "fade", win: "0,.5", out: 4 })}>${esc(x.naive)}</p>
<div class="st2__opts">${opts}</div>
${slot(x, 4, 4, { cls: "st2__slot", word: x.wording })}
<div class="st2__rows fig"${s(2, { fx: "pop", win: "0,.5" })}>${sample.map((row) => `<span class="st2__rowline">${esc(row)}</span>`).join("")}</div>
<div class="st2__ex">
<i class="st2__box st2__box--pc" role="img" aria-label="${esc(x.computer)}"${s(2, { fx: "pop", win: "0,.4", out: 3 })}>${ico("folder")}</i>
<i class="st2__link" aria-hidden="true"${s(2, { fx: "line", win: ".3,.7", out: 3 })}></i>
<i class="st2__box st2__box--tool" role="img" aria-label="${esc(x.tool)}"${s(2, { fx: "pop", win: ".2,.6", out: 3 })}>${ico("spark")}</i>
<i class="st2__code" aria-hidden="true"${s(2, { fx: "arc", win: ".5,1", out: 3 })}${arcStyle(260, 0, 70, 0.8)}>${ico("code")}</i>
<p class="st2__never chip"${s(2, { fx: "pop", win: ".6,1", out: 3 })}>${esc(x.never)}</p>
</div>
<div class="st2__f">
<p class="st2__formula fig"${s(3, { fx: "type", ease: "linear", win: "0,.5" })}>${esc(naive)}</p>
<p class="st2__formula st2__formula--ok fig"${s(3, { fx: "type", ease: "linear", win: ".4,.9" })}>${esc(corrected)}</p>
<p class="st2__inv src"${s(3, { fx: "fade", win: ".6,1", out: 4 })}>${esc(x.invented)}</p>
</div>
</div>
</div>
${foot(c, 15)}`;
  }

  /* ── S16 xray ────────────────────────────────────────────────────── */
  function xray(d, c) {
    const x = c.s.xray;
    const f = (id) => d.findings.find((finding) => finding.id === id);
    const vars = {
      f1: f("F1").facts.late[0].daysAfterDue, f1s: f("F1").facts.late[0].daysAfterStart,
      f2: f("F2").number,
      f3w: f("F3").facts.weeksAboveCap, f3t: f("F3").facts.weeks,
      f5: f("F5").number,
      f6: f("F6").number,
      f7: f("F7").facts.below[0].days,
      f10l: f("F10").facts.listed, f10t: f("F10").facts.titles,
    };
    const ledger = x.ledger.map((line, i) => `<li class="out xr__line"${s(2, { fx: "fade", win: stagger(i, 10, 0.3, 0, 1) })}>${esc(fill(line, vars))}</li>`).join("");
    const ticks = d.whatIfResults["ticks-filled"].warnings[0];
    const ticksLines = x.ticksLines.map((line) => `<li class="out xr__line xr__line--w" data-mx-show="2"${s(5, { fx: "fade", win: ".4,1" })}>${esc(fill(line, { w1: ticks.number }))}</li>`).join("");
    const sum = Object.values(d.oracle.rowsByFile).join(" + ");
    const json = matrixData(d.kitFiles, { labels: d.lines.map((l) => l.label), flags: x.flags, text: { alt: x.alt, wholeFirm: x.wholeFirm, rule: x.tipRule, fine: x.tipFine, fix: x.tipFix } });
    if (json.rowsRead !== d.rowsRead) throw new Error("xray: the matrix JSON and the oracle disagree on the rows read");
    const whatifs = x.whatifs.map((label, i) => `<button class="xr__what" type="button" data-mx-whatif="${i + 1}" aria-pressed="false">${esc(label)}</button>`).join("");
    const bars = [0, 1, 2, 3].map((i) => `<i data-value="${i}"></i>`).join("");
    return `${hd(x.head, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage xr__stage">
<div class="xr__left">
<div id="w05-matrix-anchor" class="w05-mx__plot"${s(1, { fx: "none", win: "0,1", keep: true })}>
<canvas class="w05-mx__canvas" width="936" height="780"></canvas>
<div class="w05-sweep" aria-hidden="true"></div>
<div class="w05-mx__flags" data-mx-phase="flags"${s(2, { fx: "none", win: "0,1" })}></div>
<div class="w05-mx__pulses" aria-hidden="true"></div>
<i class="w05-mx__ph" data-mx-phase="checked"${s(3, { fx: "none", win: "0,1" })}></i>
</div>
<div class="xr__bars w05-ghost w05-ghost--ink" data-poll-show="findings" aria-hidden="true"${s(0, { fx: "none", keep: true })}>${bars}</div>
</div>
<div class="xr__right">
<p class="xr__computed"${s(0, { fx: "fade", win: ".3,1" })}>${esc(x.computed)}</p>
<div class="xr__top">
<p class="xr__count xr__count--rows"${s(1, { fx: "fade", win: "0,.4", out: 4 })}><span>${esc(x.rows)}</span> <b${s(1, { fx: "none", win: "0,.9", count: `0,${d.rowsRead},0` })}>${d.rowsRead}</b></p>
<p class="xr__count xr__count--finds"${s(2, { fx: "fade", win: "0,.4", out: 4 })}><span>${esc(x.findings)}</span> <b${s(2, { fx: "none", win: "0,.9", count: `0,${d.findings.length},0` })}>${d.findings.length}</b></p>
<p class="xr__count xr__count--checked"${s(3, { fx: "fade", win: "0,.4", out: 4 })}><span>${esc(x.checked)}</span> <b${s(3, { fx: "none", win: "0,.9", count: `0,${d.decoys.length},0` })}>${d.decoys.length}</b></p>
<div class="xr__wrong"${s(4, { fx: "pop", win: "0,.6", out: 5 })}>
<p class="xr__wrongt">${t(x.wrong, { over: d.wrong.over, under: d.wrong.under })}</p>
<p class="xr__wrongh src">${esc(x.wrongTitle)}</p>
</div>
<div class="xr__whatifs" data-mx-whatifs${s(5, { fx: "fade", win: "0,.6" })}>
<div class="xr__whatbtns">${whatifs}</div>
<p class="xr__now"><span>${esc(x.findingsNow)}</span> <b data-mx-count>${d.counters.base}</b></p>
</div>
</div>
<p class="out xr__sum"${s(1, { fx: "fade", win: ".4,1" })}>${sum}</p>
<ol class="xr__ledger">${ledger}
<li class="out xr__line xr__line--people"${s(2, { fx: "fade", win: ".6,1" })}>${esc(fill(x.people, { people: d.peopleInFindings, all: d.matrix.personIds.length }))}</li>
<li class="out xr__line"${s(4, { fx: "fade", win: ".4,1" })}>${esc(x.wrongExtra)}</li>
${ticksLines}</ol>
</div>
<script type="application/json" id="w05-matrix">${JSON.stringify(json).replace(/</g, "\\u003c")}</script>
</div>
${foot(c, 16)}`;
  }

  /* ── S17 step3 ───────────────────────────────────────────────────── */
  const WARN_FIRST = new Set(["L03", "L04", "L05", "L06", "L07", "L08", "L09"]);

  function step3(d, c) {
    const x = c.s.step3;
    const n = d.lines.length;
    const vars = { lines: n, covered: d.tally.covered, weak: d.tally.weak, gap: d.tally.gap };
    const word = { COVERED: x.covered, WEAK: x.weak, GAP: x.gap };
    const buckets = fill(x.buckets, vars).split(" · ");
    const keyBucket = d.tally.covered <= 1 ? 0 : d.tally.covered === 2 ? 1 : d.tally.covered <= 5 ? 2 : 3;
    const opts = buckets.map((label, i) => pollOpt("tally", i, label, 1, `st3__opt${i === keyBucket ? " is-key" : ""}`, { win: stagger(i, 4, 0.4, 0, 1), out: 3 })).join("");
    const cells = d.lines
      .map((line, i) => `<span class="fig s3c"${s(2, { fx: "flip", win: stagger(i, n, 0.3, 0, 1) })}>
<span class="face"><b>${line.id}</b>${esc(line.label)}</span>
<span class="face face--back"><b>${line.id}</b>${esc(line.label)}${chip(line.status, word[line.status])}${WARN_FIRST.has(line.id) ? `<i class="s3c__w" role="img" aria-label="${esc(x.warnFirst)}">${ico("alert")}</i>` : ""}</span></span>`)
      .join("");
    const note = P.noteLines(d.lang);
    const noteHtml = note.map((line, i) => `<p class="out st3__nl${i === note.length - 1 ? " st3__nl--sign" : ""}"${s(4, { fx: "type", ease: "linear", win: stagger(i, note.length, 0.25, 0, 1) })}>${esc(line)}</p>`).join("");
    return `${hd(x.title, { attrs: s(0, { fx: "fade", out: 1 }) })}
<div class="stage st3__stage">
<div class="st3__left">
${prompt(c, 3, d.prompts.step3)}
<div class="st3__cells" aria-label="${esc(x.computed)}">${cells}</div>
</div>
<div class="st3__right">
<p class="st3__q"${s(1, { fx: "fade", win: "0,.5", out: 2 })}>${t(x.question, vars)}</p>
<div class="st3__opts">${opts}</div>
<div class="st3__status"${s(2, { fx: "fade", win: "0,.4", out: 4 })}>
<p class="st3__tally">${split(fill(x.status, vars)).map((part, i) => {
      const [label, count] = [part.replace(/\s\d+$/, ""), part.match(/\d+$/)[0]];
      const key = ["covered", "weak", "gap"][i];
      return `<span class="st3__t st3__t--${key}">${esc(label)} <b${s(2, { fx: "none", win: "0,.9", count: `0,${count},0` })}>${count}</b></span>`;
    }).join("")}</p>
<p class="st3__comp src">${esc(x.computed)}</p>
</div>
<div class="st3__clocks"${s(3, { fx: "fade", win: "0,.4", out: 4 })}>
<p class="st3__clock st3__clock--visit">${ico5("clock")}<span>${esc(x.visit)}</span></p>
<p class="st3__clock st3__clock--papers">${ico("calendar")}<span>${esc(x.papers)}</span></p>
</div>
<p class="st3__draft"${s(4, { fx: "fade", win: "0,.4", out: 5 })}>${esc(x.draft)}</p>
<div class="st3__note surface"${s(4, { fx: "pop", win: "0,.4" })}>${noteHtml}</div>
<p class="out st3__ledger"${s(4, { fx: "fade", win: ".5,1" })}>${esc(x.ledger)}</p>
${slot(x, 4, 5, { cls: "st3__slot", word: x.wording })}
</div>
</div>
${foot(c, 17)}`;
  }

  return { step1, step2, xray, step3 };
}
