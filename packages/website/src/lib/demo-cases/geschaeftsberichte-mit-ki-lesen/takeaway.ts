import type { DemoPack } from "./copy";
import { EXAMPLE_TRIGGER_MONTH } from "./data";
import { REVERSE_MARGIN, craftComparison, type Verdict } from "./logic";
import { fill, formatMoney, formatNumber, formatPercent } from "./format";

/**
 * The three things the visitor takes away, built from their own comparison:
 * a report sentence, a prompt for their AI and a rules file. Pure functions of
 * the facts and one language pack; nothing here is hardcoded to Northwind
 * except the two labelled proof rules of the rules file.
 */
export type TakeUnit = "weeks" | "days" | "cdays";

export interface Facts {
  readonly metric: string;
  readonly nameA: string;
  readonly nameB: string;
  readonly unit: TakeUnit;
  readonly valueA: number;
  readonly valueB: number;
  readonly countA: number;
  readonly countB: number;
  readonly h: number;
  readonly p: number;
  readonly s: number | null;
  readonly verdict: Verdict;
}

type TakePack = Pick<DemoPack, "locale" | "money" | "numWords" | "months" | "unit" | "verdict" | "take">;

const plain = { plain: true } as const;

export const percentText = (pack: TakePack, fraction: number) =>
  formatPercent(fraction, pack.locale, { ...plain, digits: 1, sign: true });

/** 2 to 12 as words, everything else as digits ("1 Lieferwoche" avoids a gender guess). */
export function countText(pack: TakePack, n: number): string {
  return Number.isInteger(n) && n >= 2 && n <= 12 ? (pack.numWords[n] as string) : formatNumber(n, pack.locale, plain);
}

const isMonth = (pack: TakePack, name: string) =>
  pack.months.some((month) => month.toLowerCase() === name.trim().toLowerCase());

const unitWord = (pack: TakePack, unit: TakeUnit, n: number) =>
  n === 1 ? pack.unit[unit].one : pack.unit[unit].many;

/** The unit after "bei": German takes the dative plural ("bei 12 Arbeitstagen"), English has no case. */
const unitDative = (pack: TakePack, unit: TakeUnit, n: number) =>
  n === 1 ? pack.unit[unit].oneDat : pack.unit[unit].manyDat;

const money = (pack: TakePack, eur: number) => formatMoney(eur, pack.locale, pack.money);

/** True when the calendar explains nothing worth a percentage (no share, or one that rounds to 0). */
export const noCalendarShare = (s: number | null): boolean => s === null || Math.round(s * 100) === 0;

/**
 * The verdict sentence, for the result card and the report sentence. `display`
 * writes the percentages the way the card does (real minus sign, thin space);
 * the default is copy-paste text with an ASCII hyphen.
 */
export function verdictText(
  pack: TakePack,
  facts: Pick<Facts, "unit" | "h" | "p" | "s" | "verdict" | "countA" | "countB">,
  display = false,
): string {
  const v = pack.verdict;
  const s = facts.s === null ? "0" : String(Math.round(facts.s * 100));
  const pct = (fraction: number) =>
    display ? formatPercent(fraction, pack.locale, { digits: 1, sign: true }) : percentText(pack, fraction);
  const extra = facts.countB - facts.countA;
  const u = pack.unit[facts.unit].one;
  const text = (): string => {
    switch (facts.verdict) {
      case "calendar": {
        const one = extra === 1;
        const key =
          facts.unit === "weeks"
            ? one ? "calendarOne" : "calendarMany"
            : facts.unit === "cdays"
              ? one ? "calendarCDayOne" : "calendarCDayMany"
              : one ? "calendarDayOne" : "calendarDayMany";
        return fill(v[key], { s, n: countText(pack, extra) });
      }
      case "reverse":
        return fill(v.reverse, { u, units: pack.unit[facts.unit].many, p: pct(facts.p) });
      case "mixed":
        return fill(v.mixed, { s });
      case "real":
        if (noCalendarShare(facts.s)) return facts.countA === facts.countB ? v.equal : fill(v.none, { u, p: pct(facts.p) });
        return fill(v.real, { s });
      case "shrinks":
        return fill(v.shrinks, { u, p: pct(facts.p) });
      case "down": {
        if (Math.abs(facts.h) < 0.0005) return fill(v.flat, { u, p: pct(facts.p) });
        // The headline falls. Say what the calendar did to it: hid a harder fall, ate part of it, or made all of it.
        const key =
          facts.p < facts.h - REVERSE_MARGIN
            ? "downWorse"
            : facts.p > -0.0005
              ? "downFlips"
              : facts.p > facts.h + REVERSE_MARGIN
                ? "downPart"
                : "downSame";
        return fill(v[key], { u, p: pct(facts.p) });
      }
      default:
        return v.thin;
    }
  };
  // Copy-paste text carries plain spaces; the card keeps its no-break spaces.
  return display ? text() : text().replace(/\u00a0/g, " ");
}

/** The one report sentence, per section 6 of the spec. */
export function buildSentence(pack: TakePack, f: Facts): string {
  const t = pack.take;
  const month = isMonth(pack, f.nameA) && isMonth(pack, f.nameB);
  const parts = [
    fill(t.s1, {
      metric: f.metric,
      b: f.nameB,
      va: money(pack, f.valueA),
      vb: money(pack, f.valueB),
      inA: fill(month ? t.inMonth : t.inOther, { a: f.nameA }),
      h: percentText(pack, f.h),
    }),
    fill(month ? t.countsMonth : t.countsOther, {
      a: f.nameA,
      b: f.nameB,
      na: countText(pack, f.countA),
      nb: countText(pack, f.countB),
      units: unitWord(pack, f.unit, f.countB),
    }),
    fill(t.per, {
      u: pack.unit[f.unit].one,
      pa: money(pack, f.valueA / f.countA),
      pb: money(pack, f.valueB / f.countB),
      p: percentText(pack, f.p),
    }),
    verdictText(pack, f),
    t.limit,
  ];
  if (f.unit === "weeks") parts.push(t.attr);
  return parts.join(" ");
}

/** The prompt that sends the visitor's AI to the rules file. */
export function buildPrompt(pack: TakePack, f: Facts): string {
  return fill(pack.take.prompt, {
    file: pack.take.fileName,
    h: percentText(pack, f.h),
    a: f.nameA,
    b: f.nameB,
    va: money(pack, f.valueA),
    vb: money(pack, f.valueB),
    na: formatNumber(f.countA, pack.locale, plain),
    nb: formatNumber(f.countB, pack.locale, plain),
    units: unitDative(pack, f.unit, f.countA),
    u: pack.unit[f.unit].one,
  });
}

export interface RulesContext {
  /** The Act 2 trigger, per 1.000 units. */
  readonly trigger: number;
  /** Include the Northwind defect rule (the visitor used Act 2). */
  readonly withDefects: boolean;
}

/**
 * The rules file. Rule 1 carries the visitor's numbers; the defect rule and the
 * trigger carry NORTHWIND proof numbers, labelled as such, and are derived
 * from the embedded data, never typed in.
 */
export function buildRules(pack: TakePack, f: Facts, ctx: RulesContext): string {
  const r = pack.take.rules;
  const locale = pack.locale;
  const u = pack.unit[f.unit].one;
  const blocks: string[] = [];
  const next = () => String(blocks.length + 1);

  const proof1 = [
    fill(r.r1proof, { a: f.nameA, b: f.nameB, h: percentText(pack, f.h), p: percentText(pack, f.p) }),
    f.s === null || noCalendarShare(f.s) ? "" : fill(r.r1share, { s: String(Math.round(f.s * 100)) }),
  ]
    .filter(Boolean)
    .join(" ");
  blocks.push([fill(r.r1h, { n: next() }), fill(r.r1, { u }), proof1].join("\n"));

  if (ctx.withDefects) {
    const c = craftComparison();
    blocks.push(
      [
        fill(r.r2h, { n: next() }),
        r.r2,
        fill(r.r2proof, {
          ra: String(c.craft.records),
          rb: String(c.nextByRecords.records),
          lead: formatPercent(c.leadRecords, locale, { ...plain, digits: 0, sign: true }),
          pa: formatNumber(c.craft.rate, locale, { ...plain, digits: 2 }),
          pb: formatNumber(c.nextByRate.rate, locale, { ...plain, digits: 2 }),
          mult: formatNumber(c.multiple, locale, { ...plain, digits: 1 }),
        }),
      ].join("\n"),
    );
  }

  blocks.push(
    [
      fill(r.r3h, { n: next() }),
      r.r3,
      fill(r.r3trigger, { m: pack.months[EXAMPLE_TRIGGER_MONTH - 1] as string, t: formatNumber(ctx.trigger, locale, { ...plain, digits: 2 }) }),
      r.r3gap,
    ].join("\n"),
  );
  blocks.push([fill(r.r4h, { n: next() }), r.r4].join("\n"));

  return `${r.title}\n${r.lead}\n\n${blocks.join("\n\n")}`;
}
