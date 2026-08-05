import { NextResponse, type NextRequest } from "next/server";
import { cacheHeaderFor, getCrawlRoute, NOINDEX_HEADER } from "@/lib/crawl/contract";
import { redirectOriginForRequest } from "@/lib/auth/origin";
import { isGatedCoursePath, isProtectedPlatformPath } from "@/lib/auth/routes";
import { reportApiError } from "@/lib/observability/api-error";
import { refreshAuthSession } from "@/lib/supabase/middleware";

function preserveAuthHeaders(source: NextResponse, target: NextResponse): NextResponse {
  // Supabase may refresh more than one cookie while the middleware decides to
  // replace NextResponse.next() with a redirect or terminal error. Copy only
  // that auth state and explicit cache-safety headers. Internal Next router
  // controls such as x-middleware-next must never reach a terminal response.
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(key);
    if (value && !target.headers.has(key)) target.headers.set(key, value);
  }
  return target;
}

function mergeVaryHeader(headers: Headers, value: string): void {
  const existing = (headers.get("Vary") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (
    existing.includes("*") ||
    existing.some((entry) => entry.toLowerCase() === value.toLowerCase())
  ) {
    return;
  }
  headers.set("Vary", [...existing, value].join(", "));
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const route = getCrawlRoute(pathname);

  if (route.routeClass === "retired") {
    const headers = {
      "X-Robots-Tag": route.xRobotsTag ?? NOINDEX_HEADER,
      "Cache-Control": cacheHeaderFor(route),
    };
    if (route.auth === "redirect" && route.redirectTo) {
      const url = new URL(
        route.redirectTo,
        redirectOriginForRequest(request.nextUrl),
      );
      const redirect = NextResponse.redirect(url, route.status ?? 301);
      for (const [key, value] of Object.entries(headers)) redirect.headers.set(key, value);
      return redirect;
    }
    return new NextResponse(null, {
      status: route.status ?? 410,
      headers,
    });
  }

  const requestHeaders = new Headers(request.headers);

  const protectedPath = isProtectedPlatformPath(pathname);
  const routeLevelAuth = route.auth === "route-level";
  const authAwarePublicPath = pathname === "/login" || pathname.startsWith("/auth/");
  if (!protectedPath && !authAwarePublicPath) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    if (route.xRobotsTag) response.headers.set("X-Robots-Tag", route.xRobotsTag);
    if (routeLevelAuth) {
      response.headers.set("Cache-Control", cacheHeaderFor(route));
      mergeVaryHeader(response.headers, "Cookie");
    }
    return response;
  }

  let authState;
  try {
    authState = await refreshAuthSession(request, requestHeaders);
  } catch (error) {
    authState = {
      configured: true,
      response: NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      user: null,
      error,
    };
  }
  const { configured, response, user, error: authError } = authState;

  if (authError) {
    reportApiError({
      request,
      step: "auth-get-user",
      error: authError,
    });
  }

  if (!protectedPath) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
    return response;
  }

  if (authError) {
    const headers = {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": NOINDEX_HEADER,
      "Retry-After": "30",
    };
    const unavailable = pathname.startsWith("/api/")
      ? NextResponse.json(
          { error: "auth_unavailable" },
          { status: 503, headers },
        )
      : new NextResponse(
          "Authentifizierung vorübergehend nicht verfügbar.",
          { status: 503, headers },
        );
    return preserveAuthHeaders(response, unavailable);
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return preserveAuthHeaders(response, NextResponse.json(
        { error: configured ? "unauthorized" : "auth_not_configured" },
        {
          status: configured ? 401 : 503,
          headers: {
            "Cache-Control": "private, no-store",
            "X-Robots-Tag": NOINDEX_HEADER,
          },
        },
      ));
    }
    const loginUrl = new URL(
      "/login",
      redirectOriginForRequest(request.nextUrl),
    );
    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );
    if (!configured) {
      loginUrl.searchParams.set("reason", "auth-not-configured");
    } else if (pathname === "/konto" || pathname.startsWith("/konto/")) {
      // Redirect to konto specifically — nudge to save progress, not a hard gate.
      loginUrl.searchParams.set("reason", "progress-save");
    } else if (isGatedCoursePath(pathname)) {
      loginUrl.searchParams.set("reason", "kurs-login");
    }
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("X-Robots-Tag", NOINDEX_HEADER);
    return preserveAuthHeaders(response, redirect);
  }

  response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
  response.headers.set("Cache-Control", "private, no-store");
  mergeVaryHeader(response.headers, "Cookie");

  return response;
}

export const config = {
  // Supabase's server-side client uses guarded Node.js runtime detection.
  // Next.js 15.5 supports Node.js middleware as a stable runtime, avoiding
  // an Edge bundle that contains unsupported Node.js API probes.
  runtime: "nodejs",
  matcher: [
    // Skip Next internals and pure static asset extensions; every other path
    // (HTML routes, retired routes, APIs) stays contract-governed.
    // Deliberately NOT excluded: .pdf/.md/.csv (retired PDFs must return 410
    // and public template/demo downloads must receive noindex policy headers)
    // and .json/.txt/.xml (public machine routes).
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|ttf|otf|woff|woff2|eot|webmanifest)$).*)",
  ],
};
