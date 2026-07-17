// ─── Practice Room shared client types (shared course architecture) ─────────
//
// Mirrors the request shapes accepted by POST /api/ai-native/practice
// (see app/api/ai-native/practice/validation.ts) so the client helper and the
// widgets share one vocabulary without importing edge-route modules.

export interface ExistingPoint {
  readonly w: string;
  readonly x: number;
  readonly y: number;
}

export type PracticeRequestBody =
  | { readonly mode: "complete"; readonly prompt: string }
  | {
      readonly mode: "place-word";
      readonly word: string;
      readonly existing: readonly ExistingPoint[];
    };

export interface PlacedWord {
  readonly x: number;
  readonly y: number;
  readonly near: string;
  readonly why: string;
}
