import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const COURSE_SLUG = "ki-fuehrerschein" as const;
const COURSE_PATH = "/ki-fuehrerschein/kurs";

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
    title: "KI im Alltag verstehen: kostenloser KI-Kurs auf Deutsch",
    description:
      "Kostenloser KI-Grundlagenkurs mit 5 Blöcken, 18 Lektionen und ca. 1 Std. 40 Min. Lernzeit. Ein Lernkonto ist erforderlich.",
    graphName: "KI im Alltag: Was du wissen solltest",
    graphDescription:
      "Online-Grundlagenkurs zur KI-Kompetenz mit 5 Blöcken, 18 Lektionen und ca. 1 Std. 40 Min. Lernzeit.",
    audience: "Erwachsene ohne technische Vorkenntnisse",
  },
  en: {
    title: "Everyday AI Literacy: course reader",
    description:
      "Foundation course with 5 blocks, 18 lessons, and about 1 hour 40 minutes of study. A learning account is required.",
    graphName: "Everyday AI Literacy: what you need to know",
    graphDescription:
      "Online foundation course on practical AI literacy with 5 blocks, 18 lessons, and about 1 hour 40 minutes of study.",
    audience: "Adults without a technical background",
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
      courseWorkload: "PT1H40M",
      inLanguage: locale,
    },
  };
}

export default async function KursLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  return (
    <>
      <JsonLd data={courseGraph(locale)} id="ki-fuehrerschein-course-jsonld" />
      <div className="pb-12">{children}</div>
    </>
  );
}
