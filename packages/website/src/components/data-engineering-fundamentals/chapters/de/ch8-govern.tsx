import { ANNOTATED_SPEC_YAML } from "../ch8-govern";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import { AntiPatterns, BestPractices, CodeBlock, Hero, SectionLabel } from "../../primitives";
import { PermissionGateSim } from "../../simulators/permission-gate-sim";
import type { ChapterMeta } from "@/lib/data-engineering-fundamentals/types";

export interface Ch8GovernDeProps {
  readonly chapter: ChapterMeta;
}

export function Ch8GovernDe({ chapter }: Ch8GovernDeProps) {
  return (
    <DataEngineeringFundamentalsLocaleProvider locale="de">
      <Hero
        accent={chapter.inkHex}
        eyebrow={`Kapitel ${chapter.displayNumber} · ${chapter.estimatedMinutes} min`}
        title="Governance: Datenschutz wird an der <span class='accent'>Deployment-Schranke</span> geprüft."
        hook="Die Referenzschranke prüft deklarierte Identitätsklassen, ACL-Metadaten und Transformationsregeln."
        meta={[
          { k: "Deployment-Schranke", v: "Access Gateway" },
          { k: "ACL", v: "dataset_acl" },
          { k: "Akteure", v: "PII_Person · Service_Identity" },
        ]}
      />

      <section className="section">
        <SectionLabel n="9.1">Akteur-Annotationen</SectionLabel>
        <h2 className="h2">Jede Spalte deklariert, wen oder was sie identifiziert.</h2>
        <p className="prose">
          Eine Spalte hat einen technischen Typ und ein richtlinienrelevantes{" "}
          <em>Subjekt</em>: <code>employee_email</code> identifiziert eine
          Person, <code>service_account_id</code> eine Anwendung,{" "}
          <code>contractor_id</code> eine externe Arbeitskraft. Die drei Bezeichnungen unten sind Kursbezeichnungen; eine produktive Taxonomie
          stimmst du mit den Rechts-, Datenschutz-, Sicherheits- und Aufbewahrungsregeln deiner Organisation ab.
        </p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">PII_Person</div>
            <div className="ccard-n">Identifiziert einen regulären Beschäftigten</div>
            <div className="ccard-d">
              Werte, die eine Person direkt oder indirekt identifizieren, nach den Klassifikationsregeln der Organisation.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Service_Identity</div>
            <div className="ccard-n">Identifiziert eine Anwendung oder einen Dienst</div>
            <div className="ccard-d">
              Anwendungs- oder Dienstkennungen. Sensitivität und Zugriff brauchen weiterhin eine ausdrückliche Klassifikation.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">PII_Contractor</div>
            <div className="ccard-n">Identifiziert eine externe Arbeitskraft</div>
            <div className="ccard-d">
              Kennungen externer Arbeitskräfte. Aufbewahrung und Zugriff folgen der anwendbaren Richtlinie und Rechtsordnung.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="9.2">Die Deployment-Schranke</SectionLabel>
        <h2 className="h2">Die Referenzschranke prüft deklarierte Metadaten.</h2>
        <p className="prose">
          Im Simulator prüft Access Gateway jede deklarierte Spalte gegen die Kursregeln, löst <code>dataset_acl</code> auf und prüft optional
          eine Richtlinienzonen-Bindung. Das Gateway findet fehlende Metadaten. Sensible Werte, Richtlinienkonflikte und rechtliche Anforderungen
          brauchen weitere Prüfung und Nachweise.
        </p>
        <PermissionGateSim />
      </section>

      <section className="section">
        <SectionLabel n="9.3">Richtlinienzonen und abgeschottete Transformationen</SectionLabel>
        <p className="prose">
          Eine <b>Richtlinienzone</b> bindet die Ausführung an eine benannte Rechenumgebung, und eine abgeschottete Transformation verliert mit{" "}
          <code>network=NO_NETWORK</code> den direkten Netzwerk-Egress. Identität, Speicher, Logs, Abhängigkeiten, Ausgaben und
          Deployment-Konfiguration müssen trotzdem erzwungen und getestet werden.
        </p>
        <CodeBlock
          title="dim_users.spec.yaml · ausgelieferte Annotation"
          lang="YAML"
          html={ANNOTATED_SPEC_YAML}
        />
      </section>

      <AntiPatterns
        title="Fehlmuster"
        items={[
          "<b>Erforderliche Klassifikationsmetadaten auslassen.</b> Die Deklaration korrigieren und klären, warum die Prüfung die neue Spalte übersehen hat.",
          "<b><code>network=NO_NETWORK</code> als vollständige Isolation behandeln.</b> Abhängigkeiten, lokalen Speicher, Logs, Ausgaben, Laufzeitidentität und Durchsetzungsgrenze prüfen.",
          "<b>Breite ACL-Gruppen verwenden.</b> Vergib nur den Zugriff, den der dokumentierte Zweck braucht, und prüf Mitgliedschaft und Zuständigkeit regelmäßig.",
          "<b>Eine Kursbezeichnung als Rechtsauskunft verwenden.</b> Taxonomie auf genehmigte Richtlinie, Rechtsordnung, Aufbewahrung und Betroffenenregeln abbilden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Sensible Spalten mit der genehmigten Taxonomie klassifizieren und Richtlinienquelle und Prüfer erfassen.",
          "Regionale Kontrollen über Speicher, Rechenleistung, Backups, Logs, Supportzugriff und Replikation prüfen, bevor du Aussagen zur Datenhaltung machst.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch8GovernDe;
