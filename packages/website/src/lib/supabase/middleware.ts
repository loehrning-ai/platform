import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  AUTH_COOKIE_OPTIONS,
  boundAuthCookieOptions,
  getSupabasePublicConfig,
} from "./config";
import {
  discardNonFirstPartySession,
  verifyFirstPartySession,
} from "./first-party-session";

export async function refreshAuthSession(
  request: NextRequest,
  requestHeaders: Headers,
  continuationResponse?: NextResponse,
): Promise<{
  readonly configured: boolean;
  readonly response: NextResponse;
  readonly user: User | null;
  readonly error: unknown | null;
}> {
  const response =
    continuationResponse ??
    NextResponse.next({
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
            response.cookies.set(name, value, boundAuthCookieOptions(options));
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
    if (error || !user) {
      return { configured: true, response, user, error: error ?? null };
    }

    // An OAuth client's access token passes getUser() as well. Only a
    // first-party session counts as signed in (see ./first-party-session);
    // any other is dropped from the cookies this response carries.
    const session = await verifyFirstPartySession(supabase, user.id);
    if (session.status === "unavailable") {
      return { configured: true, response, user: null, error: session.error };
    }
    if (session.status === "not-first-party") {
      await discardNonFirstPartySession(supabase);
      return { configured: true, response, user: null, error: null };
    }
    return { configured: true, response, user, error: null };
  } catch (error) {
    return { configured: true, response, user: null, error };
  }
}
