import { NextResponse, type NextRequest } from "next/server";
import {
  redirectOriginForRequest,
  trustedRequestOrigin,
} from "@/lib/auth/origin";
import { reportApiError } from "@/lib/observability/api-error";
import { createAuthServerClient } from "@/lib/supabase/auth-server";

async function signOut(request: NextRequest) {
  let supabase;
  try {
    supabase = await createAuthServerClient();
    if (supabase) {
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
    }
  } catch (error) {
    reportApiError({
      route: "/auth/logout",
      step: "auth-sign-out",
      error,
      request,
    });
    return new NextResponse(
      "Abmeldung vorübergehend nicht möglich. Bitte später erneut versuchen.",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow, noarchive",
        },
      },
    );
  }
  const response = NextResponse.redirect(
    new URL("/login", redirectOriginForRequest(new URL(request.url))),
  );
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const trustedOrigin = trustedRequestOrigin(requestUrl);
  const suppliedOrigin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    !trustedOrigin ||
    suppliedOrigin !== trustedOrigin.origin ||
    (fetchSite !== null && fetchSite !== "same-origin")
  ) {
    return new NextResponse("Cross-origin sign-out is forbidden.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  }
  return signOut(request);
}

export function GET() {
  return new NextResponse("Use POST to sign out.", {
    status: 405,
    headers: {
      Allow: "POST",
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
