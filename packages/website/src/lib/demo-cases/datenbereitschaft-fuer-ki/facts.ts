/**
 * What the recorded takes say, read by script from their final text (never
 * typed by hand): which of the case's numbers appear, in which turn, and
 * whether the last turn asks back. Captions that speak about a recording are
 * chosen from these facts, so they follow the take, not an expectation.
 */
import type { ClaudeRecording } from "@/lib/claude-runs";
import { CLAUDE_ANSWER, T1_EXPECTED } from "./data";
import { formatNumber } from "./format";

export interface TakeFacts {
  readonly id: string;
  readonly turns: number;
  /** The first turn (1 or 2) whose answer holds all three of Claude's rehearsal values, or null. */
  readonly rehearsalValuesTurn: number | null;
  /** The first turn whose answer holds all three expected values of test T1, or null. */
  readonly expectedValuesTurn: number | null;
  /** The first answer asks the person a question (a sentence that ends with a question mark). */
  readonly asksBack: boolean;
  /** The take has a follow-up, and its answer holds the rehearsal values (copy variant A of scene 1). */
  readonly followUpGivesRehearsal: boolean;
  /** The first answer says itself that the starting level (31 December 2025) is missing. */
  readonly firstTurnNamesOpening: boolean;
}

/** How the takes name the missing starting level, in either language. */
const NAMES_OPENING = /Anfangs(?:stand|bestand|wert)|Stand vom 31\.12\.2025|MRR at the start|starting MRR|MRR at 31 Dec/i;

function texts(recording: ClaudeRecording): readonly string[] {
  return [recording.final_text, ...recording.follow_ups.map((turn) => turn.final_text)];
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True when every value appears in the text as a number of its own, written
 * as the take's locale writes numbers. A value written as an offset ("X +
 * 75.890") does not count: that answer keeps the missing opening open.
 */
export function holdsAll(text: string, values: readonly number[], locale: "de" | "en"): boolean {
  return values.every((value) => new RegExp(`(?<![+\\d.,]\\s?)${escape(formatNumber(value, locale))}(?![\\d])`).test(text));
}

/** Some sentence of the answer ends with a question mark (bold or not), outside code. */
export function asksQuestion(text: string): boolean {
  return /\?(?:\*\*)?(?:\s|$)/.test(text.replace(/```[\s\S]*?```/g, ""));
}

/**
 * The three month-end values the take's last answer gives as its result:
 * the expected values, the rehearsal table, or null when it names no level
 * at all (an answer that keeps the opening open as "X + 75.890" names none).
 */
export function answerValues(recording: ClaudeRecording): readonly number[] | null {
  const locale = recording.locale === "en" ? "en" : "de";
  const all = texts(recording);
  const last = all[all.length - 1] ?? "";
  if (holdsAll(last, T1_EXPECTED, locale)) return T1_EXPECTED;
  if (holdsAll(last, CLAUDE_ANSWER, locale)) return CLAUDE_ANSWER;
  return null;
}

export function factsOf(recording: ClaudeRecording): TakeFacts {
  const locale = recording.locale === "en" ? "en" : "de";
  const all = texts(recording);
  const firstTurn = (values: readonly number[]) => {
    const index = all.findIndex((text) => holdsAll(text, values, locale));
    return index < 0 ? null : index + 1;
  };
  return {
    id: recording.id,
    turns: all.length,
    rehearsalValuesTurn: firstTurn(CLAUDE_ANSWER),
    expectedValuesTurn: firstTurn(T1_EXPECTED),
    asksBack: asksQuestion(all[0] ?? ""),
    followUpGivesRehearsal: all.length > 1 && holdsAll(all[all.length - 1] ?? "", CLAUDE_ANSWER, locale),
    firstTurnNamesOpening: NAMES_OPENING.test(all[0] ?? ""),
  };
}
