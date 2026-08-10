import canonical from "../lakehouse";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Lakehouse mit Iceberg, Delta und Hudi",
  subtitle: "ACID auf Object Storage",
  hook: "Snapshots, Commit-Validierung, Löschverhalten und Wartung vor der Wahl eines Tabellenformats prüfen.",
  keyConcepts: [
    "Metadatenschicht",
    "Katalog",
    "Optimistische Nebenläufigkeitskontrolle",
    "Copy-on-Write",
    "Merge-on-Read",
    "Time Travel",
  ],
  sections: [
    {
      id: "s1",
      title: "Warum ein Lakehouse nötig ist",
      content: `Ein Verzeichnis mit Datendateien definiert für sich keine atomare Tabellenversion, Validierung paralleler Schreibvorgänge, Schemaentwicklung oder Snapshot-Aufbewahrung. Implementierungen haben Metastore-Konventionen und Engine-spezifische Abläufe ergänzt; File Listing allein bleibt aber ein unvollständiger Tabellenvertrag.

Ein Lakehouse-Tabellenformat ergänzt Metadaten, die Dateien und Löschinformationen einem commiteten Tabellenzustand zuordnen. **Apache Iceberg, Delta Lake und Apache Hudi** bearbeiten diese Ebene mit unterschiedlichen Metadaten-, Commit-, Wartungs- und Interoperabilitätsmodellen.

Entstehungsgeschichte und Verbreitung sind Kontext, keine Auswahlkriterien. Vergleiche aktuelle Spezifikation sowie konkrete Katalog- und Engine-Versionen mit benötigten Operationen, Isolation, Löschung, Aufbewahrung, Governance und Wiederherstellung.`,
    },
    {
      id: "s2",
      title: "Die Metadatenschicht",
      content: `Die Iceberg-Metadaten bestehen aus fünf Zeigerebenen zwischen Tabellenname und Zeilen. Lesevorgänge gehen nach unten, Schreibvorgänge nach oben:

1. **Katalog** (Glue, Hive Metastore, Nessie, REST), eine Zeile pro Tabelle, die einen Tabellennamen auf den aktuellen Pfad zu \`metadata.json\` abbildet.
2. **\`metadata.json\`**, enthält Snapshot-Historie, Schemas und Partitionsspezifikationen. \`current_snapshot\` verweist auf eine Manifestliste.
3. **Manifestliste** (Avro), eine Zeile pro Manifest mit Bereichsstatistiken auf Partitionsebene. Eine Abfrage kann damit ganze Manifeste auslassen.
4. **Manifest** (Avro), eine Zeile pro Datendatei mit Spaltenstatistiken pro Datei. Eine Abfrage kann einzelne Dateien auslassen.
5. **Datendateien** (Parquet), enthalten die eigentlichen Zeilen.

Ein Lesevorgang löst \`orders\` über den Katalog zu \`v18.json\` auf, wählt den aktuellen Snapshot, entfernt anhand der Partitionsstatistiken irrelevante Manifeste, entfernt anhand der Spaltenstatistiken irrelevante Dateien und öffnet nur die verbleibenden Parquet-Dateien.

Ein Schreibvorgang läuft umgekehrt: neue Datendateien schreiben, ein neues Manifest mit Verweisen darauf schreiben, eine neue Manifestliste schreiben und eine neue Metadatendatei schreiben. Danach folgt der entscheidende Schritt: ein einzelnes atomares Compare-and-swap des Katalogzeigers von \`v17.json\` auf \`v18.json\`. Dieses CAS *ist* der Commit. Bei Erfolg wird der neue Snapshot sichtbar. Bei einem Konflikt bleiben die Entwurfsdateien verwaist und werden später durch VACUUM entfernt.`,
      keyTakeaway:
        "Ein Commit ist ein atomares Compare-and-swap des Metadatenzeigers im Katalog. Alle darunterliegenden Dateien werden vorher isoliert geschrieben.",
    },
    {
      id: "s3",
      title: "ACID und Kataloge",
      content: `Tabellenformate verwenden ein Commit-Protokoll, um einen neuen Tabellenzustand zu veröffentlichen, ohne einen Teilzustand sichtbar zu machen. In Icebergs optimistischem Modell können zwei Writer Änderungen parallel vorbereiten und danach validieren und den aktuellen Tabellen-Metadatenzeiger atomar ersetzen.

1. Writer A und Writer B lesen \`v18.json\`.
2. Beide schreiben Kandidaten für Daten- und Metadatendateien.
3. Writer A committet atomar einen neuen Metadatenpfad.
4. Writer Bs Commit auf veralteter Grundlage scheitert. Er muss gegen den neuen Zustand validieren und danach neu versuchen oder einen Konflikt melden.

Atomare Veröffentlichung macht nicht jeden parallelen Vorgang konfliktfrei oder kostenlos. Isolation und Validierung hängen von Vorgang, Engine-Optionen, Kataloggarantien und Regeln des Tabellenformats ab. Fehlgeschlagene Versuche können Dateien hinterlassen, die Wartung sicher identifizieren muss.

Der Katalog gehört zur Korrektheitsgrenze: Er löst eine Tabellenidentität zu Metadaten auf und muss die vom Format benötigten atomaren Operationen bieten. Hive Metastore, verwaltete Kataloge, REST-Kataloge und Governance-Kataloge unterscheiden sich in Protokoll, Autorisierung, Verfügbarkeit und Betriebszuständigkeit. Prüfe diese Eigenschaften statt austauschbare Katalognamen anzunehmen.`,
    },
    {
      id: "s4",
      title: "Snapshot-Zeitachse",
      content:
        "Die Zeitachse ist eine feste beispielhafte Folge von Tabellen-Snapshots. Die Wahl eines älteren Snapshots zeigt, wie Metadaten einen früheren Zustand auflösen können. Abfrage- und Rollback-Kosten hängen von Metadatengröße, Katalog- und Speicherlatenz, Engine-Planung, aufbewahrten Dateien und verwendeter Operation ab. Time Travel verbraucht außerdem Speicher, bis Aufbewahrung und Garbage Collection unerreichbare Daten entfernen.",
    },
    {
      id: "s5",
      title: "CoW und MoR",
      content: `Aktualisierungen von Object-Store-Tabellen veröffentlichen gewöhnlich neue Dateien oder Löschmetadaten, statt Bytes direkt zu ändern. Ein \`UPDATE orders SET status='shipped' WHERE id=42\` erzeugt daher einen Lese-/Schreibkonflikt:

- **Copy-on-Write (CoW).** Betroffene Dateien neu schreiben und einen Snapshot mit den Ersatzdateien veröffentlichen. Lesevorgänge sehen konsolidierte Dateien; Änderungen können Schreibverstärkung erzeugen.
- **Merge-on-Read (MoR).** Neue Datensätze oder Löschinformationen separat veröffentlichen und bei Lesevorgang oder Kompaktierung zusammenführen. Änderungen können zunächst weniger schreiben; Lesevorgänge und Wartung müssen mehr Zustand zusammenführen.

Konkrete Delete-Dateitypen, Indizes, Vorgaben, Kompaktierungsregeln und unterstützte Engines unterscheiden sich nach Tabellenformat- und Engine-Version. Wähle anhand gemessener Aktualisierungsrate, Lesemuster, Dateigröße, Wartungskapazität und Löschsemantik.`,
      keyTakeaway:
        "Faustregel: Seltene Änderungen und viele Lesezugriffe sprechen für CoW; häufige Änderungen aus CDC sprechen für MoR.",
    },
    {
      id: "s6",
      title: "Vergleich der Formate",
      content: `Verwende eine Anforderungsmatrix, deren Felder gegen aktuelle Dokumentation und einen kleinen Kompatibilitätstest geprüft werden:

| Entscheidung | Zu erhebende Evidenz |
|---|---|
| Engine-Interoperabilität | Benötigte Lese- und Schreiboperationen je exakter Engine-/Versionskombination |
| Commit und Isolation | Katalogatomarität, Validierung paralleler Schreibvorgänge, Retry-Verhalten und Wiederherstellung unbekannter Commits |
| Änderungen und Löschungen | CoW-/MoR-Unterstützung, Delete-Darstellung, Merge-Kosten und Lebenszyklus von Datenschutzlöschungen |
| Schema- und Partitionsentwicklung | Unterstützte Änderungen, Reader-Kompatibilität und nötige Neuschreibung alter Dateien |
| Inkrementelle Verarbeitung | Change-Feed-Semantik, Ordnung, Aufbewahrung und Checkpoint-Identität |
| Betrieb | Kompaktierung, Snapshot-Ablauf, Orphan Cleanup, Observability und Disaster Recovery |
| Governance | Autorisierungsgrenze, Audit-Ereignisse, Verschlüsselung, Katalogverfügbarkeit und Zuständigkeit |

Ein Formatname beweist keine Zeile dieser Matrix. Engine-Integrationen können hinter Spezifikationen liegen oder nur Teiloperationen anbieten.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s8",
      title: "Kernaussagen",
      content: `- **Metadaten definieren Tabellenzustand.** Datendateien allein identifizieren keine commitete Tabellenversion. Format und Katalog definieren Veröffentlichung und Wiederherstellung gemeinsam.
- **Optimistische Commits benötigen Validierung.** Ein veralteter Writer muss vor dem Retry gegen den neuen Zustand prüfen. Konfliktverhalten hängt von Vorgang und Isolationskonfiguration ab.
- **CoW und MoR tauschen Schreibverstärkung gegen Lese- und Wartungsarbeit.** Beide Pfade für die geplante Last messen.
- **Partitionsentwicklung trennt logische Prädikate von wechselnden physischen Layouts.** Alte Dateien können alte Spezifikationen behalten, während neue eine neue verwenden; Engines benötigen trotzdem kompatible Reader und Planung.
- **Interoperabilität ist eine Operationsmatrix.** Lese-, Schreib-, Lösch-, Evolutions- und Wiederherstellungsvorgänge auf den exakten Engine-Versionen beweisen, statt einer Formataussage zu vertrauen.`,
    },
    {
      id: "s9",
      title: "Begriffe",
      content: `- **Snapshot**, Metadaten, die einen commiteten Tabellenzustand identifizieren. Unveränderlichkeit und Aufbewahrung definieren Tabellenformat und Katalog.
- **Time Travel**, Auflösen und Lesen eines aufbewahrten früheren Snapshots. Es erzeugt Planungs-, I/O- und Aufbewahrungskosten.
- **Snapshot-Ablauf / VACUUM**, entfernt aufbewahrte Historie und macht nicht referenzierte Dateien nach produktspezifischen Regeln schließlich löschbar.
- **Verborgene Partitionierung**, leitet Partitionswerte aus Quellspalten ab und lässt Abfragen Quellspaltenprädikate verwenden.
- **OCC**, optimistische Nebenläufigkeitskontrolle: Writer bereiten unabhängig vor, validieren und committen danach gegen aktuelle Metadaten.
- **Kompaktierung**, schreibt ausgewählte Dateien in ein neues Layout; Planung und Konfliktbehandlung sind Betriebsarbeit.
- **Z-Order**, eine mehrdimensionale Clustering-Technik einiger Engines zur Verbesserung von Data Skipping für ausgewählte Prädikate.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Löschung nach DSGVO",
      question:
        "Du betreibst eine Iceberg-Tabelle mit CoW. Eine Person verlangt die Löschung aller eigenen Zeilen. Es sind ~50 Zeilen, verteilt über 30 von 4,800 Datendateien. Was geschieht beim DELETE?",
      options: [
        "Die 50 Zeilen werden an Ort und Stelle neu geschrieben.",
        "Eine Datei mit Löschmarkierungen wird geschrieben; sonst ändert sich nichts.",
        "Die betroffenen Dateien werden ohne diese Zeilen neu geschrieben; ein neuer Snapshot referenziert die Ersatzdateien. Ältere Snapshots können die vorherigen Dateien bis zum Ende ihrer Aufbewahrung weiter referenzieren.",
        "Die gesamte Tabelle wird neu geschrieben.",
      ],
      explanation:
        "Im benannten CoW-Modell werden betroffene Dateien ersetzt und der neue Snapshot lässt die gelöschten Zeilen aus. Frühere Snapshots, Branches, Tags, Objektversionen, Replikate und Backups können die Bytes weiter enthalten. Ein Datenschutzlöschprozess muss jede Aufbewahrungsebene verfolgen und die Entfernung unter Rechts- und Wiederherstellungsanforderungen nachweisen; ein sofortiger Cleanup-Befehl allein ist kein Beweis.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "CoW oder MoR für CDC",
      question:
        "Ein CDC-Spiegel erzeugt häufige kleine Schlüsselaktualisierungen. Lesevorgänge dürfen Merge-Arbeit ausführen und das Team betreibt regelmäßige Kompaktierung. Welche Strategie ist die bessere erste Benchmark-Hypothese?",
      options: [
        "Immer CoW.",
        "MoR. Es kann unmittelbare Schreibverstärkung verringern und verschiebt dafür Arbeit zu Lesevorgängen und Kompaktierung.",
        "Das ist gleichgültig; die Engine übernimmt es.",
        "CSV verwenden.",
      ],
      explanation:
        "MoR ist eine plausible Hypothese, weil die genannte Last Merge beim Lesen und Wartung gegen weniger unmittelbare Dateineuschreibung tauscht. Prüfe tatsächliche Dateigrößen, Aktualisierungsverteilung, Engine-Unterstützung, Leselatenz und Kompaktierungskapazität; bei gruppierten Änderungen oder leseintensiver Last kann CoW trotzdem gewinnen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Snapshot",
          q: "Was enthält ein Snapshot?",
          a: "Eine commitete Tabellenversion, die Metadaten und Dateien für einen logischen Punkt in der Tabellenhistorie referenziert. Aufbewahrungsoperationen bestimmen, wann ältere Snapshots und berechtigte Dateien entfernt werden können.",
        },
        {
          term: "Time Travel",
          q: "Wie funktioniert es?",
          a: "Die Engine löst einen aufbewahrten Snapshot auf und plant dessen Dateien. SQL-Syntax, Planungskosten, Speicherzugriffe und Aufbewahrungsverhalten hängen von Engine und Katalog ab.",
        },
        {
          term: "VACUUM",
          q: "Warum wird es ausgeführt?",
          a: "Um berechtigte Historie ablaufen zu lassen und nach konfigurierter Regel nicht mehr referenzierte Dateien zu entfernen. Datenschutzlöschung muss auch Branches, Tags, Objektversionen, Replikate und Backups berücksichtigen.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Icebergs Vorteil gegenüber dem Hive-Stil",
          a: "Eine Transformation wie days(order_ts) steht in den Tabellenmetadaten und wird von kompatiblen Writern abgeleitet. Bei Partitionsentwicklung können neue Dateien eine neue Spezifikation verwenden, während alte ihr Layout behalten; alte Daten werden nicht automatisch neu geschrieben.",
        },
        {
          term: "OCC",
          q: "Optimistische Nebenläufigkeitskontrolle",
          a: "Writer bereiten Kandidatenänderungen vor und validieren sie beim atomaren Commit gegen aktuelle Metadaten. Ein veralteter Writer darf erst nach erneuter Prüfung der vorgangsspezifischen Annahmen wiederholen.",
        },
        {
          term: "Kompaktierung",
          q: "Warum ist sie nötig?",
          a: "Kleine Dateien können Planungs- und Speicheranfragen erhöhen. Kompaktierung veröffentlicht ein neues Layout, verbraucht Compute und I/O und kann mit parallelen Änderungen kollidieren; sie wird wie jeder Datenjob geplant und geprüft.",
        },
        {
          term: "Z-Order",
          q: "Wann hilft sie?",
          a: "Die Technik kann Lokalität und Data Skipping für ausgewählte Spalten verbessern. Der Nutzen hängt von Engine, Datenverteilung, Prädikatmix, Rewrite-Regel und verfügbaren Statistiken ab und wird mit repräsentativen Plänen und Reads geprüft.",
        },
      ],
    },
  ],
  preserve: ["Copy-on-Write", "Merge-on-Read", "Snapshot", "VACUUM", "OCC"],
});
