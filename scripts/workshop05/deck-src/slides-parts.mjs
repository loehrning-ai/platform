/**
 * Pieces the slides share: icons, poll buttons, the collapsed kit prompt, the Claude window replica and the recorded
 * take (or, while no take is accepted, the labelled empty frame). Nothing here is typed copy: every visible word comes
 * from deck-copy.json, every number from data.mjs, every take line from a recording (take.mjs).
 */
import { esc, fill, rowWindow, spread } from "./motion.mjs";
import { durationText, icon } from "./scene.mjs";
import { chipText, compareWithKey, findingLine, statusLines, takeRows, toolsOf, turnOf } from "./take.mjs";

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

/**
 * The Claude window replica: the engine's .cw, its bar with the crumbs (chrome, class fig) and one thread. `thread` is the
 * markup of the items that live in it. The window is a drawing of Claude, never the product: the crumbs say "(invented)".
 * `plane` makes it slide in on its own depth plane during its press (a scene, REDESIGN-3 T6).
 */
export function claudeWindow(it, { id, crumbs, thread, k = 0, out, zone = "w", win, cls = "", plane = false }) {
  const bar = `<div class="cw-bar fig"><span class="cw-dots" aria-hidden="true"><b></b><b></b><b></b></span>${split(crumbs).map((x, i, all) => `<span class="cw-crumb${i === all.length - 1 ? " cw-crumb--now" : ""}">${esc(x)}</span>`).join("")}</div>`;
  const body = `<div class="cw-body cw-body--nosidebar"><div class="cw-main"><div class="cw-thread tk-thread">${thread}</div></div></div>`;
  // plane: the window slides in on its own depth (T6, lib/w05-fx.css .w05-plane), a 3D scene of its press
  if (plane) return it({ id, tag: "div", cls: `cw tk-cw w05-plane${cls ? ` ${cls}` : ""}`, zone, k, out, win, fx: "none", attrs: "data-scene", html: bar + body });
  return it({ id, tag: "div", cls: `cw tk-cw${cls ? ` ${cls}` : ""}`, zone, k, out, win, html: bar + body });
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
  const PITCH = 6;
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
  // each tile turns over from a blank card to its status (a 3D scene of the press, REDESIGN-3 step slides)
  const tiles = lines.map((l, i) => it({ tag: "li", cls: `board__t board__t--${l.status} flip3`, k, fx: "none", win: rowWindow(i, ms, 0.35, 36, 0.3), attrs: "data-scene", html: `<span class="flip3__b" aria-hidden="true"></span><span class="flip3__f"><span>${esc(l.id)}</span></span>` })).join("");
  const legend = ["covered", "weak", "gap"].map((s) => `<span class="board__k board__k--${s}"><i></i><b>${tally[s]}</b> ${esc(word[s])}</span>`).join("");
  return it({ id, tag: "div", cls: "board fig", zone, k, out, win: ".3,.42", html: `<ul class="board__g w05-s3d">${tiles}</ul><p class="board__lg">${legend}</p>` });
}

/**
 * One recorded turn in the window and its chip and key line. `o`: { c, d, takes, key ("chain" or "register"), slot, k, ms,
 * ids: {take, chip, key}, zones: {take, chip, key}, out: {take, chip, key}, count (placeholders of the key line that run),
 * scan ({zone, id}: the scan scene of step 2), board ({zone, id, out}: the status board of step 3), head (show the first rows, not the last),
 * hit (highlight the first line that names a finding), tools (show tool chips) }.
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
  const entries = takeRows(turn.final_text);
  const hitAt = o.hit ? findingLine(entries) : -1;
  let row = 0;
  let fence = false;
  // The stagger runs per recorded line (at most 16): the wrapped parts of one line and the cells of a table row come in together.
  let item = 0;
  const rows = entries
    .map((e, index) => {
      if (e.kind === "table") {
        const trs = [e.header, ...e.body].map((r, i) => (row++, it({ tag: "tr", k, win: rowWindow(item++, ms), html: r.map((cell) => `<${i === 0 ? "th" : "td"}>${esc(cell)}</${i === 0 ? "th" : "td"}>`).join(""), attrs: `data-take="${rec.id}"` }))).join("");
        return `<table class="fig rec" data-take="${rec.id}"><tbody>${trs}</tbody></table>`;
      }
      const win = rowWindow(item++, ms);
      const kind = lineKind(e.line, fence);
      fence = kind.fence;
      // a pipe between words (check.py prints "L05 | rule | count | detail") is drawn as a column divider; the text stays verbatim
      const marked = markdownRows(e.rows).map((h) => (kind.fence || kind.cls === " is-fence" ? h : h.replace(/(^|\s)\|(?=\s|$)/g, '$1<span class="pp">|</span>')));
      return e.rows
        .map((text, part) => (row++, it({ tag: "p", cls: `out rec${kind.cls}${index === hitAt ? " is-hit" : ""}`, k, win, attrs: `data-take="${rec.id}" data-line="${index + 1}"${part ? " data-cont" : ""}`, html: marked[part] })))
        .join("");
    })
    .join("");
  const used = o.tools === false ? [] : toolsOf(turn);
  const tools = used.length ? `<p class="tk-tools fig">${used.map((t) => `<span class="tk-tool">${esc(copy.tool[t])}</span>`).join("")}</p>` : "";
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
      } else out += esc(part);
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
  return `<p class="tk-files fig">${names.map((n) => `<span class="cw-file"><i>${esc((n.split(".").pop() ?? "").slice(0, 4))}</i><b>${esc(n)}</b></span>`).join("")}</p>`;
}

/** The produced files of a take as small page previews (a sheet with three lines and the file name), or the listed names. */
export function filePreviews(rec, fallback, { skip } = {}) {
  // a long name may break only after _ - or . (never inside a word or a date part)
  const fromRecording = rec?.produced_files?.length ? rec.produced_files.map((f) => String(f.name).split("/").pop()).filter((n) => !(skip && skip.test(n))) : [];
  const names = fromRecording.length ? fromRecording : fallback ? split(fallback) : [];
  if (!names.length) return "";
  return `<div class="tk-prevs fig">${names.map((n) => `<span class="tk-prev"><i></i><i></i><i></i><b>${fileName(n)}</b></span>`).join("")}</div>`;
}

/** A file name that may break only after _ - or / (never inside a word or a date part). */
export const fileName = (name) => esc(name).replace(/([_/-])/g, "$1<wbr>");

/**
 * The kit files a prompt reads, as chips under the small prompt window (a figure cell): the prompt visibly works on files.
 * `pick(paths)` chooses them from d.kitPaths (the zip of this edition), so no file name is typed; the top folder is cut
 * except for a template the prompt names with its folder.
 */
export function promptInputs(it, d, { id = "in", zone = "in", k = 0, out, pick }) {
  const names = pick(d.kitPaths);
  if (!names.length) return "";
  const items = names
    .map((p, i) => it({ tag: "li", k, win: spread(i, names.length, 0.25, 0.45), html: `${icon(/\.csv$/.test(p) ? "spreadsheet" : "sheet")}<span>${fileName(p)}</span>` }))
    .join("");
  return it({ id, tag: "ul", cls: `tk-in tk-in--${Math.min(names.length, 14) > 6 ? "many" : "few"} fig`, zone, k, out, fx: "none", html: items });
}
/** Path pickers for promptInputs: by top folder, by file name, by a name the prompt text carries. */
export const inFolder = (paths, folders, test = () => true) => paths.filter((p) => folders.includes(p.split("/")[0]) && test(p)).map((p) => p.split("/").slice(1).join("/"));
export const named = (paths, text) => {
  const said = new Set(String(text).match(/[\w./-]+\.(?:csv|md|txt)\b/g) ?? []);
  return paths.filter((p) => said.has(p) || said.has(p.split("/").pop()));
};

/** Four dots, the one of the current step filled: where we are in the four prompts. Label-free, so it sits in a figure cell. */
export const progress = (it, n, zone = "p") => it({ id: "prog", tag: "p", cls: "tk-prog fig", zone, attrs: `role="img" aria-label="${n} / 4"`, html: [1, 2, 3, 4].map((i) => `<i${i === n ? ' class="is-now"' : i < n ? ' class="is-done"' : ""}>${i}</i>`).join("") });
