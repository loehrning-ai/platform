import { FACT_IDS, INVOICE_KEY } from "@/lib/demo-cases/esg-berichte-mit-ki/constants";
import { isComplete, type EsgLogic, type Stamps } from "@/lib/demo-cases/esg-berichte-mit-ki/core";
import type { Answer, Day, FactId, Grade, RowId, Status, Verdict } from "@/lib/demo-cases/esg-berichte-mit-ki/types";

/** A card's slot: one of the ten facts, or the electricity card again on Monday. */
export type Slot = FactId | "monday";

export interface CardState {
  readonly draft: Partial<Answer>;
  readonly submitted?: Answer;
  readonly verdict?: Verdict;
}

export type MondayPhase = "locked" | "ready" | "predict" | "invoice" | "restamp" | "reveal";

export interface DemoState {
  readonly active: FactId;
  readonly cards: Readonly<Record<Slot, CardState>>;
  /** Facts in the order they were checked (the hints follow it). */
  readonly order: readonly FactId[];
  readonly mondayStarted: boolean;
  readonly picked: readonly RowId[];
  readonly pickLocked: boolean;
  readonly invoiceDraft?: string;
  readonly invoice?: string;
}

export type DemoAction =
  | { readonly type: "open"; readonly id: FactId }
  | { readonly type: "status"; readonly slot: Slot; readonly status: Status }
  | { readonly type: "detail"; readonly slot: Slot; readonly detail: string }
  | { readonly type: "action"; readonly slot: Slot; readonly action: boolean }
  | { readonly type: "submit"; readonly slot: Slot }
  | { readonly type: "startMonday" }
  | { readonly type: "togglePick"; readonly id: RowId }
  | { readonly type: "openInvoice" }
  | { readonly type: "invoiceDraft"; readonly id: string }
  | { readonly type: "submitInvoice" }
  | { readonly type: "reset" };

const EMPTY: CardState = { draft: {} };

export function initialState(): DemoState {
  const cards = Object.fromEntries([...FACT_IDS, "monday"].map((slot) => [slot, EMPTY])) as Record<
    Slot,
    CardState
  >;
  return { active: "bussgeld", cards, order: [], mondayStarted: false, picked: [], pickLocked: false };
}

function withCard(state: DemoState, slot: Slot, card: CardState): DemoState {
  return { ...state, cards: { ...state.cards, [slot]: card } };
}

/** The demo's reducer, judging with `logic` (the page's locale pack, or the full data in tests). */
export function createReducer(logic: EsgLogic): (state: DemoState, action: DemoAction) => DemoState {
  return (state, action) => reduce(state, action, logic);
}

function reduce(state: DemoState, action: DemoAction, { factById, judge }: EsgLogic): DemoState {
  switch (action.type) {
    case "open":
      return { ...state, active: action.id };
    case "status": {
      const card = state.cards[action.slot];
      if (card.submitted || card.draft.status === action.status) return state;
      // A new status clears decisions 2 and 3: they belong to the old path.
      return withCard(state, action.slot, { draft: { status: action.status } });
    }
    case "detail": {
      const card = state.cards[action.slot];
      if (card.submitted || !card.draft.status) return state;
      return withCard(state, action.slot, { draft: { ...card.draft, detail: action.detail } });
    }
    case "action": {
      const card = state.cards[action.slot];
      if (card.submitted || card.draft.status !== "ok") return state;
      return withCard(state, action.slot, { draft: { ...card.draft, action: action.action } });
    }
    case "submit": {
      const card = state.cards[action.slot];
      if (card.submitted || !isComplete(card.draft)) return state;
      const answer: Answer = card.draft.status === "ok" ? card.draft : { status: card.draft.status, detail: card.draft.detail };
      if (action.slot === "monday") {
        if (!state.invoice) return state;
        const verdict = judge(factById("strom"), answer, "monday");
        return withCard(state, "monday", { draft: card.draft, submitted: answer, verdict });
      }
      const verdict = judge(factById(action.slot), answer, "friday");
      const next = withCard(state, action.slot, { draft: card.draft, submitted: answer, verdict });
      return { ...next, order: [...state.order, action.slot] };
    }
    case "startMonday":
      return allStamped(state) ? { ...state, mondayStarted: true } : state;
    case "togglePick": {
      if (!state.mondayStarted || state.pickLocked) return state;
      const picked = state.picked.includes(action.id)
        ? state.picked.filter((id) => id !== action.id)
        : [...state.picked, action.id];
      return { ...state, picked };
    }
    case "openInvoice":
      return state.mondayStarted ? { ...state, pickLocked: true } : state;
    case "invoiceDraft":
      return state.pickLocked && !state.invoice ? { ...state, invoiceDraft: action.id } : state;
    case "submitInvoice":
      return state.pickLocked && !state.invoice && state.invoiceDraft
        ? { ...state, invoice: state.invoiceDraft }
        : state;
    case "reset":
      return initialState();
    default:
      return state;
  }
}

export function allStamped(state: DemoState): boolean {
  return FACT_IDS.every((id) => state.cards[id].submitted !== undefined);
}

export function stampedCount(state: DemoState): number {
  return FACT_IDS.filter((id) => state.cards[id].submitted !== undefined).length;
}

export function mondayPhase(state: DemoState): MondayPhase {
  if (!allStamped(state)) return "locked";
  if (!state.mondayStarted) return "ready";
  if (!state.pickLocked) return "predict";
  if (!state.invoice) return "invoice";
  if (!state.cards.monday.submitted) return "restamp";
  return "reveal";
}

/** The story's day for the date line: Monday once the step has started. */
export function storyDay(state: DemoState): Day {
  return state.mondayStarted ? "monday" : "friday";
}

/** The user's own stamps; on Monday's reveal, electricity is the re-stamp. */
export function yourStamps(state: DemoState, day: Day): Stamps {
  const stamps: Stamps = {};
  for (const id of FACT_IDS) {
    const answer = state.cards[id].submitted;
    if (answer) stamps[id] = answer;
  }
  const monday = state.cards.monday.submitted;
  if (day === "monday" && monday) stamps.strom = monday;
  return stamps;
}

export function grades(state: DemoState): Partial<Record<FactId, Grade>> {
  const out: Partial<Record<FactId, Grade>> = {};
  for (const id of FACT_IDS) {
    const grade = state.cards[id].verdict?.grade;
    if (grade) out[id] = grade;
  }
  return out;
}

/** The next unchecked fact after `from`, in card order, wrapping round. */
export function nextOpen(state: DemoState, from: FactId): FactId | null {
  const start = FACT_IDS.indexOf(from);
  for (let step = 1; step <= FACT_IDS.length; step += 1) {
    const id = FACT_IDS[(start + step) % FACT_IDS.length] as FactId;
    if (!state.cards[id].submitted) return id;
  }
  return null;
}

/** Which hint a card shows: the first checked card gets hint 0, the second hint 1. */
export function hintIndex(state: DemoState, id: FactId): 0 | 1 | null {
  const position = state.order.indexOf(id);
  const index = position >= 0 ? position : state.cards[id].submitted ? null : state.order.length;
  return index === 0 || index === 1 ? index : null;
}

export const isInvoiceRight = (state: DemoState): boolean => state.invoice === INVOICE_KEY;
