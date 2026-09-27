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
      content: `Datenplattformen sehen verschieden aus, prüfen lassen sich alle mit demselben Raster: **Quelle, Log oder Ingestion, Verarbeitung, Speicher, Serving und Nutzung**. Ein System darf Ebenen zusammenlegen, ohne dauerhaftes Log auskommen oder mehrere Speicher betreiben.

Notiere für jedes Dataset Herkunft, verändernde Transformationen, dauerhafte Kopien, ausliefernde Schnittstelle und Consumer. Die Spur zeigt Zuständigkeit, Replay-Grenzen und die Stelle, an der ein falscher Wert ins System kam.`,
    },
    {
      id: "s2",
      title: "Den Weg eines Ereignisses verfolgen",
      content: `Ein mobiler Client erzeugt eine Bestellung über \`$48.90\`, die später in einem Betriebsbericht steht. Drück im Modell oben auf **1 Ereignis verfolgen** und begleite sie durch die sechs Ebenen, mit Übergaben und Backpressure.`,
    },
    {
      id: "s3",
      title: "Die Aufgabe jeder Schicht",
      content: `Eine Ebene verdient ihren Platz nur, wenn sie Form, Dauerhaftigkeit, Zuständigkeit oder Zugriffsvertrag der Daten ändert.

1. **Quelle.** Hier entstehen Ereignisse oder lebt veränderlicher Zustand: App-Datenbank, Gerät, Sensor, externe API. Schema und Aufbewahrung begrenzen, was eine Wiederherstellung rekonstruieren kann.
2. **Log oder Ingestion.** Optionale dauerhafte Übergabe zwischen Producern und Consumern. Ein partitioniertes Log kann Ordnung je Partition, Aufbewahrung, Replay und Fan-out liefern; was davon greift, entscheiden Konfiguration und Producer-Disziplin.
3. **Verarbeitung.** Filtert, validiert, reichert an, joint, aggregiert oder fenstert. Ein Batch-Job kennt das Ende seiner Eingabe, ein Stream-Job nicht.
4. **Speicher.** Hält Roh- oder Modelldaten. Object Store, Tabellenformat und Warehouse unterscheiden sich in Transaktionen, Aufbewahrung, Governance und Abfrageverhalten.
5. **Serving.** Liefert Daten für ein Zugriffsmuster und ein Latenzziel: analytisches SQL, Schlüsselzugriff, Suche, Features oder API. Die Umsetzung folgt gemessenen Lastzielen.
6. **Nutzung.** Dashboards, Alarme, Modelle, Abrechnung, Betrugsprüfung und Produktfunktionen. Ihr Bedarf an Korrektheit und Freshness bestimmt jeden Vertrag davor.

Zeichne im Design-Review nur die Ebenen, die das Problem braucht, und schreib an jeden Pfeil Ordnung, Aufbewahrung, Schema, Latenz und Fehlerverhalten.`,
    },
    {
      id: "s4",
      title: "Zwei Kräfte",
      content: `- **Latenz, Durchsatz und Kosten.** Transaktionale Speicher sind auf Schlüsselzugriffe getrimmt, analytische auf Scans und Aggregation. Verarbeitung und Serving verbinden beide unter einem ausgesprochenen Freshness-Ziel.
- **Validierung vor oder nach dem Landing.** Schema-on-write weist ab, was den Vertrag verletzt. Schema-on-read überlässt einen Teil der Interpretation den Lesern und braucht trotzdem Ingestion-Prüfung und Quarantäneregeln.`,
    },
    {
      id: "s5",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu den sechs Ebenen, unter den Begriffen.",
    },
    {
      id: "s6",
      title: "Begriffe",
      content: `Die Lernkarten unter den Fragen erklären OLTP, OLAP, ETL vs ELT, Bronze / Silver / Gold, Lakehouse sowie Schema beim Lesen und Schreiben.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Welche Schicht ermöglicht den Wiederaufbau?",
      question:
        "Die abgeleiteten Speicher sind weg. Das aufbewahrte Log hält jede akzeptierte Änderung im Wiederherstellungsfenster, mit stabilen Schlüsseln und Schemas. Woraus spielst du neu ein?",
      options: [
        "Aus den Quelldatenbanken, weil dort die Wahrheit liegt.",
        "Aus dem Log, weil es die vollständige Änderungshistorie hält.",
        "Aus dem Warehouse, weil es die saubersten Daten hat.",
        "Aus den Dashboards, weil dort die Leute hinschauen.",
      ],
      explanation:
        "Unter diesen Annahmen baut das Log abgeleitete Speicher innerhalb seines Aufbewahrungsfensters neu auf. Fehlende Ereignisse, instabile Schlüssel oder Schemas, abgelaufene Aufbewahrung oder Seiteneffekte außerhalb des Logs brechen das, deshalb nennt eine Wiederherstellungsaussage diese Grenzen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "In welche Schicht gehört diese Abfrage?",
      question:
        'Eine Analystin fragt: "Wie viele Personen aus jedem Land haben in den letzten 24 Stunden gekauft?" Welche Schicht antwortet, und welche soll sie nicht direkt abfragen?',
      options: [
        "Direkt das Quell-Postgres, dort liegen die frischesten Daten.",
        "Direkt das Kafka-Log, es ist die maßgebliche Quelle.",
        "Ein analytischer Serving-Pfad; die Quell-DB nur mit gemessenem Anlass.",
        "Jemand exportiert die Daten als CSV.",
      ],
      explanation:
        "Eine breite Aggregation auf der Transaktionsdatenbank frisst Verbindungen, CPU, Speicher, Cache und I/O der Anwendung, auch ohne Zeilensperren. Ein analytischer Pfad hält sie fern; begrenzte Lesezugriffe mit gemessener Wirkung dürfen auf OLTP bleiben.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "OLTP",
          q: "Online Transactional Processing (transaktionale Online-Verarbeitung)",
          a: "Auf Schlüsselzugriffe im aktuellen Zustand getrimmt. Ein breiter analytischer Scan konkurriert um Verbindungen, CPU, Speicher und I/O.",
        },
        {
          term: "OLAP",
          q: "Online Analytical Processing (analytische Online-Verarbeitung)",
          a: "Auf Scans und Aggregation getrimmt. Layout, Ausführungsmodell, Parallelität und Lastisolierung entscheiden über die echte Leistung.",
        },
        {
          term: "ETL vs ELT",
          q: "Warum ist heute meist von ELT die Rede?",
          a: "ETL transformiert vor dem Laden, ELT landet zuerst und transformiert im Ziel. Keine Reihenfolge garantiert Replay, Security oder niedrigere Kosten; die Wahl folgt Security-Grenzen, Quellbeschränkungen, Replay-Bedarf, Governance und Kosten.",
        },
        {
          term: "Bronze / Silver / Gold",
          q: "Die Medallion-Architektur",
          a: "Namen für gestufte Datenqualität. Vertrag, Zuständigkeit, Aufbewahrung und erlaubte Transformationen jeder Stufe legst du selbst fest.",
        },
        {
          term: "Lakehouse",
          q: "Was bezeichnet der Begriff?",
          a: "Dateien im Object Store unter einem Tabellenformat, das Snapshots, Transaktionen, Schemaentwicklung und Planungsmetadaten ergänzen kann. Was davon greift, entscheiden Format, Katalog, Engine und Konfiguration.",
        },
        {
          term: "Schema beim Lesen und Schreiben",
          q: "Wo wird der Vertrag durchgesetzt?",
          a: "Beim Schreiben wird vor der Annahme geprüft, beim Lesen deuten die Leser einen Teil selbst. Belastbare Plattformen setzen Verträge an mehreren Stellen durch.",
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
