import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getBlocks } from "@/lib/course/data";

export const metadata: Metadata = {
  title: "KI und Gesellschaft: kostenloser Kurs über Arbeit, Deepfakes und Ethik",
  description:
    "Kostenloser Kurs: Wie KI Arbeit verändert, wie du Deepfakes erkennst und was KI-Ethik bedeutet. 3 Blöcke, 9 Lektionen, ca. 46 Min., lokale Teilnahmebestätigung. Keine Vorkenntnisse nötig.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/ki-und-gesellschaft" },
  openGraph: {
    title: "KI und Gesellschaft: Arbeit, Deepfakes, Ethik (kostenlos)",
    description:
      "3 Blöcke, 9 Lektionen, ca. 46 Min. Keine Vorkenntnisse nötig. Lokale Teilnahmebestätigung. Kostenlos ohne Anmeldung. Auf Deutsch.",
    url: `${SITE_URL}/ki-und-gesellschaft`,
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
          name: "KI und Gesellschaft",
          item: `${SITE_URL}/ki-und-gesellschaft`,
        },
      ],
    },
    {
      "@type": "Course",
      name: "KI und Gesellschaft: Arbeit, Deepfakes, Ethik",
      description:
        "Kostenloser, 3-blöckiger Online-Kurs zu gesellschaftlichen KI-Themen. 9 Lektionen, ca. 46 Min., lokale Teilnahmebestätigung. Für alle ohne Vorkenntnisse.",
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
        courseWorkload: "PT46M",
        inLanguage: "de",
      },
    },
  ],
};

const PRIMARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

const SECONDARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

export default async function KiUndGesellschaftLandingPage() {
  const blocks = getBlocks("ki-und-gesellschaft");

  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="ki-und-gesellschaft-landing-jsonld" />
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          § KI und Gesellschaft · Kostenloser Gesellschaftskurs
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[56px] md:text-[88px]">
          KI und Gesellschaft:<br />
          <span className="text-brand-orange">Arbeit. Deepfakes. Ethik.</span>
        </h1>

        <p className="mt-9 max-w-[780px] text-[18px] leading-[1.5] text-muted-foreground sm:text-[21px]">
          Dieser Kurs erklärt, wie KI den Arbeitsmarkt verändert, wie du Deepfakes und manipulierte Medien erkennst und was KI-Ethik für dein Leben bedeutet.
          Keine Vorkenntnisse nötig: drei Blöcke, neun Lektionen, ca. 46 Min., lokale Teilnahmebestätigung.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-5">
          <Link href="/ki-und-gesellschaft/kurs" className={PRIMARY_CTA}>
            Kurs starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/kurse" className={SECONDARY_CTA}>
            Alle Kurse
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <section className="mt-20 border-l-4 border-brand-orange bg-card p-6 sm:p-8">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            § Warum gibt es diesen Kurs?
          </div>
          <p className="mt-4 text-[16px] leading-[1.6] text-muted-foreground">
            KI verändert Gesellschaft, Arbeit und Information. Drei Themen, die fast alle betreffen, sind bisher selten klar erklärt:
            Wie verändert KI wirklich den Arbeitsmarkt, jenseits von Panikmache? Wie erkenne ich ein manipuliertes Video? Und was bedeutet
            es, wenn ein Algorithmus über Kredite oder Jobchancen entscheidet? Dieser Kurs gibt ehrliche Antworten auf der Grundlage
            aktueller Forschung, ohne Vereinfachung, ohne Hysterie.
          </p>
        </section>

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

        <section className="mt-24 border-2 border-foreground bg-card p-8 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            § Für wen ist dieser Kurs?
          </div>
          <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            Für alle, die informiert mitdenken wollen.
          </h2>
          <ul className="mt-6 space-y-3 text-[16px] leading-[1.55] text-foreground">
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Du hast von Deepfakes gehört und willst verstehen, wie du sie erkennst.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Du fragst dich, ob dein Job wirklich durch KI gefährdet ist.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Du willst wissen, warum KI manchmal diskriminiert, und was deine Rechte dabei sind.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Keine Programmierkenntnisse nötig. Kein technisches Vorwissen erforderlich.
            </li>
          </ul>
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-5">
          <Link href="/ki-und-gesellschaft/kurs" className={PRIMARY_CTA}>
            Kostenlosen Kurs starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/ki-fuehrerschein" className={SECONDARY_CTA}>
            KI-Grundlagenkurs
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
