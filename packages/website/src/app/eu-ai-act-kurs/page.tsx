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
      "Abstrakte Kursillustration mit Regelwerk, Prüfschritten und europäischen Sternen",
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
    evidenceEyebrow: "§ Aussagekraft",
    evidenceHeading: "Was der Teilnahmenachweis belegt.",
    evidence: [
      "Er dokumentiert den Abschluss dieses Kurses und das Ergebnis des lokalen Abschlussquiz.",
      "Er ist nicht akkreditiert, nicht serverseitig signiert und keine Rechts- oder Compliance-Bestätigung.",
      "Ein Kurs ersetzt weder eine Systeminventur noch Rollenklärung, Risikoklassifizierung oder organisationsbezogene Kontrollen.",
      "Zeitabhängige Rechtsangaben im Kurs wurden zuletzt am 28. Juli 2026 geprüft.",
    ],
    disclaimerLabel: "Hinweis:",
    disclaimer:
      "Der Kurs dient der Bildung und ersetzt keine Rechtsberatung. Eine Teilnahme allein begründet keine Vermutung der Erfüllung von Artikel 4 oder anderer Pflichten der EU-KI-Verordnung.",
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
      "Abstract course illustration combining a rulebook, review steps, and European stars",
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
    evidenceEyebrow: "§ Scope of the record",
    evidenceHeading: "What the completion record establishes.",
    evidence: [
      "It records completion of this course and the result of the locally administered final quiz.",
      "It is not accredited, server-signed, or evidence of legal compliance.",
      "A course does not replace a system inventory, role analysis, risk classification, or organization-specific controls.",
      "Time-dependent legal statements in the course were last reviewed on 28 July 2026.",
    ],
    disclaimerLabel: "Scope:",
    disclaimer:
      "This course is educational and is not legal advice. Participation alone does not create a presumption of compliance with Article 4 or any other obligation under the EU AI Act.",
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
          url: `${SITE_URL}/course-covers/eu-ai-act-kurs-cover-v2.webp`,
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
          courseWorkload: "PT1H50M",
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

export default async function EuAiActKursLandingPage() {
  const locale = resolveFoundationCourseContentLocale(
    COURSE_SLUG,
    await getRequestLocale(),
  );
  const copy = LANDING_COPY[locale];
  const blocks = getBlocks(COURSE_SLUG, locale);
  const courseHref = localizeHref(`${COURSE_PATH}/kurs`, locale);

  return (
    <>
      <JsonLd data={courseGraph(locale)} id="eu-ai-act-landing-jsonld" />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-24 pt-12 sm:px-6 sm:pb-32 sm:pt-20">
        <div className="mb-9 h-[3px] w-[132px] bg-brand-orange sm:w-[154px]" />

        <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:items-end">
          <div className="min-w-0">
            <p className="break-words font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-brand-orange sm:tracking-[0.18em]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-6 max-w-[900px] break-words text-[40px] font-bold leading-[0.94] tracking-[-0.04em] text-foreground [overflow-wrap:anywhere] sm:text-[56px] md:text-[76px]">
              {copy.heading}
              <br />
              {" "}
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
              src="/course-covers/eu-ai-act-kurs-cover-v2.webp"
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
              className="min-w-0 border-b border-r border-border px-4 py-5 sm:px-5"
            >
              <dt className="break-words font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {fact.label}
              </dt>
              <dd className="mt-1 break-words text-[22px] font-bold tracking-[-0.03em] text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-20 grid gap-7 border-t-2 border-foreground pt-8 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] md:gap-12">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.legalEyebrow}
          </p>
          <div className="min-w-0">
            <h2 className="break-words text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[38px]">
              {copy.legalHeading}
            </h2>
            <p className="mt-5 max-w-[760px] break-words text-[16px] leading-[1.65] text-muted-foreground sm:text-[18px]">
              {copy.legalBody}
            </p>
          </div>
        </section>

        <section className="mt-16 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] sm:p-9">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.tracksEyebrow}
          </p>
          <div className="mt-6 grid gap-px bg-border sm:grid-cols-2">
            {copy.tracks.map((track) => (
              <article key={track.title} className="min-w-0 bg-card p-5 sm:p-6">
                <h2 className="break-words text-[18px] font-bold text-foreground [overflow-wrap:anywhere]">
                  {track.title}
                </h2>
                <p className="mt-3 break-words text-[14px] leading-[1.6] text-muted-foreground">
                  {track.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.curriculumEyebrow}
          </p>
          <h2 className="mt-4 max-w-[820px] break-words text-[30px] font-bold tracking-[-0.03em] text-foreground sm:text-[42px]">
            {copy.curriculumHeading}
          </h2>

          <ol className="mt-10 border-t border-border">
            {blocks.map((block, index) => (
              <li
                key={block.id}
                className="grid min-w-0 gap-3 border-b border-border py-7 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-baseline sm:gap-7"
              >
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  {copy.blockLabel(index + 1)}
                </p>
                <div className="min-w-0">
                  <h3 className="break-words text-[18px] font-semibold leading-snug text-foreground [overflow-wrap:anywhere] sm:text-[20px]">
                    {block.title}
                  </h3>
                  <p className="mt-2 max-w-[680px] break-words text-[15px] leading-[1.6] text-muted-foreground">
                    {block.description}
                  </p>
                </div>
                <p className="font-mono text-[12px] text-muted-foreground">
                  {copy.minutes(block.durationMinutes)}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 break-words font-mono text-[12px] text-muted-foreground">
            {copy.total}
          </p>
        </section>

        <section className="mt-24 grid min-w-0 gap-8 border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_var(--color-foreground)] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:p-10">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              {copy.audienceEyebrow}
            </p>
            <h2 className="mt-3 break-words text-[25px] font-bold tracking-[-0.025em] text-foreground sm:text-[31px]">
              {copy.audienceHeading}
            </h2>
            <p className="mt-4 break-words text-[15px] leading-[1.65] text-muted-foreground">
              {copy.audienceBody}
            </p>
          </div>
          <ul className="min-w-0 border-t border-border md:border-l md:border-t-0 md:pl-8">
            {copy.outcomes.map((outcome, index) => (
              <li
                key={outcome}
                className="grid min-w-0 grid-cols-[30px_minmax(0,1fr)] gap-3 border-b border-border py-4 text-[15px] leading-[1.55] text-foreground"
              >
                <span className="font-mono text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="break-words [overflow-wrap:anywhere]">
                  {outcome}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20 grid gap-7 border-t-2 border-foreground pt-8 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)] md:gap-12">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            {copy.evidenceEyebrow}
          </p>
          <div className="min-w-0">
            <h2 className="break-words text-[28px] font-bold tracking-[-0.03em] text-foreground sm:text-[38px]">
              {copy.evidenceHeading}
            </h2>
            <ul className="mt-6 border-t border-border">
              {copy.evidence.map((item) => (
                <li
                  key={item}
                  className="grid min-w-0 grid-cols-[18px_minmax(0,1fr)] gap-3 border-b border-border py-4 text-[15px] leading-[1.6] text-muted-foreground"
                >
                  <span aria-hidden="true" className="text-brand-orange">
                    →
                  </span>
                  <span className="break-words [overflow-wrap:anywhere]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="mt-12 border border-border bg-muted/30 p-5 text-[13px] leading-[1.65] text-muted-foreground sm:p-6">
          <strong className="text-foreground">{copy.disclaimerLabel}</strong>{" "}
          {copy.disclaimer}
        </aside>

        <div className="mt-16 flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
          <Link href={courseHref} prefetch={false} className={PRIMARY_CTA}>
            {copy.start}
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={localizeHref("/ai-native", locale)}
            className={SECONDARY_CTA}
          >
            {copy.nextCourse}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </main>
    </>
  );
}
