/**
 * Optional resume in this browser only: the week (so a live session survives
 * a reload between its two slots) and the five-sentence draft. Every read and
 * write sits in try/catch, and a stored value is validated before use: the
 * page works the same without storage.
 */
import { MORNINGS, MORNING_COUNT, OPTION_KEYS, OWNER_KEYS, SENTENCE_BLANK_MAX, SUPPLY_CAP, type OptionKey, type Triple } from "./data";
import { clampUnits, INITIAL_STATE, sumOf, trimRole, type DemoState, type Owner, type PlanSource, type Step } from "./logic";
import { BLANK_COUNT, cleanBlank, type SentenceDraft } from "./takeaways";

export const STATE_KEY = "loehrning.demo.ki-prognosen-einschaetzen.state.v1";
export const DRAFT_KEY = "loehrning.demo.ki-prognosen-einschaetzen.sentences.v1";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTriple(value: unknown): Triple | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  if (!value.every((entry) => typeof entry === "number" && Number.isFinite(entry))) return null;
  return [clampUnits(value[0] as number), clampUnits(value[1] as number), clampUnits(value[2] as number)];
}

function asPlan(value: unknown): Triple | null {
  const triple = asTriple(value);
  return triple && sumOf(triple) === SUPPLY_CAP ? triple : null;
}

function asOwner(value: unknown): Owner | null {
  if (!isRecord(value)) return null;
  const key = value.key;
  if (typeof key !== "string" || !(OWNER_KEYS as readonly string[]).includes(key)) return null;
  const custom = typeof value.custom === "string" ? trimRole(value.custom) : "";
  return { key: key as Owner["key"], custom: key === "custom" ? custom : "" };
}

/** A stored state, or null when anything about it does not hold together. */
export function parseState(raw: unknown): DemoState | null {
  if (!isRecord(raw)) return null;
  const step = raw.step;
  if (step !== "split" && step !== "mornings" && step !== "result") return null;
  const alloc = asTriple(raw.alloc);
  if (!alloc) return null;
  const plan = raw.plan === null ? null : asPlan(raw.plan);
  const planSource = raw.planSource;
  const validSource =
    planSource === null || planSource === "own" || planSource === "median" || planSource === "fallback";
  if (!validSource) return null;
  if (step !== "split" && (!plan || planSource === null)) return null;
  const answers = Array.isArray(raw.answers) ? raw.answers : null;
  if (!answers || answers.length !== MORNING_COUNT) return null;
  const cleanAnswers: (OptionKey | null)[] = [];
  for (const [i, answer] of answers.entries()) {
    if (answer === null) {
      cleanAnswers.push(null);
      continue;
    }
    const morning = MORNINGS[i];
    if (typeof answer !== "string" || !(OPTION_KEYS as readonly string[]).includes(answer)) return null;
    if (!morning?.options.includes(answer as OptionKey)) return null;
    cleanAnswers.push(answer as OptionKey);
  }
  const day = typeof raw.day === "number" && Number.isInteger(raw.day) ? raw.day : 0;
  if (day < 0 || day >= MORNING_COUNT) return null;
  // Answers must be a prefix: mornings before `day` answered, none after it.
  if (cleanAnswers.some((answer, i) => (i < day ? answer === null : i > day && answer !== null))) return null;
  const owner = raw.owner === null || raw.owner === undefined ? null : asOwner(raw.owner);
  const ownerLocked = raw.ownerLocked === true;
  if (step === "result" && cleanAnswers.some((answer) => answer === null)) return null;
  if ((step === "result" || cleanAnswers.some((answer) => answer !== null)) && !ownerLocked) return null;
  return {
    ...INITIAL_STATE,
    step: step as Step,
    alloc,
    checked: raw.checked === true && (step !== "split" || sumOf(alloc) === SUPPLY_CAP),
    plan: step === "split" ? null : plan,
    planSource: step === "split" ? null : (planSource as PlanSource),
    opening: raw.opening === null || raw.opening === undefined ? null : asPlan(raw.opening),
    owner,
    ownerLocked,
    day,
    answers: cleanAnswers,
  };
}

export function loadState(): DemoState | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STATE_KEY);
    return raw ? parseState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Saves the state; the untouched start state clears the entry instead. */
export function saveState(state: DemoState): void {
  const store = storage();
  if (!store) return;
  try {
    const untouched =
      state.step === "split" && !state.checked && state.alloc.every((value) => value === 0);
    if (untouched) store.removeItem(STATE_KEY);
    else store.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage full, blocked or unavailable: the page works without it.
  }
}

function asBlanks(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== BLANK_COUNT) return null;
  return value.map((entry) => (typeof entry === "string" ? cleanBlank(entry) : ""));
}

/**
 * The draft and its prefill marker. Reads the current `{ blanks, prefill }`
 * shape and the earlier bare array (which had no marker).
 */
export function loadDraft(): SentenceDraft | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const legacy = asBlanks(parsed);
    if (legacy) return { blanks: legacy, prefill: null };
    if (!isRecord(parsed)) return null;
    const blanks = asBlanks(parsed.blanks);
    if (!blanks) return null;
    const prefill = typeof parsed.prefill === "string" ? trimRole(parsed.prefill) : "";
    return { blanks, prefill: prefill === "" ? null : prefill };
  } catch {
    return null;
  }
}

export function saveDraft(draft: SentenceDraft): void {
  const store = storage();
  if (!store) return;
  try {
    if (draft.blanks.every((value) => value.trim() === "") && draft.prefill === null) store.removeItem(DRAFT_KEY);
    else
      store.setItem(
        DRAFT_KEY,
        JSON.stringify({ blanks: draft.blanks.map((value) => value.slice(0, SENTENCE_BLANK_MAX)), prefill: draft.prefill }),
      );
  } catch {
    // Storage full, blocked or unavailable: the draft lives only in the page.
  }
}
