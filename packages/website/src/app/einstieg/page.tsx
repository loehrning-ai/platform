import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, type JsonLdSingle, ORG_ID, SITE_URL } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Was ist KI? Ein Einstieg ohne Vorwissen",
  description:
    "KI kurz erklärt: was Künstliche Intelligenz ist, drei Beispiele aus dem Alltag, und wie du ohne Vorkenntnisse weiterlernen kannst. Kostenlos, kein Login.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/einstieg" },
  openGraph: {
    title: "Was ist KI? Ein Einstieg ohne Vorwissen",
    description:
      "KI kurz erklärt: was Künstliche Intelligenz ist, drei Beispiele aus dem Alltag, und wie du ohne Vorkenntnisse weiterlernen kannst. Kostenlos, kein Login.",
    url: `${SITE_URL}/einstieg`,
    siteName: "loehrning.ai",
    locale: "de_DE",
    type: "article",
  },
};

const EINSTIEG_ARTICLE: JsonLdSingle = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Was ist KI? Ein Einstieg ohne Vorwissen",
  description:
    "KI kurz erklärt: was Künstliche Intelligenz ist, drei Beispiele aus dem Alltag, und wie du ohne Vorkenntnisse weiterlernen kannst.",
  url: `${SITE_URL}/einstieg`,
  inLanguage: "de",
  isAccessibleForFree: true,
  author: { "@id": ORG_ID },
  publisher: { "@id": ORG_ID },
};

const EXAMPLES = [
  {
    id: "gesicht",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-7 w-7 text-brand-orange"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
        <path d="M9 10a3 3 0 0 0 6 0" />
        <circle cx="9.5" cy="8.5" r=".5" fill="currentColor" />
        <circle cx="14.5" cy="8.5" r=".5" fill="currentColor" />
      </svg>
    ),
    heading: "Gesichtserkennung",
    body: "Dein Smartphone entsperrt sich, wenn es dein Gesicht erkennt. Das Modell wurde mit Tausenden Gesichtsbildern trainiert: es trifft keine Regeln, es erkennt Muster.",
  },
  {
    id: "route",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-7 w-7 text-brand-orange"
      >
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    ),
    heading: "Routenplanung",
    body: "Google Maps und Apple Maps sagen Staus vorher, weil sie aus Millionen früherer Fahrten gelernt haben, wann es wo stockt.",
  },
  {
    id: "empfehlungen",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-7 w-7 text-brand-orange"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    heading: "Musik- und Filmempfehlungen",
    body: "Wenn Spotify oder Netflix dir etwas vorschlägt, hat ein Modell aus deinem bisherigen Nutzungsverhalten Muster abgeleitet. Es kennt dich nicht. Es erkennt, was ähnliche Nutzerinnen und Nutzer danach gehört oder gesehen haben.",
  },
] as const;

export default function EinstiegPage() {
  return (
    <>
      <JsonLd data={EINSTIEG_ARTICLE} id="einstieg-article-jsonld" />

      <div className="mx-auto max-w-[780px] px-6 pb-32 pt-20">

        {/* Section 1: Banner */}
        <div className="mb-12">
          <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            Stufe 1: Orientierung. Kein Login, kein Test, kostenlos.
          </p>
          <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[48px]">
            Was ist Künstliche Intelligenz eigentlich?
          </h1>
          <p className="mt-4 text-[18px] leading-[1.6] text-muted-foreground">
            Hier bekommst du eine klare Antwort. In 10 Minuten. Kein Vorwissen nötig.
          </p>
        </div>

        {/* Section 2: Definition */}
        <section aria-labelledby="definition-heading" className="mb-14">
          <h2
            id="definition-heading"
            className="mb-5 text-[24px] font-bold tracking-[-0.03em] text-foreground sm:text-[28px]"
          >
            Was ist KI? Eine ehrliche Antwort
          </h2>

          <div className="border-l-4 border-brand-orange py-2 pl-6">
            <p className="text-[18px] leading-[1.6] text-foreground">
              KI sind Computerprogramme, die aus vielen Beispielen lernen, um Muster zu
              erkennen, Texte zu schreiben oder Entscheidungen vorzubereiten.
            </p>
          </div>

          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground hover:text-foreground">
                Woher kommt diese Definition?
              </summary>
              <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
                Diese Definition folgt Artikel 3 der EU-KI-Verordnung (EU) 2024/1689.
              </p>
            </details>
          </div>
        </section>

        {/* Section 3: Three daily-life examples */}
        <section aria-labelledby="beispiele-heading" className="mb-14">
          <h2
            id="beispiele-heading"
            className="mb-7 text-[24px] font-bold tracking-[-0.03em] text-foreground sm:text-[28px]"
          >
            KI begegnet dir jeden Tag
          </h2>

          <div className="grid gap-5 sm:grid-cols-3" data-testid="beispiel-cards">
            {EXAMPLES.map((ex) => (
              <div
                key={ex.id}
                className="border border-border bg-card p-5"
                data-testid={`beispiel-${ex.id}`}
              >
                <div className="mb-4">{ex.icon}</div>
                <h3 className="mb-2 text-[16px] font-bold text-foreground">{ex.heading}</h3>
                <p className="text-[14px] leading-[1.6] text-muted-foreground">{ex.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: FAQ with native details/summary */}
        <section aria-labelledby="faq-heading" className="mb-14">
          <h2
            id="faq-heading"
            className="mb-7 text-[24px] font-bold tracking-[-0.03em] text-foreground sm:text-[28px]"
          >
            Drei Fragen, die viele am Anfang stellen
          </h2>

          <div className="space-y-3">
            <details className="border border-border bg-card">
              <summary className="cursor-pointer px-5 py-4 font-bold text-foreground hover:bg-background">
                Brauche ich Programmierkenntnisse?
              </summary>
              <p className="border-t border-border px-5 py-4 text-[15px] leading-[1.6] text-muted-foreground">
                Nein. Dieser Einstieg setzt keinerlei technisches Vorwissen voraus. Und der
                KI-Führerschein auch nicht.
              </p>
            </details>

            <details className="border border-border bg-card">
              <summary className="cursor-pointer px-5 py-4 font-bold text-foreground hover:bg-background">
                Ist das alles kostenlos?
              </summary>
              <p className="border-t border-border px-5 py-4 text-[15px] leading-[1.6] text-muted-foreground">
                Ja. Ohne Werbung, ohne Abo, ohne deine Daten zu verkaufen. Die Plattform ist
                ein freies Bildungsangebot.
              </p>
            </details>

            <details className="border border-border bg-card">
              <summary className="cursor-pointer px-5 py-4 font-bold text-foreground hover:bg-background">
                Wer steckt dahinter?
              </summary>
              <p className="border-t border-border px-5 py-4 text-[15px] leading-[1.6] text-muted-foreground">
                Tim Löhr, Datenwissenschaftler aus Nürnberg. Er arbeitet seit Jahren mit
                KI-Systemen und erklärt hier, was davon im Alltag wirklich zählt. Mehr auf der{" "}
                <Link
                  href="/ueber-mich"
                  className="text-brand-orange underline-offset-4 hover:underline"
                >
                  Über-mich-Seite
                </Link>
                .
              </p>
            </details>
          </div>
        </section>

        {/* Section 5: Three ways forward */}
        <section aria-labelledby="weiter-heading" className="mb-10">
          <h2
            id="weiter-heading"
            className="mb-7 text-[24px] font-bold tracking-[-0.03em] text-foreground sm:text-[28px]"
          >
            Wie möchtest du weitermachen?
          </h2>

          <div className="space-y-4">
            {/* Primary CTA */}
            <div className="border border-brand-orange bg-brand-orange/5 p-6">
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand-orange">
                Empfohlen für diesen Einstieg
              </p>
              <h3 className="mb-2 text-[18px] font-bold text-foreground">
                Wie KI wirklich funktioniert (ca. 40 min)
              </h3>
              <p className="mb-5 text-[14px] leading-[1.6] text-muted-foreground">
                Du willst verstehen, wie KI tatsächlich rechnet, warum sie manchmal falsch liegt
                und was sie nicht kann.
              </p>
              <Link
                href="/wie-ki-funktioniert"
                className="inline-flex items-center gap-2 rounded-none bg-brand-orange px-5 py-3 font-mono text-[13px] font-bold text-white transition-colors hover:bg-brand-orange/90"
              >
                Zu den Lektionen
                <span aria-hidden="true">&#8594;</span>
              </Link>
            </div>

            {/* Secondary CTA */}
            <div className="border border-border bg-card p-6">
              <h3 className="mb-2 text-[17px] font-bold text-foreground">Zum KI-Führerschein</h3>
              <p className="mb-5 text-[14px] leading-[1.6] text-muted-foreground">
                Du willst direkt mit dem kostenlosen Kurs beginnen. Kein Vorwissen nötig.
              </p>
              <Link
                href="/ki-fuehrerschein"
                className="inline-flex items-center gap-2 border border-border bg-background px-5 py-3 font-mono text-[13px] font-bold text-foreground transition-colors hover:bg-card"
              >
                KI-Führerschein starten
                <span aria-hidden="true">&#8594;</span>
              </Link>
            </div>

            {/* Tertiary quiet link */}
            <div className="py-3">
              <p className="text-[14px] text-muted-foreground">
                Nicht sicher, wo du stehst?{" "}
                <Link
                  href="/ki-check"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Fünf kurze Fragen zeigen dir den passenden Kurs.
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
