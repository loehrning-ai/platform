import { fill, formatNumber, type DemoLocale } from "./format";
import { computeStats, scenarios, shortCount, type Band } from "./quantile";

/** The part of the locale pack the generators need. */
export interface TextPack {
  readonly locale: DemoLocale;
  readonly defaultUnit: string;
  readonly restDefault: string;
  readonly restCustom: string;
  readonly takeaways: {
    readonly questionsIntro: string;
    readonly questions: readonly string[];
    readonly mail: Readonly<
      Record<
        | "head"
        | "atForecastLess"
        | "atForecast"
        | "equalWeight"
        | "weighBelow"
        | "weighAbove"
        | "open",
        string
      >
    >;
    readonly working: string;
    readonly workingNoPlan: string;
  };
}

export interface TakeawayInput {
  readonly band: Band;
  readonly cap: number;
  /** A missed sale weighs this many leftover units. */
  readonly ratio: number;
  /** Own unit text, empty for the language's default word. */
  readonly unit: string;
  /**
   * The visitor has seen the Waage. Until then the copied text leaves the
   * weighting (the 3 : 1 assumption and the plan number) out, so it never
   * carries an assumption the visitor has not met. Default true.
   */
  readonly weighted?: boolean;
}

export interface Takeaways {
  readonly mail: string;
  readonly questions: string;
  readonly working: string;
}

function ordinalEn(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  return `${value}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[value % 10] ?? "th"}`;
}

/**
 * The three copy blocks, generated from the visitor's line and numbers. Pure:
 * the same input gives the same text. Numbers are the rounded display values.
 */
export function buildTakeaways(
  pack: TextPack,
  input: TakeawayInput,
): Takeaways {
  const { locale } = pack;
  const t = pack.takeaways;
  const samples = scenarios(input.band);
  const stats = computeStats(samples, input.cap, input.ratio, input.band);
  const n = (value: number) => formatNumber(value, locale);
  const unit = input.unit === "" ? pack.defaultUnit : input.unit;
  // The leftover slot is a singular noun: a custom unit (often a plural such
  // as "Kisten") must not be forced into it, so it reads "eine Rest-Einheit".
  const rest = input.unit === "" ? pack.restDefault : pack.restCustom;
  const opt = Math.round(stats.optimum);
  const cap = Math.round(input.cap);
  const p50 = Math.round(input.band.p50);
  const nP50 = shortCount(samples, input.band.p50);
  const ratio = formatNumber(input.ratio, locale, 1);

  const values = {
    p10: n(input.band.p10),
    p50: n(p50),
    p90: n(input.band.p90),
    cap: n(cap),
    n: stats.short,
    short: n(stats.avgShort),
    left: n(stats.avgLeft),
    nP50,
    r: ratio,
    opt: n(opt),
    pct: locale === "en" ? ordinalEn(stats.optimumPct) : stats.optimumPct,
    u: unit,
    rest,
  };

  const sentences = [fill(t.mail.head, values)];
  if (Math.abs(input.cap - input.band.p50) >= 0.5) {
    sentences.push(
      fill(
        nP50 < stats.short ? t.mail.atForecastLess : t.mail.atForecast,
        values,
      ),
    );
  }
  const weighted = input.weighted ?? true;
  if (weighted) {
    if (input.ratio <= 1) sentences.push(fill(t.mail.equalWeight, values));
    else
      sentences.push(
        fill(cap < opt ? t.mail.weighBelow : t.mail.weighAbove, values),
      );
  }
  sentences.push(fill(t.mail.open, values));

  const questions = [
    t.questionsIntro,
    ...t.questions.map((line, index) => `${index + 1}. ${line}`),
  ].join("\n");
  return {
    mail: sentences.join(" "),
    questions,
    working: fill(weighted ? t.working : t.workingNoPlan, values),
  };
}
