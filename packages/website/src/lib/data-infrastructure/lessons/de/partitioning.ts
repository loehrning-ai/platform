import canonical from "../partitioning";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Partitionierung, Clustering und kleine Dateien",
  subtitle:
    "Ein Petabyte so anordnen, dass eine Abfrage nur ein Megabyte liest",
  hook: "Dateilayout aus gemessenen Prädikaten, Verteilung, Dateigröße und Wartungskosten entwerfen.",
  keyConcepts: [
    "Partition Pruning",
    "Bereichs-, Hash- und Listenpartitionierung",
    "Verborgene Partitionierung",
    "Problem kleiner Dateien",
    "Kompaktierung",
    "Z-Ordering",
  ],
  sections: [
    {
      id: "s1",
      title: "Warum partitionieren?",
      content: `Mit Partitionsmetadaten schließt der Query Planner Dateigruppen aus, deren Partitionswerte ein Prädikat nicht erfüllen können. Das spart Planung und Daten-I/O. Die Laufzeit hängt außerdem an Dateistatistiken, Speicheranfragen, Cache, Parallelität, Engine-Planung und den Daten, die nach dem Pruning übrig bleiben.

1. **Prädikatbezug.** Leite Kandidatenschlüssel aus echten Filtern und Joins ab.
2. **Dateiverteilung.** Schätze Bytes und Dateien je Partition für typische und schiefe Werte. Keine Zielgröße passt zu jeder Engine und Last.
3. **Kardinalität und Entwicklung.** Ein hochkardinaler Schlüssel erzeugt viele kleine Partitionen, ein grober breite Scans. Denk neue Werte, verspätete Daten und künftige Granularitätswechsel mit.`,
    },
    {
      id: "s1b",
      title: "Bereich, Hash und Liste",
      content: `- **Bereichspartitionierung.** Ordnet Zeilen Wertebereichen zu, etwa einem Monat von \`order_date\`. Sie erhält Bereichslokalität und bündelt Schreibvorgänge im aktuellen Zeitraum.
- **Hash-Partitionierung.** Ordnet einen Schlüssel einem von N Buckets zu, etwa \`hash(user_id) % 16\`. Sie verteilt einen geeigneten Schlüssel, aber Bereichsabfragen fassen meist jedes Bucket an, und schiefe Schlüssel bleiben heiß.
- **Listenpartitionierung.** Ordnet deklarierte Werte wie Regionen Partitionen zu. Neue oder leere Werte brauchen explizite Validierung und einen Rückfall.

Zeit ist ein verbreiteter oberster Schlüssel, weil viele analytische Abfragen nach Zeit filtern und Aufbewahrung nach Zeit arbeitet. Tenant-Isolation, Rechtsraum, Ereignisverteilung und Abfragemuster können einen anderen Schlüssel begründen oder gar keine explizite Partitionierung.`,
    },
    {
      id: "s1c",
      title: "Hive-Stil und verborgene Partitionierung",
      content: `**Partitionierung im Hive-Stil** legt den Partitionswert in einen Pfad wie \`s3://lake/orders/order_date=2026-05-01/part-001.parquet\`. Writer müssen ihn konsistent berechnen, ein Granularitätswechsel kann das Verschieben oder Neuschreiben von Dateien verlangen, und abweichend abgeleitete Werte für \`order_date\` erzeugen ein falsches Layout.

**Verborgene Partitionierung**, von Iceberg seit Spezifikation v1 unterstützt, deklariert eine Transformation wie \`PARTITIONED BY (days(order_ts))\` in den Tabellenmetadaten. Kompatible Writer leiten den Wert ab, und Abfragen filtern weiter nach \`order_ts\`. Partitionsentwicklung kann \`days(order_ts)\` für neue Dateien auf \`hours(order_ts)\` umstellen, während alte Dateien ihre Spezifikation behalten; Reader planen über beide.

Das lockert die Kopplung zwischen Anwendungscode und physischem Layout. Engine-Unterstützung, Transformationssemantik, Metadatenintegrität, Zeitzonen und Pruning prüfst du trotzdem für die eingesetzten Versionen.`,
    },
    {
      id: "s2",
      title: "Einen Schlüssel wählen",
      content: `Das interaktive Modell wirft eine feste Abfrage auf fünf synthetische Layouts. Dateizahlen und gescannte Bytes sind Lerneingaben, keine Messungen oder Schwellen.

Vergleiche das relative Verhalten und wiederhole es dann mit Produktionsverteilungen. Stündliche Partitionen erzeugen bei wenig Volumen kleine Dateien, Partitionen je Person legen Schiefe offen, und ohne Partitionierung kommt es zu breiten Scans.`,
    },
    {
      id: "s3",
      title: "Kleine Dateien",
      content: `Häufige Commits erzeugen Dateien, die kleiner sind als die effiziente Scan-Einheit der Engine, vor allem wenn jede Partition pro Commit wenig Daten bekommt. Viele Dateien heißen mehr Metadaten-, Planungs-, Open-Request- und Scheduling-Arbeit.

**Kompaktierung** schreibt ausgewählte Dateien in ein neues Layout. Sie kostet Compute und I/O, veröffentlicht eine weitere Tabellenversion und kann mit parallelen Änderungen kollidieren. Löse sie deshalb aus gemessener Dateizahl, Größenverteilung und Abfragesignalen aus statt nach festem Nachtplan, und prüf vorher Syntax, Isolation, Zielgrößensemantik und Rollback in deiner Engine, weil die Befehle hersteller- und versionsabhängig sind.`,
    },
    {
      id: "s4",
      title: "Clustering und Z-Order",
      content: `Eine Tabelle kann nach einer Transformation oder einer zusammengesetzten Spezifikation partitionieren und die Datensätze innerhalb der Dateigruppen für weitere Filter clustern oder sortieren.

Sortierung verengt die Minimum-/Maximumbereiche der Sortierspalten. **Z-Ordering** und verwandtes mehrdimensionales Clustering versuchen, Lokalität über mehrere Spalten zu halten. Der Nutzen hängt an Datenverteilung und Prädikatmix, und jede weitere Spalte verwässert ihn und erhöht die Wartung.

Wähle Partitions- und Clustering-Spalten aus Query-Telemetrie, schätze die Schreibverstärkung und prüf Pruning in Plänen auf Dateiebene. Brauchen zwei Zugriffsmuster inkompatible Layouts, bau eine getrennte materialisierte Projektion.`,
    },
    {
      id: "s5",
      title: "Sharding ist nicht Partitionierung",
      content: `Beide Begriffe bedeuten je nach Produkt Verschiedenes.

- **Analytische Partitionierung** gruppiert Tabellendaten für Pruning, Aufbewahrung und Wartung.
- **Datenbank-Sharding** verteilt Datensätze über unabhängig skalierbare Datenbankpartitionen oder Instanzen und bringt Fragen zu Routing, Rebalancing, Cross-Shard-Queries und Transaktionen mit.

Beim Routing gilt derselbe Zielkonflikt zwischen Bereich und Hash. Zusammengesetzte Schlüssel, virtuelle Shards und Online-Rebalancing mildern je einen Teil davon, die Schiefe misst du trotzdem.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Schiefe und Z-Order.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- Prüf Pläne auf Dateiebene und gelesene Bytes, nicht nur den SQL-Text.
- Wähle Dateigrößen aus Engine-Hinweisen und Lastmessungen.
- Rechne Re-Clustering-Kosten und Schreibverstärkung in jede Clustering-Entscheidung ein.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Partition Pruning**, Dateigruppen über Partitionsmetadaten ausschließen.
- **Bereichspartition**, gruppiert Zeilen nach Wertebereich.
- **Hash-Partition**, verteilt einen Schlüssel auf N Buckets.
- **Listenpartition**, ordnet deklarierte Werte Partitionen zu.
- **Verborgene Partitionierung**, Partitionstransformationen in den Tabellenmetadaten.
- **Überpartitionierung**, zu viele kleine Partitionen oder Dateien.
- **Liquid Clustering**, eine Layoutfunktion von Delta Lake.
- **Salt**, ein Teilschlüssel, der einen Hot Key verteilt.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Die Falle schiefer Verteilungen",
      question:
        "Du partitionierst `events` nach `user_id` über 10M Personen. In Produktion sind 90% der Partitionen <100MB groß, aber 5 Partitionen jeweils >500GB. Welche IDs liegen dort?",
      options: [
        "Zufällige IDs; so sehen Verteilungen aus.",
        "Bots, Testkonten, eine geteilte Gast-ID und ein paar Großkunden, etwa Enterprise-Tenants.",
        "Die neuesten Personen.",
        "Das muss ein Programmfehler sein.",
      ],
      explanation:
        "Geteilte anonyme IDs, interner Verkehr, Automatisierung und große Tenants erzeugen die meiste Schiefe, und Hashen desselben Schlüssels verschiebt den Hotspot nur. Hilfreich sind ein deterministischer Salt wie `user_id + (event_id % 16)` mit Zusammenführung danach, getrennte Behandlung bekannten Verkehrs oder Zeitpartitionen mit Clustering nach Person.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Z-Order oder Partition",
      question:
        "Die Tabelle ist nach `order_date` partitioniert, und die Hälfte der Abfragen filtert zusätzlich nach `country`. Was ist die stärkste erste Entwurfshypothese?",
      options: [
        "Verschachtelte Partitionen nach `(order_date, country)`.",
        "Stattdessen nach `country` neu partitionieren.",
        "`order_date` behalten, darin nach `country` Z-ordnen oder sortieren.",
        "Eine zweite Tabellenkopie, partitioniert nach `country`.",
      ],
      explanation:
        "Ein zusammengesetztes `(order_date, country)`-Layout erreicht bis zu 73,000 Wertekombinationen pro Jahr. Sortieren oder Clustern nach `country` innerhalb der Datumspartitionen spart ein Verzeichnis je Kombination; prüf das mit Dateistatistiken und Query-Plänen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Partition Pruning",
          q: "Wie sortiert die Engine Partitionen aus?",
          a: "Der Planner wendet die Prädikate auf die Partitionsmetadaten an und streicht Dateigruppen, die nicht passen können. Planung kostet weiter Zeit; gestrichene Dateien öffnet niemand.",
        },
        {
          term: "Bereichspartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Zeitreihen mit Abfragen über aktuelle Bereiche. Fehlerfall: Die aktuelle Partition nimmt alle Schreibvorgänge, ältere werden nur gelesen. Rollierende Fenster oder verteilte Schreibvorgänge helfen.",
        },
        {
          term: "Hash-Partition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Gleichmäßige Schreibverteilung über N Buckets. Fehlerfall: keine Bereichslokalität, also liest eine Datumsabfrage alle N Buckets. Für bereichslastige Analysen passen Bereich oder Liste besser.",
        },
        {
          term: "Listenpartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Deklariertes kategoriales Routing. Neue und leere Werte brauchen Validierung; Abweisen, Quarantäne oder ein kontrollierter Rückfall ist sicherer als ein automatischer Auffangtopf.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Iceberg im Vergleich zum Hive-Stil",
          a: "Pfade im Hive-Stil legen Partitionswerte gegenüber Writern offen. Verborgene Partitionierung deklariert days(order_ts) in den Metadaten, und bei Partitionsentwicklung nehmen neue Dateien eine neue Spezifikation, alte behalten ihre.",
        },
        {
          term: "Überpartitionierung",
          q: "Das Antimuster",
          a: "Zu viele winzige Partitionen mit langsamem Auflisten, hohen Metadatenkosten und Dateien <10MB. Ursache sind hochkardinale Schlüssel (user_id, event_id) oder Minutengranularität; teile gröber ein oder clustere.",
        },
        {
          term: "Liquid Clustering",
          q: "Was muss geprüft werden?",
          a: "Eine Delta-Lake-Layoutfunktion. Prüf Runtimes, Protokollanforderungen, Clustering Keys, Wartung und Interoperabilität für deine Version.",
        },
        {
          term: "Salt",
          q: "Wann wird ein Schlüssel gesalzen?",
          a: "Wenn ein Schlüssel heiß ist, verteilst du ihn nach fester Regel auf begrenzte Teilschlüssel wie 0..15. Lesevorgänge und Aggregate führen sie wieder zusammen, und der Gewinn muss die zusätzliche Lesearbeit überwiegen, ohne die nötige Reihenfolge zu brechen.",
        },
      ],
    },
  ],
  preserve: ["Salt"],
});
