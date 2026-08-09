import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandButton } from "@/components/ui/brand-button";
import {
  SectionShell,
  ClipHeading,
  Eyebrow,
  FadeBlock,
} from "@/components/ai-native/primitives";
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
  const alternates = buildLocaleAlternates("/ai-native/capstone-gallery", ["de", "en"]);
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
    <>
      {/* Hero */}
      <section className="bg-background py-20 md:py-24">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <nav
            aria-label="Breadcrumb"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            <Link href={localizeHref("/ai-native", locale)} className="hover:text-brand-orange">
              {isEnglish ? "Course" : "Kurs"}
            </Link>
            <span className="mx-2 opacity-40">/</span>
            <span className="text-brand-orange">
              {isEnglish ? "Publication policy" : "Veröffentlichungsregeln"}
            </span>
          </nav>

          <div className="mt-8 flex flex-wrap items-baseline gap-6">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">
              {isEnglish ? "Publication status · empty" : "Veröffentlichungsstatus · leer"}
            </span>
          </div>

          <ClipHeading
            as="h1"
            className="mt-4 bg-background font-bold leading-[0.92] tracking-[-0.04em] text-foreground"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            {isEnglish ? "No published" : "Noch keine"}
            <br />
            <span className="text-brand-orange">{isEnglish ? "capstones." : "veröffentlichten Capstones."}</span>
          </ClipHeading>

          <FadeBlock delay={2}>
            <p className="mt-8 max-w-[640px] text-[18px] leading-[1.6] text-muted-foreground">
              {isEnglish
                ? "This collection remains empty until a real project meets the rubric and its author explicitly consents to publication."
                : "Diese Sammlung bleibt leer, bis ein reales Projekt die Rubrik erfüllt und die Autorin oder der Autor der Veröffentlichung ausdrücklich zugestimmt hat."}
            </p>
            <p className="mt-4 max-w-[640px] text-[15px] text-muted-foreground">
              {isEnglish
                ? "No invented projects, placeholder profiles or promised publication dates."
                : "Keine erfundenen Projekte, Platzhalterprofile oder angekündigten Veröffentlichungsdaten."}
            </p>
          </FadeBlock>
        </div>
      </section>

      {/* 7-point rubric */}
      <SectionShell num="R" label={isEnglish ? "Publication rubric" : "Veröffentlichungsrubrik"}>
        <Eyebrow>{isEnglish ? "Publication criteria" : "Veröffentlichungskriterien"}</Eyebrow>
        <ClipHeading
          as="h2"
          className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
          style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
        >
          {isEnglish ? "Seven explicit criteria." : "Sieben klare Kriterien."}
        </ClipHeading>
        <FadeBlock delay={1}>
          <p className="mt-5 max-w-[640px] text-[16px] leading-[1.65] text-muted-foreground">
            {isEnglish
              ? "The learner performs a binary seven-point self-review. Five points meet the course threshold. Publication requires all seven, supporting evidence, privacy review and explicit consent."
              : "Die lernende Person führt eine binäre Selbstprüfung mit sieben Punkten durch. Fünf Punkte erfüllen die Kursschwelle. Für eine Veröffentlichung sind alle sieben, Belege, Datenschutzprüfung und ausdrückliche Freigabe nötig."}
          </p>
        </FadeBlock>

        <ol className="mt-12 border-t border-foreground">
          {rubric.map(([title, desc], i) => (
            <li
              key={title}
              className="grid grid-cols-[60px_1fr] gap-6 border-b border-border px-1 py-5"
            >
              <span className="font-mono text-[14px] font-bold tracking-[0.06em] text-brand-orange">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-[18px] font-bold tracking-[-0.02em] text-foreground">
                  {title}
                </h3>
                <p className="mt-1.5 text-[14.5px] leading-[1.55] text-muted-foreground">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SectionShell>

      {/* Truthful empty state */}
      <section className="border-y border-border bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-[960px] px-6 lg:px-12">
          <Eyebrow>{isEnglish ? "Current state" : "Aktueller Stand"}</Eyebrow>
          <ClipHeading
            as="h2"
            className="mt-2.5 font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            {isEnglish ? "No entries." : "Noch keine Einträge."}
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-5 max-w-[640px] text-[16px] leading-[1.6] text-muted-foreground">
              {isEnglish
                ? "No capstone has been approved for publication. The empty state is shown deliberately."
                : "Derzeit ist kein Capstone zur Veröffentlichung freigegeben. Der leere Zustand bleibt absichtlich sichtbar."}
            </p>
          </FadeBlock>
          <div
            role="status"
            className="mt-10 border border-dashed border-border bg-background px-7 py-10"
          >
            <p className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brand-orange">
              0 {isEnglish ? "published capstones" : "veröffentlichte Capstones"}
            </p>
            <p className="mt-3 max-w-[620px] text-[15px] leading-[1.6] text-muted-foreground">
              {isEnglish
                ? "An entry appears only after the seven criteria, privacy review and documented consent have been checked."
                : "Ein Eintrag erscheint erst nach Prüfung der sieben Kriterien, Datenschutzprüfung und dokumentierter Freigabe."}
            </p>
          </div>
        </div>
      </section>

      {/* Course continuation */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-[720px] px-6 lg:px-12">
          <ClipHeading
            as="h2"
            className="bg-background font-bold leading-none tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
          >
            {isEnglish ? "Develop a bounded capstone." : "Einen begrenzten Capstone entwickeln."}
          </ClipHeading>
          <FadeBlock delay={1}>
            <p className="mt-5 text-[17px] leading-[1.6] text-muted-foreground">
              {isEnglish
                ? "The course moves from problem definition to a bounded, reviewable pilot. Publication is separate and is never required for course completion."
                : "Der Kurs führt von der Problemdefinition zu einem begrenzten, prüfbaren Pilot. Eine Veröffentlichung ist davon getrennt und nie Voraussetzung für den Kursabschluss."}
            </p>
          </FadeBlock>
          <FadeBlock delay={2}>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <BrandButton
                href={localizeHref("/ai-native/kurs/modul_1", locale)}
                prefetch={false}
                variant="primary"
              >
                {isEnglish ? "Start module 1" : "Modul 1 starten"} <ArrowRight size={14} />
              </BrandButton>
              <BrandButton href={localizeHref("/ai-native#os-bundle", locale)} variant="outline">
                {isEnglish ? "View course materials" : "Lernmaterialien ansehen"}
              </BrandButton>
            </div>
          </FadeBlock>
        </div>
      </section>
    </>
  );
}
