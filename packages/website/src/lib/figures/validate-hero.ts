/**
 * Validation of the hero kinds (network, blocks, strip, curve, slope,
 * nulldist, field). The same rules as the older kinds, plus what these
 * figures promise: counts add up, ranks are a permutation, k = 5 holds for
 * every count (0 or at least 5), claims stay within 12 words, and nothing
 * names a firm.
 */

import { FIELD_MAX_SQUARES } from "./limits.ts";
import { arrayOf, fmt, isObject, itemsWithId, need, nonEmpty, numOrNull, type Json } from "./validate-core.ts";

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Words of the stage claim; the label budget is checked on the rendered figure. */
export const CLAIM_MAX_WORDS = 12;

function claim(data: Json): void {
  if (data["claim"] === undefined) return;
  need(typeof data["claim"] === "string" && (data["claim"] as string).trim() !== "", "data.claim", "must be a non-empty string");
  need(wordCount(data["claim"] as string) <= CLAIM_MAX_WORDS, "data.claim", `has more than ${CLAIM_MAX_WORDS} words`);
}

/** A count of firms, ads or draws: 0 or at least 5, never 1 to 4. */
function count(value: unknown, path: string): void {
  need(typeof value === "number" && Number.isInteger(value) && value >= 0, path, "must be a non-negative integer");
  need(!((value as number) >= 1 && (value as number) <= 4), path, "count between 1 and 4 (k = 5); pool it or use 0");
}

function variantIds(data: Json, list: unknown[], path: string): Set<string> {
  itemsWithId(list, path);
  const ids = new Set(list.map((v) => (v as Json)["id"] as string));
  for (const key of ["defaultVariant", "baseline"]) {
    if (data[key] !== undefined) need(typeof data[key] === "string" && ids.has(data[key] as string), `data.${key}`, "must be the id of a variant");
  }
  return ids;
}

function validateNetwork(data: Json): void {
  claim(data);
  const nodes = arrayOf(data, "nodes", "data");
  itemsWithId(nodes, "data.nodes");
  need(nodes.length <= 80, "data.nodes", "at most 80 nodes");
  const modules = arrayOf(data, "modules", "data");
  itemsWithId(modules, "data.modules");
  const moduleIds = new Set(modules.map((m) => (m as Json)["id"] as string));
  nodes.forEach((n, i) => {
    const node = n as Json;
    nonEmpty(node, "label", `data.nodes[${i}]`);
    need(finite(node["x"]) && (node["x"] as number) >= 0 && (node["x"] as number) <= 100, `data.nodes[${i}].x`, "must be 0 to 100");
    need(finite(node["y"]) && (node["y"] as number) >= 0 && (node["y"] as number) <= 100, `data.nodes[${i}].y`, "must be 0 to 100");
    need(moduleIds.has(String(node["module"])), `data.nodes[${i}].module`, "must be the id of a module");
  });
  need(nodes.filter((n) => (n as Json)["ki"] === true).length <= 1, "data.nodes", "at most one story node (ki)");
  const variants = arrayOf(data, "variants", "data");
  variantIds(data, variants, "data.variants");
  variants.forEach((v, i) => {
    const edges = (v as Json)["edges"];
    need(Array.isArray(edges), `data.variants[${i}].edges`, "must be an array");
    (edges as unknown[]).forEach((e, j) => {
      const path = `data.variants[${i}].edges[${j}]`;
      need(Array.isArray(e) && (e.length === 2 || e.length === 3), path, "must be [a, b] or [a, b, odds]");
      const [a, b, odds] = e as number[];
      need(Number.isInteger(a) && Number.isInteger(b) && (a as number) >= 0 && (b as number) >= 0 && (a as number) < nodes.length && (b as number) < nodes.length, path, "node index out of range");
      need(a !== b, path, "an edge joins two different nodes");
      if (odds !== undefined) need(finite(odds) && odds > 0, path, "odds ratio must be positive");
    });
  });
  if (data["neighbours"] !== undefined) {
    const ids = new Set(nodes.map((n) => (n as Json)["id"] as string));
    need(Array.isArray(data["neighbours"]), "data.neighbours", "must be an array");
    (data["neighbours"] as unknown[]).forEach((q, i) => {
      const nb = q as Json;
      need(ids.has(String(nb["node"])), `data.neighbours[${i}].node`, "must be a node id");
      for (const k of ["odds", "lo", "hi"]) need(finite(nb[k]), `data.neighbours[${i}].${k}`, "must be a finite number");
    });
  }
}

function validateBlocks(data: Json): void {
  claim(data);
  need(Number.isInteger(data["total"]) && (data["total"] as number) >= 5, "data.total", "must be an integer of at least 5");
  need(Number.isInteger(data["blocks"]) && (data["blocks"] as number) >= 1 && (data["blocks"] as number) <= 400, "data.blocks", "must be an integer from 1 to 400");
  nonEmpty(data, "unit", "data");
  const bins = arrayOf(data, "bins", "data");
  itemsWithId(bins, "data.bins");
  bins.forEach((b, i) => nonEmpty(b as Json, "label", `data.bins[${i}]`));
  const binIds = new Set(bins.map((b) => (b as Json)["id"] as string));
  need(binIds.has(String(data["finding"])), "data.finding", "must be the id of a bin");
  const variants = arrayOf(data, "variants", "data");
  variantIds(data, variants, "data.variants");
  variants.forEach((v, i) => {
    const counts = (v as Json)["counts"];
    need(isObject(counts), `data.variants[${i}].counts`, "must be an object");
    let sum = 0;
    for (const [id, value] of Object.entries(counts as Json)) {
      need(binIds.has(id), `data.variants[${i}].counts.${id}`, "is not a bin");
      count(value, `data.variants[${i}].counts.${id}`);
      sum += value as number;
    }
    need(sum === data["total"], `data.variants[${i}].counts`, `add up to ${sum}, not ${String(data["total"])}`);
  });
}

function validateValue(value: Json, path: string): void {
  numOrNull(value, "value", path);
  for (const k of ["lo", "hi"]) if (value[k] !== undefined) need(finite(value[k]), `${path}.${k}`, "must be a finite number");
  if (value["value"] === null) {
    need(value["lo"] === undefined && value["hi"] === undefined, path, "a suppressed value carries no interval");
  } else if (finite(value["lo"]) && finite(value["hi"])) {
    need((value["lo"] as number) <= (value["value"] as number) && (value["value"] as number) <= (value["hi"] as number), path, "lo <= value <= hi");
  }
  if (value["n"] !== undefined) need(Number.isInteger(value["n"]) && (value["n"] as number) >= 5, `${path}.n`, "n must be an integer of at least 5");
  if (value["hits"] !== undefined && value["hits"] !== null) count(value["hits"], `${path}.hits`);
}

function validateStrip(data: Json): void {
  claim(data);
  fmt(data, "data");
  need(data["scale"] === "linear" || data["scale"] === "log", "data.scale", "must be linear or log");
  const layers = arrayOf(data, "layers", "data");
  itemsWithId(layers, "data.layers");
  layers.forEach((l, i) => {
    nonEmpty(l as Json, "label", `data.layers[${i}]`);
    need(["square", "diamond", "ring", "bar"].includes(String((l as Json)["shape"])), `data.layers[${i}].shape`, "unknown shape");
    need(["ink", "accent", "grey"].includes(String((l as Json)["tone"])), `data.layers[${i}].tone`, "unknown tone");
  });
  const layerIds = new Set(layers.map((l) => (l as Json)["id"] as string));
  if (data["finding"] !== undefined) need(layerIds.has(String(data["finding"])), "data.finding", "must be the id of a layer");
  let variantSet = new Set<string>();
  if (data["variants"] !== undefined) {
    need(Array.isArray(data["variants"]), "data.variants", "must be an array");
    variantSet = variantIds(data, data["variants"] as unknown[], "data.variants");
  }
  const rows = arrayOf(data, "rows", "data");
  itemsWithId(rows, "data.rows");
  rows.forEach((r, i) => {
    nonEmpty(r as Json, "label", `data.rows[${i}]`);
    const marks = (r as Json)["marks"];
    need(Array.isArray(marks) && marks.length > 0, `data.rows[${i}].marks`, "must be a non-empty array");
    (marks as unknown[]).forEach((m, j) => {
      const path = `data.rows[${i}].marks[${j}]`;
      need(isObject(m), path, "must be an object");
      const mark = m as Json;
      need(layerIds.has(String(mark["layer"])), `${path}.layer`, "must be the id of a layer");
      validateValue(mark, path);
      if (data["scale"] === "log" && finite(mark["value"])) need((mark["value"] as number) > 0, `${path}.value`, "log axis needs positive values");
      if (mark["by"] !== undefined) {
        need(isObject(mark["by"]), `${path}.by`, "must be an object");
        for (const [id, v] of Object.entries(mark["by"] as Json)) {
          need(variantSet.has(id), `${path}.by.${id}`, "is not a variant");
          need(isObject(v), `${path}.by.${id}`, "must be an object");
          validateValue(v as Json, `${path}.by.${id}`);
        }
      }
    });
  });
}

function validateCurve(data: Json): void {
  claim(data);
  fmt(data, "data");
  const points = arrayOf(data, "points", "data");
  itemsWithId(points, "data.points");
  need(points.length >= 2, "data.points", "needs at least 2 points");
  points.forEach((q, i) => {
    nonEmpty(q as Json, "label", `data.points[${i}]`);
    validateValue(q as Json, `data.points[${i}]`);
  });
  const ids = new Set(points.map((q) => (q as Json)["id"] as string));
  if (data["defaultVariant"] !== undefined) need(ids.has(String(data["defaultVariant"])), "data.defaultVariant", "must be the id of a point");
  if (data["panel"] !== undefined) {
    need(isObject(data["panel"]), "data.panel", "must be an object");
    const panel = data["panel"] as Json;
    nonEmpty(panel, "title", "data.panel");
    fmt(panel, "data.panel");
    const rows = arrayOf(panel, "rows", "data.panel");
    itemsWithId(rows, "data.panel.rows");
    rows.forEach((r, i) => {
      nonEmpty(r as Json, "label", `data.panel.rows[${i}]`);
      need(finite((r as Json)["value"]), `data.panel.rows[${i}].value`, "must be a finite number");
    });
  }
}

function validateSlope(data: Json): void {
  claim(data);
  fmt(data, "data");
  nonEmpty(data, "aLabel", "data");
  nonEmpty(data, "bLabel", "data");
  const items = data["items"];
  need(Number.isInteger(items) && (items as number) >= 20, "data.items", "must be an integer of at least 20");
  need(Number.isInteger(data["top"]) && (data["top"] as number) >= 5 && (data["top"] as number) < (items as number), "data.top", "must be an integer from 5 to items - 1");
  const top = (t: unknown, path: string): void => {
    need(isObject(t), path, "must be an object");
    for (const k of ["a", "b"]) need(finite((t as Json)[k]), `${path}.${k}`, "must be a finite number");
    for (const k of ["lo", "hi"]) if ((t as Json)[k] !== undefined) need(finite((t as Json)[k]), `${path}.${k}`, "must be a finite number");
  };
  top(data["pooled"], "data.pooled");
  need(isObject(data["chance"]), "data.chance", "must be an object");
  for (const k of ["mean", "lo", "hi"]) need(finite((data["chance"] as Json)[k]), `data.chance.${k}`, "must be a finite number");
  const splits = arrayOf(data, "splits", "data");
  variantIds(data, splits, "data.splits");
  splits.forEach((s, i) => {
    const path = `data.splits[${i}]`;
    nonEmpty(s as Json, "label", path);
    const ranks = (s as Json)["rankB"];
    need(Array.isArray(ranks) && ranks.length === items, `${path}.rankB`, "needs one rank per item");
    const seen = new Set<number>();
    for (const r of ranks as unknown[]) {
      need(Number.isInteger(r) && (r as number) >= 1 && (r as number) <= (items as number) && !seen.has(r as number), `${path}.rankB`, "must be a permutation of 1 to items");
      seen.add(r as number);
    }
    top((s as Json)["top"], `${path}.top`);
  });
}

function validateNulldist(data: Json): void {
  claim(data);
  fmt(data, "data");
  need(Number.isInteger(data["draws"]) && (data["draws"] as number) > 0, "data.draws", "must be a positive integer");
  need(isObject(data["observed"]), "data.observed", "must be an object");
  const observed = data["observed"] as Json;
  need(finite(observed["value"]), "data.observed.value", "must be a finite number");
  nonEmpty(observed, "label", "data.observed");
  const variants = arrayOf(data, "variants", "data");
  variantIds(data, variants, "data.variants");
  variants.forEach((v, i) => {
    const path = `data.variants[${i}]`;
    nonEmpty(v as Json, "label", path);
    need(Number.isInteger((v as Json)["n"]) && ((v as Json)["n"] as number) >= 5, `${path}.n`, "n must be an integer of at least 5");
    const band = (v as Json)["band"] as Json;
    need(isObject(band) && finite(band["lo"]) && finite(band["hi"]) && (band["lo"] as number) < (band["hi"] as number), `${path}.band`, "needs lo < hi");
    const bins = (v as Json)["bins"];
    need(Array.isArray(bins) && bins.length >= 3, `${path}.bins`, "needs at least 3 bins");
    let sum = 0;
    (bins as unknown[]).forEach((b, j) => {
      const bin = b as Json;
      need(finite(bin["lo"]) && finite(bin["hi"]) && (bin["lo"] as number) < (bin["hi"] as number), `${path}.bins[${j}]`, "needs lo < hi");
      need(Number.isInteger(bin["draws"]) && (bin["draws"] as number) >= 0, `${path}.bins[${j}].draws`, "must be a non-negative integer");
      sum += bin["draws"] as number;
    });
    need(sum === data["draws"], `${path}.bins`, `hold ${sum} draws, not ${String(data["draws"])}`);
  });
  const words = arrayOf(data, "words", "data");
  itemsWithId(words, "data.words");
  words.forEach((w, i) => {
    nonEmpty(w as Json, "label", `data.words[${i}]`);
    need(finite((w as Json)["ratio"]) && ((w as Json)["ratio"] as number) > 0, `data.words[${i}].ratio`, "must be a positive number");
  });
  if (data["focusWord"] !== undefined) need(words.some((w) => (w as Json)["id"] === data["focusWord"]), "data.focusWord", "must be the id of a word");
}

function validateField(data: Json): void {
  const classes = arrayOf(data, "classes", "data");
  itemsWithId(classes, "data.classes");
  classes.forEach((c, i) => {
    nonEmpty(c as Json, "label", `data.classes[${i}]`);
    need(["ink", "accent", "leinen", "ghost"].includes(String((c as Json)["tone"])), `data.classes[${i}].tone`, "unknown tone");
  });
  const classIds = new Set(classes.map((c) => (c as Json)["id"] as string));
  const scenes = arrayOf(data, "scenes", "data");
  itemsWithId(scenes, "data.scenes");
  scenes.forEach((s, i) => {
    const path = `data.scenes[${i}]`;
    const scene = s as Json;
    nonEmpty(scene, "population", path);
    nonEmpty(scene, "unit", path);
    need(Number.isInteger(scene["base"]) && (scene["base"] as number) >= 5, `${path}.base`, "must be an integer of at least 5");
    need(Number.isInteger(scene["squares"]) && (scene["squares"] as number) >= 5 && (scene["squares"] as number) <= FIELD_MAX_SQUARES, `${path}.squares`, `must be an integer from 5 to ${FIELD_MAX_SQUARES}`);
    need(scene["layout"] === "grid" || scene["layout"] === "bins", `${path}.layout`, "must be grid or bins");
    if (scene["claim"] !== undefined) {
      need(typeof scene["claim"] === "string" && wordCount(scene["claim"] as string) <= CLAIM_MAX_WORDS, `${path}.claim`, `must be a string of at most ${CLAIM_MAX_WORDS} words`);
    }
    if (scene["numeral"] !== undefined) {
      const num = scene["numeral"] as Json;
      need(isObject(num) && finite(num["value"]), `${path}.numeral.value`, "must be a finite number");
      fmt(num, `${path}.numeral`);
    }
    const bins = arrayOf(scene, "bins", path);
    itemsWithId(bins, `${path}.bins`);
    let sum = 0;
    bins.forEach((b, j) => {
      const segs = (b as Json)["segments"];
      need(Array.isArray(segs) && segs.length > 0, `${path}.bins[${j}].segments`, "must be a non-empty array");
      (segs as unknown[]).forEach((seg, q) => {
        const sp = `${path}.bins[${j}].segments[${q}]`;
        need(isObject(seg), sp, "must be an object");
        need(classIds.has(String((seg as Json)["cls"])), `${sp}.cls`, "must be the id of a class");
        count((seg as Json)["count"], `${sp}.count`);
        sum += (seg as Json)["count"] as number;
      });
    });
    need(sum === scene["base"], `${path}.bins`, `segments add up to ${sum}, not the base ${String(scene["base"])}`);
    if (scene["labelClasses"] !== undefined) {
      need(Array.isArray(scene["labelClasses"]) && (scene["labelClasses"] as unknown[]).every((id) => classIds.has(String(id))), `${path}.labelClasses`, "must list class ids");
    }
  });
}

/** Validates the data of one hero kind; throws FigureSpecError. */
export function validateHero(kind: string, data: Json): void {
  switch (kind) {
    case "network": return validateNetwork(data);
    case "blocks": return validateBlocks(data);
    case "strip": return validateStrip(data);
    case "curve": return validateCurve(data);
    case "slope": return validateSlope(data);
    case "nulldist": return validateNulldist(data);
    case "field": return validateField(data);
    default: return undefined;
  }
}
