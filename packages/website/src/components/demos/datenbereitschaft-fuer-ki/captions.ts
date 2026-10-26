/**
 * The caption of every scene and move as a pure function of the state
 * (language-standard B.6: what just happened and why it matters). Every
 * number is computed here from the kit values, never written in the copy.
 */
import type { BeatId } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/beats";
import type { Pack } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/copy-de";
import { CLAUDE_ANSWER, NET_NEW_2026, T1_EXPECTED } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/data";
import { GAPS, RIGHT_CHIPS, openingOf, questionDone, type DemoState } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/demo-state";
import { EDGE_STARTS, tubLevels } from "@/lib/demo-cases/datenbereitschaft-fuer-ki/logic";
import type { Fmt } from "./fmt";
import { fileSentences } from "./scene-project";
import { pourCaption, whoCaption } from "./scene-who";

function wanneCaption(pack: Pack, fmt: Fmt, state: DemoState, free: boolean): readonly string[] {
  const w = pack.wanne;
  const opening = openingOf(state);
  if (state.wanneMove === 1 && !free) {
    if (!state.dragged && opening === 0) return [w.lineTub, w.lineFile, w.instruction1];
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
  return [s.cardLine, s.instruction1];
}

function projektCaption(pack: Pack, fmt: Fmt, state: DemoState): readonly string[] {
  const p = pack.projekt;
  if (state.projektMove === 2) {
    if (!state.tested) return [p.instruction2];
    const lines = [fmt.t(p.caption2, { got: fmt.eur(CLAUDE_ANSWER[0] ?? 0), want: fmt.eur(T1_EXPECTED[0] ?? 0) })];
    return state.sent ? [...lines, p.recall[state.sent]] : lines;
  }
  if (!state.lastFile) return [p.lead, p.instruction1];
  return fileSentences(pack, state.lastFile, state.pending === state.lastFile);
}

export function captionFor(pack: Pack, fmt: Fmt, beat: BeatId, state: DemoState, free: boolean): readonly string[] {
  switch (beat) {
    case "antwort":
      return state.sent ? pack.answer.after[state.sent] : pack.answer.context;
    case "wanne":
      return wanneCaption(pack, fmt, state, free);
    case "sicht":
      return sichtCaption(pack, fmt, state);
    case "wer-zaehlt":
      if (state.werMove === 1) return pourCaption(pack, fmt, state.pour);
      return state.codesSeen || state.search ? whoCaption(pack, fmt, state) : [pack.wer.lead2, pack.wer.instruction2];
    case "projekt":
      return projektCaption(pack, fmt, state);
    case "deine-karte":
      return [pack.own.lead];
    case "mitnehmen":
      return [pack.takehome.objective];
  }
}
