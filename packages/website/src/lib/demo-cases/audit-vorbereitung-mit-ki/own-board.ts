/**
 * Scene 4: the visitor's own files as cards on the request board. Each file
 * starts next to the generic request its name most likely answers
 * (keywordHits); the visitor moves a card when the guess is wrong, and the
 * row's bound is recomputed from the files on it. A name and a date can rule a
 * file out, never confirm it, so no bound is ever "covered". Pure.
 */

import { boundOf, type Bound } from "./bound";
import { GENERIC_ITEM_IDS, keywordHits, type ItemId } from "./classify";
import type { OwnFile } from "./own-folder";

/** A file's place: a request, or "fits none". */
export type Place = ItemId | null;

/** The request whose keywords the file name hits most, or null; ties go to the earlier request. */
export function guessPlace(name: string): Place {
  let best: Place = null;
  let hits = 0;
  for (const id of GENERIC_ITEM_IDS) {
    const count = keywordHits(id, name);
    if (count > hits) {
      best = id;
      hits = count;
    }
  }
  return best;
}

export type Moves = Readonly<Record<string, Place>>;

/** Moves one card; a move back to the guessed place drops the override. */
export function moveCard(moves: Moves, file: OwnFile, to: Place): Moves {
  const name = file.entry.name;
  const rest = Object.fromEntries(Object.entries(moves).filter(([key]) => key !== name));
  return guessPlace(name) === to ? rest : { ...rest, [name]: to };
}

export function placeOf(file: OwnFile, moves: Moves): Place {
  const name = file.entry.name;
  return Object.prototype.hasOwnProperty.call(moves, name) ? (moves[name] ?? null) : guessPlace(name);
}

export interface OwnRow {
  readonly id: ItemId;
  readonly files: readonly OwnFile[];
  readonly bound: Bound;
}

export interface OwnBoard {
  readonly rows: readonly OwnRow[];
  /** Files that fit no request (no keyword, or moved there). */
  readonly none: readonly OwnFile[];
  /** Lock files and other cards the page never places. */
  readonly skipped: readonly OwnFile[];
}

/** The bound of a row from its best file: one that passes date and approval if any, else the first. */
function rowBound(files: readonly OwnFile[]): Bound {
  const best = files.find((file) => file.dateTest !== false && file.approvalTest !== false) ?? files[0] ?? null;
  return boundOf({ hasCandidate: best !== null, date: best?.dateTest ?? null, approval: best?.approvalTest ?? null, notMet: best?.notMet != null });
}

export function ownBoard(files: readonly OwnFile[], moves: Moves = {}): OwnBoard {
  const placed = files.filter((file) => !file.lock);
  const rows = GENERIC_ITEM_IDS.map((id): OwnRow => {
    const on = placed.filter((file) => placeOf(file, moves) === id);
    return { id, files: on, bound: rowBound(on) };
  });
  return { rows, none: placed.filter((file) => placeOf(file, moves) === null), skipped: files.filter((file) => file.lock) };
}
