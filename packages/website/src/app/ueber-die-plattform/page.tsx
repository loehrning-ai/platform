import Link from "next/link";
import { getRuntimeFeatures } from "@/lib/runtime-features";
import { JsonLd, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/seo/json-ld";
import { createPublicPageMetadata } from "@/lib/seo/page-metadata";

export const metadata = createPublicPageMetadata({
  title: "Über die Plattform",
  description:
    "Betriebsmodell von loehrning.ai: öffentliche Ressourcen und technische Kursreader, kontogeschützter deutscher Lernpfad, Quellenpolitik, Grenzen und Feedback.",
  path: "/ueber-die-plattform",
});

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

export default function UeberDiePlattformPage() {
  const { account, feedback } = getRuntimeFeatures();
  const sections = [
    {
      title: "Warum kostenlos",
      body: "KI-Kompetenz wird zur Grundfähigkeit. Die Plattform soll diese Grundfähigkeit ohne Paywall, Buchungsfunnel oder versteckte Premiumstufe erklären.",
    },
    {
      title: "Was öffentlich ist",
      body: "Öffentlich und ohne Konto erreichbar sind die Start- und Kurs-Landingpages, KI-Check, Bücher, Demos, Blog, Workshops, Open-Source-Hub, bekannte Grenzen, maschinenlesbare Metadaten und die sechs technischen Kursreader auf Englisch.",
    },
    {
      title: "Wo ein Konto erforderlich ist",
      body: account
        ? "Die Reader der vier deutschen Kernkurse KI-Führerschein, KI und Gesellschaft, EU AI Act Kurs und AI-Native Arbeitskurs erfordern ein kostenloses Lernkonto. Es synchronisiert Fortschritt, Quizstatus und Datenschutzaktionen."
        : "Die Reader der vier deutschen Kernkurse KI-Führerschein, KI und Gesellschaft, EU AI Act Kurs und AI-Native Arbeitskurs erfordern ein kostenloses Lernkonto. Diese Kontofunktion ist in dieser Version deaktiviert; die öffentlichen Landingpages, Ressourcen und technischen Kursreader bleiben erreichbar.",
    },
    {
      title: "Quellen und Aktualisierung",
      body: "Rechtliche und faktische Inhalte werden mit Quellen, Prüfdatum und Grenzen geführt. Aktualisierungen erscheinen im Changelog und wesentliche Fehler werden sichtbar korrigiert.",
    },
    {
      title: "Feedback",
      body: feedback
        ? "Das Feedback-Formular fragt weder Name noch E-Mail-Adresse als eigene Felder ab. Die optionale Kontext-URL hilft bei der Einordnung; IP-Adressen werden nur indirekt als Rate-Limit-Schlüssel genutzt."
        : "Das serverseitige Feedback-Formular ist in dieser Version deaktiviert. Korrekturen und Rückmeldungen sind weiterhin per E-Mail möglich.",
    },
    {
      title: "Teilnahmebestätigungen und Lernnachweise",
      body: "Teilnahmebestätigungen, Lernnachweise und die englisch bezeichneten Certificates sind selbst ausgestellte, lokale Abschlussdokumente. Sie sind nicht amtlich, nicht akkreditiert und kein rechtlicher Compliance-Nachweis.",
    },
  ] as const;

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
            {feedback ? (
              <Link href="/feedback" className="group text-sm font-semibold text-foreground">
                Korrektur melden{" "}
                <span className="text-brand-orange group-hover:underline">
                  per Feedback
                </span>
              </Link>
            ) : (
              <a
                href="mailto:tim@loehrning.ai"
                className="group text-sm font-semibold text-foreground"
              >
                Korrektur melden{" "}
                <span className="text-brand-orange group-hover:underline">
                  per E-Mail
                </span>
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
