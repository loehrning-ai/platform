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
}> {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const config = getSupabasePublicConfig();

  if (!config) return { configured: false, response, user: null };

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
  } = await supabase.auth.getUser();

  return { configured: true, response, user };
}

