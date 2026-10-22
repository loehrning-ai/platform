import type { Locale } from "@/lib/i18n/locale";

/** One string per locale. */
export type L = Readonly<Record<Locale, string>>;

/** The three statuses of kit rule 3. Their labels stay English in both locales. */
export type Status = "ok" | "check" | "notFound";

/** Why a document needs a check: the three cases of kit rule 3. */
export type CheckReason = "expired" | "estimate" | "conflict";

export type FactId =
  | "bussgeld"
  | "wasser"
  | "kopf"
  | "unfall"
  | "ghg"
  | "mix"
  | "zert"
  | "pv"
  | "glas"
  | "strom";

export type Day = "friday" | "monday";

export type RowId =
  | "Q1"
  | "Q2"
  | "Q3"
  | "Q4"
  | "Q5"
  | "Q6"
  | "Q7"
  | "Q8"
  | "F1"
  | "F2"
  | "F3"
  | "F4"
  | "F5"
  | "F6";

export type Request = "nordvik" | "bank";

/** The file names of the kit that the demo quotes. */
export type KitFile =
  | "policies_and_compliance.txt"
  | "water_bills_2025.csv"
  | "company_profile.md"
  | "hr_headcount_2025.csv"
  | "health_safety_2025.txt"
  | "carbon_offsets_2025.txt"
  | "energy_bills_2025.csv"
  | "organic_certificate_vineyard.txt"
  | "solar_offer_2026.txt"
  | "packaging_bottles.csv"
  | "energy_summary_2025_draft.txt"
  | "inbox/1-nordvik-questionnaire.md";

/** One verbatim line of a kit file, numbered as in a text editor. */
export interface FileLine {
  readonly file: KitFile;
  readonly n: number;
  readonly text: string;
}

/** A summary row that is not a numbered file line (the September invoice on Monday). */
export interface DocLine {
  readonly file: string;
  readonly n: null;
  readonly text: string;
}

export type Excerpt = readonly (FileLine | DocLine | "gap")[];

export interface Option {
  readonly id: string;
  readonly label: L;
}

/** What someone answers on one fact card. `detail` is an option id or a CheckReason. */
export interface Answer {
  readonly status: Status;
  readonly detail: string;
  /** Asked only after OK: does the proven value break a rule in one of the requests? */
  readonly action?: boolean;
}

export interface AcceptedAnswer extends Answer {
  readonly note: L;
}

export interface Fact {
  readonly id: FactId;
  readonly n: number;
  readonly title: L;
  /** A short name for the parts of a composite answer. */
  readonly short: L;
  readonly excerpt: Excerpt;
  /** Asked after OK. */
  readonly cite: readonly [Option, Option, Option];
  /** Asked after NOT FOUND. */
  readonly docs: readonly [Option, Option, Option];
  readonly key: Answer;
  readonly accepted?: readonly AcceptedAnswer[];
  /** Lines that carry the answer; marked after the check. */
  readonly decisive: readonly { readonly file: string; readonly n: number | null }[];
  /** The kit rule the right answer rests on. */
  readonly rule: 1 | 2 | 3;
  readonly why: L;
  /** Keyed "status", "status/detail" or "action:yes" / "action:no". */
  readonly traps: Readonly<Record<string, L>>;
  /** A rule tag for a specific trap key, where it differs from the default. */
  readonly trapRules?: Readonly<Record<string, 1 | 2 | 3>>;
  readonly feeds: readonly RowId[];
}

export interface AnswerRow {
  readonly id: RowId;
  readonly request: Request;
  readonly label: L;
  /** The row's status is the weakest status of these facts (rule 3). */
  readonly deps: readonly FactId[];
  /** Q6 only: an OK on this fact with an action makes the row carry an action. */
  readonly actionFrom?: FactId;
  readonly value: { readonly friday: L; readonly monday?: L };
  /** Where the answer comes from, as in ANSWERS.md. */
  readonly sources: string;
}

export interface Bill {
  readonly month: string;
  readonly kWh: number | null;
  readonly line: number | null;
}

export type Grade = "right" | "defensible" | "half" | "wrong";

export interface Verdict {
  readonly grade: Grade;
  readonly rule: 1 | 2 | 3;
  /** The key line first, then the trap or note for this answer, then the why. */
  readonly lines: readonly L[];
}

/** A row of the answer sheet in one state: still open, or filled with a status. */
export type Cell =
  | { readonly state: "open" }
  | { readonly state: "filled"; readonly status: Status; readonly action: boolean };

export interface SheetRow {
  readonly row: AnswerRow;
  readonly key: Cell;
  readonly yours: Cell;
  readonly differs: boolean;
}

export interface PredictionScore {
  readonly hits: readonly RowId[];
  readonly misses: readonly RowId[];
  readonly falseAlarms: readonly RowId[];
}
