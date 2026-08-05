import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseServiceConfig } from "./service-config";

let client: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (client) return client;

  const { url, serviceRoleKey } = requireSupabaseServiceConfig(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_URL",
  );

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
    db: { schema: "public" },
  });

  return client;
}

/**
 * Returns null if Supabase is not configured (graceful degradation).
 */
export function tryCreateServiceClient(): SupabaseClient | null {
  try {
    return createServiceClient();
  } catch {
    return null;
  }
}
