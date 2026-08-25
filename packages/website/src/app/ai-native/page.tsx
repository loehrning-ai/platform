import type { Metadata } from "next";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { AiNativeContinueBanner } from "@/components/ai-native/continue-banner";
import { AiNativeHero } from "@/components/ai-native/hero";
import { AiNativeModulesOverview } from "@/components/ai-native/modules-overview";
import { AiNativeSkillGraph } from "@/components/ai-native/skill-graph";
import { AiNativeWeekInLife } from "@/components/ai-native/week-in-life";
import { AiNativeBundleShowcase } from "@/components/ai-native/bundle-showcase";
import { AiNativeChallengeOfTheWeek } from "@/components/ai-native/challenge-of-the-week";
import { AiNativeTimAnchor } from "@/components/ai-native/tim-anchor";
import { AiNativeFaqSection } from "@/components/ai-native/faq-section";
import { AiNativeCrossSell } from "@/components/ai-native/cross-sell";
import { AiNativeFinalCta } from "@/components/ai-native/final-cta";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getCourseMeta } from "@/lib/ai-native/data";

const COURSE_PATH = "/ai-native";

const LANDING_COPY = {
  de: {
    title: "AI-Native Arbeitskurs: Aufgaben mit Claude strukturieren",
    description:
      "Kostenloser Arbeitskurs mit 4 Modulen und 27 Lektionen. Aufgaben abgrenzen, Kontext bereitstellen, Ergebnisse prüfen und wiederholbare Abläufe dokumentieren.",
    home: "Start",
    courses: "Kurse",
    courseName: "AI-Native Arbeitskurs",
    graphDescription:
      "Arbeitskurs zu klaren Aufgaben, prüfbaren Claude-Workflows, Wissensorganisation und kontrollierter Automatisierung.",
    audience: "Berufstätige, Selbstständige und Studierende",
    teaches: [
      "Aufgaben für KI-Unterstützung abgrenzen",
      "Kontext und Prüfkriterien dokumentieren",
      "wiederholbare Abläufe mit klaren Kontrollen entwerfen",
    ],
  },
  en: {
    title: "AI-Native Workflow Course: structured work with Claude",
    description:
      "Free course with 4 modules and 27 lessons. Define bounded tasks, provide context, review outputs and document repeatable workflows.",
    home: "Home",
    courses: "Courses",
    courseName: "AI-Native Workflow Course",
    graphDescription:
      "A practical course on bounded tasks, reviewable Claude workflows, maintained knowledge and controlled automation.",
    audience: "Professionals, independent workers and students",
    teaches: [
      "define bounded tasks for AI assistance",
      "document context and review criteria",
      "design repeatable workflows with explicit controls",
    ],
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const localizedPath = localizeHref(COURSE_PATH, locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates(COURSE_PATH, ["de", "en"]);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: [locale === "en" ? "de_DE" : "en_GB"],
    },
  };
}

// Breadcrumb + Course @graph (shared course architecture): mirrors the KI-Führerschein
// and EU-AI-Act landing pages so all three courses emit a breadcrumb trail and
// a free-access Course node. The breadcrumb runs Start → Kurse → AI-Native so
// the new /kurse hub is part of the indexed trail.
function buildCourseJsonLd(locale: Locale) {
  const copy = LANDING_COPY[locale];
  const meta = getCourseMeta(locale);
  const localizedPath = localizeHref(COURSE_PATH, locale);
  return {
    "@context": "https://schema.org" as const,
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: copy.home,
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.courses,
            item: `${SITE_URL}${localizeHref("/kurse", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.courseName,
            item: `${SITE_URL}${localizedPath}`,
          },
        ],
      },
      {
        "@type": "Course",
        name: meta.title,
        description: copy.graphDescription,
        url: `${SITE_URL}${localizedPath}`,
        provider: { "@id": ORG_ID },
        isAccessibleForFree: true,
        inLanguage: locale,
        educationalLevel: "Intermediate",
        audience: { "@type": "Audience", audienceType: copy.audience },
        teaches: copy.teaches,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT12H",
          inLanguage: locale,
        },
      },
    ],
  };
}

export default async function AiNativePage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return (
    <>
      <JsonLd data={buildCourseJsonLd(locale)} id="ai-native-landing-jsonld" />

      {/* Continue-where-you-left-off banner (renders only when progress exists) */}
      <AiNativeContinueBanner locale={locale} />

      {/* Hero */}
      <AiNativeHero locale={locale} />

      {/* Module overview */}
      <AiNativeModulesOverview locale={locale} />

      {/* Skill graph */}
      <AiNativeSkillGraph locale={locale} />

      {/* Week-in-life timeline */}
      <AiNativeWeekInLife locale={locale} />

      {/* Learning materials */}
      <AiNativeBundleShowcase locale={locale} />

      {/* AI Challenge of the Week */}
      <AiNativeChallengeOfTheWeek locale={locale} />

      {/* Author section */}
      <AiNativeTimAnchor locale={locale} />

      {/* FAQ */}
      <AiNativeFaqSection locale={locale} />

      {/* Demo cross-link */}
      <AiNativeCrossSell locale={locale} />

      {/* Final call to action */}
      <AiNativeFinalCta locale={locale} />

      {/* Trimmed in AI-native demo gallery implementation: BeforeAfter, PromptPlayground,
          TerminalDemo, their content lives richer in /ai-native/demos
          (ChatDemo, ComplianceDemo, WorkflowDemo, DocDemo). Components
          preserved in git history + src/ for future restore. */}
    </>
  );
}
