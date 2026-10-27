import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CvLive } from "@/components/open-source/cv-live/cv-live";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { CV_LIVE_COPY } from "@/lib/open-source/cv-live/copy";
import {
  CV_LIVE_DATA,
  cvLiveDefaultChoice,
  cvLiveFontFaceCss,
  cvLiveState,
} from "@/lib/open-source/cv-live/live-data";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

const PATH = "/open-source/tools/cv-engine/live";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = CV_LIVE_COPY[locale];
  const localizedPath = localizeHref(PATH, locale);
  const metadata = createPublicPageMetadata({
    title: copy.metaTitle,
    description: copy.description,
    path: localizedPath,
    locale,
  });
  return {
    ...metadata,
    alternates: {
      ...buildLocaleAlternates(PATH, contentLocalesForPath(PATH)),
      canonical: localizedPath,
    },
  };
}

/** The default state's body, read at build time from the public folder. */
function readInitialBody(lang: "de" | "en"): string {
  const key = cvLiveState(cvLiveDefaultChoice(lang)).body;
  const href = CV_LIVE_DATA.bodies[key].href;
  return readFileSync(join(process.cwd(), "public", href), "utf8");
}

export default async function CvEngineLivePage() {
  const locale = await getRequestLocale();
  const copy = CV_LIVE_COPY[locale];
  const lang = locale === "en" ? "en" : "de";

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8"
      aria-labelledby="cv-live-title"
    >
      {/* Chromium ignores @font-face inside a shadow root, so the page's
          fonts are declared here, on the document. */}
      <style>{cvLiveFontFaceCss()}</style>
      <Link
        href={localizeHref("/open-source/tools/cv-engine", locale)}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {copy.back}
      </Link>
      <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-brand-orange">
        {copy.kicker}
      </p>
      <h1
        id="cv-live-title"
        className="mt-2 text-[clamp(2rem,5vw,4rem)] font-bold leading-none tracking-[-0.045em] text-foreground"
      >
        {copy.title}
      </h1>
      <p className="mt-3 max-w-3xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        {copy.lead}
      </p>
      <CvLive locale={locale} initialBody={readInitialBody(lang)} />
    </section>
  );
}
