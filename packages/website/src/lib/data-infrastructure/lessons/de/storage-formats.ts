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
      content: `Eine analytische Abfrage will meist wenige Spalten, filtert Zeilen und aggregiert. Wie viel die Engine dafür laden und dekodieren muss, entscheidet das physische Layout.

Ein Zeilenlayout hält die Felder eines Datensatzes zusammen. Gut für Schlüsseloperationen, die einen großen Teil des Datensatzes brauchen. Ein Spaltenlayout gruppiert Werte innerhalb größerer Row Groups nach Spalten; die Engine lässt nicht gewählte Spalten liegen, und ähnliche Werte lassen sich kompakt kodieren.

Die Ersparnis hängt an der Last. Ein fester Multiplikator ist sie nicht. Projektionsbreite, Prädikatselektivität, Dateistatistiken, Kompression, Speicherlatenz, Cache-Zustand und Engine-Implementierung bestimmen gelesene Bytes und Laufzeit.`,
    },
    {
      id: "s2",
      title: "Eine Abfrage, zwei Anordnungen",
      content: `Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf zwei kleine feste Layouts an und zählt die nach vereinfachten Regeln gewählten Zellen. Es erklärt Projektion und Pruning. Postgres, Parquet, Speicher, Cache oder Query Engine bildet es nicht nach.`,
    },
    {
      id: "s3",
      title: "Der Aufbau einer Parquet-Datei",
      content: `Parquet ist ein spaltenorientiertes Dateiformat, das viele Analyse-Engines unterstützen. Eine Datei beginnt und endet mit den Magic Bytes \`PAR1\`. Dazwischen liegen eine oder mehrere **Row Groups**. Jede Row Group enthält je Spalte einen **Column Chunk**, und Chunks enthalten kodierte **Pages**. Der Footer hält Schema und die Metadaten zur Position der Chunks; optionale Statistiken und Indizes können Pruning ermöglichen.

Größen für Row Groups und Pages wählt der Writer. Verbreitete Vorgaben sind Ausgangspunkte, keine Anforderungen; wie viele Zeilen in eine Gruppe passen, hängt an Zeilenbreite und Kodierung. Ein Reader liest die Footer-Metadaten, wählt die nötigen Column Chunks und überspringt Row Groups oder Pages, deren Statistiken ein Prädikat unmöglich erfüllen.

Drei Mechanismen zählen.

1. **Spaltenprojektion.** Eine Abfrage für \`SUM(amount)\` lässt nicht benötigte Column Chunks liegen.
2. **Kodierung und Kompression.** Dictionary, Run-Length, Delta, Bit-Packed und Plain passen zu unterschiedlichen Werteverteilungen. Was Kompression bringt, misst du an repräsentativen Daten.
3. **Statistiken und Indizes.** Beweisen vertrauenswürdige Metadaten, dass eine Row Group \`amount > 1000\` nicht erfüllen kann, darf die Engine ihre Daten-Pages überspringen. Fehlende, gekürzte oder unbrauchbare Statistiken kosten Pruning.

ORC verwendet ein verwandtes spaltenorientiertes Design mit eigenen Metadaten und Indexentscheidungen. Avro ist zeilenorientiert und schemafähig. Wähle das Format nach Consumern, Schemaentwicklung, Interoperabilität und gemessenem Lese- und Schreibverhalten, nicht nach einer festen Regel für Transport und Speicherung.`,
      keyTakeaway:
        "Ein Parquet-Reader springt zuerst zum Footer und danach nur zu den Row Groups und Pages, die die Prädikate der Abfrage brauchen.",
    },
    {
      id: "s4",
      title: "Kodierungen",
      content: `| Kodierung | Häufig geeignet für | Beispiel |
|---|---|---|
| Plain | Werte, denen keine spezielle Kodierung hilft. | Plain-Darstellung des Formats speichern. |
| Dictionary | Wiederholte Werte innerhalb des Dictionary-Limits. | \`"US"→0\`, \`"UK"→1\` plus Indizes. |
| RLE | Wiederholte Werte oder Definition-/Repetition-Level. | \`[0,0,0,0,1,1] → [(0,4),(1,2)]\`. |
| Bit-Packing | Ganzzahlen mit geringer nötiger Bitbreite. | Werte in die nötigen Bits packen. |
| Delta-Kodierung | Werte mit kleinen Deltas, etwa sortierte Ganzzahlen. | Differenzen zum vorherigen Wert speichern. |

Schätze die logische Eingabe getrennt von kodierten und komprimierten Bytes. Dann teste repräsentative Dateien; Kardinalität, Ordnung, Nullverteilung, Codec und Writer-Einstellungen entscheiden, was eine Kodierung bringt.`,
    },
    {
      id: "s5",
      title: "Iceberg und Delta",
      content: `Parquet und Lakehouse-Tabellenformate arbeiten auf verschiedenen Ebenen.

- **Parquet** definiert die Bytes in einer Datei: Row Groups, Column Chunks, Pages, Kodierungen, Metadaten. Welche Dateien die aktuelle Version einer Tabelle bilden, definiert es nicht.
- **Apache Iceberg, Delta Lake und Apache Hudi** verwalten Mengen von Daten- und Delete-Dateien als Tabellenversionen. Sie definieren Commit-, Snapshot-, Schema-, Partitions- und Wartungsverhalten; was davon geht, hängt von Spezifikationsversion und Engine-Integration ab.

Die Metadatendesigns unterscheiden sich. Iceberg-Snapshots verweisen auf Manifest Lists und Manifests. Delta protokolliert Tabellenaktionen in \`_delta_log/\` und Checkpoints. Hudi führt Timeline und File Groups. Diese Strukturen wirken auf Planung, Konkurrenzvalidierung, inkrementelle Lesevorgänge, Wartung und Interoperabilität.

Wähle nicht aus einer statischen Feature-Matrix. Schreib auf, was du brauchst: Operationen, Isolationsstufe, Löschsemantik, Partitionsentwicklung, unterstützte Engines, Katalog, Governance-Grenze, Upgrade-Pfad. Dann prüfst du jeden Punkt gegen aktuelle Spezifikation und eingesetzte Engine-Versionen.`,
    },
    {
      id: "s6",
      title: "Bloomfilter",
      content: `Minimum-/Maximumstatistiken helfen bei unsortierten Punktprädikaten mit hoher Kardinalität wie \`WHERE user_id = 'abc-123'\` oft wenig. Ein **Bloomfilter** antwortet entweder „sicher nicht enthalten“ oder „möglicherweise enthalten“. Korrekt gebaut kennt er für eingefügte Werte keine falsch negativen Antworten; seine Falsch-positiv-Rate hängt von Bitzahl, Hashzahl und eingefügten Elementen ab. Das interaktive Modell nimmt absichtlich einen winzigen 32-bit-Filter, damit du Kollisionen siehst. Als Produktionsdimensionierung taugt er nicht.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum Pruning.",
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Row Group**, eine horizontale Zeilenmenge mit einem Column Chunk je Spalte. Die Größe tauscht Metadaten und Parallelität gegen Scan- und Kompressionsverhalten; teste mit der Ziel-Engine.
- **Page**, ein kodierter Block in einem Column Chunk und die Einheit, die ein Reader bei passenden Indizes dekodiert oder überspringt. Die Größe wählt der Writer.
- **Footer zuerst**, der Reader findet die Metadaten am Dateiende und plant danach die benötigten Chunks und Pages. Range Requests auf Remote Storage und Engine-Verhalten bestimmen das echte I/O-Muster.
- **ORC**, ein weiteres spaltenorientiertes Dateiformat mit Stripes, Indizes und Kodierungen. Unterstützung und Leistung hängen von den gewählten Engines ab.
- **Avro**, ein zeilenorientiertes, schemafähiges Format für Datensatzaustausch oder Archivierung. Ob es passt, entscheiden Consumer und Zugriffsmuster.
- **Z-Ordering**, eine mehrdimensionale Clustering-Technik, die Data Skipping für ausgewählte Spalten verbessern kann. Passen Datenverteilung oder Prädikate nicht zur Wahl, schrumpft der Nutzen.`,
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
        "Sortierte Daten liefern meist engere Minimum-/Maximumbereiche. Die Engine streicht Gruppen, deren vertrauenswürdige Statistiken nicht passen können, und liest den Rest. Genaue Anzahl und Beschleunigung brauchen echte Dateien, Metadaten, Engine, Speicher und Cache-Zustand.",
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
        "Ein korrekt gebauter Bloomfilter liefert für eingefügte Werte keine falsch negativen Antworten. „Sicher nicht enthalten“ erlaubt darum das Überspringen der abgedeckten Daten; die andere Antwort verlangt eine weitere Prüfung. Falsch-positiv-Ziel und Speicherintegration sind Implementierungsentscheidungen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Zeilengruppe",
          q: "Welche Größe ist angemessen?",
          a: "Die aus gemessener Scangröße, Metadatenkosten, Kompression, Speicher und Parallelität folgt. Kleine Gruppen treiben Metadaten hoch; große können Pruning-Granularität und Parallelität kosten.",
        },
        {
          term: "Seite",
          q: "Warum gibt es Seiten?",
          a: "Eine Page ist ein kodierter Block in einem Column Chunk. Reader dekodieren sie oder überspringen sie, wenn Indizes und Prädikate das erlauben; die Größe wählt der Writer.",
        },
        {
          term: "Footer zuerst",
          q: "Warum steht der Footer am Ende?",
          a: "Der Footer hält Schema und Positionen der Row Groups und Column Chunks. Reader finden ihn zuerst und schicken danach die Range Reads, die ihr Plan braucht; wie viele, variiert.",
        },
        {
          term: "ORC",
          q: "Wie unterscheidet sich ORC?",
          a: "ORC ist ein spaltenorientiertes Format aus Stripes mit Indizes und Kodierungen. Vergleich Unterstützung und gemessenes Verhalten in den Engines, die es lesen und schreiben müssen.",
        },
        {
          term: "Avro",
          q: "Wann wird Avro verwendet?",
          a: "Ein zeilenorientiertes, schemafähiges Format. Es kann für Datensatzaustausch oder Archivierung passen; analytische Scans über wenige Spalten bevorzugen meist ein Spaltenformat.",
        },
        {
          term: "Z-Ordering",
          q: "Was bewirkt es?",
          a: "Eine mehrdimensionale Clustering-Technik, die Data Skipping für ausgewählte Spalten verbessern soll. Den Nutzen prüfst du gegen den echten Prädikatmix und die Datenverteilung.",
        },
      ],
    },
  ],
  preserve: ["ORC", "Avro"],
});
