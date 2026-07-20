import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with full service-role access, including supabase.auth.admin.
 *
 * Use ONLY inside src/app/api/ route handlers. Never import in components or page files.
 * Acceptance gate: grep -rn "admin.ts" src/components src/app | grep -v "src/app/api/"
 * must return zero hits.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
