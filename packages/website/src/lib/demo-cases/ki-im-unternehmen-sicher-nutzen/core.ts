import type { W05Text } from "./pack";
import type {
  AccountId,
  AccountKind,
  Bucket,
  CardInput,
  ContentKind,
  ContentOptionId,
  DialState,
  Direction,
  FridayNumber,
  Goal,
  Light,
  RouteKey,
  RuleId,
  SceneId,
  SceneResult,
  Vote,
} from "./types";

/*
 * The pure logic of "Darf das in diesen Chat?", safe for the client island:
 * this module imports no copy and no case data. Everything the learner reads
 * comes in as one language (W05Text, built on the server by pack.ts).
 * No move counting anywhere: reaching amber is never "done", every amber
 * result carries its to-do list.
 */

export const RANK: Readonly<Record<Light, number>> = { green: 0, amber: 1, red: 2 };
export const LIGHTS: readonly Light[] = ["green", "amber", "red"];
export const ROUTE_KEYS: readonly RouteKey[] = ["contract", "training", "company", "stored"];

/** Who owns each account. scenes.ts reads its kinds from here. */
export const ACCOUNT_KIND: Readonly<Record<AccountId, AccountKind>> = {
  freeChatbot: "personal",
  claudePro: "personal",
  claudeTeam: "company",
  claudeTeamDesktop: "company",
  claudeEnterprise: "company",
  apiTest: "test",
};

/** Fill {name} slots in one pass, so a filled value is never read as a slot. */
export function fmt(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{([a-z]+)\}/g, (slot, name: string) =>
    name in values ? String(values[name]) : slot,
  );
}

/* Scene shapes: both the bilingual source and the localized pack fit. ---- */

interface OptionShape<T> {
  readonly id: ContentOptionId;
  readonly kind: ContentKind;
  readonly todo?: readonly T[];
}

interface DialScene<T = unknown> {
  readonly id: SceneId;
  readonly key: Light;
  readonly accountDial: readonly AccountId[];
  readonly contentDial: readonly OptionShape<T>[];
}

interface RouteShape {
  readonly route: readonly { readonly key: RouteKey; readonly value: unknown }[] | null;
}

/** The kit's Rule 2 plus deck slide 07 as one function. Checks run top to bottom. */
export function lightFor(account: AccountId, kind: ContentKind): { light: Light; rule: RuleId } {
  if (kind === "secret") return { light: "red", rule: "secret" };
  if (kind === "folder") return { light: "red", rule: "folder" };
  if (kind === "public") return { light: "green", rule: "public" };
  if (kind === "invented") return { light: "green", rule: "invented" };
  const accountType = ACCOUNT_KIND[account];
  if (accountType === "test") return { light: "red", rule: "testRealRows" };
  if (accountType === "personal") return { light: "red", rule: "personalNotPublic" };
  return { light: "amber", rule: "companyTodo" };
}

export function judge<T>(
  scene: { readonly key: Light; readonly misconception: Readonly<Partial<Record<Light, T>>> },
  picked: Light,
): { direction: Direction; line: T | undefined } {
  const delta = RANK[picked] - RANK[scene.key];
  const direction: Direction = delta === 0 ? "exact" : delta > 0 ? "stricter" : "looser";
  return { direction, line: direction === "exact" ? undefined : scene.misconception[picked] };
}

export function routeDiff(
  accounts: Readonly<Record<AccountId, RouteShape>>,
  from: AccountId,
  to: AccountId,
): { changed: RouteKey[]; same: RouteKey[] } | "unknown" {
  const a = accounts[from].route;
  const b = accounts[to].route;
  if (!a || !b) return "unknown";
  const changed: RouteKey[] = [];
  const same: RouteKey[] = [];
  for (const key of ROUTE_KEYS) {
    const left = a.find((row) => row.key === key);
    const right = b.find((row) => row.key === key);
    if (JSON.stringify(left?.value) === JSON.stringify(right?.value)) same.push(key);
    else changed.push(key);
  }
  return { changed, same };
}

export function routeSentence(text: W05Text, from: AccountId, to: AccountId): string {
  if (from === to) return "";
  const words = text.words.route;
  const diff = routeDiff(text.accounts, from, to);
  if (diff === "unknown") {
    const fromKnown = text.accounts[from].route !== null;
    const toKnown = text.accounts[to].route !== null;
    if (!fromKnown && toKnown) return `${words.before} ${words.nowOnRecord}`;
    if (fromKnown && !toKnown) return `${words.beforeOnRecord} ${words.nowNothing}`;
    return words.nowNothing;
  }
  const names = text.words.routeNames;
  const parts: string[] = [];
  if (diff.changed.length > 0) {
    parts.push(`${words.changed}: ${diff.changed.map((key) => names[key]).join(", ")}.`);
  }
  if (diff.same.length > 0) {
    parts.push(`${words.same}: ${diff.same.map((key) => names[key]).join(", ")}.`);
  }
  return parts.join(" ");
}

export function goalOf(scene: { readonly key: Light }): Goal {
  if (scene.key === "red") return "leaveRed";
  if (scene.key === "amber") return "shrinkTodo";
  return "findRed";
}

export function initialState(scene: DialScene): DialState {
  const account = scene.accountDial[0];
  const content = scene.contentDial[0];
  if (!account || !content) throw new Error(`Scene ${scene.id} has an empty dial`);
  return { account, content: content.id };
}

export function contentOption<O extends OptionShape<unknown>>(
  scene: { readonly id: SceneId; readonly contentDial: readonly O[] },
  id: ContentOptionId,
): O {
  const option = scene.contentDial.find((entry) => entry.id === id);
  if (!option) throw new Error(`Scene ${scene.id} has no content ${id}`);
  return option;
}

export function stateLight<T>(
  scene: DialScene<T>,
  state: DialState,
): { light: Light; rule: RuleId; todo: readonly T[] } {
  const option = contentOption(scene, state.content);
  const { light, rule } = lightFor(state.account, option.kind);
  return { light, rule, todo: light === "amber" ? (option.todo ?? []) : [] };
}

export function goalReached(scene: DialScene, state: DialState): boolean {
  const { light } = stateLight(scene, state);
  const goal = goalOf(scene);
  if (goal === "leaveRed") return light !== "red";
  if (goal === "shrinkTodo") {
    return light === "amber" && contentOption(scene, state.content).kind === "cleaned";
  }
  return light === "red";
}

export type LocalScene = W05Text["scenes"][number];

export function sceneIn(text: W05Text, id: SceneId): LocalScene {
  const scene = text.scenes.find((entry) => entry.id === id);
  if (!scene) throw new Error(`Unknown scene ${id}`);
  return scene;
}

export interface FixParts {
  readonly found: boolean;
  readonly reason: string;
  readonly route: string;
  readonly todo: readonly string[];
}

/** The pieces of the fix line, so the page can show the to-do as a list. */
export function fixParts(text: W05Text, id: SceneId, state: DialState): FixParts {
  const scene = sceneIn(text, id);
  const { rule, todo } = stateLight(scene, state);
  const override = text.fixOverrides[`${scene.id}:${state.account}:${state.content}`];
  return {
    found: goalReached(scene, state),
    reason: override ?? text.ruleLines[rule],
    route: routeSentence(text, initialState(scene).account, state.account),
    todo,
  };
}

/** prefix + (override ?? rule reason) + routeSentence + to-do (spec 5.3). */
export function fixLine(text: W05Text, id: SceneId, state: DialState): string {
  const parts = fixParts(text, id, state);
  const pieces = [
    parts.found ? text.ui.found : "",
    parts.reason,
    parts.route,
    parts.todo.length > 0 ? `${text.ui.todo} ${parts.todo.join(", ")}.` : "",
  ];
  return pieces.filter((piece) => piece.length > 0).join(" ");
}

function listJoin(items: readonly string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

export function ledgerSummary(
  text: W05Text,
  results: readonly SceneResult[],
): { matched: number; looser: SceneId[]; open: SceneId[]; line: string } {
  const byId = new Map(results.map((result) => [result.id, result]));
  const words = text.words.ledger;
  const looser: SceneId[] = [];
  const open: SceneId[] = [];
  let matched = 0;
  for (const scene of text.scenes) {
    const result = byId.get(scene.id);
    if (!result) {
      open.push(scene.id);
      continue;
    }
    const { direction } = judge(scene, result.picked);
    if (direction === "exact") matched += 1;
    if (direction === "looser") looser.push(scene.id);
  }
  const personOf = (id: SceneId) => sceneIn(text, id).person;
  const parts = [fmt(words.matched, { matched })];
  if (open.length === 0 && matched < 8) {
    if (matched >= 6) parts.push(words.good);
    // No "others" when nothing matched.
    else if (matched === 0) parts.push(words.readAll);
    else parts.push(fmt(words.readOthers, { rest: text.words.numberWords[8 - matched] ?? "" }));
  }
  if (looser.length > 0) {
    parts.push(fmt(words.tooLoose, { people: listJoin(looser.map(personOf), text.words.and) }));
  }
  if (open.length > 0) {
    parts.push(fmt(words.stillOpen, { people: listJoin(open.map(personOf), text.words.and) }));
  }
  return { matched, looser, open, line: parts.join(" ") };
}

/* Freitag ------------------------------------------------------------ */

/** Deck slide 12 verdicts. */
export const FRIDAY_KEY: Readonly<Record<FridayNumber, Vote>> = { 1: "false", 2: "false", 3: "half" };

export function fridayJudge(sentence: FridayNumber, vote: Vote): { right: boolean } {
  return { right: FRIDAY_KEY[sentence] === vote };
}

/* Zum Mitnehmen ------------------------------------------------------ */

const MAX_INPUT = 40;

/** Trim, collapse spaces, drop {}[]<> and newlines, max 40 characters. */
export function cleanInput(raw: string): string {
  return raw
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[{}[\]<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_INPUT)
    .trim();
}

export type SegmentKind = "text" | "filled" | "slot";
export interface Segment {
  readonly kind: SegmentKind;
  readonly text: string;
}

/** What an empty field leaves in the text. */
export interface EmptySlot {
  readonly tool: string;
  readonly owner: string;
}

const TOKEN = /(\{TOOL\}|\{NAME\}|\[[^\]\n]+\])/g;

/**
 * A template as segments: plain text, a filled field, or a square-bracket
 * slot. Joining the segments gives exactly the copied text.
 */
export function templateSegments(
  template: string,
  input: CardInput,
  empty: EmptySlot,
): readonly Segment[] {
  const tool = cleanInput(input.tool);
  const owner = cleanInput(input.owner);
  const segments: Segment[] = [];
  for (const piece of template.split(TOKEN)) {
    if (piece.length === 0) continue;
    if (piece === "{TOOL}") {
      segments.push(tool ? { kind: "filled", text: tool } : { kind: "slot", text: empty.tool });
    } else if (piece === "{NAME}") {
      segments.push(owner ? { kind: "filled", text: owner } : { kind: "slot", text: empty.owner });
    } else if (/^\[[^\]\n]+\]$/.test(piece)) {
      segments.push({ kind: "slot", text: piece });
    } else {
      segments.push({ kind: "text", text: piece });
    }
  }
  return segments;
}

export function fillTemplate(template: string, input: CardInput, empty: EmptySlot): string {
  return templateSegments(template, input, empty)
    .map((segment) => segment.text)
    .join("");
}

export interface Cards {
  readonly reply: string;
  readonly rules: string;
  readonly mail: string;
  readonly mailEn: string;
}

/** The English mail: its own template on a German page, the page's mail otherwise. */
export function englishMail(text: W05Text): { readonly template: string; readonly empty: EmptySlot } {
  return text.mailEn ?? { template: text.templates.mail, empty: text.emptySlot };
}

export function cards(text: W05Text, input: CardInput): Cards {
  const own = text.templates;
  const english = englishMail(text);
  return {
    reply: fillTemplate(own.reply, input, text.emptySlot),
    rules: fillTemplate(own.rules, input, text.emptySlot),
    mail: fillTemplate(own.mail, input, text.emptySlot),
    mailEn: fillTemplate(english.template, input, english.empty),
  };
}

/** The name in the reply note: the filled owner or its slot. */
export function ownerOrSlot(text: W05Text, input: CardInput): string {
  return cleanInput(input.owner) || text.emptySlot.owner;
}

export const BUCKETS: readonly Bucket[] = ["allowed", "askFirst", "never"];

/** Fixed map from ANSWERS rules and deck slide 12. */
export const BUCKET_SCENES: Readonly<Record<Bucket, readonly SceneId[]>> = {
  allowed: ["stefan", "dario"],
  askFirst: ["elena", "jovana", "mila", "petar"],
  never: ["ana", "marko"],
};

export function ruleEvidence(
  scenes: readonly (DialScene & { readonly misconception: Readonly<Partial<Record<Light, unknown>>> })[],
  results: readonly SceneResult[],
): Record<Bucket, { scenes: SceneId[]; looser: SceneId[] }> {
  const byId = new Map(results.map((result) => [result.id, result]));
  const entry = (bucket: Bucket) => {
    const ids = BUCKET_SCENES[bucket].filter((id) => byId.has(id));
    const looser = ids.filter((id) => {
      const result = byId.get(id);
      const scene = scenes.find((candidate) => candidate.id === id);
      return result && scene ? judge(scene, result.picked).direction === "looser" : false;
    });
    return { scenes: ids, looser };
  };
  return { allowed: entry("allowed"), askFirst: entry("askFirst"), never: entry("never") };
}

/**
 * "Erlaubt ← Stefan, Dario mit erfundenen Zeilen (du: zu locker) · Nie ← Ana".
 * What the scene was and what the learner did stay apart: the bucket note
 * describes the scene, the bracket is only ever the learner's verdict.
 */
export function ruleEvidenceLine(text: W05Text, results: readonly SceneResult[]): string {
  const evidence = ruleEvidence(text.scenes, results);
  const parts: string[] = [];
  for (const bucket of BUCKETS) {
    const { scenes, looser } = evidence[bucket];
    if (scenes.length === 0) continue;
    const people = scenes.map((id) => {
      const note = text.bucketNotes[id];
      const person = sceneIn(text, id).person;
      const who = note ? `${person} ${note}` : person;
      return looser.includes(id) ? `${who} (${text.ui.youTooLoose})` : who;
    });
    parts.push(`${text.ruleBuckets[bucket]} ← ${people.join(", ")}`);
  }
  return parts.join(" · ");
}

/** A quotation in the page's language. */
export function quote(text: W05Text, sentence: string): string {
  return `${text.words.quote.open}${sentence}${text.words.quote.close}`;
}
