import "server-only";

import { isServiceSupabaseKey } from "./key-classification.mjs";
import { normalizeSupabaseOrigin } from "./config";

export interface SupabaseServiceConfig {
  readonly url: string;
  readonly serviceRoleKey: string;
}

/**
 * Fail closed before a privileged Supabase client is constructed. The build
 * preflight checks the same contract, but API routes and local development can
 * execute without a production build, so the credential destination and key
 * class must also be enforced here.
 */
export function requireSupabaseServiceConfig(
  rawUrl: string | undefined,
  rawServiceRoleKey: string | undefined,
  urlVariable: string,
): SupabaseServiceConfig {
  if (!rawUrl || !rawServiceRoleKey) {
    throw new Error(
      `Missing ${urlVariable} or SUPABASE_SERVICE_ROLE_KEY environment variable`,
    );
  }

  const url = normalizeSupabaseOrigin(rawUrl);
  if (!url) {
    throw new Error(
      `Invalid ${urlVariable}: expected a standard Supabase project origin or a local loopback origin outside production`,
    );
  }

  const publicOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? normalizeSupabaseOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL)
    : null;
  const serverOrigin = process.env.SUPABASE_URL
    ? normalizeSupabaseOrigin(process.env.SUPABASE_URL)
    : null;
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_URL &&
    (!publicOrigin || !serverOrigin || publicOrigin !== serverOrigin)
  ) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_URL must identify the same approved project origin",
    );
  }

  if (!isServiceSupabaseKey(rawServiceRoleKey)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not a recognized server-only service-role key",
    );
  }
  if (
    rawServiceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    rawServiceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must not equal a browser-exposed Supabase key",
    );
  }

  return { url, serviceRoleKey: rawServiceRoleKey };
}
