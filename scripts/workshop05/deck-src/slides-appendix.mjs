/**
 * Appendix a1 to a5: reference tables, no motion, no prose. Each is reached by a link on a main slide and returns to
 * the slide it came from through a back link to that slide's id. Every table row is one figure cell (.fig).
 */
import { makeParts } from "./slides-parts.mjs";

export default function makeAppendix(H) {
  const { hd, foot, esc } = H;
  const P = makeParts(H);
  const { split } = P;

  const head = (title, back, to, c) =>
    `<header class="hd"><h2 class="headline headline--s">${esc(title)}</h2><a class="appx__back pill pill--quiet" href="#${to}">${esc(back)}</a></header>`;
  const rows = (items, cls = "") => `<ul class="appx__rows${cls ? ` ${cls}` : ""}">${items.map((r) => `<li class="appx__row fig">${r}</li>`).join("")}</ul>`;
  const cell = (text, cls = "") => `<span class="appx__c${cls ? ` ${cls}` : ""}">${esc(text)}</span>`;

  function a1(d, c) {
    const x = c.s.a1;
    const laws = x.rows.map((r) => `${cell(r.name, "appx__name")}${cell(r.mk, "qd appx__mk")}${cell(r.art)}${cell(r.text)}`);
    return `${head(x.title, x.back, "clock", c)}
<div class="stage appx">
${rows(laws, "appx__rows--laws")}
${rows([cell(x.fines), cell(x.iso)], "appx__rows--notes")}
<p class="appx__note">${esc(x.finesNote)}</p>
</div>
${foot(c, "A1")}`;
  }

  function a2(d, c) {
    const x = c.s.a2;
    const levels = x.levels.map((l) => `${cell(l.n, "appx__name")}${cell(l.text)}`);
    const terms = x.terms.map((t) => cell(t));
    return `${head(x.title, x.back, "ladder", c)}
<div class="stage appx">
${rows(levels, "appx__rows--levels")}
<p class="appx__note">${esc(x.gates)}</p>
${rows(terms)}
<p class="appx__note">${esc(x.ceiling)}</p>
</div>
${foot(c, "A2")}`;
  }

  function a3(d, c) {
    const x = c.s.a3;
    return `${head(x.title, x.back, "neighbour", c)}
<div class="stage appx">
${rows(x.rows.map((r) => cell(r)), "appx__rows--src")}
<p class="appx__note">${esc(x.note)}</p>
</div>
${foot(c, "A3")}`;
  }

  function a4(d, c) {
    const x = c.s.a4;
    return `${head(x.title, x.back, "notmeasured", c)}
<div class="stage appx">
${rows(x.blanks.map((b) => cell(b)), "appx__rows--blanks")}
<p class="appx__note">${esc(x.none)}</p>
<p class="appx__note">${esc(x.ai)}</p>
${rows([cell(x.paid)])}
<p class="appx__note">${esc(x.paidNote)}</p>
</div>
${foot(c, "A4")}`;
  }

  function a5(d, c) {
    const x = c.s.a5;
    const labels = split(c.s.table.cells).join(" · ");
    return `${head(x.title, x.back, "clock", c)}
<div class="stage appx">
${rows(x.names.map((n) => cell(n)), "appx__rows--names")}
${rows([cell(labels)], "appx__rows--labels")}
</div>
${foot(c, "A5")}`;
  }

  return { a1, a2, a3, a4, a5 };
}
