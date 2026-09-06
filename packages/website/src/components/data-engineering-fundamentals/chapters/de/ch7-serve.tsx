import { METRICS } from "../ch7-serve";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import {
  AntiPatterns,
  BestPractices,
  Hero,
  SectionLabel,
  Takeaway,
} from "../../primitives";
import { MetricsSim } from "../../simulators/metrics-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

function MetricsRegistryDe() {
  return (
    <div className="cards-3">
      {METRICS.map((metric) => (
        <div key={metric.name} className="ccard">
          <div className="ccard-t">{metric.owner}</div>
          <div className="ccard-n">{metric.name}</div>
          <div
            className="ccard-d"
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          >
            <div>
              <b>Granularität:</b> {metric.grain}
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Quelle:</b> <code>{metric.source}</code>
            </div>
            <div style={{ marginTop: 6 }}>
              <b>Formel:</b>
            </div>
            <div style={{ marginTop: 2, color: "var(--fg-2)" }}>
              {metric.formula}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export interface Ch7ServeDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch7ServeDe({ chapter }: Ch7ServeDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Bereitstellung: <span class='accent'>Versionierte Metriken</span> über mehrere Schnittstellen."
        hook="Drei Dashboards, derselbe Metrikname, drei verschiedene Granularitäten, Filter und Quellenstichtage. Ein gemeinsames Register drückt diese Abweichung, sobald Verbraucher die registrierte Version auflösen."
        meta={[
          { k: "Vertrag", v: "versionierte Definition pro Metrik" },
          { k: "Verantwortlich", v: "deklarierte fachliche Zuständigkeit" },
          { k: "Schnittstellen", v: "API · Dashboards · Notebooks" },
        ]}
      />

      <section className="section">
        <SectionLabel n="8.1">Was eine Metrikschicht ist</SectionLabel>
        <h2 className="h2">Metrikversion und Ausführungskontext deklarieren.</h2>
        <p className="prose">
          Eine Metrikschicht ist ein <b>Register</b> aus Namen, Versionen, Zuständigkeiten, Granularitäten, Quellen, Formeln und zulässigen Filtern.
          Wer eine registrierte Metrik abfragt, bekommt dieselbe Definition wie alle anderen. Authentifizierung, Autorisierung, Quellauswahl und
          Ausführungsprotokollierung bleiben trotzdem Aufgabe des Abfragedienstes.
        </p>
        <MetricsRegistryDe />
        <p className="prose" style={{ marginTop: 18 }}>
          Ein Metrikdienst kann eine <b>Zugriffsschnittstelle</b> sein, doch ein Register erzwingt keine zeilenbasierten Berechtigungen,
          PII-Maskierung oder regionale Datenhaltung. Diese Kontrollen müssen in Abfrage- und Datenschicht umgesetzt, mit Identität versorgt und
          auf jeder Verbraucherschnittstelle getestet werden.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="8.2">Der Weg einer Abfrage</SectionLabel>
        <h2 className="h2">Dieselbe Frage darf nicht zu unterschiedlichem SQL führen.</h2>
        <p className="prose">
          Ohne Metrikschicht sucht die Analystin nach ähnlich benannten
          Tabellen, wählt eine nach Erfahrung und schreibt Ad-hoc-SQL. Getroffen
          hat sie vielleicht eine seit Jahren abgekündigte Tabelle oder einen
          längst umbenannten Spaltennamen. <b>Am Ergebnis allein ist dieser
          Fehler nicht erkennbar.</b>
        </p>
        <p className="prose">
          Mit einem Register bekommt die Frage eine Metrikversion, die unterstützten Filter werden gebunden und die gespeicherte Definition läuft
          gegen ihre deklarierte Quelle oder Quellmenge. Metrikversion, Filter, Quellen-Snapshot oder Partitionen und Ausführungsidentität landen
          zusammen mit dem Ergebnis im Protokoll.
        </p>
        <MetricsSim />
      </section>

      <section className="section">
        <SectionLabel n="8.3">Was Verbraucher sehen</SectionLabel>
        <h2 className="h2">Eine Metrik, mehrere Schnittstellen.</h2>
        <p className="prose">
          Ein gemeinsames Register räumt genau eine Abweichungsquelle weg: die Metrikformel. Quellenaktualität, Filterbindung, Zeitzone,
          Berechtigung, Cache und Definitionsversion trennen die Ergebnisse weiterhin. Dieser Kontext gehört in jeden Vergleich.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Dashboards</div>
            <div className="ccard-n">Hex · Mode · Superset · Trino-Backend</div>
            <div className="ccard-d">
              Dashboards lösen die registrierte Metrikversion auf und erfassen Filter, Quellenstichtag und Cache-Zustand.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Notebooks und APIs</div>
            <div className="ccard-n">Ein Resolver, mehrere Aufrufer</div>
            <div className="ccard-d">
              Notebooks und APIs können denselben Resolver verwenden und behalten aufruferspezifische Autorisierung und Audit-Kontext.
            </div>
          </div>
        </div>
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Metrik-SQL in mehrere Schnittstellen kopieren.</b> Die Definition registrieren und versionieren; verbleibende Ad-hoc-Kopien erfassen.",
          "<b>Ad-hoc-Tabellenausgaben als geregelte Metrik veröffentlichen.</b> Exploration darf Rohdaten verwenden; veröffentlichte Metriken benötigen benannte Definition und Ausführungskontext.",
          "<b>Eine Metrik ohne Zuständigkeit registrieren.</b> Verantwortung für Definitionsänderung, Quellenwechsel und Abkündigung zuweisen.",
          "<b>Metrik-Autorisierung als Ersatz für Quellkontrollen behandeln.</b> Geringste Rechte über Resolver, Abfrage-Engine und zugrunde liegende Daten erzwingen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Jede Metrikversion erfasst <b>Name, Zuständigkeit, Granularität, Quellmenge, Formel, Filter und Gültigkeitsbeginn</b>.",
          "Die Metrikschicht wird als <b>API</b> bereitgestellt. Dashboards, Notebooks und externe Aufrufer lösen Metriken über denselben Weg auf.",
          "Änderungen an einer Metrik werden als <b>Breaking Change</b> behandelt: versionieren, ankündigen und die alte Definition geordnet abkündigen.",
          "Jede Antwort erfasst einen <b>Trace</b> aus Metrikversion, Filtern, Aufrufer, Quellpartitionen oder Snapshot und Ausführungszeit.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Eine Metrikschicht ist die stabile Schnittstelle zwischen Datensätzen und Verbraucherwerkzeugen.",
          "Ein Register reduziert Definitionsabweichung nur, wenn Verbraucher es verwenden und Quellen-, Autorisierungs- und Versionskontext erhalten bleiben.",
          "Deklarier Metrikversion, Zuständigkeit, Granularität, Quellmenge, Filter und Gültigkeitszeitraum.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch7ServeDe;
