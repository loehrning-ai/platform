import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { TechnicalCourseProgressBar } from "@/components/course/technical-course-progress";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";
import {
  buildLocaleAlternates,
  localizeHref,
  type Locale,
} from "@/lib/i18n/locale";
import { getCourseMeta, getModules } from "@/lib/ai-native/data";
import { getAiNativeTrustSignals } from "@/lib/ai-native/content";

const COURSE_PATH = "/ai-native";

const LANDING_COPY = {
  de: {
    title: "AI-Native Arbeitskurs: Aufgaben mit Claude strukturieren",
    description:
      "Kostenloser Arbeitskurs mit 4 Modulen und 27 Lektionen. Aufgaben abgrenzen, Kontext bereitstellen, Ergebnisse prüfen und wiederholbare Abläufe dokumentieren.",
    home: "Start",
    courses: "Kurse",
    courseName: "AI-Native Arbeitskurs",
    graphDescription:
      "Arbeitskurs zu klaren Aufgaben, prüfbaren Claude-Workflows, Wissensorganisation und kontrollierter Automatisierung.",
    audience: "Berufstätige, Selbstständige und Studierende",
    imageAlt:
      "Editoriale Illustration eines modularen AI-Native-Arbeitsstudios mit Kontext, Werkzeugen und Prüfschleife",
    teaches: [
      "Aufgaben für KI-Unterstützung abgrenzen",
      "Kontext und Prüfkriterien dokumentieren",
      "wiederholbare Abläufe mit klaren Kontrollen entwerfen",
    ],
    eyebrow: "AI-Native · Arbeitsinstrument",
    heading: "Aufgabe definieren. Output prüfen.",
    intro:
      "Vier Module führen von einer begrenzten Aufgabe zu einem kontrollierten Workflow mit sichtbaren Prüfpunkten.",
    start: "Mit Modul 1 beginnen",
    workspace: "Kursstand öffnen",
    factsLabel: "Kursrahmen",
    progressLabel: "Fortschritt im AI-Native Arbeitskurs",
    lessonsLabel: "Lektionen",
    decisionsEyebrow: "Arbeitsvertrag",
    decisionsHeading: "Drei Entscheidungen vor jedem KI-Schritt.",
    modulesEyebrow: "Module",
    modulesHeading: "Vier Projekte, ein kontrollierter Ablauf.",
    resourcesEyebrow: "Instrumente",
    resourcesHeading: "Prüfen, simulieren, nachschlagen.",
    resources: [
      {
        href: "/ai-native/fluency-test",
        label: "Fluency-Selbsttest",
        output: "Ausgangsniveau",
      },
      {
        href: "/ai-native/demos",
        label: "Kurssimulationen",
        output: "kontrollierte Beispiele",
      },
      { href: "/ai-native/glossar", label: "Glossar", output: "70 Begriffe" },
      {
        href: "/ai-native/capstone-gallery",
        label: "Capstone-Regeln",
        output: "Veröffentlichungsgrenze",
      },
    ],
    boundarySummary: "Zugang, Nachweis und Herkunft",
    boundary: [
      "Alle vier Module und 27 Lektionen sind kostenlos. Der geschützte Reader benötigt ein kostenloses Lernkonto; Zahlungsdaten werden nicht verlangt.",
      "Der lokale Teilnahmenachweis basiert auf gespeichertem Fortschritt und Selbstprüfung. Er ist keine externe Prüfung, Akkreditierung oder Konformitätsbestätigung.",
      "Der KI-Führerschein wird empfohlen, aber nicht vorausgesetzt. Werkzeugspezifische Hinweise können nach Anbieteränderungen veralten.",
    ],
  },
  en: {
    title: "AI-Native Workflow Course: structured work with Claude",
    description:
      "Free course with 4 modules and 27 lessons. Define bounded tasks, provide context, review outputs and document repeatable workflows.",
    home: "Home",
    courses: "Courses",
    courseName: "AI-Native Workflow Course",
    graphDescription:
      "A practical course on bounded tasks, reviewable Claude workflows, maintained knowledge and controlled automation.",
    audience: "Professionals, independent workers and students",
    imageAlt:
      "Editorial illustration of a modular AI-native studio with context, tools, and a review loop",
    teaches: [
      "define bounded tasks for AI assistance",
      "document context and review criteria",
      "design repeatable workflows with explicit controls",
    ],
    eyebrow: "AI-Native · working instrument",
    heading: "Define the task. Review the output.",
    intro:
      "Four modules move from one bounded task to a controlled workflow with visible review points.",
    start: "Start with module 1",
    workspace: "Open course progress",
    factsLabel: "Course frame",
    progressLabel: "AI-Native Workflow Course progress",
    lessonsLabel: "lessons",
    decisionsEyebrow: "Operating contract",
    decisionsHeading: "Three decisions before every AI-assisted step.",
    modulesEyebrow: "Modules",
    modulesHeading: "Four projects, one controlled workflow.",
    resourcesEyebrow: "Instruments",
    resourcesHeading: "Assess, simulate, and look up.",
    resources: [
      {
        href: "/ai-native/fluency-test",
        label: "Fluency self-assessment",
        output: "starting point",
      },
      {
        href: "/ai-native/demos",
        label: "Course simulations",
        output: "controlled examples",
      },
      { href: "/ai-native/glossar", label: "Glossary", output: "70 terms" },
      {
        href: "/ai-native/capstone-gallery",
        label: "Capstone rules",
        output: "publication boundary",
      },
    ],
    boundarySummary: "Access, record, and provenance",
    boundary: [
      "All four modules and 27 lessons are free. The protected reader requires a free learning account; no payment details are requested.",
      "The local completion record is based on stored progress and self-review. It is not an external examination, accreditation, or compliance finding.",
      "AI Fundamentals is recommended but not required. Tool-specific guidance can become outdated after provider changes.",
    ],
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const localizedPath = localizeHref(COURSE_PATH, locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates(COURSE_PATH, ["de", "en"]);
  return {
    title: copy.title,
    description: copy.description,
    robots: { index: true, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
      alternateLocale: [locale === "en" ? "de_DE" : "en_GB"],
      images: [
        {
          url: `${SITE_URL}/course-covers/ai-native-cover-v3.webp`,
          width: 1440,
          height: 630,
          alt: copy.imageAlt,
        },
      ],
    },
  };
}

// Breadcrumb + Course @graph (shared course architecture): mirrors the KI-Führerschein
// and EU-AI-Act landing pages so all three courses emit a breadcrumb trail and
// a free-access Course node. The breadcrumb runs Start → Kurse → AI-Native so
// the new /kurse hub is part of the indexed trail.
function buildCourseJsonLd(locale: Locale) {
  const copy = LANDING_COPY[locale];
  const meta = getCourseMeta(locale);
  const localizedPath = localizeHref(COURSE_PATH, locale);
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
            item: `${SITE_URL}${localizeHref("/", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: copy.courses,
            item: `${SITE_URL}${localizeHref("/kurse", locale)}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: copy.courseName,
            item: `${SITE_URL}${localizedPath}`,
          },
        ],
      },
      {
        "@type": "Course",
        name: meta.title,
        description: copy.graphDescription,
        url: `${SITE_URL}${localizedPath}`,
        provider: { "@id": ORG_ID },
        isAccessibleForFree: true,
        inLanguage: locale,
        educationalLevel: "Intermediate",
        audience: { "@type": "Audience", audienceType: copy.audience },
        teaches: copy.teaches,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: "PT12H",
          inLanguage: locale,
        },
      },
    ],
  };
}

export default async function AiNativePage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const meta = getCourseMeta(locale);
  const modules = getModules(locale);
  const trustSignals = getAiNativeTrustSignals(locale);
  const moduleOneHref = localizeHref("/ai-native/kurs/modul_1", locale);

  return (
    <>
      <JsonLd data={buildCourseJsonLd(locale)} id="ai-native-landing-jsonld" />
      <TechnicalCourseFrame courseId="ai-native" lang={locale}>
        <TechnicalCourseHeader
          eyebrow={copy.eyebrow}
          title={copy.heading}
          intro={copy.intro}
          primaryAction={
            <Link
              href={moduleOneHref}
              prefetch={false}
              className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            >
              {copy.start} <span aria-hidden="true">→</span>
            </Link>
          }
          secondaryAction={
            <Link
              href={localizeHref("/ai-native/kurs", locale)}
              prefetch={false}
              className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
            >
              {copy.workspace}
            </Link>
          }
          facts={[
            `${meta.totalModules} ${locale === "de" ? "Module" : "modules"}`,
            `${meta.totalLessons} ${copy.lessonsLabel}`,
            `${meta.targetDurationHours} h · ${locale === "de" ? "eigenes Tempo" : "self-paced"}`,
            locale === "de" ? "kostenloses Lernkonto" : "free learning account",
          ]}
          factsLabel={copy.factsLabel}
          progress={
            <TechnicalCourseProgressBar
              courseSlug="ai-native"
              totalLessons={meta.totalLessons}
              label={copy.progressLabel}
              unitLabel={copy.lessonsLabel}
            />
          }
        />

        <div>
          <section className="mt-10 grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <TechnicalCourseSectionHeading
              eyebrow={copy.decisionsEyebrow}
              title={copy.decisionsHeading}
            />
            <ol className="border-y border-border">
              {copy.teaches.map((decision, index) => (
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
              eyebrow={copy.modulesEyebrow}
              title={copy.modulesHeading}
            />
            <ol className="mt-5 border-t border-border">
              {modules.map((module) => (
                <li
                  key={module.id}
                  className="grid min-w-0 gap-3 border-b border-border py-4 md:grid-cols-[4rem_minmax(0,1fr)_9rem] md:items-start md:gap-5"
                >
                  <p className="font-mono text-xs font-bold text-brand-orange">
                    {String(module.number).padStart(2, "0")}
                  </p>
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-semibold text-foreground">
                      {module.title}
                    </h3>
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted-foreground">
                      {module.description}
                    </p>
                    <details className="mt-2 border-t border-border">
                      <summary
                        aria-label={`${
                          locale === "de"
                            ? "Entscheidungen und Übungen"
                            : "Decisions and exercises"
                        }: ${module.title}`}
                        className="flex min-h-11 cursor-pointer items-center font-mono text-xs font-bold uppercase tracking-[0.06em] text-foreground"
                      >
                        {locale === "de"
                          ? "Entscheidungen und Übungen"
                          : "Decisions and exercises"}
                      </summary>
                      <ul className="border-t border-border py-2">
                        {module.topics.map((topic) => (
                          <li
                            key={topic}
                            className="border-b border-border py-2 text-[13px] leading-relaxed text-muted-foreground last:border-b-0"
                          >
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground md:text-right">
                    {module.lessonCount} {copy.lessonsLabel} ·{" "}
                    {module.durationMinutes} {locale === "de" ? "Min." : "min"}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-10 grid min-w-0 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
            <TechnicalCourseSectionHeading
              eyebrow={copy.resourcesEyebrow}
              title={copy.resourcesHeading}
            />
            <nav
              aria-label={copy.resourcesHeading}
              className="border-t border-border"
            >
              {copy.resources.map((resource) => (
                <Link
                  key={resource.href}
                  href={localizeHref(resource.href, locale)}
                  className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} sm:grid-cols-[minmax(0,1fr)_12rem_auto]`}
                >
                  <span className="break-words text-sm font-semibold text-foreground">
                    {resource.label}
                  </span>
                  <span className="break-words font-mono text-xs text-muted-foreground">
                    {resource.output}
                  </span>
                  <span className="text-brand-orange" aria-hidden="true">
                    →
                  </span>
                </Link>
              ))}
            </nav>
          </section>

          <details className="mt-10 border-y border-border">
            <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
              {copy.boundarySummary}
              <span className="text-brand-orange" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="grid gap-5 border-t border-border py-4 lg:grid-cols-2">
              <ul className="border-t border-border">
                {copy.boundary.map((item) => (
                  <li
                    key={item}
                    className="border-b border-border py-3 text-[13px] leading-relaxed text-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="border-t border-border">
                {trustSignals.map((signal) => (
                  <li
                    key={signal}
                    className="border-b border-border py-3 text-[13px] leading-relaxed text-muted-foreground"
                  >
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </TechnicalCourseFrame>
    </>
  );
}
