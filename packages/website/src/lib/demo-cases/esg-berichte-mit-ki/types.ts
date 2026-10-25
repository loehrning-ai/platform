import type { Locale } from "@/lib/i18n/locale";

export type { Locale };

/** A month's evidence: a bill in the folder, an estimate, or nothing. */
export type CellState = "proven" | "estimate" | "missing";
/** The workshop's rule 3 vocabulary, kept in English in both languages. */
export type Status = "OK" | "NEEDS_CHECK" | "NOT_FOUND";
export type DatasetId = "electricity" | "water" | "own";

export interface MonthCell {
  /** 1..12 */
  readonly month: number;
  /** In the series' unit; null while the bill is missing. */
  readonly value: number | null;
  readonly state: CellState;
  /** Built-in datasets only. */
  readonly invoiceNo?: string;
}

export interface Series {
  readonly id: DatasetId;
  readonly label: string;
  readonly unit: string;
  readonly source?: string;
  readonly year?: number;
  /** Decimals to print (electricity 1, water 0). */
  readonly digits: number;
  /** Always 12 cells, January first. */
  readonly cells: readonly MonthCell[];
}

export interface Analysis {
  readonly provenMonths: number;
  readonly estimateMonths: number;
  readonly missingMonths: readonly number[];
  readonly estimatedMonths: readonly number[];
  /** Proven bills only; estimates are never added. */
  readonly provenSum: number;
  readonly monthCoverage: number;
  readonly avgTimes12: number | null;
  readonly maxFill: number | null;
  /** Smallest and largest proven month. Display only, no forecast. */
  readonly band: { readonly min: number; readonly max: number } | null;
  readonly status: Status;
}

/** One line of a ranked comparison under the chart. */
export interface LadderRow {
  readonly id: "draft" | "average" | "maxFill" | "guess" | "bill";
  readonly value: number;
}

/** Everything the chart and the number draw at one moment. */
export interface SceneFrame {
  readonly envelope: number;
  /** The invoice sheet's bottom edge, in the chart's value units above the baseline. */
  readonly sheetBottom: number;
  readonly sheetOpacity: number;
  readonly barHeight: number;
  readonly total: number;
  readonly stampStrike: number;
  /** The strike is lifted again once all twelve months are proven: the stamp is true. */
  readonly stampLift: number;
  readonly stripFlip: 0 | 1;
  readonly ghost: number;
  /** The "off by" label beside the bar. */
  readonly offLabel: number;
  readonly ladder: readonly number[];
}

/** Everything the intro draws at one moment (0..1). */
export interface IntroFrame {
  readonly bars: readonly number[];
  readonly stamp: number;
  readonly hole: number;
  readonly pulse: number;
}

export type TakeawayId = "answer" | "mail" | "rule";

/** The words of the demo in one language, passed from the server index. Plain data. */
export interface DemoPack {
  readonly locale: Locale;
  readonly region: string;
  readonly switchLabel: string;
  readonly datasets: { readonly electricity: string; readonly water: string; readonly own: string };
  readonly months: readonly string[];
  readonly monthLetters: readonly string[];
  readonly stripNotation: string;
  readonly legend: { readonly proven: string; readonly estimate: string; readonly missing: string };
  readonly stripAria: {
    readonly some: string;
    readonly all: string;
    readonly estimate: string;
  };
  readonly statuses: { readonly OK: string; readonly NEEDS_CHECK: string; readonly NOT_FOUND: string };
  readonly form: {
    readonly electricity: string;
    readonly water: string;
    readonly stamp: string;
    readonly draft: string;
    readonly estimated: string;
    readonly proven: string;
    readonly totalAria: string;
  };
  readonly chart: {
    readonly aria: string;
    readonly drag: string;
    readonly prompt: string;
    readonly holeAria: string;
    readonly holeValue: string;
    readonly holeNone: string;
    readonly barAria: string;
    readonly barMissingAria: string;
    readonly legendGuess: string;
    readonly legendBill: string;
    readonly off: string;
    readonly exact: string;
    readonly valueAria: string;
  };
  readonly gauge: {
    readonly months: string;
    readonly draftMonths: string;
    readonly draftKwh: string;
    readonly line: string;
    readonly hint: string;
    readonly computed: string;
  };
  readonly reveal: {
    readonly open: string;
    readonly back: string;
    readonly slider: string;
    readonly sliderValue: string;
    readonly opened: string;
    readonly closed: string;
    readonly locked: string;
    readonly guessFirst: string;
  };
  readonly ladder: {
    readonly title: string;
    readonly rows: { readonly draft: string; readonly average: string; readonly maxFill: string; readonly guess: string; readonly bill: string };
    readonly kicker: string;
    readonly note: string;
    readonly axis: string;
    readonly pending: string;
    readonly gap: string;
    readonly over: string;
    readonly rowAria: string;
  };
  readonly water: { readonly control: string; readonly line: string };
  readonly own: {
    readonly intro: string;
    readonly placeholder: string;
    readonly label: string;
    readonly unit: string;
    readonly threshold: string;
    readonly thresholdAria: string;
    readonly example: string;
    readonly clear: string;
    readonly defaultLabel: string;
    readonly cellsAria: string;
    readonly cellAria: string;
    readonly unread: string;
    readonly duplicate: string;
    readonly duplicateSwap: string;
    readonly unitHint: string;
    readonly unitMissing: string;
    readonly unitPlaceholder: string;
    readonly readThousands: string;
    readonly readDecimal: string;
    readonly readMany: string;
    readonly sep: { readonly dot: string; readonly comma: string };
    readonly unitToken: string;
    readonly unitWarn: string;
    readonly zeroHint: string;
    readonly prefilled: string;
    readonly count: string;
    readonly counted: string;
    readonly resultNone: string;
    readonly cap: string;
    readonly band: string;
    readonly empty: string;
    readonly privacy: string;
    readonly exampleText: string;
    readonly exampleLabel: string;
    readonly exampleUnit: string;
  };
  readonly takeaways: {
    readonly title: string;
    readonly names: { readonly answer: string; readonly mail: string; readonly rule: string };
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly nothingMissing: string;
    readonly signs: string;
    readonly glyphs: string;
    readonly ascii: string;
    readonly asciiNote: string;
    readonly why: string;
    readonly folderNote: string;
    readonly view: { readonly after: string; readonly before: string };
    readonly tag: { readonly after: string; readonly before: string };
    readonly beforeNote: string;
    readonly ownNote: string;
    readonly ownEmpty: string;
  };
  readonly texts: TextTemplates;
  readonly footer: string;
  readonly workshopLink: string;
}

/** Templates for the three takeaways. `{x}` placeholders are filled by takeaways.ts. */
export interface TextTemplates {
  readonly numberWords: readonly string[];
  readonly and: string;
  readonly defaultLabel: string;
  readonly stripRange: string;
  readonly holes: string;
  readonly missingOne: string;
  readonly missingMany: string;
  readonly notFoundOne: string;
  readonly notFoundMany: string;
  readonly complete: string;
  readonly source: string;
  readonly estimatedOnly: string;
  readonly estimatedTail: string;
  readonly mailSubjectOne: string;
  readonly mailSubjectMany: string;
  readonly mailSubjectNumber: string;
  readonly mailBodyOne: string;
  readonly mailBodyMany: string;
  readonly mailNumber: string;
  readonly mailMeter: string;
  readonly mailTopic: string;
  readonly mailTopicGeneric: string;
  readonly rule: string;
}
