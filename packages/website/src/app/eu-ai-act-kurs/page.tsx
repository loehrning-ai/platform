import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";
import { getBlocks } from "@/lib/course/data";

export const metadata: Metadata = {
  title: "EU AI Act: Was du wissen musst",
  description:
    "Kostenloser Kurs zu Grundlagen, Verboten und deinen Rechten nach der KI-Verordnung. Für alle, keine Vorkenntnisse nötig.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/eu-ai-act-kurs" },
  openGraph: {
    title: "EU AI Act: Was du wissen musst",
    description:
      "Kostenloser Kurs zu Grundlagen, Verboten und deinen Rechten nach der KI-Verordnung. Für alle, keine Vorkenntnisse nötig.",
    url: `${SITE_URL}/eu-ai-act-kurs`,
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
          name: "EU AI Act Kurs",
          item: `${SITE_URL}/eu-ai-act-kurs`,
        },
      ],
    },
    {
      "@type": "Course",
      name: "EU AI Act: Was du wissen musst",
      description:
        "Kostenloser Kurs zu Grundlagen, Verboten und deinen Rechten nach der KI-Verordnung. Für alle, keine Vorkenntnisse nötig.",
      provider: { "@id": ORG_ID },
      inLanguage: "de",
      isAccessibleForFree: true,
      educationalLevel: "Beginner",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT1H50M",
        inLanguage: "de",
      },
    },
  ],
};

const PRIMARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-brand-orange px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-[#A5370F] hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

const SECONDARY_CTA =
  "inline-flex items-center gap-2 border-2 border-foreground bg-background px-6 py-4 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-foreground shadow-[4px_4px_0_var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-100 hover:-translate-x-px hover:-translate-y-0.5 hover:bg-card hover:shadow-[6px_6px_0_var(--color-foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0_var(--color-foreground)]";

export default async function EuAiActKursLandingPage() {
  const blocks = getBlocks("eu-ai-act-kurs");

  return (
    <>
      <JsonLd data={COURSE_GRAPH} id="eu-ai-act-landing-jsonld" />
      <div className="mx-auto max-w-[1180px] px-6 pb-32 pt-20">
        <div className="mb-9 h-[3px] w-[154px] bg-brand-orange" />

        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          § EU AI Act Kurs · Stufe 3 des Lernpfads
        </div>

        <h1 className="mt-6 max-w-[1180px] text-[40px] font-bold leading-[0.94] tracking-[-0.05em] text-foreground sm:text-[56px] md:text-[88px]">
          EU AI Act:<br />
          <span className="text-brand-orange">Was du wissen musst.</span>
        </h1>

        <p className="mt-9 max-w-[780px] text-[18px] leading-[1.5] text-muted-foreground sm:text-[21px]">
          Die KI-Verordnung (EU) 2024/1689 ist das bislang umfangreichste KI-Rahmengesetz der EU.
          (Quelle: Europäische Kommission, KI-Verordnung Überblick, 2024.)
          Recital 20 verpflichtet Mitgliedstaaten und die Kommission, KI-Kompetenz für die Gesellschaft
          zu fördern. Dieser Kurs ist der Versuch, genau das zu tun.
        </p>

        <p className="mt-5 max-w-[780px] text-[16px] leading-[1.6] text-muted-foreground">
          Dieser Kurs ist Stufe 3 des Lernpfads. Du kannst direkt einsteigen, auch ohne vorherigen KI-Führerschein-Kurs.
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-5">
          <Link
            href="/eu-ai-act-kurs/kurs"
            prefetch={false}
            className={PRIMARY_CTA}
          >
            Kostenlos mit Lernkonto starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/ki-fuehrerschein" className={SECONDARY_CTA}>
            Stufe 2: KI im Alltag (KI-Führerschein)
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* What you can do after this course */}
        <section className="mt-20">
          <div className="mb-6 flex items-baseline gap-4">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
              §
            </span>
            <h2 className="text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
              Was du nach diesem Kurs kannst.
            </h2>
          </div>
          <p className="max-w-[680px] text-[16px] leading-[1.6] text-muted-foreground">
            Nach diesem Kurs kannst du erklären, was die KI-Verordnung regelt, welche Praktiken
            verboten sind und was du als Nutzerin bzw. als verantwortliche Person im Beruf
            wissen musst. Du verstehst, was ab dem 2. August 2026 gilt, und warum die
            Hochrisiko-Termine 2. Dezember 2027 und 2. August 2028 seit dem
            27. Juli 2026 geltendes Recht sind.
          </p>
        </section>

        {/* Two-track callout */}
        <section className="mt-10 border-2 border-foreground bg-card p-8 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange mb-4">
            § Zwei Spuren, ein Kurs
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="text-[15px] font-bold text-foreground mb-2">Blöcke 1–2: Für alle</div>
              <p className="text-[14px] leading-[1.55] text-muted-foreground">
                Was das Gesetz verbietet, welche Rechte du hast und was privat gar nicht gilt.
                Weder Vorkenntnisse noch eine bestimmte Berufsrolle sind nötig.
              </p>
            </div>
            <div>
              <div className="text-[15px] font-bold text-foreground mb-2">Blöcke 3–6: Wenn du im Beruf Verantwortung trägst</div>
              <p className="text-[14px] leading-[1.55] text-muted-foreground">
                Hochrisiko-Pflichten, GPAI und Governance, für Personen,
                die im Beruf mit KI-Systemen arbeiten oder dafür zuständig sind.
              </p>
            </div>
          </div>
        </section>

        {/* Blocks list */}
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

          <div className="mt-6 font-mono text-[12px] text-muted-foreground">
            6 Lernblöcke · je 16–20 Minuten · gesamt ca. 1 Std. 50 Min.
          </div>
        </section>

        {/* Audience */}
        <section className="mt-24 border-2 border-foreground bg-card p-8 shadow-[6px_6px_0_var(--color-foreground)] sm:p-10">
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            § Für wen
          </div>
          <h2 className="mt-3 text-[24px] font-bold tracking-[-0.02em] text-foreground sm:text-[30px]">
            Für alle, die verstehen wollen, was der EU AI Act für ihren Alltag bedeutet.
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-muted-foreground">
            Weder Vorkenntnisse noch eine bestimmte Berufsrolle sind nötig. Blöcke 1–2 sind
            für neugierige Bürgerinnen und Bürger; Blöcke 3–6 vertiefen für alle mit Verantwortung im Beruf.
          </p>
          <ul className="mt-6 space-y-3 text-[16px] leading-[1.55] text-foreground">
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Neugierige Bürgerinnen und Bürger, die verstehen wollen, welche KI-Praktiken verboten sind.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Angestellte, die wissen möchten, was ihr Unternehmen bei KI-Einsatz beachten muss.
            </li>
            <li>
              <span className="mr-3 font-mono text-brand-orange">↳</span>
              Alle mit Verantwortung im Beruf: Datenschutzbeauftragte, IT-Verantwortliche, Compliance-Rollen.
            </li>
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="mt-10 border border-border bg-muted/30 p-6 text-[13px] leading-[1.6] text-muted-foreground">
          <strong className="text-foreground">Hinweis:</strong>{" "}
          Dieser Kurs vermittelt Wissen im Bereich KI-Kompetenz und ersetzt keine Rechtsberatung.
          Art. 4 EU AI Act verpflichtet Betreiber zu KI-Kompetenzmaßnahmen, schreibt jedoch
          weder ein Zertifikat noch ein bestimmtes Format vor.
          (Quelle: Europäische Kommission, FAQ KI-Kompetenz, Mai 2025.)
          Eine Teilnahmebestätigung dieses Kurses ist kein anerkannter Nachweis und keine Erfüllung von Art. 4.
        </section>

        <div className="mt-16 flex flex-wrap items-center gap-5">
          <Link
            href="/eu-ai-act-kurs/kurs"
            prefetch={false}
            className={PRIMARY_CTA}
          >
            Kostenlos mit Lernkonto starten
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/ai-native" className={SECONDARY_CTA}>
            Stufe 4: Mit KI arbeiten (AI-Native-Kurs)
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </>
  );
}
