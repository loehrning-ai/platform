import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { preload } from "react-dom";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ScrollToTop } from "@/components/scroll-to-top";
import { MotionProvider } from "@/components/motion-provider";
import { HydrationMarker } from "@/components/hydration-marker";
import { LearningOwnerBoundary } from "@/components/progress/learning-owner-boundary";
import { UserProgressSync } from "@/components/auth/user-progress-sync";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { LocaleProvider } from "@/components/i18n/locale-context";
import { NO_SCRIPT_FALLBACK_CSS } from "@/lib/a11y/no-script";
import { GLOBAL_NAVIGATION_COPY } from "@/lib/i18n/global-copy";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { JsonLd } from "@/lib/seo/json-ld";
import { SITE_ENTITY } from "@/lib/seo/entity";
import { SITE_GRAPH } from "@/lib/seo/site-graph";
import "./globals.css";

// Keep code and prompt metrics deterministic without spending the first
// document's critical bandwidth on a 71 kB monospace preload. The exact Geist
// variable face remains bundled and is fetched on demand where mono copy is
// actually rendered.
const geistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "optional",
  preload: false,
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Roboto Mono",
    "Menlo",
    "Monaco",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Courier New",
    "monospace",
  ],
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
  width: "device-width",
  initialScale: 1,
  // The companion shell below lg paints to the physical edges of the display
  // and reads the device insets back through env(safe-area-inset-*), which
  // report zero unless the viewport covers the whole screen. Zoom stays
  // unrestricted: no maximumScale, no userScalable.
  viewportFit: "cover",
  themeColor: "#f7f1e7",
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
  preload("/fonts/loehrning-sans-regular-v1.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });
  preload("/fonts/loehrning-sans-bold-v1.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={geistMono.variable}
    >
      <body className="min-h-[100svh] bg-background pb-[var(--tabbar-band-h)] text-foreground antialiased font-sans lg:pb-0">
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
        <ScrollProgress />
        <LocaleProvider locale={locale}>
          <MotionProvider>
            <Nav />
          </MotionProvider>
        </LocaleProvider>
        {/* App Router children remain entirely server-owned here. Passing this
            streamed subtree through a root client provider can make a retry
            resume with React's hydration cursor inside the next server host.

            The top band comes from tokens rather than a hard-coded offset: the
            compact companion bar below lg, the 64px header from lg. The tab
            bar's band is reserved on <body> instead, because the footer is a
            sibling of <main> and a fixed bar only needs that space at the end
            of the scrollable document. */}
        <main
          id="main-content"
          className="relative pt-[var(--nav-h-compact)] lg:pt-[var(--nav-h)]"
        >
          <LocaleProvider locale={locale}>
            <LearningOwnerBoundary />
          </LocaleProvider>
          {children}
        </main>
        <ScrollToTop />
        <HydrationMarker />
        <Footer />
        {/* The companion shell's second navigation landmark, below lg only.
            DOM order is load-bearing twice over: it must follow <Nav />, so
            the first navigation landmark stays the site nav that
            a11y-structure.spec.ts resolves with .first(), and it must come
            last so tab order matches its position at the bottom edge. The
            band it covers is already reserved on <body>. */}
        <MobileTabBar />
        <UserProgressSync />
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
