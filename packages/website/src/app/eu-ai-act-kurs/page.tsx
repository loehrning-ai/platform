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
        "Kostenloser EU-AI-Act-Kurs: 5 Module, 10 Lektionen mit Übung, ca. 1 Std. Rolle bestimmen, Risikoklasse einordnen, Pflichtenliste erzeugen, Bußgeldrahmen rechnen.",
    },
    graph: {
      home: "Start",
      courseName: "EU AI Act Kurs: Rollen, Risiken und Pflichten",
      description:
        "Onlinekurs mit Übungen zu Rolle, Stichtagen, Risikoklasse, Pflichten, Kennzeichnung, Bußgeldern und Umsetzung der Verordnung (EU) 2024/1689 in geänderter Fassung.",
      audience:
        "Erwachsene und beruflich Verantwortliche ohne juristische Vorkenntnisse",
      teaches: [
        "Rolle und Stichtage nach der EU-KI-Verordnung bestimmen",
        "Anwendungsfälle einer Risikoklasse zuordnen und Pflichten ableiten",
        "Bußgeldrahmen einschätzen und einen KI-Inventareintrag erstellen",
      ],
    },
    eyebrow: "EU AI Act Kurs · Grundlagen · kostenlos",
    heading: "Rollen, Risiken und",
    headingAccent: "Pflichten einordnen.",
    introduction:
      "Sie bestimmen für ein KI-Tool aus Ihrem Unternehmen die Risikoklasse, Ihre Rolle und Ihre Pflichten.",
    start: "Kurs mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageLabel: "EU AI Act · 5 Module · 10 Lektionen",
    facts: [
      "5 Module",
      "10 Lektionen mit Übung",
      "ca. 1 Std. Lernzeit",
      "Abschlussquiz mit 20 Fragen",
      "VO (EU) 2024/1689, Fassung seit 27.\u00a0Juli\u00a02026",
    ],
    legalHeading: "Was Artikel 4 verlangt",
    legalBody:
      "Artikel 4 gilt seit 2.\u00a0Februar\u00a02025. Anbieter und Betreiber von KI-Systemen müssen Maßnahmen treffen, die die KI-Kompetenz ihrer Beschäftigten und weiterer Personen unterstützen, die in ihrem Auftrag mit den Systemen arbeiten. Vorwissen, Erfahrung, Ausbildung, Nutzungskontext und betroffene Personengruppen sind zu berücksichtigen. Die seit 27.\u00a0Juli\u00a02026 geltende Fassung verlangt kein garantiertes individuelles Kompetenzniveau.",
    curriculumHeading: "Lehrplan",
    minutes: (count: number) => `${count} Min.`,
    audienceHeading: "Für wen",
    audience: [
      { title: "Module 1 und 2: alle, die KI-Tools auswählen oder nutzen" },
      { title: "Ab Modul 3: Datenschutz, IT, Compliance, Einkauf, Personal, Fachverantwortliche" },
      { title: "Ohne Programmier- oder Jura-Vorkenntnisse" },
    ],
    outcomes: [
      { title: "Ihre Rolle bestimmen, auch wenn sie durch eigene Marke oder Änderung kippt" },
      { title: "Einen Anwendungsfall in sechs Fragen einer Risikoklasse zuordnen" },
      { title: "Ihre Pflichtenliste mit Artikeln und Stichtag erzeugen" },
      { title: "Den Bußgeldrahmen nach Art. 99 einschätzen" },
      { title: "Mit einem KI-Inventareintrag und 30-Tage-Plan starten" },
    ],
    // The EU AI Act course addresses the reader with "Sie" (CONTENT_GUIDE).
    outcomesHeading: "Was Sie danach können",
    evidenceHeading: "Was der Teilnahmenachweis belegt",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokalen Abschlussquiz.",
      "Zeitabhängige Rechtsangaben im Kurs wurden zuletzt am 4.\u00a0Oktober\u00a02026 geprüft.",
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
        "Free EU AI Act course: 5 modules, 10 hands-on lessons, about 1 hour. Determine your role, classify use cases, generate your obligation list, work out the fine range.",
    },
    graph: {
      home: "Home",
      courseName: "EU AI Act Course: roles, risks, and duties",
      description:
        "Hands-on online course on role, application dates, risk class, obligations, labelling, fines, and implementation of Regulation (EU) 2024/1689 as amended.",
      audience:
        "Adults and workplace decision-makers without a legal background",
      teaches: [
        "Determine role and application dates under the EU AI Act",
        "Assign use cases to a risk class and derive the obligations",
        "Estimate the fine range and create an AI inventory entry",
      ],
    },
    eyebrow: "EU AI Act Course · Foundations · free",
    heading: "Map roles, risks,",
    headingAccent: "and duties.",
    introduction:
      "For one AI tool your company uses, you work out its risk class, your role and your duties.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageLabel: "EU AI Act · 5 modules · 10 lessons",
    facts: [
      "5 modules",
      "10 hands-on lessons",
      "About 1 hr of study",
      "Final quiz with 20 questions",
      "Reg. (EU) 2024/1689, version of 27\u00a0July\u00a02026",
    ],
    legalHeading: "What Article 4 requires",
    legalBody:
      "Article 4 has applied since 2 February 2025. Providers and deployers of AI systems must take measures that support the development of AI literacy among staff and other people who work with those systems on their behalf. Prior knowledge, experience, education, context of use, and affected groups must be considered. The version in force since 27 July 2026 does not require a guaranteed level of individual AI literacy.",
    curriculumHeading: "Course plan",
    minutes: (count: number) => `${count} min`,
    audienceHeading: "Who it is for",
    audience: [
      { title: "Modules 1 and 2: anyone choosing or using AI tools" },
      { title: "From module 3: data protection, IT, compliance, procurement, HR, business owners" },
      { title: "No coding or legal background needed" },
    ],
    outcomes: [
      { title: "Determine your role, including when your own brand or a modification flips it" },
      { title: "Assign a use case to a risk class in six questions" },
      { title: "Generate your obligation list with articles and deadline" },
      { title: "Estimate the fine range under Art. 99" },
      { title: "Start with an AI inventory entry and a 30-day plan" },
    ],
    outcomesHeading: "What you can do afterwards",
    evidenceHeading: "What the completion record establishes",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "Time-dependent legal statements in the course were last reviewed on 4 October 2026.",
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
          courseWorkload: "PT1H",
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
