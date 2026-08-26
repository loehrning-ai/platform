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
  readonly imageLabel: string;
  readonly start: string;
  readonly allCourses: string;
  readonly facts: readonly { readonly value: string; readonly label: string }[];
  readonly whyEyebrow: string;
  readonly decisionHeading: string;
  readonly decisions: readonly string[];
  readonly whyBody: string;
  readonly curriculumEyebrow: string;
  readonly curriculumHeading: string;
  readonly blockLabel: (number: number) => string;
  readonly minutes: (count: number) => string;
  readonly evidenceEyebrow: string;
  readonly evidenceHeading: string;
  readonly evidence: readonly string[];
  readonly factsLabel: string;
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
    eyebrow: "§ KI-Führerschein · Kostenloser Grundlagenkurs",
    heading: "KI im Alltag:",
    headingAccent: "Was du wissen solltest.",
    introduction:
      "Der Kurs erklärt, wo dir KI im Alltag und bei der Arbeit begegnet, welche Daten nicht in ein Tool gehören und wie du Ergebnisse prüfst. Fünf Blöcke, 18 Lektionen, ca. 1 Std. 40 Min. Lernzeit. Keine technischen Vorkenntnisse.",
    imageAlt:
      "Abstrakte Kursgrafik mit einem technischen Raster und fünf Lernblöcken",
    imageLabel: "5 Blöcke · 18 Lektionen",
    start: "Kostenlos mit Lernkonto starten",
    allCourses: "Alle Kurse",
    facts: [
      { value: "5", label: "Blöcke" },
      { value: "18", label: "Lektionen" },
      { value: "1:40", label: "Lernzeit" },
      { value: "Lokal", label: "Teilnahmebestätigung" },
    ],
    whyEyebrow: "§ Warum dieser Kurs",
    decisionHeading: "Drei Entscheidungen für jeden KI-Einsatz.",
    decisions: [
      "Datengrenze: Welche Angaben bleiben außerhalb eines KI-Tools?",
      "Prüfweg: Welche Quelle oder Gegenprobe kann den Output widerlegen?",
      "Verantwortung: Wer entscheidet, wenn der Output Folgen hat?",
    ],
    whyBody:
      "Artikel 4 der EU-KI-Verordnung gilt seit dem 2. Februar 2025. In der seit 27. Juli 2026 geltenden Fassung müssen Anbieter und Betreiber kontextbezogene Maßnahmen treffen, die die Entwicklung der KI-Kompetenz unterstützen; Vorwissen, Rolle, Einsatzkontext und betroffene Personen zählen. Vorgeschrieben ist weder ein einheitliches Kursformat noch ein Zertifikat. Dieser Kurs kann solche Maßnahmen ergänzen, belegt aber keine organisationsweite Compliance.",
    curriculumEyebrow: "§ Kursweg",
    curriculumHeading: "Was du lernst.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} Min.`,
    evidenceEyebrow: "§ Aussagekraft",
    evidenceHeading: "Was die Teilnahmebestätigung belegt.",
    evidence: [
      "Die lokal erzeugte PDF dokumentiert den Abschluss dieses Kurses; sie ist kein Rechts-, Compliance- oder unabhängiger Kompetenznachweis.",
      "Für Hochrisiko-Systeme bleiben Systeminventar, Risikoklassifizierung und organisationsbezogene Kontrollen erforderlich.",
    ],
    factsLabel: "Kursrahmen",
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
        "5 blocks, 18 lessons, about 1 hour 40 minutes. Includes a learning account and a locally generated course completion record.",
    },
    graph: {
      home: "Home",
      courseName: "Everyday AI Literacy: what you need to know",
      description:
        "Free online foundation course on practical AI literacy with 5 blocks, 18 lessons, and about 1 hour 40 minutes of study.",
      audience: "Adults without a technical background",
    },
    eyebrow: "§ Everyday AI Literacy · Free foundation course",
    heading: "AI at work:",
    headingAccent: "what you need to know.",
    introduction:
      "Learn where AI appears in daily work, which data must stay out of an AI tool, and how to check a generated answer. Five blocks, 18 lessons, about 1 hour 40 minutes. No technical background required.",
    imageAlt:
      "Abstract course cover with a technical grid and five learning blocks",
    imageLabel: "5 blocks · 18 lessons",
    start: "Start with a free learning account",
    allCourses: "All courses",
    facts: [
      { value: "5", label: "Blocks" },
      { value: "18", label: "Lessons" },
      { value: "1:40", label: "Study time" },
      { value: "Local", label: "Completion record" },
    ],
    whyEyebrow: "§ Why this course exists",
    decisionHeading: "Three decisions for every AI use.",
    decisions: [
      "Data boundary: which information must stay outside an AI tool?",
      "Review path: which source or counter-check could disprove the output?",
      "Responsibility: who decides when the output has consequences?",
    ],
    whyBody:
      "Article 4 of the EU AI Act has applied since 2 February 2025. Under the version in force since 27 July 2026, providers and deployers must support context-specific AI-literacy measures; prior knowledge, role, use context, and affected people matter. It prescribes neither one course format nor a certificate. This course can support those measures; it does not establish organization-wide compliance.",
    curriculumEyebrow: "§ Course path",
    curriculumHeading: "What you will learn.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} min`,
    evidenceEyebrow: "§ Scope of the record",
    evidenceHeading: "What the completion record proves.",
    evidence: [
      "The locally generated PDF records completion of this course; it is not legal, compliance, or independent competence evidence.",
      "High-risk systems still require an inventory, risk classification, and organization-specific controls.",
    ],
    factsLabel: "Course frame",
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
              title={copy.decisionHeading}
            />
            <ol className="border-y border-border">
              {copy.decisions.map((decision, index) => (
                <li
                  key={decision}
                  className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <span className="font-mono text-xs tabular-nums text-brand-orange">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="break-words text-sm font-medium leading-relaxed text-foreground">
                    {decision}
                  </span>
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
            <div className="grid gap-5 border-t border-border py-4 lg:grid-cols-2">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                  {copy.whyEyebrow}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {copy.whyBody}
                </p>
              </div>
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.06em] text-brand-orange">
                  {copy.evidenceHeading}
                </p>
                <ul className="mt-2 border-t border-border">
                  {copy.evidence.map((item) => (
                    <li
                      key={item}
                      className="border-b border-border py-2 text-[13px] leading-relaxed text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>

          <Link
            href={localizeHref("/eu-ai-act-kurs", locale)}
            className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} mt-8 sm:grid-cols-[minmax(0,1fr)_auto]`}
          >
            <span className="text-sm font-semibold text-foreground">
              {copy.related}
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
