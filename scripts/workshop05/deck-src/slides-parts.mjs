/**
 * Pieces the slides share: icons, poll buttons, the collapsed kit prompt, the Claude window replica and the recorded
 * take (or, while no take is accepted, the labelled empty frame). Nothing here is typed copy: every visible word comes
 * from deck-copy.json, every number from data.mjs, every take line from a recording (take.mjs).
 */
import { esc, fill, rowWindow, spread } from "./motion.mjs";
import { durationText, icon } from "./scene.mjs";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { PIPE_ROW, TAKES_DIR, chipText, compareWithKey, findingLine, modelName, statusLines, takeRows, toolsOf, turnOf } from "./take.mjs";

/** An icon of the engine sprite (lib/icons.svg). */
export const ico = (name, cls = "") => `<svg class="ico${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="./lib/icons.svg#i-${name}"/></svg>`;

const split = (text) => String(text).split(" · ");

/** The footer prints the page counter only. n is 1 to 15 or "A1". */
export function foot(c, n, total) {
  const label = typeof n === "number" ? `${String(n).padStart(2, "0")} / ${total}` : `${esc(c.appendix)} ${n}`;
  return `<footer class="foot"><span class="foot__inv"></span><span class="foot__n">${label}</span></footer>`;
}

/**
 * Poll buttons in one element: four (or two, or three) chips with an outline, each with its counter. The counter digits are
 * counted words, the labels too. The buttons fade in together with their container.
 */
export function pollButtons(it, { id, name, labels, k, zone, out, win, cls = "", wide = false }) {
  const buttons = labels
    .map((label, i) => `<button class="poll__opt" type="button" data-poll="${name}" data-value="${i}"><span>${esc(label)}</span><span data-poll-n>0</span></button>`)
    .join("");
  return it({ id, tag: "div", cls: `poll pb${wide ? " pb--wide" : ""} pb--${labels.length}${cls ? ` ${cls}` : ""}`, zone, k, out, win, html: buttons, attrs: `data-poll-name="${name}"` });
}

/**
 * The kit prompt in the window's thread: the engine's .prompt collapsed to three lines (--lines:3, no data-open) so the
 * slide shows the start of it, while the DOM holds the full text, byte for byte as in the start file. `full` shows all of it.
 */
export function promptBubble(c, n, text, { full = false } = {}) {
  const lines = full ? "" : ` style="--lines:3"`;
  return `<figure class="cw-user prompt tk-prompt${full ? " tk-prompt--full" : ""}"${full ? " data-open" : ""}${lines}><pre class="prompt__text prompt-body" id="prompt-${n}">${esc(text)}</pre><button class="prompt__copy fig" type="button" data-copy="prompt-${n}">${ico("copy")}<span class="copy__label">${esc(c.copy)}</span></button></figure>`;
}

/* ── Claude's UI, drawn (round 5, D4) ────────────────────────────────────
 * Every place where the room uses Claude looks like the Claude desktop app: its ivory UI, its orange (clay) accent, the word
 * "Claude" in the window chrome, a Projects sidebar rail, the prompt box with the send button, and the recorded answer as
 * Claude's reply. The colours are Anthropic's own (press kit and brand guidelines, lib/w05-fx.css :root --claude-*). The Claude
 * logo is NOT used: Anthropic's trademark guidelines allow their marks only in materials they approve beforehand, so the
 * chrome shows the word and a plain four-point spark of our own. The orange belongs to this UI only (class cl-ui marks it).
 */

/** Our neutral spark (not Anthropic's mark): a plain four-point star, filled clay inside the Claude UI. */
export const spark = (cls = "cl-spark") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5 13.9 10.1 21.5 12 13.9 13.9 12 21.5 10.1 13.9 2.5 12 10.1 10.1Z"/></svg>`;
const line = (d, cls = "") => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
/** The line icons of the drawn app (round 6), on the 24 grid, drawn by us: plain shapes, nobody's icon set. */
export const CL_ICON = {
  plus: "M12 5.5v13M5.5 12h13",
  chat: "M5 6.5h14v9H10l-4 3v-3H5z",
  folder: "M3.5 7.5V18h17V9h-8.5L10 6.5H3.5z",
  shapes: "M4.5 4.5h6v6h-6zM17 4.2a3.3 3.3 0 1 1 0 6.6 3.3 3.3 0 0 1 0-6.6zM4.5 19.5l3-5.5 3 5.5zM13.8 13.8h6v6h-6z",
  side: "M4 5h16v14H4zM9.5 5v14",
  chevD: "M7.5 10l4.5 4.5 4.5-4.5",
  chevR: "M10 7.5l4.5 4.5-4.5 4.5",
  tools: "M4 8h9M17 8h3M4 16h3M11 16h9M15 6v4M9 14v4",
  clock: "M12 7.5V12l3 2M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17z",
  send: "M12 18.5v-13M6.5 11l5.5-5.5 5.5 5.5",
  term: "M4.5 5h15v14h-15zM8 10l2.5 2-2.5 2M12.5 15h3.5",
  file: "M6.5 3.5h7l4 4v13h-11zM13.5 3.5v4h4",
  pen: "M14.5 5.5l4 4L9 19H5v-4z",
  back: "M14.5 6.5L9 12l5.5 5.5",
  repeat: "M5 11V9.5A2.5 2.5 0 0 1 7.5 7H18M15.5 4.5 18 7l-2.5 2.5M19 13v1.5a2.5 2.5 0 0 1-2.5 2.5H6M8.5 19.5 6 17l2.5-2.5",
};
/** One icon of the drawn app (CL_ICON), for the slides that draw parts of it themselves. */
export const clIcon = (name, cls = "") => line(CL_ICON[name], cls);
const ui0 = (ui, key) => {
  if (!ui?.[key]) throw new Error(`the drawn Claude app needs claudeUi.${key} in deck-copy.json`);
  return ui[key];
};
/** The account avatar: the initial of the invented firm on a cloud disc (Claude's real avatar is dark: no ink fills here, V1). */
const avatar = (ui) => `<i class="cw-me">${esc(ui0(ui, "me").charAt(0))}</i>`;
/** The collapsed sidebar of the take windows: new chat (the clay disc), chats, Projects (on), artifacts, the account at the foot. */
const rail = (ui) =>
  `<div class="cw-rail fig" aria-hidden="true"><i class="cw-rail__new">${line(CL_ICON.plus)}</i><i>${line(CL_ICON.chat)}</i><i class="is-on">${line(CL_ICON.folder)}</i><i>${line(CL_ICON.shapes)}</i>${avatar(ui)}</div>`;
/** The full sidebar (the kit's project window): the same items with their names, the recent chats of the project, the account. */
const sidebar = (ui, recents = []) => {
  const nav = [["chat", "chats"], ["folder", "projects", true], ["shapes", "artifacts"]]
    .map(([icon, key, on]) => `<span class="cw-nav${on ? " is-on" : ""}">${line(CL_ICON[icon])}<span>${esc(ui0(ui, key))}</span></span>`)
    .join("");
  const recent = recents.length ? `<p class="cw-sec">${esc(ui0(ui, "recents"))}</p>${recents.map((x) => `<span class="cw-rec">${esc(x)}</span>`).join("")}` : "";
  return `<div class="cw-sbar fig" aria-hidden="true"><span class="cw-nav cw-nav--new"><i class="cw-rail__new">${line(CL_ICON.plus)}</i><span>${esc(ui0(ui, "newChat"))}</span></span>${nav}${recent}<span class="cw-acct">${avatar(ui)}<span>${esc(ui0(ui, "me"))}</span></span></div>`;
};
/**
 * The prompt box at the foot of the window, as in the app: the empty field ("Reply to Claude..."), and under it attach, tools,
 * the model of the recording with its menu chevron, and the clay send button. One figure cell.
 */
const composer = (ui, model) =>
  `<div class="cw-comp fig"><p class="cw-comp__f">${esc(ui0(ui, "reply"))}</p><div class="cw-comp__t"><i>${line(CL_ICON.plus)}</i><i>${line(CL_ICON.tools)}</i><i>${line(CL_ICON.clock)}</i>${model ? `<span class="cw-comp__m">${esc(model.replace(/^Claude /, ""))}${line(CL_ICON.chevD)}</span>` : ""}<b class="cw-send" aria-hidden="true">${line(CL_ICON.send)}</b></div></div>`;
/**
 * The window chrome, one figure cell: the three window lights, the sidebar button, the spark and the word "Claude", the crumbs
 * (the last one with its menu chevron), and on the right the Share button (or `tail`: a panel's own items, markup).
 */
const chrome = (ui, crumbs, { share = true, tail = "" } = {}) => {
  const parts = split(crumbs ?? "").filter(Boolean);
  const path = parts.map((x, i, all) => `<span class="cw-crumb${i === all.length - 1 ? " cw-crumb--now" : ""}">${i === 0 && all.length > 1 ? line(CL_ICON.folder, "cw-crumb__i") : ""}${esc(x)}${i === all.length - 1 ? line(CL_ICON.chevD, "cw-crumb__c") : ""}</span>`).join("");
  return `<div class="cw-bar fig"><span class="cw-dots" aria-hidden="true"><b></b><b></b><b></b></span><i class="cw-tg">${line(CL_ICON.side)}</i><span class="cw-brand-l">${spark()}<b>${esc(ui0(ui, "brand"))}</b></span>${path}${tail ? `<span class="cw-tail">${tail}</span>` : share && ui.share ? `<span class="cw-share">${esc(ui.share)}</span>` : ""}</div>`;
};

/** The model of a recorded take for the prompt box (null while no take is accepted: the box shows no model). */
export const takeModel = (take) => (take.rec ? modelName(take.rec.model) : null);

/** A small Claude panel (today's project card, watch's scheduled task): the chrome of the app around a body. */
export function claudePanel({ ui, crumbs, body, cls = "", share = false, tail = "" }) {
  return `<div class="cw cl-ui cl-panel${cls ? ` ${cls}` : ""}">${chrome(ui, crumbs, { share, tail })}<div class="cl-panel__b">${body}</div></div>`;
}

/**
 * The Claude window replica: the engine's .cw in Claude's own look (above): the chrome with the crumbs (class fig), the sidebar,
 * one thread and, when `model` is given (a recorded take), the prompt box with that model. `side` is "rail" (the collapsed
 * sidebar, Projects on: the take windows, so the recorded answers keep most of the width), "full" (the open sidebar with the
 * names and the project's `recents`: the kit's project window) or "none". `thread` is the markup of the items that live in it. The window is a drawing of Claude, never the product: the crumbs say "(invented)".
 * `plane` makes it slide up into its place during its press (a scene, REDESIGN-3 T6; flat since round 5).
 */
export function claudeWindow(it, { id, ui, crumbs, thread, model, side = "rail", recents, k = 0, out, zone = "w", win, cls = "", plane = false }) {
  if (!ui?.brand) throw new Error(`claudeWindow ${id}: the brand word comes from deck-copy.json (claudeUi.brand)`);
  // round 6: every window has the app's sidebar, collapsed to its rail on the take slides, open (with names) on the kit
  const foot = model === undefined ? "" : composer(ui, model);
  const bar = side === "full" ? sidebar(ui, recents) : side === "rail" ? rail(ui) : "";
  const body = `<div class="cw-body${bar ? ` cw-body--${side}` : " cw-body--nosidebar"}">${bar}<div class="cw-main${foot ? " cw-main--comp" : ""}"><div class="cw-thread tk-thread">${thread}</div>${foot}</div></div>`;
  const html = chrome(ui, crumbs) + body;
  // plane: the window slides up into its place (T6, lib/w05-fx.css .w05-plane; flat since round 5), a scene of its press
  if (plane) return it({ id, tag: "div", cls: `cw cl-ui tk-cw w05-plane${cls ? ` ${cls}` : ""}`, zone, k, out, win, fx: "none", attrs: "data-scene", html });
  return it({ id, tag: "div", cls: `cw cl-ui tk-cw${cls ? ` ${cls}` : ""}`, zone, k, out, win, html });
}

/* ── takes ───────────────────────────────────────────────────────────── */

/** Number placeholders of a key template that count up (S08 only): wrapped in their own spans. */
function keyHtml(template, vars, { count = [], k = 0 } = {}) {
  return String(template)
    .split(/(\{\w+\})/)
    .map((part) => {
      const m = /^\{(\w+)\}$/.exec(part);
      if (!m) return esc(part);
      const value = vars[m[1]];
      if (!count.includes(m[1])) return esc(value);
      return `<span class="tk-n" data-step="${k}" data-win=".3,1" data-fx="none" data-count="0,${Number(value)},0">${esc(value)}</span>`;
    })
    .join("");
}

/** The words "This run: ..." after the key: same, or what differs (at most two short phrases). */
function runPart(copy, diffs) {
  if (diffs.length === 0) return copy.same;
  const phrases = [...new Set(diffs.map((x) => fill(copy.diffs[x.code] ?? copy.diffs.answer, { got: x.got })))].slice(0, 2).join(", ");
  return fill(copy.diff, { diff: phrases });
}

/**
 * The grid of the scan scene: one cell per row Claude read. Columns and rows come from the count (693 is 33 by 21): the factor pair
 * nearest to a 3:2 field; a count with no such pair gets the next full field and the cells past the count are simply not counted.
 */
export function scanGrid(n) {
  let best = null;
  for (let rows = 8; rows <= 40; rows += 1) {
    if (n % rows) continue;
    const cols = n / rows;
    const ratio = cols / rows;
    if (ratio < 1.2 || ratio > 2.2) continue;
    if (!best || Math.abs(ratio - 1.55) < Math.abs(best.cols / best.rows - 1.55)) best = { cols, rows };
  }
  if (best) return best;
  const cols = Math.ceil(Math.sqrt(n * 1.55));
  return { cols, rows: Math.ceil(n / cols) };
}

/**
 * Where the finding marks sit on the scan grid: spread over the width (one column band each, so the band meets them one after
 * another) and over the height in a fixed shuffled order. Decorative only: a mark stands for one finding, not for a row number.
 */
export function markSpots(count, { cols, rows }) {
  const order = [3, 13, 7, 16, 2, 11, 5, 15, 9, 4, 12, 6, 14, 8];
  const band = (cols - 2) / count;
  return Array.from({ length: count }, (_, i) => ({
    col: Math.min(cols - 2, Math.round(1 + band * (i + 0.5))),
    row: Math.min(rows - 2, Math.max(1, Math.round(((order[i % order.length] + 0.5) / 18) * (rows - 1)))),
  }));
}

/** The scan scene of step 2 (left column): a counter that runs to the rows read, a field of one cell per row, a band that sweeps it, one mark per finding. */
export function scanScene(it, { c, d, k, zone, id, timeText }) {
  const t = c.take.scan;
  const grid = scanGrid(d.rowsRead);
  const spots = markSpots(d.findings.length, grid);
  const PITCH = 7;
  const from = 0.4;
  const marks = spots
    .map((m, i) => {
      const at = from + (1 - from) * ((m.col + 0.5) / grid.cols) * 0.92;
      return it({ tag: "i", cls: "scan__m", k, win: `${at.toFixed(3).replace(/^0/, "")},${Math.min(1, at + 0.12).toFixed(3).replace(/^0/, "")}`, attrs: `style="left:${m.col * PITCH + 1}px;top:${m.row * PITCH + 1}px"` });
    })
    .join("");
  const sweep = `<i class="w05-sweep" aria-hidden="true" data-step="${k}" data-win=".4,1" data-fx="none"></i>`;
  const num = (value) => it({ tag: "span", cls: "scan__v", k, fx: "none", win: ".4,1", count: `0,${value},0`, text: String(value) });
  const time = timeText ? `<p class="scan__t"><b>${esc(timeText)}</b><small>${esc(t.time)}</small></p>` : "";
  // the contrast with the week of slide 5, as a line under the counters (the evenings are the ones the week strip shows)
  const last = timeText ? `<p class="scan__last">${esc(t.last)}</p>` : "";
  const html = `<div class="scan__top"><p class="scan__n"><b>${num(d.rowsRead)}</b><small>${esc(t.rows)}</small></p>${time}</div>${last}<div class="scan__grid" style="width:${grid.cols * PITCH + 3}px;height:${grid.rows * PITCH + 3}px"><svg class="scan__tex" aria-hidden="true" focusable="false"><defs><pattern id="scan-cell" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse" x="3" y="3"><rect class="scan__cell" width="${PITCH - 3}" height="${PITCH - 3}"/></pattern></defs><rect width="100%" height="100%" fill="url(#scan-cell)"/></svg>${sweep}${marks}</div><p class="scan__lg"><em class="scan__k">${esc(t.key)}</em><i class="scan__m scan__m--key"></i><b>${num(d.findings.length)}</b><span>${esc(t.found)}</span><b>${esc(d.decoys.length)}</b><span>${esc(t.fine)}</span></p>`;
  return it({ id, tag: "div", cls: "scan fig", zone, k, win: ".3,.42", html, attrs: `role="img" aria-label="${esc(`${d.rowsRead} ${t.rows}, ${d.findings.length} ${t.found}, ${d.decoys.length} ${t.fine}`)}"` });
}

/** The status board of step 3 (left column): one tile per checklist line, full for COVERED, half for WEAK, empty for GAP, read from the take's own lines. */
export function statusBoard(it, { c, k, zone, id, out, turn, ms }) {
  const lines = statusLines(turn.final_text);
  if (!lines.length) return "";
  const word = c.take.status;
  const tally = { covered: 0, weak: 0, gap: 0 };
  for (const l of lines) tally[l.status] += 1;
  // each tile shows its status through a blank paper cover that fades (a scene of the press; flat since round 5)
  const tiles = lines.map((l, i) => it({ tag: "li", cls: `board__t board__t--${l.status} flip3`, k, fx: "none", win: rowWindow(i, ms, 0.35, 36, 0.3), attrs: "data-scene", html: `<span class="flip3__b" aria-hidden="true"></span><span class="flip3__f"><span>${esc(l.id)}</span></span>` })).join("");
  const legend = ["covered", "weak", "gap"].map((s) => `<span class="board__k board__k--${s}"><i></i><b>${tally[s]}</b> ${esc(word[s])}</span>`).join("");
  return it({ id, tag: "div", cls: "board fig", zone, k, out, win: ".3,.42", html: `<ul class="board__g">${tiles}</ul><p class="board__lg">${legend}</p>` });
}

/**
 * One recorded turn in the window and its chip and key line. `o`: { c, d, takes, key ("chain" or "register"), slot, k, ms,
 * ids: {take, chip, key}, zones: {take, chip, key}, out: {take, chip, key}, count (placeholders of the key line that run),
 * scan ({zone, id}: the scan scene of step 2), board ({zone, id, out}: the status board of step 3), head (show the first rows, not the last),
 * hit (highlight the first line that names a finding), hitRows (first cells of table rows to light), zoom (window in which the
 * table leans in on the lit rows), tools (show tool chips) }.
 * Returns { take, chip, key } as markup; the take goes into the window's thread, chip and key into the left column.
 * Without an accepted take the take is the labelled empty frame and the chip is left out.
 */
export function takeView(it, o) {
  const { c, d, takes, key, slot, k, ms, ids, zones, out = {} } = o;
  const copy = c.take;
  const rec = takes[key];
  const keyLine = fill(copy.key[o.keyName ?? slot], d.vars);
  if (!rec) {
    const buttons = copy.slotOpts.map((label) => `<span class="st__btn fig">${esc(label)}</span>`).join("");
    const frame = it({ id: ids.take, tag: "div", cls: "st__slot", zone: zones.take, k, out: out.take, html: `<p class="st__slot-t">${esc(copy.slot)}</p><div class="st__slot-b">${buttons}</div>` });
    const keyOnly = it({ id: ids.key, tag: "p", cls: "tk-key", zone: zones.key, k, out: out.key, html: keyHtml(keyLine, d.vars, { count: o.count, k }) });
    return { take: frame, chip: "", key: keyOnly, time: "", scan: "", board: "", rec: null };
  }
  const turn = turnOf(rec, key, slot);
  const diffs = compareWithKey(rec, slot);
  const entries = takeRows(turn.final_text, o.wrap);
  const hitAt = o.hit ? findingLine(entries) : -1;
  let row = 0;
  let fence = false;
  // The stagger runs per recorded line (at most 16): the wrapped parts of one line and the cells of a table row come in together.
  let item = 0;
  const rows = entries
    .map((e, index) => {
      if (e.kind === "table") {
        // hitRows: the rows the key line names (their first cell), lit so the room finds them at once (nothing edited)
        const trs = [e.header, ...e.body].map((r, i) => (row++, it({ tag: "tr", cls: i > 0 && o.hitRows?.includes(String(r[0]).trim()) ? "is-hit" : undefined, k, win: rowWindow(item++, ms), html: r.map((cell) => `<${i === 0 ? "th" : "td"}>${esc(cell)}</${i === 0 ? "th" : "td"}>`).join(""), attrs: `data-take="${rec.id}"` }))).join("");
        const table = `<table class="fig rec" data-take="${rec.id}"><tbody>${trs}</tbody></table>`;
        // zoom: once every row is in, the camera leans in on the lit rows and the others step back (a scene at the end of the press)
        return o.zoom && o.hitRows?.length ? `<div class="tk-zoom" data-step="${k}" data-win="${o.zoom}" data-fx="none">${table}</div>` : table;
      }
      const win = rowWindow(item++, ms);
      const kind = lineKind(e.line, fence);
      fence = kind.fence;
      // a script row of check.py ("L05 | rule | count | detail") is a four-column grid row: each cell a span, the pipes kept in
      // the page but not drawn (class pp), the spaces inside the cells, so the row's text is the recorded line
      const pipe = !kind.fence && PIPE_ROW.test(e.line);
      const marked = pipe
        ? markdownRows(e.rows).map((h) => `<span class="pc">${h.split(/(?<=\s)\|(?=\s)/).join('</span><span class="pp">|</span><span class="pc">')}</span>`)
        : markdownRows(e.rows).map((h) => (kind.fence || kind.cls === " is-fence" ? h : h.replace(/(^|\s)\|(?=\s|$)/g, '$1<span class="pp">|</span>')));
        // a script row whose count cell is 0 ("L13 | ... | 0 | No finding") is not a finding: it steps back (class is-nil)
        const nil = pipe && /^\s*0\s*$/.test(String(e.line.split(/(?<=\s)\|(?=\s)/)[2] ?? ""));
        return e.rows
        .map((text, part) => (row++, it({ tag: "p", cls: `out rec${kind.cls}${pipe ? " is-pipe" : ""}${nil ? " is-nil" : ""}${index === hitAt ? " is-hit" : ""}`, k, win, attrs: `data-take="${rec.id}" data-line="${index + 1}"${part ? " data-cont" : ""}`, html: marked[part] })))
        .join("");
    })
    .join("");
  const used = o.tools === false ? [] : toolsOf(turn);
  // a tool use is the app's compact chip: what ran, the words of the copy, the chevron that would open its details
  const tools = used.length ? `<p class="tk-tools fig">${used.map((t) => `<span class="tk-tool">${line(t === "file" ? CL_ICON.file : CL_ICON.term)}<span>${esc(copy.tool[t])}</span>${line(CL_ICON.chevR)}</span>`).join("")}</p>` : "";
  const made = o.files ? fileChips(o.recFiles ?? rec, "", { skip: o.skipFiles }) : "";
  // The answer is printed whole at 27 px. When it is taller than the window, the flow scrolls up with the rows as they come in
  // (the way a Claude window does, see .tk-flow in deck.css); nothing is cut, nothing is edited, and a hair line at the top of the window shows it.
  const flow = `<div class="tk-flow" data-step="${k}" data-win=".3,1" data-fx="none">${tools}${rows}${made}</div>`;
  const take = it({ id: ids.take, tag: "div", cls: `cw-answer tk${o.head ? " tk--head" : ""}`, zone: zones.take, k, out: out.take, win: ".3,.45", attrs: `data-take="${rec.id}"`, html: `${flow}` });
  const chip = it({ id: ids.chip, tag: "p", cls: "tk-chip fig", zone: zones.chip, k, out: out.chip, text: chipText(rec, d.lang, diffs.length > 0, copy) });
  const keyEl = it({ id: ids.key, tag: "p", cls: "tk-key", zone: zones.key, k, out: out.key, html: `${keyHtml(keyLine, d.vars, { count: o.count, k })} ${esc(runPart(copy, diffs))}` });
  // The measured time of the recorded turn (stats.duration_ms), shown only when the recording carries it, never estimated.
  const timeText = o.time || o.scan ? durationText(turn) : null;
  const time = !o.scan && timeText ? it({ id: o.time.id, tag: "p", cls: "tk-time fig", zone: o.time.zone, k, out: out.time, html: `<b>${esc(timeText)}</b><small>${esc(copy.time)}</small>` }) : "";
  const scan = o.scan ? scanScene(it, { c, d, k, zone: o.scan.zone, id: o.scan.id, timeText }) : "";
  const board = o.board ? statusBoard(it, { c, k, zone: o.board.zone, id: o.board.id, out: o.board.out, turn, ms }) : "";
  return { take, chip, key: keyEl, time, scan, board, rec, diffs, entries };
}


/** A word joined by hyphens (a date, an id like E-07) never breaks at its hyphen: a span holds it whole (the text is unchanged). */
const whole = (html) => html.replace(/(?<![\w&#;-])[\w/]+(?:-[\w/]+)+/g, (m) => `<span class="nobr">${m}</span>`);

/**
 * Display markup of the rows of one recorded line. **bold** is shown bold; the asterisks stay in the page (so the text is
 * the recorded text, character for character) but are not drawn (class md). A bold run that wraps onto the next row is closed
 * and opened again, nothing is added.
 */
export function markdownRows(rows) {
  let bold = false;
  return rows.map((text) => {
    let out = bold ? "<b>" : "";
    for (const part of String(text).split(/(\*\*)/)) {
      if (part === "**") {
        out += bold ? '</b><span class="md">**</span>' : '<span class="md">**</span><b>';
        bold = !bold;
      } else out += whole(esc(part));
    }
    return bold ? `${out}</b>` : out;
  });
}

/** What kind of line a recorded line is: a list item, a code fence, a line inside a fence. Returns the class and the new fence state. */
export function lineKind(line, inFence) {
  const trimmed = String(line).trim();
  if (trimmed.startsWith("```")) return { cls: " is-fence", fence: !inFence };
  if (inFence) return { cls: " is-code", fence: true };
  if (/^(\d+\.|-)\s/.test(trimmed)) return { cls: " is-li", fence: false };
  return { cls: "", fence: false };
}

/** The produced files of a take as chips (names from the recording), or the names the copy lists while there is none. */
export function fileChips(rec, fallback, { skip } = {}) {
  const fromRecording = rec?.produced_files?.length ? rec.produced_files.map((f) => String(f.name).split("/").pop()).filter((n) => !(skip && skip.test(n))) : [];
  const names = fromRecording.length ? fromRecording : fallback ? split(fallback) : [];
  if (!names.length) return "";
  return `<p class="tk-files fig">${names.map((n) => `<span class="cw-file">${line(CL_ICON.file, "cw-file__d")}<b>${esc(n)}</b><i>${esc((n.split(".").pop() ?? "").slice(0, 4))}</i></span>`).join("")}</p>`;
}

/** The first lines of a produced file, verbatim, from the stored copy beside the recording (empty when there is none). */
function firstLines(rec, file, n = 8) {
  if (!rec?.id || !file?.stored_as) return [];
  const where = path.join(TAKES_DIR, file.stored_as);
  if (!existsSync(where)) return [];
  return readFileSync(where, "utf8").split(/\r?\n/).filter((l) => l.trim() && !/^#?\s*(Fictional|Erfundenes)\b/i.test(l.trim())).slice(0, n);
}

/**
 * The produced files of a take as page previews (round 4): each page shows its name and its first recorded lines (verbatim, a
 * recorded line, outside our own copy scans) and opens in depth during press k, one after another (a 3D scene); the listed
 * names while there is no recording.
 */
export function filePreviews(rec, fallback, { skip, it, k = 0 } = {}) {
  // a long name may break only after _ - or . (never inside a word or a date part)
  const fromRecording = rec?.produced_files?.length ? rec.produced_files.filter((f) => !(skip && skip.test(String(f.name).split("/").pop()))) : [];
  // each page shows one key line big enough for the room (a table its first row); the full text stays in the take
  const key = (name, lines) => (/\.csv$/i.test(name) ? lines.slice(1, 2) : [lines.find((l) => /^(#+\s|Title:|Titel:)/.test(l.trim())) ?? lines[0]].filter(Boolean));
  const files = fromRecording.length ? fromRecording.map((f) => { const name = String(f.name).split("/").pop(); return { name, lines: key(name, firstLines(rec, f)) }; }) : fallback ? split(fallback).map((name) => ({ name, lines: [] })) : [];
  if (!files.length) return "";
  const page = (f, i) => {
    const body = f.lines.length ? f.lines.map((l) => `<p class="tk-prev__l" data-take="${esc(rec.id)}">${esc(l)}</p>`).join("") : "<i></i><i></i><i></i>";
    const html = `<b>${fileName(f.name)}</b><span class="tk-prev__b">${body}</span>`;
    return it ? it({ tag: "span", cls: "tk-prev", k, fx: "none", win: spread(i, files.length, 0.1, 0.5), attrs: "data-scene", html }) : `<span class="tk-prev">${html}</span>`;
  };
  return `<div class="tk-prevs fig">${files.map(page).join("")}</div>`;
}

/** A file name that may break only after _ - or / (never inside a word or a date part). */
// a file name breaks after "_", "/" or "-", but never inside a date ("2026-11-23" stays whole, its hyphens are no break)
export const fileName = (name) =>
  esc(name)
    .replace(/([_/]|(?<!\d)-|-(?!\d))/g, "$1<wbr>")
    .replace(/\d+(?:-\d+)+/g, (x) => `<span class="nobr">${x}</span>`);

/**
 * The kit files a prompt reads, as chips under the small prompt window (a figure cell): the prompt visibly works on files.
 * `pick(paths)` chooses them from d.kitPaths (the zip of this edition), so no file name is typed; the top folder is cut
 * except for a template the prompt names with its folder.
 */
export function promptInputs(it, d, { id = "in", zone = "in", k = 0, out, pick }) {
  const names = pick(d.kitPaths);
  if (!names.length) return "";
  // each file is a sheet of paper on the desk (an edge outline offset behind its face, no shadow) that stands up out of the
  // desk during the press (a 3D scene); when the press that reads them comes, they lie down again as they leave
  const items = names
    .map((p, i) => it({ tag: "li", k, fx: "none", win: spread(i, names.length, 0.15, 0.5), attrs: "data-scene", html: `<i class="pp__e" aria-hidden="true"></i><i class="pp__f" aria-hidden="true"></i>${icon(/\.csv$/.test(p) ? "spreadsheet" : "sheet")}<span>${fileName(p)}</span>` }))
    .join("");
  return it({ id, tag: "ul", cls: `tk-in tk-in--${Math.min(names.length, 14) > 6 ? "many" : "few"} fig`, zone, k, out, fx: "none", html: items });
}

/**
 * The camera on a Claude window (T6): a stepped wrapper that holds the window. Before its press it shows the window a little
 * back and tilted on its own plane (data-keep: visible at --p 0); during press k the camera moves in and the window comes flat
 * and forward, as the recorded answer streams into it. It takes the window's zone (and leaves with it: out); the window inside has none.
 */
export const dolly = (it, { id = "dolly", zone = "w", k, out, html }) => it({ id, tag: "div", cls: "tk-dolly", zone, k, out, fx: "none", attrs: "data-scene data-keep", html });
/** Path pickers for promptInputs: by top folder, by file name, by a name the prompt text carries. */
export const inFolder = (paths, folders, test = () => true) => paths.filter((p) => folders.includes(p.split("/")[0]) && test(p)).map((p) => p.split("/").slice(1).join("/"));
export const named = (paths, text) => {
  const said = new Set(String(text).match(/[\w./-]+\.(?:csv|md|txt)\b/g) ?? []);
  return paths.filter((p) => said.has(p) || said.has(p.split("/").pop()));
};

/** Four dots, the one of the current step filled: where we are in the four prompts. Label-free, so it sits in a figure cell. */
export const progress = (it, n, zone = "p") => it({ id: "prog", tag: "p", cls: "tk-prog fig", zone, attrs: `role="img" aria-label="${n} / 4"`, html: [1, 2, 3, 4].map((i) => `<i${i === n ? ' class="is-now"' : i < n ? ' class="is-done"' : ""}>${i}</i>`).join("") });
