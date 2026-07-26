import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MotionProvider } from "@/components/motion-provider";
import { ProgressToastProvider } from "@/components/progress/toast-provider";
import { UserProgressSync } from "@/components/auth/user-progress-sync";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/lib/seo/json-ld";
import { SITE_ENTITY } from "@/lib/seo/entity";
import { SITE_GRAPH } from "@/lib/seo/site-graph";
import "./globals.css";

const loehrningSans = localFont({
  src: [
    { path: "../fonts/LoehrningSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/LoehrningSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/LoehrningSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/LoehrningSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-loehrning-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "loehrning.ai",
    template: "%s | loehrning.ai",
  },
  description:
    SITE_ENTITY.description,
  metadataBase: new URL("https://loehrning.ai"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "loehrning.ai",
    description: SITE_ENTITY.description,
    url: "https://loehrning.ai",
    siteName: "loehrning.ai",
    locale: "de_DE",
    type: "website",
    // No explicit `images`: the file convention (opengraph-image.tsx) is the
    // single OG/Twitter image source, so pages don't emit two og:image tags.
  },
  twitter: {
    card: "summary_large_image",
    title: "loehrning.ai",
    description: SITE_ENTITY.description,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0e9",
};

// Hosting on Vercel does not silently opt the site into measurement. The
// telemetry flag is accepted only with Vercel/DPA/TDDDG attestations by
// scripts/validate-env.mjs.
const vercelTelemetryEnabled =
  process.env.VERCEL === "1" &&
  process.env.VERCEL_TELEMETRY_ENABLED === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${loehrningSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-[100svh] bg-background text-foreground antialiased font-sans">
        <JsonLd data={SITE_GRAPH} id="site-jsonld" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-white"
        >
          Zum Inhalt springen
        </a>
        <ScrollToTop />
        {/* Framer entrance wrappers serialize opacity:0 into the server HTML.
            With scripting unavailable nothing ever reveals them, so every
            .js-reveal element renders settled. !important beats the inline
            style; harmless once hydration takes over (the noscript style is
            inert with JS enabled). */}
        <noscript>
          <style>{`.js-reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-[0.3]" />
        <MotionProvider>
          <Nav />
          <main id="main-content" className="relative z-0 pt-16">{children}</main>
          <Footer />
          <UserProgressSync />
          {/* Cross-course gamification toasts (shared course architecture). Mounted
              once; any course touching the unified progress store gets XP +
              badge toasts without per-page wiring. */}
          <ProgressToastProvider />
        </MotionProvider>
        {vercelTelemetryEnabled ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
