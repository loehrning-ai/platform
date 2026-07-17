import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security headers applied to every response. Optional-provider origins are
// admitted only when the corresponding integration is explicitly enabled.
//
// Next App Router emits inline framework scripts for RSC streaming and
// metadata. Without nonces on fully dynamic pages, script-src must allow
// inline scripts or client pages stay stuck in loading fallbacks.
// `next dev` additionally needs 'unsafe-eval' for React/Next debugging.
const CSP_SCRIPT_INLINE = " 'unsafe-inline'";
const CSP_SCRIPT_EVAL =
  process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const SUPABASE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ORIGIN = (() => {
  if (!SUPABASE_PUBLIC_URL) return null;
  try {
    return new URL(SUPABASE_PUBLIC_URL).origin;
  } catch {
    return null;
  }
})();
const SUPABASE_CONNECT_SRC = SUPABASE_ORIGIN
  ? ` ${SUPABASE_ORIGIN} ${SUPABASE_ORIGIN.replace("https://", "wss://")}`
  : "";
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
const SENTRY_ORIGIN = (() => {
  if (!SENTRY_DSN) return null;
  try {
    return new URL(SENTRY_DSN).origin;
  } catch {
    return null;
  }
})();
const VERCEL_TELEMETRY_ENABLED =
  process.env.VERCEL === "1" && process.env.VERCEL_TELEMETRY_ENABLED === "true";
const OPTIONAL_SCRIPT_SRC = VERCEL_TELEMETRY_ENABLED
  ? " https://va.vercel-scripts.com"
  : "";
const OPTIONAL_CONNECT_SRC = [
  SENTRY_ORIGIN,
  ...(VERCEL_TELEMETRY_ENABLED
    ? ["https://vitals.vercel-insights.com", "https://va.vercel-scripts.com"]
    : []),
]
  .filter(Boolean)
  .map((origin) => ` ${origin}`)
  .join("");
const CSP_VALUE = [
  "default-src 'self'",
  `script-src 'self'${CSP_SCRIPT_INLINE}${CSP_SCRIPT_EVAL}${OPTIONAL_SCRIPT_SRC}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${SUPABASE_CONNECT_SRC}${OPTIONAL_CONNECT_SRC}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_VALUE },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // No `output: "standalone"` — the website deploys to Vercel, which uses its own
  // build output and ignores standalone. It was unused here and broke monorepo
  // page-data collection under Next 15.5.x. Re-add only for Docker self-hosting.
  outputFileTracingRoot: join(__dirname, "../../"),
  // Drop the X-Powered-By: Next.js banner so we don't hand attackers a
  // free fingerprint of our stack version.
  poweredByHeader: false,
  // Serve AVIF/WebP via the image optimizer (performance hardening). Request-time
  // optimization activates on Vercel post-launch; locally this only affects
  // the generated srcset/accept negotiation and keeps the build green.
  images: {
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["@react-pdf/renderer", "@anthropic-ai/sdk"],
  experimental: {
    // Tree-shake lucide-react icon imports — without this, every page
    // that imports a Lucide icon pulls the full ~1000-icon barrel.
    optimizePackageImports: ["lucide-react"],
    ...(process.env.NODE_ENV === "production"
      ? {
          // Build-time integrity attributes for generated script assets. This
          // keeps static generation intact while adding tamper checks to
          // external chunks. Turbopack dev does not support this option yet.
          sri: { algorithm: "sha256" as const },
        }
      : {}),
  },
  // Retired commercial routes are handled in middleware so status,
  // X-Robots-Tag, and cache behavior stay in the crawl contract.
  redirects: async () => [],
  headers: async () => [
    {
      source: "/:path*",
      headers: SECURITY_HEADERS,
    },
    {
      // Simplified build disables original book PDFs; middleware returns 410.
      source: "/downloads/:path*.pdf",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    },
    ...[
      "/api/progress/:path*",
      "/api/scan/:path*",
      "/api/v1/scan/:path*",
      "/api/journey/:path*",
      "/api/ai-native/:path*",
      "/api/demos/:path*",
      "/api/vorlagen/:path*",
    ].map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
    })),
  ],
};

// Bundle analyzer (performance hardening): opt-in via `bun run analyze`
// (ANALYZE=true next build). Writes interactive treemaps to .next/analyze/.
// Budgets + baselines live in perf-budgets.md (report-only v1).
const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Wrap with Sentry. When SENTRY_AUTH_TOKEN is unset (local dev / preview
// without Sentry configured), uploadSourceMaps is a no-op and the build
// still succeeds.
export default withSentryConfig(withBundleAnalyzer(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Sentry's build plugin has separate product-improvement telemetry. Keep it
  // off even when runtime error reporting is explicitly configured.
  telemetry: false,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
