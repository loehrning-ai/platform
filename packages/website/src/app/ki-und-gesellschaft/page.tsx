import type { Metadata } from "next";
import Link from "next/link";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
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
  readonly facts: readonly { readonly value: string; readonly label: string }[];
  readonly whyEyebrow: string;
  readonly whyHeading: string;
  readonly whyBody: string;
  readonly curriculumEyebrow: string;
  readonly curriculumHeading: string;
  readonly blockLabel: (number: number) => string;
  readonly minutes: (count: number) => string;
  readonly methodEyebrow: string;
  readonly methodHeading: string;
  readonly methods: readonly {
    readonly number: string;
    readonly title: string;
    readonly body: string;
  }[];
  readonly evidenceEyebrow: string;
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
    eyebrow: "KI und Gesellschaft · Lernpfad Stufe 2",
    heading: "Arbeit, Deepfakes",
    headingAccent: "und Bias einordnen.",
    introduction:
      "Der Kurs trennt belastbare Befunde von pauschalen KI-Behauptungen. Du prüfst, welche Aufgaben sich verändern, wie synthetische Medien bewertet werden und an welchen Stellen Bias in Entscheidungen entsteht. Drei Blöcke, neun Lektionen, 46 Minuten.",
    start: "Mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageAlt:
      "Editoriale Berlin-Collage mit Menschen, synthetischen Porträts, Datenrastern und einem Prüfentscheid",
    imageLabel: "3 Blöcke · 9 Lektionen",
    facts: [
      { value: "3", label: "Blöcke" },
      { value: "9", label: "Lektionen" },
      { value: "46 Min", label: "Lernzeit" },
      { value: "Lokal", label: "Lernnachweis" },
    ],
    whyEyebrow: "§ Ausgangspunkt",
    whyHeading: "Drei Themen brauchen drei verschiedene Prüfmethoden.",
    whyBody:
      "Prognosen zum Arbeitsmarkt, die Echtheit eines Videos und die Fairness einer automatisierten Entscheidung lassen sich nicht mit derselben Checkliste bewerten. Der Kurs ordnet für jedes Thema die relevante Datenbasis, typische Fehlschlüsse und konkrete Prüfschritte. Quellen und Prüfstände stehen direkt in den Lektionen.",
    curriculumEyebrow: "§ Curriculum",
    curriculumHeading: "Neun Lektionen entlang realer Entscheidungen.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} Min.`,
    methodEyebrow: "§ Prüfraster",
    methodHeading: "Was du in jedem Themenfeld untersuchst.",
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
    evidenceEyebrow: "§ Aussagekraft",
    evidenceHeading: "Was der Lernnachweis festhält.",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokal durchgeführten Abschlussquiz.",
      "Er ist nicht akkreditiert, nicht servergeprüft und keine amtliche oder berufliche Qualifikation.",
      "Quellen und zeitabhängige Aussagen werden in den einzelnen Lektionen ausgewiesen.",
      "Der Kurs ersetzt keine Rechtsberatung und keine Prüfung eines konkreten Beschäftigungs- oder Diskriminierungsfalls.",
    ],
    factsLabel: "Kursrahmen",
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
    eyebrow: "AI and Society · Learning path stage 2",
    heading: "Assess work, deepfakes,",
    headingAccent: "and bias.",
    introduction:
      "This course separates supported findings from broad claims about AI. You examine which tasks change, how to assess synthetic media, and where bias enters decisions. Three blocks, nine lessons, 46 minutes.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageAlt:
      "Editorial Berlin collage with people, synthetic portraits, data grids, and a review decision",
    imageLabel: "3 blocks · 9 lessons",
    facts: [
      { value: "3", label: "Blocks" },
      { value: "9", label: "Lessons" },
      { value: "46 min", label: "Study time" },
      { value: "Local", label: "Completion record" },
    ],
    whyEyebrow: "§ Starting point",
    whyHeading: "Three topics require three different review methods.",
    whyBody:
      "A labour-market forecast, the authenticity of a video, and the fairness of an automated decision cannot be assessed with one checklist. For each topic, the course identifies the relevant evidence, common reasoning errors, and concrete review steps. Sources and review dates appear in the lessons.",
    curriculumEyebrow: "§ Curriculum",
    curriculumHeading: "Nine lessons organized around real decisions.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} min`,
    methodEyebrow: "§ Review methods",
    methodHeading: "What to examine in each topic.",
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
    evidenceEyebrow: "§ Scope of the record",
    evidenceHeading: "What the completion record establishes.",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "It is not accredited, server-verified, or an official or professional qualification.",
      "Sources and time-dependent claims are identified in the individual lessons.",
      "The course is not legal advice and does not assess a specific employment or discrimination case.",
    ],
    factsLabel: "Course frame",
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
          facts={copy.facts.map((fact) => `${fact.value} ${fact.label}`)}
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

        <div>
          <section className="mt-10 grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <TechnicalCourseSectionHeading
              eyebrow={copy.whyEyebrow}
              title={copy.whyHeading}
              intro={copy.whyBody}
            />
            <ol className="border-y border-border">
              {copy.methods.map((method) => (
                <li
                  key={method.number}
                  className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span className="font-mono text-xs font-bold text-brand-orange">
                    {method.number}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      {method.title}
                    </h3>
                    <p className="mt-1 break-words text-[13px] leading-relaxed text-muted-foreground">
                      {method.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10">
            <TechnicalCourseSectionHeading
              eyebrow={copy.curriculumEyebrow}
              title={copy.curriculumHeading}
            />
            <ol className="mt-5 border-t border-border">
              {blocks.map((block, index) => (
                <li
                  key={block.id}
                  className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-[6rem_minmax(0,1fr)_8rem] md:items-start md:gap-5"
                >
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                    {copy.blockLabel(index + 1)}
                  </p>
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-foreground">
                      {block.title}
                    </h3>
                    <p className="mt-1 max-w-[720px] break-words text-sm leading-relaxed text-muted-foreground">
                      {block.description}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground md:text-right">
                    {block.lessons.length} {copy.lessonsLabel} ·{" "}
                    {copy.minutes(block.durationMinutes)}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <details className="mt-10 border-y border-border">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {copy.boundarySummary}
              <span className="text-brand-orange" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="border-t border-border py-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                {copy.evidenceHeading}
              </p>
              <ul className="mt-2 grid border-t border-border md:grid-cols-2">
                {copy.evidence.map((item) => (
                  <li
                    key={item}
                    className="border-b border-border py-3 text-[13px] leading-relaxed text-muted-foreground md:px-3 md:first:pl-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <Link
            href={localizeHref("/eu-ai-act-kurs", locale)}
            className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} mt-8 sm:grid-cols-[minmax(0,1fr)_auto]`}
          >
            <span className="text-sm font-semibold text-foreground">
              {copy.nextCourse}
            </span>
            <span className="text-brand-orange" aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </TechnicalCourseFrame>
    </>
  );
}
