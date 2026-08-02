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
