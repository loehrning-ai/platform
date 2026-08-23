import "server-only";
import { isValidRateLimitHmacSecret } from "@/lib/security/rate-limit-secret.mjs";
import {
  PRACTICE_MODEL_IDS,
  type PracticeModelId,
} from "@/app/api/ai-native/practice/types";

export function isPastOrPresentIsoDate(value: string | undefined): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value &&
    parsed.getTime() <= Date.now()
  );
}

export function anthropicRetentionDays(): number | null {
  const raw = process.env.ANTHROPIC_RETENTION_DAYS;
  if (!raw?.trim()) return null;
  const days = Number(raw);
  return Number.isInteger(days) && days >= 0 && days <= 3650 ? days : null;
}

function boundedPositiveInteger(
  value: string | undefined,
  maximum: number,
): number | null {
  if (!/^[1-9]\d*$/.test(value ?? "")) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= maximum ? parsed : null;
}

export function practiceUserDailyTokenBudget(): number | null {
  return boundedPositiveInteger(
    process.env.AI_NATIVE_PRACTICE_USER_DAILY_TOKEN_BUDGET,
    2_000_000_000,
  );
}

export function practiceGlobalDailyTokenBudget(): number | null {
  return boundedPositiveInteger(
    process.env.AI_NATIVE_PRACTICE_GLOBAL_DAILY_TOKEN_BUDGET,
    2_000_000_000,
  );
}

export function courseTerminalDailyRunBudget(): number | null {
  return boundedPositiveInteger(
    process.env.COURSE_TERMINAL_DAILY_RUN_BUDGET,
    100_000,
  );
}

const COURSE_TERMINAL_SANDBOX_IMAGE_PATTERN =
  /^(?=.{1,200}$)[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*@sha256:[a-f0-9]{64}$/u;

/**
 * Immutable OCI image reference for the course Sandbox. Tags and bare image
 * names are rejected because they can resolve to different runtime contents
 * without a reviewed configuration change.
 */
export function courseTerminalSandboxImage(): string | null {
  const value = process.env.COURSE_TERMINAL_SANDBOX_IMAGE;
  if (!value || value !== value.trim()) return null;
  return COURSE_TERMINAL_SANDBOX_IMAGE_PATTERN.test(value) ? value : null;
}

/**
 * Exact server-side model allowlist. Missing, empty, or malformed
 * configuration returns no models so provider authorization fails closed.
 */
export function practiceAllowedModels(): readonly PracticeModelId[] {
  const raw = process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS;
  if (!raw) return [];
  const values = raw.split(",");
  if (
    values.some((value) => value.length === 0 || value !== value.trim()) ||
    new Set(values).size !== values.length ||
    values.some(
      (value) => !(PRACTICE_MODEL_IDS as readonly string[]).includes(value),
    )
  ) {
    return [];
  }
  return values as PracticeModelId[];
}

export type PracticeModelAllowlistDecision =
  | "allowed"
  | "denied"
  | "invalid";

/**
 * Distinguish an intentional model-policy denial from broken deployment
 * configuration. Only `denied` is a truthful course-policy stop.
 */
export function practiceModelAllowlistDecision(
  model: PracticeModelId,
): PracticeModelAllowlistDecision {
  const raw = process.env.AI_NATIVE_PRACTICE_ALLOWED_MODELS;
  const allowed = practiceAllowedModels();
  if (!raw || allowed.length === 0) return "invalid";
  return allowed.includes(model) ? "allowed" : "denied";
}

export function hasCompleteSupabaseRuntimeConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      isValidRateLimitHmacSecret(process.env.RATE_LIMIT_HMAC_SECRET),
  );
}

export function isAccountRuntimeReady(): boolean {
  const region = process.env.SUPABASE_REGION;
  return Boolean(
    hasCompleteSupabaseRuntimeConfig() &&
      region &&
      /^eu(?:-|$)/i.test(region) &&
      isPastOrPresentIsoDate(process.env.SUPABASE_DPA_CONFIRMED_AT),
  );
}

const TURNSTILE_TEST_SITE_KEYS = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

export function turnstileSiteKey(): string | null {
  const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!value || !/^[A-Za-z0-9_-]{20,32}$/.test(value)) return null;
  if (
    process.env.NODE_ENV === "production" &&
    TURNSTILE_TEST_SITE_KEYS.has(value)
  ) {
    return null;
  }
  return value;
}

export function isAccountAbuseProtectionReady(): boolean {
  return Boolean(
    turnstileSiteKey() &&
      isPastOrPresentIsoDate(process.env.SUPABASE_CAPTCHA_CONFIRMED_AT) &&
      isPastOrPresentIsoDate(
        process.env.TURNSTILE_CONFIGURATION_CONFIRMED_AT,
      ),
  );
}

export function isMagicLinkRuntimeReady(): boolean {
  return isAccountRuntimeReady() && isAccountAbuseProtectionReady();
}

export function isGoogleOAuthRuntimeReady(): boolean {
  return Boolean(
    isAccountRuntimeReady() &&
      isPastOrPresentIsoDate(
        process.env.SUPABASE_GOOGLE_OAUTH_CONFIRMED_AT,
      ),
  );
}

/**
 * One fail-closed runtime boundary for every route that can transmit learner
 * text to Anthropic. The build validator provides detailed diagnostics; this
 * predicate prevents local or future route code from bypassing those gates.
 */
export function isAnthropicRuntimeReady(): boolean {
  return Boolean(
    process.env.AI_NATIVE_PRACTICE_ENABLED === "true" &&
      process.env.ANTHROPIC_API_KEY &&
      isPastOrPresentIsoDate(process.env.ANTHROPIC_DPA_CONFIRMED_AT) &&
      anthropicRetentionDays() !== null &&
      hasCompleteSupabaseRuntimeConfig(),
  );
}

export function geminiRetentionDays(): number | null {
  const raw = process.env.GEMINI_RETENTION_DAYS;
  if (!raw?.trim()) return null;
  const days = Number(raw);
  return Number.isInteger(days) && days >= 0 && days <= 3650 ? days : null;
}

export function isGeminiRuntimeReady(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY &&
      isPastOrPresentIsoDate(process.env.GEMINI_DPA_CONFIRMED_AT) &&
      isPastOrPresentIsoDate(process.env.GEMINI_PAID_TIER_CONFIRMED_AT) &&
      geminiRetentionDays() !== null &&
      hasCompleteSupabaseRuntimeConfig(),
  );
}

export function isPracticeModelRuntimeReady(model: PracticeModelId): boolean {
  if (
    process.env.AI_NATIVE_PRACTICE_ENABLED !== "true" ||
    !practiceAllowedModels().includes(model) ||
    practiceUserDailyTokenBudget() === null ||
    practiceGlobalDailyTokenBudget() === null
  ) {
    return false;
  }
  return model.startsWith("anthropic/")
    ? isAnthropicRuntimeReady()
    : isGeminiRuntimeReady();
}

/**
 * Vercel Sandbox execution is a separate capability from model execution. It
 * accepts only fixed synthetic workspaces and fixed command IDs, but still
 * requires an authenticated account, durable quotas, Vercel OIDC, the hosting
 * DPA, and a dated feature-policy attestation.
 */
export function isCourseTerminalRuntimeReady(): boolean {
  return Boolean(
    process.env.COURSE_TERMINAL_ENABLED === "true" &&
      process.env.VERCEL === "1" &&
      process.env.VERCEL_OIDC_TOKEN &&
      isPastOrPresentIsoDate(process.env.VERCEL_DPA_CONFIRMED_AT) &&
      isPastOrPresentIsoDate(
        process.env.COURSE_TERMINAL_POLICY_CONFIRMED_AT,
      ) &&
      courseTerminalDailyRunBudget() !== null &&
      courseTerminalSandboxImage() !== null &&
      hasCompleteSupabaseRuntimeConfig(),
  );
}
