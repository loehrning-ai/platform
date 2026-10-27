/**
 * The five steps of the kit's start file (START-HIER.md / START-HERE.md) as
 * the demo plays them in the depicted Claude app, in the deck's order:
 * steps 1 to 4 each start a new chat in the project, step 5 runs in the chat
 * of step 4. Each step names its recording (claude-app/<locale>-schritt-<n>,
 * step 5 is the follow-up turn of step 4), the files attached to the prompt,
 * the register rows its answer covers, and what the visitor checks by hand.
 * Plain data, both languages.
 */
import type { RowGroup } from "./ledger";

export type StepId = "schritt-1" | "schritt-2" | "schritt-3" | "schritt-4" | "schritt-5";

/** What the visitor does by hand after Claude's answer, in the side panel. */
export type HandCheck = "months" | "claim" | "payback" | "register" | "invoice";

export interface AppStep {
  readonly id: StepId;
  /** The recording that holds this step's turn. */
  readonly recording: "schritt-1" | "schritt-2" | "schritt-3" | "schritt-4";
  /** 0: the recording's own turn; 1: its follow-up (step 5 in the chat of step 4). */
  readonly turn: 0 | 1;
  /** The chat in the project (1 to 4) this step runs in. */
  readonly chat: 1 | 2 | 3 | 4;
  /** Kit paths attached to the prompt, per edition (the prompt's first line names them). */
  readonly attach: { readonly de: readonly string[]; readonly en: readonly string[] };
  /** The register rows this step's answer table covers (steps 1 to 3). */
  readonly group?: RowGroup;
  readonly check: HandCheck;
}

const REQUESTS = {
  de: ["anfragen/1-fragebogen-nordvik.md", "anfragen/2-werbeaussagen.md", "anfragen/3-bankformular.md"],
  en: ["requests/1-nordvik-questionnaire.md", "requests/2-marketing-claims.md", "requests/3-bank-form.md"],
} as const;

export const LATE_INVOICE = { de: "nachreichung/rechnung-EL-25-09.png", en: "late-document/invoice-EL-25-09.png" } as const;

export const APP_STEPS: readonly AppStep[] = [
  { id: "schritt-1", recording: "schritt-1", turn: 0, chat: 1, attach: { de: [REQUESTS.de[0]], en: [REQUESTS.en[0]] }, group: "fragebogen", check: "months" },
  { id: "schritt-2", recording: "schritt-2", turn: 0, chat: 2, attach: { de: [REQUESTS.de[1]], en: [REQUESTS.en[1]] }, group: "werbung", check: "claim" },
  { id: "schritt-3", recording: "schritt-3", turn: 0, chat: 3, attach: { de: [REQUESTS.de[2]], en: [REQUESTS.en[2]] }, group: "bank", check: "payback" },
  { id: "schritt-4", recording: "schritt-4", turn: 0, chat: 4, attach: { de: [...REQUESTS.de], en: [...REQUESTS.en] }, check: "register" },
  { id: "schritt-5", recording: "schritt-4", turn: 1, chat: 4, attach: { de: [LATE_INVOICE.de], en: [LATE_INVOICE.en] }, check: "invoice" },
];

export function stepById(id: string): AppStep | undefined {
  return APP_STEPS.find((step) => step.id === id);
}

/** The prompt as the visitor types it: the recorded prompt without its first line ("Angehängt: ..."), which the app shows as file chips. */
export function typedPrompt(recorded: string): string {
  const lines = recorded.split("\n");
  return /^(?:Angehängt|Attached):/.test(lines[0] ?? "") ? lines.slice(1).join("\n").trim() : recorded.trim();
}
