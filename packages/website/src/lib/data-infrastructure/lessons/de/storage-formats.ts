import canonical from "../storage-formats";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Zeilen und Spalten im Parquet-Format",
  subtitle: "Kodierungen · Zeilengruppen · Pushdown",
  hook: "Physisches Layout und Metadaten mit den Bytes verbinden, die eine analytische Abfrage lesen muss.",
  keyConcepts: [
    "Spaltenorientierter Speicher",
    "Zeilengruppe",
    "Predicate Pushdown",
    "Wörterbuchkodierung",
    "Bloomfilter",
  ],
  sections: [
    {
      id: "s1",
      title: "Warum Spaltenorientierung gewinnt",
      content: `Viele analytische Abfragen wählen einen Teil der Spalten, filtern Zeilen und aggregieren das Ergebnis. Das physische Layout beeinflusst, wie viele Daten die Engine laden und dekodieren muss.

Ein zeilenorientiertes Layout hält die Felder eines Datensatzes zusammen und begünstigt Schlüsseloperationen, die einen großen Teil eines Datensatzes benötigen. Ein spaltenorientiertes Layout gruppiert Werte innerhalb größerer Row Groups nach Spalten, sodass die Engine nicht ausgewählte Spalten auslassen kann. Ähnliche Werte lassen sich zudem effizient kodieren.

Die Verringerung hängt von der Last ab und ist kein fester Multiplikator. Projektionsbreite, Prädikatselektivität, Dateistatistiken, Kompression, Speicherlatenz, Cache-Zustand und Engine-Implementierung beeinflussen gelesene Bytes und Laufzeit.`,
    },
    {
      id: "s2",
      title: "Eine Abfrage, zwei Anordnungen",
      content: `Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf zwei kleine feste Layouts an und zählt die nach vereinfachten Regeln gewählten Zellen. Es erklärt Projektion und Pruning; es bildet weder Postgres noch Parquet, Speicher, Cache oder Query Engine nach.`,
    },
    {
      id: "s3",
      title: "Der Aufbau einer Parquet-Datei",
      content: `Parquet ist ein von vielen Analyse-Engines unterstütztes spaltenorientiertes Dateiformat. Eine Datei beginnt und endet mit den Magic Bytes \`PAR1\`. Dazwischen liegen eine oder mehrere **Row Groups**. Jede Row Group enthält je Spalte einen **Column Chunk**, und Chunks enthalten kodierte **Pages**. Der Footer erfasst Schema und Metadaten zur Position der Chunks; optionale Statistiken und Indizes können Pruning ermöglichen.

Writer wählen Größen für Row Groups und Pages. Verbreitete Vorgaben sind Ausgangspunkte, keine Anforderungen; die Zeilenzahl je Gruppe hängt von Zeilenbreite und Kodierung ab. Reader prüfen Footer-Metadaten, wählen benötigte Column Chunks und können Row Groups oder Pages auslassen, deren verfügbare Statistiken ein Prädikat nicht erfüllen können.

Drei Mechanismen sind wichtig:

1. **Spaltenprojektion.** Eine Abfrage für \`SUM(amount)\` kann nicht benötigte Column Chunks auslassen.
2. **Kodierung und Kompression.** Dictionary-, Run-Length-, Delta-, Bit-Packed- und Plain-Kodierung passen zu unterschiedlichen Werteverteilungen. Kompression muss an repräsentativen Daten gemessen werden.
3. **Statistiken und Indizes.** Wenn vertrauenswürdige Metadaten beweisen, dass eine Row Group \`amount > 1000\` nicht erfüllen kann, darf die Engine ihre Daten-Pages überspringen. Fehlende, gekürzte oder unbrauchbare Statistiken reduzieren Pruning.

ORC verwendet ein verwandtes spaltenorientiertes Design mit eigenen Metadaten und Indexentscheidungen. Avro ist zeilenorientiert und schemafähig. Wähle ein Format anhand von Consumern, Schemaentwicklung, Interoperabilität und gemessenem Lese- und Schreibverhalten statt einer festen Regel für Transport und Speicherung.`,
      keyTakeaway:
        "Eine Parquet-Leseoperation beginnt am Footer und springt danach nur zu den Zeilengruppen und Seiten, die für die Prädikate der Abfrage relevant sind.",
    },
    {
      id: "s4",
      title: "Kodierungen",
      content: `| Kodierung | Häufig geeignet für | Beispiel |
|---|---|---|
| Plain | Werte ohne Vorteil durch eine spezielle Kodierung. | Plain-Darstellung des Formats speichern. |
| Dictionary | Wiederholte Werte innerhalb des Dictionary-Limits. | \`"US"→0\`, \`"UK"→1\` plus Indizes. |
| RLE | Wiederholte Werte oder Definition-/Repetition-Level. | \`[0,0,0,0,1,1] → [(0,4),(1,2)]\`. |
| Bit-Packing | Ganzzahlen mit geringer erforderlicher Bitbreite. | Werte in die erforderlichen Bits packen. |
| Delta-Kodierung | Werte mit kleinen Deltas, etwa sortierte Ganzzahlen. | Differenzen zum vorherigen Wert speichern. |

Schätze logische Eingabe getrennt von kodierten und komprimierten Bytes. Teste danach repräsentative Dateien: Wirksamkeit hängt von Kardinalität, Ordnung, Nullverteilung, Codec und Writer-Einstellungen ab.`,
    },
    {
      id: "s5",
      title: "Iceberg und Delta",
      content: `Parquet und Lakehouse-Tabellenformate arbeiten auf unterschiedlichen Ebenen.

- **Parquet** definiert Bytes innerhalb einer Datei: Row Groups, Column Chunks, Pages, Kodierungen und Metadaten. Es definiert nicht, welche Dateien die aktuelle Version einer Tabelle bilden.
- **Apache Iceberg, Delta Lake und Apache Hudi** verwalten Mengen von Daten- und Delete-Dateien als Tabellenversionen. Sie definieren Commit-, Snapshot-, Schema-, Partitions- und Wartungsverhalten; Fähigkeiten unterscheiden sich nach Spezifikationsversion und Engine-Integration.

Ihre Metadatendesigns unterscheiden sich. Iceberg-Snapshots referenzieren Manifest Lists und Manifests. Delta erfasst Tabellenaktionen in \`_delta_log/\` und Checkpoints. Hudi verwaltet Timeline und File Groups. Diese Strukturen beeinflussen Planung, Konkurrenzvalidierung, inkrementelle Lesevorgänge, Wartung und Interoperabilität.

Wähle nicht aus einer statischen Feature-Matrix. Dokumentiere benötigte Operationen, Isolationsstufe, Löschsemantik, Partitionsentwicklung, unterstützte Engines, Katalog, Governance-Grenze und Upgrade-Pfad. Prüfe jede Anforderung gegen die aktuelle Spezifikation und die tatsächlich eingesetzten Engine-Versionen.`,
    },
    {
      id: "s6",
      title: "Bloomfilter",
      content: `Minimum-/Maximumstatistiken sind bei unsortierten Punktprädikaten mit hoher Kardinalität wie \`WHERE user_id = 'abc-123'\` häufig schwach. Ein **Bloomfilter** meldet entweder „sicher nicht enthalten“ oder „möglicherweise enthalten“. Ein korrekt konstruierter Filter hat für eingefügte Werte keine falsch negativen Ergebnisse; seine Falsch-positiv-Wahrscheinlichkeit hängt von Bitzahl, Hashzahl und eingefügten Elementen ab. Das interaktive Modell verwendet absichtlich einen winzigen 32-bit-Filter, damit Kollisionen sichtbar werden; es ist kein Beispiel für Produktionsdimensionierung.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Row Group**, eine horizontale Zeilenmenge mit einem Column Chunk je Spalte. Größe tauscht Metadaten und Parallelität gegen Scan- und Kompressionsverhalten; mit der Ziel-Engine testen.
- **Page**, ein kodierter Block in einem Column Chunk und eine Einheit, die ein Reader bei passenden Indizes dekodieren oder überspringen kann. Writer wählen die Größe.
- **Footer zuerst**, ein Reader lokalisiert Metadaten am Dateiende und plant danach benötigte Chunks und Pages. Range Requests auf Remote Storage und Engine-Verhalten bestimmen das tatsächliche I/O-Muster.
- **ORC**, ein weiteres spaltenorientiertes Dateiformat mit Stripes, Indizes und Kodierungen. Unterstützung und Leistung hängen von den gewählten Engines ab.
- **Avro**, ein zeilenorientiertes, schemafähiges Format für möglichen Datensatzaustausch oder Archivierung. Eignung hängt von Consumern und Zugriffsmustern ab.
- **Z-Ordering**, eine mehrdimensionale Clustering-Technik, die Data Skipping für ausgewählte Spalten verbessern kann. Der Nutzen sinkt, wenn Datenverteilung oder Prädikate nicht zur Wahl passen.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Predicate Pushdown",
      question:
        "Die Tabelle hat 1,000 Zeilengruppen. Die Abfrage lautet WHERE order_date = '2026-04-15'. Die Daten sind nach order_date sortiert. Wie viele Zeilengruppen öffnet die Engine ungefähr?",
      options: [
        "Alle 1,000, weil jede geprüft werden muss.",
        "Nur Row Groups, deren verfügbare Datumsstatistiken den 15. April überlappen; die genaue Anzahl hängt von Gruppengrenzen und Metadaten ab.",
        "Etwa 100, weil sich Zeilengruppen nicht überspringen lassen.",
        "Das hängt von der Kodierung ab.",
      ],
      explanation:
        "Sortierte Daten erzeugen häufig engere Minimum-/Maximumbereiche. Die Engine kann Gruppen ausschließen, deren vertrauenswürdige Statistiken nicht passen, und liest danach die überlappenden Gruppen. Genaue Anzahl und Beschleunigung benötigen echte Dateien, Metadaten, Engine, Speicher und Cache-Zustand.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Aussage des Bloomfilters",
      question:
        "Eine Abfrage sucht mit WHERE user_id = 'abc-123'. Der Bloomfilter der Spalte user_id meldet: \"Sicher nicht in dieser Zeilengruppe.\" Was tut die Engine?",
      options: [
        "Sie öffnet die Zeilengruppe vorsichtshalber trotzdem.",
        "Sie überspringt die Zeilengruppe vollständig, ohne Datenseiten zu lesen.",
        "Sie prüft erneut mit den Minimum-/Maximumstatistiken.",
        "Sie öffnet zufällig etwa ~50% der Zeilengruppen.",
      ],
      explanation:
        "Ein korrekt konstruierter Bloomfilter hat für eingefügte Werte keine falsch negativen Ergebnisse. „Sicher nicht enthalten“ erlaubt deshalb das Überspringen der abgedeckten Daten; „möglicherweise enthalten“ erfordert eine weitere Prüfung. Falsch-positiv-Ziel und Speicherintegration sind Implementierungsentscheidungen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Zeilengruppe",
          q: "Welche Größe ist angemessen?",
          a: "Aus gemessener Scangröße, Metadatenkosten, Kompression, Speicher und Parallelität wählen. Kleine Gruppen erhöhen Metadaten; große können Pruning-Granularität und Parallelität reduzieren.",
        },
        {
          term: "Seite",
          q: "Warum gibt es Seiten?",
          a: "Eine Page ist ein kodierter Block in einem Column Chunk. Reader dekodieren sie und können sie bei passenden Indizes und Prädikaten überspringen; Writer wählen ihre Größe.",
        },
        {
          term: "Footer zuerst",
          q: "Warum steht der Footer am Ende?",
          a: "Der Footer erfasst Schema und Positionen der Row Groups und Column Chunks. Reader lokalisieren ihn zuerst und führen danach die für ihren Plan erforderlichen Bereichsabfragen aus; die Zahl der Anfragen variiert.",
        },
        {
          term: "ORC",
          q: "Wie unterscheidet sich ORC?",
          a: "ORC ist ein spaltenorientiertes Format mit Stripes, Indizes und Kodierungen. Vergleiche Unterstützung und gemessenes Verhalten in den Engines, die es lesen und schreiben müssen.",
        },
        {
          term: "Avro",
          q: "Wann wird Avro verwendet?",
          a: "Ein zeilenorientiertes, schemafähiges Format. Es kann für Datensatzaustausch oder Archivierung passen; analytische Scans über einen Teil der Spalten bevorzugen häufig ein Spaltenformat.",
        },
        {
          term: "Z-Ordering",
          q: "Was bewirkt es?",
          a: "Eine mehrdimensionale Clustering-Technik, die Data Skipping für ausgewählte Spalten verbessern soll. Der Nutzen muss gegen Prädikatmix und Datenverteilung geprüft werden.",
        },
      ],
    },
  ],
  preserve: ["ORC", "Avro"],
});
