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
      content: `Eine analytische Abfrage liest meist wenige Spalten, filtert Zeilen und aggregiert. Wie viel die Engine dafür laden und dekodieren muss, entscheidet das physische Layout.

Ein Zeilenlayout hält die Felder eines Datensatzes zusammen und passt zu Schlüsseloperationen, die fast den ganzen Datensatz brauchen. Ein Spaltenlayout gruppiert Werte innerhalb von Row Groups nach Spalten; die Engine lässt nicht gewählte Spalten liegen, und ähnliche Werte lassen sich kompakt kodieren. Die Ersparnis hängt an Projektionsbreite, Prädikatselektivität, Dateistatistiken, Kompression, Speicherlatenz, Cache-Zustand und Engine.`,
    },
    {
      id: "s2",
      title: "Eine Abfrage, zwei Anordnungen",
      content: `Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf zwei kleine feste Layouts an und zählt die nach vereinfachten Regeln gewählten Zellen. Es erklärt Projektion und Pruning und bildet weder Postgres noch Parquet, Speicher, Cache oder Engine nach.`,
    },
    {
      id: "s3",
      title: "Der Aufbau einer Parquet-Datei",
      content: `Parquet ist ein spaltenorientiertes Dateiformat, das die meisten Analyse-Engines lesen. Eine Datei beginnt und endet mit den Magic Bytes \`PAR1\`, dazwischen liegen eine oder mehrere **Row Groups**. Jede Row Group enthält je Spalte einen **Column Chunk**, und Chunks enthalten kodierte **Pages**.

Der Footer hält Schema, Chunk-Positionen und optionale Statistiken und Indizes. Größen für Row Groups und Pages wählt der Writer; wie viele Zeilen in eine Gruppe passen, hängt an Zeilenbreite und Kodierung. Ein Reader liest zuerst den Footer und spart dann auf drei Wegen gelesene Bytes.

1. **Spaltenprojektion.** Eine Abfrage für \`SUM(amount)\` lässt nicht benötigte Column Chunks liegen.
2. **Kodierung und Kompression.** Dictionary, Run-Length, Delta, Bit-Packed und Plain passen zu unterschiedlichen Werteverteilungen; die Kompression misst du an repräsentativen Daten.
3. **Statistiken und Indizes.** Beweisen vertrauenswürdige Metadaten, dass eine Row Group \`amount > 1000\` nicht erfüllen kann, überspringt die Engine ihre Daten-Pages. Fehlende, gekürzte oder unbrauchbare Statistiken kosten Pruning.

Zwischen Parquet, ORC und Avro wählst du nach Consumern, Schemaentwicklung, Interoperabilität und gemessenem Lese- und Schreibverhalten.`,
    },
    {
      id: "s4",
      title: "Kodierungen",
      content: `| Kodierung | Häufig geeignet für | Beispiel |
|---|---|---|
| Plain | Werte, denen keine spezielle Kodierung hilft. | Plain-Darstellung speichern. |
| Dictionary | Wiederholte Werte innerhalb des Dictionary-Limits. | \`"US"→0\`, \`"UK"→1\` plus Indizes. |
| RLE | Wiederholte Werte oder Definition-/Repetition-Level. | \`[0,0,0,0,1,1] → [(0,4),(1,2)]\`. |
| Bit-Packing | Ganzzahlen mit geringer Bitbreite. | Werte in die nötigen Bits packen. |
| Delta-Kodierung | Kleine Deltas, etwa sortierte Ganzzahlen. | Differenzen zum vorherigen Wert speichern. |

Vergleiche logische, kodierte und komprimierte Bytes an repräsentativen Dateien. Kardinalität, Ordnung, Nullwerte, Codec und Writer-Einstellungen verändern das Ergebnis.`,
    },
    {
      id: "s5",
      title: "Iceberg und Delta",
      content: `Parquet und Lakehouse-Tabellenformate arbeiten auf verschiedenen Ebenen.

- **Parquet** definiert die Bytes in einer Datei: Row Groups, Column Chunks, Pages, Kodierungen, Metadaten. Welche Dateien die aktuelle Tabellenversion bilden, definiert es nicht.
- **Apache Iceberg, Delta Lake und Apache Hudi** verwalten Mengen von Daten- und Delete-Dateien als Tabellenversionen. Sie definieren Commit-, Snapshot-, Schema-, Partitions- und Wartungsverhalten, das je nach Spezifikationsversion und Engine-Integration variiert.

Iceberg-Snapshots verweisen auf Manifest Lists und Manifests, Delta protokolliert Tabellenaktionen in \`_delta_log/\` und Checkpoints, Hudi führt Timeline und File Groups. Diese Strukturen prägen Planung, Konkurrenz, inkrementelles Lesen und Wartung.

Für die Wahl listest du Operationen, Isolation, Löschsemantik, Partitionsentwicklung, Engines, Katalog, Governance und Upgrade-Pfad auf, die du brauchst, und prüfst jeden Punkt gegen die aktuelle Spezifikation und deine Engine-Versionen.`,
    },
    {
      id: "s6",
      title: "Bloomfilter",
      content: `Minimum-/Maximumstatistiken helfen bei unsortierten Punktprädikaten mit hoher Kardinalität wie \`WHERE user_id = 'abc-123'\` wenig. Ein **Bloomfilter** antwortet „sicher nicht enthalten“ oder „vielleicht enthalten“. Korrekt gebaut liefert er für eingefügte Werte keine falsch negativen Antworten, und seine Falsch-positiv-Rate folgt aus Bitzahl, Hashzahl und eingefügten Elementen. Das interaktive Modell nimmt einen winzigen 32-bit-Filter, damit Kollisionen sichtbar werden; für die Dimensionierung in Produktion taugt er nicht.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum Pruning.",
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Row Group**, gemeinsam gespeicherte Zeilen mit einem Column Chunk je Spalte.
- **Page**, ein kodierter Block in einem Column Chunk.
- **Footer zuerst**, Dateimetadaten am Ende lesen, bevor Daten geladen werden.
- **ORC**, ein Spaltenformat mit Stripes, Indizes und Kodierungen.
- **Avro**, ein zeilenorientiertes, schemafähiges Austauschformat.
- **Z-Ordering**, mehrdimensionales Clustering für Data Skipping.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Predicate Pushdown",
      question:
        "Die Tabelle hat 1,000 Zeilengruppen, sortiert nach order_date. Die Abfrage lautet WHERE order_date = '2026-04-15'. Wie viele Zeilengruppen öffnet die Engine ungefähr?",
      options: [
        "Alle 1,000, weil sie jede prüfen muss.",
        "Nur die, deren Datumsstatistiken den 15. April überlappen.",
        "Etwa 100, weil sich Zeilengruppen nicht überspringen lassen.",
        "Das hängt von der Kodierung ab.",
      ],
      explanation:
        "Sortierte Daten liefern enge Minimum-/Maximumbereiche, also streicht die Engine Gruppen, deren Statistiken nicht passen können, und liest den Rest. Die genaue Anzahl hängt an echten Dateien, Metadaten und Engine.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Aussage des Bloomfilters",
      question:
        "Eine Abfrage sucht mit WHERE user_id = 'abc-123'. Der Bloomfilter für user_id meldet \"sicher nicht in dieser Zeilengruppe\". Was tut die Engine?",
      options: [
        "Sie öffnet die Zeilengruppe vorsichtshalber trotzdem.",
        "Sie überspringt die Zeilengruppe vollständig, ohne Datenseiten zu lesen.",
        "Sie prüft erneut mit den Minimum-/Maximumstatistiken.",
        "Sie öffnet zufällig etwa ~50% der Zeilengruppen.",
      ],
      explanation:
        "Ein korrekter Bloomfilter liefert für eingefügte Werte keine falsch negativen Antworten, also darf die Engine bei „sicher nicht enthalten“ die Daten überspringen. Nur „vielleicht enthalten“ verlangt eine weitere Prüfung.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Zeilengruppe",
          q: "Welche Größe ist angemessen?",
          a: "Die aus gemessener Scangröße, Metadatenkosten, Kompression, Speicher und Parallelität folgt. Kleine Gruppen treiben Metadaten hoch, große kosten Pruning-Granularität und Parallelität.",
        },
        {
          term: "Seite",
          q: "Warum gibt es Seiten?",
          a: "Ein kodierter Block in einem Column Chunk. Reader überspringen Pages, wenn Indizes und Prädikate es erlauben; die Größe wählt der Writer.",
        },
        {
          term: "Footer zuerst",
          q: "Warum steht der Footer am Ende?",
          a: "Er hält Schema und Positionen der Row Groups und Column Chunks. Reader holen ihn zuerst und schicken danach nur die Range Reads, die ihr Plan braucht.",
        },
        {
          term: "ORC",
          q: "Wie unterscheidet sich ORC?",
          a: "Ein spaltenorientiertes Format aus Stripes mit Indizes und Kodierungen. Vergleiche Unterstützung und gemessenes Verhalten in deinen Engines.",
        },
        {
          term: "Avro",
          q: "Wann wird Avro verwendet?",
          a: "Ein zeilenorientiertes, schemafähiges Format für Datensatzaustausch oder Archivierung. Analytische Scans über wenige Spalten bevorzugen meist ein Spaltenformat.",
        },
        {
          term: "Z-Ordering",
          q: "Was bewirkt es?",
          a: "Mehrdimensionales Clustering, das Data Skipping für ausgewählte Spalten verbessern soll. Prüfe es gegen deine echten Prädikate und die Datenverteilung.",
        },
      ],
    },
  ],
  preserve: ["ORC", "Avro"],
});
