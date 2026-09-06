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
      content: `Was darf eine Abfrage überspringen? Partitionsmetadaten erlauben dem Query Planner, Dateigruppen auszuschließen, deren Partitionswerte ein Prädikat nicht erfüllen können. Das spart Planung und Daten-I/O. Die Laufzeit hängt trotzdem nicht allein an der Partitionszahl: Dateistatistiken, Speicheranfragen, Cache, Parallelität, Engine-Planung und das Restdatenvolumen wirken mit.

Drei Prüfungen vor jeder Wahl.

1. **Prädikatbezug.** Kandidatenschlüssel aus echten Filtern und Joins ableiten, nicht aus semantischer Vorliebe.
2. **Entstehende Dateiverteilung.** Bytes und Dateien je Partition für typische und schiefe Werte schätzen. Eine universelle Zielgröße gibt es nicht; Engines und Lasten haben verschiedene Zielkonflikte.
3. **Kardinalität und Entwicklung.** Ein hochkardinaler Schlüssel kann viele kleine Partitionen erzeugen, ein grober breite Scans. Neue Werte, verspätete Daten und künftige Granularitätswechsel mitdenken.`,
    },
    {
      id: "s1b",
      title: "Bereich, Hash und Liste",
      content: `Drei Strategien, drei Fehlerbilder.

- **Bereichspartitionierung.** Ordnet Zeilen Wertebereichen zu, etwa einem Monat von \`order_date\`. Erhält Bereichslokalität, kann aber Schreibvorgänge im aktuellen Zeitraum bündeln.
- **Hash-Partitionierung.** Ordnet einen Schlüssel einem von N Buckets zu, etwa \`hash(user_id) % 16\`. Kann einen geeigneten Schlüssel verteilen; Bereichsabfragen müssen meist jedes Bucket anfassen, schiefe Schlüssel bleiben heiß.
- **Listenpartitionierung.** Ordnet deklarierte Werte wie Regionen Partitionen zu. Trägt kategoriales Routing; neue oder leere Werte brauchen explizite Validierung und Rückfallverhalten.

Zeitbasierte oberste Partitionen sind verbreitet, weil viele analytische Abfragen Zeitprädikate tragen und Aufbewahrung nach Zeit arbeitet. Eine Vorgabe sind sie nicht. Tenant-Isolation, Rechtsraum, Ereignisverteilung und Abfragemuster können einen anderen Schlüssel begründen, oder gar keinen.`,
    },
    {
      id: "s1c",
      title: "Hive-Stil und verborgene Partitionierung",
      content: `Aus dem Pfad und aus Transformationen abgeleitete Partitionswerte sind zwei Verträge für Writer.

**Partitionierung im Hive-Stil** legt den Partitionswert in einen Pfad wie \`s3://lake/orders/order_date=2026-05-01/part-001.parquet\`. Writer müssen den Wert konsistent berechnen. Der Wert kann zusätzlich in der Datei stehen, ein Granularitätswechsel kann das Verschieben oder Neuschreiben bestehender Dateien verlangen, und abweichende Ableitungen von \`order_date\` erzeugen ein falsches Layout.

**Verborgene Partitionierung**, von Iceberg seit Spezifikation v1 unterstützt, deklariert eine Transformation wie \`PARTITIONED BY (days(order_ts))\` in den Tabellenmetadaten. Kompatible Writer leiten den Wert ab; Abfragen filtern weiter nach \`order_ts\`. Partitionsentwicklung kann \`days(order_ts)\` für neue Dateien durch \`hours(order_ts)\` ersetzen, während alte Dateien ihre frühere Spezifikation behalten. Reader müssen beide Layouts zusammen planen.

Das verringert die direkte Kopplung zwischen Anwendungscode und physischem Partitionswert. Die Korrektheitsanforderungen bleiben: Engine-Unterstützung, Transformationssemantik, Metadatenintegrität, Zeitzonenbehandlung und Pruning-Verhalten prüfst du für die eingesetzten Versionen.`,
      keyTakeaway:
        "Bei Partitionsentwicklung können neue Dateien eine neue Transformation verwenden, während alte ihr Layout behalten. Kompatible Reader müssen beide Spezifikationen planen.",
    },
    {
      id: "s2",
      title: "Einen Schlüssel wählen",
      content: `Das interaktive Modell wirft eine feste Abfrage auf fünf synthetische Layouts. Dateizahlen und gescannte Bytes sind Lerneingaben, keine Messungen und keine empfohlenen Schwellen.

Vergleich das relative Verhalten, dann wiederhol es mit Produktionsverteilungen. Stündliche Partitionen können bei wenig Volumen kleine Dateien erzeugen, Partitionen je Person können Schlüsselschiefe offenlegen, keine Partitionierung kann breite Scans erzwingen. Die richtige Wahl hängt an Daten und Engine.`,
    },
    {
      id: "s3",
      title: "Kleine Dateien",
      content: `Häufige Commits können Dateien erzeugen, die kleiner sind als die effiziente Scan-Einheit der Engine, vor allem wenn jede Partition pro Commit wenig Daten bekommt. Viele Dateien heißen mehr Metadaten-, Planungs-, Open-Request- und Scheduling-Arbeit. Wie viel, hängt an Speicher und Engine.

**Kompaktierung** schreibt ausgewählte Dateien in ein neues Layout. Das kostet Compute und I/O, veröffentlicht eine weitere Tabellenversion und kann mit parallelen Änderungen kollidieren. Löse sie aus gemessener Dateizahl, Größenverteilung und Query-Evidenz aus, nicht nach einem universellen Nachtplan.

Kompaktierungsbefehle und Optionen sind hersteller- und versionsabhängig. Prüf aktuelle Syntax, Isolationsverhalten, Zielgrößensemantik und Rollback-Prozess in der konkreten Engine, bevor du eine Tabelle betreibst.`,
    },
    {
      id: "s4",
      title: "Clustering und Z-Order",
      content: `Nicht alle Abfragen filtern dieselbe Spalte. Eine Tabelle kann nach einer Transformation oder einer zusammengesetzten Spezifikation partitionieren und die Datensätze innerhalb der entstehenden Dateigruppen clustern oder sortieren.

Sortierung kann die Minimum-/Maximumbereiche der Sortierspalten verengen. **Z-Ordering** und verwandte mehrdimensionale Clustering-Techniken versuchen, Lokalität über mehrere Spalten zu halten; der Nutzen hängt an Datenverteilung und Prädikatmix. Jede weitere Spalte verwässert Lokalität und erhöht Wartung. Eine universell sinnvolle Anzahl gibt es nicht.

Wähle Partitions- und Clustering-Spalten aus Query-Telemetrie, schätze Schreibverstärkung und prüf Pruning mit Plänen auf Dateiebene. Brauchen zwei Zugriffsmuster inkompatible Layouts, ist eine getrennte materialisierte Projektion klarer.`,
    },
    {
      id: "s5",
      title: "Sharding ist nicht Partitionierung",
      content: `Die Begriffe überlappen sich von Produkt zu Produkt. Definier sie im Kontext.

- **Analytische Partitionierung** gruppiert Tabellendaten meist für Pruning, Aufbewahrung und Wartung. Sie braucht weiterhin Metadaten und kann koordinierte Commits einschließen.
- **Datenbank-Sharding** verteilt Datensätze meist über unabhängig skalierbare Datenbankpartitionen oder Instanzen. Daraus folgen Routing-, Rebalancing-, Cross-Shard-Query- und Transaktionsfragen.

Hash-Routing kann geeignete Schlüssel verteilen und schwächt dabei die Bereichslokalität. Bereichs-Routing erhält Lokalität und kann heiße Bereiche erzeugen. Zusammengesetzte Schlüssel, virtuelle Shards und Online-Rebalancing bearbeiten je einen Teil dieses Zielkonflikts; die Schiefe messen musst du trotzdem.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Schiefe und Z-Order.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **Layout an gemessene Prädikate und Datenverteilung anpassen.** Pläne auf Dateiebene und gelesene Bytes prüfen, nicht nur den SQL-Text.
- **Bereich, Hash und Liste haben je ein Fehlerbild.** Heiße Bereiche, schiefe Schlüssel, neue Werte, Nullwerte und verspätete Daten vor der Wahl durchspielen.
- **Überpartitionierung erhöht Metadaten- und Small-File-Arbeit.** Dateigrößen aus Engine-Hinweisen und Lastmessungen wählen, nicht aus einer universellen Schwelle.
- **Verborgene Partitionierung und Partitionsentwicklung reduzieren die Kopplung von Writer und Query.** Alte und neue Spezifikationen koexistieren; Kompatibilität und Wartung bleiben deine Aufgabe.
- **Clustering trägt sekundäre Prädikate nur bei passender Last.** Re-Clustering-Kosten und Schreibverstärkung gehören in die Entscheidung.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Partition Pruning**, schließt Dateigruppen über Partitionsmetadaten und Prädikate aus, bevor Daten gelesen werden.
- **Bereichspartition**, erhält Bereichslokalität und kann Schreibvorgänge in aktuellen oder beliebten Bereichen bündeln.
- **Hash-Partition**, kann einen geeigneten Schlüssel verteilen, schwächt Bereichslokalität und beseitigt keine Schlüsselschiefe.
- **Listenpartition**, ordnet Kategorien explizit zu und braucht darum Validierung für neue, leere und Fallback-Werte.
- **Verborgene Partitionierung**, deklariert Transformationen in Tabellenmetadaten, sodass kompatible Writer und Reader Partitionswerte ableiten.
- **Überpartitionierung**, erzeugt durch hohe Kardinalität oder unnötig feine Granularität zu viele Metadaten oder kleine Dateien.
- **Liquid Clustering**, eine Delta-Lake-Layoutfunktion, deren Fähigkeiten und Grenzen du für die eingesetzte Version prüfst.
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
        "Interne Konten mit hohem Volumen: Bots, Testkonten, eine geteilte ID für Gäste oder nicht angemeldete Personen, dazu ein paar echte Großkunden, etwa Enterprise-Tenants.",
        "Die neuesten Personen.",
        "Das muss ein Programmfehler sein.",
      ],
      explanation:
        "Geteilte anonyme IDs, interner Verkehr, Automatisierung und große Tenants sind die üblichen Quellen für Schiefe. Denselben schiefen Schlüssel zu hashen verschiebt den Hotspot nur. Gegenmaßnahmen: ein deterministischer Salt wie `user_id + (event_id % 16)` mit korrekter Zusammenführung, getrennte Behandlung bekannter Verkehrsklassen oder Zeitpartitionierung plus Clustering nach Person. Jede Variante gegen Ordnungs- und Abfrageanforderungen messen.",
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
        "`order_date` als Partition behalten und innerhalb jeder Partition nach `country` Z-ordnen oder einfach sortieren.",
        "Eine zweite Tabellenkopie anlegen, partitioniert nach `country`.",
      ],
      explanation:
        "Ein zusammengesetztes `(order_date, country)`-Layout kann bis zu 73,000 Wertekombinationen pro Jahr erzeugen, bevor fehlende Kombinationen und mehrere Dateien mitzählen. Sortieren oder Clustern nach `country` innerhalb der Datumspartitionen ist eine plausible Hypothese und spart das Partitionsverzeichnis je Kombination. Dateistatistiken und Query-Pläne an repräsentativen Daten prüfen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Partition Pruning",
          q: "Wie sortiert die Engine Partitionen aus?",
          a: "Der Planner wendet die Prädikate auf die Partitionsmetadaten an und streicht Dateigruppen, die nicht passen können. Die Metadaten kosten weiterhin Planung; gestrichene Datendateien muss niemand öffnen.",
        },
        {
          term: "Bereichspartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für Zeitreihen mit Abfragen über aktuelle Bereiche. Fehlerfall: die Hot Partition. Der aktuelle Zeitraum nimmt alle Schreibvorgänge, historische Partitionen sind nur lesbar. Rollierende Fenster oder verteilte Schreibvorgänge helfen.",
        },
        {
          term: "Hash-Partition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für gleichmäßige Schreibverteilung über N Gruppen. Fehlerfall: verlorene Bereichslokalität, eine Bereichsabfrage muss alle N Gruppen lesen. Bei bereichslastigen analytischen Abfragen lieber Bereich oder Liste.",
        },
        {
          term: "Listenpartition",
          q: "Geeignet wofür, mit welchem Fehlerfall?",
          a: "Geeignet für deklariertes kategoriales Routing. Neue und leere Werte brauchen explizite Validierung; ein abgewiesener Schreibvorgang, ein Quarantänewert oder ein kontrollierter Rückfall kann sicherer sein als ein automatischer Auffangtopf.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Iceberg im Vergleich zum Hive-Stil",
          a: "Pfadbasierte Layouts legen physische Partitionswerte gegenüber Writern offen. Verborgene Partitionierung deklariert days(order_ts) in den Metadaten; bei Partitionsentwicklung nehmen neue Dateien eine neue Spezifikation, alte behalten ihr Layout.",
        },
        {
          term: "Überpartitionierung",
          q: "Das Antimuster",
          a: "Zu viele winzige Partitionen. Symptome: langsames Auflisten, hohe Metadatenkosten, Dateien <10MB. Ursache: ein hochkardinaler Schlüssel wie user_id oder event_id, oder Zeitgranularität in Minuten. Abhilfe: gröber einteilen oder stattdessen clustern.",
        },
        {
          term: "Liquid Clustering",
          q: "Was muss geprüft werden?",
          a: "Eine Delta-Lake-Layoutfunktion. Unterstützte Runtimes, Protokollanforderungen, Clustering Keys, Wartungsverhalten und Interoperabilität für die eingesetzte Version prüfen.",
        },
        {
          term: "Salt",
          q: "Wann wird ein Schlüssel gesalzen?",
          a: "Wenn ein Schlüssel heiß ist: Datensätze mit einer deterministischen oder kontrollierten Regel auf begrenzte Teilschlüssel wie 0..15 verteilen. Nachgelagerte Lesevorgänge oder Aggregate müssen sie wieder zusammenführen. Der Verteilungsgewinn muss die zusätzliche Lesearbeit überwiegen und die Reihenfolge erhalten.",
        },
      ],
    },
  ],
  preserve: ["Salt"],
});
