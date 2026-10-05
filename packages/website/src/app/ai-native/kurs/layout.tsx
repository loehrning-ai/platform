import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const COPY = {
  de: {
    title: "Mit KI arbeiten: messen, absichern, belegen",
    description:
      "Vier Module und neun Lektionen mit Übung: Netto-Zeit messen, Kontext und Werkzeugrechte begrenzen, zitierte Antworten prüfen und einen Ablauf mit Freigabe testen.",
    audience: "Berufstätige, Selbstständige und Studierende",
  },
  en: {
    title: "Working with AI: measure, safeguard, cite",
    description:
      "Four modules and nine lessons with exercises: measure net time, limit context and tool permissions, check cited answers and test a workflow with approval.",
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
      courseWorkload: "PT1H8M",
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
