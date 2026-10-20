/**
 * Small checks shared by the spec validators. Kept apart so the hero kinds
 * (validate-hero.ts) and validate.ts can both use them without importing each other.
 */

export class FigureSpecError extends Error {
  readonly path: string;
  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = "FigureSpecError";
    this.path = path;
  }
}

export type Json = Record<string, unknown>;

export const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const COUNT_KEYS = new Set(["n", "hits", "count", "dots_of_firms"]);

export function need(cond: boolean, path: string, message: string): asserts cond {
  if (!cond) throw new FigureSpecError(path, message);
}

export function nonEmpty(obj: Json, key: string, path: string): void {
  need(typeof obj[key] === "string" && (obj[key] as string).trim() !== "", `${path}.${key}`, "must be a non-empty string");
}

export function arrayOf(obj: Json, key: string, path: string): unknown[] {
  const v = obj[key];
  need(Array.isArray(v) && v.length > 0, `${path}.${key}`, "must be a non-empty array");
  return v as unknown[];
}

export function itemsWithId(list: unknown[], path: string): void {
  const seen = new Set<string>();
  list.forEach((item, i) => {
    need(isObject(item), `${path}[${i}]`, "must be an object");
    const id = (item as Json)["id"];
    need(typeof id === "string" && id !== "", `${path}[${i}].id`, "must be a non-empty string");
    need(!seen.has(id as string), `${path}[${i}].id`, `duplicate id ${String(id)}`);
    seen.add(id as string);
  });
}

export function numOrNull(item: Json, key: string, path: string): void {
  const v = item[key];
  need(v === null || (typeof v === "number" && Number.isFinite(v)), `${path}.${key}`, "must be a finite number or null");
}

export function fmt(data: Json, path: string): void {
  need(isObject(data["fmt"]) && ["percent", "number", "decimal"].includes(String((data["fmt"] as Json)["style"])), `${path}.fmt.style`, "must be percent, number or decimal");
}

