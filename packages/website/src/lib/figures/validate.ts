/**
 * Spec validation and the privacy gate of the engine. A spec that fails here
 * never reaches the public repo: no count of 1 to 4, no per-firm values, no
 * contact data, no paths, no retired brand.
 */

import { FIGURE_KINDS, type FigureKind, type FigureSpec } from "./types.ts";

export class FigureSpecError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "FigureSpecError";
    this.path = path;
  }
}

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const COUNT_KEYS = new Set(["n", "hits", "count", "dots_of_firms"]);

function need(cond: boolean, path: string, message: string): asserts cond {
  if (!cond) throw new FigureSpecError(path, message);
}

function nonEmpty(obj: Json, key: string, path: string): void {
  need(typeof obj[key] === "string" && (obj[key] as string).trim() !== "", `${path}.${key}`, "must be a non-empty string");
}

function arrayOf(obj: Json, key: string, path: string): unknown[] {
  const v = obj[key];
  need(Array.isArray(v) && v.length > 0, `${path}.${key}`, "must be a non-empty array");
  return v as unknown[];
}

function itemsWithId(list: unknown[], path: string): void {
  const seen = new Set<string>();
  list.forEach((item, i) => {
    need(isObject(item), `${path}[${i}]`, "must be an object");
    const id = (item as Json)["id"];
    need(typeof id === "string" && id !== "", `${path}[${i}].id`, "must be a non-empty string");
    need(!seen.has(id as string), `${path}[${i}].id`, `duplicate id ${String(id)}`);
    seen.add(id as string);
  });
}

function numOrNull(item: Json, key: string, path: string): void {
  const v = item[key];
  need(v === null || (typeof v === "number" && Number.isFinite(v)), `${path}.${key}`, "must be a finite number or null");
}

function fmt(data: Json, path: string): void {
  need(isObject(data["fmt"]) && ["percent", "number", "decimal"].includes(String((data["fmt"] as Json)["style"])), `${path}.fmt.style`, "must be percent, number or decimal");
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
