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

/**
 * Public request identifiers, not provider SDK model strings. The server maps
 * each value to one reviewed, pinned provider model. Arbitrary client-supplied
 * model names are never forwarded upstream.
 */
export const PRACTICE_MODEL_IDS = [
  "anthropic/claude-haiku-4.5",
  "google/gemini-2.5-flash-lite",
] as const;
export type PracticeModelId = (typeof PRACTICE_MODEL_IDS)[number];

export const DEFAULT_PRACTICE_MODEL_ID: PracticeModelId =
  "anthropic/claude-haiku-4.5";

export const PRACTICE_LOCALES = ["de", "en"] as const;
export type PracticeLocale = (typeof PRACTICE_LOCALES)[number];

export interface PracticeCompleteResponse {
  readonly mode: "complete";
  /** Provider prose completion (capped server-side). */
  readonly text: string;
  readonly model: PracticeModelId;
  readonly provider: "anthropic" | "google";
  readonly cached?: boolean;
}

export interface PlacedWord {
  /** 0..1 horizontal coordinate. */
  readonly x: number;
  /** 0..1 vertical coordinate. */
  readonly y: number;
  /** The existing word the new word landed nearest to. */
  readonly near: string;
  /** One short sentence in the request locale explaining the placement. */
  readonly why: string;
}

export interface PracticePlaceResponse extends PlacedWord {
  readonly mode: "place-word";
  readonly model: PracticeModelId;
  readonly provider: "anthropic" | "google";
  readonly cached?: boolean;
}

export type PracticeResponse = PracticeCompleteResponse | PracticePlaceResponse;

export const PRACTICE_ERROR_CODES = [
  "unsupported_media_type",
  "auth_unavailable",
  "auth_not_configured",
  "unauthorized",
  "request_read_failed",
  "request_too_large",
  "invalid_json",
  "validation_failed",
  "practice_disabled",
  "budget_not_configured",
  "model_not_allowed",
  "model_not_ready",
  "rate_limit_unavailable",
  "rate_limited",
  "request_hash_failed",
  "budget_unavailable",
  "budget_exhausted",
  "provider_timeout",
  "provider_payment_required",
  "provider_rate_limited",
  "provider_not_ready",
  "provider_unavailable",
  "provider_bad_request",
  "provider_malformed_response",
  "provider_failed",
] as const;

export type PracticeErrorCode = (typeof PRACTICE_ERROR_CODES)[number];

export interface PracticeError {
  /** Stable machine-readable failure class. Human copy remains localized. */
  readonly code: PracticeErrorCode;
  readonly error: string;
}
