/**
 * The replay of one recorded turn in the depicted Claude app, as pure
 * functions: the activity rows (thinking, the skill, commands, files) and
 * the answer, on a shortened clock. Waiting is shortened, content never is:
 * the streamed answer is the recorded final text, byte for byte, and the
 * timer beside the activity shows the recorded seconds of the step that is
 * on screen, never the shortened ones.
 */
import type { RecordingTurn, TimelineItem } from "@/lib/claude-runs";

export const APP_REPLAY = {
  /** The user message rises from the composer. */
  sendMs: 360,
  /** Real gaps between activity rows are shortened to this share... */
  gapShare: 0.05,
  /** ...and kept between these bounds. */
  gapMinMs: 140,
  gapMaxMs: 700,
  /** The answer streams this fast (characters per second, word chunks). */
  cps: 900,
} as const;

export type ActivityKind = "thinking" | "skill" | "command" | "read" | "search" | "write" | "note";

export interface ActivityRow {
  readonly kind: ActivityKind;
  /** The skill name, the file name, the first line of a command, or the note's text. */
  readonly detail: string;
  /** The real time of this row in the recording, ms after the prompt was sent. */
  readonly realMs: number;
  /** The run's allowlist refused this call; Claude tried another way. */
  readonly denied?: boolean;
  /** The tool reported an error. */
  readonly failed?: boolean;
  /** A command's full text, as Claude sent it (the code box). */
  readonly code?: string;
}

const fileName = (path: unknown) => (typeof path === "string" ? (path.split("/").pop() ?? path) : "");

function rowFor(item: Extract<TimelineItem, { kind: "tool_use" }>): ActivityRow {
  const input = (item.input && typeof item.input === "object" ? item.input : {}) as Record<string, unknown>;
  switch (item.tool) {
    case "Skill":
      return { kind: "skill", detail: typeof input.skill === "string" ? input.skill : "", realMs: item.t_ms };
    case "Read":
      return { kind: "read", detail: fileName(input.file_path), realMs: item.t_ms };
    case "Glob":
    case "Grep":
      return { kind: "search", detail: typeof input.pattern === "string" ? input.pattern : "", realMs: item.t_ms };
    case "Write":
    case "Edit":
      return { kind: "write", detail: fileName(input.file_path), realMs: item.t_ms };
    default: {
      const command = typeof input.command === "string" ? input.command : item.tool;
      const first = command.split("\n")[0]?.trim() ?? "";
      return { kind: "command", detail: first.length > 96 ? `${first.slice(0, 95)}…` : first, realMs: item.t_ms, code: command };
    }
  }
}

/** The activity rows of a turn: everything before the answer, in recorded order. */
export function activityRows(turn: RecordingTurn): readonly ActivityRow[] {
  let answerStart = -1;
  turn.timeline.forEach((item, index) => {
    if (item.kind === "text_start") answerStart = index;
  });
  const rows: ActivityRow[] = [];
  turn.timeline.forEach((item, index) => {
    if (index >= answerStart) return;
    if (item.kind === "thinking") {
      // Consecutive thinking blocks are one row.
      if (rows[rows.length - 1]?.kind !== "thinking") rows.push({ kind: "thinking", detail: "", realMs: item.t_ms });
    } else if (item.kind === "tool_use") rows.push(rowFor(item));
    else if (item.kind === "tool_result" && item.is_error) {
      const last = rows.length - 1;
      const row = rows[last];
      if (row && row.kind !== "thinking" && row.kind !== "note") rows[last] = { ...row, ...(item.denied ? { denied: true } : { failed: true }) };
    } else if (item.kind === "text") rows.push({ kind: "note", detail: item.chunk.trim(), realMs: item.t_ms });
  });
  return rows.filter((row) => row.kind !== "note" || row.detail.length > 0);
}

/** Word chunks of the answer, each keeping its trailing space. */
export function wordChunks(text: string): readonly string[] {
  return text.match(/\s*\S+\s*/g) ?? (text ? [text] : []);
}

export interface AppSchedule {
  readonly rows: readonly ActivityRow[];
  /** Shortened time at which each row appears, ms after send. */
  readonly rowAt: readonly number[];
  readonly answerStart: number;
  /** Shortened time at which each answer chunk ends, and the answer length at that point. */
  readonly chunks: readonly { readonly at: number; readonly end: number }[];
  readonly duration: number;
  readonly answer: string;
  readonly realMs: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function buildAppSchedule(turn: RecordingTurn): AppSchedule {
  const rows = activityRows(turn);
  const rowAt: number[] = [];
  let clock = APP_REPLAY.sendMs;
  let previousReal = 0;
  for (const row of rows) {
    clock += clamp((row.realMs - previousReal) * APP_REPLAY.gapShare, APP_REPLAY.gapMinMs, APP_REPLAY.gapMaxMs);
    rowAt.push(clock);
    previousReal = row.realMs;
  }
  let answerReal = turn.stats.duration_ms;
  for (const item of turn.timeline) if (item.kind === "text_start") answerReal = item.t_ms;
  clock += clamp((answerReal - previousReal) * APP_REPLAY.gapShare, APP_REPLAY.gapMinMs, APP_REPLAY.gapMaxMs);
  const answerStart = clock;
  const msPerChar = 1000 / APP_REPLAY.cps;
  let end = 0;
  const chunks = wordChunks(turn.final_text).map((chunk) => {
    end += chunk.length;
    return { at: answerStart + end * msPerChar, end };
  });
  const duration = chunks[chunks.length - 1]?.at ?? answerStart;
  return { rows, rowAt, answerStart, chunks, duration, answer: turn.final_text, realMs: turn.stats.duration_ms };
}

export type AppPhase = "sending" | "working" | "streaming" | "done";

export interface AppFrame {
  readonly phase: AppPhase;
  readonly rows: readonly ActivityRow[];
  readonly answer: string;
  /** Recorded seconds at this point of the replay (the timer), never the shortened clock. */
  readonly realMs: number;
}

/** The frame at shortened time t after send; Infinity gives the finished turn (reduced motion, revisits). */
export function appFrameAt(schedule: AppSchedule, t: number): AppFrame {
  if (t >= schedule.duration) return { phase: "done", rows: schedule.rows, answer: schedule.answer, realMs: schedule.realMs };
  const shown = schedule.rowAt.filter((at) => at <= t).length;
  const rows = schedule.rows.slice(0, shown);
  if (t < schedule.answerStart) {
    const next = schedule.rowAt[shown] ?? schedule.answerStart;
    const previous = shown > 0 ? (schedule.rowAt[shown - 1] as number) : 0;
    const realFrom = shown > 0 ? (schedule.rows[shown - 1] as ActivityRow).realMs : 0;
    const realTo = (schedule.rows[shown] as ActivityRow | undefined)?.realMs ?? schedule.realMs;
    const share = next > previous ? (t - previous) / (next - previous) : 1;
    return { phase: t < APP_REPLAY.sendMs ? "sending" : "working", rows, answer: "", realMs: Math.round(realFrom + (realTo - realFrom) * clamp(share, 0, 1)) };
  }
  let end = 0;
  for (const chunk of schedule.chunks) {
    if (chunk.at > t) break;
    end = chunk.end;
  }
  return { phase: "streaming", rows: schedule.rows, answer: schedule.answer.slice(0, end), realMs: schedule.realMs };
}
