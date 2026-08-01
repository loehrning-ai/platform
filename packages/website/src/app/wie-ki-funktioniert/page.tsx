import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { WIE_KI_META, WIE_KI_LEKTIONEN } from "@/lib/wie-ki-funktioniert";

export const metadata: Metadata = {
  title: "Wie KI wirklich funktioniert: 4 Lektionen kostenlos",
  description:
    "Token-Vorhersage, Trainingsdaten und Bias, Halluzinationen, KI-Grenzen. Vier Lektionen für neugierige Menschen ohne technisches Vorwissen. Kostenlos, kein Login.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/wie-ki-funktioniert" },
  openGraph: {
    title: "Wie KI wirklich funktioniert: 4 Lektionen kostenlos",
    description:
      "Token-Vorhersage, Trainingsdaten und Bias, Halluzinationen, KI-Grenzen. Vier Lektionen ohne Vorwissen.",
    url: `${SITE_URL}/wie-ki-funktioniert`,
    siteName: "loehrning.ai",
    locale: "de_DE",
    type: "website",
  },
};

const COURSE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: WIE_KI_META.title,
  description: WIE_KI_META.subtitle,
  url: `${SITE_URL}/wie-ki-funktioniert`,
  inLanguage: "de",
  isAccessibleForFree: true,
  educationalLevel: "Beginner",
  provider: { "@id": ORG_ID },
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    url: `${SITE_URL}/wie-ki-funktioniert`,
  },
};

export default function WieKiFunktioniertPage() {
  return (
    <>
      <JsonLd data={COURSE_SCHEMA} id="wie-ki-funktioniert-course-jsonld" />

      <div className="mx-auto max-w-[780px] px-6 pb-32 pt-20">
        {/* Breadcrumb */}
        <nav aria-label="Brotkrümelnavigation" className="mb-8">
          <ol className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Startseite
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li className="text-foreground" aria-current="page">
              Wie KI wirklich funktioniert
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-3 h-[3px] w-[120px] bg-brand-orange" />
        <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Konzeptblock · Stufe 1: Prüfen
        </p>
        <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[48px]">
          {WIE_KI_META.title}
        </h1>
        <p className="mt-4 text-[18px] leading-[1.6] text-muted-foreground">
          {WIE_KI_META.subtitle}
        </p>
        <p className="mt-3 font-mono text-[12px] text-muted-foreground">
          Vier Lektionen, keine Vorkenntnisse nötig, kein Login.
          Gesamtdauer: ca. {WIE_KI_META.durationMinutes} Minuten.
        </p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          Du kannst jederzeit unterbrechen und weitermachen.
        </p>

        {/* Lesson cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2" data-testid="lektion-cards">
          {WIE_KI_LEKTIONEN.map((lektion) => (
            <Link
              key={lektion.id}
              href={`/wie-ki-funktioniert/${lektion.id}`}
              className="group border-2 border-border bg-card p-5 transition-colors hover:border-brand-orange hover:bg-background"
            >
              <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                Lektion {lektion.number} · {lektion.durationMinutes} Min.
              </span>
              <h2 className="mt-2 text-[17px] font-bold leading-[1.2] tracking-[-0.02em] text-foreground group-hover:text-brand-orange">
                {lektion.title}
              </h2>
              <p className="mt-2 text-[13px] leading-[1.5] text-muted-foreground">
                {lektion.subtitle}
              </p>
              <span className="mt-4 block font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-brand-orange">
                Lektion starten &#8594;
              </span>
            </Link>
          ))}
        </div>

        {/* Context footer */}
        <div className="mt-16 border border-border bg-card p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-brand-orange">
            Wie geht es weiter?
          </p>
          <p className="mt-3 text-[15px] leading-[1.6] text-muted-foreground">
            Dieser Konzeptblock ist der Einstieg. Der nächste Schritt ist der KI-Führerschein,
            ein kostenloser Kurs der dir zeigt, wie du KI im Alltag sicher nutzt.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/ki-fuehrerschein"
              className="inline-flex items-center gap-2 bg-brand-orange px-5 py-3 font-mono text-[12px] font-bold text-white transition-colors hover:bg-brand-orange/90"
            >
              Zum KI-Führerschein &#8594;
            </Link>
            <Link
              href="/einstieg"
              className="inline-flex items-center gap-2 border border-border bg-background px-5 py-3 font-mono text-[12px] font-bold text-foreground transition-colors hover:bg-card"
            >
              Zum Einstieg zurück
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
