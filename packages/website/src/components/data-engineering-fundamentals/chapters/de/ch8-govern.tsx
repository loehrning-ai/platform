import { ANNOTATED_SPEC_YAML } from "../ch8-govern";
import { DataEngineeringFundamentalsLocaleProvider } from "../../locale-context";
import {
  AntiPatterns,
  BestPractices,
  CodeBlock,
  Hero,
  SectionLabel,
  Takeaway,
} from "../../primitives";
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
        title="Governance: Datenschutz ist kein später Prüfschritt, sondern die <span class='accent'>Deployment-Schranke</span>."
        hook="Der Kurs verwendet eine Referenzschranke, die deklarierte Identitätsklassen, ACL-Metadaten und Transformationsregeln prüft. Grün heißt hier: Die konfigurierten Regeln halten. Über rechtliche Konformität sagt das nichts."
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
          Eine Spalte hat einen technischen Typ. Sie hat außerdem ein richtlinienrelevantes
          <em> Subjekt</em>: <code>employee_email</code> identifiziert eine
          Person, <code>service_account_id</code> eine Anwendung,
          <code>contractor_id</code> eine externe Arbeitskraft. Die drei folgenden Bezeichnungen gehören zur Kurstaxonomie. Eine produktive
          Taxonomie stimmst du mit den Rechts-, Datenschutz-, Sicherheits- und Aufbewahrungsregeln deiner Organisation ab.
        </p>
        <div className="cards-3">
          <div className="ccard">
            <div className="ccard-t">PII_Person</div>
            <div className="ccard-n">Identifiziert einen regulären Beschäftigten</div>
            <div className="ccard-d">
              Kursbezeichnung für Werte, die eine Person direkt oder indirekt identifizieren, vorbehaltlich der Klassifikationsregeln der Organisation.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">Service_Identity</div>
            <div className="ccard-n">Identifiziert eine Anwendung oder einen Dienst</div>
            <div className="ccard-d">
              Kursbezeichnung für Anwendungs- oder Dienstkennungen. Sensitivität und Zugriff benötigen weiterhin eine ausdrückliche Klassifikation.
            </div>
          </div>
          <div className="ccard">
            <div className="ccard-t">PII_Contractor</div>
            <div className="ccard-n">Identifiziert eine externe Arbeitskraft</div>
            <div className="ccard-d">
              Kursbezeichnung für Kennungen externer Arbeitskräfte. Aufbewahrung und Zugriff folgen der anwendbaren Richtlinie und Rechtsordnung.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <SectionLabel n="9.2">Die Deployment-Schranke</SectionLabel>
        <h2 className="h2">Die Referenzschranke prüft deklarierte Metadaten.</h2>
        <p className="prose">
          Im Simulator hält Access Gateway jede deklarierte Spalte gegen die Kursregeln, löst <code>dataset_acl</code> auf und prüft optional
          eine Richtlinienzonen-Bindung. Konfigurierte Metadatenlücken findet die Schranke. Jeden sensiblen Wert, jeden Richtlinienkonflikt und
          jeden rechtlichen Anspruch findet sie ohne weitere Prüfung und Nachweise nicht.
        </p>
        <PermissionGateSim />
      </section>

      <section className="section">
        <SectionLabel n="9.3">Richtlinienzonen und abgeschottete Transformationen</SectionLabel>
        <p className="prose">
          Im Referenzdesign bindet eine <b>Richtlinienzone</b> die Ausführung an eine benannte Rechenumgebung. Eine abgeschottete Transformation
          nimmt mit <code>network=NO_NETWORK</code> den direkten Netzwerk-Egress weg. Beides allein reicht nicht: Identität, Speicher, Logs,
          Abhängigkeiten, Ausgaben und Deployment-Konfiguration gehören ebenso erzwungen und getestet.
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
          "<b>Erforderliche Klassifikationsmetadaten auslassen.</b> Die Deklaration korrigieren und untersuchen, warum Schema- oder Klassifikationsprüfung die neue Spalte nicht früher erkannt hat.",
          "<b><code>network=NO_NETWORK</code> als vollständige Isolation behandeln.</b> Abhängigkeiten, lokalen Speicher, Logs, Ausgaben, Laufzeitidentität und Durchsetzungsgrenze prüfen.",
          "<b>Breite ACL-Gruppen verwenden.</b> Vergib nur den Zugriff, den der dokumentierte Zweck braucht, und prüf Mitgliedschaft und Zuständigkeit regelmäßig.",
          "<b>Eine Kursbezeichnung als Rechtsauskunft verwenden.</b> Taxonomie auf genehmigte Richtlinie, Rechtsordnung, Aufbewahrung und Betroffenenregeln abbilden.",
        ]}
      />
      <BestPractices
        title="Saubere Umsetzung"
        items={[
          "Sensible Spalten mit der genehmigten Taxonomie der Organisation klassifizieren und Richtlinienquelle sowie Prüfung erfassen.",
          "Egress und Berechtigungen von Transformationen reduzieren und die gesamte Laufzeitgrenze statt nur eines Flags testen.",
          "ACLs nach geringsten Rechten und stabiler Zuständigkeit begrenzen. Projekt- und Teamgruppen bei Zuständigkeitswechseln prüfen.",
          "Regionale Kontrollen über Speicher, Rechenleistung, Backups, Logs, Supportzugriff und Replikation prüfen, bevor Aussagen zur Datenhaltung erfolgen.",
        ]}
      />
      <Takeaway
        title="Kernaussagen"
        items={[
          "Automatisierte Deployment-Prüfungen können deklarierte Richtlinienregeln erzwingen, ersetzen aber keine Datenschutz-, Sicherheits- oder Rechtsprüfung.",
          "Klassifikationstaxonomien sind organisationsspezifisch. Jede Bezeichnung mit genehmigter Richtlinie und Durchsetzung verbinden.",
          "DatasetSpec-Metadaten als Betriebsnachweis versionieren und nicht allein als rechtliche Feststellung behandeln.",
        ]}
      />
    </DataEngineeringFundamentalsLocaleProvider>
  );
}

export default Ch8GovernDe;
