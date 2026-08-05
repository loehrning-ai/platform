import "server-only";
import { isValidRateLimitHmacSecret } from "@/lib/security/rate-limit-secret.mjs";

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
