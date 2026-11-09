/**
 * The small element language the Workshop 05 slides are written in. Every text element of a press state is one `it({...})`
 * call; the call writes its data-step attributes so that the motion law of the deck holds by construction:
 *
 *   - an element that leaves at press n carries data-out="n" and data-out-win="0,.25" (it goes first),
 *   - an element that enters at a press where something leaves carries data-win=".3,1" (it comes second),
 *   - entrants of one press without a window of their own are spread a little (0.1 apart), never typed or flown,
 *   - every element names its zone (data-zone): the place on the slide it occupies. Two elements of one zone are never
 *     on screen at once; a zone is also the grid cell the slide CSS gives the element.
 *
 * A slide body is a function of `it`. `build` runs it twice: the first pass only collects who enters and who leaves at
 * which press, the second writes the markup with that knowledge.
 */
export const esc = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
export const fill = (text, vars = {}) => String(text).replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));

const r3 = (x) => String(Math.round(x * 1000) / 1000).replace(/^0\./, ".");
export const OUT_WIN = "0,.25";
export const IN_AFTER_OUT = ".3,1";
const SPREAD = 0.1;

/** A window for item i of n inside one press, starting at `from`, each `span` long, ending by 1. */
export function spread(i, n, from = 0, span = 0.5) {
  if (n <= 1) return from === 0 ? "" : `${r3(from)},1`;
  const step = Math.min(SPREAD, (1 - from - span) / (n - 1));
  const start = from + i * Math.max(step, 0);
  return `${r3(start)},${r3(Math.min(1, start + span))}`;
}

/** The window of row i of n inside a press of `ms` milliseconds when rows stagger `gap` ms apart (a take, at most 700 ms). */
export function rowWindow(i, ms, from = 0.3, gap = 36, span = 0.3) {
  const start = from + (i * gap) / ms;
  return `${r3(start)},${r3(Math.min(1, start + span))}`;
}

/**
 * Runs a slide body. `fn(it, ctx)` returns the markup. `it(o)` options:
 *   id, tag ("p"), cls, zone, k (entry press, 0), out (leave press), fx ("fade"), win, outWin, count ("from,to,digits"), fill (n),
 *   attrs (raw attribute text), html (inner markup), text (escaped inner text).
 */
export function build(fn) {
  const ctx = { pass: 1, leave: new Set(), entrants: new Map() };
  const make = (o) => {
    const x = { tag: "p", k: 0, out: null, fx: "fade", ...o };
    if (ctx.pass === 1) {
      if (x.out !== null && x.out !== undefined) ctx.leave.add(x.out);
      if (!x.win && x.fx === "fade" && x.id) {
        const list = ctx.entrants.get(x.k) ?? [];
        list.push(x.id);
        ctx.entrants.set(x.k, list);
      }
      return "";
    }
    return render(x, ctx);
  };
  fn(make, ctx);
  ctx.pass = 2;
  return fn(make, ctx);
}

function render(x, ctx) {
  let a = "";
  if (x.id) a += ` data-id="${x.id}"`;
  if (x.zone) a += ` data-zone="${x.zone}"`;
  a += ` data-step="${x.k}"`;
  const leavers = x.k > 0 && ctx.leave.has(x.k);
  let win = x.win;
  if (!win) {
    const list = ctx.entrants.get(x.k) ?? [];
    const i = list.indexOf(x.id);
    win = list.length > 1 && i >= 0 ? spread(i, list.length, leavers ? 0.3 : 0) : leavers ? IN_AFTER_OUT : "";
  }
  if (win) a += ` data-win="${win}"`;
  a += ` data-fx="${x.fx}"`;
  if (x.out !== null && x.out !== undefined) a += ` data-out="${x.out}" data-out-win="${x.outWin ?? OUT_WIN}"`;
  if (x.count) a += ` data-count="${x.count}"`;
  if (x.fill !== undefined) a += ` data-fill="${x.fill}"`;
  if (x.attrs) a += ` ${x.attrs}`;
  const cls = x.cls ? ` class="${x.cls}"` : "";
  const inner = x.html !== undefined ? x.html : x.text !== undefined ? esc(x.text) : "";
  return `<${x.tag}${cls}${a}>${inner}</${x.tag}>`;
}
