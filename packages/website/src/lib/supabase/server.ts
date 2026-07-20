import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function createServiceClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable",
    );
  }

  client = createClient(url, key, {
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
