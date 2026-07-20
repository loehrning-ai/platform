import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Über die Plattform",
  description:
    "Betriebsmodell von loehrning.ai: kostenlose Lerninhalte, öffentlicher Crawl-Bereich, private Kontostände, Quellenpolitik, Grenzen und Feedback.",
  alternates: { canonical: "/ueber-die-plattform" },
  robots: { index: true, follow: true },
};

const PLATFORM_GRAPH = {
  "@context": "https://schema.org" as const,
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Start", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Über die Plattform",
          item: `${SITE_URL}/ueber-die-plattform`,
        },
      ],
    },
    {
      "@type": "WebPage",
      url: `${SITE_URL}/ueber-die-plattform`,
      name: "Über die Plattform",
      inLanguage: "de-DE",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORG_ID },
    },
  ],
};

const sections = [
  {
    title: "Warum kostenlos",
    body: "KI-Kompetenz wird zur Grundfähigkeit. Die Plattform soll diese Grundfähigkeit öffentlich erklären: ohne Paywall, ohne Buchungsfunnel, ohne versteckte Premiumstufe.",
  },
  {
    title: "Was öffentlich ist",
    body: "Kurse, Kursreader, Bücher, Demos, Blog, bekannte Grenzen, Open-Source-Hub und maschinenlesbare Metadaten sind öffentlich zugänglich. Manche Utility-Seiten sind crawlbar, aber bewusst noindex.",
  },
  {
    title: "Was ein Konto speichert",
    body: "Ein Konto ist optional. Es speichert Fortschritt, Quizstatus, Zertifikatsstatus und Datenschutzaktionen. Es ist kein Zugangstor für Grundinhalte.",
  },
  {
    title: "Quellen und Aktualisierung",
    body: "Rechtliche und faktische Inhalte werden mit Quellen, Prüfdatum und Grenzen geführt. Aktualisierungen erscheinen im Changelog und wesentliche Fehler werden sichtbar korrigiert.",
  },
  {
    title: "Feedback",
    body: "Rückmeldungen werden ohne Name oder E-Mail gespeichert. Die optionale Kontext-URL hilft bei der Einordnung. IP-Adressen werden nur indirekt als Rate-Limit-Schlüssel genutzt.",
  },
  {
    title: "Zertifikate",
    body: "Teilnahmebestätigungen sind selbst ausgestellte, lokale Lernnachweise. Sie sind nicht amtlich, nicht akkreditiert und kein rechtlicher Compliance-Nachweis.",
  },
] as const;

export default function UeberDiePlattformPage() {
  return (
    <>
      <JsonLd data={PLATFORM_GRAPH} id="plattform-jsonld" />
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="h-[3px] w-28 bg-brand-orange" />
          <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
            Betriebsmodell
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
            Öffentliche Lerninhalte. Private Zustände. Sichtbare Grenzen.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            loehrning.ai ist ein öffentliches Lernarchiv für praktische KI-Kompetenz.
            Die Plattform trennt Inhalte, die jeder lesen kann, von Zuständen,
            die nur mit Konto sinnvoll sind.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <section key={section.title} className="border border-border bg-card/35 p-6">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-12 grid gap-4 border-y border-border py-8 sm:grid-cols-3">
            <Link href="/bekannte-grenzen" className="group text-sm font-semibold text-foreground">
              Bekannte Grenzen <span className="text-brand-orange group-hover:underline">anzeigen</span>
            </Link>
            <Link href="/open-source" className="group text-sm font-semibold text-foreground">
              Open-Source-Hub <span className="text-brand-orange group-hover:underline">öffnen</span>
            </Link>
            <Link href="/feedback" className="group text-sm font-semibold text-foreground">
              Korrektur melden <span className="text-brand-orange group-hover:underline">per Feedback</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
