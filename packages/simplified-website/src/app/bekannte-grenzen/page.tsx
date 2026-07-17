import type { Metadata } from "next";
import Link from "next/link";
import { books } from "@/lib/books";
import { getRuntimeFeatures } from "@/lib/runtime-features";

export const metadata: Metadata = {
  title: "Bekannte Grenzen",
  description:
    "Offene Dokumentation der bekannten Einschränkungen dieser Lernplattform: Zertifikate, Praxisbeispiele, Inhaltsaktualität und lokale Datenspeicherung.",
  alternates: { canonical: "/bekannte-grenzen" },
  robots: { index: true, follow: true },
};

type Limitation = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly mitigation?: string;
};

function getLimitations(accountEnabled: boolean): readonly Limitation[] {
  return [
  {
    id: "zertifikat",
    title: "Selbst ausgestelltes Teilnahmezertifikat",
    description:
      "Das Zertifikat nach Kursabschluss wird lokal in deinem Browser erstellt. Es enthält keinen serverseitigen Prüfmechanismus, keine Signatur und keine Verknüpfung zu einer externen Zertifizierungsstelle. Es ist kein Nachweis im rechtlichen Sinne des Artikel 4 EU KI-Verordnung.",
    mitigation:
      "Du kannst das Zertifikat als internen Trainingsnachweis verwenden. Die Europäische Kommission hat klargestellt, dass kein bestimmtes Zertifikat gesetzlich vorgeschrieben ist. Interne Schulungsaufzeichnungen können ausreichen. Bitte kläre das mit deinem Arbeitgeber oder Rechtsbeistand.",
  },
  {
    id: "praxisbeispiele",
    title: "Simulierte Praxisbeispiele",
    description:
      "Alle interaktiven Demos und Sandboxen auf dieser Plattform verwenden synthetische Daten und simulierte Schnittstellen. Es werden keine echten E-Mails verschickt, keine echten APIs angefragt und keine echten Nutzerdaten verarbeitet. Das Label 'Simuliert' bleibt während der gesamten Interaktion sichtbar.",
    mitigation:
      "Die Praxisbeispiele dienen dem Verständnis des Konzepts, nicht dem produktiven Einsatz. Für echte Implementierungen empfehle ich, mit den jeweiligen Tool-Anbietern und internen IT-Teams zusammenzuarbeiten.",
  },
  {
    id: "aktualitaet",
    title: "Verzögerte Inhaltsaktualität",
    description:
      "Die Inhalte werden nach einem festgelegten Prüfplan aktualisiert (monatlich für rechtliche Inhalte, quartalsweise für statistische Inhalte, halbjährlich für grundlegende Konzepte). Zwischen den Prüfterminen können sich regulatorische Details, Tool-Preise oder Statistiken verändern.",
    mitigation:
      "Jeder Kursblock zeigt den letzten Prüfmonat. Für die Anwendung auf regulatorische oder rechtliche Fragen empfehle ich, Primärquellen direkt zu prüfen (EUR-Lex, BMWK, offizielle Kommissionsdokumente). Bekannte Änderungen dokumentiere ich auf /neuigkeiten.",
  },
  {
    id: "fortschritt-lokal",
    title: "Lokale Speicherung des Lernfortschritts ohne Konto",
    description:
      "Ohne Konto wird dein Lernfortschritt im Browser-Speicher (localStorage) gespeichert. Das bedeutet: Wenn du den Browser-Cache löschst, einen privaten Tab oder ein anderes Gerät nutzt, kann der Fortschritt verloren gehen.",
    mitigation:
      accountEnabled
        ? "Das in dieser Version aktivierte Lernkonto kann Fortschritt serverseitig synchronisieren. Speicherregion (EU) und Auftragsverarbeitungsvertrag werden vor der Veröffentlichung geprüft und in der Datenschutzerklärung dokumentiert."
        : "Das optionale Lernkonto ist in dieser Version deaktiviert. Exportiere wichtige Ergebnisse direkt und behandle lokalen Fortschritt nicht als dauerhaftes Backup.",
  },
  {
    id: "buecher-rechtlich",
    title: "Bücher als Lernmaterial, nicht als Rechtsquellen",
    description:
      `Die ${books.length} verfügbaren Bücher sind adaptierte Lernversionen. Sie sind keine zitierfähigen Rechtsquellen, keine offiziellen Behördendokumente und kein Ersatz für Rechtsberatung.`,
    mitigation:
      "Für verbindliche rechtliche Einschätzungen immer Primärquellen (EUR-Lex, Amtsblatt der EU) und bei Bedarf Rechtsberatung hinzuziehen.",
  },
  ];
}

export default function BekanntGrenzenPage() {
  const features = getRuntimeFeatures();
  const limitations = getLimitations(features.account);
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="h-[3px] w-28 bg-brand-orange" />
        <p className="mt-8 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-brand-orange">
          Transparenz
        </p>
        <h1 className="mt-5 text-4xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-5xl">
          Bekannte Grenzen
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Diese Seite dokumentiert offen, was diese Plattform nicht leistet und
          wo es bekannte Einschränkungen gibt.
        </p>

        <div className="mt-12 space-y-6">
          {limitations.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="rounded-lg border border-border bg-card/40 p-6"
            >
              <h2 className="font-semibold text-foreground">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              {item.mitigation && (
                <div className="mt-4 rounded border-l-2 border-brand-orange pl-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Was du tun kannst:{" "}
                    </span>
                    {item.mitigation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-lg border border-border bg-card/40 p-6">
          <p className="text-sm font-semibold text-foreground">
            Noch eine Einschränkung gefunden?
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {features.feedback ? (
              <>
                Bitte melde sie über das{" "}
                <Link
                  href="/feedback"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Feedback-Formular
                </Link>
                .
              </>
            ) : (
              <>Bitte melde sie per E-Mail an tim@loehrning.ai.</>
            )}{" "}
            Geprüfte Einschränkungen werden auf dieser Seite dokumentiert.
          </p>
        </div>
      </div>
    </section>
  );
}
