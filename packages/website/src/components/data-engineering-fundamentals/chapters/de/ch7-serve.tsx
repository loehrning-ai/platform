import { METRICS } from "../ch7-serve";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { AntiPatterns, BestPractices, Hero, SectionLabel } from "../../primitives";
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
        hook="Zwei Dashboards können für denselben Metriknamen zwei Zahlen zeigen, weil ihr SQL andere Granularitäten, Filter und Stichtage nutzt. Ein gemeinsames Register verringert diese Abweichung."
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
          Eine Metrikschicht ist ein <b>Register</b> aus Namen, Versionen, Zuständigkeiten, Granularitäten, Quellen, Formeln, zulässigen Filtern und
          Gültigkeitsbeginn. Wer eine registrierte Metrik abfragt, bekommt dieselbe Definition.
        </p>
        <MetricsRegistryDe />
        <p className="prose" style={{ marginTop: 18 }}>
          Ein Register allein erzwingt keine zeilenbasierten Berechtigungen, Maskierung oder regionale Datenhaltung. Bau diese Kontrollen in
          Abfrage- und Datenschicht ein, reich die Identität durch und teste jeden Verbraucherpfad.
        </p>
      </section>

      <section className="section">
        <SectionLabel n="8.2">Der Weg einer Abfrage</SectionLabel>
        <h2 className="h2">Eine Frage, Ad-hoc-SQL oder registrierte Metrik.</h2>
        <p className="prose">
          Frag <em>„Wie hoch war die DAU in den USA letzte Woche?“</em> Ohne
          Metrikschicht sucht die Analystin ähnlich benannte Tabellen, wählt
          eine und schreibt Ad-hoc-SQL, manchmal auf einer seit zwei Jahren
          abgekündigten Tabelle oder mit umbenannter Spalte. <b>Am Ergebnis
          ist der Fehler nicht erkennbar.</b>
        </p>
        <p className="prose">
          Mit einem Register löst der Verbraucher eine Metrikversion auf, bindet unterstützte Filter und führt die gespeicherte Definition gegen
          ihre deklarierten Quellen aus. Protokollier Version, Filter, Quellen-Snapshot oder Partitionen und Ausführungsidentität mit dem Ergebnis.
        </p>
        <MetricsSim />
      </section>

      <section className="section">
        <SectionLabel n="8.3">Was Verbraucher sehen</SectionLabel>
        <h2 className="h2">Eine Metrik, mehrere Schnittstellen.</h2>
        <p className="prose">
          Ein gemeinsames Register beseitigt eine Abweichungsquelle, die Formel. Quellenaktualität, Filterbindung, Zeitzone, Berechtigung, Cache
          und Definitionsversion trennen die Ergebnisse weiter, also gehört dieser Kontext in jeden Vergleich.
        </p>
        <div className="cards-2">
          <div className="ccard">
            <div className="ccard-t">Dashboards</div>
            <div className="ccard-n">Hex · Mode · Superset · Trino-Backend</div>
            <div className="ccard-d">
              Dashboards lösen die registrierte Version auf und erfassen Filter, Quellenstichtag und Cache-Zustand.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Notebooks und APIs</div>
            <div className="ccard-n">Ein Resolver, mehrere Aufrufer</div>
            <div className="ccard-d">
              Alle Aufrufer nutzen denselben Resolver und behalten ihre eigene Autorisierung und ihren Audit-Kontext.
            </div>
          </div>
        </div>
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Metrik-SQL in mehrere Schnittstellen kopieren.</b> Die Definition registrieren und versionieren und verbleibende Ad-hoc-Kopien erfassen.",
          "<b>Ad-hoc-Tabellenausgaben als geregelte Metrik veröffentlichen.</b> Exploration darf Rohdaten nutzen; veröffentlichte Metriken brauchen benannte Definition und Ausführungskontext.",
          "<b>Eine Metrik ohne Zuständigkeit registrieren.</b> Verantwortung für Definitionsänderung, Quellenwechsel und Abkündigung zuweisen.",
          "<b>Metrik-Autorisierung als Ersatz für Quellkontrollen behandeln.</b> Geringste Rechte über Resolver, Abfrage-Engine und Daten erzwingen.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Die Metrikschicht als <b>API</b> bereitstellen, damit Dashboards, Notebooks und externe Aufrufer Metriken gleich auflösen.",
          "Metrikänderungen als <b>Breaking Change</b> behandeln: versionieren, ankündigen und die alte Definition abkündigen.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch7ServeDe;
