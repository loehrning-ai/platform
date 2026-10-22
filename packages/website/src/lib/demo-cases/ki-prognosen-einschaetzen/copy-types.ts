/**
 * Demo 01 "1.050 Stück, sieben Morgen": the shape of every word the demo
 * shows. The words live in copy-de.ts and copy-en.ts with the same keys
 * (copy.test.ts); a client module only ever imports the one for its locale.
 */
import type { Locale } from "@/lib/i18n/locale";
import type { OptionKey, OwnerKey } from "./data";
import { keepTriplesTogether } from "./fmt";
import type { Pattern, SplitMessage, StampKey } from "./logic";

/** A sentence of the five-sentence form: text runs and labelled blanks. */
export type SentencePart = string | { readonly blank: string; readonly label: string };

export interface ForecastCopy {
  readonly stores: {
    readonly names: readonly [string, string, string];
    /** "Standort Zentrum" / "the city centre site". */
    readonly inSentence: readonly [string, string, string];
    /** Sentence start: "Standort Zentrum" / "The city centre site". */
    readonly atStart: readonly [string, string, string];
    readonly order: string;
  };
  readonly caseStrip: {
    readonly heading: string;
    readonly asked: string;
    readonly askedNote: string;
    readonly estimated: string;
    readonly estimatedNote: string;
    readonly delivered: string;
    readonly deliveredNote: string;
    readonly gap: (missing: string) => string;
    readonly figure: string;
  };
  readonly thread: {
    readonly label: string;
    readonly steps: readonly [string, string, string];
    readonly current: string;
    readonly done: string;
    /** Shown once when a saved week from this browser is picked up. */
    readonly resumed: string;
    readonly resumedRestart: string;
    /** Where the resumed week stands, for the notice: "Morgen 3 von 7". */
    readonly resumedMorning: (day: number, total: number) => string;
    /** Shown after a restart, with the undo action. */
    readonly restarted: string;
    readonly undo: string;
  };
  readonly split: {
    readonly heading: string;
    readonly lead: string;
    readonly glossary: readonly { readonly term: string; readonly text: string }[];
    readonly reference: (ask: string, preorders: string, median: string) => string;
    readonly inputLabel: (store: string) => string;
    readonly fewer: (store: string) => string;
    readonly more: (store: string) => string;
    readonly keys: string;
    readonly remaining: (n: string) => string;
    readonly tooMany: (n: string) => string;
    readonly allSplit: string;
    readonly check: string;
    readonly checkHint: string;
    readonly chartHeading: string;
    readonly pool: (given: string) => string;
    readonly poolPlaced: string;
    readonly poolPlacedAria: string;
    readonly poolAria: (given: string, left: string) => string;
    readonly rowBefore: (median: string) => string;
    readonly rowAfter: (alloc: string, median: string) => string;
    readonly short: (n: string) => string;
    readonly left: (n: string) => string;
    readonly exact: string;
    readonly barAria: (store: string, alloc: string, median: string, ask: string, note: string) => string;
    readonly legend: { readonly median: string; readonly ask: string; readonly over: string };
    readonly feedbackHeading: string;
    readonly headlineAll: string;
    readonly headlineLeft: (n: string) => string;
    readonly customersNone: string;
    readonly customersSome: (total: string, unavoidable: string, extra: string) => string;
    readonly message: (message: SplitMessage, locale: Locale) => string;
    readonly headroomLabel: string;
    readonly headroomNone: string;
    readonly headroomDefinition: string;
    readonly referenceLine: string;
    readonly stale: string;
    readonly presetsLabel: string;
    readonly presets: Readonly<Record<Exclude<Pattern, "own">, string>>;
    readonly continueOwn: string;
    readonly continueMedian: string;
    readonly record: (plan: string, pattern: string) => string;
    readonly patternNames: Readonly<Record<Pattern, string>>;
  };
  readonly mornings: {
    readonly heading: string;
    readonly preview: string;
    readonly directEntry: string;
    readonly directEntryNote: string;
    readonly intro: (plan: string, delivery: string) => string;
    readonly fallback: string;
    readonly ownerQuestion: string;
    readonly ownerOptions: Readonly<Record<OwnerKey, string>>;
    readonly customLabel: string;
    readonly customUse: string;
    readonly ownerAnswers: Readonly<Record<OwnerKey, string>>;
    readonly ownerRightMark: string;
    readonly ownerWrongMark: string;
    readonly start: string;
    readonly ownerRecord: (owner: string) => string;
    readonly morningHeading: (day: number) => string;
    readonly dayLabel: (day: number) => string;
    readonly weekLabel: string;
    readonly slotName: (day: number, state: string) => string;
    readonly slotOpen: string;
    readonly slotToday: string;
    readonly tiles: Readonly<Record<"fresh" | "wape" | "bias" | "coverage", { readonly name: string; readonly sub: string; readonly limit: string }>>;
    readonly pass: string;
    readonly fail: string;
    readonly limitPrefix: string;
    readonly boardLabel: string;
    readonly storeBias: string;
    readonly todayUnits: string;
    readonly modelPlan: string;
    readonly standingPlan: string;
    readonly events: Readonly<Record<"competitorToday" | "stockoutZentrum", string>>;
    readonly eventLabel: string;
    readonly statusGreen: string;
    readonly statusRed: (checks: string) => string;
    readonly promptGreen: string;
    readonly promptRed: string;
    readonly options: Readonly<Record<OptionKey, string>>;
    readonly stamps: Readonly<Record<StampKey, string>>;
    readonly why: readonly string[];
    readonly consequences: readonly Readonly<Partial<Record<OptionKey, string>>>[];
    readonly lessons: readonly string[];
    readonly yourPick: string;
    readonly otherPaths: string;
    readonly rightPath: string;
    readonly deliveryModel: (units: string) => string;
    readonly deliveryStanding: (units: string) => string;
    readonly deliveryMedianNote: (units: string) => string;
    readonly deliveryWaitData: string;
    readonly deliveryWaitStock: string;
    readonly deliveryWaitRetrain: string;
    readonly next: string;
    readonly toResult: string;
  };
  readonly result: {
    readonly heading: string;
    readonly preview: string;
    readonly score: (n: number) => string;
    readonly missed: (days: string, count: number) => string;
    readonly needless: (days: string, count: number) => string;
    readonly wrongStep: (days: string, count: number) => string;
    readonly holdMornings: (h: number) => string;
    readonly openingOwn: (pattern: string, split: string, mornings: string) => string;
    readonly openingMedian: (pattern: string, split: string, mornings: string) => string;
    readonly openingMedianOnly: (mornings: string) => string;
    readonly openingFallback: (mornings: string) => string;
    readonly deviation: (store: string, got: string, median: string) => string;
    readonly roomQuestion: string;
    readonly lessonsHeading: string;
    readonly legend: Readonly<Record<"right" | "missed" | "needless" | "wrongStep", string>>;
    readonly toTakeaways: string;
    readonly restart: string;
    readonly toWorkshop: string;
    readonly toCase: string;
    readonly record: (right: number) => string;
  };
  readonly takeaways: {
    readonly heading: string;
    readonly intro: string;
    readonly copy: string;
    readonly copied: string;
    readonly copiedAnnouncement: (title: string) => string;
    readonly copyFailed: string;
    readonly titles: readonly [string, string, string];
    readonly rule: string;
    readonly checkNote: string;
    readonly check: (owner: string) => string;
    readonly sentencesNote: string;
    readonly sentences: readonly (readonly SentencePart[])[];
    readonly examplePrefix: string;
    readonly examples: readonly string[];
    readonly ownerDefault: string;
    readonly blank: string;
  };
  readonly sources: {
    readonly heading: string;
    readonly fromCase: string;
    readonly fromCaseItems: readonly string[];
    readonly invented: string;
    readonly inventedItems: readonly string[];
    readonly toCase: string;
  };
}

/**
 * Every string, and every string a copy function returns, with "480 / 365 / 205"
 * joined by no-break spaces, so a triple never wraps mid-number.
 */
export function withTriplesTogether<T>(value: T): T {
  if (typeof value === "string") return keepTriplesTogether(value) as T;
  if (typeof value === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    const wrapped = (...args: unknown[]) => withTriplesTogether(fn(...args));
    // Keep arity and name, so the wrapped function looks like the original.
    Object.defineProperty(wrapped, "length", { value: fn.length });
    Object.defineProperty(wrapped, "name", { value: fn.name });
    return wrapped as T;
  }
  if (Array.isArray(value)) return value.map((item) => withTriplesTogether(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withTriplesTogether(item)])) as T;
  }
  return value;
}
