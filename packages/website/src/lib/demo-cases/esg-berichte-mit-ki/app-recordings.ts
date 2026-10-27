/**
 * The recorded turns behind the depicted Claude app: the median timed run of
 * 26.10.2026 per edition (measured.ts), imported by
 * scripts/demos/import-measured-run.mjs into claude-app/. Steps 1 to 4 are
 * one recording each; step 5 is the follow-up turn of step 4 (it ran with
 * --resume in the same session). The register is the Register sheet of the
 * file Claude wrote, read with openpyxl after step 5. Plain data: the route
 * hands one edition to the client, the tests read both.
 */
import type { ClaudeRecording, RecordingTurn } from "@/lib/claude-runs";
import { APP_STEPS, typedPrompt, type AppStep, type StepId } from "./app-steps";
import deRegister from "./claude-app/de-register.json";
import de1 from "./claude-app/de-schritt-1.json";
import de2 from "./claude-app/de-schritt-2.json";
import de3 from "./claude-app/de-schritt-3.json";
import de4 from "./claude-app/de-schritt-4.json";
import enRegister from "./claude-app/en-register.json";
import en1 from "./claude-app/en-schritt-1.json";
import en2 from "./claude-app/en-schritt-2.json";
import en3 from "./claude-app/en-schritt-3.json";
import en4 from "./claude-app/en-schritt-4.json";

export type Edition = "de" | "en";

/** A follow-up turn as the importer stores it: the turn plus its own prompt and wall clock. */
export interface MeasuredFollowUp extends RecordingTurn {
  readonly prompt: string;
  readonly wall_s: number;
  readonly denied_calls: number;
}

/** A file Claude wrote: its hash and size only, the public repo takes no .xlsx (the cells are in <locale>-register.json). */
export interface MeasuredProducedFile {
  readonly name: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly state: string;
}

export interface MeasuredRecording extends Omit<ClaudeRecording, "follow_ups" | "produced_files"> {
  readonly source: "measured-run";
  readonly wall_s: number;
  readonly denied_calls: number;
  readonly follow_ups: readonly MeasuredFollowUp[];
  readonly produced_files: readonly MeasuredProducedFile[];
}

export interface RegisterSheet {
  readonly source: string;
  readonly sha256: string;
  readonly sheet: string;
  /** Header row first, then one row per answer, every cell as text. */
  readonly rows: readonly (readonly string[])[];
}

const as = (value: unknown) => value as MeasuredRecording;

export const APP_RECORDINGS: Readonly<Record<Edition, Readonly<Record<AppStep["recording"], MeasuredRecording>>>> = {
  de: { "schritt-1": as(de1), "schritt-2": as(de2), "schritt-3": as(de3), "schritt-4": as(de4) },
  en: { "schritt-1": as(en1), "schritt-2": as(en2), "schritt-3": as(en3), "schritt-4": as(en4) },
};

export const APP_REGISTER: Readonly<Record<Edition, RegisterSheet>> = { de: deRegister as RegisterSheet, en: enRegister as RegisterSheet };

/** The turn a step shows, with its prompt as sent and its wall-clock seconds. */
export interface StepTurn {
  readonly recording: MeasuredRecording;
  readonly turn: RecordingTurn;
  /** Exactly what was sent, first line "Angehängt: ..." included. */
  readonly sent: string;
  readonly wallS: number;
}

export function stepTurn(edition: Edition, step: AppStep): StepTurn {
  const recording = APP_RECORDINGS[edition][step.recording];
  if (step.turn === 0) return { recording, turn: recording, sent: recording.prompt, wallS: recording.wall_s };
  const follow = recording.follow_ups[step.turn - 1];
  if (!follow) throw new Error(`${recording.id}: no follow-up ${step.turn}`);
  return { recording, turn: follow, sent: follow.prompt, wallS: follow.wall_s };
}

/** The five prompts as the visitor would paste them (without the attachment line the app shows as chips). */
export function kitPrompts(edition: Edition): readonly { readonly id: StepId; readonly text: string }[] {
  return APP_STEPS.map((step) => ({ id: step.id, text: typedPrompt(stepTurn(edition, step).sent) }));
}
