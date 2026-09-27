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
      content: `Ein Verzeichnis voller Datendateien hat keine atomaren Tabellenversionen, keine Validierung paralleler Schreibvorgänge, keine Schemaentwicklung und keine Snapshot-Aufbewahrung. Metastore-Konventionen haben manches nachgerüstet, doch ein File Listing bleibt ein unvollständiger Tabellenvertrag.

Ein Lakehouse-Tabellenformat ergänzt Metadaten, die Dateien und Löschinformationen einem commiteten Tabellenzustand zuordnen. **Apache Iceberg, Delta Lake und Apache Hudi** tun das jeweils mit eigenem Metadaten-, Commit-, Wartungs- und Interoperabilitätsmodell.

Wähle, indem du die aktuelle Spezifikation und die genauen Katalog- und Engine-Versionen mit deinen Anforderungen an Operationen, Isolation, Löschung, Aufbewahrung, Governance und Wiederherstellung vergleichst.`,
    },
    {
      id: "s2",
      title: "Die Metadatenschicht",
      content: `Iceberg hält fünf Zeigerebenen zwischen Tabellenname und Zeilen. Lesen läuft nach unten, Schreiben nach oben:

1. **Katalog** (Glue, Hive Metastore, Nessie, REST), bildet jeden Tabellennamen auf den aktuellen Pfad zu \`metadata.json\` ab.
2. **\`metadata.json\`**, Snapshot-Historie, Schemas, Partitionsspezifikationen. \`current_snapshot\` zeigt auf eine Manifestliste.
3. **Manifestliste** (Avro), eine Zeile pro Manifest mit Bereichsstatistiken je Partition, damit eine Abfrage ganze Manifeste überspringt.
4. **Manifest** (Avro), eine Zeile pro Datendatei mit Spaltenstatistiken, damit eine Abfrage Dateien überspringt.
5. **Datendateien** (Parquet), die Zeilen.

Ein Lesevorgang löst \`orders\` über den Katalog zu \`v18.json\` auf, nimmt den aktuellen Snapshot, streicht Manifeste und Dateien anhand ihrer Statistiken und öffnet nur die übrigen Parquet-Dateien.

Ein Schreibvorgang läuft rückwärts: Datendateien, Manifest, Manifestliste, Metadatendatei. Dann setzt ein atomares Compare-and-swap den Katalogzeiger von \`v17.json\` auf \`v18.json\`, und dieses CAS *ist* der Commit. Scheitert es, bleiben die Entwurfsdateien verwaist, bis VACUUM sie entfernt.`,
      keyTakeaway:
        "Ein Commit ist ein atomares Compare-and-swap des Katalogzeigers; alles darunter ist vorher isoliert geschrieben.",
    },
    {
      id: "s3",
      title: "ACID und Kataloge",
      content: `Ein Commit-Protokoll veröffentlicht einen neuen Tabellenzustand, ohne je einen Teilzustand zu zeigen. In Icebergs optimistischem Modell bereiten Writer ihre Änderungen parallel vor, validieren und tauschen dann den Metadatenzeiger atomar.

1. Writer A und Writer B lesen \`v18.json\`.
2. Beide schreiben Kandidaten für Daten- und Metadatendateien.
3. Writer A committet atomar einen neuen Metadatenpfad.
4. Writer Bs Commit auf veralteter Basis scheitert. Er validiert vor dem nächsten Versuch gegen den neuen Zustand oder meldet einen Konflikt.

Konflikte und Kosten hängen weiter von Vorgang, Engine-Optionen, Kataloggarantien und Formatregeln ab, und gescheiterte Versuche hinterlassen Dateien, die die Wartung sicher aufräumen muss.

Der Katalog gehört zur Korrektheit: Er löst eine Tabelle zu ihren Metadaten auf und muss die atomaren Operationen liefern, die das Format braucht. Hive Metastore, verwaltete, REST- und Governance-Kataloge unterscheiden sich in Protokoll, Autorisierung, Verfügbarkeit und Zuständigkeit, also prüfst du das für deinen.`,
    },
    {
      id: "s4",
      title: "Snapshot-Zeitachse",
      content:
        "Die Zeitachse ist eine feste Beispielfolge von Snapshots; wählst du einen älteren, lösen die Metadaten einen früheren Zustand auf. Was Abfrage und Rollback kosten, hängt von Metadatengröße, Katalog- und Speicherlatenz, Planung und aufbewahrten Dateien ab. Time Travel belegt Speicher, bis Aufbewahrung und Garbage Collection unerreichbare Daten entfernen.",
    },
    {
      id: "s5",
      title: "CoW und MoR",
      content: `Auf Object Storage veröffentlicht eine Änderung neue Dateien oder Löschmetadaten; Bytes werden nie an Ort und Stelle geändert. Deshalb erzwingt \`UPDATE orders SET status='shipped' WHERE id=42\` eine Abwägung:

- **Copy-on-Write (CoW).** Betroffene Dateien neu schreiben und einen Snapshot mit den Ersatzdateien veröffentlichen. Lesen bleibt einfach; Änderungen verstärken Schreiblast.
- **Merge-on-Read (MoR).** Neue Datensätze oder Löschinformationen getrennt schreiben und beim Lesen oder bei der Kompaktierung zusammenführen. Änderungen schreiben weniger; Lesen und Wartung leisten mehr.

Delete-Dateitypen, Vorgaben und Engine-Unterstützung unterscheiden sich je Version. Entscheide nach gemessener Aktualisierungsrate, Lesemuster, Dateigröße, Wartungskapazität und Löschsemantik.`,
      keyTakeaway:
        "Seltene Änderungen und viele Lesezugriffe sprechen für CoW, häufige Änderungen im CDC-Stil für MoR.",
    },
    {
      id: "s6",
      title: "Vergleich der Formate",
      content: `Prüfe jede Zelle dieser Matrix gegen aktuelle Dokumentation und einen kleinen Kompatibilitätstest:

| Entscheidung | Zu erhebende Evidenz |
|---|---|
| Engine-Interoperabilität | Benötigte Lese- und Schreiboperationen je exakter Engine-/Versionskombination |
| Commit und Isolation | Katalogatomarität, Validierung paralleler Schreibvorgänge, Retry-Verhalten und Wiederherstellung unbekannter Commits |
| Änderungen und Löschungen | CoW-/MoR-Unterstützung, Delete-Darstellung, Merge-Kosten und Lebenszyklus von Datenschutzlöschungen |
| Schema- und Partitionsentwicklung | Unterstützte Änderungen, Reader-Kompatibilität und nötige Neuschreibung alter Dateien |
| Inkrementelle Verarbeitung | Change-Feed-Semantik, Ordnung, Aufbewahrung und Checkpoint-Identität |
| Betrieb | Kompaktierung, Snapshot-Ablauf, Orphan Cleanup, Observability und Disaster Recovery |
| Governance | Autorisierungsgrenze, Audit-Ereignisse, Verschlüsselung, Katalogverfügbarkeit und Zuständigkeit |

Engine-Integrationen können der Spezifikation hinterherhinken oder nur einen Teil der Operationen bieten.`,
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Commits und Löschungen.",
    },
    {
      id: "s8",
      title: "Kernaussagen",
      content: `- Format und Katalog legen gemeinsam fest, wie ein Tabellenzustand veröffentlicht und wiederhergestellt wird.
- Miss CoW und MoR an deiner eigenen Last.
- Nach einer Partitionsentwicklung behalten alte Dateien ihre Spezifikation, neue nutzen die neue.
- Belege Lesen, Schreiben, Löschen, Evolution und Wiederherstellung auf deinen genauen Engine-Versionen.`,
    },
    {
      id: "s9",
      title: "Begriffe",
      content: `- **Snapshot**, Metadaten für einen commiteten Tabellenzustand.
- **Time Travel**, einen aufbewahrten früheren Snapshot lesen.
- **Snapshot-Ablauf / VACUUM**, entfernt Historie und nicht referenzierte Dateien nach Produktregeln.
- **Verborgene Partitionierung**, leitet Partitionswerte aus Quellspalten ab, also filtern Abfragen auf diesen Spalten.
- **OCC**, optimistische Nebenläufigkeitskontrolle: unabhängig vorbereiten, dann gegen aktuelle Metadaten validieren und committen.
- **Kompaktierung**, schreibt kleine Dateien in ein neues Layout um.
- **Z-Order**, mehrdimensionales Clustering, das Data Skipping für gewählte Prädikate verbessert.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Löschung nach DSGVO",
      question:
        "Deine Iceberg-Tabelle nutzt CoW. Eine Person verlangt die Löschung ihrer ~50 Zeilen, verteilt über 30 von 4,800 Datendateien. Was passiert beim DELETE?",
      options: [
        "Die 50 Zeilen werden an Ort und Stelle neu geschrieben.",
        "Eine Datei mit Löschmarkierungen wird geschrieben; sonst ändert sich nichts.",
        "Betroffene Dateien werden neu geschrieben; alte Snapshots behalten die vorherigen bis zum Aufbewahrungsende.",
        "Die gesamte Tabelle wird neu geschrieben.",
      ],
      explanation:
        "CoW ersetzt die betroffenen Dateien, und der neue Snapshot lässt die Zeilen aus. Alte Snapshots, Branches, Tags, Objektversionen, Replikate und Backups können die Bytes weiter halten, also verfolgt und prüft eine Datenschutzlöschung jede Aufbewahrungsebene.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "CoW oder MoR für CDC",
      question:
        "Ein CDC-Spiegel liefert häufige kleine Schlüsselaktualisierungen. Lesezugriffe dürfen Merge-Arbeit leisten, und das Team kompaktiert regelmäßig. Welche Strategie misst du zuerst?",
      options: [
        "Immer CoW.",
        "MoR, weniger Neuschreiben gegen mehr Lese- und Kompaktierungsarbeit.",
        "Egal; die Engine regelt das.",
        "CSV verwenden.",
      ],
      explanation:
        "Diese Last nimmt Merge beim Lesen und Kompaktierung für weniger Dateineuschreibung in Kauf. Miss Dateigrößen, Aktualisierungsverteilung, Engine-Unterstützung, Leselatenz und Kompaktierungskapazität; bei gebündelten Änderungen oder leseintensiver Last kann CoW trotzdem gewinnen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Snapshot",
          q: "Was enthält ein Snapshot?",
          a: "Eine commitete Tabellenversion, die Metadaten und Dateien für einen Punkt der Historie referenziert. Die Aufbewahrung bestimmt, wann ältere Snapshots und ihre Dateien verschwinden.",
        },
        {
          term: "Time Travel",
          q: "Wie funktioniert es?",
          a: "Die Engine löst einen aufbewahrten Snapshot auf und plant dessen Dateien. Syntax, Kosten und Aufbewahrung hängen von Engine und Katalog ab.",
        },
        {
          term: "VACUUM",
          q: "Warum wird es ausgeführt?",
          a: "Um Historie ablaufen zu lassen und nicht referenzierte Dateien nach konfigurierter Regel zu entfernen. Datenschutzlöschung muss auch Branches, Tags, Objektversionen, Replikate und Backups erfassen.",
        },
        {
          term: "Verborgene Partitionierung",
          q: "Icebergs Vorteil gegenüber dem Hive-Stil",
          a: "Eine Transformation wie days(order_ts) steht in den Tabellenmetadaten, Writer leiten den Wert ab. Bei Partitionsentwicklung nutzen neue Dateien eine neue Spezifikation, alte behalten ihre, bis sie neu geschrieben werden.",
        },
        {
          term: "OCC",
          q: "Optimistische Nebenläufigkeitskontrolle",
          a: "Writer bereiten Änderungen vor, validieren und committen atomar gegen die aktuellen Metadaten. Ein veralteter Writer wiederholt erst nach neuer Prüfung seiner Annahmen.",
        },
        {
          term: "Kompaktierung",
          q: "Warum ist sie nötig?",
          a: "Kleine Dateien treiben Planungs- und Anfrageaufwand hoch. Kompaktierung kostet Compute und I/O und kann mit parallelen Schreibvorgängen kollidieren, also planst und prüfst du sie wie jeden Datenjob.",
        },
        {
          term: "Z-Order",
          q: "Wann hilft sie?",
          a: "Bei Data Skipping auf ausgewählten Spalten. Der Nutzen hängt von Engine, Datenverteilung, Prädikaten und Statistiken ab; prüf ihn mit repräsentativen Abfragen.",
        },
      ],
    },
  ],
  preserve: ["Copy-on-Write", "Merge-on-Read", "Snapshot", "VACUUM", "OCC"],
});
