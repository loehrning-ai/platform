import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    title: "AI-Native Arbeitskurs: Aufgaben, Wissen und Automatisierung",
    description:
      "Vier Module und 27 Lektionen zu klaren Aufgaben, Claude-Arbeitsumgebungen, gepflegtem Wissen und kontrollierter Automatisierung.",
    audience: "Berufstätige, Selbstständige und Studierende",
  },
  en: {
    title: "AI-Native Workflow Course: tasks, knowledge and automation",
    description:
      "Four modules and 27 lessons on bounded tasks, Claude workspaces, maintained knowledge and controlled automation.",
    audience: "Professionals, independent workers and students",
  },
} as const satisfies Record<Locale, Record<string, string>>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const copy = COPY[locale];
  const path = localizeHref("/ai-native/kurs", locale);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: `${SITE_URL}${path}`,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
  };
}

function courseGraph(locale: Locale) {
  const copy = COPY[locale];
  const url = `${SITE_URL}${localizeHref("/ai-native/kurs", locale)}`;
  return {
    "@context": "https://schema.org" as const,
    "@type": "Course",
    "@id": `${url}#course`,
    url,
    name: copy.title,
    description: copy.description,
    provider: { "@id": ORG_ID },
    inLanguage: locale,
    isAccessibleForFree: true,
    educationalLevel: "Intermediate",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: copy.audience,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT12H",
      inLanguage: locale,
    },
  };
}

export default async function AiNativeKursLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  return (
    <>
      <JsonLd data={courseGraph(locale)} id="ai-native-course-jsonld" />
      <div className="pb-12">{children}</div>
    </>
  );
}
