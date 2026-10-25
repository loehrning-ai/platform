import { toggleManual, type Span } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/redact";
import type { AccountId, Hit, Sample, SampleId } from "@/lib/demo-cases/ki-im-unternehmen-sicher-nutzen/types";

/*
 * The one state of the demo, in memory only: nothing here is persisted, sent
 * or put in a URL. Pure reducer, every step returns a new object.
 */
export const UNDO_LIMIT = 50;

export interface Snapshot {
  readonly manual: readonly Hit[];
  readonly kept: readonly string[];
}

export interface DemoState extends Snapshot {
  readonly text: string;
  readonly sampleId: SampleId | null;
  readonly undo: readonly Snapshot[];
  readonly account: AccountId;
  readonly publicText: boolean;
  readonly task: string;
  /** The handle, 0 (everything goes along) to 1 (everything blacked out). */
  readonly p: number;
  readonly sent: boolean;
  readonly answer: string;
}

export type Action =
  | { readonly type: "sample"; readonly sample: Sample }
  | { readonly type: "text"; readonly text: string }
  | { readonly type: "word"; readonly span: Span }
  | { readonly type: "keep"; readonly id: string }
  | { readonly type: "undo" }
  | { readonly type: "account"; readonly account: AccountId }
  | { readonly type: "public"; readonly value: boolean }
  | { readonly type: "task"; readonly task: string }
  | { readonly type: "p"; readonly p: number }
  | { readonly type: "send" }
  | { readonly type: "reset" }
  | { readonly type: "answer"; readonly answer: string };

export function initialState(sample: Sample): DemoState {
  return {
    text: sample.text,
    sampleId: sample.id,
    manual: [],
    kept: [],
    undo: [],
    account: sample.account,
    publicText: false,
    task: sample.task,
    p: 0,
    sent: false,
    answer: "",
  };
}

const snapshot = (state: DemoState): Snapshot => ({ manual: state.manual, kept: state.kept });
const pushUndo = (state: DemoState): readonly Snapshot[] => [...state.undo, snapshot(state)].slice(-UNDO_LIMIT);

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "sample":
      return { ...initialState(action.sample), answer: state.answer };
    case "text":
      // New text is a new send: nothing is blacked out yet, nothing was sent.
      return { ...state, text: action.text, sampleId: null, manual: [], kept: [], undo: [], task: state.sampleId ? "" : state.task, p: 0, sent: false };
    case "word":
      return { ...state, manual: toggleManual(state.text, state.manual, action.span), undo: pushUndo(state) };
    case "keep": {
      const kept = state.kept.includes(action.id) ? state.kept.filter((id) => id !== action.id) : [...state.kept, action.id];
      return { ...state, kept, undo: pushUndo(state) };
    }
    case "undo": {
      const last = state.undo[state.undo.length - 1];
      return last ? { ...state, ...last, undo: state.undo.slice(0, -1) } : state;
    }
    case "account":
      return { ...state, account: action.account };
    case "public":
      return { ...state, publicText: action.value };
    case "task":
      return { ...state, task: action.task };
    case "p":
      return state.sent ? state : { ...state, p: Math.min(1, Math.max(0, action.p)) };
    case "send":
      return { ...state, sent: true };
    case "reset":
      return { ...state, sent: false, p: 0 };
    case "answer":
      return { ...state, answer: action.answer };
  }
}
