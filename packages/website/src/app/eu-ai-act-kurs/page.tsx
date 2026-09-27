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

const COURSE_SLUG = "eu-ai-act-kurs" as const;
const COURSE_PATH = "/eu-ai-act-kurs";

const LANDING_COPY = {
  de: {
    metadata: {
      title: "EU AI Act Kurs: Rollen, Risiken und Pflichten",
      description:
        "Kostenloser EU-AI-Act-Kurs mit 6 Blöcken und 24 Lektionen zu Rollen, Risikoklassen, Hochrisiko-Systemen, GPAI, Transparenz und Umsetzung.",
    },
    graph: {
      home: "Start",
      courseName: "EU AI Act Kurs: Rollen, Risiken und Pflichten",
      description:
        "Onlinekurs zu Geltungsbereich, Rollen, Risikoklassen, Hochrisiko-Systemen, GPAI, Transparenz und Umsetzung der Verordnung (EU) 2024/1689 in geänderter Fassung.",
      audience:
        "Erwachsene und beruflich Verantwortliche ohne juristische Vorkenntnisse",
      teaches: [
        "Rollen und Geltungsbereich der EU-KI-Verordnung einordnen",
        "Risikoklassen und einschlägige Pflichten unterscheiden",
        "Umsetzungsmaßnahmen dokumentiert priorisieren",
      ],
    },
    eyebrow: "EU AI Act Kurs · Grundlagen · kostenlos",
    heading: "Rollen, Risiken und",
    headingAccent: "Pflichten einordnen.",
    introduction:
      "Sie bestimmen für ein KI-Tool aus Ihrem Unternehmen die Risikoklasse, Ihre Rolle und Ihre Pflichten.",
    start: "Kurs mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageAlt:
      "Editoriale Prozessgrafik: Bildkarten durchlaufen Prüfstufen, farbige Risikoklassen und einen Abschlusscheck",
    imageLabel: "EU AI Act · 6 Blöcke · 24 Lektionen",
    facts: [
      "6 Blöcke",
      "24 Lektionen",
      "ca. 1 Std. 50 Min. Lernzeit",
      "Abschlussquiz mit 27 Fragen",
      "VO (EU) 2024/1689, Fassung seit 27.\u00a0Juli\u00a02026",
    ],
    legalHeading: "Was Artikel 4 verlangt",
    legalBody:
      "Artikel 4 gilt seit 2.\u00a0Februar\u00a02025. Anbieter und Betreiber von KI-Systemen müssen Maßnahmen treffen, die die KI-Kompetenz ihrer Beschäftigten und weiterer Personen unterstützen, die in ihrem Auftrag mit den Systemen arbeiten. Vorwissen, Erfahrung, Ausbildung, Nutzungskontext und betroffene Personengruppen sind zu berücksichtigen. Die seit 27.\u00a0Juli\u00a02026 geltende Fassung verlangt kein garantiertes individuelles Kompetenzniveau.",
    curriculumHeading: "Lehrplan",
    minutes: (count: number) => `${count} Min.`,
    audienceHeading: "Für wen",
    audience: [
      { title: "Blöcke 1 und 2: alle, die KI-Tools auswählen oder nutzen" },
      { title: "Ab Block 3: Datenschutz, IT, Compliance, Einkauf, Personal, Fachverantwortliche" },
      { title: "Ohne Programmier- oder Jura-Vorkenntnisse" },
    ],
    outcomes: [
      { title: "Ihre Rolle als Anbieter, Betreiber, Einführer oder Händler bestimmen" },
      { title: "Verbotene Praktiken, Hochrisiko-Systeme und Transparenzfälle unterscheiden" },
      { title: "Pflichten mit Zuständigen, Fristen, Rechtsstand und Quelle auflisten" },
    ],
    // The EU AI Act course addresses the reader with "Sie" (CONTENT_GUIDE).
    outcomesHeading: "Was Sie danach können",
    evidenceHeading: "Was der Teilnahmenachweis belegt",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokalen Abschlussquiz.",
      "Zeitabhängige Rechtsangaben im Kurs wurden zuletzt am 28.\u00a0Juli\u00a02026 geprüft.",
    ],
    disclaimerLabel: "Hinweis:",
    disclaimer:
      "Bildungsangebot, keine Rechtsberatung. Der Nachweis ist weder akkreditiert noch serverseitig signiert. Teilnahme oder Teilnahmenachweis allein belegen weder Kompetenz noch die Erfüllung von Artikel 4; Systeminventur, Rollenklärung, Risikoklassifizierung und organisationsbezogene Kontrollen bleiben erforderlich.",
    factsLabel: "Auf einen Blick",
    progressLabel: "Fortschritt im EU AI Act Kurs",
    lessonsLabel: "Lektionen",
    boundarySummary: "Rechtsstand, Nachweis und Haftungsgrenze",
    nextCourse: "Weiter zu AI-Native",
  },
  en: {
    metadata: {
      title: "EU AI Act Course: roles, risks, and duties",
      description:
        "Free EU AI Act course with 6 blocks and 24 lessons on roles, risk classification, high-risk systems, GPAI, transparency, and implementation.",
    },
    graph: {
      home: "Home",
      courseName: "EU AI Act Course: roles, risks, and duties",
      description:
        "Online course on scope, roles, risk classification, high-risk systems, GPAI, transparency, and implementation of Regulation (EU) 2024/1689 as amended.",
      audience:
        "Adults and workplace decision-makers without a legal background",
      teaches: [
        "Classify roles and scope under the EU AI Act",
        "Distinguish risk categories and applicable duties",
        "Prioritize implementation measures with traceable evidence",
      ],
    },
    eyebrow: "EU AI Act Course · Foundations · free",
    heading: "Map roles, risks,",
    headingAccent: "and duties.",
    introduction:
      "For one AI tool your company uses, you work out its risk class, your role and your duties.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageAlt:
      "Editorial process graphic showing image cards passing through review stages, colour-coded risk classes, and a final check",
    imageLabel: "EU AI Act · 6 blocks · 24 lessons",
    facts: [
      "6 blocks",
      "24 lessons",
      "About 1 hr 50 min of study",
      "Final quiz with 27 questions",
      "Reg. (EU) 2024/1689, version of 27\u00a0July\u00a02026",
    ],
    legalHeading: "What Article 4 requires",
    legalBody:
      "Article 4 has applied since 2 February 2025. Providers and deployers of AI systems must take measures that support the development of AI literacy among staff and other people who work with those systems on their behalf. Prior knowledge, experience, education, context of use, and affected groups must be considered. The version in force since 27 July 2026 does not require a guaranteed level of individual AI literacy.",
    curriculumHeading: "Course plan",
    minutes: (count: number) => `${count} min`,
    audienceHeading: "Who it is for",
    audience: [
      { title: "Blocks 1 and 2: anyone choosing or using AI tools" },
      { title: "From block 3: data protection, IT, compliance, procurement, HR, business owners" },
      { title: "No coding or legal background needed" },
    ],
    outcomes: [
      { title: "Identify your role as provider, deployer, importer or distributor" },
      { title: "Tell prohibited practices, high-risk systems and transparency cases apart" },
      { title: "List duties with owners, deadlines, legal status and source" },
    ],
    outcomesHeading: "What you can do afterwards",
    evidenceHeading: "What the completion record establishes",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "Time-dependent legal statements in the course were last reviewed on 28 July 2026.",
    ],
    disclaimerLabel: "Scope:",
    disclaimer:
      "Educational material, not legal advice. The record is neither accredited nor server-signed. Participation or a completion record alone establishes neither competence nor compliance with Article 4; a system inventory, role analysis, risk classification, and organization-specific controls remain necessary.",
    factsLabel: "At a glance",
    progressLabel: "EU AI Act Course progress",
    lessonsLabel: "lessons",
    boundarySummary: "Legal state, record, and liability boundary",
    nextCourse: "Continue to AI-Native",
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

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
      title: copy.metadata.title,
      description: copy.metadata.description,
      url: `${SITE_URL}${localizedPath}`,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: [locale === "en" ? "de_DE" : "en_GB"],
      images: [
        {
          url: `${SITE_URL}/course-covers/eu-ai-act-kurs-cover-v3.webp`,
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
          courseWorkload: "PT1H50M",
          inLanguage: locale,
        },
      },
    ],
  };
}

export default async function EuAiActKursLandingPage() {
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
      <JsonLd data={courseGraph(locale)} id="eu-ai-act-landing-jsonld" />
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

        <CourseLandingSection title={copy.outcomesHeading}>
          <CourseOutcomeList items={copy.outcomes} />
        </CourseLandingSection>

        <CourseLandingSection title={copy.audienceHeading}>
          <CourseOutcomeList items={copy.audience} />
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
          <CourseNextLink href={localizeHref("/ai-native", locale)}>
            {copy.nextCourse}
          </CourseNextLink>
        </CourseLandingSection>

        <CourseBoundaryDetails summary={copy.boundarySummary}>
          <CourseBoundaryColumn title={copy.legalHeading}>
            <p>{copy.legalBody}</p>
          </CourseBoundaryColumn>
          <CourseBoundaryColumn title={copy.evidenceHeading}>
            <CourseNoteList items={copy.evidence} />
            <p className="mt-3">
              <strong className="font-semibold text-foreground">
                {copy.disclaimerLabel}
              </strong>{" "}
              {copy.disclaimer}
            </p>
          </CourseBoundaryColumn>
        </CourseBoundaryDetails>
      </TechnicalCourseFrame>
    </>
  );
}
