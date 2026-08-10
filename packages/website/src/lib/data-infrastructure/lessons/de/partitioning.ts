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
      content: `Partitionsmetadaten erlauben einem Query Planner, Dateigruppen auszuschließen, deren Partitionswerte ein Prädikat nicht erfüllen können. Das kann Planung und Daten-I/O reduzieren. Die Laufzeit ist aber nicht allein proportional zur Partitionszahl: Dateistatistiken, Speicheranfragen, Cache, Parallelität, Engine-Planung und verbleibendes Datenvolumen wirken ebenfalls.

Verwende drei Prüfungen:

1. **Prädikatbezug.** Kandidatenschlüssel aus tatsächlichen Filtern und Joins ableiten, nicht aus semantischer Vorliebe.
2. **Entstehende Dateiverteilung.** Bytes und Dateien je Partition für typische und schiefe Werte schätzen. Es gibt keine universelle Zielgröße; Engines und Lasten haben unterschiedliche Zielkonflikte.
3. **Kardinalität und Entwicklung.** Ein hochkardinaler Schlüssel kann viele kleine Partitionen erzeugen, ein grober Schlüssel breite Scans. Neue Werte, verspätete Daten und künftige Granularitätswechsel modellieren.`,
    },
    {
      id: "s1b",
      title: "Bereich, Hash und Liste",
      content: `Drei verbreitete Strategien haben unterschiedliche Fehlerbilder:

- **Bereichspartitionierung.** Ordnet Zeilen Wertebereichen zu, etwa einem Monat von \`order_date\`. Sie erhält Bereichslokalität, kann aber Schreibvorgänge im aktuellen Zeitraum konzentrieren.
- **Hash-Partitionierung.** Ordnet einen Schlüssel einem von N Buckets zu, etwa \`hash(user_id) % 16\`. Sie kann einen geeigneten Schlüssel verteilen; Bereichsabfragen müssen meist jedes Bucket berühren und schiefe Schlüssel können heiß bleiben.
- **Listenpartitionierung.** Ordnet deklarierte Werte wie Regionen Partitionen zu. Sie unterstützt kategoriales Routing; neue oder leere Werte brauchen explizite Validierung und Rückfallverhalten.

Zeitbasierte oberste Partitionen sind verbreitet, weil viele analytische Abfragen Zeitprädikate enthalten und Aufbewahrung zeitbezogen arbeitet. Sie sind keine Vorgabe: Tenant-Isolation, Rechtsraum, Ereignisverteilung und Abfragemuster können einen anderen Schlüssel oder keine explizite Partitionierung begründen.`,
    },
    {
      id: "s1c",
      title: "Hive-Stil und verborgene Partitionierung",
      content: `Aus dem Pfad und aus Transformationen abgeleitete Partitionswerte bilden unterschiedliche Verträge für Writer.

**Partitionierung im Hive-Stil** speichert einen Partitionswert in einem Pfad wie \`s3://lake/orders/order_date=2026-05-01/part-001.parquet\`. Writer müssen den Wert konsistent berechnen. Der Wert kann zusätzlich in der Datei stehen, ein Granularitätswechsel kann das Verschieben oder Neuschreiben bestehender Dateien verlangen und abweichende Ableitungen von \`order_date\` können ein falsches Layout erzeugen.

**Verborgene Partitionierung**, von Iceberg seit Spezifikation v1 unterstützt, deklariert eine Transformation wie \`PARTITIONED BY (days(order_ts))\` in Tabellenmetadaten. Kompatible Writer leiten den Wert ab; Abfragen filtern weiterhin nach \`order_ts\`. Partitionsentwicklung kann \`days(order_ts)\` für neue Dateien durch \`hours(order_ts)\` ersetzen, während alte Dateien ihre frühere Spezifikation behalten. Reader müssen beide Layouts gemeinsam planen.

Das verringert die direkte Kopplung zwischen Anwendungscode und physischem Partitionswert. Korrektheitsanforderungen bleiben bestehen: Engine-Unterstützung, Transformationssemantik, Metadatenintegrität, Zeitzonenbehandlung und Pruning-Verhalten müssen für die eingesetzten Versionen geprüft werden.`,
      keyTakeaway:
        "Bei Partitionsentwicklung können neue Dateien eine neue Transformation verwenden, während alte ihr Layout behalten; kompatible Reader müssen beide Spezifikationen planen.",
    },
    {
      id: "s2",
      title: "Einen Schlüssel wählen",
      content: `Das interaktive Modell wendet eine feste Abfrage auf fünf synthetische Layouts an. Dateizahlen und gescannte Bytes sind Lerneingaben, keine Messungen oder empfohlenen Schwellenwerte.

Vergleiche das relative Verhalten und wiederhole die Übung mit Produktionsverteilungen. Stündliche Partitionen können bei geringem Volumen kleine Dateien erzeugen; Nutzerpartitionen können Schlüsselschiefe offenlegen; ohne Partitionierung können breite Scans entstehen. Die richtige Wahl hängt von Daten und Engine ab.`,
    },
    {
      id: "s3",
      title: "Kleine Dateien",
      content: `Häufige Commits können Dateien erzeugen, die kleiner als die effiziente Scan-Einheit der Engine sind, besonders wenn jede Partition pro Commit wenig Daten erhält. Viele Dateien erhöhen Metadaten-, Planungs-, Open-Request- und Scheduling-Arbeit. Die Wirkung hängt von Speicher und Engine ab.

**Kompaktierung** schreibt ausgewählte Dateien in ein neues Layout. Sie verbraucht Compute und I/O, veröffentlicht eine weitere Tabellenversion und kann mit parallelen Änderungen kollidieren. Löse sie aus gemessener Dateizahl, Größenverteilung und Query-Evidenz aus statt nach einem universellen Nachtplan.

Kompaktierungsbefehle und Optionen sind hersteller- und versionsabhängig. Prüfe aktuelle Syntax, Isolationsverhalten, Zielgrößensemantik und Rollback-Prozess in der konkreten Engine, bevor eine Tabelle betrieben wird.`,
    },
    {
      id: "s4",
      title: "Clustering und Z-Order",
      content: `Abfragen können unterschiedliche Spalten filtern. Eine Tabelle kann nach einer Transformation oder einer zusammengesetzten Spezifikation partitionieren und Datensätze innerhalb der resultierenden Dateigruppen clustern oder sortieren.

Sortierung kann Minimum-/Maximumbereiche für Sortierspalten verengen. **Z-Ordering** und verwandte mehrdimensionale Clustering-Techniken versuchen Lokalität über mehrere Spalten zu erhalten. Der Nutzen hängt von Datenverteilung und Prädikatmix ab. Weitere Spalten verwässern Lokalität und erhöhen Wartungsarbeit; eine universelle sinnvolle Anzahl gibt es nicht.

Wähle Partitionierung und Clustering aus Query-Telemetrie, schätze Schreibverstärkung und prüfe Pruning mit Plänen auf Dateiebene. Eine separate materialisierte Projektion kann klarer sein, wenn zwei Zugriffsmuster inkompatible Layouts benötigen.`,
    },
    {
      id: "s5",
      title: "Sharding ist nicht Partitionierung",
      content: `Die Begriffe überschneiden sich zwischen Produkten und müssen im Kontext definiert werden:

- **Analytische Partitionierung** gruppiert Tabellendaten häufig für Pruning, Aufbewahrung und Wartung. Sie benötigt weiterhin Metadaten und kann koordinierte Commits umfassen.
- **Datenbank-Sharding** verteilt Datensätze häufig über unabhängig skalierbare Datenbankpartitionen oder Instanzen. Dadurch entstehen Routing-, Rebalancing-, Cross-Shard-Query- und Transaktionsfragen.

Hash-Routing kann geeignete Schlüssel verteilen und schwächt dabei Bereichslokalität. Bereichs-Routing erhält Lokalität und kann heiße Bereiche erzeugen. Zusammengesetzte Schlüssel, virtuelle Shards und Online-Rebalancing bearbeiten unterschiedliche Teile dieses Zielkonflikts; keines ersetzt die Messung von Schiefe.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **Layout an gemessene Prädikate und Datenverteilung anpassen.** Pläne auf Dateiebene und gelesene Bytes prüfen, nicht nur SQL-Text.
- **Bereich, Hash und Liste haben je ein Fehlerbild.** Heiße Bereiche, schiefe Schlüssel, neue Werte, Nullwerte und verspätete Daten vor der Wahl modellieren.
- **Überpartitionierung erhöht Metadaten- und Small-File-Arbeit.** Dateigrößenverteilung aus Engine-Hinweisen und Lastmessungen statt universeller Schwelle wählen.
- **Verborgene Partitionierung und Partitionsentwicklung reduzieren Kopplung von Writer und Query.** Alte und neue Spezifikationen können koexistieren; Kompatibilität und Wartung bleiben relevant.
- **Clustering unterstützt sekundäre Prädikate nur bei passender Last.** Re-Clustering-Kosten und Schreibverstärkung gehören in die Entscheidung.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Partition Pruning**, verwendet Partitionsmetadaten und Prädikate, um Dateigruppen vor dem Datenlesen auszuschließen.
- **Bereichspartition**, erhält Bereichslokalität und kann Schreibvorgänge in aktuellen oder häufigen Bereichen konzentrieren.
- **Hash-Partition**, kann einen geeigneten Schlüssel verteilen, schwächt Bereichslokalität und beseitigt keine Schlüsselschiefe.
- **Listenpartition**, ordnet Kategorien explizit zu und benötigt deshalb Validierung für neue, leere und Fallback-Werte.
- **Verborgene Partitionierung**, deklariert Transformationen in Tabellenmetadaten, sodass kompatible Writer und Reader Partitionswerte ableiten.
- **Überpartitionierung**, erzeugt durch hohe Kardinalität oder unnötig feine Granularität zu viele Metadaten oder kleine Dateien.
- **Liquid Clustering**, eine Delta-Lake-Layoutfunktion, deren Fähigkeiten und Grenzen für die eingesetzte Version geprüft werden müssen.
- **Salt**, ergänzt einen deterministischen oder kontrollierten Teilschlüssel zur Verteilung eines Hot Keys; nachgelagerte Lesevorgänge oder Aggregate müssen die Teilschlüssel korrekt zusammenführen.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Die Falle schiefer Verteilungen",
      question:
        "Du partitionierst `events` nach `user_id`. Der Datensatz enthält 10M Personen. In Produktion sind 90% der Partitionen <100MB groß, aber 5 Partitionen jeweils >500GB. Welche IDs liegen dort?",
      options: [
        "Zufällige IDs; so sehen Verteilungen aus.",
        "Interne Konten mit hohem Volumen: Bots, Testkonten, gemeinsam genutzte IDs für Gäste oder nicht angemeldete Personen und einige große Unternehmenskonten.",
        "Die neuesten Personen.",
        "Das muss ein Programmfehler sein.",
      ],
      explanation:
        "Gemeinsame anonyme IDs, interner Verkehr, Automatisierung und große Tenants sind typische Quellen für Schiefe. Hashing desselben schiefen Schlüssels verschiebt den Hotspot nur. Mögliche Gegenmaßnahmen sind ein deterministischer Salt wie `user_id + (event_id % 16)` mit korrekter nachgelagerter Zusammenführung, getrennte Behandlung bekannter Verkehrsklassen oder Zeitpartitionierung mit Clustering nach Nutzer. Jede Variante gegen Ordnungs- und Abfrageanforderungen messen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Z-Order oder Partition",
      question:
        "Die Tabelle ist nach `order_date` partitioniert. Die Hälfte der Abfragen filtert zusätzlich nach `country`. Welche Antwort ist die stärkste erste Entwurfshypothese?",
      options: [
        "Nach `(order_date, country)` in verschachtelten Partitionen partitionieren.",
        "Stattdessen nach `country` neu partitionieren.",
        "`order_date` als Partition beibehalten und innerhalb jeder Partition nach `country` Z-ordnen oder einfach sortieren.",
        "Eine zweite Tabellenkopie erstellen, die nach `country` partitioniert ist.",
      ],
      explanation:
        "Ein zusammengesetztes `(order_date, country)`-Layout kann bis zu 73,000 Wertekombinationen pro Jahr erzeugen, bevor fehlende Kombinationen und mehrere Dateien berücksichtigt werden. Sortierung oder Clustering nach `country` innerhalb der Datumspartitionen ist eine plausible Hypothese, die ein Partitionsverzeichnis je Kombination vermeidet. Dateistatistiken und Query-Pläne an repräsentativen Daten prüfen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Partition Pruning",
          q: "Wie sortiert die Engine Partitionen aus?",
          a: "Sie liest das Tabellenmanifest, ermittelt vorhandene Partitionswerte, schneidet sie mit dem Abfrageprädikat und öffnet nur Dateien aus den verbleibenden Partitionen. Ausgeschlossene Partitionen verursachen keinen Daten-IO.",
        },
        {
          term: "Bereichspartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für Zeitreihen mit Abfragen über aktuelle Bereiche. Der Fehlerfall ist eine Hot Partition: Der aktuelle Zeitraum nimmt alle Schreibvorgänge auf, historische Partitionen sind nur lesbar. Rollierende Fenster oder verteilte Schreibvorgänge helfen.",
        },
        {
          term: "Hash-Partition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für gleichmäßige Schreibverteilung über N Gruppen. Der Fehlerfall ist verlorene Bereichslokalität: Eine Bereichsabfrage muss alle N Gruppen lesen. Für analytische Bereichsabfragen sind Bereich oder Liste meist geeigneter.",
        },
        {
          term: "Listenpartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für bekannte, stabile Kategorien wie Region, Status oder Mandantenstufe. Der Fehlerfall ist die unbemerkte Fehlleitung eines neuen Enumerationswerts. Pflege stets eine OTHER-Auffangpartition.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Iceberg im Vergleich zum Hive-Stil",
          a: "Hive-Stil: physische, von der schreibenden Anwendung gepflegte Spalte im Dateipfad; neue Granularität bedeutet vollständige Neuschreibung. Iceberg: Transformation in Metadaten wie days(order_ts), keine Zusatzspalte, Entwicklung nur in Metadaten.",
        },
        {
          term: "Überpartitionierung",
          q: "Das Antimuster",
          a: "Zu viele kleine Partitionen. Hinweise sind langsames Auflisten, hohe Metadatenkosten und Dateien <10MB. Ursachen sind Schlüssel mit hoher Kardinalität wie user_id oder event_id und eine zu feine Zeitgranularität wie Minuten. Gröbere Einteilung oder Clustering beheben das Problem.",
        },
        {
          term: "Liquid Clustering",
          q: "Was muss geprüft werden?",
          a: "Es ist eine Delta-Lake-Layoutfunktion. Unterstützte Runtimes, Protokollanforderungen, Clustering Keys, Wartungsverhalten und Interoperabilität für die eingesetzte Version prüfen.",
        },
        {
          term: "Salt",
          q: "Wann wird ein Schlüssel gesalzen?",
          a: "Ein Hot Key kann mit einer deterministischen oder kontrollierten Regel auf begrenzte Teilschlüssel wie 0..15 verteilt werden. Nachgelagerte Lesevorgänge oder Aggregate müssen diese Teilschlüssel zusammenführen. Der Verteilungsvorteil muss die zusätzliche Lesearbeit überwiegen und die benötigte Reihenfolge erhalten.",
        },
      ],
    },
  ],
  preserve: ["Salt"],
});
