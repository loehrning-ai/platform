import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getBlocks } from "@/lib/course/data";
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
      "Abstrakte Kursgrafik zu Arbeit, synthetischen Medien und algorithmischen Entscheidungen",
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
      "Abstract course illustration about work, synthetic media, and algorithmic decisions",
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
          url: `${SITE_URL}/course-covers/ki-und-gesellschaft-cover-v2.webp`,
          width: 610,
          height: 610,
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

const PRIMARY_CTA =
  "inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 text-left font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]";

const SECONDARY_CTA =
  "inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-background px-5 py-3.5 text-left font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]";

export default async function KiUndGesellschaftLandingPage() {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const blocks = getBlocks(COURSE_SLUG, locale);
  const courseHref = localizeHref(`${COURSE_PATH}/kurs`, locale);

  return (
    <>
      <JsonLd
        data={courseGraph(locale)}
        id="ki-und-gesellschaft-landing-jsonld"
      />
      <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-20">
        <div className="mb-9 h-[3px] w-[132px] bg-brand-orange sm:w-[154px]" />

        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:items-end">
          <div className="min-w-0">
            <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand-orange sm:tracking-[0.18em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[900px] break-words text-[40px] font-bold leading-[0.94] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere] sm:text-[56px] md:text-[76px]">
              {copy.heading}
              <br />
              <span className="text-brand-orange">{copy.headingAccent}</span>
            </h1>
            <p className="mt-8 max-w-[780px] break-words text-[17px] leading-[1.55] text-muted-foreground sm:text-[20px]">
              {copy.introduction}
            </p>
            <div className="mt-10 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
              <Link href={courseHref} prefetch={false} className={PRIMARY_CTA}>
                {copy.start}
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href={localizeHref("/kurse", locale)}
                className={SECONDARY_CTA}
              >
                {copy.allCourses}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <figure className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden border-2 border-foreground bg-card shadow-[7px_7px_0_var(--color-foreground)] lg:mx-0">
            <Image
              src="/course-covers/ki-und-gesellschaft-cover-v2.webp"
              alt={copy.imageAlt}
              fill
              priority
              sizes="(max-width: 1023px) min(360px, 100vw), 360px"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 border-t-2 border-foreground bg-background/95 px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-foreground backdrop-blur-sm">
              {copy.imageLabel}
            </figcaption>
          </figure>
        </div>

        <dl className="mt-14 grid grid-cols-2 border-l border-t border-border sm:grid-cols-4">
          {copy.facts.map((fact) => (
            <div
              key={fact.label}
              className="min-w-0 border-b border-r border-border bg-card/30 p-4 sm:p-5"
            >
              <dt className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-2 break-words text-[24px] font-bold tracking-[-0.03em] text-foreground sm:text-[28px]">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-20 border-l-4 border-brand-orange bg-card p-5 sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange sm:tracking-[0.18em]">
            {copy.whyEyebrow}
          </p>
          <h2 className="mt-3 max-w-[840px] break-words text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            {copy.whyHeading}
          </h2>
          <p className="mt-4 max-w-[980px] break-words text-[16px] leading-[1.65] text-muted-foreground">
            {copy.whyBody}
          </p>
        </section>

        <section className="mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.curriculumEyebrow}
          </p>
          <h2 className="mt-3 break-words text-[28px] font-bold tracking-[-0.02em] text-foreground sm:text-[36px]">
            {copy.curriculumHeading}
          </h2>

          <ol className="mt-10 border-t border-border">
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className="grid min-w-0 gap-4 border-b border-border py-7 md:grid-cols-[140px_minmax(0,1fr)_auto] md:items-baseline md:gap-8"
              >
                <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.blockLabel(index + 1)}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-[18px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-[20px]">
                    {block.title}
                  </h3>
                  <p className="mt-2 max-w-[680px] break-words text-[15px] leading-[1.6] text-muted-foreground [overflow-wrap:anywhere]">
                    {block.description}
                  </p>
                </div>
                <div className="font-mono text-[12px] font-medium tracking-wide text-muted-foreground">
                  {copy.minutes(block.durationMinutes)}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.methodEyebrow}
          </p>
          <h2 className="mt-3 max-w-[820px] break-words text-[28px] font-bold tracking-[-0.02em] text-foreground sm:text-[36px]">
            {copy.methodHeading}
          </h2>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {copy.methods.map((method) => (
              <article
                key={method.number}
                className="min-w-0 border-2 border-foreground bg-card p-5 shadow-[4px_4px_0_var(--color-foreground)] sm:p-6"
              >
                <p className="font-mono text-[12px] font-bold text-brand-orange">
                  {method.number}
                </p>
                <h3 className="mt-7 break-words text-[21px] font-bold tracking-[-0.02em] text-foreground">
                  {method.title}
                </h3>
                <p className="mt-3 break-words text-[15px] leading-[1.6] text-muted-foreground">
                  {method.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24 border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange sm:tracking-[0.18em]">
            {copy.evidenceEyebrow}
          </p>
          <h2 className="mt-3 max-w-[780px] break-words text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            {copy.evidenceHeading}
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {copy.evidence.map((item, index) => (
              <li
                key={item}
                className="flex min-w-0 gap-3 border-t border-border pt-4 text-[15px] leading-[1.6] text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 font-mono font-bold text-brand-orange"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="break-words">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-16 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
          <Link href={courseHref} prefetch={false} className={PRIMARY_CTA}>
            {copy.start}
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={localizeHref("/eu-ai-act-kurs", locale)}
            className={SECONDARY_CTA}
          >
            {copy.nextCourse}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
