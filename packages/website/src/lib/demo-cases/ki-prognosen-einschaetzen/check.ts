/**
 * The error list, read four ways: a line-for-line port of pruefen.py
 * `pruefen` (the code block of content/skills/prognose-pruefen/SKILL.md).
 * The skill, the kit's pruefen.py and this module give the same numbers on
 * the same file; check.test.ts holds all three to the fixtures in
 * __fixtures__/ (|delta| < 1e-9).
 *
 *   Messlatte  mean error of the forecast against a simple rule, same weeks
 *   Spanne     80 % range from the last 26 valid errors, hits counted
 *   Planzahl   forecast + the errors' quantile at Fehlmenge / (Fehlmenge + Rest)
 *   Regel      four lamps on the last 13 valid weeks, a person for red weeks
 *
 * Pure: no DOM, no clock, no network.
 */
import type { Row } from "./parse";

export const LERNEN = 26;
export const MIN_LERNEN = 20;
export const PRUEF = 13;
export const FENSTER = 52;
export const BIAS_MAX = 0.05;
export const TREFFER_MIN = 9;

export const RULES = ["wie letzte Woche", "wie Vorjahreswoche", "Schnitt 4 Wochen"] as const;
export type RuleName = (typeof RULES)[number];

export type LampKey = "daten" | "messlatte" | "bias" | "spanne";
export const LAMP_KEYS: readonly LampKey[] = ["daten", "messlatte", "bias", "spanne"];

export interface Scores {
  readonly mae: number;
  readonly bias: number;
  readonly wape: number;
}

export interface Lamps {
  readonly daten: boolean;
  /** null when the file has no stored forecast. */
  readonly messlatte: boolean | null;
  readonly bias: boolean;
  readonly spanne: boolean;
  readonly frei: boolean;
  /** Mean error of the forecast over that of the Messlatte; null when the Messlatte never misses. */
  readonly verhaeltnis: number | null;
  readonly bias_wert: number;
  readonly treffer: number;
}

export type SkipReason = "ist" | "ausverkauft" | "prognose" | "messlatte";

export interface NextWeek {
  readonly woche: string;
  readonly prognose: number;
  readonly lampen: Lamps | null;
  readonly p10?: number;
  readonly p50?: number;
  readonly p90?: number;
  readonly planzahl?: number;
  readonly zu_wenig?: number;
  readonly uebrig?: number;
  readonly von?: number;
}

export interface CheckResult {
  readonly geprueft: "Prognose" | RuleName;
  readonly messlatte: RuleName;
  readonly von: string;
  readonly bis: string;
  readonly wochen: number;
  readonly nicht_bewertet: readonly (readonly [string, SkipReason])[];
  readonly tabelle: Readonly<Partial<Record<"Prognose" | RuleName, Scores | null>>>;
  readonly naeher: number;
  readonly zu_hoch: number;
  readonly spanne_treffer: number;
  readonly spanne_wochen: number;
  readonly beste_regel: RuleName;
  readonly vorsprung?: number;
  readonly regel_wochen: number;
  readonly regel_frei: number;
  readonly regel_rot: readonly (readonly [string, readonly LampKey[]])[];
  readonly anteil?: number;
  readonly kosten?: { readonly Messlatte: number; readonly Prognose: number; readonly Planzahl: number };
  readonly naechste?: NextWeek;
}

export interface CheckOptions {
  /** Cost of one missing unit (lost contribution margin); null or 0: no planning number. */
  readonly fehlmenge: number | null;
  /** Cost of one leftover unit (cost to make minus salvage value). */
  readonly rest: number | null;
  readonly messlatte: RuleName;
}

export type CheckOutcome =
  | { readonly ok: true; readonly result: CheckResult; readonly check: Checker }
  | { readonly ok: false; readonly key: "tooFew"; readonly weeks: number };

/** Excel QUANTIL.INKL / PERCENTILE.INC (type 7). */
export function quantile7(values: readonly number[], p: number): number {
  const s = [...values].sort((a, b) => a - b);
  const h = (s.length - 1) * p;
  const i = Math.floor(h);
  return (s[i] as number) + (h - i) * ((s[Math.min(i + 1, s.length - 1)] as number) - (s[i] as number));
}

/** Rounded half up, as pruefen.py (math.floor(x + 0.5)). */
export function roundHalfUp(x: number): number {
  return Math.floor(x + 0.5);
}

/** The critical fractile: the share of weeks the costs ask to cover. */
export function share(fehlmenge: number, rest: number): number {
  return fehlmenge / (fehlmenge + rest);
}

/** P(X <= k) for X ~ Binomial(n, p): the chance lines of the rule. */
export function binomialAtMost(k: number, n: number, p: number): number {
  let total = 0;
  for (let j = 0; j <= k; j += 1) {
    let c = 1;
    for (let i = 0; i < j; i += 1) c = (c * (n - i)) / (i + 1);
    total += c * p ** j * (1 - p) ** (n - j);
  }
  return total;
}

const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);

/** Every per-week reading the stage draws, from the same closures the result uses. */
export interface Checker {
  readonly rows: readonly Row[];
  readonly hasForecast: boolean;
  readonly letzte: number;
  readonly naechste: number | null;
  /** Indices of the scored weeks. */
  readonly wochen: readonly number[];
  /** Indices of the rule strip (52 weeks ending with the plan week). */
  readonly streifen: readonly number[];
  readonly valid: (t: number) => boolean;
  readonly forecast: (t: number) => number | null;
  readonly rule: (t: number) => number | null;
  /** Errors (actual minus forecast) of the last n valid weeks before t, and their indices. */
  readonly errorsBefore: (t: number, n: number) => { readonly errors: readonly number[]; readonly weeks: readonly number[] };
  /** P10 and P90 of the errors before t; null under 20 errors. */
  readonly band: (t: number) => readonly [number, number] | null;
  readonly hit: (t: number) => boolean | null;
  readonly lamps: (t: number) => Lamps | null;
}

export function runCheck(rows: readonly Row[], options: CheckOptions): CheckOutcome {
  const { fehlmenge, rest, messlatte } = options;
  const ist = rows.map((row) => row.ist);
  const rules: Record<RuleName, (t: number) => number | null> = {
    "wie letzte Woche": (t) => (t >= 1 ? (ist[t - 1] ?? null) : null),
    "wie Vorjahreswoche": (t) => (t >= 52 ? (ist[t - 52] ?? null) : null),
    "Schnitt 4 Wochen": (t) => {
      if (t < 4) return null;
      const slice = ist.slice(t - 4, t);
      return slice.includes(null) ? null : sum(slice as number[]) / 4;
    },
  };
  const hasForecast = rows.some((row) => row.f !== null);
  const indices = rows.flatMap((row, t) => (row.ist !== null ? [t] : []));
  if (indices.length === 0) return { ok: false, key: "tooFew", weeks: 0 };
  const letzte = Math.max(...indices);
  const naechste = letzte + 1 < rows.length ? letzte + 1 : null;
  const valid = (t: number) => ist[t] !== null && ist[t] !== undefined && !(rows[t] as Row).zensiert;
  const rule = rules[messlatte];
  const F = hasForecast ? (t: number) => (rows[t] as Row).f : rule;
  const A = (t: number) => ist[t] as number;

  const wochen: number[] = [];
  for (let t = Math.max(0, letzte - FENSTER + 1); t <= letzte; t += 1) {
    if (valid(t) && F(t) !== null && rule(t) !== null) wochen.push(t);
  }
  if (wochen.length < PRUEF) return { ok: false, key: "tooFew", weeks: wochen.length };
  const total = sum(wochen.map(A));

  const scores = (g: (t: number) => number | null): Scores | null => {
    if (wochen.some((t) => g(t) === null)) return null;
    const e = wochen.map((t) => (g(t) as number) - A(t));
    return { mae: sum(e.map(Math.abs)) / e.length, bias: sum(e) / total, wape: sum(e.map(Math.abs)) / total };
  };
  const tabelle: Partial<Record<"Prognose" | RuleName, Scores | null>> = hasForecast ? { Prognose: scores(F) } : {};
  for (const name of RULES) tabelle[name] = scores(rules[name]);

  const errorsBefore = (t: number, n: number) => {
    const ws: number[] = [];
    for (let k = 0; k < t; k += 1) if (valid(k) && F(k) !== null && rule(k) !== null) ws.push(k);
    const weeks = ws.slice(-n);
    return { errors: weeks.map((k) => A(k) - (F(k) as number)), weeks };
  };
  const bandCache = new Map<number, readonly [number, number] | null>();
  const band = (t: number) => {
    if (!bandCache.has(t)) {
      const { errors } = errorsBefore(t, LERNEN);
      bandCache.set(t, errors.length >= MIN_LERNEN ? [quantile7(errors, 0.1), quantile7(errors, 0.9)] : null);
    }
    return bandCache.get(t) as readonly [number, number] | null;
  };
  const hit = (t: number) => {
    const s = band(t);
    if (s === null) return null;
    const e = A(t) - (F(t) as number);
    return s[0] <= e && e <= s[1];
  };
  const lamps = (t: number): Lamps | null => {
    const { weeks } = errorsBefore(t, PRUEF);
    if (weeks.length < PRUEF) return null;
    const m = sum(weeks.map((k) => Math.abs((F(k) as number) - A(k))));
    const mr = sum(weeks.map((k) => Math.abs((rule(k) as number) - A(k))));
    const b = sum(weeks.map((k) => (F(k) as number) - A(k))) / sum(weeks.map(A));
    const h = weeks.filter((k) => hit(k) === true).length;
    const daten = ist[t - 1] !== null && ist[t - 1] !== undefined && F(t) !== null;
    const lampMesslatte = hasForecast ? m < mr : null;
    const lampBias = Math.abs(b) <= BIAS_MAX;
    const lampSpanne = h >= TREFFER_MIN;
    const frei = [daten, lampMesslatte, lampBias, lampSpanne].every((value) => value === null || value);
    return { daten, messlatte: lampMesslatte, bias: lampBias, spanne: lampSpanne, frei, verhaeltnis: mr === 0 ? null : m / mr, bias_wert: b, treffer: h };
  };

  const counted = wochen.filter((t) => hit(t) !== null);
  const skipped: [string, SkipReason][] = [];
  for (let t = wochen[0] as number; t <= letzte; t += 1) {
    if (wochen.includes(t)) continue;
    const reason: SkipReason = ist[t] === null ? "ist" : (rows[t] as Row).zensiert ? "ausverkauft" : F(t) === null ? "prognose" : "messlatte";
    skipped.push([(rows[t] as Row).woche, reason]);
  }
  const ruleScores = RULES.filter((name) => tabelle[name]);
  let best = ruleScores[0] as RuleName;
  for (const name of ruleScores) if ((tabelle[name] as Scores).mae < (tabelle[best] as Scores).mae) best = name;

  const end = naechste ?? letzte;
  const streifen: number[] = [];
  for (let t = Math.max(1, end - FENSTER + 1); t <= end; t += 1) streifen.push(t);
  const rot: [string, LampKey[]][] = [];
  for (const t of streifen) {
    const l = lamps(t);
    if (l && !l.frei) rot.push([(rows[t] as Row).woche, LAMP_KEYS.filter((key) => l[key] === false)]);
  }

  const result: {
    -readonly [K in keyof CheckResult]: CheckResult[K];
  } = {
    geprueft: hasForecast ? "Prognose" : messlatte,
    messlatte,
    von: (rows[wochen[0] as number] as Row).woche,
    bis: (rows[wochen[wochen.length - 1] as number] as Row).woche,
    wochen: wochen.length,
    nicht_bewertet: skipped,
    tabelle,
    naeher: wochen.filter((t) => Math.abs((F(t) as number) - A(t)) < Math.abs((rule(t) as number) - A(t))).length,
    zu_hoch: wochen.filter((t) => (F(t) as number) > A(t)).length,
    spanne_treffer: counted.filter((t) => hit(t) === true).length,
    spanne_wochen: counted.length,
    beste_regel: best,
    regel_wochen: streifen.length,
    regel_frei: streifen.length - rot.length,
    regel_rot: rot,
  };
  if (hasForecast) result.vorsprung = 1 - (tabelle.Prognose as Scores).mae / (tabelle[messlatte] as Scores).mae;

  const withCosts = Boolean(fehlmenge) && Boolean(rest);
  if (withCosts) {
    const cu = fehlmenge as number;
    const co = rest as number;
    const tau = share(cu, co);
    const cost = (q: number, d: number) => cu * Math.max(0, d - q) + co * Math.max(0, q - d);
    result.anteil = tau;
    // The buffered policy needs an error list before every scored week; a short file gets no ledger.
    if (wochen.every((t) => errorsBefore(t, LERNEN).errors.length > 0)) {
      result.kosten = {
        Messlatte: sum(wochen.map((t) => cost(rule(t) as number, A(t)))),
        Prognose: sum(wochen.map((t) => cost(F(t) as number, A(t)))),
        Planzahl: sum(wochen.map((t) => cost((F(t) as number) + quantile7(errorsBefore(t, LERNEN).errors, tau), A(t)))),
      };
    }
  }
  if (naechste !== null && F(naechste) !== null) {
    const forecast = F(naechste) as number;
    const { errors } = errorsBefore(naechste, LERNEN);
    let next: NextWeek = { woche: (rows[naechste] as Row).woche, prognose: forecast, lampen: lamps(naechste) };
    if (errors.length >= MIN_LERNEN) {
      next = { ...next, p10: forecast + quantile7(errors, 0.1), p50: forecast + quantile7(errors, 0.5), p90: forecast + quantile7(errors, 0.9) };
      if (withCosts) {
        const z = roundHalfUp(forecast + quantile7(errors, result.anteil as number));
        next = {
          ...next,
          planzahl: z,
          zu_wenig: errors.filter((x) => forecast + x > z).length,
          uebrig: errors.filter((x) => forecast + x < z).length,
          von: errors.length,
        };
      }
    }
    result.naechste = next;
  }

  const check: Checker = {
    rows,
    hasForecast,
    letzte,
    naechste,
    wochen,
    streifen,
    valid,
    forecast: (t) => F(t),
    rule,
    errorsBefore,
    band,
    hit,
    lamps,
  };
  return { ok: true, result, check };
}
