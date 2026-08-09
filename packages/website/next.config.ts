import type { NextConfig } from "next";
import createBundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSupabaseOrigin } from "./src/lib/supabase/config.ts";
import { buildSecurityHeaders } from "./security-headers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_ORIGIN = SUPABASE_PUBLIC_URL
  ? normalizeSupabaseOrigin(SUPABASE_PUBLIC_URL)
  : null;
const SECURITY_HEADERS = buildSecurityHeaders(process.env, SUPABASE_ORIGIN);

const nextConfig: NextConfig = {
  // No `output: "standalone"` — the website deploys to Vercel, which uses its own
  // build output and ignores standalone. It was unused here and broke monorepo
  // page-data collection in this monorepo. Re-add only for Docker self-hosting.
  outputFileTracingRoot: join(__dirname, "../../"),
  // Drop the X-Powered-By: Next.js banner so we don't hand attackers a
  // free fingerprint of our stack version.
  poweredByHeader: false,
  // Keep browser source maps unavailable as public Next.js assets. When the
  // optional Sentry upload group is configured, the wrapper below generates,
  // uploads, and then deletes its private upload artifacts.
  productionBrowserSourceMaps: false,
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
    // No `sri` here: Vercel stamps the deployment ID into the webpack runtime
    // chunk after the build, so build-time integrity hashes no longer match
    // and the browser blocks the chunk — killing hydration site-wide.
  },
  // Retired commercial routes are handled in middleware so status,
  // X-Robots-Tag, and cache behavior stay in the crawl contract. The only
  // infrastructure redirect establishes one canonical host so cookies,
  // analytics, and search signals do not split across apex and www.
  redirects: async () => [
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.loehrning.ai" }],
      destination: "https://loehrning.ai/:path*",
      permanent: true,
    },
    {
      source: "/en/site.webmanifest",
      destination: "/site.en.webmanifest",
      permanent: true,
    },
    {
      source: "/en/site.en.webmanifest",
      destination: "/site.en.webmanifest",
      permanent: true,
    },
  ],
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
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: false,
  },
});
