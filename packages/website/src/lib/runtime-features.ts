import "server-only";
import {
  anthropicRetentionDays,
  byoChatAllowedModels,
  geminiRetentionDays,
  hasCompleteSupabaseRuntimeConfig,
  isAccountRuntimeReady,
  isAgentAccessReady,
  isByoChatReady,
  isCourseTerminalRuntimeReady,
  isCvEngineHostedReady,
  isGoogleOAuthRuntimeReady,
  isMagicLinkRuntimeReady,
  isOAuthServerReady,
  isPracticeModelRuntimeReady,
  turnstileSiteKey,
} from "@/lib/provider-readiness";

export interface RuntimeFeatures {
  readonly account: boolean;
  readonly magicLink: boolean;
  readonly google: boolean;
  readonly turnstileSiteKey: string | null;
  readonly feedback: boolean;
  readonly supabase: boolean;
  readonly supabaseRegion: string | null;
  readonly sentry: boolean;
  readonly sentryRetentionDays: number | null;
  readonly anthropic: boolean;
  readonly anthropicRetentionDays: number | null;
  readonly gemini: boolean;
  readonly geminiRetentionDays: number | null;
  readonly practiceModels: readonly (
    | "anthropic/claude-haiku-4.5"
    | "google/gemini-2.5-flash-lite"
  )[];
  readonly courseTerminal: boolean;
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
  const serviceSupabase = hasCompleteSupabaseRuntimeConfig();
  const retention = Number(process.env.SENTRY_RETENTION_DAYS);
  const anthropicRetention = anthropicRetentionDays();
  const geminiRetention = geminiRetentionDays();
  const vercelHosting = process.env.VERCEL === "1";
  const supabaseRegion = process.env.SUPABASE_REGION || null;
  const accountReady = isAccountRuntimeReady();
  const magicLinkReady = isMagicLinkRuntimeReady();
  const googleReady = isGoogleOAuthRuntimeReady();
  const anthropicReady = isPracticeModelRuntimeReady(
    "anthropic/claude-haiku-4.5",
  );
  const geminiReady = isPracticeModelRuntimeReady(
    "google/gemini-2.5-flash-lite",
  );
  const practiceModels = ([
    "anthropic/claude-haiku-4.5",
    "google/gemini-2.5-flash-lite",
  ] as const).filter(isPracticeModelRuntimeReady);

  return {
    account: accountReady,
    magicLink: magicLinkReady,
    google: googleReady,
    turnstileSiteKey: magicLinkReady ? turnstileSiteKey() : null,
    feedback:
      serviceSupabase &&
      process.env.FEEDBACK_ENABLED === "true" &&
      Boolean(process.env.FEEDBACK_RETENTION_CRON_CONFIRMED_AT),
    supabase: publicSupabase || serviceSupabase,
    supabaseRegion,
    sentry: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    sentryRetentionDays:
      Number.isInteger(retention) && retention > 0 ? retention : null,
    anthropic: anthropicReady,
    anthropicRetentionDays: anthropicRetention,
    gemini: geminiReady,
    geminiRetentionDays: geminiRetention,
    practiceModels,
    courseTerminal: isCourseTerminalRuntimeReady(),
    vercelHosting,
    vercelTelemetry:
      vercelHosting && process.env.VERCEL_TELEMETRY_ENABLED === "true",
  };
}

/**
 * Agent-access capability truth: the public MCP server, the OAuth grant path,
 * the account chat on a student's own key, and hosted cv-engine documents.
 *
 * Deliberately a second accessor rather than more fields on RuntimeFeatures.
 * That object is the provider-disclosure surface the privacy notice renders
 * from; these four are feature switches read by the agent routes and by the
 * account pages, and they change on a different cadence.
 */
export interface AgentRuntimeFeatures {
  /** Public MCP server at /api/mcp. */
  readonly agentAccess: boolean;
  /** Supabase OAuth 2.1 Server, the grant path for agent clients. */
  readonly oauthServer: boolean;
  /** Account chat running on a student's own provider key. */
  readonly byoChat: boolean;
  /** Models the account chat may select. Empty unless byoChat is true. */
  readonly byoChatModels: readonly string[];
  /** Hosted cv-engine document access. */
  readonly cvEngineHosted: boolean;
}

export function getAgentRuntimeFeatures(): AgentRuntimeFeatures {
  const byoChatReady = isByoChatReady();
  return {
    agentAccess: isAgentAccessReady(),
    oauthServer: isOAuthServerReady(),
    byoChat: byoChatReady,
    byoChatModels: byoChatReady ? byoChatAllowedModels() : [],
    cvEngineHosted: isCvEngineHostedReady(),
  };
}
