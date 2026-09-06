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
      content: `Keine zwei Datenplattformen sehen gleich aus. Prüfen lassen sich alle mit demselben Raster: **Quelle, Log oder Ingestion, Verarbeitung, Speicher, Serving und Nutzung**. Ein System darf Ebenen zusammenlegen, ohne dauerhaftes Log auskommen oder mehrere Speicher betreiben. Das Raster ist ein Diagnosewerkzeug, keine Bauvorschrift.

Schreib für jedes Dataset auf: Herkunft, verändernde Transformationen, dauerhafte Kopien, ausliefernde Schnittstelle, Consumer. Die Spur zeigt Zuständigkeit, Replay-Grenzen und die Stelle, an der ein falscher Wert ins System kam.`,
    },
    {
      id: "s2",
      title: "Den Weg eines Ereignisses verfolgen",
      content: `Ein mobiler Client erzeugt eine Bestellung über \`$48.90\`. Später steht sie in einem Betriebsbericht. Was passiert dazwischen? Das interaktive Modell verfolgt es durch sechs mögliche Ebenen, mit festen Beispieldaten. Es erklärt Übergaben und Backpressure, nicht Produktionsdurchsatz.`,
    },
    {
      id: "s3",
      title: "Die Aufgabe jeder Schicht",
      content: `Eine Ebene verdient ihren Platz nur, wenn sie an den Daten etwas ändert: Form, Dauerhaftigkeit, Zuständigkeit oder Zugriffsvertrag.

1. **Quelle.** Das System, in dem ein Ereignis entsteht oder veränderlicher Zustand lebt: Anwendungsdatenbank, Gerät, Sensor, externe API. Schema und Aufbewahrung entscheiden, was du später rekonstruieren kannst.
2. **Log oder Ingestion.** Eine optionale dauerhafte Übergabe zwischen Producern und Consumern. Ein partitioniertes Log kann Ordnung je Partition, Aufbewahrung, Replay und Fan-out liefern; das entscheiden Konfiguration und Producer-Disziplin.
3. **Verarbeitung.** Filtert, validiert, reichert an, joint, aggregiert oder fenstert. Ein Batch-Job kennt das Ende seiner Eingabe. Ein Stream-Job kennt es nicht.
4. **Speicher.** Hält Roh- oder Modelldaten fest. Object Store, Tabellenformat und verwaltetes Warehouse unterscheiden sich in Transaktionen, Aufbewahrung, Governance und Abfrageverhalten.
5. **Serving.** Liefert Daten für ein Zugriffsmuster und ein Latenzziel: analytisches SQL, Schlüsselzugriff, Suche, Feature-Abruf oder API. Die Umsetzung folgt gemessenen Lastzielen.
6. **Nutzung.** Dashboards, Alarme, Modelle, Abrechnung, Betrugsprüfung, Produktfunktionen. Was sie an Korrektheit und Freshness brauchen, schlägt auf jeden Vertrag davor durch.

Zeichne im Design-Review nur die Ebenen, die du brauchst. An jeden Pfeil gehören Ordnung, Aufbewahrung, Schema, Latenz und Fehlerverhalten. Produktnamen sind kein Entwurf.`,
      keyTakeaway:
        "Eine Ebene ist begründet, wenn sie Form, Dauerhaftigkeit, Zuständigkeit oder Zugriffsvertrag der Daten konkret verändert.",
    },
    {
      id: "s4",
      title: "Zwei Kräfte",
      content: `Zwei Spannungen tauchen in jedem Review auf. Keine ist ein Schalter.

- **Latenz, Durchsatz und Kosten.** Ein transaktionaler Speicher ist meist auf Schlüsselzugriffe getrimmt, ein analytischer auf Scans und Aggregation. Verarbeitung und Serving verbinden beide Muster unter einem ausgesprochenen Freshness-Ziel.
- **Validierung vor oder nach dem Landing.** Schema-on-write weist ab, was den Schreibvertrag verletzt. Schema-on-read schiebt einen Teil der Interpretation zu den Lesern. Wichtige Daten brauchen trotzdem Ingestion-Prüfung, Metadaten und Quarantäneregeln.

Batch oder Streaming? Das entscheiden Freshness, Replay-Modell, Betriebskosten und Fehlerbehebung. ETL oder ELT? Das entscheiden Security-Grenzen, Quellbeschränkungen, Governance und der Ort, an dem eine Transformation sicher laufen darf.`,
    },
    {
      id: "s5",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu den sechs Ebenen.",
    },
    {
      id: "s6",
      title: "Begriffe",
      content: `- **OLTP**, Online Transactional Processing. Systeme für transaktionale Lese- und Schreibvorgänge, meist Schlüsselzugriffe auf den aktuellen Anwendungszustand. Ein großer analytischer Scan kann mit dieser Last konkurrieren.
- **OLAP**, Online Analytical Processing. Systeme für analytische Scans und Aggregation, oft spaltenorientiert in Speicherung und Ausführung.
- **ETL gegen ELT**, ETL transformiert vor dem Laden, ELT landet zuerst und transformiert in der Zielplattform. Keine Reihenfolge garantiert Replay, Security oder niedrigere Kosten; Aufbewahrung und Kontrollen entwirfst du in beiden Fällen selbst.
- **Bronze / Silver / Gold**, eine Namenskonvention für gestufte Datenqualität. Der Name liefert keinen Vertrag; den schreibt das Team für jede Stufe selbst.
- **Lakehouse**, Daten im Object Store unter einem Tabellenformat, das Snapshots, Transaktionen, Schemaentwicklung und Planungsmetadaten ergänzen kann. Was davon greift, entscheiden Format, Katalog, Engine und Konfiguration.
- **Schema beim Lesen oder Schreiben**, zwei Stellen, an denen ein Datenvertrag greifen kann. Produktionssysteme kombinieren meist Ingestion-Prüfung, gespeichertes Schema und Reader-Validierung.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Welche Schicht ermöglicht den Wiederaufbau?",
      question:
        "Ein aufbewahrtes Ereignislog enthält innerhalb des Wiederherstellungsfensters jede akzeptierte Änderung, mit stabilen Schlüsseln und Schemas. Die abgeleiteten Speicher sind weg. Welche Ebene ist die beste Replay-Quelle?",
      options: [
        "Die Quelldatenbanken, weil dort die Wahrheit liegt.",
        "Das Log, weil das Szenario ihm ausdrücklich die vollständige aufbewahrte Änderungshistorie gibt.",
        "Das Warehouse, weil es die saubersten Daten enthält.",
        "Die Dashboards, weil dort die Leute tatsächlich hinschauen.",
      ],
      explanation:
        "Unter diesen Annahmen kann das Log jeden abgeleiteten Speicher innerhalb seines Aufbewahrungsfensters neu aufbauen. Die Annahmen sind der Punkt. Fehlen Ereignisse, wackeln Schlüssel oder Schemas, ist die Aufbewahrung abgelaufen oder wirkten externe Effekte am Log vorbei, gilt das nicht mehr. Eine Wiederherstellungsaussage ohne diese Grenzen ist keine.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "In welche Schicht gehört diese Abfrage?",
      question:
        'Die Marketing-Analystin fragt: "Wie viele Personen aus jedem Land haben in den letzten 24 Stunden gekauft?" Welche Schicht antwortet, und welche darf diese Last nicht direkt tragen?',
      options: [
        "Direkt gegen das Quell-Postgres, weil dort die frischesten Daten liegen.",
        "Direkt aus dem Kafka-Log, weil es die maßgebliche Quelle ist.",
        "Über einen analytischen Serving-Pfad. Direkter Zugriff auf die Quell-DB braucht einen eigenen, gemessenen operativen Anwendungsfall.",
        "Jemand exportiert die Daten als CSV.",
      ],
      explanation:
        "Eine breite Aggregation auf der Transaktionsdatenbank kann Verbindungen, CPU, Speicher, Cache und I/O der Anwendung auffressen, auch ohne Zeilensperren. Ein getrennter analytischer Serving-Pfad hält diese Last fern. Direkte OLTP-Abfragen bleiben vertretbar für begrenzte operative Lesevorgänge mit gemessener Wirkung.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "OLTP",
          q: "Online Transactional Processing (transaktionale Online-Verarbeitung)",
          a: "Systeme für transaktionale Lese- und Schreibvorgänge auf dem aktuellen Anwendungszustand. Ein breiter analytischer Scan kann mit latenzkritischen Verbindungen, CPU, Speicher und I/O konkurrieren.",
        },
        {
          term: "OLAP",
          q: "Online Analytical Processing (analytische Online-Verarbeitung)",
          a: "Systeme für analytische Scans und Aggregation. Speicherlayout, Ausführungsmodell, Parallelität und Lastisolierung entscheiden über die echte Leistung.",
        },
        {
          term: "ETL vs ELT",
          q: "Warum ist heute meist von ELT die Rede?",
          a: "ETL transformiert vor dem Laden. ELT landet zuerst und transformiert im Ziel. Die Wahl folgt Security-Grenzen, Quellbeschränkungen, Replay, Governance und Ausführungskosten, nicht der Mode.",
        },
        {
          term: "Bronze / Silver / Gold",
          q: "Die Medallion-Architektur",
          a: "Eine Namenskonvention für gestufte Datenqualität. Vertrag, Zuständigkeit, Aufbewahrung und erlaubte Transformationen jeder Stufe musst du definieren; die Namen liefern nichts davon.",
        },
        {
          term: "Lakehouse",
          q: "Was bezeichnet der Begriff?",
          a: "Dateien im Object Store unter einem Tabellenformat, das Snapshots, Transaktionen, Schemaentwicklung und Planungsmetadaten ergänzen kann. Was davon greift, entscheiden Format, Katalog, Engine und Konfiguration.",
        },
        {
          term: "Schema beim Lesen und Schreiben",
          q: "Wann fallen die Kosten des Schemas an?",
          a: "Schema-on-write prüft vor der Annahme gegen einen Vertrag. Schema-on-read schiebt einen Teil der Interpretation zu den Readern. Belastbare Plattformen setzen Verträge meist an mehreren Grenzen durch.",
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
