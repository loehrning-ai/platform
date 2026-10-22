/**
 * Types of the Workshop 05 demo "Darf das in diesen Chat?".
 *
 * The light is the kit's Rule 2 (project-instructions.md) plus deck slide 07,
 * computed from two variables only: the account a paste goes into and the
 * kind of content that is pasted. Every vendor line mirrors one line of the
 * kit's facts.md (checked 18 Oct 2026).
 */

/** Order: green 0 < amber 1 < red 2. */
export type Light = "green" | "amber" | "red";

export type DemoLocale = "de" | "en";
export type L10n = Readonly<Record<DemoLocale, string>>;

export type AccountId =
  /** personal, vendor unknown (Ana, Stefan) */
  | "freeChatbot"
  /** personal Claude: Free, Pro and Max share one rulebook (F1) */
  | "claudePro"
  /** company */
  | "claudeTeam"
  /** company, Desktop app with a Cowork folder (F9) */
  | "claudeTeamDesktop"
  /** company */
  | "claudeEnterprise"
  /** API test account (Dario); facts.md says nothing about it */
  | "apiTest";

export type AccountKind = "personal" | "company" | "test";

export type ContentKind =
  /** green on any tool */
  | "public"
  | "invented"
  /** not public: names and numbers in */
  | "customer"
  | "people"
  /** "paste it whole, Claude cleans it": behaves exactly like customer */
  | "pastedToClean"
  /** cleaned by hand, placeholders in, still not public */
  | "cleaned"
  /** API key, password */
  | "secret"
  /** a whole connected folder, wider than the task */
  | "folder";

/** Only the facts this demo uses. */
export type FactId = 1 | 2 | 3 | 5 | 6 | 7 | 9 | 10 | 13;
export type Cite = FactId | "deck05";

export type RouteKey = "contract" | "training" | "company" | "stored";

/** Mirrors one facts.md line verbatim. */
export interface Fact {
  readonly id: FactId;
  /** verbatim facts.md text */
  readonly statementEn: string;
  /** faithful translation, shown in #quellen */
  readonly statementDe: string;
  /** verbatim, e.g. "Anthropic privacy 7996890" */
  readonly source: string;
  /** verbatim list; never mapped 1:1 to sources */
  readonly dates: readonly string[];
}

export interface RouteRow {
  readonly key: RouteKey;
  readonly value: L10n;
  /** shown only in #quellen, never inline */
  readonly cite: Cite;
}

export type Device = "phone" | "browser" | "desktopFolder" | "server";

export interface Account {
  readonly id: AccountId;
  readonly kind: AccountKind;
  /** Card chip, e.g. "Privat: Claude Pro". */
  readonly label: L10n;
  /** Dial option, e.g. "Privat: Pro". */
  readonly dialLabel: L10n;
  /** null = nothing in the files: one merged line instead. */
  readonly route: readonly RouteRow[] | null;
  /** used when route is null */
  readonly unknownLine?: L10n;
  /** "Fehlt:" line, from the last line of facts.md */
  readonly gaps: L10n | null;
  /** Desktop: F9, "unsere Lesart" */
  readonly note?: { readonly text: L10n; readonly cite: FactId };
}

export type ContentOptionId = "asIs" | "pastedToClean" | "cleaned" | "alt";

export interface ContentOption {
  readonly id: ContentOptionId;
  readonly kind: ContentKind;
  /** Dial option label. */
  readonly label: L10n;
  /** read only when the light is amber */
  readonly todo?: readonly L10n[];
}

export type SceneId =
  | "ana"
  | "stefan"
  | "elena"
  | "marko"
  | "jovana"
  | "mila"
  | "petar"
  | "dario";

export interface Scene {
  readonly id: SceneId;
  /** kit order, used for "1 von 8" only */
  readonly order: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  readonly person: string;
  readonly role: L10n;
  /** "Fügt ein:", "Lädt hoch:", "Verbindet:", "Fügt ein und fragt:" */
  readonly verb: L10n;
  readonly what: L10n;
  /** mono tokens on the card */
  readonly parts: readonly L10n[];
  /** Short account word for the table ("Handy", "Pro"). */
  readonly short: L10n;
  /** The device per account in this scene. */
  readonly devices: Readonly<Partial<Record<AccountId, Device>>>;
  /** first = initial; length 1 = no account dial */
  readonly accountDial: readonly AccountId[];
  /** first = initial */
  readonly contentDial: readonly ContentOption[];
  /** ANSWERS.md mission 3; a test asserts key === light of the initial state */
  readonly key: Light;
  /** at most 12 words, from ANSWERS.md */
  readonly reason: L10n;
  readonly misconception: Readonly<Partial<Record<Light, L10n>>>;
  /** Jovana: F13 */
  readonly flag?: { readonly text: L10n; readonly cite: FactId };
  /** Ana: the kit mission 2 line */
  readonly afterNote?: L10n;
}

export type RuleId =
  | "secret"
  | "folder"
  | "public"
  | "invented"
  | "personalNotPublic"
  | "testRealRows"
  | "companyTodo";

/** The rule buckets of "Deine Szenen". */
export type Bucket = "allowed" | "askFirst" | "never";

export type Direction = "exact" | "stricter" | "looser";
export type Goal = "leaveRed" | "shrinkTodo" | "findRed";

export interface DialState {
  readonly account: AccountId;
  readonly content: ContentOptionId;
}

export interface SceneResult {
  readonly id: SceneId;
  readonly picked: Light;
  readonly tried: boolean;
}

export type Vote = "true" | "half" | "false";
export type FridayNumber = 1 | 2 | 3;

export interface CardInput {
  readonly tool: string;
  readonly owner: string;
}
