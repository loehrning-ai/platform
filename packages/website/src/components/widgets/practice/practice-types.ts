// ─── Practice Room shared client types (shared course architecture) ─────────
//
// Mirrors the request shapes accepted by POST /api/ai-native/practice
// (see app/api/ai-native/practice/validation.ts) so the client helper and the
// widgets share one vocabulary without importing edge-route modules.

import type {
  PracticeLocale,
  PracticeModelId,
} from "@/app/api/ai-native/practice/types";

export interface ExistingPoint {
  readonly w: string;
  readonly x: number;
  readonly y: number;
}

export type PracticeRequestBody =
  | {
      readonly mode: "complete";
      readonly prompt: string;
      readonly model: PracticeModelId;
      readonly locale: PracticeLocale;
    }
  | {
      readonly mode: "place-word";
      readonly word: string;
      readonly existing: readonly ExistingPoint[];
      readonly model: PracticeModelId;
      readonly locale: PracticeLocale;
    };

export interface PlacedWord {
  readonly x: number;
  readonly y: number;
  readonly near: string;
  readonly why: string;
}
