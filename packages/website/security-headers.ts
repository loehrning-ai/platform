const MAX_PROVIDER_DSN_LENGTH = 2_048;
const SENTRY_DSN_PATTERN =
  /^https:\/\/[a-f0-9]+@[a-z0-9.-]+(?:\.de)?\.sentry\.io\/\d+$/;

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

export function buildContentSecurityPolicy(
  environment: SecurityHeaderEnvironment,
  supabaseOrigin: string | null,
): string {
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

  const scriptSources = [
    "'self'",
    // Next App Router emits inline framework scripts for RSC streaming and
    // metadata. Removing this requires a fully covered nonce architecture.
    "'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    ...(vercelTelemetryEnabled ? ["https://va.vercel-scripts.com"] : []),
    ...(turnstileEnabled ? [turnstileOrigin] : []),
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
    "frame-ancestors 'none'",
    ...(isDevelopment || isLoopbackHttpVerification
      ? []
      : ["upgrade-insecure-requests"]),
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
