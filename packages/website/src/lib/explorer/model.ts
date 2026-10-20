/**
 * The placement model behind "Wo stehe ich?" (INSIGHT-SPEC 3.4).
 *
 * The page ships the coefficients of a logistic model of the KI-Wort on four
 * factors (Branche, Bundesland, Größe, Textmenge) and a few hundred bootstrap
 * draws of those coefficients: no rows, no cell table. The browser computes
 * the expected share and its 95 % interval; nothing is sent anywhere. This
 * module is pure (no DOM, no fetch), so the server renders the worked example
 * and the browser recomputes with the same code.
 *
 * Contract of content/books/<slug>/explorer.json (written by the analysis
 * freeze, validated here at build time):
 *
 *   {
 *     "version": "v1",
 *     "asOf": "2026-10-19",
 *     "methodVersion": "v1-one-method",          // starts with "v0" until the rescan
 *     "n": 17034,
 *     "outcome": "das Wort KI auf der Startseite",
 *     "sourceLine": "n = 17.034 Startseiten ... · Grenze: Sichtbarkeit, nicht Einsatz",
 *     "rescanNote": "Wird mit geprüften Websites neu gerechnet.",   // optional
 *     "intercept": { "coef": -3.1, "boot": [ ...B numbers ] },
 *     "factors": [
 *       { "id": "branche", "label": "Branche", "levels": [
 *           { "id": "it_medien", "label": "IT und Medien", "n": 450, "coef": 0.3, "boot": [ ... ] }, ... ] },
 *       { "id": "bundesland", ... , "levels": [ ..., { "id": "pool", "label": "Saarland, Sachsen-Anhalt",
 *           "pooled": true, "pooledNote": "zu wenige Daten für ein eigenes Land", "n": 120, ... } ] },
 *       { "id": "size", "label": "Größe", "hint": "Vertretungsberechtigte, nicht Beschäftigte", "levels": [...] },
 *       { "id": "textmenge", "label": "Textmenge deiner Startseite", "levels": [
 *           { "id": "q1", "label": "kurz", "example": "kurz wie eine Visitenkarte", ... }, ... 5 levels ] }
 *     ],
 *     "default": { "branche": "beratung", "bundesland": "by", "size": "5-9", "textmenge": "q3" }
 *   }
 *
 * Reference levels carry coef 0 and zero draws. Every `boot` array has the
 * same length B (50 to 500). A level count `n` below 5 is rejected at load
 * (k = 5); such a level must be folded into a pooled level instead.
 */

import { formatDecimal } from "@/lib/figures";
import { EXPLORER_COPY, type ExplorerLocale } from "./copy";

export { EXPLORER_COPY, type ExplorerLocale } from "./copy";

export const MIN_CELL = 5;
/** Marginal counts are printed only from this many firms. */
export const PRINT_MIN_N = 60;
/** Below this many firms behind the nearest chosen level the readout says so. */
export const THIN_BELOW_N = 30;
export const FIELD_SQUARES = 1000;

export interface ExplorerLevel {
  readonly id: string;
  readonly label: string;
  /** Plain-words example, used by the Textmenge control. */
  readonly example?: string;
  /** Firms behind the level (marginal count). */
  readonly n: number;
  readonly coef: number;
  readonly boot: readonly number[];
  readonly pooled?: boolean;
  readonly pooledNote?: string;
}

export interface ExplorerFactor {
  readonly id: "branche" | "bundesland" | "size" | "textmenge";
  readonly label: string;
  readonly hint?: string;
  readonly levels: readonly ExplorerLevel[];
}

export type ExplorerSelection = Readonly<Record<ExplorerFactor["id"], string>>;

export interface ExplorerModel {
  readonly version: string;
  readonly asOf: string;
  readonly methodVersion: string;
  readonly n: number;
  readonly outcome: string;
  readonly sourceLine: string;
  readonly rescanNote?: string;
  readonly intercept: { readonly coef: number; readonly boot: readonly number[] };
  readonly factors: readonly ExplorerFactor[];
  readonly default: ExplorerSelection;
}

export class ExplorerModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExplorerModelError";
  }
}

const FACTOR_IDS = ["branche", "bundesland", "size", "textmenge"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(path: string, message: string): never {
  throw new ExplorerModelError(`explorer.json ${path}: ${message}`);
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(path, "needs a text");
  return value;
}

function num(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(path, "needs a finite number");
  return value;
}

function draws(value: unknown, path: string, expected: number | null): number[] {
  if (!Array.isArray(value)) fail(path, "needs an array of bootstrap coefficients");
  if (value.length < 50 || value.length > 500) fail(path, `needs 50 to 500 draws, has ${value.length}`);
  if (expected !== null && value.length !== expected) fail(path, `has ${value.length} draws, the intercept has ${expected}`);
  return value.map((v, i) => num(v, `${path}[${i}]`));
}

/** Parses and checks the frozen model. A bad file fails the build, never the page. */
export function parseExplorerModel(input: unknown): ExplorerModel {
  if (!isRecord(input)) fail("", "must be an object");
  const interceptRaw = input["intercept"];
  if (!isRecord(interceptRaw)) fail("intercept", "needs coef and boot");
  const boot = draws(interceptRaw["boot"], "intercept.boot", null);
  const intercept = { coef: num(interceptRaw["coef"], "intercept.coef"), boot };

  const factorsRaw = input["factors"];
  if (!Array.isArray(factorsRaw)) fail("factors", "needs the four factors");
  const factors = factorsRaw.map((raw, fi): ExplorerFactor => {
    if (!isRecord(raw)) fail(`factors[${fi}]`, "must be an object");
    const id = raw["id"];
    if (!FACTOR_IDS.includes(id as ExplorerFactor["id"])) fail(`factors[${fi}].id`, `must be one of ${FACTOR_IDS.join(", ")}`);
    const levelsRaw = raw["levels"];
    if (!Array.isArray(levelsRaw) || levelsRaw.length < 2) fail(`factors[${fi}].levels`, "needs at least two levels");
    const levels = levelsRaw.map((l, li): ExplorerLevel => {
      const where = `factors[${fi}].levels[${li}]`;
      if (!isRecord(l)) fail(where, "must be an object");
      const n = num(l["n"], `${where}.n`);
      if (n < MIN_CELL) fail(`${where}.n`, `${n} firms is below the floor of ${MIN_CELL}; fold the level into a pooled one`);
      return {
        id: text(l["id"], `${where}.id`),
        label: text(l["label"], `${where}.label`),
        example: typeof l["example"] === "string" ? l["example"] : undefined,
        n,
        coef: num(l["coef"], `${where}.coef`),
        boot: draws(l["boot"], `${where}.boot`, boot.length),
        pooled: l["pooled"] === true ? true : undefined,
        pooledNote: typeof l["pooledNote"] === "string" ? l["pooledNote"] : undefined,
      };
    });
    if (new Set(levels.map((l) => l.id)).size !== levels.length) fail(`factors[${fi}].levels`, "level ids must be unique");
    return {
      id: id as ExplorerFactor["id"],
      label: text(raw["label"], `factors[${fi}].label`),
      hint: typeof raw["hint"] === "string" ? raw["hint"] : undefined,
      levels,
    };
  });
  for (const id of FACTOR_IDS) {
    if (!factors.some((f) => f.id === id)) fail("factors", `is missing "${id}"`);
  }
  const textmenge = factors.find((f) => f.id === "textmenge");
  if (textmenge && textmenge.levels.length !== 5) fail("factors.textmenge", "needs exactly five levels (the five fifths)");
  if (textmenge && textmenge.levels.some((l) => !l.example)) fail("factors.textmenge", "every level needs a plain-words example");

  const defaultRaw = input["default"];
  if (!isRecord(defaultRaw)) fail("default", "needs one level per factor");
  const selection = {} as Record<ExplorerFactor["id"], string>;
  for (const factor of factors) {
    const chosen = text(defaultRaw[factor.id], `default.${factor.id}`);
    if (!factor.levels.some((l) => l.id === chosen)) fail(`default.${factor.id}`, `"${chosen}" is not a level`);
    selection[factor.id] = chosen;
  }

  const methodVersion = text(input["methodVersion"], "methodVersion");
  const model: ExplorerModel = {
    version: text(input["version"], "version"),
    asOf: text(input["asOf"], "asOf"),
    methodVersion,
    n: num(input["n"], "n"),
    outcome: text(input["outcome"], "outcome"),
    sourceLine: text(input["sourceLine"], "sourceLine"),
    rescanNote: typeof input["rescanNote"] === "string" && input["rescanNote"].trim() !== "" ? input["rescanNote"] : undefined,
    intercept,
    factors,
    default: selection,
  };
  return model;
}

/* ------------------------------------------------------------- prediction */

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

export interface Prediction {
  /** Expected share as a fraction (0.03 = 3 von 100). */
  readonly p: number;
  readonly lo: number;
  readonly hi: number;
  /** Fewest firms behind any chosen level. */
  readonly support: number;
  /** True when the nearest supporting level has fewer than THIN_BELOW_N firms. */
  readonly thin: boolean;
  /** Notes of the chosen pooled levels ("zu wenige Daten für ein eigenes Land"). */
  readonly pooledNotes: readonly string[];
}

function chosenLevels(model: ExplorerModel, selection: ExplorerSelection): ExplorerLevel[] {
  return model.factors.map((factor) => {
    const level = factor.levels.find((l) => l.id === selection[factor.id]);
    if (!level) throw new ExplorerModelError(`"${selection[factor.id]}" is not a level of ${factor.id}`);
    return level;
  });
}

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1];
  return next === undefined ? (sorted[base] as number) : (sorted[base] as number) + rest * (next - (sorted[base] as number));
}

/** Expected share and 95 % bootstrap interval for one selection. Pure and deterministic. */
export function predict(model: ExplorerModel, selection: ExplorerSelection): Prediction {
  const levels = chosenLevels(model, selection);
  const point = sigmoid(model.intercept.coef + levels.reduce((sum, l) => sum + l.coef, 0));
  const draws = model.intercept.boot.map((b, i) => sigmoid(b + levels.reduce((sum, l) => sum + (l.boot[i] as number), 0)));
  draws.sort((a, b) => a - b);
  const lo = Math.min(point, quantile(draws, 0.025));
  const hi = Math.max(point, quantile(draws, 0.975));
  const support = Math.min(...levels.map((l) => l.n));
  return {
    p: point,
    lo,
    hi,
    support,
    thin: support < THIN_BELOW_N,
    pooledNotes: levels.flatMap((l) => (l.pooled && l.pooledNote ? [l.pooledNote] : [])),
  };
}

/* --------------------------------------------------------------- wording */

/** formatDecimal writes the German way ("1.234,5"); English swaps the two marks. */
export function formatNumber(value: number, digits: number, locale: ExplorerLocale = "de"): string {
  const german = formatDecimal(value, digits);
  if (locale === "de") return german;
  return german.replace(/[.,]/g, (mark) => (mark === "." ? "," : "."));
}

/** One decimal of "von 100", rounded to the nearest tenth. Under 0,1 it says so instead of printing a zero. */
export function perHundred(fraction: number, locale: ExplorerLocale = "de"): string {
  const tenths = Math.round(fraction * 1000) / 10;
  return tenths < 0.1 ? EXPLORER_COPY[locale].under : formatNumber(tenths, 1, locale);
}

/** The giant numeral: "1,2", and "<0,1" under a tenth of a firm in a hundred. */
export function numeralPerHundred(fraction: number, locale: ExplorerLocale = "de"): string {
  const tenths = Math.round(fraction * 1000) / 10;
  return tenths < 0.1 ? `<0${EXPLORER_COPY[locale].decimal}1` : formatNumber(tenths, 1, locale);
}

/** The interval is widened outward to the tenth (floor, ceiling), so the printed range never claims more than the model holds. */
export function intervalPerHundred(lo: number, hi: number, locale: ExplorerLocale = "de"): string {
  const copy = EXPLORER_COPY[locale];
  const a = Math.floor(lo * 1000 + 1e-9) / 10;
  const b = Math.ceil(hi * 1000 - 1e-9) / 10;
  return `${a < 0.1 ? copy.under : formatNumber(a, 1, locale)} ${copy.to} ${formatNumber(b, 1, locale)}`;
}

/** False below the k = 5 floor: such a combination shows no value at all. */
export function hasValue(prediction: Prediction): boolean {
  return prediction.support >= MIN_CELL;
}

/** "Grundlage: 52 Firmen.": the support behind the chosen combination, which is what widens the interval. */
export function supportText(prediction: Prediction, locale: ExplorerLocale = "de"): string {
  const copy = EXPLORER_COPY[locale];
  return hasValue(prediction) ? copy.support(formatNumber(prediction.support, 0, locale)) : copy.noValue;
}

/** The one sentence the aria-live region reads. */
export function readoutSentence(prediction: Prediction, locale: ExplorerLocale = "de"): string {
  const copy = EXPLORER_COPY[locale];
  if (!hasValue(prediction)) return copy.readoutNone;
  const shown = perHundred(prediction.p, locale);
  const estimate = shown === copy.under ? copy.lessThan : `${copy.about} ${shown}`;
  const base = copy.readout(estimate, intervalPerHundred(prediction.lo, prediction.hi, locale));
  return prediction.thin ? `${base} ${copy.readoutThin}` : base;
}

export const READOUT_MEANING = EXPLORER_COPY.de.meaning;

/** Marginal count text for a level: printed only from PRINT_MIN_N firms, otherwise nothing. */
export function levelCountText(level: ExplorerLevel, locale: ExplorerLocale = "de"): string | null {
  return level.n >= PRINT_MIN_N ? EXPLORER_COPY[locale].group(formatNumber(level.n, 0, locale)) : null;
}

/* ----------------------------------------------------------------- field */

export interface FieldCounts {
  /** Whole squares filled for the estimate (one square is 0,1 % of the base). */
  readonly solid: number;
  /** Fill of the next square, 0 to 1 (a share under one square is a partial square, never rounded up). */
  readonly partial: number;
  /** First and last square index (exclusive) of the outlined 95 % band. */
  readonly bandFrom: number;
  readonly bandTo: number;
}

export function fieldCounts(prediction: Prediction, squares: number = FIELD_SQUARES): FieldCounts {
  const scaled = prediction.p * squares;
  const solid = Math.min(squares, Math.floor(scaled + 1e-9));
  const partial = solid >= squares ? 0 : Math.max(0, Math.min(1, scaled - solid));
  return {
    solid,
    partial: partial < 1e-6 ? 0 : partial,
    bandFrom: Math.max(0, Math.floor(prediction.lo * squares + 1e-9)),
    bandTo: Math.min(squares, Math.ceil(prediction.hi * squares - 1e-9)),
  };
}

/* ---------------------------------------------------------------- table */

export interface ExplorerTable {
  readonly rowLabels: readonly string[];
  readonly columnLabels: readonly string[];
  /** rows x columns, text such as "3 (2 bis 5)". */
  readonly cells: readonly (readonly string[])[];
  /** Which Bundesland and Größe the table holds fixed. */
  readonly fixed: string;
}


/** Branche x Textmenge with Bundesland and Größe at the default: the static equivalent for no script, reduced motion and print. */
export function staticTable(model: ExplorerModel, locale: ExplorerLocale = "de"): ExplorerTable {
  const branche = model.factors.find((f) => f.id === "branche") as ExplorerFactor;
  const textmenge = model.factors.find((f) => f.id === "textmenge") as ExplorerFactor;
  const land = model.factors.find((f) => f.id === "bundesland") as ExplorerFactor;
  const size = model.factors.find((f) => f.id === "size") as ExplorerFactor;
  const cells = branche.levels.map((b) =>
    textmenge.levels.map((t) => {
      const p = predict(model, { ...model.default, branche: b.id, textmenge: t.id });
      return `${perHundred(p.p, locale)} (${intervalPerHundred(p.lo, p.hi, locale)})`;
    }),
  );
  const labelOf = (factor: ExplorerFactor, id: string): string => factor.levels.find((l) => l.id === id)?.label ?? id;
  return {
    rowLabels: branche.levels.map((l) => l.label),
    columnLabels: textmenge.levels.map((l) => l.label),
    cells,
    fixed: `${labelOf(land, model.default.bundesland)}, ${EXPLORER_COPY[locale].sizeWords(labelOf(size, model.default.size))}`,
  };
}

/* ------------------------------------------------------- English overlay */

/**
 * content/books/<slug>/explorer.en.json: the words of the frozen model in English, keyed by the ids of the
 * German file (the coefficients and draws stay in explorer.json, so a rescan refreshes both languages).
 * `sourceLine` may carry {n} (the base) and {draws} (the model runs), filled in the English number format.
 */
export interface ExplorerOverlay {
  readonly outcome: string;
  readonly sourceLine: string;
  readonly rescanNote?: string;
  readonly factors: Readonly<
    Record<
      string,
      {
        readonly label: string;
        readonly hint?: string;
        readonly levels: Readonly<Record<string, { readonly label: string; readonly example?: string; readonly pooledNote?: string }>>;
      }
    >
  >;
}

/** Applies the overlay. A factor or level the overlay does not name is an authoring error (a German word on /en). */
export function localizeModel(model: ExplorerModel, overlay: unknown, locale: ExplorerLocale): ExplorerModel {
  if (locale === "de") return model;
  if (!isRecord(overlay) || !isRecord(overlay["factors"])) fail("explorer.en.json", "must be an object with factors");
  const o = overlay as unknown as ExplorerOverlay;
  const draws = model.intercept.boot.length;
  const sourceLine = text(o.sourceLine, "explorer.en.json sourceLine")
    .replace("{n}", formatNumber(model.n, 0, locale))
    .replace("{draws}", formatNumber(draws, 0, locale));
  return {
    ...model,
    outcome: text(o.outcome, "explorer.en.json outcome"),
    sourceLine,
    rescanNote: typeof o.rescanNote === "string" && o.rescanNote !== "" ? o.rescanNote : undefined,
    factors: model.factors.map((factor) => {
      const f = o.factors[factor.id];
      if (!f) fail(`explorer.en.json factors.${factor.id}`, "is missing");
      return {
        ...factor,
        label: text(f.label, `explorer.en.json factors.${factor.id}.label`),
        hint: factor.hint ? text(f.hint, `explorer.en.json factors.${factor.id}.hint`) : undefined,
        levels: factor.levels.map((level) => {
          const l = f.levels?.[level.id];
          if (!l) fail(`explorer.en.json factors.${factor.id}.levels.${level.id}`, "is missing");
          return {
            ...level,
            label: text(l.label, `explorer.en.json ${factor.id}.${level.id}.label`),
            example: level.example ? text(l.example, `explorer.en.json ${factor.id}.${level.id}.example`) : undefined,
            pooledNote: level.pooledNote ? text(l.pooledNote, `explorer.en.json ${factor.id}.${level.id}.pooledNote`) : undefined,
          };
        }),
      };
    }),
  };
}
