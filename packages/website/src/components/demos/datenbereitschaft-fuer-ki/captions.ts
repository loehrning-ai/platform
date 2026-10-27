/**
 * The caption of every scene and move as a pure function of the state
 * (language-standard B.6: what just happened and why it matters). Every
 * number is computed here from the kit values, never written in the copy.
 */
import type { BeatId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/beats";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { CLAUDE_ANSWER, NET_NEW_2026, T1_EXPECTED } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { GAPS, RIGHT_CHIPS, openingOf, questionDone, type DemoState, type GradeId, type Grading } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { EDGE_STARTS, tubLevels } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import type { Fmt } from "./fmt";
import { fileSentences } from "./scene-project";
import { pourCaption, whoCaption } from "./scene-who";

function wanneCaption(pack: Pack, fmt: Fmt, state: DemoState, free: boolean): readonly string[] {
  const w = pack.wanne;
  const opening = openingOf(state);
  if (state.wanneMove === 1 && !free) {
    if (!state.dragged && opening === 0) return [w.instruction1, w.lineTub, w.lineFile];
    if (opening === 0) return [fmt.t(w.notchCaption, { apr: fmt.eur(CLAUDE_ANSWER[0] ?? 0), may: fmt.eur(CLAUDE_ANSWER[1] ?? 0), jun: fmt.eur(CLAUDE_ANSWER[2] ?? 0) })];
    const june = tubLevels(NET_NEW_2026, opening)[5] ?? 0;
    return [fmt.t(w.caption1, { opening: fmt.eur(opening), june: fmt.eur(june) }), w.aha];
  }
  if (state.edge === 0) {
    if (free && state.opening > 0) {
      const june = tubLevels(NET_NEW_2026, state.opening)[5] ?? 0;
      return [fmt.t(w.caption1, { opening: fmt.eur(state.opening), june: fmt.eur(june) }), w.free];
    }
    return free ? [w.free, w.caption2Start] : [w.instruction2, w.caption2Start];
  }
  const start = EDGE_STARTS[state.edge] ?? "2026-01";
  if (state.edge === EDGE_STARTS.length - 1) return [...w.caption2End.map((line) => fmt.t(line, { opening: fmt.eur(opening) })), w.closing];
  if (state.edge === 1) return [fmt.t(w.caption2One, { opening: fmt.eur(opening) })];
  return [fmt.t(w.caption2, { month: fmt.month(start), n: state.edge, opening: fmt.eur(opening) })];
}

function sichtCaption(pack: Pack, fmt: Fmt, state: DemoState): readonly string[] {
  const s = pack.sicht;
  if (state.sichtMove === 2) {
    if (state.viewPlaced) return [s.tiles.view.sentence];
    if (state.lastTile) return [s.tiles[state.lastTile].sentence, s.springBack];
    return [s.instruction2];
  }
  if (questionDone(state)) return s.complete;
  const chip = state.lastChip;
  if (chip && chip in s.wrong) return [s.wrong[chip as keyof typeof s.wrong]];
  const missing = GAPS.filter((gap) => !(state.gaps[gap] && RIGHT_CHIPS.includes(state.gaps[gap]!))).map((gap) => s.gapNames[gap]);
  if (missing.length < GAPS.length) {
    const lines = [fmt.t(s.missing, { missing: fmt.list(missing) })];
    return chip === "dateRight" ? [s.stichtag, ...lines] : lines;
  }
  return [s.instruction1, s.cardLine];
}

/** The test list's verdict on one answer: it fails, it passes, or there is no level to check. */
export function gradeVerdict(pack: Pack, fmt: Fmt, grade: GradeId, values: readonly number[] | null): string {
  const p = pack.projekt;
  const source = p.gradeSource[grade];
  if (values === null) return fmt.t(p.gradeNone, { source });
  const passes = values.every((value, index) => value === T1_EXPECTED[index]);
  return fmt.t(passes ? p.gradePass : p.gradeFail, { source, got: fmt.eur(values[0] ?? 0), want: fmt.eur(T1_EXPECTED[0] ?? 0) });
}

function projektCaption(pack: Pack, fmt: Fmt, state: DemoState, grading: Grading): readonly string[] {
  const p = pack.projekt;
  if (state.projektMove === 2) {
    if (!state.tested) return [p.instruction2];
    const verdict = gradeVerdict(pack, fmt, state.grade, grading[state.grade]);
    const lines = state.grade === "rehearsal" ? [p.gradeNext, verdict, p.gradeOrigin] : [verdict, p.gradeOrigin];
    return state.sent ? [...lines, p.recall[state.sent]] : lines;
  }
  if (!state.lastFile) return [p.instruction1, p.lead];
  return fileSentences(pack, state.lastFile, state.lastMatched);
}

export function captionFor(pack: Pack, fmt: Fmt, beat: BeatId, state: DemoState, free: boolean, grading: Grading): readonly string[] {
  switch (beat) {
    case "antwort":
      return state.sent ? pack.answer.after[state.sent] : pack.answer.context;
    case "wanne":
      return wanneCaption(pack, fmt, state, free);
    case "sicht":
      return sichtCaption(pack, fmt, state);
    case "wer-zaehlt":
      if (state.werMove === 1) return pourCaption(pack, fmt, state.pour);
      return state.codesSeen || state.search ? whoCaption(pack, fmt, state) : [pack.wer.instruction2, pack.wer.lead2];
    case "projekt":
      return projektCaption(pack, fmt, state, grading);
    case "deine-karte":
      return [pack.own.lead];
    case "mitnehmen":
      return [pack.takehome.objective];
  }
}
