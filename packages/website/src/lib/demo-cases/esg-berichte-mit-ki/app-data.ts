/**
 * Everything the depicted Claude app shows, for one edition, as plain data
 * the client can take: the project (its files read from the shipped zip, the
 * project instructions and the skill), the five steps with their recorded
 * turns, the register Claude wrote, and the numbers the captions quote.
 * Built on the server (app-data.server.ts reads the zip), typed here so the
 * client and the tests share it.
 */
import type { RecordingTurn } from "@/lib/claude-runs";
import type { StepId } from "./app-steps";
import type { Counts, Status } from "./rules";
import type { RowId } from "./ledger";

export type AppFileKind = "csv" | "md" | "txt" | "png" | "xlsx" | "zip";

/** Where a file sits in the depicted app. */
export type AppFileWhere = "knowledge" | "instructions" | "request" | "late" | "produced";

export interface AppFile {
  /** The path inside the kit folder: "ordner/strom_2025.csv". */
  readonly path: string;
  readonly name: string;
  readonly kind: AppFileKind;
  readonly bytes: number;
  readonly where: AppFileWhere;
  /** The text as in the zip (text files only), shown with editor line numbers. */
  readonly text: string | null;
}

export interface AppStepData {
  readonly id: StepId;
  /** The chat in the project (1 to 4). */
  readonly chat: number;
  /** What the visitor types: the prompt without its attachment line. */
  readonly typed: string;
  /** The files attached to the message, by kit path. */
  readonly attach: readonly string[];
  readonly turn: RecordingTurn;
  /** Wall-clock seconds of this step in the measurement. */
  readonly wallS: number;
}

export interface AppFacts {
  readonly belegt1: number;
  readonly belegt2: number;
  readonly rest2: number;
  readonly before: Counts;
  readonly after: Counts;
  /** F4 in years, as Claude worked it out in code in step 3. */
  readonly payback: number;
  /** Statuses in the register that the late invoice changes (step 5). */
  readonly changed: number;
  readonly differences: readonly { readonly row: RowId; readonly claude: Status; readonly solution: Status }[];
}

export interface AppData {
  readonly locale: "de" | "en";
  readonly project: string;
  readonly model: string;
  readonly version: string;
  readonly recordedAt: string;
  readonly files: readonly AppFile[];
  readonly instructions: string;
  readonly skill: { readonly name: string; readonly description: string; readonly href: string };
  readonly steps: readonly AppStepData[];
  /** The file Claude created in step 4 and updated in step 5. */
  readonly register: { readonly name: string; readonly rows: readonly (readonly string[])[] };
  readonly facts: AppFacts;
}

/** The project's name as the kit's start file sets it up. */
export const PROJECT_NAME = { de: "Crvena Zemja Nachweise", en: "Crvena Zemja Evidence" } as const;

export function fileKind(name: string): AppFileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "csv" || ext === "md" || ext === "png" || ext === "xlsx") return ext;
  return "txt";
}

/** "1,9 KB" / "1.9 KB": the size the file chip prints. */
export function sizeLabel(bytes: number, locale: "de" | "en"): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  const value = kb < 10 ? kb.toFixed(1) : String(Math.round(kb));
  return `${locale === "de" ? value.replace(".", ",") : value} KB`;
}

/** Fills {slots} in a copy string; a slot without a value stays visible so a test catches it. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in values ? String(values[key]) : whole));
}
