/**
 * The shape of every word of "Die Zahl, die trägt". The texts live in
 * copy-de.ts and copy-en.ts; templates fill {placeholders} via template.ts.
 * Client code imports only types (and SECTION_IDS) from here, so a page
 * carries one locale. German is the primary text: real umlauts, "du", no
 * dashes as punctuation. Kit file and column names stay in English in both
 * locales. The interface keeps both locales key for key (copy.test.ts checks
 * it at runtime as well).
 */

import type { Plural } from "./template";
import type { ClaimId, LineId, Truth } from "./data";
import type {
  CompareId,
  CostId,
  CounterId,
  Decision,
  DefectId,
  FlagId,
  NumberId,
  OpenId,
  SheetField,
  TriggerId,
  Verdict,
} from "./logic";

export type SectionId = "bericht" | "vergleichen" | "maengel" | "pruefen" | "entscheiden" | "mitnehmen";
export const SECTION_IDS: readonly SectionId[] = [
  "bericht",
  "vergleichen",
  "maengel",
  "pruefen",
  "entscheiden",
  "mitnehmen",
];

export interface ChoiceCopy {
  readonly label: string;
  /** One sentence or two from the data, shown on choice. */
  readonly result: string;
}

export interface BridgeChoiceCopy extends ChoiceCopy {
  /** The learner's answer as a labelled line for prompt 2. */
  readonly bridge: string;
}

export interface SheetOptionCopy {
  readonly label: string;
  /** What the data says about this option. */
  readonly fact: string;
  /** The VP's objection, only where he has a real argument. */
  readonly vp?: string;
  /** The option as a line on the decision sheet (after "Row: "). */
  readonly sheet: string;
}

export interface ClaimCopy {
  readonly label: string;
  readonly source: string;
  readonly result: string;
  /** The line under the sample rows. */
  readonly total: string;
}

export interface Figure {
  readonly value: string;
  readonly label: string;
  readonly note: string;
}

export interface NorthwindCopy {
  readonly intro: {
    readonly facts: string;
    readonly half: string;
    readonly stationsLabel: string;
  };
  readonly stationLinks: Readonly<Record<SectionId, string>>;
  readonly headings: Readonly<Record<SectionId, string>>;
  readonly verdict: Readonly<Record<Verdict, string>>;
  readonly empty: string;
  readonly lines: Readonly<Record<LineId | "TOTAL", string>>;
  readonly report: {
    readonly figuresLabel: string;
    readonly figures: readonly [Figure, Figure, Figure];
    readonly quote: string;
    readonly attribution: string;
    readonly gutLegend: string;
    readonly gutNote: string;
  };
  readonly decisionLabel: Readonly<Record<Decision, string>>;
  readonly decisionShort: Readonly<Record<Decision, string>>;
  readonly compare: {
    readonly legend: string;
    readonly options: Readonly<Record<CompareId, BridgeChoiceCopy>>;
    readonly headline: Readonly<Record<CompareId, string>>;
    readonly report: string;
    readonly figureCaption: string;
    readonly figureAug: string;
    readonly figureSep: string;
    readonly figureFrom: string;
    readonly figurePerWeek: string;
    readonly barsHeading: string;
    readonly barsBasis: Readonly<Record<"report" | "month" | "week", string>>;
    readonly totalOnly: string;
  };
  readonly defects: {
    readonly legend: string;
    readonly options: Readonly<Record<DefectId, BridgeChoiceCopy>>;
    readonly report: string;
    readonly ladderCaption: string;
    readonly ladderScale: Readonly<Record<DefectId, string>>;
    readonly noReport: string;
    readonly notInData: string;
    readonly echo: string;
    readonly flagged: string;
    readonly noise: string;
    readonly lineHeader: string;
    readonly valueHeader: string;
  };
  readonly flag: {
    readonly legend: string;
    readonly options: Readonly<Record<FlagId, BridgeChoiceCopy>>;
    readonly evidenceRate: string;
    readonly evidenceScrap: string;
    readonly evidenceValue: string;
    readonly evidenceShare: string;
    readonly falls: string;
    readonly rises: string;
    /** Lead of the chips that repeat the ladder's marks under the 2b result. */
    readonly markedAbove: string;
  };
  readonly bridge: {
    readonly title: string;
    readonly caption: string;
    readonly disabled: string;
    /** {answered} and {rest}: blank numbers joined with listAnd. */
    readonly lead: Plural;
    readonly listAnd: string;
    readonly limits: Readonly<Record<OpenId, string>>;
  };
  readonly check: {
    readonly intro: string;
    readonly group: string;
    readonly truth: Readonly<Record<Truth, string>>;
    readonly claims: Readonly<Record<ClaimId, ClaimCopy>>;
    /** {said} and {truth}: the truth words. */
    readonly echo: { readonly same: string; readonly differs: string };
    /** {value}: the formatted source value. */
    readonly sourceShows: string;
    readonly sourceNone: string;
    /** {count}: the formatted number of rows not shown. */
    readonly more: string;
    readonly missingColumn: string;
    /** {count} of {of}. */
    readonly counter: string;
    readonly closing: string;
  };
  readonly decide: {
    readonly intro: string;
    readonly rows: Readonly<Record<SheetField, string>>;
    readonly sheetRows: Readonly<Record<SheetField, string>>;
    readonly options: {
      readonly decision: Readonly<Record<Decision, SheetOptionCopy>>;
      readonly number: Readonly<Record<NumberId, SheetOptionCopy>>;
      readonly cost: Readonly<Record<CostId, SheetOptionCopy>>;
      readonly open: Readonly<Record<OpenId, SheetOptionCopy>>;
      readonly counter: Readonly<Record<CounterId, SheetOptionCopy>>;
      readonly trigger: Readonly<Record<TriggerId, SheetOptionCopy>>;
    };
    /**
     * Keyed by the learner's decision the chosen number argues against. Shown
     * above the option's own fact, never instead of it. The rework text never
     * claims a demand or revenue figure measures defects.
     */
    readonly against: Readonly<Record<Decision, string>>;
    readonly vpLabel: string;
    readonly dataLabel: string;
    readonly sheetHeading: string;
    readonly sheetHolds: string;
    /** {count}: rows that hold. */
    readonly sheetHolding: Plural;
    /** {count}: open rows. */
    readonly sheetOpen: Plural;
    readonly gut: {
      /** {gut} and {decision}: the short decision names. */
      readonly turned: string;
      readonly "same-holds": string;
      readonly "same-weak": string;
    };
    readonly workshopHeading: string;
    readonly workshop: string;
    readonly workshopSource: string;
    readonly weakTag: Readonly<Record<"misleads" | "absent", string>>;
  };
  readonly takeaways: {
    readonly traps: { readonly title: string; readonly text: string; readonly caption: string };
    readonly check: { readonly title: string; readonly text: string; readonly caption: string };
    readonly sheet: {
      readonly title: string;
      readonly text: string;
      readonly caption: string;
      readonly exampleTitle: string;
    };
  };
  readonly ui: {
    readonly copy: string;
    readonly copied: string;
    readonly copyFailed: string;
    readonly reset: string;
    readonly resetNote: string;
    readonly provenance: string;
  };
}
