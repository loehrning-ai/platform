import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const COURSE_SLUG = "eu-ai-act-kurs" as const;
const COURSE_PATH = "/eu-ai-act-kurs/kurs";

const COPY: Readonly<
  Record<
    Locale,
    {
      readonly title: string;
      readonly description: string;
      readonly graphName: string;
      readonly graphDescription: string;
      readonly audience: string;
    }
  >
> = {
  de: {
    title: "EU AI Act Kurs: Rollen, Risiken und Pflichten",
    description:
      "Kostenloser EU-AI-Act-Kurs mit 5 Modulen, 10 Lektionen mit Übung und ca. 1 Std. Lernzeit. Ein Lernkonto ist erforderlich.",
    graphName: "EU AI Act: Rollen, Risiken und Pflichten",
    graphDescription:
      "Onlinekurs mit Übungen zu Rolle, Stichtagen, Risikoklasse, Pflichten, Kennzeichnung, Bußgeldern und Umsetzung.",
    audience:
      "Erwachsene und beruflich Verantwortliche ohne juristische Vorkenntnisse",
  },
  en: {
    title: "EU AI Act Course: roles, risks, and duties",
    description:
      "Free EU AI Act course with 5 modules, 10 hands-on lessons, and about 1 hour of study. A learning account is required.",
    graphName: "EU AI Act: roles, risks, and duties",
    graphDescription:
      "Hands-on online course on role, application dates, risk class, obligations, labelling, fines, and implementation.",
    audience: "Adults and workplace decision-makers without a legal background",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const copy = COPY[locale];
  const localizedPath = localizeHref(COURSE_PATH, locale);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: true },
    alternates: { canonical: localizedPath },
    openGraph: {
      title: copy.graphName,
      description: copy.description,
      url: `${SITE_URL}${localizedPath}`,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
  };
}

function courseGraph(locale: Locale) {
  const copy = COPY[locale];
  const url = `${SITE_URL}${localizeHref(COURSE_PATH, locale)}`;
  return {
    "@context": "https://schema.org" as const,
    "@type": "Course",
    "@id": `${url}#course`,
    url,
    name: copy.graphName,
    description: copy.graphDescription,
    provider: { "@id": ORG_ID },
    inLanguage: locale,
    isAccessibleForFree: true,
    educationalLevel: "Beginner",
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: copy.audience,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
      inLanguage: locale,
    },
  };
}

export default async function KursLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  return (
    <>
      <JsonLd data={courseGraph(locale)} id="eu-ai-act-kurs-course-jsonld" />
      <div className="pb-12">{children}</div>
    </>
  );
}
