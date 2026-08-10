import canonical from "../cdc-lambda-kappa";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "CDC, Lambda & Kappa",
  subtitle: "Change Data Capture · zwei Architekturen",
  hook: "Commitete Zeilenänderungen erfassen, Bootstrap und Replay definieren und einen oder zwei Verarbeitungspfade aus Anforderungen wählen.",
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
      content: `Eine Quelldatenbank soll einschließlich Inserts, Updates und Deletes in ein analytisches System gespiegelt werden. Periodisches Polling kann bei begrenztem Volumen, Freshness, Löschtracking und Quelllast funktionieren. Zeitstempel-Polling benötigt verlässliche Änderungsmarker und explizite Löschbehandlung.

**Change Data Capture (CDC)** liest eine Datenbank-Änderungsschnittstelle, häufig ein Transaktionslog oder einen logischen Replikationsstream, und gibt Zeilenänderungen aus. Ereignisform, Ordnungsumfang, Before Images, Transaktionsmetadaten und Zustellgarantien hängen von Datenbank, Connector und Konfiguration ab. CDC verbraucht außerdem Quellressourcen durch Snapshots, Log Decoding, Replikationsslots, Netzwerk und Aufbewahrung.

**Bootstrap und Fortsetzung.** Ein Connector kann einen konsistenten Snapshot erstellen und danach ab einer aufgezeichneten Logposition fortfahren. Debeziums PostgreSQL-Connector unterstützt mehrere Snapshot-Modi und Isolationseinstellungen. Sein initialer Ablauf liest eine Logposition, scannt konfigurierte Daten, protokolliert den Abschluss und streamt ab dort. Sperren, Sichtbarkeit, Retries und Dauer hängen von Konfiguration und Last ab. Consumer wiederholen den initialen Snapshot nicht zwingend, wenn dauerhafte Connector-Offsets bestehen.`,
      keyTakeaway:
        "Ein CDC-Entwurf muss Snapshot-Modus, Logposition, Ordnungsumfang, Aufbewahrung, Neustartverhalten und Quellwirkung benennen.",
    },
    {
      id: "s2",
      title: "Pipeline-Darstellung",
      content: `Das interaktive Diagramm vergleicht zwei vereinfachte Topologien: einen einzelnen wiedereinspielbaren Verarbeitungspfad sowie getrennte schnelle und neu berechnende Pfade. Es führt keine Connectoren aus und misst keine Freshness.

Debezium ist eine offene CDC-Plattform; der PostgreSQL-Connector verwendet Logical Decoding und Replikationsslots. Ein stillstehender Slot kann WAL aufbewahren und Speicher füllen. Überwache aufbewahrte Bytes, Connector-Lag, Slot-Zustand, Snapshot-Fortschritt und Berechtigungsumfang. Verwaltete und offene Alternativen unterscheiden sich in Quellen, Snapshot-Verhalten, Schemas, Security-Grenzen und Zustellsemantik. Aktuelle Connector-Dokumentation und Fehlertests gehören vor die Auswahl.`,
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

\`op\`-Werte können Creates, Updates, Deletes und Snapshot Reads kennzeichnen. Wichtige Einschränkungen:

1. **Before und After Images sind bedingt.** Replica Identity der Datenbank und Connector-Einstellungen bestimmen, ob ein vollständiges \`before\`-Bild besteht.
2. **Quellpositionen sind opake Fortschrittstoken.** PostgreSQL-LSNs sind Bytepositionen im WAL, keine fortlaufenden Ereignisnummern. Ein numerischer Sprung beweist kein fehlendes Ereignis. Connector-Offsets, Transaktionsmetadaten, Quellzustand und Reconciliation erkennen Lücken.
3. **Löschungen brauchen eine definierte Darstellung.** Delete-Ereignis, Tombstone oder Soft-Delete-Regel der Quelle müssen konsistent weitergegeben und aufbewahrt werden.

Serialisierung ist konfigurierbar: JSON, Avro, Protobuf und Registry-Integrationen sind Deployment-Entscheidungen. Eine Kompatibilitätsregel prüft Schemaentwicklung nach formatspezifischen Regeln; sie beweist nicht, dass Consumer-Fachlogik ein neues nullable Feld verarbeitet. Producer- und Consumer-Versionen vor Rollout durch Replay testen.`,
    },
    {
      id: "s4",
      title: "Lambda oder Kappa",
      content: `Die **Lambda-Architektur** hält einen Pfad mit geringer Latenz und einen getrennten Neuberechnungspfad, deren Ausgaben im Serving abgeglichen werden. Eine vertrauenswürdige Batch-Quelle kann Ergebnisse korrigieren oder neu aufbauen; Preis sind doppelte Logik und Reconciliation.

Die **Kappa-Architektur** verwendet einen Stream-Verarbeitungspfad für Live-Betrieb und Replay. Sie reduziert doppelte Implementierungen nur, wenn die Quelle vollständige wiedereinspielbare Historie bewahrt, derselbe Code mit seinen Abhängigkeiten alte Semantik reproduziert, Ziele Replay vertragen und Wiederherstellungszeit akzeptabel ist. Der Start ab Offset null ist kein allgemeiner Backfill-Plan, wenn Aufbewahrung abgelaufen ist oder Quelldaten aus Gesamtsnapshots kamen.

Kein Muster dominiert jede Last. Wähle einen Pfad, wenn Replay-Vollständigkeit und Wiederherstellungsziele nachgewiesen sind. Behalte einen getrennten Neuberechnungspfad, wenn autoritative Massendaten, lange Historie, komplexe Batch-Algorithmen oder unabhängige Reconciliation ihn begründen. In beiden Fällen Fachlogik versionieren und Replay-Ausgabe mit dauerhafter Quellevidenz vergleichen.`,
      keyTakeaway:
        "Ein Verarbeitungspfad reduziert doppelte Logik nur, wenn aufbewahrte Eingabe und versionierter Code die benötigte Historie reproduzieren können.",
    },
    {
      id: "s5",
      title: "Echtzeitmuster",
      content: `Eine mögliche Topologie ist PostgreSQL Logical Decoding → partitioniertes Log → zustandsbehaftete Verarbeitung → Lakehouse-Tabelle plus Query-Serving-Projektion. Sie ist ein Beispiel, kein Standardstack.

Definiere vor Einsatz Zuständigkeit der Source of Truth, Partitionsordnung, Snapshot-Bootstrap, Schemaentwicklung, Log-Aufbewahrung, Checkpoint- und Zielgarantien, Löschweitergabe, Serving-Freshness und Reconciliation. Das Log kann nur aufbewahrte Datensätze wiedergeben; Quelldatenbank, Snapshots, Object Storage und externe Effekte können autoritativen Zustand enthalten, den das Log nicht hat.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **WAL / binlog**, datenbankspezifische Transaktionslog-Mechanismen mit geordneten Quellpositionen für CDC. Berechtigungen, Aufbewahrung, Replica Identity und Failover sind relevant.
- **Snapshot und Stream**, ein Bootstrap-Muster, das eine zeitpunktbezogene Sicht erfasst und an einer kompatiblen Logposition fortsetzt. Snapshot-Modus und Konsistenz sind konfigurierbar.
- **Tombstone**, ein Kafka-Datensatz mit Schlüssel und Nullwert. In einem kompaktierten Topic wirkt er gemäß Kompaktierungs- und Aufbewahrungsregeln an der Schlüssellöschung mit; Entfernung ist nicht sofortig.
- **Schema Registry**, speichert versionierte Schemas und wendet konfigurierte Kompatibilitätsregeln an. Sie prüft weder Fachbedeutung noch jede Consumer-Implementierung.
- **Outbox-Muster**, schreibt Fachzustand und Outbox-Zeile in einer Datenbanktransaktion und veröffentlicht die Outbox danach asynchron. Es entfernt den Dual Write in der Anwendung, benötigt aber Publisher-Retries, Deduplizierung, Aufbewahrung und Monitoring.`,
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
        "Zeitstempel-Polling benötigt verlässliche Änderungsmarker und eine Löschdarstellung; seine Quellabfragekosten müssen gemessen werden. CDC hat andere Quell-, Aufbewahrungs- und Zustellkosten und ist nicht kostenlos.",
        "Polling ist veraltet.",
        "CDC benötigt weniger Netzwerkbandbreite.",
      ],
      explanation:
        "Polling kann bei begrenzter Last korrekt sein, wenn Updates und Deletes dauerhafte Marker besitzen und Abfragen indiziert sowie gemessen sind. CDC kann commitete Zeilenänderungen mit weniger Polling-Overhead offenlegen, ergänzt aber Snapshot-Scans, Log Decoding, Replikationsslot-Aufbewahrung, Connector-Offsets und At-least-once- oder begrenzte Transaktionssemantik. Vergleiche das gesamte Fehler- und Betriebsmodell.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Lambda oder Kappa",
      question:
        "Eine Lambda-Pipeline berechnet „wöchentlich aktive Personen“ einmal in Spark und einmal in Flink. Die Ergebnisse unterscheiden sich um 0,3%, die Ursache ist unbekannt. Wie sieht die IC5-Lösung aus?",
      options: [
        "Einen Unit-Test ergänzen.",
        "Doppelte Logik nur entfernen, wenn aufbewahrte Eingabe und versionierter Code die Historie reproduzieren können; sonst eine autoritative Berechnung definieren und beide Pfade dagegen abgleichen.",
        "Beide Werte mitteln.",
        "Maschinelles Lernen zur Abstimmung einsetzen.",
      ],
      explanation:
        "Zwei Implementierungen können durch Code, Zustand, Timing, verspätete Daten und Quellunterschiede abweichen. Ein versionierter Pfad kann das Risiko senken; Replay kann bei geänderter Aufbewahrung, Abhängigkeiten, Nichtdeterminismus oder Zielen trotzdem abweichen. Einen Berechnungsvertrag festlegen, versionieren und Ausgaben abgleichen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "WAL / binlog",
          q: "An welcher Stelle liest CDC?",
          a: "An einer datenbankspezifischen Änderungsschnittstelle, häufig einem Transaktionsprotokoll. PostgreSQL kann WAL über logische Replikation bereitstellen, MySQL das Binlog; Berechtigungen, Aufbewahrung und Failover-Verhalten müssen geprüft werden.",
        },
        {
          term: "Snapshot und Stream",
          q: "Wie startet CDC?",
          a: "Ein Connector kann einen konfigurierten konsistenten Snapshot erstellen und ab einer kompatiblen Logposition fortfahren. Snapshot-Modus, Sperren oder Isolation, Neustartverhalten und erneute Snapshots späterer Consumer hängen von Konfiguration und gespeicherten Offsets ab.",
        },
        {
          term: "Tombstone",
          q: "Wie markiert Kafka eine Löschung?",
          a: "Ein Datensatz mit Schlüssel und Nullwert. In kompaktierten Topics wirkt er gemäß Kompaktierungs- und Delete-Retention-Regeln an der Entfernung früherer Werte dieses Schlüssels mit. Connectoren können Löschereignis und Tombstone getrennt ausgeben.",
        },
        {
          term: "Schema Registry",
          q: "Warum ist sie erforderlich?",
          a: "Eine Registry speichert versionierte Schemas und wendet konfigurierte Kompatibilitätsregeln an. Das ersetzt weder fachliche Semantikprüfung noch die Prüfung konkreter Consumer und ihres Auslieferungsablaufs.",
        },
        {
          term: "Outbox-Muster",
          q: "Wann reicht direktes CDC nicht?",
          a: "Die Anwendung schreibt Fachzustand und eine Outbox-Zeile in einer Datenbanktransaktion. Ein Publisher oder CDC-Prozess liefert die Zeile asynchron mit Wiederholungen und Deduplizierung aus. Das entfernt den Dual Write aus Datenbank und Broker auf Anwendungsebene.",
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
