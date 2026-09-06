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
      content: `Ein Verzeichnis voller Datendateien ist keine Tabelle. Es definiert keine atomare Tabellenversion, keine Validierung paralleler Schreibvorgänge, keine Schemaentwicklung und keine Snapshot-Aufbewahrung. Metastore-Konventionen und Engine-spezifische Abläufe haben das nachgerüstet; File Listing allein bleibt ein unvollständiger Tabellenvertrag.

Ein Lakehouse-Tabellenformat ergänzt Metadaten, die Dateien und Löschinformationen einem commiteten Tabellenzustand zuordnen. **Apache Iceberg, Delta Lake und Apache Hudi** bearbeiten diese Ebene, jedes mit eigenem Metadaten-, Commit-, Wartungs- und Interoperabilitätsmodell.

Entstehungsgeschichte und Verbreitung sind Kontext, keine Auswahlkriterien. Vergleiche die aktuelle Spezifikation und die konkreten Katalog- und Engine-Versionen mit deinen Anforderungen an Operationen, Isolation, Löschung, Aufbewahrung, Governance und Wiederherstellung.`,
    },
    {
      id: "s2",
      title: "Die Metadatenschicht",
      content: `Icebergs Metadaten sind fünf Zeigerebenen zwischen Tabellenname und Zeilen. Lesen läuft nach unten, Schreiben nach oben:

1. **Katalog** (Glue, Hive Metastore, Nessie, REST), eine Zeile pro Tabelle, die den Tabellennamen auf den aktuellen Pfad zu \`metadata.json\` abbildet.
2. **\`metadata.json\`**, Snapshot-Historie, Schemas, Partitionsspezifikationen. \`current_snapshot\` zeigt auf eine Manifestliste.
3. **Manifestliste** (Avro), eine Zeile pro Manifest mit Bereichsstatistiken auf Partitionsebene; damit kann eine Abfrage ganze Manifeste überspringen.
4. **Manifest** (Avro), eine Zeile pro Datendatei mit Spaltenstatistiken je Datei; damit kann eine Abfrage einzelne Dateien überspringen.
5. **Datendateien** (Parquet), die Zeilen selbst.

Ein Lesevorgang löst \`orders\` über den Katalog zu \`v18.json\` auf, nimmt den aktuellen Snapshot, streicht Manifeste anhand der Partitionsstatistiken, streicht Dateien anhand der Spaltenstatistiken und öffnet nur die übrig gebliebenen Parquet-Dateien.

Ein Schreibvorgang läuft rückwärts: neue Datendateien, ein neues Manifest mit Verweisen darauf, eine neue Manifestliste, eine neue Metadatendatei. Dann der entscheidende Schritt: ein einziges atomares Compare-and-swap des Katalogzeigers von \`v17.json\` auf \`v18.json\`. Dieses CAS *ist* der Commit. Gelingt es, ist der neue Snapshot live. Scheitert es, bleiben die Entwurfsdateien verwaist, bis VACUUM sie später entfernt.`,
      keyTakeaway:
        "Ein Commit ist ein atomares Compare-and-swap des Metadatenzeigers im Katalog. Alles darunter ist vorher isoliert geschrieben.",
    },
    {
      id: "s3",
      title: "ACID und Kataloge",
      content: `Ein Tabellenformat veröffentlicht einen neuen Tabellenzustand über ein Commit-Protokoll, ohne je einen Teilzustand zu zeigen. In Icebergs optimistischem Modell bereiten zwei Writer ihre Änderungen parallel vor, validieren und ersetzen dann den aktuellen Metadatenzeiger atomar.

1. Writer A und Writer B lesen \`v18.json\`.
2. Beide schreiben Kandidaten für Daten- und Metadatendateien.
3. Writer A committet atomar einen neuen Metadatenpfad.
4. Writer Bs Commit auf veralteter Basis scheitert. Er muss vor dem nächsten Versuch gegen den neuen Zustand validieren oder einen Konflikt melden.

Atomare Veröffentlichung macht parallele Vorgänge weder konfliktfrei noch kostenlos. Isolation und Validierung hängen von Vorgang, Engine-Optionen, Kataloggarantien und den Regeln des Tabellenformats ab. Fehlgeschlagene Versuche hinterlassen unter Umständen Dateien, die die Wartung sicher erkennen muss.

Der Katalog gehört zur Korrektheitsgrenze. Er löst eine Tabellenidentität zu Metadaten auf und muss die atomaren Operationen liefern, die das Format verlangt. Hive Metastore, verwaltete Kataloge, REST-Kataloge und Governance-Kataloge unterscheiden sich in Protokoll, Autorisierung, Verfügbarkeit und Betriebszuständigkeit. Prüf das, statt Katalognamen für austauschbar zu halten.`,
    },
    {
      id: "s4",
      title: "Snapshot-Zeitachse",
      content:
        "Die Zeitachse ist eine feste, beispielhafte Folge von Tabellen-Snapshots. Wählst du einen älteren, siehst du, wie Metadaten einen früheren Zustand auflösen. Was Abfrage und Rollback kosten, hängt von Metadatengröße, Katalog- und Speicherlatenz, Engine-Planung, aufbewahrten Dateien und der verwendeten Operation ab. Time Travel belegt Speicher, bis Aufbewahrung und Garbage Collection unerreichbare Daten entfernen.",
    },
    {
      id: "s5",
      title: "CoW und MoR",
      content: `Eine Tabelle im Object Store ändert selten Bytes an Ort und Stelle; sie veröffentlicht neue Dateien oder Löschmetadaten. Ein \`UPDATE orders SET status='shipped' WHERE id=42\` erzwingt deshalb einen Lese-/Schreibkonflikt:

- **Copy-on-Write (CoW).** Betroffene Dateien neu schreiben und einen Snapshot mit den Ersatzdateien veröffentlichen. Lesevorgänge sehen konsolidierte Dateien; Änderungen können Schreibverstärkung erzeugen.
- **Merge-on-Read (MoR).** Neue Datensätze oder Löschinformationen getrennt veröffentlichen und beim Lesen oder bei Kompaktierung zusammenführen. Änderungen können zunächst weniger schreiben; Lesevorgänge und Wartung führen mehr Zustand zusammen.

Delete-Dateitypen, Indizes, Vorgaben, Kompaktierungsregeln und unterstützte Engines unterscheiden sich je Tabellenformat- und Engine-Version. Entscheide nach gemessener Aktualisierungsrate, Lesemuster, Dateigröße, Wartungskapazität und Löschsemantik.`,
      keyTakeaway:
        "Faustregel: seltene Änderungen und viele Reads, dann CoW; häufige Änderungen im CDC-Stil, dann MoR.",
    },
    {
      id: "s6",
      title: "Vergleich der Formate",
      content: `Nimm eine Anforderungsmatrix. Jede Zelle prüfst du gegen aktuelle Dokumentation und einen kleinen Kompatibilitätstest.

| Entscheidung | Zu erhebende Evidenz |
|---|---|
| Engine-Interoperabilität | Benötigte Lese- und Schreiboperationen je exakter Engine-/Versionskombination |
| Commit und Isolation | Katalogatomarität, Validierung paralleler Schreibvorgänge, Retry-Verhalten und Wiederherstellung unbekannter Commits |
| Änderungen und Löschungen | CoW-/MoR-Unterstützung, Delete-Darstellung, Merge-Kosten und Lebenszyklus von Datenschutzlöschungen |
| Schema- und Partitionsentwicklung | Unterstützte Änderungen, Reader-Kompatibilität und nötige Neuschreibung alter Dateien |
| Inkrementelle Verarbeitung | Change-Feed-Semantik, Ordnung, Aufbewahrung und Checkpoint-Identität |
| Betrieb | Kompaktierung, Snapshot-Ablauf, Orphan Cleanup, Observability und Disaster Recovery |
| Governance | Autorisierungsgrenze, Audit-Ereignisse, Verschlüsselung, Katalogverfügbarkeit und Zuständigkeit |

Ein Formatname beweist keine Zeile dieser Matrix. Engine-Integrationen können Spezifikationen hinterherhinken oder nur Teiloperationen bieten.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen, eine davon zur DSGVO.",
    },
    {
      id: "s8",
      title: "Kernaussagen",
      content: `- **Metadaten definieren den Tabellenzustand.** Datendateien allein identifizieren keine commitete Tabellenversion. Format und Katalog definieren Veröffentlichung und Wiederherstellung gemeinsam.
- **Optimistische Commits brauchen Validierung.** Ein veralteter Writer prüft vor dem Retry gegen den neuen Zustand. Was bei einem Konflikt passiert, hängt von Vorgang und Isolationskonfiguration ab.
- **CoW und MoR tauschen Schreibverstärkung gegen Lese- und Wartungsarbeit.** Miss beide Pfade für die geplante Last.
- **Partitionsentwicklung trennt logische Prädikate von wechselnden physischen Layouts.** Alte Dateien behalten ihre Spezifikation, neue nehmen die neue; Engines brauchen kompatible Reader und Planung.
- **Interoperabilität ist eine Operationsmatrix.** Lesen, Schreiben, Löschen, Evolution und Wiederherstellung auf den exakten Engine-Versionen beweisen, statt einer Formataussage zu glauben.`,
    },
    {
      id: "s9",
      title: "Begriffe",
      content: `- **Snapshot**, Metadaten, die einen commiteten Tabellenzustand identifizieren. Unveränderlichkeit und Aufbewahrung definieren Tabellenformat und Katalog.
- **Time Travel**, einen aufbewahrten früheren Snapshot auflösen und lesen. Kostet Planung, I/O und Aufbewahrung.
- **Snapshot-Ablauf / VACUUM**, entfernt aufbewahrte Historie und macht nicht referenzierte Dateien nach produktspezifischen Regeln irgendwann löschbar.
- **Verborgene Partitionierung**, leitet Partitionswerte aus Quellspalten ab; Abfragen filtern weiter auf ihnen.
- **OCC**, optimistische Nebenläufigkeitskontrolle: Writer bereiten unabhängig vor, validieren und committen dann gegen die aktuellen Metadaten.
- **Kompaktierung**, schreibt ausgewählte Dateien in ein neues Layout; Planung und Konfliktbehandlung sind Betriebsarbeit.
- **Z-Order**, eine mehrdimensionale Clustering-Technik einiger Engines, um Data Skipping für ausgewählte Prädikate zu verbessern.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Löschung nach DSGVO",
      question:
        "Du betreibst eine Iceberg-Tabelle mit CoW. Eine Person verlangt die Löschung aller eigenen Zeilen. Es sind ~50 Zeilen, verstreut über 30 von 4,800 Datendateien. Was passiert beim DELETE?",
      options: [
        "Die 50 Zeilen werden an Ort und Stelle neu geschrieben.",
        "Eine Datei mit Löschmarkierungen wird geschrieben; sonst ändert sich nichts.",
        "Die betroffenen Dateien werden ohne diese Zeilen neu geschrieben; ein neuer Snapshot referenziert die Ersatzdateien. Ältere Snapshots können die vorherigen Dateien bis zum Ende ihrer Aufbewahrung weiter referenzieren.",
        "Die gesamte Tabelle wird neu geschrieben.",
      ],
      explanation:
        "Im CoW-Modell werden die betroffenen Dateien ersetzt, der neue Snapshot lässt die gelöschten Zeilen aus. Weg sind die Bytes damit nicht. Frühere Snapshots, Branches, Tags, Objektversionen, Replikate und Backups können sie weiter enthalten. Ein Datenschutzlöschprozess verfolgt jede Aufbewahrungsebene und weist die Entfernung unter Rechts- und Wiederherstellungsanforderungen nach. Ein Cleanup-Befehl allein beweist nichts.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "CoW oder MoR für CDC",
      question:
        "Ein CDC-Spiegel erzeugt häufige kleine Schlüsselaktualisierungen. Lesevorgänge dürfen Merge-Arbeit leisten, und das Team betreibt regelmäßige Kompaktierung. Welche Strategie ist die bessere erste Benchmark-Hypothese?",
      options: [
        "Immer CoW.",
        "MoR. Es kann die unmittelbare Schreibverstärkung senken und verschiebt dafür Arbeit zu Lesevorgängen und Kompaktierung.",
        "Egal; die Engine regelt das.",
        "CSV verwenden.",
      ],
      explanation:
        "MoR ist die plausible Hypothese: Die genannte Last tauscht Merge beim Lesen und Wartung gegen weniger unmittelbare Dateineuschreibung. Prüf echte Dateigrößen, Aktualisierungsverteilung, Engine-Unterstützung, Leselatenz und Kompaktierungskapazität. Bei gebündelten Änderungen oder leseintensiver Last kann CoW trotzdem gewinnen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Snapshot",
          q: "Was enthält ein Snapshot?",
          a: "Eine commitete Tabellenversion, die Metadaten und Dateien für einen logischen Punkt der Tabellenhistorie referenziert. Aufbewahrungsoperationen bestimmen, wann ältere Snapshots und freigegebene Dateien verschwinden dürfen.",
        },
        {
          term: "Time Travel",
          q: "Wie funktioniert es?",
          a: "Die Engine löst einen aufbewahrten Snapshot auf und plant dessen Dateien. SQL-Syntax, Planungskosten, Speicherzugriffe und Aufbewahrungsverhalten hängen von Engine und Katalog ab.",
        },
        {
          term: "VACUUM",
          q: "Warum wird es ausgeführt?",
          a: "Um freigegebene Historie ablaufen zu lassen und nicht mehr referenzierte Dateien nach konfigurierter Regel zu entfernen. Datenschutzlöschung muss auch Branches, Tags, Objektversionen, Replikate und Backups mitnehmen.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Icebergs Vorteil gegenüber dem Hive-Stil",
          a: "Eine Transformation wie days(order_ts) steht in den Tabellenmetadaten, kompatible Writer leiten sie ab. Bei Partitionsentwicklung nehmen neue Dateien eine neue Spezifikation, alte behalten ihr Layout; alte Daten werden nicht automatisch neu geschrieben.",
        },
        {
          term: "OCC",
          q: "Optimistische Nebenläufigkeitskontrolle",
          a: "Writer bereiten Kandidatenänderungen vor und validieren sie beim atomaren Commit gegen die aktuellen Metadaten. Ein veralteter Writer darf erst wiederholen, wenn er die Annahmen seines Vorgangs neu geprüft hat.",
        },
        {
          term: "Kompaktierung",
          q: "Warum ist sie nötig?",
          a: "Kleine Dateien können Planungs- und Speicheranfragen hochtreiben. Kompaktierung veröffentlicht ein neues Layout, verbraucht Compute und I/O und kann mit parallelen Änderungen kollidieren. Plane und prüfe sie wie jeden anderen Datenjob.",
        },
        {
          term: "Z-Order",
          q: "Wann hilft sie?",
          a: "Sie kann Lokalität und Data Skipping für ausgewählte Spalten verbessern. Der Nutzen hängt von Engine, Datenverteilung, Prädikatmix, Rewrite-Regel und verfügbaren Statistiken ab; prüf ihn mit repräsentativen Plänen und Reads.",
        },
      ],
    },
  ],
  preserve: ["Copy-on-Write", "Merge-on-Read", "Snapshot", "VACUUM", "OCC"],
});
