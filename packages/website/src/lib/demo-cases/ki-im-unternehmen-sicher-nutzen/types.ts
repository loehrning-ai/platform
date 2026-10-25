/*
 * W05 "Was fliegt mit?": the shared vocabulary of the pure modules. Everything
 * here is plain data; nothing is mutated after it is built.
 */
export type DemoLocale = "de" | "en";
export type L10n = Readonly<Record<DemoLocale, string>>;

export type HitKind =
  | "person"
  | "order"
  | "ref"
  | "address"
  | "email"
  | "phone"
  | "iban"
  | "amount"
  | "secret"
  | "manual";

export type Check = "pattern" | "iban-mod97" | "prefix" | "entropy" | "salutation" | "visitor";

export interface Hit {
  /** `${kind}:${start}`, stable while the text does not change. */
  readonly id: string;
  readonly kind: HitKind;
  /** UTF-16 index into the source text. */
  readonly start: number;
  /** Exclusive. */
  readonly end: number;
  /** source.slice(start, end). */
  readonly value: string;
  readonly check: Check;
}

export type AccountId = "personal" | "team" | "enterprise";
export type Light = "red" | "amber" | "green" | "open";

/** Placeholder words per kind, one set per interface language. */
export type KindLabels = Readonly<Record<HitKind, string>>;

export interface Placeholder {
  readonly hitId: string;
  /** "KUNDE" or "KUNDE_2". */
  readonly label: string;
  /** "[KUNDE]". */
  readonly token: string;
}

export interface Redaction {
  readonly text: string;
  /** Detector output plus the visitor's own words, sorted and non-overlapping. */
  readonly hits: readonly Hit[];
  /** Hit ids the visitor chose to keep raw. */
  readonly kept: ReadonlySet<string>;
  readonly placeholders: readonly Placeholder[];
}

export interface KeyEntry {
  readonly token: string;
  readonly label: string;
  readonly original: string;
}

export type VerdictReason =
  | "secret"
  | "customerOnPersonal"
  | "personalClean"
  | "companyRaw"
  | "companyClean"
  | "publicText";

export type TodoId = "namesOut" | "contract" | "personReads" | "changeKey" | "companyNames";
export type CiteId = 4 | 7 | 10 | 13 | "deck07" | "answers3";

export interface Verdict {
  readonly light: Light;
  readonly reason: VerdictReason;
  readonly todo: readonly TodoId[];
  readonly cites: readonly CiteId[];
  /** Show "Enterprise macht Rot nicht grün". */
  readonly enterpriseNote: boolean;
}

export type SampleId = "ana" | "marko" | "mila";

/** A sample as one language pack holds it. */
export interface Sample {
  readonly id: SampleId;
  /** The scene's own account (kit scenes 1, 4, 6). */
  readonly account: AccountId;
  readonly chip: string;
  readonly who: string;
  readonly task: string;
  readonly text: string;
  /** A fitting reply as the chat would write it: placeholders only, one of them unknown to the key. */
  readonly answer: string;
}

export interface Fact {
  readonly id: number;
  readonly statementEn: string;
  readonly statementDe: string;
  readonly source: string;
  /** German rendering of `source` for the German page. */
  readonly sourceDe: string;
  readonly dates: readonly string[];
}
