import { SITE_ORIGIN } from "@/lib/seo/entity";

const PRODUCTION_ORIGIN = new URL(SITE_ORIGIN);
const PRODUCTION_HOSTNAMES = new Set([
  PRODUCTION_ORIGIN.hostname,
  `www.${PRODUCTION_ORIGIN.hostname}`,
]);
const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

function configuredLocalVerificationOrigin(): URL | null {
  const candidate = process.env.LOEHRNING_LOCAL_VERIFICATION_ORIGIN;
  if (
    !candidate ||
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV)
  ) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    if (
      parsed.protocol !== "http:" ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      !LOOPBACK_HOSTNAMES.has(parsed.hostname) ||
      parsed.pathname !== "/" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function previewDeploymentOrigin(requestUrl: URL): URL | null {
  if (process.env.VERCEL_ENV !== "preview" || requestUrl.protocol !== "https:") {
    return null;
  }

  for (const candidate of [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]) {
    if (!candidate) continue;
    try {
      const parsed = new URL(`https://${candidate}`);
      if (
        parsed.protocol === "https:" &&
        parsed.username === "" &&
        parsed.password === "" &&
        parsed.hostname.endsWith(".vercel.app") &&
        parsed.port === "" &&
        parsed.pathname === "/" &&
        parsed.search === "" &&
        parsed.hash === "" &&
        parsed.origin === requestUrl.origin
      ) {
        return parsed;
      }
    } catch {
      // Vercel system variables are expected to contain a bare hostname.
    }
  }
  return null;
}

function firstForwardedValue(raw: string | null): string | null {
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  return first && first.length > 0 && first.length <= 255 ? first : null;
}

/**
 * Rebuilds the externally visible request URL for a route handler.
 *
 * Next serves route handlers with a placeholder authority (`http://n/…`) behind
 * the platform proxy, so `request.url` — and `request.nextUrl`, which derives
 * from it — describe the internal invocation rather than the request the user
 * made. Only the path and query survive that hop intact, so the authority is
 * restored from the proxy's forwarded headers.
 *
 * The result is a *claim*, never a grant. Callers must still pass it through
 * `trustedRequestOrigin`, which accepts an authority only when it matches the
 * production hostnames or this deployment's own Vercel URL, so a forged header
 * cannot widen trust beyond the origins the app already redirects to.
 */
export function externalRequestUrl(request: {
  readonly url: string;
  readonly headers: Headers;
}): URL {
  const internalUrl = new URL(request.url);
  const host =
    firstForwardedValue(request.headers.get("x-forwarded-host")) ??
    firstForwardedValue(request.headers.get("host"));
  const protocol = firstForwardedValue(
    request.headers.get("x-forwarded-proto"),
  );
  if (!host || (protocol !== "http" && protocol !== "https")) {
    return internalUrl;
  }

  try {
    const externalUrl = new URL(
      `${protocol}://${host}${internalUrl.pathname}${internalUrl.search}`,
    );
    // A forwarded authority must be a bare host. Anything carrying credentials
    // or a mismatched path is treated as untrustworthy input, not sanitized.
    if (
      externalUrl.username !== "" ||
      externalUrl.password !== "" ||
      externalUrl.pathname !== internalUrl.pathname
    ) {
      return internalUrl;
    }
    return externalUrl;
  } catch {
    return internalUrl;
  }
}

/**
 * Resolves an origin only when its authority is independently trusted.
 *
 * Production always canonicalizes to the apex origin. Preview requests must
 * exactly match a Vercel-provided hostname. Loopback is available only outside
 * production so local redirects remain usable without trusting arbitrary Host
 * or forwarded-host input. A production-mode local verification server must
 * opt in with the exact HTTP origin injected only into that server process.
 */
export function trustedRequestOrigin(requestUrl: URL): URL | null {
  if (
    requestUrl.protocol === "https:" &&
    requestUrl.username === "" &&
    requestUrl.password === "" &&
    requestUrl.port === "" &&
    PRODUCTION_HOSTNAMES.has(requestUrl.hostname)
  ) {
    return new URL(PRODUCTION_ORIGIN);
  }

  const previewOrigin = previewDeploymentOrigin(requestUrl);
  if (previewOrigin) return previewOrigin;

  const isLoopbackRequest =
    (requestUrl.protocol === "http:" || requestUrl.protocol === "https:") &&
    requestUrl.username === "" &&
    requestUrl.password === "" &&
    LOOPBACK_HOSTNAMES.has(requestUrl.hostname);
  if (process.env.NODE_ENV !== "production" && isLoopbackRequest) {
    return new URL(requestUrl.origin);
  }

  const localVerificationOrigin = configuredLocalVerificationOrigin();
  if (
    isLoopbackRequest &&
    localVerificationOrigin &&
    requestUrl.origin === localVerificationOrigin.origin
  ) {
    return new URL(localVerificationOrigin);
  }

  return null;
}

/**
 * Safe base for redirects that do not need to reject the request outright.
 * Untrusted authority falls back to the fixed production origin.
 */
export function redirectOriginForRequest(requestUrl: URL): URL {
  return trustedRequestOrigin(requestUrl) ?? new URL(PRODUCTION_ORIGIN);
}
