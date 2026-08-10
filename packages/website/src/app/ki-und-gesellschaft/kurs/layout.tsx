import type { Metadata } from "next";
import type { ReactNode } from "react";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { ReadingProgressBar } from "@/components/progress/reading-progress-bar";
import { LernbegleiterStrip } from "@/components/learning/lernbegleiter-strip";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import { localizeHref, type Locale } from "@/lib/i18n/locale";

const COURSE_SLUG = "ki-und-gesellschaft" as const;
const COURSE_PATH = "/ki-und-gesellschaft/kurs";

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
    title: "KI und Gesellschaft: Arbeit, Deepfakes und Bias",
    description:
      "Kostenloser Kurs mit 3 Blöcken, 9 Lektionen und 46 Minuten Lernzeit. Ein Lernkonto ist erforderlich.",
    graphName: "KI und Gesellschaft: Arbeit, Deepfakes und Bias",
    graphDescription:
      "Onlinekurs zur Einordnung von Arbeit, synthetischen Medien und Bias in datenbasierten Entscheidungen.",
    audience: "Erwachsene ohne technische Vorkenntnisse",
  },
  en: {
    title: "AI and Society: work, deepfakes, and bias",
    description:
      "Free course with 3 blocks, 9 lessons, and 46 minutes of study. A learning account is required.",
    graphName: "AI and Society: work, deepfakes, and bias",
    graphDescription:
      "Online course on assessing work, synthetic media, and bias in data-supported decisions.",
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
      courseWorkload: "PT46M",
      inLanguage: locale,
    },
  };
}

export default async function KursLayout({ children }: { children: ReactNode }) {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  return (
    <>
      <JsonLd
        data={courseGraph(locale)}
        id="ki-und-gesellschaft-course-jsonld"
      />
      <ReadingProgressBar />
      <div className="pb-16">{children}</div>
      <LernbegleiterStrip locale={locale} />
    </>
  );
}
