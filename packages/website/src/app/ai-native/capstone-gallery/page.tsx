import type { Metadata } from "next";
import Link from "next/link";
import {
  TECHNICAL_COURSE_PRIMARY_ACTION_CLASS,
  TECHNICAL_COURSE_SECONDARY_ACTION_CLASS,
  TechnicalCourseFrame,
  TechnicalCourseHeader,
  TechnicalCourseSectionHeading,
} from "@/components/course/technical-course-landing";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { buildLocaleAlternates, localizeHref } from "@/lib/i18n/locale";
import { SITE_URL } from "@/lib/seo/json-ld";
import { resolveFoundationCourseContentLocale } from "@/lib/course/localization";

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const title =
    locale === "en"
      ? "Capstone publication policy: AI-Native course"
      : "Capstone-Veröffentlichungsregeln: AI-Native Arbeitskurs";
  const description =
    locale === "en"
      ? "Publication criteria and the current empty state of the AI-Native capstone collection. No entries are published without evidence and explicit consent."
      : "Veröffentlichungskriterien und aktueller leerer Stand der AI-Native-Capstone-Sammlung. Keine Veröffentlichung ohne Beleg und ausdrückliche Freigabe.";
  const localizedPath = localizeHref("/ai-native/capstone-gallery", locale);
  const url = `${SITE_URL}${localizedPath}`;
  const alternates = buildLocaleAlternates("/ai-native/capstone-gallery", [
    "de",
    "en",
  ]);
  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { ...alternates, canonical: localizedPath },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: locale === "en" ? "en_GB" : "de_DE",
    },
  };
}

const RUBRIC: readonly (readonly [string, string])[] = [
  [
    "Problem ist echt",
    "Der Workflow löst ein Problem, das wirklich existiert, nicht eins, das für den Kurs erfunden wurde.",
  ],
  [
    "Scope realistisch",
    "Der Capstone ist in 7 Tagen / 10-15 Stunden als Pilot prüfbar. Kein Moonshot.",
  ],
  [
    "Claude-first Architektur",
    "Claude steht im Zentrum, nicht als Plugin neben anderer Logik.",
  ],
  [
    "Pilotiert im Arbeitsalltag",
    "Wird begrenzt eingesetzt oder anhand echter Arbeitsdaten nachgestellt. Keine reine Folienübung.",
  ],
  [
    "DSGVO-dokumentiert",
    "Datenklassifikation, AVV-Status, Zweckbindung klar benannt.",
  ],
  [
    "AI-Act-Check gemacht",
    "Annex-III-Klassifikation dokumentiert. Provider- vs. Deployer-Rolle bekannt.",
  ],
  [
    "Ablösbar",
    "Eine andere Person kann Eingaben, Kontrollen, Zuständigkeit und Wiederanlauf aus der Dokumentation nachvollziehen.",
  ],
];

const RUBRIC_EN: readonly (readonly [string, string])[] = [
  [
    "Real problem",
    "The workflow addresses an observed need rather than a problem invented for the course.",
  ],
  [
    "Bounded scope",
    "The pilot can be tested within seven days and 10 to 15 hours, with a defined stop condition.",
  ],
  [
    "Clear role for Claude",
    "The workflow states what Claude assists with and what remains a human responsibility.",
  ],
  [
    "Tested in context",
    "The process is tested in a bounded work context or with representative synthetic data, not only described in slides.",
  ],
  [
    "Data handling documented",
    "Data categories, purpose, approved tools and processing terms are recorded where relevant.",
  ],
  [
    "AI Act review recorded",
    "The relevant role and risk-classification questions are documented. The course does not provide a legal determination.",
  ],
  [
    "Transferable",
    "Another person can understand the inputs, controls, owner and recovery steps from the documentation.",
  ],
];

export default async function CapstoneGalleryPage() {
  const locale = resolveFoundationCourseContentLocale(
    "ai-native",
    await getRequestLocale(),
  );
  const isEnglish = locale === "en";
  const rubric = isEnglish ? RUBRIC_EN : RUBRIC;
  return (
    <TechnicalCourseFrame courseId="ai-native-capstone-policy" lang={locale}>
      <TechnicalCourseHeader
        eyebrow={
          isEnglish
            ? "Publication policy · current state"
            : "Veröffentlichungsregeln · aktueller Stand"
        }
        title={
          isEnglish
            ? "No published capstones."
            : "Noch keine veröffentlichten Capstones."
        }
        intro={
          isEnglish
            ? "The collection stays empty until a real project meets every publication criterion and its author explicitly consents."
            : "Die Sammlung bleibt leer, bis ein reales Projekt jedes Veröffentlichungskriterium erfüllt und die Autorin oder der Autor ausdrücklich zustimmt."
        }
        primaryAction={
          <Link
            href={localizeHref("/ai-native/kurs/modul_1", locale)}
            prefetch={false}
            className={TECHNICAL_COURSE_PRIMARY_ACTION_CLASS}
            data-workspace-primary-action="true"
          >
            {isEnglish ? "Start module 1" : "Modul 1 starten"}
            <span aria-hidden="true">→</span>
          </Link>
        }
        secondaryAction={
          <Link
            href={localizeHref("/ai-native", locale)}
            className={TECHNICAL_COURSE_SECONDARY_ACTION_CLASS}
          >
            {isEnglish ? "Course overview" : "Kursübersicht"}
          </Link>
        }
        facts={[
          isEnglish ? "0 published entries" : "0 veröffentlichte Einträge",
          isEnglish ? "7 publication criteria" : "7 Veröffentlichungskriterien",
          isEnglish
            ? "Evidence and privacy review required"
            : "Belege und Datenschutzprüfung nötig",
          isEnglish
            ? "Explicit consent required"
            : "Ausdrückliche Freigabe nötig",
        ]}
        factsLabel={
          isEnglish ? "Publication boundary" : "Veröffentlichungsgrenze"
        }
      />

      <div>
        <section className="mt-10">
          <TechnicalCourseSectionHeading
            eyebrow={
              isEnglish ? "Publication rubric" : "Veröffentlichungsrubrik"
            }
            title={
              isEnglish ? "Seven binary checks." : "Sieben binäre Prüfungen."
            }
            intro={
              isEnglish
                ? "Five points meet the course self-review threshold. Publication requires all seven plus evidence, privacy review, and consent."
                : "Fünf Punkte erfüllen die Kursschwelle der Selbstprüfung. Veröffentlichung verlangt alle sieben plus Belege, Datenschutzprüfung und Freigabe."
            }
          />

          <ol className="mt-5 border-t border-foreground">
            {rubric.map(([title, description], index) => (
              <li
                key={title}
                className="grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-border py-4 sm:grid-cols-[3rem_13rem_minmax(0,1fr)] sm:gap-5"
              >
                <span className="font-mono text-xs font-bold text-brand-orange">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          role="status"
          className="mt-10 grid min-w-0 gap-3 border-y border-foreground py-5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6"
        >
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-brand-orange">
              {isEnglish ? "Current state" : "Aktueller Stand"}
            </p>
            <p className="mt-1 text-xl font-bold text-foreground">
              0 {isEnglish ? "entries" : "Einträge"}
            </p>
          </div>
          <p className="max-w-[680px] text-sm leading-relaxed text-muted-foreground">
            {isEnglish
              ? "No capstone has been approved. An entry appears only after every criterion, privacy review, supporting evidence, and documented consent have been checked."
              : "Kein Capstone ist freigegeben. Ein Eintrag erscheint erst nach Prüfung aller Kriterien, Datenschutzprüfung, Belegen und dokumentierter Freigabe."}
          </p>
        </section>

        <details className="mt-10 border-y border-border">
          <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-4 font-mono text-xs font-bold uppercase tracking-[0.08em] text-foreground">
            {isEnglish
              ? "Completion and publication boundary"
              : "Grenze zwischen Abschluss und Veröffentlichung"}
            <span className="text-brand-orange" aria-hidden="true">
              +
            </span>
          </summary>
          <div className="border-t border-border py-4 text-[13px] leading-relaxed text-muted-foreground">
            <p>
              {isEnglish
                ? "No invented projects, placeholder profiles, or promised publication dates are used. The empty state is deliberate."
                : "Es gibt keine erfundenen Projekte, Platzhalterprofile oder angekündigten Veröffentlichungstermine. Der leere Zustand ist beabsichtigt."}
            </p>
            <p className="mt-2">
              {isEnglish
                ? "Course completion and publication are separate. Publishing a capstone is never required to complete the course."
                : "Kursabschluss und Veröffentlichung sind getrennt. Ein veröffentlichter Capstone ist nie Voraussetzung für den Kursabschluss."}
            </p>
          </div>
        </details>
      </div>
    </TechnicalCourseFrame>
  );
}
