/**
 * Recorded Claude runs (claude-recording/v1) for the Claude scene of each
 * demo: the types, the honesty rules as code, and the labels. A recording is
 * a real run of Claude Code (headless, `claude -p`) with the workshop's skill
 * and kit files, made by scripts/demos/record-claude-run.mjs and never
 * edited. Each demo keeps its takes in src/lib/demo-cases/<slug>/claude-runs/
 * and exports SCENE from claude-runs/index.ts.
 */

import type { Locale } from "@/lib/i18n/locale";

export const RECORDING_SCHEMA = "claude-recording/v1";

export type TimelineItem =
  | { readonly t_ms: number; readonly kind: "text_start" }
  | { readonly t_ms: number; readonly kind: "text"; readonly chunk: string }
  | { readonly t_ms: number; readonly kind: "tool_use"; readonly tool: string; readonly input: unknown }
  | { readonly t_ms: number; readonly kind: "tool_result"; readonly is_error: boolean };

export interface RecordingStats {
  readonly duration_ms: number;
  readonly duration_api_ms: number;
  readonly ttft_ms: number;
  readonly num_turns: number;
  readonly output_tokens: number;
}

/** One question and Claude's answer to it. */
export interface RecordingTurn {
  readonly timeline: readonly TimelineItem[];
  /** The CLI's result text, verbatim: what the scene shows as the answer. */
  readonly final_text: string;
  readonly stats: RecordingStats;
  readonly is_error: boolean;
  readonly stop_reason: string;
}

export interface FollowUpTurn extends RecordingTurn {
  /** The follow-up question, exactly as sent with --resume in the same session. */
  readonly prompt: string;
}

export interface KitFileRef {
  readonly name: string;
  /** The path inside the kit zip. */
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface ProducedFile {
  readonly name: string;
  readonly bytes: number;
  readonly sha256: string;
  /** The copy next to the recording: <id>.<name>. */
  readonly stored_as: string;
  /** The file as UTF-8 text (text files up to 256 KB): shown in the file panel, downloaded as these bytes. */
  readonly text?: string;
}

export interface ClaudeRecording extends RecordingTurn {
  readonly schema: typeof RECORDING_SCHEMA;
  readonly id: string;
  readonly slug: string;
  readonly locale: Locale;
  readonly prompt_id: string;
  readonly take: number;
  /** ISO 8601 UTC. */
  readonly recorded_at: string;
  readonly surface: "claude-code-cli-headless";
  readonly claude_code_version: string;
  /** The exact model id from the run's init event. */
  readonly model: string;
  readonly models_used: readonly string[];
  /** The CLI flags, without paths. */
  readonly flags: readonly string[];
  /** Exactly what was sent. */
  readonly prompt: string;
  /** The kit zip the files came from, relative to packages/website. */
  readonly kit_zip: string;
  readonly kit_files: readonly KitFileRef[];
  readonly skill: { readonly name: string; readonly sha256: string } | null;
  /** The workshop's skill, also on takes without it (so the test can check it was not offered). */
  readonly skill_name: string;
  readonly with_skill: boolean;
  readonly skill_invoked: boolean;
  readonly skills_offered: readonly string[];
  readonly memory_sources: readonly string[];
  readonly follow_ups: readonly FollowUpTurn[];
  readonly produced_files: readonly ProducedFile[];
  readonly edited: false;
  readonly selected?: boolean;
  readonly review?: { readonly by: string; readonly date: string; readonly note: string };
}

/** One question the visitor can pick, with every stored take per variant. */
export interface ScenePrompt {
  readonly id: string;
  readonly locale: Locale;
  /** Chip text: the question in a few words ("Können wir der Prognose trauen?"). */
  readonly label: string;
  /** Recording ids, in take order. */
  readonly withSkill: readonly string[];
  readonly withoutSkill: readonly string[];
  /** Chip text of the recorded follow-up turn, when the takes have one ("Nachfrage: Die Kantine hört auf"). */
  readonly followUpLabel?: string;
  /** Takes of this question that failed the honesty rules and are kept in claude-runs/rejected/ (shown as "aussortiert"). */
  readonly rejected?: number;
}

/** What a demo exports as SCENE from claude-runs/index.ts. */
export interface ClaudeSceneData {
  readonly slug: string;
  readonly prompts: readonly ScenePrompt[];
  readonly recordings: readonly ClaudeRecording[];
  /** "Was der Skill ändert": editorial lines, labelled "Unsere Notiz", written from the takes. */
  readonly notes?: Partial<Record<Locale, readonly string[]>>;
}

/** No machine path or session secret may be in a recording (claude-desktop-spec 12). */
export const RECORDING_FORBIDDEN = /\/Users\/|\/private\/|\/var\/folders|session_id|signature|\/home\/[a-z]/;

/** The text chunks of the last text segment, joined (the answer the engine streams). */
export function answerFromTimeline(timeline: readonly TimelineItem[]): string {
  let start = -1;
  timeline.forEach((item, index) => {
    if (item.kind === "text_start") start = index;
  });
  return timeline
    .slice(start + 1)
    .filter((item): item is Extract<TimelineItem, { kind: "text" }> => item.kind === "text")
    .map((item) => item.chunk)
    .join("");
}

/** Every way a recording breaks the format or the honesty rules (hash checks live in the test). */
export function validateRecording(recording: ClaudeRecording): readonly string[] {
  const errors: string[] = [];
  const at = (message: string) => errors.push(`${recording.id}: ${message}`);
  if (recording.schema !== RECORDING_SCHEMA) at(`schema ${String(recording.schema)}`);
  if (recording.edited !== false) at("edited must be the literal false");
  if (recording.surface !== "claude-code-cli-headless") at("surface");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(recording.recorded_at)) at("recorded_at is not ISO 8601");
  if (!/^claude-[a-z0-9-]+$/.test(recording.model)) at(`model id ${recording.model}`);
  if (recording.memory_sources.some((source) => source !== "auto")) at("memory sources beyond auto");
  if (recording.is_error || recording.stop_reason !== "end_turn") at("the run did not end cleanly");
  if (recording.with_skill && !recording.skill_invoked) at("a take with the skill never invoked it");
  if (recording.with_skill && recording.skill?.name !== recording.skill_name) at("skill name mismatch");
  if (!recording.with_skill && recording.skills_offered.includes(recording.skill_name)) at("the skill was offered in a take without it");
  if (answerFromTimeline(recording.timeline) !== recording.final_text) at("streamed answer differs from final_text");
  for (const [index, turn] of recording.follow_ups.entries()) {
    if (answerFromTimeline(turn.timeline) !== turn.final_text) at(`follow-up ${index + 1}: streamed answer differs from final_text`);
    if (turn.is_error) at(`follow-up ${index + 1} ended with an error`);
  }
  if (RECORDING_FORBIDDEN.test(JSON.stringify(recording))) at("contains a machine path or a session secret");
  return errors;
}

/** "claude-opus-5-5" to "Claude Opus 5.5"; an unknown id is shown as it is. */
export function modelName(id: string): string {
  const match = /^claude-(opus|sonnet|haiku|fable)-(\d+)-(\d+)(?:-\d{8})?$/.exec(id);
  if (!match) return id;
  const family = (match[1] as string).charAt(0).toUpperCase() + (match[1] as string).slice(1);
  return `Claude ${family} ${match[2]}.${match[3]}`;
}

/** The short model label in the depicted composer: "Opus 5.5". */
export function modelShortName(id: string): string {
  return modelName(id).replace(/^Claude /, "");
}

/** The recording date as the page prints it: "26.10.2026" / "26 October 2026" (UTC, never "now"). */
export function recordedOn(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  if (locale === "de") {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
  }
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Recordings of one prompt and variant, in take order. */
export function takesFor(scene: ClaudeSceneData, prompt: ScenePrompt, withSkill: boolean): readonly ClaudeRecording[] {
  const ids = withSkill ? prompt.withSkill : prompt.withoutSkill;
  return ids.map((id) => scene.recordings.find((recording) => recording.id === id)).filter((recording): recording is ClaudeRecording => Boolean(recording));
}

/** The prompts a page in this locale shows: its own takes, or the other language's with a note (never translated). */
export function promptsFor(scene: ClaudeSceneData, locale: Locale): { readonly prompts: readonly ScenePrompt[]; readonly foreign: boolean } {
  const own = scene.prompts.filter((prompt) => prompt.locale === locale);
  if (own.length > 0) return { prompts: own, foreign: false };
  return { prompts: scene.prompts, foreign: scene.prompts.length > 0 };
}
