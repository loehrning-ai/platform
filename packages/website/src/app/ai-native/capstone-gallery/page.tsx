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
    "Der Workflow löst einen Bedarf, der im Arbeitsalltag beobachtet wurde.",
  ],
  [
    "Scope realistisch",
    "Als Pilot in 7 Tagen und 10 bis 15 Stunden prüfbar, mit festem Abbruchkriterium.",
  ],
  [
    "Klare Rolle für Claude",
    "Festgehalten ist, wobei Claude hilft und was bei Menschen bleibt.",
  ],
  [
    "Im Kontext getestet",
    "Getestet im begrenzten Arbeitseinsatz oder mit repräsentativen synthetischen Daten.",
  ],
  [
    "Datenumgang dokumentiert",
    "Datenkategorien, Zweck, freigegebene Tools und Verarbeitungsbedingungen (etwa AVV) sind festgehalten.",
  ],
  [
    "AI-Act-Prüfung notiert",
    "Rolle und Risikoklasse nach Annex III sind als Fragen dokumentiert. Der Kurs trifft keine rechtliche Feststellung.",
  ],
  [
    "Ablösbar",
    "Eine andere Person versteht aus der Dokumentation Eingaben, Kontrollen, Zuständigkeit und Wiederanlauf.",
  ],
];

const RUBRIC_EN: readonly (readonly [string, string])[] = [
  [
    "Real problem",
    "The workflow addresses a need observed at work.",
  ],
  [
    "Bounded scope",
    "Testable as a pilot in 7 days and 10 to 15 hours, with a defined stop condition.",
  ],
  [
    "Clear role for Claude",
    "It records what Claude assists with and what stays with people.",
  ],
  [
    "Tested in context",
    "Tested in bounded work use or with representative synthetic data.",
  ],
  [
    "Data handling documented",
    "Data categories, purpose, approved tools and processing terms (such as a DPA) are recorded.",
  ],
  [
    "AI Act review recorded",
    "Role and Annex III risk-class questions are documented. The course makes no legal determination.",
  ],
  [
    "Transferable",
    "Another person understands inputs, controls, owner and recovery from the documentation.",
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
            ? "The collection stays empty until a real project meets every criterion and its author consents."
            : "Die Sammlung bleibt leer, bis ein reales Projekt alle Kriterien erfüllt und die Autorin oder der Autor zustimmt."
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
                ? "Five points pass the course self-review; publication needs all seven."
                : "Fünf Punkte reichen für die Selbstprüfung im Kurs, eine Veröffentlichung braucht alle sieben."
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
                <p className="col-start-2 text-[13px] leading-relaxed text-muted-foreground sm:col-start-auto">
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
                ? "This page shows no invented projects, placeholder profiles or announced dates."
                : "Hier stehen keine erfundenen Projekte, Platzhalterprofile oder angekündigten Termine."}
            </p>
            <p className="mt-2">
              {isEnglish
                ? "You can complete the course without publishing a capstone."
                : "Für den Kursabschluss musst du keinen Capstone veröffentlichen."}
            </p>
          </div>
        </details>
      </div>
    </TechnicalCourseFrame>
  );
}
