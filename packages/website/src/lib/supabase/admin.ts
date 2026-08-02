import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseServiceConfig } from "./service-config";

/**
 * Admin client with full service-role access, including supabase.auth.admin.
 *
 * Use ONLY inside src/app/api/ route handlers. Never import in components or page files.
 * Acceptance gate: grep -rn "admin.ts" src/components src/app | grep -v "src/app/api/"
 * must return zero hits.
 */
export function createAdminClient() {
  const urlVariable = process.env.SUPABASE_URL
    ? "SUPABASE_URL"
    : "NEXT_PUBLIC_SUPABASE_URL";
  const { url, serviceRoleKey } = requireSupabaseServiceConfig(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlVariable,
  );

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
