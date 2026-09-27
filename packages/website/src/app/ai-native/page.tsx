import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import {
  TECHNICAL_COURSE_LEDGER_LINK_CLASS,
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
} from "@/components/course/technical-course-landing";
import {
  CourseBlockLedger,
  CourseBoundaryColumn,
  CourseBoundaryDetails,
  CourseLandingSection,
  CourseNoteList,
  CourseOutcomeList,
} from "@/components/course/course-landing-sections";
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
    eyebrow: "AI-Native Arbeitskurs · kostenlos",
    heading: "Routinearbeit mit Claude automatisieren.",
    intro:
      "Für alle, die jede Woche dieselben Mails, Notizen und Berichte bearbeiten. Im Abschlussprojekt baust du ohne Programmieren einen Ablauf aus deiner Arbeit und legst fest, wie du ihn prüfst.",
    start: "Mit Modul 1 beginnen",
    workspace: "Kursstand öffnen",
    factsLabel: "Auf einen Blick",
    progressLabel: "Fortschritt im AI-Native Arbeitskurs",
    lessonsLabel: "Lektionen",
    outcomesHeading: "Was du danach kannst",
    outcomes: [
      { title: "Aufgaben mit Ziel, Kontext, Beispiel und Prüfkriterium beschreiben" },
      { title: "Ein Claude-Projekt mit Anweisungen, Beispieldateien und Skills einrichten" },
      { title: "Mails, Notizen und Ordner in einer Obsidian-Wissensbasis ablegen" },
      { title: "Wiederkehrende Aufgaben für n8n prüfen und Kontrollen vorab festlegen" },
    ],
    modulesHeading: "Module",
    topicsLabel: "Themen im Modul",
    resourcesHeading: "Außerdem im Kurs",
    resources: [
      {
        href: "/ai-native/fluency-test",
        label: "Fluency-Selbsttest",
        output: "Ausgangsniveau",
      },
      {
        href: "/ai-native/demos",
        label: "Kurssimulationen",
        output: "Kontrollierte Beispiele",
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
      "Der Reader braucht ein kostenloses Lernkonto, ohne Zahlungsdaten.",
      "Der lokale Teilnahmenachweis beruht auf gespeichertem Fortschritt und Selbstprüfung und ist keine externe Prüfung, Akkreditierung oder Konformitätsbestätigung.",
      "Der KI-Führerschein wird empfohlen, ist aber keine Voraussetzung. Hinweise zu Werkzeugen können nach Anbieteränderungen veralten.",
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
    eyebrow: "AI-Native Workflow Course · free",
    heading: "Automate routine work with Claude.",
    intro:
      "For people who handle the same emails, notes and reports every week. In the final project you build a workflow from your own work, without code, and decide how to check it.",
    start: "Start with module 1",
    workspace: "Open course progress",
    factsLabel: "At a glance",
    progressLabel: "AI-Native Workflow Course progress",
    lessonsLabel: "lessons",
    outcomesHeading: "What you can do afterwards",
    outcomes: [
      { title: "Brief tasks with goal, context, example and review criterion" },
      { title: "Set up a Claude project with instructions, sample files and skills" },
      { title: "Keep emails, notes and folders in an Obsidian knowledge base" },
      { title: "Test recurring tasks for n8n and set controls first" },
    ],
    modulesHeading: "Modules",
    topicsLabel: "Topics in this module",
    resourcesHeading: "Also in this course",
    resources: [
      {
        href: "/ai-native/fluency-test",
        label: "Fluency self-assessment",
        output: "Starting point",
      },
      {
        href: "/ai-native/demos",
        label: "Course simulations",
        output: "Controlled examples",
      },
      { href: "/ai-native/glossar", label: "Glossary", output: "70 terms" },
      {
        href: "/ai-native/capstone-gallery",
        label: "Capstone rules",
        output: "Publication boundary",
      },
    ],
    boundarySummary: "Access, record, and provenance",
    boundary: [
      "The reader needs a free learning account, with no payment details.",
      "The local completion record rests on stored progress and self-review and is not an external examination, accreditation or compliance finding.",
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
  // Reading time of the lessons alone; targetDurationHours adds the exercises.
  const lessonHours = Math.max(
    1,
    Math.round(
      modules.reduce((sum, module) => sum + module.durationMinutes, 0) / 60,
    ),
  );
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
            locale === "de"
              ? `ca. ${lessonHours} Std. Lesezeit, ca. ${meta.targetDurationHours} Std. mit Übungen`
              : `About ${lessonHours} hrs of reading, about ${meta.targetDurationHours} hrs with exercises`,
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

        <CourseLandingSection title={copy.outcomesHeading}>
          <CourseOutcomeList items={copy.outcomes} />
        </CourseLandingSection>

        <CourseLandingSection title={copy.modulesHeading}>
          <CourseBlockLedger
            rows={modules.map((module) => ({
              id: module.id,
              number: String(module.number).padStart(2, "0"),
              title: module.title,
              description: module.description,
              meta: `${module.lessonCount} ${copy.lessonsLabel} · ${module.durationMinutes} ${locale === "de" ? "Min." : "min"}`,
              extra: (
                <details className="group/topics mt-3 max-w-[60ch]">
                  <summary
                    aria-label={`${copy.topicsLabel}: ${module.title}`}
                    className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-label text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground [&::-webkit-details-marker]:hidden"
                  >
                    {copy.topicsLabel}
                    <span aria-hidden="true" className="group-open/topics:hidden">+</span>
                    <span aria-hidden="true" className="hidden group-open/topics:inline">−</span>
                  </summary>
                  <CourseNoteList items={module.topics} />
                </details>
              ),
            }))}
          />
        </CourseLandingSection>

        <CourseLandingSection title={copy.resourcesHeading}>
          <nav aria-label={copy.resourcesHeading} className="border-t border-hairline">
            {copy.resources.map((resource) => (
              <Link
                key={resource.href}
                href={localizeHref(resource.href, locale)}
                className={`${TECHNICAL_COURSE_LEDGER_LINK_CLASS} grid-cols-[minmax(0,1fr)_1.5rem] sm:grid-cols-[minmax(0,1fr)_auto_1.5rem]`}
              >
                <span className="break-words text-body font-semibold text-foreground">
                  {resource.label}
                </span>
                <span className="hidden break-words text-caption text-muted-foreground tabular-nums sm:block sm:text-right">
                  {resource.output}
                </span>
                <span
                  className="arrow-nudge text-foreground motion-reduce:transition-none"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </nav>
        </CourseLandingSection>

        <CourseBoundaryDetails summary={copy.boundarySummary}>
          <CourseBoundaryColumn>
            <CourseNoteList items={copy.boundary} />
          </CourseBoundaryColumn>
          <CourseBoundaryColumn>
            <CourseNoteList items={trustSignals} />
          </CourseBoundaryColumn>
        </CourseBoundaryDetails>
      </TechnicalCourseFrame>
    </>
  );
}
