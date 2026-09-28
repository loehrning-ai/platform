import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero";
import { ContinueSlot } from "@/components/home/continue-slot";
import { homeContinueCourses } from "@/components/home/continue-courses";
import { CredibilityStrip } from "@/components/home/credibility-strip";
import { MobileRails } from "@/components/home/mobile-rails";
import { Offering } from "@/components/home/offering";
import { Workflow } from "@/components/home/workflow";
import { HOME_COPY } from "@/components/home/home-copy";
import { HorizonGlobeFrame } from "@/components/werk/horizon-globe-frame";
import { contentLocalesForPath } from "@/lib/i18n/content-parity";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { HOME_SCENE } from "@/lib/plakat/palettes";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

// Next applies a layout's title template to its CHILD segments, not to the
// segment that declares it. The root layout owns "%s | loehrning.ai", so "/en"
// gets the suffix one segment deeper while "/" would render bare — every other
// route on the site is suffixed. Set the document title absolutely here so the
// homepage matches, without double-suffixing the OpenGraph title below.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = HOME_COPY[locale].metadata;
  const localizedPath = localizeHref("/", locale);
  const metadata = createPublicPageMetadata({
    title: copy.title,
    description: copy.description,
    path: localizedPath,
    locale,
    documentTitle: { absolute: `${copy.title} | loehrning.ai` },
  });
  const localeAlternates = buildLocaleAlternates(
    "/",
    contentLocalesForPath("/"),
  );

  return {
    ...metadata,
    alternates: {
      ...localeAlternates,
      canonical: localizedPath,
    },
    openGraph: metadata.openGraph
      ? {
          ...metadata.openGraph,
          locale: locale === "de" ? "de_DE" : "en_GB",
        }
      : metadata.openGraph,
  };
}

export default async function HomePage() {
  const locale = await getRequestLocale();

  // The page's scene (SPEC §2.3): the lemons band opens the page, and below
  // it the Kopflinien and the tab marker take Ultramarin. The graphit
  // fallback (HOME_SCENE) has no page scene.
  return (
    <div data-plakat-page={HOME_SCENE === "lemons" ? "lemons" : undefined}>
      {/* 1. Hero — the promise, stated once. Below lg it is one poster
             band: the promise, the primary action, the companion seat for
             "where you left off" and the horizon globe (its first frame
             computed here on the server). The seat is reserved in the server
             HTML and filled in the browser once the active learning
             namespace is known. */}
      <HeroSection
        locale={locale}
        phoneGlobe={<HorizonGlobeFrame />}
        continueSlot={
          <ContinueSlot locale={locale} courses={homeContinueCourses(locale)} />
        }
      />

      {/* 2. Kurse — the learning path + deeper labs */}
      <Offering locale={locale} />

      {/* 3. Companion shell only (below lg): the applied examples and the
             learning books as horizontal rails, where the wide layout gives
             each of them a card inside the Ressourcen section below. */}
      <MobileRails locale={locale} />

      {/* 4. Ressourcen — supporting material, one clear home */}
      <Workflow locale={locale} />

      {/* 5. Platform principles / trust */}
      <CredibilityStrip locale={locale} />
    </div>
  );
}
