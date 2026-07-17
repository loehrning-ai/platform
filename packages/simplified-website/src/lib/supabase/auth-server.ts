import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";

export async function createAuthServerClient(): Promise<SupabaseClient | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Middleware refreshes
          // sessions before protected pages render.
        }
      },
    },
  });
}

export async function getAuthenticatedUser(): Promise<{
  readonly configured: boolean;
  readonly user: User | null;
}> {
  const supabase = await createAuthServerClient();
  if (!supabase) return { configured: false, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { configured: true, user };
}

