/**
 * S15 safety: what goes in, what never, who signs (REDESIGN-3 D4). One scene: the data ladder as a stair of four steps.
 * The left column is calm: the two rules stay at its top from the entry on, and below them one slot (plus the poll's) holds
 * one card at a time, so at most three blocks show: the training facts (press 1) give their place to the never card (press 4),
 * which gives its place to the law (press 5); the poll (press 2) leaves with the answer (press 3). The stair is seen in depth (a real 3D
 * stair: each step one level higher in z, the lit step comes forward), each step with an offset outline as its edge.
 * Press 0: the two rules (AI sorts and drafts; a named person signs). Press 1: steps 1 and 2 stand up, the training fact per plan
 * (Anthropic Usage Policy). Press 2: steps 3 and 4 stand up, the poll. Press 3: the answer, step 3 lit, the poll gone. Press 4: what never goes
 * into a chat on any plan (EMBG, health content, the feedback buttons: Law on Personal Data Protection) and the record rule. Press 5: the
 * four gates and the two law cards, step 4 lit (AZLP Form No. 1, the Usage Policy, Law on Personal Data Protection Chapter V).
 * The stair links to appendix A2.
 */
import { esc, spread } from "./motion.mjs";
import { icon, standUp } from "./scene.mjs";
import { cap } from "./slides-intro.mjs";
import { pollButtons } from "./slides-parts.mjs";

const split = (text) => String(text).split(" · ");

export function safety(it, ctx, d, c) {
  const t = c.s.safety;
  const rungs = split(t.rg).map((x) => /^(\S+ \d)\s+(.*)$/.exec(x)).map((m) => ({ lvl: m[1], name: m[2] }));
  const g = /^(.*?):\s*(.*?)\.\s*(.*)$/.exec(t.g);
  if (!g) throw new Error("safety.g: expected 'Gates: a, b, c, d. Ask ...'");
  const gates = g[2].split(", ");
  // steps from the bottom (level 1) to the top; 1 and 2 stand up on press 1, 3 and 4 on press 2
  const steps = rungs
    .map((r, i) =>
      standUp(it, {
        cls: `sf3__s sf3__s--${i + 1}`, k: i < 2 ? 1 : 2, win: spread(i % 2, 2, 0, 0.6),
        attrs: `style="--i:${i}"`,
        html: `<i class="sf3__edge" aria-hidden="true"></i><i class="sf3__face" aria-hidden="true"></i><b class="sf3__l">${esc(r.lvl)}</b><b class="sf3__n">${esc(r.name)}</b><small>${esc(t.ex[i])}</small>`,
      }),
    )
    .join("");
  const stair = it({
    id: "stair", tag: "div", cls: "sf3 w05-s3d fig", zone: "st", fx: "none",
    // the four places of the stair are outlined from the entry (M13), so the steps stand up into a shape the room already sees
    html: `<a href="#a2" aria-label="${esc(t.rgAria)}">${rungs.map((_, i) => `<i class="sf3__g sf3__s--${i + 1}" style="--i:${i}" aria-hidden="true"></i>`).join("")}${steps}</a>`,
  });
  const rules = it({
    id: "rules", tag: "div", cls: "sfr fig", zone: "r",
    html: `<p>${icon("assistant", { it, k: 0, win: ".1,.7" })}<span>${esc(t.r1)}</span></p><p>${icon("person", { it, k: 0, win: ".3,.9" })}<span>${esc(t.r2)}</span></p>`,
  });
  const f1 = it({
    id: "f1", tag: "div", cls: "sff fig", zone: "a", k: 1, out: 4,
    html: `${t.f1.map((x) => `<p>${icon("shield")}<span>${esc(x)}</span></p>`).join("")}<small>${esc(t.f1Src)}</small>`,
  });
  const nv = it({
    id: "nv", tag: "div", cls: "sfn fig", zone: "a", k: 4, out: 5, win: ".3,1",
    html: `<b>${esc(t.nv)}</b><ul>${t.nvi.map((x, i) => `<li>${icon("lock", { it, k: 4, win: spread(i, 3, 0.35, 0.5) })}<span>${esc(x)}</span></li>`).join("")}</ul><small>${esc(t.nvSrc)}</small>`,
  });
  const law = it({
    id: "law", tag: "div", cls: "sfl fig", zone: "a", k: 5, win: ".3,1",
    html: `<div class="sfl__g"><b>${esc(g[1])}</b><ul>${gates.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>${t.law.map((x, i) => `<p>${icon(i ? "sheet-check" : "letter")}<span>${esc(x)}</span></p>`).join("")}<small>${esc(t.lawSrc)}</small>`,
  });
  const stage = [
    it({ id: "h", tag: "h2", cls: "headline hl", zone: "h", text: t.h }),
    cap(it, "c0", t.c0, 0, 1),
    cap(it, "c1", t.c1, 1, 2),
    it({ id: "pq", cls: "t cap fig", zone: "cap", k: 2, out: 3, text: t.pq }),
    cap(it, "a", t.a, 3, 4),
    cap(it, "c4", t.c4, 4, 5),
    it({ id: "g", cls: "t cap", zone: "cap", k: 5, text: g[3] }),
    rules,
    f1,
    pollButtons(it, { id: "pb", name: "ladder", labels: t.pb, k: 2, out: 3, zone: "l" }),
    nv,
    law,
    stair,
  ].join("\n");
  return { head: "", stage };
}
