/**
 * The recorded takes of scene 5 as the window needs them: the turn to
 * replay (timeline and final text, untouched), the files that were attached,
 * the main file Claude wrote, and the steps of the run in words the visitor
 * understands. Built on the server from claude-runs/ and review.ts, so the
 * browser gets one locale and only the takes it shows. Pure.
 */

import { modelName, modelShortName, recordedOn, takesFor, type ClaudeRecording, type ClaudeSceneData, type RecordingTurn } from "@/lib/claude-runs";
import type { Locale } from "@/lib/i18n/locale";
import { reviewOf, type MarkReview } from "./claude-runs/review";

/** One step of the run, in the order of the recorded tool calls. */
export type TakeStep =
  | { readonly kind: "skill"; readonly name: string }
  | { readonly kind: "look" }
  | { readonly kind: "python" }
  | { readonly kind: "write"; readonly name: string }
  | { readonly kind: "copy" }
  | { readonly kind: "other" };

export interface WindowFile {
  readonly name: string;
  readonly bytes: number;
}

export interface WindowTake {
  readonly id: string;
  readonly withSkill: boolean;
  readonly skillName: string;
  /** Exactly what was sent. */
  readonly prompt: string;
  /** The turn the replay engine plays, as recorded. */
  readonly turn: RecordingTurn;
  /** "26.10.2026" / "26 October 2026". */
  readonly recordedOn: string;
  /** "Claude Opus 5.5". */
  readonly model: string;
  /** "Opus 5.5". */
  readonly modelShort: string;
  readonly kitFiles: readonly WindowFile[];
  /** The evidence file Claude wrote in this run, if it wrote one. */
  readonly produced: (WindowFile & { readonly text: string }) | null;
  /** How many files the run wrote in all (copies of folder files included). */
  readonly producedCount: number;
  readonly steps: readonly TakeStep[];
  /** Reviewed quote marks of this take, by quote (review.ts). */
  readonly reviews: Readonly<Record<string, MarkReview>>;
}

export interface WindowQuestion {
  readonly id: string;
  readonly label: string;
  readonly withSkill: WindowTake | null;
  readonly withoutSkill: WindowTake | null;
  readonly notes: readonly string[];
  readonly rejected: number;
  readonly rejectedReason: string | null;
}

/** What one recorded tool call did, in the visitor's words. */
export function stepOf(tool: string, input: unknown): TakeStep {
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  if (tool === "Skill") return { kind: "skill", name: typeof record.skill === "string" ? record.skill : "" };
  if (tool === "Read" || tool === "Glob" || tool === "Grep") return { kind: "look" };
  if (tool === "Write" || tool === "Edit") {
    const path = typeof record.file_path === "string" ? record.file_path : "";
    return { kind: "write", name: path.split("/").pop() ?? "" };
  }
  if (tool !== "Bash") return { kind: "other" };
  const command = typeof record.command === "string" ? record.command : "";
  if (/\bpython3?\b/.test(command)) return { kind: "python" };
  const written = /\bcat\s*>\s*([^\s<;&|]+)/.exec(command);
  if (written) return { kind: "write", name: (written[1] ?? "").split("/").pop() ?? "" };
  if (/\b(cp|mkdir)\b/.test(command)) return { kind: "copy" };
  return { kind: "look" };
}

/** The evidence file a run wrote: its largest Markdown file that is not a copy of an attached file. */
export function mainProduced(recording: ClaudeRecording): (WindowFile & { readonly text: string }) | null {
  const attached = new Set(recording.kit_files.map((file) => file.name));
  const own = recording.produced_files
    .filter((file) => file.name.endsWith(".md") && !attached.has(file.name) && typeof file.text === "string")
    .sort((a, b) => b.bytes - a.bytes)[0];
  return own ? { name: own.name, bytes: own.bytes, text: own.text ?? "" } : null;
}

export function windowTake(recording: ClaudeRecording, locale: Locale): WindowTake {
  return {
    id: recording.id,
    withSkill: recording.with_skill,
    skillName: recording.skill_name,
    prompt: recording.prompt,
    turn: {
      timeline: recording.timeline,
      final_text: recording.final_text,
      stats: recording.stats,
      is_error: recording.is_error,
      stop_reason: recording.stop_reason,
    },
    recordedOn: recordedOn(recording.recorded_at, locale),
    model: modelName(recording.model),
    modelShort: modelShortName(recording.model),
    kitFiles: recording.kit_files.map((file) => ({ name: file.name, bytes: file.bytes })),
    produced: mainProduced(recording),
    producedCount: recording.produced_files.length,
    steps: recording.timeline.flatMap((item) => (item.kind === "tool_use" ? [stepOf(item.tool, item.input)] : [])),
    reviews: reviewOf(recording.id).marks ?? {},
  };
}

/** The take a question shows for one variant: the reviewed selection, else the first take. */
export function selectedTake(scene: ClaudeSceneData, promptIndex: number, withSkill: boolean): ClaudeRecording | null {
  const prompt = scene.prompts[promptIndex];
  if (!prompt) return null;
  const takes = takesFor(scene, prompt, withSkill);
  return takes.find((take) => reviewOf(take.id).selected) ?? takes[0] ?? null;
}

/** Every question of one locale with its two shown takes. */
export function windowQuestions(scene: ClaudeSceneData | null, locale: Locale): readonly WindowQuestion[] {
  if (!scene) return [];
  return scene.prompts.flatMap((prompt, index) => {
    if (prompt.locale !== locale) return [];
    const withSkill = selectedTake(scene, index, true);
    const withoutSkill = selectedTake(scene, index, false);
    return [
      {
        id: prompt.id,
        label: prompt.label,
        withSkill: withSkill ? windowTake(withSkill, locale) : null,
        withoutSkill: withoutSkill ? windowTake(withoutSkill, locale) : null,
        notes: prompt.notes ?? scene.notes?.[locale] ?? [],
        rejected: prompt.rejected ?? 0,
        rejectedReason: prompt.rejectedReason ?? null,
      },
    ];
  });
}
