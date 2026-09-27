import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  AUTH_COOKIE_OPTIONS,
  boundAuthCookieOptions,
  getSupabasePublicConfig,
} from "./config";
import {
  discardNonFirstPartySession,
  verifyFirstPartySession,
} from "./first-party-session";

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
            cookieStore.set(name, value, boundAuthCookieOptions(options));
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
  readonly error?: unknown;
}> {
  let supabase: SupabaseClient | null;
  try {
    supabase = await createAuthServerClient();
  } catch (error) {
    return { configured: true, user: null, error };
  }
  if (!supabase) return { configured: false, user: null };

  let result;
  try {
    result = await supabase.auth.getUser();
  } catch (error) {
    return { configured: true, user: null, error };
  }
  const {
    data: { user },
    error,
  } = result;

  // "Auth session missing!" is Supabase's expected response for an
  // anonymous visitor with no session cookie — not a backend failure. Treat
  // it as logged-out, not as an outage (which would wrongly 503 every
  // anonymous request instead of just answering "not logged in").
  if (error && error.name !== "AuthSessionMissingError") {
    return { configured: true, user, error };
  }
  if (!user) return { configured: true, user: null };

  // getUser() proves the token is genuine, not that this site issued it. An
  // OAuth client's access token passes getUser() too; only a first-party
  // session may act as the learner here (see ./first-party-session).
  const session = await verifyFirstPartySession(supabase, user.id);
  if (session.status === "unavailable") {
    return { configured: true, user: null, error: session.error };
  }
  if (session.status === "not-first-party") {
    await discardNonFirstPartySession(supabase);
    return { configured: true, user: null };
  }
  return { configured: true, user };
}
