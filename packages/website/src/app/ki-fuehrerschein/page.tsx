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
  readonly imageAlt: string;
  readonly start: string;
  readonly facts: readonly string[];
  readonly factsLabel: string;
  readonly outcomesHeading: string;
  readonly outcomes: readonly CourseOutcome[];
  readonly curriculumHeading: string;
  readonly curriculumCaption: (blocks: number, minutes: string) => string;
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
    eyebrow: "KI-Führerschein · Grundlagenkurs · kostenlos",
    heading: "KI im Alltag:",
    headingAccent: "Was du wissen solltest.",
    introduction:
      "Du lernst, wo dir KI im Alltag und bei der Arbeit begegnet, welche Daten nicht in ein KI-Tool gehören und wie du eine Antwort prüfst, bevor sie in eine Mail oder einen Bericht geht. Technische Vorkenntnisse brauchst du nicht.",
    imageAlt:
      "Editoriale Collage eines KI-Prüfpasses mit Lernkarten, Datenschutz und Prüfschritten",
    start: "Kostenlos mit Lernkonto starten",
    facts: [
      "5 Blöcke, 18 Lektionen",
      "ca. 1 Std. 40 Min. Lernzeit",
      "Kostenlos, mit Lernkonto",
      "Teilnahmebestätigung als PDF",
    ],
    factsLabel: "Auf einen Blick",
    outcomesHeading: "Was du danach kannst",
    outcomes: [
      {
        title: "Daten einordnen, bevor du sie in ein KI-Tool gibst",
        detail: "Vier Stufen von öffentlich bis vertraulich, mit Beispielen aus dem Büro.",
      },
      {
        title: "Eine Mail, ein Protokoll, eine Auswertung und einen Bericht mit KI entwerfen",
        detail: "Das sind die vier Übungen aus Block 3.",
      },
      {
        title: "Eine KI-Antwort prüfen, bevor sie weitergeht",
        detail: "Quelle suchen, gegenprüfen und erfundene Angaben erkennen.",
      },
      {
        title: "Klären, wer entscheidet, wenn ein Ergebnis Folgen hat",
        detail: "Block 5 zeigt, wie im Team eine KI-Nutzungsrichtlinie entsteht.",
      },
    ],
    curriculumHeading: "Lehrplan",
    curriculumCaption: (blocks, minutes) => `${blocks} Blöcke · ca. ${minutes}`,
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
    eyebrow: "Everyday AI Literacy · Foundation course · free",
    heading: "AI at work:",
    headingAccent: "what you need to know.",
    introduction:
      "Learn where AI shows up in daily life and at work, which data must stay out of an AI tool, and how to check an answer before it goes into an email or a report. No technical background required.",
    imageAlt:
      "Editorial collage of an AI review passport with learning cards, data protection, and verification steps",
    start: "Start with a free learning account",
    facts: [
      "5 blocks, 18 lessons",
      "About 1 hr 40 min of study",
      "Free, with a learning account",
      "Completion record as a PDF",
    ],
    factsLabel: "At a glance",
    outcomesHeading: "What you can do afterwards",
    outcomes: [
      {
        title: "Classify data before it goes into an AI tool",
        detail: "Four levels from public to confidential, with office examples.",
      },
      {
        title: "Draft an email, meeting minutes, a small analysis and a report with AI",
        detail: "These are the four exercises in block 3.",
      },
      {
        title: "Check an AI answer before you pass it on",
        detail: "Find the source, cross-check it and spot invented details.",
      },
      {
        title: "Settle who decides when a result has consequences",
        detail: "Block 5 shows how a team writes an AI usage policy.",
      },
    ],
    curriculumHeading: "Course plan",
    curriculumCaption: (blocks, minutes) => `${blocks} blocks · about ${minutes}`,
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
      images: [
        {
          url: `${SITE_URL}/course-covers/ki-fuehrerschein-cover-v3.webp`,
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
 * The clause after the colon is an inline-block: it starts a new line as a
 * whole, so the question word ("Was") never hangs at the end of line one, and
 * it still wraps inside itself on a phone. Plain spaces keep the accessible
 * name identical to the copy.
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
      {lead} <span className="inline-block">{accent}</span>
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

  const totalMinutes = blocks.reduce(
    (sum, block) => sum + block.durationMinutes,
    0,
  );

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

        <CourseLandingSection
          title={copy.curriculumHeading}
          caption={copy.curriculumCaption(
            blocks.length,
            formatCourseMinutes(totalMinutes, locale),
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
