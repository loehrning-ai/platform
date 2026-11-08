/**
 * Appendix a1 to a4: reference tables, no motion, no prose. Each is reached by a link on a main slide and returns to the
 * slide it came from through a back link to that slide's id. Every table row is one figure cell (.fig).
 */
import { esc } from "./motion.mjs";
import { foot } from "./slides-parts.mjs";

const head = (title, back, to) =>
  `<header class="hd"><h2 class="headline headline--s">${esc(title)}</h2><a class="appx__back pill pill--quiet" href="#${to}">${esc(back)}</a></header>`;
const rows = (items, cls = "") => `<ul class="appx__rows${cls ? ` ${cls}` : ""}">${items.map((r) => `<li class="appx__row fig">${r}</li>`).join("")}</ul>`;
const cell = (text, cls = "") => `<span class="appx__c${cls ? ` ${cls}` : ""}">${esc(text)}</span>`;

/** The four appendix bodies: (d, c, total) => inner html of the section. */
export const APPENDIX = {
  a1(d, c, total) {
    const x = c.s.a1;
    const laws = x.rows.map((r) => `${cell(r.name, "appx__name")}${cell(r.mk, "qd appx__mk")}${cell(r.art)}${cell(r.text)}`);
    return `${head(x.title, x.back, "letter")}
<div class="stage appx">
${rows(laws, "appx__rows--laws")}
${rows(x.clock.map((l) => cell(l)), "appx__rows--notes")}
${rows([cell(x.fines)], "appx__rows--notes")}
<p class="appx__note">${esc(x.finesNote)}</p>
</div>
${foot(c, "A1", total)}`;
  },
  a2(d, c, total) {
    const x = c.s.a2;
    const levels = x.levels.map((l) => `${cell(l.n, "appx__name")}${cell(l.text)}`);
    return `${head(x.title, x.back, "ladder")}
<div class="stage appx">
${rows(levels, "appx__rows--levels")}
<p class="appx__note">${esc(x.gates)}</p>
${rows(x.terms.map((t) => cell(t)))}
<p class="appx__note">${esc(x.ceiling)}</p>
<p class="appx__note">${esc(x.transfer)}</p>
</div>
${foot(c, "A2", total)}`;
  },
  a3(d, c, total) {
    const x = c.s.a3;
    return `${head(x.title, x.back, "why")}
<div class="stage appx">
${rows(x.rows.map((r) => cell(r)), "appx__rows--src")}
<p class="appx__note">${esc(x.note)}</p>
</div>
${foot(c, "A3", total)}`;
  },
  a4(d, c, total) {
    const x = c.s.a4;
    return `${head(x.title, x.back, "other")}
<div class="stage appx">
${rows(x.blanks.map((b) => cell(b)), "appx__rows--blanks")}
<p class="appx__note">${esc(x.none)}</p>
<p class="appx__note">${esc(x.tax)}</p>
<p class="appx__note">${esc(x.ai)}</p>
${rows([cell(x.paid)])}
<p class="appx__note">${esc(x.paidNote)}</p>
</div>
${foot(c, "A4", total)}`;
  },
};
