import type { Metadata } from "next";
import Link from "next/link";
import {
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
} from "@/components/course/technical-course-landing";
import {
  CourseBlockLedger,
  CourseBoundaryColumn,
  CourseBoundaryDetails,
  CourseLandingSection,
  CourseNextLink,
  CourseNoteList,
  CourseOutcomeList,
} from "@/components/course/course-landing-sections";
import { TechnicalCourseProgressBar } from "@/components/course/technical-course-progress";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getBlocks, getTotalLessonCount } from "@/lib/course/data";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";

const COURSE_SLUG = "ki-und-gesellschaft" as const;
const COURSE_PATH = "/ki-und-gesellschaft";

interface LandingCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
    readonly openGraphTitle: string;
    readonly openGraphDescription: string;
  };
  readonly graph: {
    readonly home: string;
    readonly courseName: string;
    readonly description: string;
    readonly audience: string;
    readonly teaches: readonly string[];
  };
  readonly eyebrow: string;
  readonly heading: string;
  readonly headingAccent: string;
  readonly introduction: string;
  readonly start: string;
  readonly allCourses: string;
  readonly imageLabel: string;
  readonly facts: readonly string[];
  readonly whyHeading: string;
  readonly curriculumHeading: string;
  readonly minutes: (count: number) => string;
  readonly methods: readonly {
    readonly number: string;
    readonly title: string;
    readonly body: string;
  }[];
  readonly evidenceHeading: string;
  readonly evidence: readonly string[];
  readonly factsLabel: string;
  readonly progressLabel: string;
  readonly lessonsLabel: string;
  readonly boundarySummary: string;
  readonly nextCourse: string;
}

const LANDING_COPY: Readonly<Record<Locale, LandingCopy>> = {
  de: {
    metadata: {
      title: "KI und Gesellschaft: Jobzahlen, Fakes und Fairness prüfen",
      description:
        "Kostenloser Kurs mit 3 Modulen, 8 Lektionen mit Übung und 40 Minuten Lernzeit. Jobschlagzeilen entschlüsseln, virale Videos prüfen, Fairness messen.",
      openGraphTitle: "KI und Gesellschaft: Zahlen, Fakes, Fairness prüfen",
      openGraphDescription:
        "Jobschlagzeilen entschlüsseln, Detektoralarme nachrechnen, Fairness-Maße vergleichen. 3 Module, 8 Lektionen mit Übung, 40 Minuten.",
    },
    graph: {
      home: "Start",
      courseName: "KI und Gesellschaft: Jobzahlen, Fakes und Fairness prüfen",
      description:
        "Onlinekurs mit Übungen zu Jobzahlen, synthetischen Medien und Fairness in datenbasierten Entscheidungen.",
      audience: "Erwachsene ohne technische Vorkenntnisse",
      teaches: [
        "Jobschlagzeilen nach Exposition, Potenzial, Prognose und gemessener Wirkung unterscheiden",
        "Virale Videos auf Herkunft und Kontext prüfen und Detektorwerte nachrechnen",
        "Fehlerraten je Gruppe lesen und den Zielkonflikt zwischen Fairness-Maßen erklären",
      ],
    },
    eyebrow: "KI und Gesellschaft · Grundlagenkurs · kostenlos",
    heading: "Zahlen, Fakes,",
    headingAccent: "Fairness prüfen.",
    introduction:
      "Du entschlüsselst Jobschlagzeilen, prüfst ein virales Video auf Herkunft, rechnest nach, was ein Detektoralarm wert ist, und erlebst im Labor, warum zwei Fairness-Maße nicht zugleich gelten können. Technikwissen brauchst du nicht.",
    start: "Mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageLabel: "3 Module · 8 Lektionen",
    facts: [
      "3 Module, 8 Lektionen mit Übung",
      "40 Min. Lernzeit",
      "Lernnachweis als PDF",
    ],
    whyHeading: "Was du danach kannst",
    curriculumHeading: "Lehrplan",
    minutes: (count) => `${count} Min.`,
    methods: [
      {
        number: "01",
        title: "Jede „X % der Jobs“-Schlagzeile richtig lesen",
        body: "Exposition, technisches Potenzial, Prognose und gemessene Wirkung auseinanderhalten.",
      },
      {
        number: "02",
        title: "Einen viralen Clip in fünf Schritten prüfen",
        body: "Herkunft vor Optik, Detektorwerte mit der Grundrate nachrechnen, dann richtig melden.",
      },
      {
        number: "03",
        title: "Erklären, warum zwei Fairness-Maße nicht zugleich gelten",
        body: "Fehler je Gruppe verlangen, den Zielkonflikt benennen und Verantwortung zuordnen.",
      },
    ],
    evidenceHeading: "Was der Lernnachweis festhält",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokal durchgeführten Abschlussquiz.",
      "Er ist nicht akkreditiert, nicht servergeprüft und keine amtliche oder berufliche Qualifikation.",
      "Quellen und zeitabhängige Aussagen werden in den einzelnen Lektionen ausgewiesen.",
      "Der Kurs ersetzt keine Rechtsberatung und keine Prüfung eines konkreten Beschäftigungs- oder Diskriminierungsfalls.",
    ],
    factsLabel: "Auf einen Blick",
    progressLabel: "Fortschritt in KI und Gesellschaft",
    lessonsLabel: "Lektionen",
    boundarySummary: "Aussagekraft, Quellen und Grenzen",
    nextCourse: "Weiter zum EU AI Act",
  },
  en: {
    metadata: {
      title: "AI and Society: check jobs figures, fakes, and fairness",
      description:
        "Free course with 3 modules, 8 hands-on lessons, and 40 minutes of study. Decode jobs headlines, verify viral videos, measure fairness.",
      openGraphTitle: "AI and Society: check numbers, fakes, and fairness",
      openGraphDescription:
        "Decode jobs headlines, work out detector alerts, compare fairness measures. 3 modules, 8 hands-on lessons, 40 minutes.",
    },
    graph: {
      home: "Home",
      courseName: "AI and Society: check jobs figures, fakes, and fairness",
      description:
        "Hands-on online course on jobs figures, synthetic media, and fairness in data-supported decisions.",
      audience: "Adults without a technical background",
      teaches: [
        "Tell exposure, potential, forecasts and measured effects apart in jobs headlines",
        "Verify viral videos by provenance and context and work out what detector scores mean",
        "Read error rates per group and explain the trade-off between fairness measures",
      ],
    },
    eyebrow: "AI and Society · Foundation course · free",
    heading: "Check numbers, fakes,",
    headingAccent: "and fairness.",
    introduction:
      "You decode jobs headlines, verify a viral video's origin, work out what a detector alert is worth and see in a lab why two fairness measures cannot both hold. No technical background needed.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageLabel: "3 modules · 8 lessons",
    facts: [
      "3 modules, 8 hands-on lessons",
      "40 min of study",
      "Completion record as a PDF",
    ],
    whyHeading: "What you can do afterwards",
    curriculumHeading: "Course plan",
    minutes: (count) => `${count} min`,
    methods: [
      {
        number: "01",
        title: "Read any “X% of jobs” headline correctly",
        body: "Tell exposure, technical potential, forecasts and measured effects apart.",
      },
      {
        number: "02",
        title: "Verify a viral clip in five steps",
        body: "Provenance before looks, detector scores checked against the base rate, then report correctly.",
      },
      {
        number: "03",
        title: "Explain why two fairness measures cannot both hold",
        body: "Ask for errors per group, name the trade-off and assign accountability.",
      },
    ],
    evidenceHeading: "What the completion record establishes",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "It is not accredited, server-verified, or an official or professional qualification.",
      "Sources and time-dependent claims are identified in the individual lessons.",
      "The course is not legal advice and does not assess a specific employment or discrimination case.",
    ],
    factsLabel: "At a glance",
    progressLabel: "AI and Society course progress",
    lessonsLabel: "lessons",
    boundarySummary: "Evidence, sources, and limits",
    nextCourse: "Continue to the EU AI Act",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const localizedPath = localizeHref(COURSE_PATH, locale);
  const alternates = buildLocaleAlternates(COURSE_PATH, ["de", "en"]);

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.metadata.openGraphTitle,
      description: copy.metadata.openGraphDescription,
      url: `${SITE_URL}${localizedPath}`,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: [locale === "en" ? "de_DE" : "en_GB"],
      // The share image is this route's opengraph-image.tsx (the Lemons card, SPEC §3.15).
    },
  };
}

function courseGraph(locale: Locale) {
  const copy = LANDING_COPY[locale].graph;
  const localizedPath = localizeHref(COURSE_PATH, locale);
  const localizedHome = localizeHref("/", locale);
  const pageUrl = `${SITE_URL}${localizedPath}`;

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
            item: `${SITE_URL}${localizedHome === "/" ? "" : localizedHome}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.courseName,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "Course",
        "@id": `${pageUrl}#course`,
        url: pageUrl,
        name: copy.courseName,
        description: copy.description,
        provider: { "@id": ORG_ID },
        inLanguage: locale,
        isAccessibleForFree: true,
        educationalLevel: "Beginner",
        teaches: copy.teaches,
        audience: {
          "@type": "EducationalAudience",
          educationalRole: "student",
          audienceType: copy.audience,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT40M",
          inLanguage: locale,
        },
      },
    ],
  };
}

export default async function KiUndGesellschaftLandingPage() {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const blocks = getBlocks(COURSE_SLUG, locale);
  const totalLessons = getTotalLessonCount(COURSE_SLUG, locale);
  const courseHref = localizeHref(`${COURSE_PATH}/kurs`, locale);

  return (
    <>
      <JsonLd
        data={courseGraph(locale)}
        id="ki-und-gesellschaft-landing-jsonld"
      />
      <TechnicalCourseFrame courseId={COURSE_SLUG} lang={locale}>
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={`${copy.heading} ${copy.headingAccent}`}
          intro={copy.introduction}
          primaryAction={
            <Link
              href={courseHref}
              prefetch={false}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            >
              {copy.start} <span aria-hidden="true">→</span>
            </Link>
          }
          facts={copy.facts}
          factsLabel={copy.factsLabel}
          progress={
            <TechnicalCourseProgressBar
              courseSlug={COURSE_SLUG}
              totalLessons={totalLessons}
              label={copy.progressLabel}
              unitLabel={copy.lessonsLabel}
            />
          }
        />

        <CourseLandingSection title={copy.whyHeading}>
          <CourseOutcomeList
            items={copy.methods.map((method) => ({
              title: method.title,
              detail: method.body,
            }))}
          />
        </CourseLandingSection>

        <CourseLandingSection title={copy.curriculumHeading}>
          <CourseBlockLedger
            rows={blocks.map((block, index) => ({
              id: block.id,
              number: String(index + 1).padStart(2, "0"),
              title: block.title,
              description: block.description,
              meta: `${block.lessons.length} ${copy.lessonsLabel} · ${copy.minutes(block.durationMinutes)}`,
            }))}
          />
          <CourseNextLink href={localizeHref("/eu-ai-act-kurs", locale)}>
            {copy.nextCourse}
          </CourseNextLink>
        </CourseLandingSection>

        <CourseBoundaryDetails summary={copy.boundarySummary}>
          <CourseBoundaryColumn
            title={copy.evidenceHeading}
            className="lg:col-span-2"
          >
            <CourseNoteList items={copy.evidence} />
          </CourseBoundaryColumn>
        </CourseBoundaryDetails>
      </TechnicalCourseFrame>
    </>
  );
}
