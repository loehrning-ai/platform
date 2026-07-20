import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { AUTH_COOKIE_OPTIONS, getSupabasePublicConfig } from "./config";

export async function createAuthServerClient(): Promise<SupabaseClient | null> {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
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
  /**
   * Present when Supabase is configured but `auth.getUser()` failed (network
   * outage, 5xx from Supabase Auth, ...). Distinguishes "backend down" from
   * "logged out": callers should answer 503 and report instead of treating
   * the caller as anonymous. Absent on the happy path and when unconfigured.
   */
  readonly error?: AuthError;
}> {
  const supabase = await createAuthServerClient();
  if (!supabase) return { configured: false, user: null };

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // "Auth session missing!" is Supabase's expected response for an
  // anonymous visitor with no session cookie — not a backend failure. Treat
  // it as logged-out, not as an outage (which would wrongly 503 every
  // anonymous request instead of just answering "not logged in").
  if (error && error.name !== "AuthSessionMissingError") {
    return { configured: true, user, error };
  }
  return { configured: true, user };
}

