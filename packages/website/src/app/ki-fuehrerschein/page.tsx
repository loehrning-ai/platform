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
  type CourseOutcome,
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

const COURSE_SLUG = "ki-fuehrerschein" as const;
const COURSE_PATH = "/ki-fuehrerschein";

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
  };
  readonly eyebrow: string;
  readonly heading: string;
  readonly headingAccent: string;
  readonly introduction: string;
  readonly start: string;
  readonly facts: readonly string[];
  readonly factsLabel: string;
  readonly outcomesHeading: string;
  readonly outcomes: readonly CourseOutcome[];
  readonly curriculumHeading: string;
  readonly minutes: (count: number) => string;
  readonly legalHeading: string;
  readonly whyBody: string;
  readonly evidenceHeading: string;
  readonly evidence: readonly string[];
  readonly progressLabel: string;
  readonly lessonsLabel: string;
  readonly boundarySummary: string;
  readonly related: string;
}

const LANDING_COPY: Readonly<Record<Locale, LandingCopy>> = {
  de: {
    metadata: {
      title: "KI im Alltag verstehen: kostenloser KI-Kurs auf Deutsch",
      description:
        "Kostenloser KI-Grundlagenkurs mit 5 Blöcken, 18 Lektionen und ca. 1 Std. 40 Min. Lernzeit. Für Erwachsene ohne Vorkenntnisse.",
      openGraphTitle: "KI im Alltag: Was du wissen solltest",
      openGraphDescription:
        "5 Blöcke, 18 Lektionen, ca. 1 Std. 40 Min. Mit Lernkonto und lokal erzeugter Teilnahmebestätigung.",
    },
    graph: {
      home: "Start",
      courseName: "KI im Alltag: Was du wissen solltest",
      description:
        "Kostenloser Online-Grundlagenkurs zur KI-Kompetenz mit 5 Blöcken, 18 Lektionen und ca. 1 Std. 40 Min. Lernzeit.",
      audience: "Erwachsene ohne technische Vorkenntnisse",
    },
    eyebrow: "KI-Führerschein · Grundlagenkurs",
    heading: "Welche Daten",
    headingAccent: "ins KI-Tool dürfen.",
    introduction:
      "Und wie du eine KI-Antwort prüfst, bevor sie weitergeht. Ohne technische Vorkenntnisse.",
    start: "Kostenlos mit Lernkonto starten",
    facts: [
      "5 Blöcke, 18 Lektionen",
      "ca. 1 Std. 40 Min. Lernzeit",
      "Teilnahmebestätigung als PDF",
    ],
    factsLabel: "Auf einen Blick",
    outcomesHeading: "Was du danach kannst",
    outcomes: [
      { title: "Daten in vier Stufen einordnen, bevor sie ins Tool gehen" },
      { title: "Mails, Protokolle, Auswertungen und Berichte mit KI entwerfen" },
      { title: "Eine KI-Antwort gegen die Quelle prüfen und Erfundenes erkennen" },
      { title: "Festlegen, wer bei folgenreichen Ergebnissen entscheidet" },
    ],
    curriculumHeading: "Lehrplan",
    minutes: (count) => `${count} Min.`,
    legalHeading: "Rechtsgrundlage",
    whyBody:
      "Artikel 4 der EU-KI-Verordnung gilt seit dem 2.\u00a0Februar\u00a02025. In der seit 27.\u00a0Juli\u00a02026 geltenden Fassung müssen Anbieter und Betreiber kontextbezogene Maßnahmen treffen, die die Entwicklung der KI-Kompetenz unterstützen; Vorwissen, Rolle, Einsatzkontext und betroffene Personen zählen. Vorgeschrieben ist weder ein einheitliches Kursformat noch ein Zertifikat. Dieser Kurs kann solche Maßnahmen ergänzen, belegt aber keine organisationsweite Compliance.",
    evidenceHeading: "Was die Teilnahmebestätigung belegt",
    evidence: [
      "Die lokal erzeugte PDF dokumentiert den Abschluss dieses Kurses; sie ist kein Rechts-, Compliance- oder unabhängiger Kompetenznachweis.",
      "Für Hochrisiko-Systeme bleiben Systeminventar, Risikoklassifizierung und organisationsbezogene Kontrollen erforderlich.",
    ],
    progressLabel: "Fortschritt im KI-Führerschein",
    lessonsLabel: "Lektionen",
    boundarySummary: "Rechtsgrundlage und Aussagekraft",
    related: "EU AI Act vertiefen",
  },
  en: {
    metadata: {
      title: "Everyday AI Literacy: free foundation course",
      description:
        "Free foundation course with 5 blocks, 18 lessons, and about 1 hour 40 minutes of study. No technical background required.",
      openGraphTitle: "Everyday AI Literacy: what you need to know",
      openGraphDescription:
        "5 blocks, 18 lessons, about 1 hour 40 minutes. Includes a learning account and a locally generated certificate of participation.",
    },
    graph: {
      home: "Home",
      courseName: "Everyday AI Literacy: what you need to know",
      description:
        "Free online foundation course on practical AI literacy with 5 blocks, 18 lessons, and about 1 hour 40 minutes of study.",
      audience: "Adults without a technical background",
    },
    eyebrow: "Everyday AI Literacy · Foundation course",
    heading: "Which data may go",
    headingAccent: "into an AI tool.",
    introduction:
      "And how to check an AI answer before you pass it on. No technical background needed.",
    start: "Start with a free learning account",
    facts: [
      "5 blocks, 18 lessons",
      "About 1 hr 40 min of study",
      "Completion record as a PDF",
    ],
    factsLabel: "At a glance",
    outcomesHeading: "What you can do afterwards",
    outcomes: [
      { title: "Sort data into four levels before it enters a tool" },
      { title: "Draft emails, minutes, analyses and reports with AI" },
      { title: "Check an AI answer against its source and spot invented details" },
      { title: "Decide who signs off on high-stakes results" },
    ],
    curriculumHeading: "Course plan",
    minutes: (count) => `${count} min`,
    legalHeading: "Legal basis",
    whyBody:
      "Article 4 of the EU AI Act has applied since 2 February 2025. Under the version in force since 27 July 2026, providers and deployers must support context-specific AI-literacy measures; prior knowledge, role, use context, and affected people matter. It prescribes neither one course format nor a certificate. This course can support those measures; it does not establish organization-wide compliance.",
    evidenceHeading: "What the completion record proves",
    evidence: [
      "The locally generated PDF records completion of this course; it is not legal, compliance, or independent competence evidence.",
      "High-risk systems still require an inventory, risk classification, and organization-specific controls.",
    ],
    progressLabel: "Everyday AI Literacy progress",
    lessonsLabel: "lessons",
    boundarySummary: "Legal basis and scope of the record",
    related: "Study the EU AI Act in depth",
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
      },
    ],
  };
}

/**
 * From sm the clause after the colon is an inline-block: it starts a new line
 * as a whole, so the question word ("Was") never hangs at the end of line one.
 * On a phone that block cannot fit one line anyway and wrapped inside itself,
 * which cost the H1 a third line; there it flows inline and the H1 takes two.
 * Plain spaces keep the accessible name identical to the copy.
 */
function KfHeading({
  lead,
  accent,
}: {
  readonly lead: string;
  readonly accent: string;
}) {
  return (
    <>
      {lead} <span className="sm:inline-block">{accent}</span>
    </>
  );
}

export default async function KiFuehrerscheinLandingPage() {
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
      <JsonLd data={courseGraph(locale)} id="ki-fuehrerschein-landing-jsonld" />
      <TechnicalCourseFrame courseId={COURSE_SLUG} lang={locale}>
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={<KfHeading lead={copy.heading} accent={copy.headingAccent} />}
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

        <CourseLandingSection title={copy.outcomesHeading}>
          <CourseOutcomeList items={copy.outcomes} />
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
            {copy.related}
          </CourseNextLink>
        </CourseLandingSection>

        <CourseBoundaryDetails summary={copy.boundarySummary}>
          <CourseBoundaryColumn title={copy.legalHeading}>
            <p>{copy.whyBody}</p>
          </CourseBoundaryColumn>
          <CourseBoundaryColumn title={copy.evidenceHeading}>
            <CourseNoteList items={copy.evidence} />
          </CourseBoundaryColumn>
        </CourseBoundaryDetails>
      </TechnicalCourseFrame>
    </>
  );
}
