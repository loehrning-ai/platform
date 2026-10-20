/**
 * Spec validation and the privacy gate of the engine. A spec that fails here
 * never reaches the public repo: no count of 1 to 4, no per-firm values, no
 * contact data, no paths, no retired brand.
 */

import { FIGURE_KINDS, type FigureKind, type FigureSpec } from "./types.ts";
import { validateHero } from "./validate-hero.ts";
import { COUNT_KEYS, FigureSpecError, arrayOf, fmt, isObject, itemsWithId, need, nonEmpty, numOrNull, type Json } from "./validate-core.ts";

export { FigureSpecError };

function validateMeta(meta: unknown): void {
  need(isObject(meta), "spec.meta", "must be an object");
  const m = meta as Json;
  if (m["values"] !== undefined) {
    need(isObject(m["values"]), "spec.meta.values", "must be an object");
    for (const [key, entry] of Object.entries(m["values"] as Json)) {
      const path = `spec.meta.values.${key}`;
      need(/^[a-z0-9][a-z0-9_]*$/.test(key), path, "token names use lower-case letters, digits and _");
      need(isObject(entry), path, "must be an object");
      const e = entry as Json;
      need(e["ref"] !== undefined || typeof e["value"] === "number", path, "needs a value or a ref");
      for (const field of ["value", "lo", "hi", "n"]) {
        if (e[field] !== undefined) need(typeof e[field] === "number" && Number.isFinite(e[field]), `${path}.${field}`, "must be a finite number");
      }
      if (e["ref"] !== undefined) need(typeof e["ref"] === "string" && e["ref"] !== "", `${path}.ref`, "must be an element id");
      if (e["fmt"] !== undefined) fmt(e, path);
    }
  }
  if (m["aliases"] !== undefined) {
    need(isObject(m["aliases"]), "spec.meta.aliases", "must be an object");
    for (const [key, target] of Object.entries(m["aliases"] as Json)) {
      need(/^[a-z0-9][a-z0-9_]*$/.test(key), `spec.meta.aliases.${key}`, "token names use lower-case letters, digits and _");
      need(typeof target === "string" && target !== "", `spec.meta.aliases.${key}`, "must be an element id");
    }
  }
}

export function parseFigureSpec(raw: unknown): FigureSpec {
  need(isObject(raw), "spec", "must be an object");
  for (const key of ["id", "title", "alt", "caption", "source", "asOf", "limitation"]) nonEmpty(raw, key, "spec");
  need(/^[a-z0-9][a-z0-9_-]*$/i.test(String(raw["id"])), "spec.id", "use letters, digits, - and _");
  need(/^\d{4}-\d{2}-\d{2}$/.test(String(raw["asOf"])), "spec.asOf", "must be an ISO date");
  need(Number.isInteger(raw["n"]) && (raw["n"] as number) >= 0, "spec.n", "must be a non-negative integer");
  need(FIGURE_KINDS.includes(raw["kind"] as FigureKind), "spec.kind", `must be one of ${FIGURE_KINDS.join(", ")}`);
  need(isObject(raw["data"]), "spec.data", "must be an object");
  const data = raw["data"] as Json;
  const kind = raw["kind"] as FigureKind;

  if (raw["steps"] !== undefined) {
    need(Array.isArray(raw["steps"]), "spec.steps", "must be an array");
    itemsWithId(raw["steps"] as unknown[], "spec.steps");
  }

  if (raw["meta"] !== undefined) validateMeta(raw["meta"]);
  if (raw["annotation"] !== undefined) {
    need(isObject(raw["annotation"]), "spec.annotation", "must be an object");
    nonEmpty(raw["annotation"] as Json, "id", "spec.annotation");
    nonEmpty(raw["annotation"] as Json, "text", "spec.annotation");
  }

  switch (kind) {
    case "waffle": {
      need(Number.isInteger(data["total"]) && (data["total"] as number) > 0, "data.total", "must be a positive integer");
      const groups = arrayOf(data, "groups", "data");
      itemsWithId(groups, "data.groups");
      let sum = 0;
      groups.forEach((g, i) => {
        const item = g as Json;
        nonEmpty(item, "label", `data.groups[${i}]`);
        need(Number.isInteger(item["dots"]) && (item["dots"] as number) >= 0, `data.groups[${i}].dots`, "must be a non-negative integer");
        need(["accent", "ink", "ring", "light"].includes(String(item["tone"])), `data.groups[${i}].tone`, "unknown tone");
        sum += item["dots"] as number;
      });
      need(sum <= (data["total"] as number), "data.groups", "dots exceed total");
      break;
    }
    case "bars": {
      fmt(data, "data");
      const items = arrayOf(data, "items", "data");
      itemsWithId(items, "data.items");
      items.forEach((it, i) => { nonEmpty(it as Json, "label", `data.items[${i}]`); numOrNull(it as Json, "value", `data.items[${i}]`); });
      break;
    }
    case "dotplot": {
      fmt(data, "data");
      const items = arrayOf(data, "items", "data");
      itemsWithId(items, "data.items");
      items.forEach((it, i) => { nonEmpty(it as Json, "label", `data.items[${i}]`); numOrNull(it as Json, "value", `data.items[${i}]`); });
      break;
    }
    case "tilemap": {
      fmt(data, "data");
      const tiles = arrayOf(data, "tiles", "data");
      itemsWithId(tiles, "data.tiles");
      tiles.forEach((t, i) => numOrNull(t as Json, "value", `data.tiles[${i}]`));
      break;
    }
    case "funnel": {
      fmt(data, "data");
      need(typeof data["overall"] === "number", "data.overall", "must be a number");
      const points = arrayOf(data, "points", "data");
      itemsWithId(points, "data.points");
      points.forEach((pt, i) => {
        need(typeof (pt as Json)["n"] === "number" && ((pt as Json)["n"] as number) >= 5, `data.points[${i}].n`, "must be a number of at least 5");
        need(typeof (pt as Json)["value"] === "number", `data.points[${i}].value`, "must be a number");
      });
      break;
    }
    case "dumbbell": {
      fmt(data, "data");
      nonEmpty(data, "aLabel", "data");
      nonEmpty(data, "bLabel", "data");
      const rows = arrayOf(data, "rows", "data");
      itemsWithId(rows, "data.rows");
      rows.forEach((r, i) => { numOrNull(r as Json, "a", `data.rows[${i}]`); numOrNull(r as Json, "b", `data.rows[${i}]`); });
      break;
    }
    case "lorenz": {
      nonEmpty(data, "xLabel", "data");
      nonEmpty(data, "yLabel", "data");
      const pts = arrayOf(data, "points", "data");
      pts.forEach((pt, i) => need(Array.isArray(pt) && pt.length === 2 && pt.every((v) => typeof v === "number"), `data.points[${i}]`, "must be [x, y]"));
      need(pts.length >= 3, "data.points", "needs at least 3 points");
      break;
    }
    case "waterfall": {
      fmt(data, "data");
      const items = arrayOf(data, "items", "data");
      itemsWithId(items, "data.items");
      items.forEach((it, i) => {
        need(["total", "delta"].includes(String((it as Json)["kind"])), `data.items[${i}].kind`, "must be total or delta");
        need(typeof (it as Json)["value"] === "number", `data.items[${i}].value`, "must be a number");
      });
      break;
    }
    case "ladder": {
      fmt(data, "data");
      const rungs = arrayOf(data, "rungs", "data");
      itemsWithId(rungs, "data.rungs");
      rungs.forEach((r, i) => { need(typeof (r as Json)["value"] === "number", `data.rungs[${i}].value`, "must be a number"); nonEmpty(r as Json, "definition", `data.rungs[${i}]`); });
      break;
    }
    case "timeline": {
      const events = arrayOf(data, "events", "data");
      itemsWithId(events, "data.events");
      events.forEach((e, i) => {
        need(/^\d{4}-\d{2}-\d{2}$/.test(String((e as Json)["date"])), `data.events[${i}].date`, "must be an ISO date");
        need(["gilt", "kommt", "offen"].includes(String((e as Json)["status"])), `data.events[${i}].status`, "must be gilt, kommt or offen");
      });
      break;
    }
    case "network":
    case "blocks":
    case "strip":
    case "curve":
    case "slope":
    case "nulldist":
    case "field":
      validateHero(kind, data);
      break;
    case "iceberg": {
      fmt(data, "data");
      for (const key of ["visible", "total"]) {
        need(isObject(data[key]) && typeof (data[key] as Json)["value"] === "number", `data.${key}.value`, "must be a number");
      }
      need(((data["total"] as Json)["value"] as number) > ((data["visible"] as Json)["value"] as number), "data.total.value", "must exceed visible");
      nonEmpty(data, "waterlineLabel", "data");
      nonEmpty(data, "hiddenLabel", "data");
      break;
    }
  }
  return raw as unknown as FigureSpec;
}

/* ------------------------------------------------------------ privacy gate */

export interface PrivacyFinding {
  readonly path: string;
  readonly reason: string;
}

/** Built from pieces so this file never holds the strings it forbids. */
const part = (...pieces: string[]): string => pieces.join("");

const FORBIDDEN: readonly (readonly [RegExp, string])[] = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/, "e-mail address"],
  [/https?:\/\//i, "URL"],
  [/\bwww\./i, "web address"],
  [/(?:\+|00)\d[\d\s/()-]{7,}/, "phone number"],
  [
    new RegExp(
      [part("\\/Us", "ers\\/"), part("\\/priv", "ate\\/tmp"), part("maven", "gence_obsidian"), part("\\.cla", "ude"), part("CLAUDE", "\\.md")].join("|"),
      "i",
    ),
    "internal path",
  ],
  [new RegExp(part("digi", "fyde"), "i"), "retired brand"],
];

const DOMAIN = /\b[a-z0-9][a-z0-9-]*\.(?:de|com|org|net|io|ai|eu|info|biz)\b/i;

/** Every violation of k = 5 and of the content denylist in a spec, with its path. */
export function findPrivacyFindings(spec: unknown): PrivacyFinding[] {
  const out: PrivacyFinding[] = [];
  const walk = (value: unknown, path: string, key: string): void => {
    if (typeof value === "number") {
      if (COUNT_KEYS.has(key) && Number.isInteger(value) && value >= 1 && value <= 4) {
        out.push({ path, reason: "count between 1 and 4 (k = 5); use null" });
      }
      return;
    }
    if (typeof value === "string") {
      for (const [pattern, reason] of FORBIDDEN) {
        if (pattern.test(value)) out.push({ path, reason });
      }
      if (key !== "source" && DOMAIN.test(value)) out.push({ path, reason: "domain name" });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`, key));
      return;
    }
    if (isObject(value)) {
      for (const [k, v] of Object.entries(value)) walk(v, path ? `${path}.${k}` : k, k);
    }
  };
  walk(spec, "", "");
  return out;
}
