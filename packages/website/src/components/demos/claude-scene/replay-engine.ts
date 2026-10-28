/**
 * The replay engine of the Claude scene (claude-desktop-spec 5): pure, no
 * DOM. It turns recorded turns into a schedule on a virtual clock, and the
 * view asks for the frame at any time t. Waiting is shortened (clamped),
 * content never is: the streamed answer is the recorded final text, byte for
 * byte, and the engine checks that its chunks join back to it.
 */

import type { RecordingTurn, TimelineItem } from "@/lib/claude-runs";

export const REPLAY = {
  /** The user message rises from the composer. */
  sendMs: 300,
  /** Waiting before the first step or text, clamped (the real wait is in the recording). */
  thinkMinMs: 600,
  thinkMaxMs: 2500,
  /** The gap before each tool step, clamped. */
  stepMinMs: 250,
  stepMaxMs: 1500,
  /** The answer streams at most this fast (glass-spec 4.13), unless that would make the replay outlast the real run. */
  maxCps: 40,
  /** A long answer may speed up to fit the real run, but never streams in less than this. */
  answerFloorMs: 10_000,
  /** Recorded deltas count as real streaming when they span this share of chars / 60 cps. */
  recordedShare: 0.4,
  /** Approximated pacing: word chunks with this much seeded jitter. */
  jitter: 0.15,
  /** A produced file appears after the answer. */
  produceMs: 400,
} as const;

export interface ReplayTurn extends RecordingTurn {
  readonly prompt: string;
}

export type StepKind = "skill" | "read" | "bash" | "write" | "other" | "note";

export interface ReplayStep {
  readonly kind: StepKind;
  readonly tool: string;
  /** The skill name, the file name read or written, or the command's program. */
  readonly target: string;
  /** For a note: the interim text Claude wrote between steps. */
  readonly text?: string;
  readonly isError?: boolean;
}

export type ReplayEvent =
  | { readonly at: number; readonly turn: number; readonly type: "send" }
  | { readonly at: number; readonly turn: number; readonly type: "think" }
  | { readonly at: number; readonly turn: number; readonly type: "step"; readonly step: ReplayStep }
  | { readonly at: number; readonly turn: number; readonly type: "answer"; readonly end: number }
  | { readonly at: number; readonly turn: number; readonly type: "produce"; readonly files: readonly string[] }
  | { readonly at: number; readonly turn: number; readonly type: "done" };

export interface Schedule {
  readonly events: readonly ReplayEvent[];
  readonly duration: number;
  readonly turns: readonly ReplayTurn[];
  /** Start time of each turn on the virtual clock. */
  readonly starts: readonly number[];
  /** How the answer of each turn is paced. */
  readonly pacing: readonly ("recorded" | "approximated")[];
  /** A wait was shortened in this turn. */
  readonly clamped: readonly boolean[];
}

export type TurnPhase = "idle" | "sending" | "thinking" | "working" | "streaming" | "producing" | "done";

export interface TurnFrame {
  readonly phase: TurnPhase;
  readonly prompt: string;
  readonly steps: readonly ReplayStep[];
  /** The answer so far (a prefix of final_text). */
  readonly answer: string;
  readonly answerComplete: boolean;
  readonly files: readonly string[];
  /** Virtual time since this turn was sent, for the activity timer while it runs. */
  readonly elapsedMs: number;
  /** The real duration of the run, shown when the turn is done. */
  readonly realMs: number;
}

export interface ReplayFrame {
  readonly turns: readonly TurnFrame[];
  readonly done: boolean;
  /** Share of the schedule played, 0 to 1. */
  readonly progress: number;
}

/** mulberry32: a tiny seeded PRNG, so approximated pacing is the same on every replay. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable seed from a string (the recording id). */
export function seedFrom(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** The file name in a tool input (Read, Write: file_path; Skill: skill). */
function stepFrom(tool: string, input: unknown): ReplayStep {
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const path = typeof record.file_path === "string" ? record.file_path : typeof record.path === "string" ? record.path : "";
  const name = path.split("/").pop() ?? "";
  switch (tool) {
    case "Skill":
      return { kind: "skill", tool, target: typeof record.skill === "string" ? record.skill : "" };
    case "Read":
      return { kind: "read", tool, target: name };
    case "Write":
    case "Edit":
      return { kind: "write", tool, target: name };
    case "Bash": {
      const command = typeof record.command === "string" ? record.command.trim() : "";
      return { kind: "bash", tool, target: command.split(/\s+/)[0] ?? "" };
    }
    default:
      return { kind: "other", tool, target: "" };
  }
}

/** Splits the answer into chunks ending at word boundaries (each chunk keeps its trailing space). */
export function wordChunks(text: string): readonly string[] {
  return text.match(/\s*\S+\s*/g) ?? (text ? [text] : []);
}

/**
 * The answer's chunk ends and their times (ms after the answer starts).
 * Recorded pacing when the recorded deltas really streamed; else natural
 * word chunks at maxCps with seeded jitter. Never faster than maxCps.
 */
export function paceAnswer(
  timeline: readonly TimelineItem[],
  finalText: string,
  seed: number,
  cps: number = REPLAY.maxCps,
): { readonly chunks: readonly { readonly at: number; readonly end: number }[]; readonly pacing: "recorded" | "approximated" } {
  let start = -1;
  timeline.forEach((item, index) => {
    if (item.kind === "text_start") start = index;
  });
  const recorded = timeline.slice(start + 1).filter((item): item is Extract<TimelineItem, { kind: "text" }> => item.kind === "text");
  const msPerChar = 1000 / cps;
  const plausible = (finalText.length / 60) * 1000;
  const span = recorded.length > 1 ? (recorded[recorded.length - 1] as { t_ms: number }).t_ms - (recorded[0] as { t_ms: number }).t_ms : 0;
  if (recorded.length > 1 && recorded.map((item) => item.chunk).join("") === finalText && span >= plausible * REPLAY.recordedShare) {
    const t0 = (recorded[0] as { t_ms: number }).t_ms;
    let end = 0;
    const chunks = recorded.map((item) => {
      end += item.chunk.length;
      return { at: Math.max(item.t_ms - t0, end * msPerChar), end };
    });
    return { chunks, pacing: "recorded" };
  }
  const random = seededRandom(seed);
  let at = 0;
  let end = 0;
  const chunks = wordChunks(finalText).map((chunk) => {
    end += chunk.length;
    at += chunk.length * msPerChar * (1 + (random() * 2 - 1) * REPLAY.jitter);
    return { at: Math.max(at, end * msPerChar * (1 - REPLAY.jitter)), end };
  });
  // Monotonic, and the last chunk lands at the full text.
  let last = 0;
  const monotonic = chunks.map((chunk) => {
    last = Math.max(last, chunk.at);
    return { at: last, end: chunk.end };
  });
  return { chunks: monotonic, pacing: "approximated" };
}

/** Builds the schedule of the given turns, one after another. Pure. */
export function buildSchedule(turns: readonly ReplayTurn[], options: { readonly seed?: number; readonly cps?: number; readonly producedNames?: readonly string[] } = {}): Schedule {
  const events: ReplayEvent[] = [];
  const starts: number[] = [];
  const pacing: ("recorded" | "approximated")[] = [];
  const clamped: boolean[] = [];
  let clock = 0;
  turns.forEach((turn, index) => {
    starts.push(clock);
    let wasClamped = false;
    events.push({ at: clock, turn: index, type: "send" });
    clock += REPLAY.sendMs;
    events.push({ at: clock, turn: index, type: "think" });
    const firstActive = turn.timeline.find((item) => item.kind === "tool_use" || item.kind === "text_start");
    const think = firstActive ? firstActive.t_ms : turn.stats.ttft_ms;
    const thinkMs = clamp(think, REPLAY.thinkMinMs, REPLAY.thinkMaxMs);
    if (thinkMs !== think) wasClamped = true;
    clock += thinkMs;

    // Steps: every tool use, plus interim text segments as notes; the last text segment is the answer.
    let lastText = -1;
    turn.timeline.forEach((item, position) => {
      if (item.kind === "text_start") lastText = position;
    });
    let previous = firstActive?.t_ms ?? 0;
    let segment: string[] | null = null;
    let first = true;
    const written: string[] = [];
    const flushNote = () => {
      if (segment && segment.join("").trim()) events.push({ at: clock, turn: index, type: "step", step: { kind: "note", tool: "", target: "", text: segment.join("").trim() } });
      segment = null;
    };
    turn.timeline.forEach((item, position) => {
      if (position >= lastText && lastText >= 0) return;
      if (item.kind === "text_start") {
        flushNote();
        segment = [];
      } else if (item.kind === "text") {
        segment?.push(item.chunk);
      } else if (item.kind === "tool_use") {
        flushNote();
        const gap = first ? 0 : clamp(item.t_ms - previous, REPLAY.stepMinMs, REPLAY.stepMaxMs);
        if (!first && gap !== item.t_ms - previous) wasClamped = true;
        clock += gap;
        first = false;
        previous = item.t_ms;
        const step = stepFrom(item.tool, item.input);
        if (step.kind === "write" && step.target) written.push(step.target);
        events.push({ at: clock, turn: index, type: "step", step });
      } else if (item.kind === "tool_result" && item.is_error) {
        events.push({ at: clock, turn: index, type: "step", step: { kind: "other", tool: "error", target: "", isError: true } });
      }
    });
    flushNote();
    if (!first) clock += REPLAY.stepMinMs;

    // The replay never takes longer than the real run: a long answer streams faster when 40 characters a
    // second would outlast the recording (a 3,353 character answer Claude wrote in 30 s took 92 s here).
    const baseCps = options.cps ?? REPLAY.maxCps;
    const budgetMs = Math.max(REPLAY.answerFloorMs, turn.stats.duration_ms - (clock - (starts[index] ?? 0)));
    const turnCps = Math.max(baseCps, (turn.final_text.length * 1000) / budgetMs);
    const paced = paceAnswer(turn.timeline, turn.final_text, (options.seed ?? 1) + index, turnCps);
    pacing.push(paced.pacing);
    const answerStart = clock;
    for (const chunk of paced.chunks) events.push({ at: answerStart + chunk.at, turn: index, type: "answer", end: chunk.end });
    clock = answerStart + (paced.chunks[paced.chunks.length - 1]?.at ?? 0);
    const files = written.filter((name) => !options.producedNames || options.producedNames.includes(name));
    if (files.length > 0) {
      clock += REPLAY.produceMs;
      events.push({ at: clock, turn: index, type: "produce", files });
    }
    events.push({ at: clock, turn: index, type: "done" });
    clamped.push(wasClamped);
  });
  // Stable by time: events were pushed in order, but recorded answer times may tie.
  const ordered = events.map((event, order) => ({ event, order })).sort((a, b) => a.event.at - b.event.at || a.order - b.order).map(({ event }) => event);
  return { events: ordered, duration: clock, turns, starts, pacing, clamped };
}

/** The frame at virtual time t (Infinity: the finished state, used for reduced motion). Pure. */
export function frameAt(schedule: Schedule, t: number): ReplayFrame {
  const frames = schedule.turns.map((turn) => ({
    phase: "idle" as TurnPhase,
    prompt: turn.prompt,
    steps: [] as ReplayStep[],
    end: 0,
    answerComplete: false,
    files: [] as string[],
    realMs: turn.stats.duration_ms,
  }));
  for (const event of schedule.events) {
    if (event.at > t) break;
    const frame = frames[event.turn];
    if (!frame) continue;
    switch (event.type) {
      case "send":
        frame.phase = "sending";
        break;
      case "think":
        frame.phase = "thinking";
        break;
      case "step":
        frame.phase = "working";
        frame.steps.push(event.step);
        break;
      case "answer":
        frame.phase = "streaming";
        frame.end = Math.max(frame.end, event.end);
        break;
      case "produce":
        frame.phase = "producing";
        frame.files = [...event.files];
        break;
      case "done":
        frame.phase = "done";
        frame.end = schedule.turns[event.turn]?.final_text.length ?? frame.end;
        frame.answerComplete = true;
        break;
    }
  }
  const turns = frames.map((frame, index) => {
    const text = schedule.turns[index]?.final_text ?? "";
    const start = schedule.starts[index] ?? 0;
    return {
      phase: frame.phase,
      prompt: frame.prompt,
      steps: frame.steps,
      answer: text.slice(0, frame.end),
      answerComplete: frame.answerComplete,
      files: frame.files,
      elapsedMs: Math.max(0, Math.min(t, schedule.duration) - start),
      realMs: frame.realMs,
    };
  });
  const done = turns.every((turn) => turn.phase === "done");
  return { turns, done, progress: schedule.duration > 0 ? Math.min(1, Math.max(0, t / schedule.duration)) : 1 };
}

/** Consecutive Bash steps fold into one row ("Mit Python nachgerechnet, 3 Schritte"). */
export function groupSteps(steps: readonly ReplayStep[]): readonly (ReplayStep & { readonly count: number })[] {
  const rows: (ReplayStep & { count: number })[] = [];
  for (const step of steps) {
    const last = rows[rows.length - 1];
    if (last && step.kind === "bash" && last.kind === "bash") last.count += 1;
    else if (last && step.kind === "read" && last.kind === "read") {
      rows[rows.length - 1] = { ...last, target: `${last.target}, ${step.target}`, count: last.count + 1 };
    } else rows.push({ ...step, count: 1 });
  }
  return rows;
}

/** "0:12" from milliseconds. */
export function clockLabel(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
