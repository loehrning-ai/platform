import { NextResponse, type NextRequest } from "next/server";
import { cacheHeaderFor, getCrawlRoute, NOINDEX_HEADER } from "@/lib/crawl/contract";
import { isGatedCoursePath, isProtectedPlatformPath } from "@/lib/auth/routes";
import { refreshAuthSession } from "@/lib/supabase/middleware";

function preserveAuthHeaders(source: NextResponse, target: NextResponse): NextResponse {
  source.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (normalized === "content-type") return;
    if (normalized === "set-cookie") {
      target.headers.append(key, value);
      return;
    }
    if (!target.headers.has(key)) target.headers.set(key, value);
  });
  return target;
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
      const url = request.nextUrl.clone();
      url.pathname = route.redirectTo;
      url.search = "";
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
  const authAwarePublicPath = pathname === "/login" || pathname.startsWith("/auth/");
  if (!protectedPath && !authAwarePublicPath) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    if (route.xRobotsTag) response.headers.set("X-Robots-Tag", route.xRobotsTag);
    return response;
  }

  const { configured, response, user } = await refreshAuthSession(request, requestHeaders);

  if (!protectedPath) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
    return response;
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
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
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
  response.headers.set("Vary", "Cookie");

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
