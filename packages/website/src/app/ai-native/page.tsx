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

const OPERATOR_PATH = "/kurse/open-source/ai-native-operator";

const LANDING_COPY = {
  de: {
    title: "Mit KI arbeiten: messen, absichern, belegen",
    description:
      "Kostenloser Kurs mit 4 Modulen und 9 Lektionen, je mit Übung. Netto-Zeit messen, Kontext und Werkzeugrechte begrenzen, zitierte Antworten prüfen und einen Ablauf mit Freigabe testen. Unabhängig vom Werkzeug.",
    home: "Start",
    courses: "Kurse",
    courseName: "Mit KI arbeiten",
    graphDescription:
      "Werkzeugunabhängiger Kurs zur eigenen Arbeit mit KI: Nutzen messen, Kontext und Rechte begrenzen, Quellen prüfen, Abläufe mit Freigabe absichern.",
    audience: "Berufstätige, Selbstständige und Studierende",
    teaches: [
      "Netto-Zeit einer KI-gestützten Aufgabe messen",
      "Werkzeugrechte gegen Prompt-Injection begrenzen",
      "zitierte KI-Antworten gegen Quellen prüfen",
      "einen Ablauf mit Prüfungen, Fehlerpfad und Freigabe testen",
    ],
    eyebrow: "Mit KI arbeiten · kostenlos",
    heading: "Erst messen. Dann automatisieren.",
    intro:
      "Für alle, die KI in der eigenen Arbeit einsetzen. Du misst, ob sich KI für eine Aufgabe lohnt, begrenzt, was ein Werkzeug sehen und tun darf, und testest einen Ablauf mit präparierten Fehlern, bis er hält. Jede Lektion: eine Idee mit Quelle, eine Übung, zwei Fragen.",
    scopeLead: "Abgrenzung:",
    scopeBefore: "Dieser Kurs betrifft deine eigene tägliche Arbeit. ",
    scopeLink: "AI-Native Operator",
    scopeAfter: " behandelt KI auf Ebene der ganzen Organisation.",
    start: "Mit Lektion 1 beginnen",
    workspace: "Kursübersicht öffnen",
    factsLabel: "Auf einen Blick",
    progressLabel: "Fortschritt in Mit KI arbeiten",
    lessonsLabel: "Lektionen",
    outcomesHeading: "Was du danach kannst",
    outcomes: [
      { title: "Messen, ob sich KI für eine Aufgabe netto lohnt, und die richtigen Aufgaben zuerst wählen" },
      { title: "Dauerhaften Kontext schlank halten und Werkzeugrechte so vergeben, dass Prompt-Injection wenig anrichten kann" },
      { title: "Zitierte Antworten gegen Quellen prüfen und veraltete Notizen erkennen" },
      { title: "Einen Ablauf mit Prüfungen, Fehlerpfad und Freigabe testen und einen Pilot mit Stoppkriterium planen" },
    ],
    modulesHeading: "Module",
    topicsLabel: "Lektionen im Modul",
    resourcesHeading: "Außerdem",
    resources: [
      { href: "/ai-native/glossar", label: "Glossar", output: "16 Begriffe" },
      { href: "/demos", label: "Praxisbeispiele", output: "Simulationen mit erfundenen Daten" },
      { href: "/ki-fuehrerschein", label: "KI-Führerschein", output: "Empfohlener Einstieg" },
    ],
    boundarySummary: "Zugang, Nachweis und Herkunft",
    boundary: [
      "Der Kurs braucht ein kostenloses Lernkonto, ohne Zahlungsdaten.",
      "Die Live-Übung nutzt ein echtes Modell, wenn der Live-Modus verfügbar ist. Sonst siehst du aufgezeichnete, als solche gekennzeichnete Beispiele.",
      "Der Kurs erklärt keine einzelnen Produkte. Wie du Werkzeuge einrichtest, steht in deren Dokumentation; die Prinzipien hier gelten für jedes.",
      "Die lokale Teilnahmebestätigung beruht auf gespeichertem Fortschritt und Selbstprüfung und ist keine externe Prüfung, Akkreditierung oder Konformitätsbestätigung.",
    ],
  },
  en: {
    title: "Working with AI: measure, safeguard, cite",
    description:
      "Free course with 4 modules and 9 lessons, each with an exercise. Measure net time, limit context and tool permissions, check cited answers and test a workflow with approval. Whatever the tool.",
    home: "Home",
    courses: "Courses",
    courseName: "Working with AI",
    graphDescription:
      "A tool-neutral course on your own work with AI: measure the benefit, limit context and permissions, check sources, safeguard workflows with approval.",
    audience: "Professionals, independent workers and students",
    teaches: [
      "measure the net time of an AI-assisted task",
      "limit tool permissions against prompt injection",
      "check cited AI answers against sources",
      "test a workflow with checks, a fallback path and approval",
    ],
    eyebrow: "Working with AI · free",
    heading: "Measure first. Then automate.",
    intro:
      "For anyone using AI in their own work. You measure whether AI pays off for a task, limit what a tool may see and do, and test a workflow with booby-trapped errors until it holds. Every lesson: one idea with a source, one exercise, two questions.",
    scopeLead: "Scope:",
    scopeBefore: "This course is about your own daily work. ",
    scopeLink: "AI-Native Operator",
    scopeAfter: " covers AI at the level of the whole organisation.",
    start: "Start with lesson 1",
    workspace: "Open course hub",
    factsLabel: "At a glance",
    progressLabel: "Working with AI progress",
    lessonsLabel: "lessons",
    outcomesHeading: "What you can do afterwards",
    outcomes: [
      { title: "Measure whether AI pays off net for a task and pick the right tasks first" },
      { title: "Keep persistent context lean and grant tool permissions so prompt injection can do little damage" },
      { title: "Check cited answers against sources and spot stale notes" },
      { title: "Test a workflow with checks, a fallback path and approval, and plan a pilot with a stop criterion" },
    ],
    modulesHeading: "Modules",
    topicsLabel: "Lessons in this module",
    resourcesHeading: "Also useful",
    resources: [
      { href: "/ai-native/glossar", label: "Glossary", output: "16 terms" },
      { href: "/demos", label: "Practice examples", output: "Simulations with invented data" },
      { href: "/ki-fuehrerschein", label: "Everyday AI Literacy", output: "Recommended first" },
    ],
    boundarySummary: "Access, record, and provenance",
    boundary: [
      "The course needs a free learning account, with no payment details.",
      "The live exercise uses a real model when live mode is available. Otherwise you see recorded examples, labelled as such.",
      "The course does not teach individual products. How to set up a tool is in its documentation; the principles here apply to any of them.",
      "The local completion record rests on stored progress and self-review and is not an external examination, accreditation or compliance finding.",
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
      // The share image is this route's opengraph-image.tsx (the Lemons card, SPEC §3.15).
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
          courseWorkload: "PT1H8M",
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
  // Lessons include their exercise, so the module minutes are the course time.
  const courseMinutes =
    Math.round(
      modules.reduce((sum, module) => sum + module.durationMinutes, 0) / 10,
    ) * 10;
  const trustSignals = getAiNativeTrustSignals(locale);
  const firstLessonHref = localizeHref(
    "/ai-native/kurs/modul_1/messen-1-1",
    locale,
  );

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
              href={firstLessonHref}
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
              ? `ca. ${courseMinutes} Min. mit Übungen`
              : `About ${courseMinutes} min with exercises`,
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

        <p
          data-course-scope
          className="mt-8 max-w-[65ch] text-body leading-relaxed text-foreground"
        >
          <strong>{copy.scopeLead}</strong> {copy.scopeBefore}
          <Link
            href={localizeHref(OPERATOR_PATH, locale)}
            prefetch={false}
            // Vertical padding lifts the in-sentence link to the 44px target
            // floor; the matching negative margin keeps the line box, so the
            // paragraph's rhythm does not change.
            className="-my-3 inline-block py-3 underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            {copy.scopeLink}
          </Link>
          {copy.scopeAfter}
        </p>

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
