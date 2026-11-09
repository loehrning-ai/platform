/**
 * S03 why (REDESIGN-3 D4): what happens and how often. Press 0 counts the inspections of 2025 while the country stands on the
 * right, one dot per ten inspections. Presses 1 to 4 stand up four dated news cards over the map (it dims to a quarter and
 * stays in view): title or quote as printed, in Macedonian, with our translation. Press 5: the cards leave while the dots pour
 * into three columns by kind, a bracket over all three carries the decisions; press 6 pulses the eight DIT regions, press 7
 * marks Bitola and asks the room.
 * The left column holds the number, the one caption and the one source line. The dust stays the cover's: no scatter here.
 */
import { esc, fill } from "./motion.mjs";
import { field, fieldGroups, fieldPoint, numFmt, standUp } from "./scene.mjs";
import { BITOLA, REGIONS } from "./seats.mjs";
import { ico } from "./slides-parts.mjs";
import { cap, head, src } from "./slides-intro.mjs";

/** The field box on the stage (stage pixels) and its seed. */
const BOX = { left: 676, top: 110, w: 1000, h: 760, pad: 24, seed: 26484 };
/** The side of its ring each region label stands on, in degrees (0 right, 90 up): outside the ring, clear of its neighbours. */
const SIDE = { vardar: -90, east: 0, southwest: 160, southeast: -90, pelagonia: -90, polog: 90, northeast: 20, skopje: -125 };
/** The ring radius the canvas draws for a region (w05-field.js: 64 px times the square root of its share of the largest). */
const ringR = (v, max) => 64 * Math.sqrt(v / max);

export function why(it, ctx, d, c) {
  const t = c.s.why;
  const per = 10;
  const n = Math.round(d.dit.total / per);
  const kinds = [d.dit.regular, d.dit.followUp, d.dit.extraordinary];
  const rects = fieldGroups(kinds, { n, w: BOX.w, h: BOX.h, pad: BOX.pad });
  const kindLabels = rects
    .map((r, i) => it({ tag: "span", cls: "wf__kind", k: 5, out: 6, win: `.${5 + i},1`, attrs: `style="left:${(r.x + r.w / 2).toFixed(0)}px;top:${(r.y - 78).toFixed(0)}px"`, html: `<b>${numFmt(kinds[i], d.lang)}</b>${esc(t.kinds[i])}` }))
    .join("");
  const vmax = Math.max(...REGIONS.map((g) => g.inspections));
  const towns = REGIONS.map((g, i) => {
    const at = fieldPoint(g.at, BOX);
    const a = (SIDE[g.key] * Math.PI) / 180;
    const r = ringR(g.inspections, vmax) + 8;
    const x = at.x + Math.cos(a) * r;
    const y = at.y - Math.sin(a) * r;
    const tx = Math.cos(a) < -0.3 ? "-100%" : Math.cos(a) > 0.3 ? "0" : "-50%";
    const ty = Math.sin(a) > 0.3 ? "-100%" : Math.sin(a) < -0.3 ? "0" : "-50%";
    return it({ tag: "span", cls: "wf__town", k: 6, win: `${(0.3 + i * 0.06).toFixed(2)},1`, attrs: `style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;translate:${tx} ${ty}"`, html: `${esc(t.regions[i])} <b>${numFmt(g.inspections, d.lang)}</b>` });
  }).join("");
  // the decisions span every kind: a bracket over the three columns with the count at its middle (it fades; the regroup is the press's idea)
  const top = Math.min(...rects.map((r) => r.y)) - 104;
  const x0 = rects[0].x;
  const x1 = rects[rects.length - 1].x + rects[rects.length - 1].w;
  const dec = it({ tag: "span", cls: "wf__dec", k: 5, out: 6, win: ".6,1", attrs: `style="left:${x0.toFixed(0)}px;width:${(x1 - x0).toFixed(0)}px;top:${top.toFixed(0)}px"`, html: `<b>${esc(fill(t.dec, { n: numFmt(d.dit.decisions, d.lang) }))}</b>` });
  const home = fieldPoint(BITOLA, BOX);
  const ring = it({ tag: "i", cls: "wf__ring", k: 7, fx: "pop", win: "0,.6", attrs: `style="left:${home.x}px;top:${home.y}px"` });
  const bitola = it({ tag: "span", cls: "wf__bitola", k: 7, win: ".4,1", attrs: `style="left:${home.x + 64}px;top:${home.y - 22}px"`, text: t.bitola });
  const legend = it({ tag: "p", cls: "flegend wf__legend", k: 0, win: ".6,1", html: `<i class="flegend__dot"></i>${esc(t.legend)}` });
  const map = field(it, {
    id: "field", zone: "map", k: 0, w: BOX.w, h: BOX.h, n, seed: BOX.seed, pad: BOX.pad, outline: true, cls: "wf fig",
    regions: REGIONS.map((g) => ({ at: g.at, inspections: g.inspections })), groups: { kind: kinds },
    // the country stands still on the entry (the count is press 0's one moving idea, M1); presses 5 and 6 move the dots
    still: true,
    plan: [{ k: 0, from: "country" }, { k: 5, from: "country", to: "groups:kind" }, { k: 6, from: "groups:kind", to: "regions" }],
    label: fill(t.field, { dots: numFmt(n, d.lang) }), overlay: `${legend}${kindLabels}${dec}${towns}${ring}${bitola}`,
  });
  const cards = t.cards
    .map((card, i) =>
      standUp(it, {
        cls: `ecard ecard--${i + 1}`, k: i + 1,
        html: `<p class="ecard__meta fig"><b>${esc(card.date)}</b><span>${esc(card.src)}</span></p><p class="qd ecard__mk" lang="${card.lang}">${esc(card.mk)}</p><p class="qd-gloss ecard__gl">${esc(card.gl)}</p>`,
      }),
    )
    .join("");
  const number = it({
    id: "num", tag: "div", cls: "bign fig", zone: "n",
    html: `${it({ tag: "span", cls: "bign__n", fx: "none", count: `0,${d.dit.total},0`, win: ".05,.9", html: numFmt(d.dit.total, d.lang) })}<span class="bign__l">${esc(t.n)}</span>`,
  });
  const stage = [
    `<a class="bk" href="#a3" aria-label="${esc(t.sources)}">${ico("book")}</a>`,
    head(it, t),
    number,
    cap(it, "c0", t.c0, 0, 1),
    src(it, "t0", t.t0, 0, 1),
    ...t.cards.map((card, i) => cap(it, `c${i + 1}`, card.cap, i + 1, i + 2)),
    it({ id: "wall", tag: "div", cls: "wall w05-s3d", zone: "wall", k: 1, out: 5, fx: "none", html: cards }),
    map,
    cap(it, "c6", t.c6, 5, 6),
    src(it, "t6", t.t6, 5, 6),
    cap(it, "c7", t.c7, 6, 7),
    src(it, "t7", t.t7, 6, 7),
    cap(it, "q8", t.q8, 7, null, { cls: "t cap ask" }),
  ].join("\n");
  return { head: "", stage };
}
