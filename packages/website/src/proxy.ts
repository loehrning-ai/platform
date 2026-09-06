import { NextResponse, type NextRequest } from "next/server";
import {
  buildContentSecurityPolicy,
  createCspNonce,
  cspDispositionOf,
  isSharedCacheable,
  NONCE_CSP_HEADER,
  NONCE_REQUEST_HEADER,
  type SecurityHeaderEnvironment,
} from "../security-headers";
import {
  cacheHeaderFor,
  getCrawlRoute,
  NOINDEX_HEADER,
  type CrawlRoute,
} from "@/lib/crawl/contract";
import { normalizeSupabaseOrigin } from "@/lib/supabase/config";
import { redirectOriginForRequest } from "@/lib/auth/origin";
import { isGatedCoursePath, isProtectedPlatformPath } from "@/lib/auth/routes";
import { reportApiError } from "@/lib/observability/api-error";
import { refreshAuthSession } from "@/lib/supabase/middleware";
import { hasEnglishContentParity } from "@/lib/i18n/content-parity";
import {
  LOCALE_REQUEST_HEADER,
  isUnprefixedLocalePath,
  localizeHref,
  parseLocalePathname,
  type Locale,
} from "@/lib/i18n/locale";

/**
 * Every marker the policy builder reads, resolved through explicit named
 * property access. The Edge bundle inlines only reads of a single, statically
 * named `process.env` property, so spreading `process.env` here would silently
 * drop the provider markers and make the policy the proxy reports disagree with
 * the enforced baseline next.config.ts builds from the same function.
 *
 * Spell each marker out rather than writing a placeholder name: the
 * child-process environment policy classifies every `process.env` key it finds
 * in this package's sources, and a stand-in reads to it as a real one.
 */
const CSP_ENVIRONMENT: SecurityHeaderEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_DSN: process.env.SENTRY_DSN,
  VERCEL: process.env.VERCEL,
  VERCEL_TELEMETRY_ENABLED: process.env.VERCEL_TELEMETRY_ENABLED,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  LOEHRNING_LOCAL_VERIFICATION_ORIGIN:
    process.env.LOEHRNING_LOCAL_VERIFICATION_ORIGIN,
};

const CSP_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const CSP_SUPABASE_ORIGIN = CSP_SUPABASE_URL
  ? normalizeSupabaseOrigin(CSP_SUPABASE_URL)
  : null;

/**
 * Machine-readable endpoints and static assets are the only responses this app
 * intentionally serves from a shared cache. They render no scripts, so a
 * per-request value in them would buy nothing and only fragment their caching.
 */
function issuesNonce(route: CrawlRoute): boolean {
  return (
    route.routeClass !== "public-machine" &&
    route.routeClass !== "public-assets" &&
    route.cache !== "public-static"
  );
}

/**
 * The cache policy the proxy will publish on a continued document, decided
 * from the contract and the request alone so it is known before anything
 * per-request is minted. Null means the route handler owns the final policy
 * (public APIs, non-GET requests); `isSharedCacheable` treats null as shared,
 * so no nonce is minted for those either.
 */
function continuationCacheControl(
  args: Readonly<{
    method: string;
    pathname: string;
    route: CrawlRoute;
    protectedPath: boolean;
    authAwarePublicPath: boolean;
  }>,
): string | null {
  const { method, pathname, route, protectedPath, authAwarePublicPath } = args;
  // Protected documents render per session and /login and /auth/* render per
  // cookie. Neither may ever be stored by a shared cache.
  if (protectedPath || authAwarePublicPath) return "private, no-store";
  if (route.auth === "route-level") return cacheHeaderFor(route);
  // Middleware owns cache policy for public documents and machine files.
  // Public APIs own their final response policy in the route handler; a
  // continuation header here could otherwise mark personalized POST data or
  // a live health response as publicly cacheable before it is handled.
  if ((method === "GET" || method === "HEAD") && !pathname.startsWith("/api/")) {
    return cacheHeaderFor(route);
  }
  return null;
}

/**
 * Publish the nonce policy on a response Next will render a document for.
 *
 * The mint decision in `proxy` already guarantees a nonce exists only for a
 * response a shared cache must not store. This guard keeps that invariant
 * even if a branch below ever changes the cache policy after minting, in
 * either disposition: a withheld header leaves the nonce-free baseline from
 * next.config.ts in force, so the page still works, it simply is not
 * hardened.
 */
function applyNoncePolicy(response: NextResponse, policy: string | null): void {
  if (!policy) return;
  if (isSharedCacheable(response.headers.get("Cache-Control"))) return;
  response.headers.set(NONCE_CSP_HEADER, policy);
}

function preserveAuthHeaders(
  source: NextResponse,
  target: NextResponse,
): NextResponse {
  // Supabase may refresh more than one cookie while the proxy decides to
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

function localeContinuation(requestHeaders: Headers): NextResponse {
  // Locale-prefixed public URLs have concrete modules under app/en. Middleware
  // only forwards the trusted locale header; it never changes route identity.
  // This keeps the browser router and streamed server tree on the same path.
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function applyLocaleIndexing(
  response: NextResponse,
  locale: Locale,
  pathname: string,
): void {
  // The /en route tree is available for progressive translation, but a route
  // stays non-indexable until its page content has reviewed English parity.
  if (locale === "en" && !hasEnglishContentParity(pathname)) {
    response.headers.set("X-Robots-Tag", NOINDEX_HEADER);
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const visiblePathname = request.nextUrl.pathname;
  const localePath = parseLocalePathname(visiblePathname);
  if (!localePath.valid) {
    return new NextResponse("Ungültiger Pfad.", {
      status: 400,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": NOINDEX_HEADER,
      },
    });
  }

  const { locale, pathname } = localePath;

  // German is the default canonical URL space. An explicit /de prefix is
  // normalized once, before crawl or authentication work.
  if (localePath.explicitLocale === "de") {
    const canonicalUrl = new URL(
      `${pathname}${request.nextUrl.search}`,
      redirectOriginForRequest(request.nextUrl),
    );
    return NextResponse.redirect(canonicalUrl, 308);
  }

  // APIs, auth callbacks and machine-readable endpoints have one unprefixed
  // identity. A temporary redirect preserves callback query strings and API
  // methods without creating a second functional endpoint.
  if (localePath.explicitLocale === "en" && isUnprefixedLocalePath(pathname)) {
    const canonicalUrl = new URL(
      `${pathname}${request.nextUrl.search}`,
      redirectOriginForRequest(request.nextUrl),
    );
    const redirect = NextResponse.redirect(canonicalUrl, 307);
    redirect.headers.set("Cache-Control", "private, no-store");
    redirect.headers.set("X-Robots-Tag", NOINDEX_HEADER);
    return redirect;
  }

  const route = getCrawlRoute(pathname);

  if (route.routeClass === "retired") {
    if (route.auth === "redirect" && route.redirectTo) {
      const url = new URL(
        localizeHref(route.redirectTo, locale),
        redirectOriginForRequest(request.nextUrl),
      );
      const redirect = NextResponse.redirect(url, route.status ?? 301);
      redirect.headers.set("Cache-Control", cacheHeaderFor(route));
      return redirect;
    }
    return new NextResponse(null, {
      status: route.status ?? 410,
      headers: {
        "X-Robots-Tag": route.xRobotsTag ?? NOINDEX_HEADER,
        "Cache-Control": cacheHeaderFor(route),
      },
    });
  }

  const requestHeaders = new Headers(request.headers);
  // Never trust an inbound internal locale header. Middleware derives it from
  // the sanitized path and overwrites any client-supplied value.
  requestHeaders.delete(LOCALE_REQUEST_HEADER);
  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);
  // Next reads a Content-Security-Policy or Content-Security-Policy-Report-Only
  // REQUEST header and stamps the first nonce it finds onto every script it
  // renders. Forwarding an inbound copy would therefore let a client choose
  // that nonce, so both headers and the derived x-nonce are dropped before the
  // proxy sets its own.
  requestHeaders.delete("content-security-policy");
  requestHeaders.delete("content-security-policy-report-only");
  requestHeaders.delete(NONCE_REQUEST_HEADER);

  const protectedPath = isProtectedPlatformPath(pathname);
  const routeLevelAuth = route.auth === "route-level";
  const authAwarePublicPath =
    pathname === "/login" || pathname.startsWith("/auth/");

  // Cache policy first, nonce second. A nonce minted for a shared-cacheable
  // document would reach Next through the request header and be rendered
  // into HTML a CDN keeps for an hour: a fixed nonce every reader of that
  // copy would hold. So for a document a shared cache may store, no nonce
  // and no nonce policy exist at all, in either disposition.
  const cacheControl = continuationCacheControl({
    method: request.method,
    pathname,
    route,
    protectedPath,
    authAwarePublicPath,
  });
  const nonce =
    issuesNonce(route) && !isSharedCacheable(cacheControl)
      ? createCspNonce()
      : null;
  const noncePolicy = nonce
    ? buildContentSecurityPolicy(
        CSP_ENVIRONMENT,
        CSP_SUPABASE_ORIGIN,
        nonce,
        cspDispositionOf(NONCE_CSP_HEADER),
      )
    : null;
  if (nonce && noncePolicy) {
    requestHeaders.set(NONCE_CSP_HEADER, noncePolicy);
    requestHeaders.set(NONCE_REQUEST_HEADER, nonce);
  }
  const continuation = localeContinuation(requestHeaders);

  if (!protectedPath && !authAwarePublicPath) {
    const response = continuation;
    if (route.xRobotsTag)
      response.headers.set("X-Robots-Tag", route.xRobotsTag);
    applyLocaleIndexing(response, locale, pathname);
    if (cacheControl !== null) {
      response.headers.set("Cache-Control", cacheControl);
    }
    if (routeLevelAuth) mergeVaryHeader(response.headers, "Cookie");
    applyNoncePolicy(response, noncePolicy);
    return response;
  }

  let authState;
  try {
    authState = await refreshAuthSession(request, requestHeaders, continuation);
  } catch (error) {
    authState = {
      configured: true,
      response: continuation,
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
    // Decided above: an auth-aware document renders per cookie, so it is
    // never shared-cacheable, which is also what lets it carry a nonce.
    if (cacheControl !== null) {
      response.headers.set("Cache-Control", cacheControl);
    }
    applyLocaleIndexing(response, locale, pathname);
    applyNoncePolicy(response, noncePolicy);
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
      : new NextResponse("Authentifizierung vorübergehend nicht verfügbar.", {
          status: 503,
          headers,
        });
    return preserveAuthHeaders(response, unavailable);
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return preserveAuthHeaders(
        response,
        NextResponse.json(
          { error: configured ? "unauthorized" : "auth_not_configured" },
          {
            status: configured ? 401 : 503,
            headers: {
              "Cache-Control": "private, no-store",
              "X-Robots-Tag": NOINDEX_HEADER,
            },
          },
        ),
      );
    }
    const loginUrl = new URL(
      localizeHref("/login", locale),
      redirectOriginForRequest(request.nextUrl),
    );
    loginUrl.searchParams.set(
      "next",
      `${visiblePathname}${request.nextUrl.search}`,
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
  applyNoncePolicy(response, noncePolicy);

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals and pure static asset extensions; every other path
    // (HTML routes, retired routes, APIs) stays contract-governed.
    // Deliberately NOT excluded: .pdf/.md/.csv (retired PDFs must return 410
    // and public template/demo downloads must receive noindex policy headers)
    // and .json/.txt/.xml (public machine routes).
    "/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|ttf|otf|woff|woff2|eot|webmanifest)$).*)",
  ],
};
