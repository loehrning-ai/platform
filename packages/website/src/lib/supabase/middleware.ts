import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { AUTH_COOKIE_OPTIONS, getSupabasePublicConfig } from "./config";

export async function refreshAuthSession(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<{
  readonly configured: boolean;
  readonly response: NextResponse;
  readonly user: User | null;
  readonly error: unknown | null;
}> {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  try {
    const config = getSupabasePublicConfig();

    if (!config) {
      return { configured: false, response, user: null, error: null };
    }

    const supabase = createServerClient(config.url, config.publishableKey, {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headersToSet).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Supabase uses AuthSessionMissingError for an expected anonymous request.
    // It is not a provider outage and must preserve the normal login/401 path.
    if (error?.name === "AuthSessionMissingError") {
      return { configured: true, response, user: null, error: null };
    }
    return { configured: true, response, user, error: error ?? null };
  } catch (error) {
    return { configured: true, response, user: null, error };
  }
}
