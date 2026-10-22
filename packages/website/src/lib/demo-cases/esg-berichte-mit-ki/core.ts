import type { Locale } from "@/lib/i18n/locale";
import { BILLS_2025 } from "./constants";
import type {
  Answer,
  AnswerRow,
  Bill,
  Cell,
  Day,
  Fact,
  FactId,
  Grade,
  L,
  Option,
  PredictionScore,
  Request,
  RowId,
  SheetRow,
  Status,
  Verdict,
} from "./types";

/*
 * The demo's logic without its data: safe for client code. It imports no
 * module that carries words (facts.ts, rows.ts, copy.ts, takeaways.ts). The
 * facts and the judge's sentences come in as an EsgWorld: on the server and
 * in tests with both locales (logic.ts), on the page as the locale pack
 * (pack.ts), whose texts carry only the page's locale.
 */

/** Status labels stay English in both locales, as in the kit. */
export const STATUS_LABEL: Readonly<Record<Status, string>> = {
  ok: "OK",
  check: "NEEDS CHECK",
  notFound: "NOT FOUND",
};

const RANK: Readonly<Record<Status, number>> = { notFound: 0, check: 1, ok: 2 };

/** Rule 3: a question with several parts gets the status of its weakest part. */
export const weakest = (parts: readonly Status[]): Status =>
  parts.reduce<Status>((a, b) => (RANK[b] < RANK[a] ? b : a), "ok");

export const round1 = (value: number): number => Math.round(value * 10) / 10;
const round3 = (value: number): number => Math.round(value * 1000) / 1000;
export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
export const easeOutCubic = (t: number): number => 1 - (1 - clamp01(t)) ** 3;

/** "{name}" placeholders filled from `values`; an unknown name stays as written. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

/** The judge's own sentences in one locale (spec section 5). */
export interface JudgeStrings {
  /** "{status}" and "{label}": the key's status and its detail. */
  readonly keyNotFound: string;
  readonly keyCheck: string;
  /** Also "{action}": withAction or noAction. */
  readonly keyOk: string;
  readonly withAction: string;
  readonly noAction: string;
  /** "{label}": the key's detail, when a wrong detail has no trap line of its own. */
  readonly fallbackOk: string;
  readonly fallbackCheck: string;
  readonly fallbackNotFound: string;
  /** A wrong "Aufgabe" answer with no trap line of its own. */
  readonly noActionLine: string;
}

/** Everything the judge reads: the facts, Monday's electricity card, the reasons and the sentences. */
export interface EsgWorld {
  readonly facts: readonly Fact[];
  readonly strom: Fact;
  readonly reasons: readonly Option[];
  /** One entry per locale this world carries (both in tests, one on the page). */
  readonly text: Readonly<Partial<Record<Locale, JudgeStrings>>>;
}

export interface EsgLogic {
  readonly world: EsgWorld;
  readonly factById: (id: FactId) => Fact;
  /** The fact as it stands on a day: on Monday the electricity card carries the invoice. */
  readonly factFor: (fact: Fact, day: Day) => Fact;
  /** The options of the second question for a status. */
  readonly detailOptions: (fact: Fact, status: Status) => readonly Option[];
  /** "Schlüssel: NOT FOUND · fehlt: Stromrechnung September 2025", in the world's locales. */
  readonly keyLine: (fact: Fact) => L;
  readonly judge: (base: Fact, answer: Answer, day?: Day) => Verdict;
  /** The key's stamps for all ten facts on a day (Monday: electricity is OK). */
  readonly keyStamps: (facts?: readonly Fact[], day?: Day) => Record<FactId, Answer>;
}

/** The judge bound to one world. */
export function createLogic(world: EsgWorld): EsgLogic {
  const locales = Object.keys(world.text) as Locale[];
  /** An L in the world's locales: both on the server, the page's one on the page. */
  const say = (line: (text: JudgeStrings, locale: Locale) => string): L =>
    Object.fromEntries(
      locales.map((locale) => [locale, line(world.text[locale] as JudgeStrings, locale)]),
    ) as unknown as L;

  const factById = (id: FactId): Fact => {
    const fact = world.facts.find((candidate) => candidate.id === id);
    if (!fact) throw new Error(`Unknown fact ${id}`);
    return fact;
  };

  const factFor = (fact: Fact, day: Day): Fact =>
    day === "monday" && fact.id === "strom" ? world.strom : fact;

  const detailOptions = (fact: Fact, status: Status): readonly Option[] => {
    if (status === "ok") return fact.cite;
    if (status === "check") return world.reasons;
    return fact.docs;
  };

  const optionLabel = (fact: Fact, status: Status, detail: string): L | undefined =>
    detailOptions(fact, status).find((option) => option.id === detail)?.label;

  const keyLine = (fact: Fact): L => {
    const { key } = fact;
    const label = optionLabel(fact, key.status, key.detail);
    const status = STATUS_LABEL[key.status];
    return say((text, locale) => {
      const values = { status, label: label?.[locale] ?? key.detail };
      if (key.status === "notFound") return fill(text.keyNotFound, values);
      if (key.status === "check") return fill(text.keyCheck, values);
      return fill(text.keyOk, { ...values, action: key.action ? text.withAction : text.noAction });
    });
  };

  const fallbackDetail = (fact: Fact, status: Status): L => {
    const label = optionLabel(fact, fact.key.status, fact.key.detail);
    if (!label) return say(() => "");
    const template = status === "ok" ? "fallbackOk" : status === "check" ? "fallbackCheck" : "fallbackNotFound";
    return say((text, locale) => fill(text[template], { label: label[locale] }));
  };

  /**
   * Grades one answer against the key (spec section 5):
   * 1. a status that is neither the key's nor an accepted one is wrong;
   * 2. the key's status with a wrong detail or a wrong action is half;
   * 3. an accepted status is defensible with its detail, half with another.
   * Feedback is the key line plus what is wrong with this answer. A trap line
   * already says why, so the fact's "why" follows only when no trap was shown.
   */
  const judge = (base: Fact, answer: Answer, day: Day = "friday"): Verdict => {
    const fact = factFor(base, day);
    const { key } = fact;
    const lines: L[] = [keyLine(fact)];
    let trapShown = false;
    const trap = (name: string): L | undefined => {
      const line = fact.traps[name];
      if (line) trapShown = true;
      return line;
    };
    const close = (): L[] => (trapShown ? lines : [...lines, fact.why]);

    if (answer.status === key.status) {
      const detailRight = answer.detail === key.detail;
      const actionRight = key.status !== "ok" || Boolean(answer.action) === Boolean(key.action);
      if (detailRight && actionRight) {
        return { grade: "right", rule: fact.rule, lines: [...lines, fact.why] };
      }
      let rule: 1 | 2 | 3 = fact.rule;
      if (!detailRight) {
        const name = `${answer.status}/${answer.detail}`;
        lines.push(trap(name) ?? fallbackDetail(fact, answer.status));
        rule = fact.trapRules?.[name] ?? (answer.status === "ok" ? 2 : 3);
      }
      if (!actionRight) {
        lines.push(trap(`action:${answer.action ? "yes" : "no"}`) ?? say((text) => text.noActionLine));
      }
      return { grade: "half", rule, lines: close() };
    }

    const accepted = fact.accepted?.find((candidate) => candidate.status === answer.status);
    if (accepted) {
      if (answer.detail === accepted.detail) {
        return { grade: "defensible", rule: 3, lines: [...lines, accepted.note, fact.why] };
      }
      const name = `${answer.status}/${answer.detail}`;
      lines.push(trap(name) ?? accepted.note);
      return { grade: "half", rule: fact.trapRules?.[name] ?? 3, lines: close() };
    }

    const name = `${answer.status}/${answer.detail}`;
    const specific = trap(name) ?? trap(answer.status);
    if (specific) lines.push(specific);
    const rule = fact.trapRules?.[name] ?? fact.trapRules?.[answer.status] ?? 3;
    return { grade: "wrong", rule, lines: close() };
  };

  const keyStamps = (facts: readonly Fact[] = world.facts, day: Day = "friday"): Record<FactId, Answer> =>
    Object.fromEntries(facts.map((fact) => [fact.id, factFor(fact, day).key])) as Record<FactId, Answer>;

  return { world, factById, factFor, detailOptions, keyLine, judge, keyStamps };
}

/** True when every decision on the chosen path is set (gates "Prüfen"). */
export function isComplete(draft: Partial<Answer>): draft is Answer {
  if (!draft.status || !draft.detail) return false;
  if (draft.status === "ok") return typeof draft.action === "boolean";
  return true;
}

export type Stamps = Partial<Record<FactId, Answer>>;

/** One row from a set of stamps: open until every part is stamped, then the weakest part. */
export function rowCell(row: AnswerRow, stamps: Stamps): Cell {
  const parts = row.deps.map((id) => stamps[id]);
  if (parts.some((part) => part === undefined)) return { state: "open" };
  const status = weakest(parts.map((part) => (part as Answer).status));
  const source = row.actionFrom ? stamps[row.actionFrom] : undefined;
  const action = Boolean(source && source.status === "ok" && source.action);
  return { state: "filled", status, action };
}

const sameCell = (a: Cell, b: Cell): boolean =>
  a.state === b.state &&
  (a.state === "open" ||
    (b.state === "filled" && a.status === b.status && a.action === b.action));

/**
 * The sheet: the key's cell for every row whose parts the user has stamped,
 * the user's own cell beside it, and whether the two would go out differently.
 */
export function sheet(
  rows: readonly AnswerRow[],
  keys: Record<FactId, Answer>,
  yours: Stamps,
): SheetRow[] {
  return rows.map((row) => {
    const filled = row.deps.every((id) => yours[id] !== undefined);
    const key: Cell = filled ? rowCell(row, keys) : { state: "open" };
    const own = rowCell(row, yours);
    return { row, key, yours: own, differs: filled && !sameCell(key, own) };
  });
}

export function tally(
  rows: readonly SheetRow[],
  request: Request,
): { ok: number; check: number; notFound: number } {
  const counts = { ok: 0, check: 0, notFound: 0 };
  for (const entry of rows) {
    if (entry.row.request !== request || entry.key.state !== "filled") continue;
    counts[entry.key.status] += 1;
  }
  return counts;
}

/** Rows whose status differs between two sets of stamps. */
export function changed(rows: readonly AnswerRow[], before: Stamps, after: Stamps): RowId[] {
  return rows
    .filter((row) => {
      const a = rowCell(row, before);
      const b = rowCell(row, after);
      return a.state === "filled" && b.state === "filled" && a.status !== b.status;
    })
    .map((row) => row.id);
}

/** Rows that keep their status but get a new value on Monday. */
export function valueChanged(rows: readonly AnswerRow[], before: Stamps, after: Stamps): RowId[] {
  const moved = new Set(changed(rows, before, after));
  return rows.filter((row) => row.value.monday && !moved.has(row.id)).map((row) => row.id);
}

export function scorePrediction(
  picked: readonly RowId[],
  actual: readonly RowId[],
): PredictionScore {
  return {
    hits: picked.filter((id) => actual.includes(id)),
    misses: actual.filter((id) => !picked.includes(id)),
    falseAlarms: picked.filter((id) => !actual.includes(id)),
  };
}

/**
 * Kit rule 2 as a function: count the months before any total. Never
 * `complete` without 12 distinct months with a bill.
 */
export function yearFromBills(bills: readonly Bill[] = BILLS_2025): {
  months: number;
  coverage: number;
  mwh: number;
  complete: boolean;
} {
  const billed = bills.filter((bill) => typeof bill.kWh === "number" && bill.kWh >= 0);
  const months = new Set(billed.map((bill) => bill.month)).size;
  const kWh = billed.reduce((sum, bill) => sum + (bill.kWh ?? 0), 0);
  return {
    months,
    coverage: round3(months / 12),
    mwh: round1(kWh / 1000),
    complete: months === 12,
  };
}

export const pvShare = (pvMWh: number, yearMWh: number): number => round1((pvMWh / yearMWh) * 100);

export const payback = (priceMKD: number, kWh: number, tariff: number): number =>
  round1(priceMKD / (kWh * tariff));

/** Lines of the "Gegenprobe" checklist tied to today's misses (on screen only). */
export function checklistMarks(
  grades: Partial<Record<FactId, Grade>>,
  prediction?: PredictionScore,
): ReadonlySet<1 | 2 | 3 | 4 | 5 | 6> {
  const missed = (id: FactId): boolean => grades[id] === "half" || grades[id] === "wrong";
  const marks = new Set<1 | 2 | 3 | 4 | 5 | 6>();
  if (missed("strom")) marks.add(1);
  if (missed("zert") || missed("pv")) marks.add(2);
  if (missed("ghg") || missed("mix") || missed("strom")) marks.add(3);
  if (missed("bussgeld") || missed("wasser") || missed("kopf") || missed("unfall")) marks.add(4);
  if (missed("glas")) marks.add(5);
  if (prediction) {
    const watched: readonly RowId[] = ["Q1", "Q2", "F3"];
    if ([...prediction.misses, ...prediction.falseAlarms].some((id) => watched.includes(id))) {
      marks.add(6);
    }
  }
  return marks;
}

/* ─── Frame functions: pure, t from 0 to 1 ─────────────────────────────── */

/** The tallest month on either day, so the scale never changes on Monday. */
export const STRIP_MAX_KWH = 41_200;

export interface BarFrame {
  readonly month: string;
  readonly kWh: number | null;
  /** 0 to 1 of the strip height. */
  readonly scaleY: number;
  /** The hatched "no bill" slot; 0 for a month with a bill. */
  readonly gapOpacity: number;
}

/** M1, counting the months (Friday, 600ms): bars rise one after another, the gap appears last. */
export function countFrame(bills: readonly Bill[], t: number): BarFrame[] {
  return bills.map((bill, index) =>
    bill.kWh === null
      ? { month: bill.month, kWh: null, scaleY: 0, gapOpacity: clamp01((t - 0.7) / 0.3) }
      : {
          month: bill.month,
          kWh: bill.kWh,
          scaleY: (easeOutCubic((t - index * 0.04) / 0.4) * bill.kWh) / STRIP_MAX_KWH,
          gapOpacity: 0,
        },
  );
}

export interface SeptemberFrame {
  readonly septScaleY: number;
  readonly hatchOpacity: number;
  readonly year: "before" | "after";
}

/** M4, the September bill (Monday, 900ms): the missing month was the peak. */
export function septemberFrame(t: number): SeptemberFrame {
  return {
    septScaleY: (easeOutCubic(t / 0.45) * 41_200) / STRIP_MAX_KWH,
    hatchOpacity: 1 - clamp01(t / 0.3),
    year: t < 0.5 ? "before" : "after",
  };
}
