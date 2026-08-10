import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MotionProvider } from "@/components/motion-provider";
import { HydrationMarker } from "@/components/hydration-marker";
import { ProgressToastProvider } from "@/components/progress/toast-provider";
import { LearningOwnerBoundary } from "@/components/progress/learning-owner-boundary";
import { UserProgressSync } from "@/components/auth/user-progress-sync";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { NO_SCRIPT_FALLBACK_CSS } from "@/lib/a11y/no-script";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd } from "@/lib/seo/json-ld";
import { SITE_ENTITY } from "@/lib/seo/entity";
import { SITE_GRAPH } from "@/lib/seo/site-graph";
import "./globals.css";

const loehrningSans = localFont({
  src: [
    {
      path: "../fonts/LoehrningSans-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/LoehrningSans-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/LoehrningSans-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/LoehrningSans-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-loehrning-sans",
  // Four weight-specific files must not compete with content on every route.
  // They load on demand; `optional` prevents a late swap from resetting text
  // LCP after content is ready. Geist Mono remains the single global preload.
  display: "optional",
  preload: false,
});

const SITE_DESCRIPTION = {
  de: SITE_ENTITY.description,
  en: "Open AI and data learning platform by Tim Löhr, with courses, books, workshops, demos, and open-source materials in German and English.",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  return {
    title: {
      default: "loehrning.ai",
      template: "%s | loehrning.ai",
    },
    description: SITE_DESCRIPTION[locale],
    metadataBase: new URL("https://loehrning.ai"),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
    manifest: locale === "de" ? "/site.webmanifest" : "/site.en.webmanifest",
    openGraph: {
      siteName: "loehrning.ai",
      locale: locale === "de" ? "de_DE" : "en_GB",
      alternateLocale: locale === "de" ? ["en_GB"] : ["de_DE"],
      type: "website",
      // No explicit `images`: the file convention (opengraph-image.tsx) is the
      // single OG/Twitter image source, so pages don't emit two og:image tags.
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f3f0e9",
};

// Hosting on Vercel does not silently opt the site into measurement. The
// telemetry flag is accepted only with Vercel/DPA/TDDDG attestations by
// scripts/validate-env.mjs.
const vercelTelemetryEnabled =
  process.env.VERCEL === "1" && process.env.VERCEL_TELEMETRY_ENABLED === "true";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const globalCopy = GLOBAL_NAVIGATION_COPY[locale];

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${loehrningSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-[100svh] bg-background text-foreground antialiased font-sans">
        <JsonLd data={SITE_GRAPH} id="site-jsonld" />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-white"
        >
          {globalCopy.skipToContent}
        </a>
        {/* Framer entrance wrappers serialize their hidden state into the
            server HTML. With scripting unavailable, opted-in .js-reveal
            elements render settled and the static mobile navigation becomes
            available. The style is inert when scripting is enabled. */}
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<style>${NO_SCRIPT_FALLBACK_CSS}</style>`,
          }}
        />
        <div className="pointer-events-none fixed inset-0 z-0 bg-grid opacity-[0.3]" />
        <LocaleProvider locale={locale}>
          <MotionProvider>
            <Nav />
          </MotionProvider>
        </LocaleProvider>
        {/* App Router children remain entirely server-owned here. Passing this
            streamed subtree through a root client provider can make a retry
            resume with React's hydration cursor inside the next server host. */}
        <main id="main-content" className="relative pt-16">
          {children}
        </main>
        <ScrollToTop />
        <HydrationMarker />
        <LocaleProvider locale={locale}>
          <LearningOwnerBoundary />
        </LocaleProvider>
        <Footer />
        <UserProgressSync />
        {/* Cross-course gamification toasts (shared course architecture). Mounted
            once; any course touching the unified progress store gets XP +
            badge toasts without per-page wiring. */}
        <ProgressToastProvider />
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
