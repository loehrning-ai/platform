import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getBlocks } from "@/lib/course/data";

export const metadata: Metadata = {
  title: "KI im Alltag verstehen: kostenloser KI-Kurs auf Deutsch",
  description:
    "Kostenloser Kurs: KI im Alltag verstehen. 5 Blöcke, 18 Lektionen, ca. 1 Std. 40 Min., lokale Teilnahmebestätigung. Für Erwachsene ohne Vorkenntnisse. Auf Deutsch.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/ki-fuehrerschein" },
  openGraph: {
    title: "KI im Alltag: Was du wissen solltest (kostenlos)",
    description:
      "5 Blöcke, 18 Lektionen, ca. 1 Std. 40 Min. Keine Vorkenntnisse nötig. Lokale Teilnahmebestätigung. Kostenlos mit Lernkonto. Auf Deutsch.",
    url: `${SITE_URL}/ki-fuehrerschein`,
    type: "website",
  },
};

const COURSE_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "KI-Führerschein",
          item: `${SITE_URL}/ki-fuehrerschein`,
        },
      ],
    },
    {
      "@type": "Course",
      name: "KI im Alltag: Was du wissen solltest",
      description:
        "Kostenloser, 5-blöckiger Online-Kurs zur KI-Kompetenz. 18 Lektionen, ca. 1 Std. 40 Min., lokale Teilnahmebestätigung. Für Erwachsene in Deutschland ohne Vorkenntnisse.",
      provider: { "@id": ORG_ID },
      inLanguage: "de",
      isAccessibleForFree: true,
      educationalLevel: "Beginner",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "Erwachsene in Deutschland ohne Vorkenntnisse",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT1H40M",
        inLanguage: "de",
      },
    },
  ],
};

// Canonical loehrning.ai retro-brutalist CTA. Kupfer fill + 2px foreground
// border + 4px offset shadow that grows on hover, font-mono uppercase.
// Mirrors the .btnPrimary class used in leistungen.module.css so the two
// course landings sit visually flush with the rest of the site.
const PRIMARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

const SECONDARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

export default async function KiFuehrerscheinLandingPage() {
  const blocks = getBlocks("ki-fuehrerschein");

  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="ki-fuehrerschein-landing-jsonld" />
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        {/* Top rule — brand signature */}
        <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          § KI-Führerschein · Kostenloser Grundlagenkurs
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[56px] md:text-[88px]">
          KI im Alltag:<br />
          <span className="text-brand-orange">Was du wissen solltest.</span>
        </h1>

        <p className="mt-9 max-w-[780px] text-[18px] leading-[1.5] text-muted-foreground sm:text-[21px]">
          Dieser Kurs erklärt, wie KI funktioniert, was du dabei beachten solltest und wie du KI sinnvoll im Alltag einsetzt.
          Keine Vorkenntnisse nötig: fünf Blöcke, 18 Lektionen, ca. 1 Std. 40 Min., lokale Teilnahmebestätigung, Fortschritt im Lernkonto.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-5">
          <Link href="/ki-fuehrerschein/kurs" className={PRIMARY_CTA}>
            Kurs starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/kurse" className={SECONDARY_CTA}>
            Alle Kurse
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Why this course exists */}
        <section className="mt-20 border-l-4 border-brand-orange bg-card p-6 sm:p-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            § Warum gibt es diesen Kurs?
          </div>
          <p className="mt-4 text-[16px] leading-[1.6] text-muted-foreground">
            Artikel 4 der EU-KI-Verordnung (EU AI Act) verpflichtet Unternehmen, für Personen, die im Auftrag mit KI-Systemen arbeiten, angemessene KI-Kompetenz sicherzustellen.
            Das gilt seit dem 2. Februar 2025 (Erwägungsgrund 20). Die Verordnung schreibt kein festes Format vor: Unternehmen entscheiden selbst, welche Maßnahmen für ihre Rollen und Kontexte passen.
            Dieser Kurs ist ein Baustein dafür. Er richtet sich auch an alle, die einfach verstehen möchten, wie KI ihren Alltag verändert.
          </p>
        </section>

        {/* Blocks list — derived from getBlocks() single source of truth */}
        <section className="mt-24">
          <div className="mb-10 flex items-baseline gap-4">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              §
            </span>
            <h2 className="text-[28px] font-bold tracking-[-0.02em] text-foreground sm:text-[36px]">
              Was du lernst.
            </h2>
          </div>

          <ol className="space-y-0 border-t border-border">
            {blocks.map((b, i) => (
              <li
                key={b.id}
                className="grid gap-4 border-b border-border py-7 sm:grid-cols-[140px_1fr_auto] sm:items-baseline sm:gap-8"
              >
                <div className="font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                  Block {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="text-[18px] font-semibold leading-snug text-foreground sm:text-[20px]">
                    {b.title}
                  </div>
                  <div className="mt-2 max-w-[640px] text-[15px] leading-[1.55] text-muted-foreground">
                    {b.description}
                  </div>
                </div>
                <div className="font-mono text-[12px] font-medium tracking-wide text-muted-foreground">
                  {b.durationMinutes} Min.
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Why now */}
        <section className="mt-24 border-2 border-foreground bg-card p-8 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            § Warum jetzt
          </div>
          <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            KI-Kompetenz ist dokumentationsrelevant.
          </h2>
          <ul className="mt-6 space-y-3 text-[16px] leading-[1.55] text-foreground">
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              EU AI Act Artikel 4 (KI-Kompetenz) ist seit 2. Februar 2025 anwendbar.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Artikel 4 ist kein fixes Zertifikats- oder Einheitsformat.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Die lokale Teilnahmebestätigung kann interne Dokumentation unterstützen.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Hochrisiko-Pflichten brauchen zusätzlich Systeminventar, Risikoklassifizierung und interne Prozesse.
            </li>
          </ul>
        </section>

        {/* Closing CTA row */}
        <div className="mt-16 flex flex-wrap items-center gap-5">
          <Link href="/ki-fuehrerschein/kurs" className={PRIMARY_CTA}>
            Kostenlosen Kurs starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/eu-ai-act-kurs" className={SECONDARY_CTA}>
            EU AI Act Vertiefung
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
