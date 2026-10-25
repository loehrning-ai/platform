import type { DemoPack } from "./copy";
import { fill, formatNumber } from "./format";
import { MAX_COUNT, calendarDaysInMonth, compare, weekdaysInMonth, type CompareResult, type FieldId } from "./logic";
import { hasScaleWord, parseMonth, parseNumber, type MonthSum, type ParseResult } from "./parse";
import type { Facts, TakeUnit } from "./takeaway";

/** The state of "Dein Vergleich" and how it becomes the numbers of the result and the takeaways. */
export interface OwnState {
  readonly nameA: string;
  readonly nameB: string;
  readonly aVal: string;
  readonly aN: string;
  readonly bVal: string;
  readonly bN: string;
  readonly unit: TakeUnit;
  readonly aMonth: string;
  readonly bMonth: string;
  readonly aHol: number;
  readonly bHol: number;
  /** Weekdays without a value in the pasted rows (they count as holidays until the visitor changes it). */
  readonly aGap: number;
  readonly bGap: number;
  readonly paste: string;
  readonly metric: string;
  readonly edited: boolean;
}

type DerivePack = Pick<DemoPack, "locale" | "months" | "take" | "stage" | "cmp">;

/** The NORTHWIND example, in the pack's number format. */
export function prefill(pack: DerivePack): OwnState {
  const n = (value: number) => formatNumber(value, pack.locale, { plain: true });
  return {
    nameA: pack.stage.monthA,
    nameB: pack.stage.monthB,
    aVal: n(17233647),
    aN: "4",
    bVal: n(21687544),
    bN: "5",
    unit: "weeks",
    aMonth: "2023-08",
    bMonth: "2023-09",
    aHol: 0,
    bHol: 0,
    aGap: 0,
    bGap: 0,
    paste: "",
    metric: pack.take.metric,
    edited: false,
  };
}

export interface Derived {
  readonly result: CompareResult;
  /** Fields whose text contains a scale word such as "Mio". */
  readonly scale: readonly FieldId[];
  readonly nameA: string;
  readonly nameB: string;
  readonly countA: number | null;
  readonly countB: number | null;
  readonly facts: Facts | null;
  /** What to tell the visitor when there is no result: the missing fields or the implausible ones. Null when the result is fine. */
  readonly note: string | null;
  /** Fields to mark invalid. */
  readonly flagged: readonly FieldId[];
}

const names = (pack: DerivePack, ids: readonly FieldId[]) => ids.map((id) => pack.cmp.fieldNames[id]).join(", ");

type Issue = "empty" | "nan" | "min" | "pos";

/** Why one field is unusable: nothing typed, not a number, or a number that cannot be a month's value or count. */
function issueOf(id: FieldId, raw: string, parsed: number | null): Issue | null {
  if (raw.trim() === "") return "empty";
  if (parsed === null) return "nan";
  if (parsed > 0) return null;
  return id === "aN" || id === "bN" ? "min" : "pos";
}

/** One sentence per real problem, so a filled field is never reported as missing. */
function noteFor(result: CompareResult, pack: DerivePack, issues: Partial<Record<FieldId, Issue>>): string | null {
  if (result.ok) return null;
  if (result.implausible === "count") return fill(pack.cmp.tooMany, { x: names(pack, result.flagged ?? []), n: MAX_COUNT });
  if (result.implausible === "growth") return pack.cmp.tooBig;
  const ids = result.missing;
  const withIssue = (kind: Issue) => ids.filter((id) => issues[id] === kind);
  const empty = withIssue("empty");
  const sentences: string[] = [];
  if (empty.length > 0 || ids.every((id) => issues[id] === undefined)) sentences.push(fill(pack.cmp.thin, { x: names(pack, empty.length > 0 ? empty : ids) }));
  for (const id of withIssue("nan")) sentences.push(fill(pack.cmp.notNumber, { x: pack.cmp.fieldNames[id] }));
  for (const id of withIssue("min")) sentences.push(fill(pack.cmp.countMin, { x: pack.cmp.fieldNames[id] }));
  for (const id of withIssue("pos")) sentences.push(fill(pack.cmp.valuePos, { x: pack.cmp.fieldNames[id] }));
  return sentences.join(" ");
}

const monthName = (pack: DerivePack, month: string, fallback: string) => {
  const parsed = parseMonth(month);
  return parsed ? (pack.months[parsed.month - 1] ?? fallback) : fallback;
};

export function derive(own: OwnState, pack: DerivePack): Derived {
  const days = own.unit !== "weeks";
  const daysIn = own.unit === "cdays" ? calendarDaysInMonth : weekdaysInMonth;
  const a = parseMonth(own.aMonth);
  const b = parseMonth(own.bMonth);
  const countA = days ? (a ? daysIn(a.year, a.month, own.aHol) : null) : parseNumber(own.aN, pack.locale);
  const countB = days ? (b ? daysIn(b.year, b.month, own.bHol) : null) : parseNumber(own.bN, pack.locale);
  const aVal = parseNumber(own.aVal, pack.locale);
  const bVal = parseNumber(own.bVal, pack.locale);
  const result = compare({ aVal, aN: countA, bVal, bN: countB });
  const scale = (
    [["aVal", own.aVal], ["bVal", own.bVal]] as const
  )
    .filter(([, text]) => hasScaleWord(text))
    .map(([id]) => id);
  const nameA = days ? monthName(pack, own.aMonth, "A") : own.nameA.trim() || "A";
  const nameB = days ? monthName(pack, own.bMonth, "B") : own.nameB.trim() || "B";
  const facts: Facts | null =
    result.ok && aVal !== null && bVal !== null && countA !== null && countB !== null
      ? {
          metric: own.metric.trim() || pack.take.metric,
          nameA,
          nameB,
          unit: own.unit,
          valueA: aVal,
          valueB: bVal,
          countA,
          countB,
          h: result.h,
          p: result.p,
          s: result.s,
          verdict: result.verdict,
        }
      : null;
  const flagged = result.ok ? [] : result.implausible ? (result.flagged ?? []) : result.missing;
  const parsedFor: Record<FieldId, number | null> = { aVal, bVal, aN: countA, bN: countB };
  const rawFor: Record<FieldId, string> = { aVal: own.aVal, bVal: own.bVal, aN: days ? "1" : own.aN, bN: days ? "1" : own.bN };
  const issues: Partial<Record<FieldId, Issue>> = {};
  for (const id of ["aVal", "aN", "bVal", "bN"] as const) {
    const issue = (scale as readonly FieldId[]).includes(id) ? null : issueOf(id, rawFor[id], parsedFor[id]);
    if (issue) issues[id] = issue;
  }
  return { result, scale, nameA, nameB, countA, countB, facts, note: noteFor(result, pack, issues), flagged };
}

/** Pasted rows to the four fields. Daily rows with a weekend become calendar days, so no row is dropped. Monthly data leaves the counts empty: the page asks for them. */
export function applyPaste(own: OwnState, parsed: Extract<ParseResult, { ok: true }>, pack: DerivePack): OwnState {
  const n = (value: number) => formatNumber(value, pack.locale, { plain: true, digits: Number.isInteger(value) ? 0 : 2 });
  const name = (sum: MonthSum) => pack.months[sum.month - 1] ?? sum.key;
  const base = { ...own, edited: true, nameA: name(parsed.a), nameB: name(parsed.b), aVal: n(parsed.a.value), bVal: n(parsed.b.value) };
  if (parsed.granularity === "daily") {
    return {
      ...base,
      unit: parsed.calendar ? "cdays" : "days",
      aMonth: parsed.a.key,
      bMonth: parsed.b.key,
      aHol: parsed.a.gapDays,
      bHol: parsed.b.gapDays,
      aGap: parsed.a.gapDays,
      bGap: parsed.b.gapDays,
    };
  }
  if (parsed.granularity === "weekly") {
    return { ...base, unit: "weeks", aN: String(parsed.a.count), bN: String(parsed.b.count), aGap: 0, bGap: 0 };
  }
  return { ...base, unit: "weeks", aN: "", bN: "", aGap: 0, bGap: 0 };
}
