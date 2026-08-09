import type { Metadata } from "next";
import {
  getGlossary,
  getEntriesByCategory,
  getCategoryLabel,
  CATEGORY_ORDER,
} from "@/lib/ai-native/glossary";
import { GlossaryView } from "@/components/ai-native/glossary-view";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/seo/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const title =
    locale === "en"
      ? "Glossary: AI-Native Workflow Course"
      : "Glossar: AI-Native Arbeitskurs";
  const description =
    locale === "en"
      ? "Seventy definitions for the technical, organizational and regulatory terms used in the AI-Native Workflow Course."
      : "Siebzig Definitionen für die technischen, organisatorischen und regulatorischen Begriffe des AI-Native Arbeitskurses.";
  const localizedPath = localizeHref("/ai-native/glossar", locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates("/ai-native/glossar", ["de", "en"]);
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
  };
}

export default async function GlossarPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const { _meta, entries } = getGlossary(locale);
  const groups = CATEGORY_ORDER.map((cat, i) => ({
    key: cat,
    num: `0${i + 1}`.slice(-2),
    label: getCategoryLabel(cat, locale),
    entries: getEntriesByCategory(cat, locale)
      .slice()
      .sort((a, b) => a.term.localeCompare(b.term, locale)),
  })).filter((g) => g.entries.length > 0);

  return (
    <GlossaryView
      groups={groups}
      totalTerms={entries.length}
      version={_meta.version}
      lastUpdated={_meta.last_updated}
      locale={locale}
    />
  );
}
