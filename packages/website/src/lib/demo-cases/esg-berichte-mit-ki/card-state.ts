/**
 * Scene 1's state as a pure reducer: the guess, the three quotes, the misses
 * per part and the part being connected. A landing on a line that does not
 * carry the part never fails with a cross: it counts a miss, keeps the part
 * open and lets the readout say what that line says instead.
 */
import { land, MISSES_BEFORE_HELP, PARTS, THREADS, verdict, type PartId } from "./threads";
import type { Status } from "./rules";

export type Guess = "print" | "noPrint";

export interface CardState {
  readonly guess: Guess | null;
  readonly links: Readonly<Partial<Record<PartId, number>>>;
  readonly misses: Readonly<Record<PartId, number>>;
  readonly picking: PartId | null;
  /** The last landing, for the readout. */
  readonly last: { readonly part: PartId; readonly line: number; readonly accepted: boolean } | null;
}

export const CARD_START: CardState = {
  guess: null,
  links: {},
  misses: { zertifiziert: 0, flaeche: 0, stichtag: 0 },
  picking: null,
  last: null,
};

export type CardAction =
  | { readonly type: "guess"; readonly guess: Guess }
  | { readonly type: "pick"; readonly part: PartId | null }
  | { readonly type: "land"; readonly part: PartId; readonly line: number }
  | { readonly type: "show"; readonly part: PartId }
  | { readonly type: "all" }
  | { readonly type: "reset" };

export function cardReducer(state: CardState, action: CardAction): CardState {
  switch (action.type) {
    case "guess":
      return { ...state, guess: action.guess };
    case "pick":
      return { ...state, picking: action.part };
    case "land": {
      const landing = land(action.part, action.line);
      if (!landing.accepted) {
        return {
          ...state,
          picking: action.part,
          misses: { ...state.misses, [action.part]: state.misses[action.part] + 1 },
          last: { part: action.part, line: action.line, accepted: false },
        };
      }
      return {
        ...state,
        picking: null,
        links: { ...state.links, [action.part]: action.line },
        last: { part: action.part, line: action.line, accepted: true },
      };
    }
    case "show":
      return cardReducer(state, { type: "land", part: action.part, line: THREADS[action.part].target });
    case "all": {
      // Free play and deep links: every part connected to its target line.
      const links = Object.fromEntries(PARTS.map((part) => [part, THREADS[part].target])) as Record<PartId, number>;
      return { ...state, links, picking: null, last: null };
    }
    case "reset":
      return CARD_START;
  }
}

/** After three misses the target line glows and "Zeig mir die Zeile" appears. */
export const needsHelp = (state: CardState, part: PartId) => state.misses[part] >= MISSES_BEFORE_HELP && state.links[part] === undefined;

export const cardVerdict = (state: CardState): Status | null => verdict(state.links);

/** The next part without a quote, in the card's order. */
export const nextOpenPart = (state: CardState): PartId | null => PARTS.find((part) => state.links[part] === undefined) ?? null;
