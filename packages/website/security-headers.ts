const MAX_PROVIDER_DSN_LENGTH = 2_048;
const SENTRY_DSN_PATTERN =
  /^https:\/\/[a-f0-9]+@[a-z0-9.-]+(?:\.de)?\.sentry\.io\/\d+$/;

/**
 * Next extracts the nonce it stamps into every rendered script with
 * `/^'nonce-([A-Za-z0-9+\/_-]+={0,2})'$/` (see
 * next/dist/server/app-render/get-script-nonce-from-header.js). This pattern is
 * that grammar plus a length bound, and it is the only gate through which a
 * value reaches a response header, so no delimiter, newline, or quote can be
 * smuggled into the policy.
 */
const CSP_NONCE_PATTERN = /^[A-Za-z0-9+/_-]{16,128}={0,2}$/;

/**
 * 18 random bytes carry 144 bits of entropy, well past the 128 bits a CSP nonce
 * needs to be unguessable within one response. 18 is a whole multiple of 3, so
 * base64 encodes them as exactly 24 characters with no padding to trim.
 *
 * The bytes go through the platform's own base64 encoder rather than being
 * indexed into a hand-written alphabet. A 64-character base64-alphabet literal
 * in the source is indistinguishable from an embedded credential to the
 * publication secret scanner, and splitting one up to slip past that scanner
 * would blunt a gate this repository relies on.
 */
const CSP_NONCE_BYTES = 18;

/**
 * The request header the proxy uses to hand the generated nonce to server
 * components. `x-nonce` is the name Next's own strict-CSP guidance uses.
 */
export const NONCE_REQUEST_HEADER = "x-nonce";

/**
 * Stage gate for the nonce policy.
 *
 * Report-only is deliberate, not a placeholder. Next reads a
 * `Content-Security-Policy` **or** a `Content-Security-Policy-Report-Only`
 * request header (app-render.js:209), so the nonce is stamped and the strict
 * policy is fully exercised in real browsers while nothing can break. The
 * enforced baseline is emitted by next.config.ts and still carries
 * `'unsafe-inline'`, so there is exactly one enforced policy on the wire and no
 * precedence question between the proxy and the platform's routing layer.
 *
 * Flipping this constant to "Content-Security-Policy" is the whole of the
 * enforcement step; `isSharedCacheable` below then automatically withholds the
 * policy from any response a shared cache may store.
 */
export const NONCE_CSP_HEADER:
  "Content-Security-Policy" | "Content-Security-Policy-Report-Only" =
  "Content-Security-Policy-Report-Only";

/** How a browser treats a policy: enforce it, or only report against it. */
export type CspDisposition = "enforce" | "report";

/**
 * The disposition a header name carries. A report-only policy cannot carry
 * the directives browsers only enforce and needs a reporting destination to
 * do anything at all, so the builder must know which variant it is producing.
 * Derived from the header name at the call site, so flipping NONCE_CSP_HEADER
 * flips the variant with it and the two can never disagree.
 */
export function cspDispositionOf(
  header: typeof NONCE_CSP_HEADER,
): CspDisposition {
  return header === "Content-Security-Policy" ? "enforce" : "report";
}

/**
 * Where a browser delivers a violation report. Both reporting directives of
 * the report-only policy point here: `report-uri` is the CSP2 channel WebKit
 * uses, `report-to` names the Reporting API group Chromium uses. Same-origin
 * and fixed, so the policy never interpolates anything a request supplied.
 */
export const CSP_REPORT_PATH = "/api/csp-report";

/** The Reporting API group `report-to` names. */
export const CSP_REPORT_GROUP = "csp-canary";

/**
 * The `Reporting-Endpoints` value that defines that group. A Structured Field
 * dictionary: the group is a bare key, the URL a quoted string, and the URL is
 * resolved against the response it arrives on, so it stays relative. Shipped
 * on every response so the group resolves for any document the proxy attaches
 * the report-only policy to.
 */
export const CSP_REPORTING_ENDPOINTS = `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;

/**
 * A nonce inside a document a shared cache may store is a fixed nonce: every
 * reader of the cached response holds a value that authorizes an injected
 * script, which is strictly worse than no nonce at all.
 *
 * Fail closed: a response counts as shared-cacheable unless it explicitly
 * forbids shared storage, so a missing or unrecognized Cache-Control is treated
 * as cacheable rather than assumed private.
 */
export function isSharedCacheable(
  cacheControl: string | null | undefined,
): boolean {
  const directives = (cacheControl ?? "")
    .split(",")
    .map((directive) => directive.trim().toLowerCase().split("=")[0]);
  return !directives.includes("no-store") && !directives.includes("private");
}

/** Whether a value is safe to interpolate into a `'nonce-...'` source. */
export function isCspNonce(value: string): boolean {
  return CSP_NONCE_PATTERN.test(value);
}

/**
 * Generate one per-request nonce. Returns null when the runtime exposes no
 * cryptographic random source, so a missing primitive degrades to the existing
 * nonce-free policy instead of emitting a guessable value.
 */
export function createCspNonce(
  randomSource: Pick<Crypto, "getRandomValues"> | undefined = globalThis.crypto,
): string | null {
  if (typeof randomSource?.getRandomValues !== "function") return null;
  const bytes = randomSource.getRandomValues(new Uint8Array(CSP_NONCE_BYTES));
  // btoa maps each code unit below 256 to one base64 symbol, which is exactly
  // what a Uint8Array carries, so no byte is lost or re-encoded on the way.
  const nonce = btoa(String.fromCharCode(...bytes));
  return isCspNonce(nonce) ? nonce : null;
}

export type SecurityHeaderEnvironment = Readonly<
  Partial<
    Record<
      | "NODE_ENV"
      | "NEXT_PUBLIC_SUPABASE_URL"
      | "SUPABASE_URL"
      | "NEXT_PUBLIC_SENTRY_DSN"
      | "SENTRY_DSN"
      | "VERCEL"
      | "VERCEL_TELEMETRY_ENABLED"
      | "NEXT_PUBLIC_TURNSTILE_SITE_KEY"
      | "LOEHRNING_LOCAL_VERIFICATION_ORIGIN",
      string
    >
  >
>;

type Header = Readonly<{ key: string; value: string }>;

/**
 * Derive the CSP origin only from the exact hosted Sentry DSN shape accepted
 * by the environment validator. URL parsing canonicalizes the origin before it
 * enters a response header; malformed, non-HTTPS, custom-host, whitespace, and
 * delimiter-bearing values fail closed.
 */
export function sentryOriginFromDsn(value: string | undefined): string | null {
  if (
    !value ||
    value.length > MAX_PROVIDER_DSN_LENGTH ||
    value !== value.trim() ||
    !SENTRY_DSN_PATTERN.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.origin !== "null"
      ? parsed.origin
      : null;
  } catch {
    return null;
  }
}

/**
 * Build the policy. Passing a nonce swaps the inline-script escape hatch for
 * that nonce plus `'strict-dynamic'` and changes nothing else, so the reported
 * policy and the enforced baseline stay directive-for-directive identical apart
 * from `script-src`. An absent or malformed nonce falls back to the nonce-free
 * policy rather than emitting a policy that references a value no script
 * carries.
 *
 * The report-only disposition differs from the enforced one in exactly two
 * ways, both dictated by how browsers treat a report-only policy: it omits
 * the directives that exist only to be enforced, and it names the reporting
 * destination. The default disposition is enforce, so the nonce-free baseline
 * next.config.ts builds with two arguments is untouched.
 */
export function buildContentSecurityPolicy(
  environment: SecurityHeaderEnvironment,
  supabaseOrigin: string | null,
  nonce: string | null = null,
  disposition: CspDisposition = "enforce",
): string {
  const trustedNonce = nonce !== null && isCspNonce(nonce) ? nonce : null;
  const reportOnly = disposition === "report";
  const isDevelopment = environment.NODE_ENV === "development";
  const localVerificationOrigin =
    environment.LOEHRNING_LOCAL_VERIFICATION_ORIGIN;
  const isLoopbackHttpVerification = (() => {
    if (!localVerificationOrigin || environment.VERCEL === "1") return false;
    try {
      const parsed = new URL(localVerificationOrigin);
      const port = Number(parsed.port);
      return (
        parsed.protocol === "http:" &&
        parsed.hostname === "localhost" &&
        parsed.username === "" &&
        parsed.password === "" &&
        parsed.pathname === "/" &&
        parsed.search === "" &&
        parsed.hash === "" &&
        Number.isInteger(port) &&
        port >= 1 &&
        port <= 65_535
      );
    } catch {
      return false;
    }
  })();
  const sentryDsn =
    environment.NEXT_PUBLIC_SENTRY_DSN ?? environment.SENTRY_DSN;
  const sentryOrigin = sentryOriginFromDsn(sentryDsn);
  const vercelTelemetryEnabled =
    environment.VERCEL === "1" &&
    environment.VERCEL_TELEMETRY_ENABLED === "true";
  const turnstileEnabled = Boolean(
    environment.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  const turnstileOrigin = "https://challenges.cloudflare.com";

  // Provider entries are shared by both script-src shapes. A CSP3 browser
  // ignores host sources once 'strict-dynamic' is present, but a CSP2 browser
  // ignores 'strict-dynamic' instead and falls back to this allowlist, so the
  // entries stay in the nonce policy too.
  const conditionalScriptSources = [
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ...(vercelTelemetryEnabled ? ["https://va.vercel-scripts.com"] : []),
    ...(turnstileEnabled ? [turnstileOrigin] : []),
  ];
  const scriptSources = trustedNonce
    ? [
        "'self'",
        // Next stamps this nonce onto every inline framework script and every
        // chunk it renders. 'strict-dynamic' extends that trust to the scripts
        // those chunks create (webpack chunk loads, Sentry, Turnstile,
        // analytics) without re-admitting arbitrary inline script.
        `'nonce-${trustedNonce}'`,
        "'strict-dynamic'",
        ...conditionalScriptSources,
      ]
    : [
        "'self'",
        // Next App Router emits inline framework scripts for RSC streaming and
        // metadata. Removing this requires a fully covered nonce architecture.
        "'unsafe-inline'",
        ...conditionalScriptSources,
      ];
  const connectSources = [
    "'self'",
    ...(supabaseOrigin
      ? [supabaseOrigin, supabaseOrigin.replace("https://", "wss://")]
      : []),
    ...(sentryOrigin ? [sentryOrigin] : []),
    ...(vercelTelemetryEnabled
      ? ["https://vitals.vercel-insights.com", "https://va.vercel-scripts.com"]
      : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "media-src 'self'",
    "manifest-src 'self'",
    `connect-src ${connectSources.join(" ")}`,
    turnstileEnabled ? `frame-src ${turnstileOrigin}` : "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // frame-ancestors and upgrade-insecure-requests can only be enforced;
    // there is nothing to report. Browsers ignore both in a report-only
    // policy, and WebKit and Chromium each log an error-level console message
    // per ignored directive, so the report-only variant omits them. Both stay
    // in the enforced policy, where they work.
    ...(reportOnly ? [] : ["frame-ancestors 'none'"]),
    ...(reportOnly || isDevelopment || isLoopbackHttpVerification
      ? []
      : ["upgrade-insecure-requests"]),
    // A report-only policy without a destination is inert, and WebKit says so
    // in the console. report-uri is the CSP2 channel WebKit delivers on;
    // report-to names the Reporting API group Chromium delivers on, defined by
    // the Reporting-Endpoints header buildSecurityHeaders ships alongside.
    ...(reportOnly
      ? [`report-uri ${CSP_REPORT_PATH}`, `report-to ${CSP_REPORT_GROUP}`]
      : []),
  ].join("; ");
}

export function buildSecurityHeaders(
  environment: SecurityHeaderEnvironment,
  supabaseOrigin: string | null,
): Header[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(environment, supabaseOrigin),
    },
    {
      // Defines the group the report-only policy's `report-to` names. It is
      // static, so it rides the same build-time header set as the enforced
      // policy instead of being re-emitted per request by the proxy.
      key: "Reporting-Endpoints",
      value: CSP_REPORTING_ENDPOINTS,
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        "browsing-topics=()",
        "camera=()",
        "geolocation=()",
        "gyroscope=()",
        "magnetometer=()",
        "microphone=()",
        "payment=()",
        "usb=()",
      ].join(", "),
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
}
