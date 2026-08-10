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
  readonly whyBody: string;
  readonly curriculumHeading: string;
  readonly blockLabel: (number: number) => string;
  readonly minutes: (count: number) => string;
  readonly evidenceEyebrow: string;
  readonly evidenceHeading: string;
  readonly evidence: readonly string[];
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
    whyBody:
      "Artikel 4 der EU-KI-Verordnung ist seit dem 2. Februar 2025 anwendbar. In der seit 27. Juli 2026 geltenden Fassung müssen Anbieter und Betreiber Maßnahmen treffen, die die Entwicklung von KI-Kompetenz bei Personen unterstützen, die in ihrem Auftrag mit KI-Systemen arbeiten. Vorwissen, Rolle, Einsatzkontext und betroffene Personen sind zu berücksichtigen. Die Verordnung schreibt weder ein einheitliches Kursformat noch ein Zertifikat vor. Dieser Kurs kann ein Lernprogramm ergänzen; er belegt keine organisationsweite Compliance.",
    curriculumHeading: "Was du lernst.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} Min.`,
    evidenceEyebrow: "§ Aussagekraft",
    evidenceHeading: "Was die Teilnahmebestätigung belegt.",
    evidence: [
      "Artikel 4 ist seit 2. Februar 2025 anwendbar; seine geänderte Fassung gilt seit 27. Juli 2026.",
      "Artikel 4 verlangt kontextbezogene Maßnahmen, kein fixes Kurs- oder Zertifikatsformat.",
      "Die lokal erzeugte PDF dokumentiert nur den Abschluss dieses Kurses. Sie ist kein Rechts- oder Kompetenznachweis.",
      "Hochrisiko-Pflichten erfordern zusätzlich Systeminventar, Risikoklassifizierung und interne Prozesse.",
    ],
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
    whyBody:
      "Article 4 of the EU AI Act has applied since 2 February 2025. Under the version in force since 27 July 2026, providers and deployers must take measures that support the development of AI literacy among people who deal with AI systems on their behalf. Prior knowledge, experience, education and training, use context, and affected people or groups matter. The Regulation does not prescribe one course or certificate. This course can support a wider learning programme; it does not establish organization-wide compliance.",
    curriculumHeading: "What you will learn.",
    blockLabel: (number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count) => `${count} min`,
    evidenceEyebrow: "§ Scope of the record",
    evidenceHeading: "What the completion record proves.",
    evidence: [
      "Article 4 has applied since 2 February 2025; its amended version has been in force since 27 July 2026.",
      "Article 4 requires context-specific measures, not one fixed course or certificate format.",
      "The locally generated PDF records completion of this course only. It is not legal advice or independent proof of competence.",
      "High-risk-system duties also require an inventory, risk classification, and internal controls.",
    ],
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

const PRIMARY_CTA =
  "inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-brand-orange px-5 py-3.5 text-left font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]";

const SECONDARY_CTA =
  "inline-flex min-h-12 max-w-full items-center gap-2 break-words border-2 border-foreground bg-background px-5 py-3.5 text-left font-mono text-[12px] font-bold uppercase tracking-[0.05em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)] sm:px-6 sm:text-[13px]";

export default async function KiFuehrerscheinLandingPage() {
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
        id="ki-fuehrerschein-landing-jsonld"
      />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-20">
        <div className="mb-9 h-[3px] w-[132px] bg-brand-orange sm:w-[154px]" />

        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:items-end">
          <div className="min-w-0">
            <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand-orange sm:tracking-[0.18em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[900px] break-words text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground [overflow-wrap:anywhere] sm:text-[56px] md:text-[76px]">
              {copy.heading}
              <br />
              <span className="text-brand-orange">{copy.headingAccent}</span>
            </h1>
            <p className="mt-8 max-w-[780px] break-words text-[17px] leading-[1.55] text-muted-foreground sm:text-[20px]">
              {copy.introduction}
            </p>
            <div className="mt-10 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
              <Link
                href={courseHref}
                prefetch={false}
                className={PRIMARY_CTA}
              >
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

          <figure className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden border-2 border-foreground bg-card shadow-[7px_7px_0_var(--color-foreground)] lg:mx-0">
            <Image
              src="/course-covers/ki-fuehrerschein-cover-v2.webp"
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
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange sm:tracking-[0.18em]">
            {copy.whyEyebrow}
          </h2>
          <p className="mt-4 max-w-[980px] break-words text-[16px] leading-[1.65] text-muted-foreground">
            {copy.whyBody}
          </p>
        </section>

        <section className="mt-24">
          <div className="mb-10 flex items-baseline gap-4">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              §
            </span>
            <h2 className="break-words text-[28px] font-bold tracking-[-0.02em] text-foreground sm:text-[36px]">
              {copy.curriculumHeading}
            </h2>
          </div>

          <ol className="border-t border-border">
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className="grid min-w-0 gap-4 border-b border-border py-7 md:grid-cols-[140px_minmax(0,1fr)_auto] md:items-baseline md:gap-8"
              >
                <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.blockLabel(index + 1)}
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-[18px] font-semibold leading-snug text-foreground sm:text-[20px]">
                    {block.title}
                  </h3>
                  <p className="mt-2 max-w-[680px] break-words text-[15px] leading-[1.6] text-muted-foreground">
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

        <section className="mt-24 border-2 border-foreground bg-card p-5 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange sm:tracking-[0.18em]">
            {copy.evidenceEyebrow}
          </p>
          <h2 className="mt-3 max-w-[780px] break-words text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            {copy.evidenceHeading}
          </h2>
          <ul className="mt-6 grid gap-4 text-[15px] leading-[1.6] text-foreground md:grid-cols-2 md:gap-x-10">
            {copy.evidence.map((item) => (
              <li key={item} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
                <span className="font-mono text-brand-orange" aria-hidden="true">
                  ↳
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
            {copy.related}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </>
  );
}
