import canonical from "../cdc-lambda-kappa";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "CDC, Lambda & Kappa",
  subtitle: "Change Data Capture · zwei Architekturen",
  hook: "Commitete Zeilenänderungen erfassen, Bootstrap und Replay festlegen und aus den Anforderungen einen oder zwei Verarbeitungspfade wählen.",
  keyConcepts: [
    "Change Data Capture",
    "WAL/binlog",
    "Debezium",
    "Lambda-Architektur",
    "Kappa-Architektur",
  ],
  sections: [
    {
      id: "s1",
      title: "Warum CDC?",
      content: `Du willst eine Quelldatenbank samt Deletes ins analytische System spiegeln. Polling reicht, solange Volumen, Freshness, Löschtracking und Quelllast begrenzt bleiben, und braucht verlässliche Änderungsmarker und eine ausdrückliche Löschbehandlung.

**Change Data Capture (CDC)** liest eine Änderungsschnittstelle der Datenbank, meist ein Transaktionslog oder einen logischen Replikationsstream, und gibt Zeilenänderungen aus. Datenbank, Connector und Konfiguration bestimmen Ereignisform, Ordnung, Before Images und Zustellgarantien. Snapshots, Log Decoding, Replikationsslots und Aufbewahrung belasten die Quelle.

**Bootstrap und Fortsetzung.** Ein Connector erstellt einen konsistenten Snapshot und streamt dann ab einer aufgezeichneten Logposition. Debeziums PostgreSQL-Connector bietet mehrere Snapshot-Modi; Sperren, Retries und Dauer hängen an Konfiguration und Last. Mit dauerhaften Offsets müssen Consumer den Snapshot nicht wiederholen.`,
      keyTakeaway:
        "Ein CDC-Entwurf benennt Snapshot-Modus, Logposition, Ordnungsumfang, Aufbewahrung, Neustartverhalten und Quellwirkung.",
    },
    {
      id: "s2",
      title: "Pipeline-Darstellung",
      content: `Das Diagramm vergleicht einen wiedereinspielbaren Verarbeitungspfad mit getrennten schnellen und neu berechnenden Pfaden. Es führt keine Connectoren aus und misst keine Freshness.

Debeziums PostgreSQL-Connector arbeitet mit Logical Decoding und Replikationsslots. Ein stillstehender Slot hält WAL fest und kann den Speicher füllen, also überwachst du aufbewahrte Bytes, Connector-Lag, Slot-Zustand und Snapshot-Fortschritt. CDC-Werkzeuge unterscheiden sich in Quellen, Snapshots, Schemas, Security und Zustellsemantik; lies vor der Auswahl die aktuelle Dokumentation und fahre Fehlertests.`,
    },
    {
      id: "s3",
      title: "Aufbau eines Payloads",
      content: `\`\`\`json
{
  "op": "u",
  "ts_ms": 1714233601000,
  "source": {
    "db": "shop", "schema": "public", "table": "orders",
    "lsn": 287345128,
    "txId": 442817
  },
  "before": { "id": 42, "status": "pending", "amount": 4890 },
  "after":  { "id": 42, "status": "shipped", "amount": 4890 }
}
\`\`\`

\`op\` kennzeichnet Creates, Updates, Deletes und Snapshot Reads. Drei Einschränkungen:

1. **Before und After Images sind bedingt.** Replica Identity und Connector-Einstellungen entscheiden, ob ein vollständiges \`before\`-Bild existiert.
2. **Quellpositionen sind opake Fortschrittstoken.** PostgreSQL-LSNs sind Bytepositionen im WAL, keine Ereignisnummern, deshalb beweist ein numerischer Sprung keinen Verlust. Echte Lücken zeigen Connector-Offsets, Transaktionsmetadaten, Quellzustand und Reconciliation.
3. **Löschungen brauchen eine definierte Darstellung.** Delete-Ereignisse, Tombstones oder Soft Deletes der Quelle gibst du konsistent weiter und bewahrst sie auf.

Die Serialisierung (JSON, Avro, Protobuf) ist eine Deployment-Entscheidung. Ob deine Consumer-Logik ein neues nullable Feld verkraftet, zeigt die Kompatibilitätsprüfung einer Registry nicht; spiele Producer- und Consumer-Versionen vor dem Rollout per Replay durch.`,
    },
    {
      id: "s4",
      title: "Lambda oder Kappa",
      content: `Die **Lambda-Architektur** hält einen Pfad mit geringer Latenz und einen getrennten Neuberechnungspfad, die im Serving abgeglichen werden. Der Batch-Pfad kann Ergebnisse korrigieren oder neu aufbauen; der Preis ist doppelte Logik.

Die **Kappa-Architektur** nutzt einen Stream-Verarbeitungspfad für Live-Betrieb und Replay. Das spart die doppelte Implementierung nur, wenn die Quelle vollständige wiedereinspielbare Historie hält, derselbe Code mit seinen Abhängigkeiten alte Semantik reproduziert, Ziele Replay vertragen und die Wiederherstellungszeit akzeptabel ist. Ist die Aufbewahrung abgelaufen oder kamen Quelldaten aus Gesamtsnapshots, ist ein Neustart ab Offset null kein Backfill-Plan.

Nimm einen Pfad, wenn Replay-Vollständigkeit und Wiederherstellungsziele nachgewiesen sind, und behalte einen Neuberechnungspfad für autoritative Massendaten, lange Historie, komplexe Batch-Algorithmen oder unabhängige Reconciliation. Versioniere in beiden Fällen die Fachlogik und prüfe Replay gegen die Quelle.`,
      keyTakeaway:
        "Ein Verarbeitungspfad spart doppelte Logik nur, wenn aufbewahrte Eingabe und versionierter Code die benötigte Historie reproduzieren.",
    },
    {
      id: "s5",
      title: "Echtzeitmuster",
      content: `Eine Beispieltopologie ist PostgreSQL Logical Decoding → partitioniertes Log → zustandsbehaftete Verarbeitung → Lakehouse-Tabelle plus Query-Serving-Projektion.

Vor dem Einsatz legst du Zuständigkeit für die Source of Truth, Partitionsordnung, Snapshot-Bootstrap, Schemaentwicklung, Log-Aufbewahrung, Zielgarantien, Löschweitergabe und Reconciliation fest. Das Log gibt nur wieder, was es aufbewahrt hat; Quelle, Snapshots oder Object Storage können autoritativen Zustand halten, den das Log nie sah.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Polling und Replay.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **WAL / binlog**, das Transaktionslog der Datenbank mit geordneten Quellpositionen, das CDC liest.
- **Snapshot und Stream**, ein zeitpunktbezogener Snapshot, fortgesetzt ab einer kompatiblen Logposition.
- **Tombstone**, ein Kafka-Datensatz mit Schlüssel und Nullwert, der eine Löschung markiert.
- **Schema Registry**, speichert versionierte Schemas und prüft konfigurierte Kompatibilitätsregeln.
- **Outbox-Muster**, Fachzustand und Outbox-Zeile in einer Transaktion, asynchron veröffentlicht; Publisher-Retries, Deduplizierung und Monitoring bleiben nötig.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Warum nicht pollen?",
      question:
        "Ein Team pollt Postgres mit `SELECT * WHERE updated_at > last_seen`. Welche Grenze muss das Review vor dem Vergleich mit CDC benennen?",
      options: [
        "CDC ist schneller.",
        "Polling braucht verlässliche Änderungs- und Löschmarker und gemessene Abfragekosten; CDC kostet auch.",
        "Polling ist veraltet.",
        "CDC benötigt weniger Netzwerkbandbreite.",
      ],
      explanation:
        "Polling passt bei begrenzter Last mit dauerhaften Update- und Delete-Markern und indizierten, gemessenen Abfragen. CDC spart Polling-Overhead, bringt aber Snapshots, Log Decoding, Slot-Aufbewahrung, Connector-Offsets und At-least-once- oder begrenzte Transaktionszustellung mit.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Lambda oder Kappa",
      question:
        "Eine Lambda-Pipeline berechnet „wöchentlich aktive Personen“ einmal in Spark und einmal in Flink. Die Ergebnisse weichen um 0,3% ab, niemand weiß warum. Wie sieht die IC5-Lösung aus?",
      options: [
        "Einen Unit-Test ergänzen.",
        "Nur zu einem Pfad zusammenführen, wenn Replay die Historie reproduziert; sonst beide gegen eine autoritative Berechnung abgleichen.",
        "Beide Werte mitteln.",
        "Maschinelles Lernen zur Abstimmung einsetzen.",
      ],
      explanation:
        "Zwei Implementierungen driften über Code, Zustand, Timing, verspätete Daten und Quellunterschiede auseinander. Versioniere einen Berechnungsvertrag und gleiche dagegen ab; Replay kann bei geänderter Aufbewahrung, Abhängigkeiten, Nichtdeterminismus oder Zielen trotzdem abweichen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "WAL / binlog",
          q: "An welcher Stelle liest CDC?",
          a: "Am Log, das die Datenbank ohnehin für die Wiederherstellung schreibt: WAL in Postgres, Binlog in MySQL, CDC-Tabellen in SQL Server, Oplog in MongoDB.",
        },
        {
          term: "Snapshot und Stream",
          q: "Wie startet CDC?",
          a: "Mit einem konsistenten Snapshot, danach streamt er ab einer kompatiblen Logposition. Konfiguration und gespeicherte Offsets bestimmen Sperren, Neustarts und erneute Snapshots späterer Consumer.",
        },
        {
          term: "Tombstone",
          q: "Wie markiert Kafka eine Löschung?",
          a: "Mit einem Datensatz aus Schlüssel und Nullwert. In kompaktierten Topics entfernt er frühere Werte dieses Schlüssels nach Kompaktierung und Delete-Retention, also verzögert.",
        },
        {
          term: "Schema Registry",
          q: "Warum ist sie erforderlich?",
          a: "Eine neue Quellspalte ändert das Payload-Schema. Eine Registry speichert versionierte Avro- oder Protobuf-Schemas und prüft Backward-, Forward- oder Full-Kompatibilität; die Fachbedeutung prüfst du selbst.",
        },
        {
          term: "Outbox-Muster",
          q: "Wann reicht direktes CDC nicht?",
          a: "Fachzustand und Outbox-Zeile landen in einer Datenbanktransaktion; ein Publisher oder CDC liefert die Zeile später aus. So entfällt der Dual Write aus Datenbank und Broker.",
        },
      ],
    },
  ],
  preserve: [
    "CDC, Lambda & Kappa",
    "Change Data Capture",
    "WAL/binlog",
    "Debezium",
    "WAL / binlog",
    "Tombstone",
  ],
});
