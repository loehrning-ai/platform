import canonical from "../mental-model";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Der Daten-Stack von oben nach unten",
  subtitle: "Quelle → Log → Lake → Warehouse → Mart",
  hook: "Daten von der Quelle bis zum Consumer verfolgen und den Vertrag an jeder Grenze benennen.",
  keyConcepts: [
    "Quelle",
    "Log",
    "Verarbeitung",
    "Speicherung",
    "Bereitstellung",
    "Nutzung",
  ],
  sections: [
    {
      id: "s1",
      title: "Referenzmodell mit sechs Ebenen",
      content: `Datenplattformen unterscheiden sich. Ein Referenzmodell aus **Quelle, Log oder Ingestion, Verarbeitung, Speicher, Serving und Nutzung** erleichtert jedoch die Prüfung ihrer Grenzen. Ein System kann Ebenen zusammenlegen, auf ein dauerhaftes Log verzichten oder mehrere Speicher verwenden. Das Modell ist ein Diagnosewerkzeug, keine vorgeschriebene Architektur.

Dokumentiere für jedes Dataset seinen Ursprung, verändernde Transformationen, dauerhafte Kopien, die bereitstellende Schnittstelle und die Consumer. Diese Spur zeigt Zuständigkeit, Replay-Grenzen und die Stelle, an der ein falscher Wert in das System gelangt ist.`,
    },
    {
      id: "s2",
      title: "Den Weg eines Ereignisses verfolgen",
      content: `Betrachte eine Bestellung über \`$48.90\`, die ein mobiler Client erzeugt und die später in einem Betriebsbericht erscheint. Das interaktive Modell verfolgt dieses Beispiel durch sechs mögliche Ebenen. Die Animation verwendet feste Beispieldaten; sie erklärt Übergaben und Backpressure, nicht Produktionsdurchsatz.`,
    },
    {
      id: "s3",
      title: "Die Aufgabe jeder Schicht",
      content: `Eine Ebene ist dann begründet, wenn sie Form, Dauerhaftigkeit, Zuständigkeit oder Zugriffsvertrag der Daten verändert.

1. **Quelle.** Das System, das ein Ereignis erfasst oder veränderlichen Zustand besitzt: Anwendungsdatenbank, Gerät, Sensor oder externe API. Schema und Aufbewahrung bestimmen, was nachgelagerte Wiederherstellung rekonstruieren kann.
2. **Log oder Ingestion.** Eine optionale dauerhafte Übergabe zwischen Produzenten und Consumern. Partitionierte Logs können Ordnung innerhalb einer Partition, Aufbewahrung, Replay und Fan-out bieten; die Eigenschaften hängen von Konfiguration und Produzentendisziplin ab.
3. **Verarbeitung.** Filtert, validiert, reichert an, verbindet, aggregiert oder fenstert Daten. Batch-Jobs arbeiten auf begrenzter Eingabe. Stream-Jobs behandeln ihre Eingabe als unbegrenzt.
4. **Speicher.** Bewahrt Roh- oder Modelldaten auf. Object Stores, Tabellenformate und verwaltete Warehouses bieten unterschiedliche Transaktions-, Aufbewahrungs-, Governance- und Abfrageeigenschaften.
5. **Serving.** Stellt Daten für ein definiertes Zugriffsmuster und Latenzziel bereit: analytisches SQL, Schlüsselzugriff, Suche, Feature-Abruf oder API. Gemessene Lastziele bestimmen die Umsetzung.
6. **Nutzung.** Dashboards, Alarme, Modelle, Abrechnung, Betrugskontrollen und Produktfunktionen verwenden das Ergebnis. Ihre Korrektheits- und Freshness-Anforderungen wirken auf alle vorgelagerten Verträge zurück.

Zeichne im Design-Review nur die nötigen Ebenen. Beschrifte jeden Pfeil mit Ordnung, Aufbewahrung, Schema, Latenz und Fehlerverhalten, statt Produktnamen als Entwurf zu verwenden.`,
      keyTakeaway:
        "Eine Ebene ist durch eine konkrete Änderung an Form, Dauerhaftigkeit, Zuständigkeit oder Zugriffsvertrag begründet.",
    },
    {
      id: "s4",
      title: "Zwei Kräfte",
      content: `Zwei wiederkehrende Spannungen sind hilfreich, aber keine binären Entscheidungen:

- **Latenz, Durchsatz und Kosten.** Transaktionale Speicher optimieren häufig Schlüsselzugriffe; analytische Speicher häufig Scans und Aggregation. Verarbeitung und Serving verbinden diese Zugriffsmuster unter einem expliziten Freshness-Ziel.
- **Validierung vor oder nach dem Landing.** Schema-on-write weist Datensätze ab, die den Schreibvertrag verletzen. Schema-on-read verschiebt einen Teil der Interpretation zu den Lesern, benötigt bei wichtigen Daten aber weiterhin Ingestion-Prüfung, Metadaten und Quarantäneregeln.

Batch oder Streaming folgt aus Freshness, Replay-Modell, Betriebskosten und Fehlerbehebung. ETL oder ELT folgt aus Security-Grenzen, Quellbeschränkungen, Governance und dem Ort, an dem Transformationen sicher ausführbar sind.`,
    },
    {
      id: "s5",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s6",
      title: "Begriffe",
      content: `- **OLTP**, Online Transactional Processing: Systeme für transaktionale Lese- und Schreibvorgänge, häufig Schlüsselzugriffe auf aktuellen Anwendungszustand. Große analytische Scans können mit dieser Last konkurrieren.
- **OLAP**, Online Analytical Processing: Systeme für analytische Scans und Aggregation, häufig mit spaltenorientierter Ausführung und Speicherung.
- **ETL gegen ELT**, ETL transformiert vor dem Laden in das Ziel; ELT landet Daten vor der Transformation in der Zielplattform. Keine Reihenfolge garantiert Replay, Security oder geringere Kosten; Aufbewahrung und Kontrollen müssen explizit entworfen werden.
- **Bronze / Silver / Gold**, eine Namenskonvention für aufeinanderfolgende Datenqualitätsebenen. Teams müssen den Vertrag jeder Ebene definieren, statt sich auf Namen zu verlassen.
- **Lakehouse**, Object-Store-Daten unter einem Tabellenformat, das Snapshots, Transaktionen, Schemaentwicklung und Planungsmetadaten ergänzen kann. Fähigkeiten hängen von Format, Katalog, Engine und Konfiguration ab.
- **Schema beim Lesen oder Schreiben**, zwei Stellen, an denen ein Datenvertrag durchgesetzt werden kann. Produktionssysteme kombinieren häufig Ingestion-Prüfungen, gespeicherte Schemas und Reader-Validierung.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Welche Schicht ermöglicht den Wiederaufbau?",
      question:
        "Ein aufbewahrtes Ereignislog enthält innerhalb des Wiederherstellungsfensters jede akzeptierte Änderung mit stabilen Schlüsseln und Schemas. Welche Ebene ist bei Verlust abgeleiteter Speicher die beste Replay-Quelle?",
      options: [
        "Die Quelldatenbanken, weil dort die Wahrheit liegt.",
        "Das Log, weil das Szenario ihm ausdrücklich eine vollständige aufbewahrte Änderungshistorie gibt.",
        "Das Warehouse, weil es die saubersten Daten enthält.",
        "Die Dashboards, weil Menschen sie tatsächlich verwenden.",
      ],
      explanation:
        "Unter den genannten Annahmen kann das aufbewahrte Log abgeleitete Speicher innerhalb seines Aufbewahrungsfensters neu aufbauen. Das gilt nicht bei ausgelassenen Ereignissen, instabilen Schlüsseln oder Schemas, abgelaufener Aufbewahrung oder nicht erfassten externen Seiteneffekten. Wiederherstellungsaussagen müssen diese Grenzen benennen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "In welche Schicht gehört diese Abfrage?",
      question:
        'Das Marketing fragt: "Wie viele Personen aus jedem Land haben in den letzten 24 Stunden etwas gekauft?" Welche Schicht sollte antworten und welche darf nicht direkt belastet werden?',
      options: [
        "Die Abfrage sollte direkt gegen das Quell-Postgres laufen, weil dort die aktuellsten Daten liegen.",
        "Die Abfrage sollte direkt das Kafka-Log lesen, weil es die maßgebliche Quelle ist.",
        "Für diese breite Aggregation wird ein analytischer Serving-Pfad verwendet; direkter Zugriff auf die Quell-DB benötigt einen getrennt gemessenen operativen Anwendungsfall.",
        "Eine Fachkraft sollte die Daten als CSV exportieren.",
      ],
      explanation:
        "Eine große Aggregation auf der Transaktionsdatenbank kann Verbindungen, CPU, Speicher, Cache und I/O der Anwendung verbrauchen, auch ohne Zeilensperren. Ein getrennter analytischer Serving-Pfad isoliert diese Last. Direkte OLTP-Abfragen können für begrenzte operative Lesevorgänge mit gemessener Wirkung vertretbar sein.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "OLTP",
          q: "Online Transactional Processing (transaktionale Online-Verarbeitung)",
          a: "Systeme für transaktionale Lese- und Schreibvorgänge über aktuellen Anwendungszustand. Breite analytische Scans können mit latenzkritischen Verbindungen, CPU, Speicher und I/O konkurrieren.",
        },
        {
          term: "OLAP",
          q: "Online Analytical Processing (analytische Online-Verarbeitung)",
          a: "Systeme für analytische Scans und Aggregation. Speicherlayout, Ausführungsmodell, Parallelität und Lastisolierung bestimmen die tatsächliche Leistung.",
        },
        {
          term: "ETL vs ELT",
          q: "Warum ist heute meist von ELT die Rede?",
          a: "ETL transformiert vor dem Laden in das Ziel. ELT landet Daten vor der Transformation dort. Die Wahl folgt Security-Grenzen, Quellbeschränkungen, Replay, Governance und Ausführungskosten.",
        },
        {
          term: "Bronze / Silver / Gold",
          q: "Die Medallion-Architektur",
          a: "Eine Namenskonvention für aufeinanderfolgende Datenqualitätsebenen. Vertrag, Zuständigkeit, Aufbewahrung und erlaubte Transformationen jeder Ebene müssen definiert werden; die Namen liefern diese Eigenschaften nicht.",
        },
        {
          term: "Lakehouse",
          q: "Was bezeichnet der Begriff?",
          a: "Object-Store-Dateien unter einem Tabellenformat, das Snapshots, Transaktionen, Schemaentwicklung und Planungsmetadaten ergänzen kann. Fähigkeiten hängen von Format, Katalog, Engine und Konfiguration ab.",
        },
        {
          term: "Schema beim Lesen und Schreiben",
          q: "Wann fallen die Kosten des Schemas an?",
          a: "Schema-on-write prüft vor der Annahme gegen einen Vertrag. Schema-on-read verschiebt einen Teil der Interpretation zu Readern. Belastbare Plattformen setzen Verträge häufig an mehreren Grenzen durch.",
        },
      ],
    },
  ],
  preserve: [
    "Log",
    "OLTP",
    "OLAP",
    "ETL vs ELT",
    "Bronze / Silver / Gold",
    "Lakehouse",
  ],
});
