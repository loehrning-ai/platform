/**
 * The JSON of slide "xray" (<script type="application/json" id="w05-matrix">), built from the oracle output.
 * build.mjs calls matrixData(files, copy) once per edition and writes JSON.stringify(result) into the HTML.
 * Everything numeric comes from oracle.mjs; the words come from `copy` (deck-copy.json), never from here.
 * The three what-if states are real oracle runs on three modified inputs, embedded so the page needs no runtime parsing.
 */
import { analyse, counter, whatIf } from "../oracle/oracle.mjs";

export const WHATIF_KINDS = ["e08-nine-hours", "ticks-filled", "no-free-day-move"];

/** Two letters at most, uppercase: "purchasing and accounts clerk" gives "PA". */
export function initials(title) {
  return String(title)
    .split(/\s+/)
    .filter((word) => word && word.toLowerCase() !== "and")
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

/** The id shown in the flag: F3 gives "3", F3b gives "3b", the amber line W1 stays "W1". */
export function flagLabel(id) {
  return id.startsWith("F") ? id.slice(1) : id;
}

function copyFor(copy, id) {
  const table = copy?.flags || {};
  return table[id] || table[id.replace(/b$/, "")] || {};
}

function flagOf(item, tone, copy, wholeFirmLines) {
  const text = copyFor(copy, item.id);
  return {
    n: flagLabel(item.id),
    id: item.id,
    line: item.line,
    people: item.people,
    wholeFirm: wholeFirmLines.has(item.line) && item.people.length === 0,
    tone,
    label: text.label || "",
    rule: text.rule || "",
    fine: text.fine || "",
    fix: text.fix || "",
  };
}

/** One matrix state: the cells and the flags (findings red, amber lines amber) of one analyse() result. */
export function stateOf(result, copy) {
  const wholeFirmLines = new Set(result.matrix.clusters.filter((c) => c.wholeFirm).map((c) => c.line));
  const flags = [
    ...result.findings.map((f) => flagOf(f, "red", copy, wholeFirmLines)),
    ...result.warnings.map((w) => flagOf(w, "amber", copy, wholeFirmLines)),
  ];
  return { counter: counter(result), cells: result.matrix.cells, flags };
}

/**
 * @param {Record<string,string>} files the 14 oracle inputs ({file name: text})
 * @param {{labels?: string[], titles?: string[], flags?: Record<string,{label,rule,fine,fix}>, text?: Record<string,string>}} copy
 */
export function matrixData(files, copy = {}) {
  const base = analyse(files);
  const lines = base.matrix.lineIds;
  const baseState = stateOf(base, copy);
  const whatifStates = WHATIF_KINDS.map((id) => {
    const input = whatIf(files, id);
    return { id, ...stateOf(analyse(input.files, input.options), copy) };
  });
  return {
    lines,
    labels: copy.labels || base.lines.map((line) => line.label),
    people: base.matrix.personIds,
    titles: copy.titles || base.matrix.titles.map(initials),
    cells: baseState.cells,
    flags: baseState.flags,
    counter: baseState.counter,
    files: Object.entries(base.rowsByFile).map(([name, rows]) => ({ name, rows })),
    rowsRead: base.rowsRead,
    checkedClusters: base.decoys.length,
    whatif: whatifStates,
    text: copy.text || {},
  };
}
