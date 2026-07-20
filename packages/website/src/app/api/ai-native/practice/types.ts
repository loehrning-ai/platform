// ─── Practice Room API types (shared course architecture) ──────────────────
//
// The Practice Room widgets (PromptOrrery, PromptTransform, SemanticSpace)
// optionally call live Claude through this route. The route is feature-flagged
// OFF by default; when the flag/API is absent the widgets fall back to a
// deterministic static quality score and show an honest "Live-Modus nicht
// verfügbar" note. This keeps the public fallback contract explicit.

/**
 * Practice modes.
 *  - "complete":   PromptOrrery / PromptTransform — run an assembled prompt,
 *                  get back a prose completion.
 *  - "place-word": SemanticSpace — place a new word into a 2D semantic space,
 *                  get back validated {x,y,near,why} coordinates.
 */
export const PRACTICE_MODES = ["complete", "place-word"] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];

export interface PracticeCompleteResponse {
  readonly mode: "complete";
  /** Claude's prose completion (capped server-side). */
  readonly text: string;
  readonly cached?: boolean;
}

export interface PlacedWord {
  /** 0..1 horizontal coordinate. */
  readonly x: number;
  /** 0..1 vertical coordinate. */
  readonly y: number;
  /** The existing word the new word landed nearest to. */
  readonly near: string;
  /** One short German sentence explaining the placement. */
  readonly why: string;
}

export interface PracticePlaceResponse extends PlacedWord {
  readonly mode: "place-word";
  readonly cached?: boolean;
}

export type PracticeResponse =
  | PracticeCompleteResponse
  | PracticePlaceResponse;

export interface PracticeError {
  readonly error: string;
}
