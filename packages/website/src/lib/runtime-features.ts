import "server-only";
import {
  anthropicRetentionDays,
  isAnthropicRuntimeReady,
} from "@/lib/provider-readiness";

export interface RuntimeFeatures {
  readonly account: boolean;
  readonly feedback: boolean;
  readonly supabase: boolean;
  readonly supabaseRegion: string | null;
  readonly sentry: boolean;
  readonly sentryRetentionDays: number | null;
  readonly anthropic: boolean;
  readonly anthropicRetentionDays: number | null;
  readonly vercelHosting: boolean;
  readonly vercelTelemetry: boolean;
}

/**
 * Server-only feature truth used by public copy.
 *
 * Production and CI reject partial provider configurations in validate-env.
 * These narrower checks keep local/provider-free builds honest as well: an
 * unavailable backend is never advertised as an active user feature.
 */
export function getRuntimeFeatures(): RuntimeFeatures {
  const publicSupabase = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  const serviceSupabase = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  const retention = Number(process.env.SENTRY_RETENTION_DAYS);
  const anthropicRetention = anthropicRetentionDays();
  const vercelHosting = process.env.VERCEL === "1";

  return {
    account: publicSupabase && serviceSupabase,
    feedback:
      serviceSupabase &&
      process.env.FEEDBACK_ENABLED === "true" &&
      Boolean(process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT),
    supabase: publicSupabase || serviceSupabase,
    supabaseRegion: process.env.SUPABASE_REGION || null,
    sentry: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    sentryRetentionDays:
      Number.isInteger(retention) && retention > 0 ? retention : null,
    anthropic: isAnthropicRuntimeReady(),
    anthropicRetentionDays: anthropicRetention,
    vercelHosting,
    vercelTelemetry:
      vercelHosting && process.env.VERCEL_TELEMETRY_ENABLED === "true",
  };
}
