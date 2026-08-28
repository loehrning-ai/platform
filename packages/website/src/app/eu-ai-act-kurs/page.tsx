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
    eyebrow: "EU AI Act · Lernpfad Stufe 3",
    heading: "Rollen, Risiken und",
    headingAccent: "Pflichten einordnen.",
    introduction:
      "Der Kurs trennt Grundbegriffe, rechtliche Rollen und operative Schritte. Du arbeitest mit der Verordnung (EU) 2024/1689 in der seit 27. Juli 2026 geltenden geänderten Fassung.",
    start: "Kurs mit Lernkonto starten",
    allCourses: "Alle Kurse",
    imageAlt:
      "Editoriale Prozessgrafik: Bildkarten durchlaufen Prüfstufen, farbige Risikoklassen und einen Abschlusscheck",
    imageLabel: "EU AI Act · 6 Blöcke · 24 Lektionen",
    facts: [
      { value: "6", label: "Blöcke" },
      { value: "24", label: "Lektionen" },
      { value: "1:50", label: "Lernzeit" },
      { value: "Lokal", label: "Teilnahmenachweis" },
    ],
    legalEyebrow: "§ Rechtsgrundlage",
    legalHeading: "Was Artikel 4 tatsächlich verlangt.",
    legalBody:
      "Artikel 4 gilt seit 2. Februar 2025. Anbieter und Betreiber von KI-Systemen müssen Maßnahmen treffen, die die KI-Kompetenz ihrer Beschäftigten und weiterer Personen unterstützen, die in ihrem Auftrag mit den Systemen arbeiten. Vorwissen, Erfahrung, Ausbildung, Nutzungskontext und betroffene Personengruppen sind zu berücksichtigen. Die seit 27. Juli 2026 geltende Fassung verlangt kein garantiertes individuelles Kompetenzniveau.",
    tracksEyebrow: "§ Zwei Zugänge",
    tracks: [
      {
        title: "Blöcke 1–2 · Orientierung",
        body: "Rollen, Geltungsbereich, Fristen, verbotene Praktiken und Risikoklassen. Geeignet ohne juristische Vorkenntnisse.",
      },
      {
        title: "Blöcke 3–6 · Umsetzung",
        body: "Hochrisiko-Pflichten, GPAI, Transparenz, Governance und eine dokumentierbare Arbeitsmethode für Organisationen.",
      },
    ],
    curriculumEyebrow: "§ Curriculum",
    curriculumHeading: "Sechs Blöcke, eine durchgehende Klassifikationslogik.",
    blockLabel: (number: number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count: number) => `${count} Min`,
    total: "24 Lektionen · ca. 1 Std. 50 Min. · Abschlussquiz mit 27 Fragen",
    audienceEyebrow: "§ Für wen",
    audienceHeading: "Für Personen, die KI-Nutzung erklären oder verantworten.",
    audienceBody:
      "Der Einstieg setzt weder Programmierkenntnisse noch ein Jurastudium voraus. Die späteren Blöcke richten sich besonders an Datenschutz, IT, Compliance, Einkauf, Personal und Fachverantwortliche.",
    outcomes: [
      "eine konkrete Nutzung den Rollen Anbieter, Betreiber, Einführer oder Händler zuordnen",
      "verbotene Praktiken, Hochrisiko-Systeme und Transparenzfälle getrennt prüfen",
      "offene Pflichten als belegbare Aufgaben mit Zuständigkeit und Prüfkriterium erfassen",
    ],
    decisionsHeading: "Drei Entscheidungen statt einer Compliance-Behauptung.",
    evidenceEyebrow: "§ Aussagekraft",
    evidenceHeading: "Was der Teilnahmenachweis belegt.",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokalen Abschlussquiz.",
      "Zeitabhängige Rechtsangaben im Kurs wurden zuletzt am 28. Juli 2026 geprüft.",
    ],
    disclaimerLabel: "Hinweis:",
    disclaimer:
      "Bildungsangebot, keine Rechtsberatung: Der Nachweis ist weder akkreditiert noch serverseitig signiert. Teilnahme oder Teilnahmenachweis allein belegen weder Kompetenz noch die Erfüllung von Artikel 4; Systeminventur, Rollenklärung, Risikoklassifizierung und organisationsbezogene Kontrollen bleiben erforderlich.",
    factsLabel: "Kursrahmen",
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
    eyebrow: "EU AI Act · Learning path stage 3",
    heading: "Map roles, risks,",
    headingAccent: "and duties.",
    introduction:
      "This course separates foundational concepts, legal roles, and operational steps. It uses Regulation (EU) 2024/1689 in the amended version in force since 27 July 2026.",
    start: "Start with a learning account",
    allCourses: "All courses",
    imageAlt:
      "Editorial process graphic showing image cards passing through review stages, colour-coded risk classes, and a final check",
    imageLabel: "EU AI Act · 6 blocks · 24 lessons",
    facts: [
      { value: "6", label: "Blocks" },
      { value: "24", label: "Lessons" },
      { value: "1:50", label: "Study time" },
      { value: "Local", label: "Completion record" },
    ],
    legalEyebrow: "§ Legal basis",
    legalHeading: "What Article 4 actually requires.",
    legalBody:
      "Article 4 has applied since 2 February 2025. Providers and deployers of AI systems must take measures that support the development of AI literacy among staff and other people who work with those systems on their behalf. Prior knowledge, experience, education, context of use, and affected groups must be considered. The version in force since 27 July 2026 does not require a guaranteed level of individual AI literacy.",
    tracksEyebrow: "§ Two entry points",
    tracks: [
      {
        title: "Blocks 1–2 · Orientation",
        body: "Roles, scope, application dates, prohibited practices, and risk categories. No legal background required.",
      },
      {
        title: "Blocks 3–6 · Implementation",
        body: "High-risk duties, GPAI, transparency, governance, and a documented working method for organizations.",
      },
    ],
    curriculumEyebrow: "§ Curriculum",
    curriculumHeading: "Six blocks, one consistent classification method.",
    blockLabel: (number: number) => `Block ${String(number).padStart(2, "0")}`,
    minutes: (count: number) => `${count} min`,
    total: "24 lessons · about 1 hour 50 minutes · 27-question final quiz",
    audienceEyebrow: "§ Who it is for",
    audienceHeading: "For people who explain or govern AI use.",
    audienceBody:
      "The opening blocks require neither programming skills nor legal training. The later blocks are especially relevant to data protection, IT, compliance, procurement, HR, and operational owners.",
    outcomes: [
      "assign a specific use to the provider, deployer, importer, or distributor role",
      "assess prohibited practices, high-risk systems, and transparency cases separately",
      "record open duties as evidence-based tasks with an owner and verification criterion",
    ],
    decisionsHeading: "Three decisions instead of a compliance claim.",
    evidenceEyebrow: "§ Scope of the record",
    evidenceHeading: "What the completion record establishes.",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "Time-dependent legal statements in the course were last reviewed on 28 July 2026.",
    ],
    disclaimerLabel: "Scope:",
    disclaimer:
      "Educational material, not legal advice: the record is neither accredited nor server-signed. Participation or a completion record alone establishes neither competence nor compliance with Article 4; a system inventory, role analysis, risk classification, and organization-specific controls remain necessary.",
    factsLabel: "Course frame",
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
              eyebrow={copy.audienceEyebrow}
              title={copy.decisionsHeading}
            />
            <div className="border-y border-border">
              <p className="border-b border-border py-3 text-sm leading-relaxed text-muted-foreground">
                {copy.audienceBody}
              </p>
              <ol>
                {copy.outcomes.map((outcome, index) => (
                  <li
                    key={outcome}
                    className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-3 last:border-b-0"
                  >
                    <span className="font-mono text-xs tabular-nums text-brand-orange">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="break-words text-sm font-medium leading-relaxed text-foreground">
                      {outcome}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="mt-10">
            <TechnicalCourseSectionHeading
              eyebrow={copy.tracksEyebrow}
              title={copy.audienceHeading}
            />
            <div className="mt-5 grid border-y border-border sm:grid-cols-2">
              {copy.tracks.map((track) => (
                <article
                  key={track.title}
                  className="min-w-0 border-b border-border py-4 sm:border-b-0 sm:border-r sm:px-4 sm:first:pl-0 sm:last:border-r-0"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    {track.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {track.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <TechnicalCourseSectionHeading
              eyebrow={copy.curriculumEyebrow}
              title={copy.curriculumHeading}
              intro={copy.total}
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
                  {copy.legalHeading}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {copy.legalBody}
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
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">
                    {copy.disclaimerLabel}
                  </strong>{" "}
                  {copy.disclaimer}
                </p>
              </div>
            </div>
          </details>

          <Link
            href={localizeHref("/ai-native", locale)}
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
