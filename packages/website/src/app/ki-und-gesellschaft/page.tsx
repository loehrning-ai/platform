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
  formatCourseMinutes,
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
  readonly imageAlt: string;
  readonly imageLabel: string;
  readonly facts: readonly string[];
  readonly whyHeading: string;
  readonly whyBody: string;
  readonly curriculumHeading: string;
  readonly curriculumCaption: (blocks: number, minutes: string) => string;
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
      title: "KI und Gesellschaft: Arbeit, Deepfakes und Bias einordnen",
      description:
        "Kostenloser Kurs mit 3 Blöcken, 9 Lektionen und 46 Minuten Lernzeit. Prüfe Aussagen über Arbeit, synthetische Medien und algorithmischen Bias.",
      openGraphTitle: "KI und Gesellschaft: drei Fragen, drei Prüfraster",
      openGraphDescription:
        "Arbeit, Deepfakes und Bias nachvollziehbar einordnen. 3 Blöcke, 9 Lektionen, 46 Minuten.",
    },
    graph: {
      home: "Start",
      courseName: "KI und Gesellschaft: Arbeit, Deepfakes und Bias",
      description:
        "Onlinekurs zur Einordnung von KI und Arbeit, synthetischen Medien sowie Bias in datenbasierten Entscheidungen.",
      audience: "Erwachsene ohne technische Vorkenntnisse",
      teaches: [
        "Aussagen über Automatisierung und Berufsrisiken prüfen",
        "Deepfakes mit Quellen- und Kontextprüfungen einordnen",
        "Bias in Daten, Modellen und Entscheidungen erkennen",
      ],
    },
    eyebrow: "KI und Gesellschaft · Grundlagenkurs · kostenlos",
    heading: "Arbeit, Deepfakes",
    headingAccent: "und Bias einordnen.",
    introduction:
      "Du führst eine Schlagzeile über KI und Jobs auf ihre Datenbasis zurück, prüfst ein verdächtiges Video, bevor du es teilst, und findest die Stelle, an der Bias in eine automatisierte Entscheidung gelangt. Technikwissen brauchst du nicht.",
    start: "Mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageAlt:
      "Editoriale Berlin-Collage mit Menschen, synthetischen Porträts, Datenrastern und einem Prüfentscheid",
    imageLabel: "3 Blöcke · 9 Lektionen",
    facts: [
      "3 Blöcke, 9 Lektionen",
      "46 Min. Lernzeit",
      "Kostenlos, mit Lernkonto",
      "Lernnachweis als PDF",
    ],
    whyHeading: "Was du prüfst",
    whyBody:
      "Prognosen zum Arbeitsmarkt, die Echtheit eines Videos und die Fairness einer automatisierten Entscheidung lassen sich nicht mit derselben Checkliste bewerten. Der Kurs ordnet für jedes Thema die relevante Datenbasis, typische Fehlschlüsse und konkrete Prüfschritte. Quellen und Prüfstände stehen direkt in den Lektionen.",
    curriculumHeading: "Lehrplan",
    curriculumCaption: (blocks, minutes) => `${blocks} Blöcke · ${minutes}`,
    minutes: (count) => `${count} Min.`,
    methods: [
      {
        number: "01",
        title: "Arbeit",
        body: "Aufgaben, Berufsprofile, Datenbasis und betrachteten Zeitraum getrennt bewerten.",
      },
      {
        number: "02",
        title: "Medien",
        body: "Quelle, Veröffentlichungskontext, technische Auffälligkeiten und Gegenprüfung dokumentieren.",
      },
      {
        number: "03",
        title: "Entscheidungen",
        body: "Trainingsdaten, Zielgröße, Fehlerfolgen, Verantwortliche und Beschwerdeweg prüfen.",
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
      title: "AI and Society: assess work, deepfakes, and bias",
      description:
        "Free course with 3 blocks, 9 lessons, and 46 minutes of study. Assess claims about work, synthetic media, and algorithmic bias.",
      openGraphTitle: "AI and Society: three questions, three review methods",
      openGraphDescription:
        "Assess work, deepfakes, and bias with traceable checks. 3 blocks, 9 lessons, 46 minutes.",
    },
    graph: {
      home: "Home",
      courseName: "AI and Society: work, deepfakes, and bias",
      description:
        "Online course on assessing AI and work, synthetic media, and bias in data-supported decisions.",
      audience: "Adults without a technical background",
      teaches: [
        "Assess claims about automation and occupational risk",
        "Evaluate deepfakes with source and context checks",
        "Identify bias in data, models, and decisions",
      ],
    },
    eyebrow: "AI and Society · Foundation course · free",
    heading: "Assess work, deepfakes,",
    headingAccent: "and bias.",
    introduction:
      "You trace a headline about AI and jobs back to its data, check a suspicious video before you share it, and find the point where bias enters an automated decision. No technical background needed.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageAlt:
      "Editorial Berlin collage with people, synthetic portraits, data grids, and a review decision",
    imageLabel: "3 blocks · 9 lessons",
    facts: [
      "3 blocks, 9 lessons",
      "46 min of study",
      "Free, with a learning account",
      "Completion record as a PDF",
    ],
    whyHeading: "What you check",
    whyBody:
      "A labour-market forecast, the authenticity of a video, and the fairness of an automated decision cannot be assessed with one checklist. For each topic, the course identifies the relevant evidence, common reasoning errors, and concrete review steps. Sources and review dates appear in the lessons.",
    curriculumHeading: "Course plan",
    curriculumCaption: (blocks, minutes) => `${blocks} blocks · ${minutes}`,
    minutes: (count) => `${count} min`,
    methods: [
      {
        number: "01",
        title: "Work",
        body: "Assess tasks, occupations, the evidence base, and the time period separately.",
      },
      {
        number: "02",
        title: "Media",
        body: "Document the source, publication context, technical anomalies, and independent checks.",
      },
      {
        number: "03",
        title: "Decisions",
        body: "Check training data, the target measure, error costs, accountable owners, and the appeal route.",
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
      images: [
        {
          url: `${SITE_URL}/course-covers/ki-und-gesellschaft-cover-v3.webp`,
          width: 1440,
          height: 630,
          alt: copy.imageAlt,
        },
      ],
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
          courseWorkload: "PT46M",
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

        <CourseLandingSection title={copy.whyHeading} intro={copy.whyBody}>
          <CourseOutcomeList
            items={copy.methods.map((method) => ({
              title: method.title,
              detail: method.body,
            }))}
          />
        </CourseLandingSection>

        <CourseLandingSection
          title={copy.curriculumHeading}
          caption={copy.curriculumCaption(
            blocks.length,
            formatCourseMinutes(
              blocks.reduce((sum, block) => sum + block.durationMinutes, 0),
              locale,
            ),
          )}
        >
          <CourseBlockLedger
            rows={blocks.map((block, index) => ({
              id: block.id,
              number: String(index + 1).padStart(2, "0"),
              title: block.title,
              description: block.description,
              meta: `${block.lessons.length} ${copy.lessonsLabel} · ${copy.minutes(block.durationMinutes)}`,
            }))}
          />
        </CourseLandingSection>

        <CourseBoundaryDetails summary={copy.boundarySummary}>
          <CourseBoundaryColumn
            title={copy.evidenceHeading}
            className="lg:col-span-2"
          >
            <CourseNoteList items={copy.evidence} />
          </CourseBoundaryColumn>
        </CourseBoundaryDetails>

        <CourseNextLink href={localizeHref("/eu-ai-act-kurs", locale)}>
          {copy.nextCourse}
        </CourseNextLink>
      </TechnicalCourseFrame>
    </>
  );
}
