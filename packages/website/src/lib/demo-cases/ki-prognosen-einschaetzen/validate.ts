import type { Band } from "./quantile";
import type { DemoLocale } from "./format";

/**
 * Parses a number the way a person in that locale types it.
 * DE: "1.180", "1180", "1180,5". EN: "1,180", "1180", "1180.5".
 * A thousands separator counts only in the pattern `\d{1,3}(sep\d{3})+`;
 * a lone "1.5" is read as a decimal in either language. A separator followed
 * by three or more digits that is not a clean thousands group ("1.1801") is
 * ambiguous: it is NaN, so the visitor gets "please enter a number" and not a
 * misleading order error. Empty or garbage is NaN.
 */
export function parseNumber(input: string, locale: DemoLocale): number {
  const text = input.replace(/[\s\u00a0\u202f]/g, "");
  if (text === "") return Number.NaN;
  const sign = text.startsWith("-") ? -1 : 1;
  const body = text.replace(/^[+-]/, "");
  const thousands = locale === "de" ? "." : ",";
  const decimal = locale === "de" ? "," : ".";
  const group = new RegExp(
    `^\\d{1,3}(\\${thousands}\\d{3})+(\\${decimal}\\d+)?$`,
  );
  const plain = new RegExp(`^\\d+(\\${decimal}\\d+)?$`);
  const other = new RegExp(`^\\d+\\${thousands}\\d{1,2}$`);
  let normal: string;
  if (group.test(body))
    normal = body.split(thousands).join("").replace(decimal, ".");
  else if (plain.test(body)) normal = body.replace(decimal, ".");
  else if (other.test(body)) normal = body.replace(thousands, ".");
  else return Number.NaN;
  return sign * Number(normal);
}

export const FIELDS = ["p10", "p50", "p90", "supply", "ratio", "unit"] as const;
export type FieldName = (typeof FIELDS)[number];
export type RawCase = Readonly<Record<FieldName, string>>;

export type ErrorKey = "order" | "number" | "negative" | "ratio" | "unit";
export interface FieldError {
  readonly field: FieldName;
  readonly key: ErrorKey;
}

export interface OwnCase {
  readonly band: Band;
  readonly supply: number;
  /** A missed sale weighs this many leftover units, 1..20. */
  readonly ratio: number;
  /** Trimmed unit text; empty means the language's default word. */
  readonly unit: string;
}

export type Validation =
  | { readonly ok: true; readonly value: OwnCase }
  | { readonly ok: false; readonly errors: readonly FieldError[] };

export const RATIO_MIN = 1;
export const RATIO_MAX = 20;
export const UNIT_MAX = 12;
/** An empty Gewicht field means this weight. */
export const RATIO_FALLBACK = 3;

export function validateOwn(raw: RawCase, locale: DemoLocale): Validation {
  const errors: FieldError[] = [];
  const numbers: Partial<Record<"p10" | "p50" | "p90" | "supply", number>> = {};
  for (const field of ["p10", "p50", "p90", "supply"] as const) {
    const value = parseNumber(raw[field], locale);
    if (!Number.isFinite(value)) errors.push({ field, key: "number" });
    else if (value < 0) errors.push({ field, key: "negative" });
    else numbers[field] = value;
  }

  let ratio = RATIO_FALLBACK;
  if (raw.ratio.trim() !== "") {
    ratio = parseNumber(raw.ratio, locale);
    if (!Number.isFinite(ratio) || ratio < RATIO_MIN || ratio > RATIO_MAX) {
      errors.push({ field: "ratio", key: "ratio" });
    }
  }

  const unit = raw.unit.trim();
  if ([...unit].length > UNIT_MAX) errors.push({ field: "unit", key: "unit" });

  const { p10, p50, p90, supply } = numbers;
  if (
    p10 !== undefined &&
    p50 !== undefined &&
    p90 !== undefined &&
    !(p10 < p50 && p50 < p90)
  ) {
    errors.push({ field: "p50", key: "order" });
  }
  if (
    errors.length > 0 ||
    p10 === undefined ||
    p50 === undefined ||
    p90 === undefined ||
    supply === undefined
  ) {
    return { ok: false, errors };
  }
  return { ok: true, value: { band: { p10, p50, p90 }, supply, ratio, unit } };
}

/** How far the stock sits from the forecast range: inside p10..p90, a little outside, or far outside. */
export type SupplyRelation = "inside" | "near" | "far";

/** "Far" is more than this share of the p10..p90 spread beyond either end. */
export const FAR_SHARE = 0.3;

export function supplyRelation(band: Band, supply: number): SupplyRelation {
  if (supply >= band.p10 && supply <= band.p90) return "inside";
  const spread = band.p90 - band.p10;
  const distance = supply < band.p10 ? band.p10 - supply : supply - band.p90;
  return distance > FAR_SHARE * spread ? "far" : "near";
}

/**
 * While the visitor edits the forecast range and has not touched the stock,
 * a stock that falls outside the new range (or is not a number) is moved to
 * the forecast, so the first result is not a dead 0 or 100. Returns the new
 * stock text, or null when the stock stays as it is (also while the three
 * range fields do not form a valid range yet).
 */
export function followSupply(raw: RawCase, locale: DemoLocale): string | null {
  const p10 = parseNumber(raw.p10, locale);
  const p50 = parseNumber(raw.p50, locale);
  const p90 = parseNumber(raw.p90, locale);
  if (![p10, p50, p90].every(Number.isFinite) || p10 < 0) return null;
  if (!(p10 < p50 && p50 < p90)) return null;
  const supply = parseNumber(raw.supply, locale);
  if (Number.isFinite(supply) && supply >= p10 && supply <= p90) return null;
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(p50));
}
