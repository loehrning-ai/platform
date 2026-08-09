import canonical from "../streaming";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Streaming: Kafka, Watermarks und Fenster",
  subtitle: "Partitionen · Gruppen · Ereigniszeit",
  hook: "Ereigniszeit und Verarbeitungszeit unterscheiden sich. Watermarks machen verspätete Daten beherrschbar.",
  keyConcepts: [
    "Ereigniszeit oder Verarbeitungszeit",
    "Watermark",
    "Fenstertypen",
    "Zustellgarantien",
    "Flink oder Spark Structured Streaming",
  ],
  sections: [
    {
      id: "s1",
      title: "Zwei Uhren",
      content: `Streaming-Jobs behandeln Eingabe als *unbegrenzt*: Die Berechnung hat kein natürliches Dateiende. Das System muss definieren, wann Zwischenergebnisse ausgegeben, korrigiert oder für einen Consumer als ausreichend final betrachtet werden.

Zwei Zeitstempel sind relevant. **Ereigniszeit** beschreibt, wann ein Ereignis laut Quelle stattfand. **Verarbeitungszeit** beschreibt, wann ein Operator es beobachtete. Geräte puffern, Netze wiederholen, Queues sammeln Lag und Uhren sind ungenau. Verwende Ereigniszeit, wenn die Fachregel den Entstehungszeitpunkt betrifft und der Quellzeitstempel vertrauenswürdig ist. Verwende Verarbeitungszeit, wenn die Anforderung Ankunft oder Systembehandlung betrifft. Keine ist eine universelle Vorgabe.`,
    },
    {
      id: "s2",
      title: "Kafkas Kernmodell",
      content: `Fünf Konzepte definieren das Kernmodell:

- **Topic**, eine benannte Folge von Datensätzen, aufgeteilt in Partitionen.
- **Partition**, ein geordnetes Log. Kafka definiert Ordnung innerhalb einer Partition, nicht über ein Topic hinweg.
- **Producer**, schreibt Datensätze und wählt eine Partition explizit, über einen konfigurierten Partitioner oder über Client-Verhalten für Datensätze mit oder ohne Schlüssel.
- **Consumer Group**, koordiniert Consumer so, dass ein Gruppenmitglied jeweils eine Partition besitzt. Aktive Parallelität für dieses Topic ist durch die Partitionen begrenzt.
- **Offset**, eine Datensatzposition innerhalb einer Partition. Eine Gruppe speichert commitete Offsets; Replay ist nur möglich, solange benötigte Datensätze aufbewahrt und kompatibel bleiben.

Stabiler Schlüssel, stabiler Partitioner und unveränderte Partitionszahl können Datensätze eines Schlüssels in einer Partition halten. Eine Erhöhung der Partitionszahl kann spätere Datensätze anders zuordnen, sodass lokale Schlüsselhistorie mehrere Partitionen umfasst. Wähle die Zahl aus gemessenem Durchsatz, Limits je Partition, Ordnung, Wiederherstellung und Betriebsaufwand statt einer festen Sicherheitszahl.`,
    },
    {
      id: "s3",
      title: "Ereigniszeit oder Verarbeitungszeit",
      content: `Betrachte eine Zählung je Minute. Trifft ein Ereignis später als sein Quellzeitstempel ein, ordnet eine Ereigniszeitaggregation es dem Quellfenster zu; eine Verarbeitungszeitaggregation ordnet es nach Ankunft ein. Die richtige Regel folgt der Produktdefinition.

Eine **Watermark** ist das Fortschrittssignal der Engine für Ereigniszeit. Sie zeigt gewöhnlich gemäß einer konfigurierten oder erzeugten Regel an, dass das System wesentlich frühere Zeitstempel nicht erwartet. Sie beweist nicht, dass jedes frühere Ereignis angekommen ist. Nach Überschreiten einer Fenstergrenze kann eine Engine Ausgabe auslösen und spätere Ereignisse je API und Konfiguration verwerfen, halten, weiterleiten oder Ergebnisse korrigieren.`,
    },
    {
      id: "s4",
      title: "Watermark-Darstellung",
      content: `Die Darstellung verwendet eine feste synthetische Verspätungsschwelle. Sie zeigt, wie eine Schwelle die Klassifikation als pünktlich oder verspätet verändert; sie ist keine Produktionsempfehlung.

Wähle die Watermark-Regel aus beobachteter Verzögerungsverteilung, inaktiven Partitionen, Uhrenqualität, Quellverhalten, erlaubter Zustandsgröße, Korrektursemantik und Consumer-SLO. Ein Perzentil kann informieren; akzeptierter Verlust oder Korrektur bleibt eine Produktentscheidung und muss nach Deployment gemessen werden.`,
    },
    {
      id: "s5",
      title: "Fenstertypen",
      content: `| Fenster | Form | Geeignet für |
|---|---|---|
| Tumbling | Fest, nicht überlappend, etwa jede Minute oder Stunde | „Ereignisse je Minute“ |
| Hopping (Sliding) | Fest, überlappend, etwa alle 30s mit Größe 5min | Gleitende Mittelwerte, ruhige Dashboards |
| Session | Variabel und lückenbasiert, schließt nach T Sekunden Inaktivität | Sitzungen, IoT-Ereignisbündel |
| Global | Ein unbegrenztes Fenster mit eigenen Triggern | Laufende Summen mit manuellem Abschluss |`,
    },
    {
      id: "s5b",
      title: "Zustellgarantien",
      content: `Zustell- und Verarbeitungsaussagen müssen Grenze, Fehlermodell und sichtbaren Zustand benennen:

- **At-most-once.** Ein Fehler kann einen Effekt auslassen, während das Protokoll innerhalb seines Umfangs die Wiederholung bestätigter Arbeit vermeidet.
- **At-least-once.** Das System wiederholt Arbeit nach unklaren Fehlern. Derselbe logische Datensatz kann deshalb mehrmals wirken, wenn der Consumer Duplikateffekte nicht kontrolliert. „Kein Verlust“ hängt weiterhin von Quelldauerhaftigkeit, Aufbewahrung, Bestätigungen und benannten Fehlern ab.
- **Exactly-once.** Ein begrenztes System lässt die commitete Ausgabe so erscheinen, als hätte jede Eingabe einmal gewirkt. Transaktionen, Checkpoints, wiedereinspielbare Quellen, idempotente Ziele oder koordinierte Offsets können dies umsetzen. Externe APIs und sämtliche vor- oder nachgelagerten Systeme sind nicht automatisch eingeschlossen.

Kafka-Transaktionen können Ausgabe und konsumierte Offsets für einen Kafka-zu-Kafka-Read-Process-Write-Pfad atomar veröffentlichen, wenn Producer, Consumer, Isolation und Broker-Konfiguration teilnehmen. Flink dokumentiert End-to-End-Exactly-once mit wiedereinspielbaren Quellen und transaktionalen oder idempotenten Zielen. Zähle in jedem Entwurf alle Seiteneffekte auf und prüfe Wiederherstellung durch Fehlerinjektion.`,
      keyTakeaway:
        "Eine Verarbeitungsgarantie gilt nur für benannte Quelle, Zustand, Ziel, Konfiguration und Fehlermodell.",
    },
    {
      id: "s5c",
      title: "Streaming Engine auswählen",
      content: `Fähigkeiten und Vorgaben von Engines ändern sich. Vergleiche konkrete Version und Connectoren anhand einer reproduzierbaren Last:

| Entscheidung | Evidenz |
|---|---|
| Verarbeitungsmodus | Scheduling von Datensätzen oder Micro-Batches und APIs je Modus |
| Zustand | Größe, Backend, Checkpoint-Dauer, Wiederherstellung, Rescaling und Schemaentwicklung |
| Ereigniszeit | Watermark-Erzeugung, inaktive Eingaben, Fenster, Joins, Timer und Late-Data-Korrekturen |
| Garantien | Quell-Replay, Zustandssemantik, Zielbeteiligung, Offset-Commits und Fehlertests |
| Latenz und Durchsatz | Gemessene Perzentile unter Normalbetrieb, Backpressure, Checkpoints und Wiederherstellung |
| Betrieb | Deployment, Upgrades, Savepoints/Checkpoints, Observability, Kosten und Zuständigkeit |

Aktuelle offizielle Dokumentation unterscheidet bei Spark Structured Streaming den standardmäßigen Micro-Batch-Modus und eine separate kontinuierliche Verarbeitung mit verschiedenen Garantien; Flink trennt ebenfalls Zustandsgarantien von End-to-End-Zielgarantien. Reduziere kein Produkt auf feste Latenzbereiche oder ein einziges „Exactly-once“-Etikett.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **Ereignis- oder Verarbeitungszeit aus Fachregel und Zeitstempelqualität wählen.** Verzögerte, doppelte und ungeordnete Eingabe testen.
- **Eine Watermark ist eine Ereigniszeit-Fortschrittsregel, kein Vollständigkeitsbeweis.** Korrektur, Aufbewahrung und Consumer-Verhalten für verspätete Daten definieren.
- **Zustellgarantien begrenzen.** Quell-Replay, Zustand, Ziel, Konfiguration und Fehlermodell benennen; jeden externen Seiteneffekt testen.
- **Engines anhand aktueller versionierter Fähigkeiten und gemessener Last wählen.** Produktnamen implizieren weder Latenz noch Verarbeitungsgarantien.
- **Kafka-Partitionen begrenzen aktive Consumer einer Gruppe für dieses Topic.** Eine Erhöhung kann spätere Schlüsseldatensätze neu zuordnen; Migration und Ordnung planen.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Kompaktiertes Topic**, ein Kafka-Topic, dessen Hintergrundkompaktierung mindestens den neuesten Wert je Schlüssel gemäß Segment-, Tombstone- und Aufbewahrungsregeln behält. Alte Datensätze verschwinden nicht sofort.
- **ISR**, nach Broker-Regeln In-Sync Replicas. Producer-Bestätigungen, Replikation, Leader Election und angenommene Fehler bestimmen gemeinsam die Dauerhaftigkeit.
- **At-most-once**, eine begrenzte Regel, die nach unklarem Fehler Effekte auslassen und Replay innerhalb ihres Umfangs vermeiden kann.
- **At-least-once**, Wiederholungen können Effekte wiederholen; Idempotenz benötigt stabile Vorgangsidentität und eine Zielregel.
- **Exactly-once**, eine begrenzte Eigenschaft commiteter Ausgabe mit beteiligter Quelle, Verarbeitungszustand, Ziel und Konfiguration.
- **Backpressure**, nachgelagerte Kapazitätsgrenzen pflanzen sich je Broker und Topologie fort oder sammeln sich an; Lag, Puffer, Checkpoints und Quelldrosselung überwachen.
- **Zulässige Verspätung**, eine Engine-spezifische Regel für Zustandsaufbewahrung und Annahme oder Korrektur von Ergebnissen nach Fortschritt der Ereigniszeit.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Partitionszahl",
      question:
        "Ein Team legt für das Topic `page_views` vier Partitionen an. Ein Jahr später sollen 50 Consumer derselben Consumer Group parallel arbeiten. Welches Problem entsteht?",
      options: [
        "Keines; Kafka skaliert automatisch.",
        "46 Consumer bleiben untätig. Die Partitionszahl begrenzt die Parallelität einer Consumer Group. Eine spätere Erhöhung verändert die konsistente Zuordnung von Schlüsseln zu Partitionen.",
        "Das Team benötigt mehr Broker.",
        "Das Team sollte Kinesis verwenden.",
      ],
      explanation:
        "Innerhalb einer Consumer Group besitzt jeweils ein Mitglied eine Partition. Vier Partitionen erlauben deshalb höchstens vier aktive Besitzer für dieses Topic. Die Partitionszahl kann später erhöht werden, doch eine Standard-Schlüsselzuordnung kann sich für folgende Datensätze ändern. Wähle und migriere sie anhand gemessenen Durchsatzes, Ordnung, Wiederherstellung, Broker-Limits und Betriebsaufwand.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Regel für verspätete Daten",
      question:
        "Ein Streaming-Job aggregiert „Umsatz je Minute“. Die Watermark liegt 30 Sekunden hinter der höchsten Ereigniszeit. Ein Ereignis mit Ereigniszeit 14:32:15 trifft um 14:34:00 Verarbeitungszeit ein. Was geschieht?",
      options: [
        "Es wird in das Ergebnis für 14:32 Uhr aufgenommen.",
        "Das hängt von Fenster- und Late-Data-Regel ab: Die Engine kann verwerfen, weiterleiten, halten oder eine Korrektur ausgeben.",
        "Es wird nach Verarbeitungszeit in das Ergebnis für 14:34 Uhr eingeordnet.",
        "Es löst eine Neuberechnung aller Fenster aus.",
      ],
      explanation:
        "Die Zeitstempel legen nahe, dass das Ereignis hinter der genannten Watermark-Regel liegt. Das Ergebnis hängt dennoch von Watermark-Erzeugung, inaktiven Partitionen, Zustandsaufbewahrung und Late-Data-Verhalten der Engine ab. Der Entwurf muss festlegen, ob nachgelagerte Ausgabe final, korrigierbar oder durch Korrekturen ergänzt ist.",
    },
    {
      kind: "quiz",
      cpId: "q3",
      title: "Session-Fenster",
      question:
        "Berechnet werden soll die Dauer einer Sitzung: eine Folge von Ereignissen ohne Pause von mehr als 30 Minuten. Welcher Fenstertyp passt?",
      options: [
        "Tumbling, alle 30 Minuten.",
        "Session mit einer Inaktivitätslücke von 30 Minuten. Ein Tumbling-Fenster würde eine lange Sitzung an festen Grenzen teilen; ein Session-Fenster schließt dynamisch nach der Lücke.",
        "Hopping mit einer Größe von 30 Minuten.",
        "Global mit einem manuellen Trigger.",
      ],
      explanation:
        "Session-Fenster sind je Schlüssel, etwa je Person, definiert. Die Engine hält ein Fenster offen, solange weitere Ereignisse innerhalb der Lücke eintreffen. Es schließt, sobald Watermark - last_event > gap gilt. Ein Tumbling-Fenster kann das nicht abbilden: Eine 32-minütige Sitzung über einer festen Fenstergrenze würde als zwei Sitzungen erscheinen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Kompaktiertes Topic",
          q: "Was bezeichnet der Begriff?",
          a: "Hintergrundkompaktierung behält gemäß Segment- und Tombstone-Regeln mindestens den neuesten Wert je Schlüssel. Sie kann den Wiederaufbau von Schlüsselzustand unterstützen, ist aber keine sofortige oder vollständig eingeschränkte Tabelle.",
        },
        {
          term: "ISR",
          q: "Was sind In-Sync Replicas?",
          a: "Replikate, die nach den Broker-Regeln als synchron gelten. Producer-Bestätigungen, min.insync.replicas, Replikationsfaktor, Leader Election und angenommene Fehler bestimmen gemeinsam die Haltbarkeit.",
        },
        {
          term: "At-most-once",
          q: "Wie wird es erreicht und wann ist es vertretbar?",
          a: "Wird die Position vor dem Effekt bestätigt, kann ein Absturz diesen Effekt auslassen. Das ist nur vertretbar, wenn das definierte Verlustrisiko ausdrücklich akzeptiert und unabhängig überwacht wird.",
        },
        {
          term: "At-least-once",
          q: "Wie wird es erreicht?",
          a: "Wird die Position nach einem Effekt bestätigt, kann Arbeit bei einem Fehler zwischen beiden Schritten wiederholt werden. Doppelte Effekte benötigen eine stabile Identität und passende Zielsemantik; Haltbarkeit und Aufbewahrung der Quelle bleiben relevant.",
        },
        {
          term: "Exactly-once",
          q: "Wie setzt Kafka es um?",
          a: "Für einen Kafka-zu-Kafka-Pfad aus Lesen, Verarbeiten und Schreiben können Transaktionen Ausgabe und konsumierte Offsets atomar veröffentlichen, wenn Producer und Read-committed-Consumer teilnehmen. Externe Ziele benötigen eine eigene transaktionale oder idempotente Integration.",
        },
        {
          term: "Backpressure",
          q: "Was geschieht bei einem langsamen Consumer?",
          a: "Ein langsamer Consumer kann Lag und Druck auf die Broker-Aufbewahrung erhöhen. In einer Verarbeitungstopologie können nachgelagerte Grenzen Puffer füllen und sich bis zu den Quellen fortsetzen. Überwache den gesamten Pfad, statt ein unbeeinflusstes Bauteil anzunehmen.",
        },
        {
          term: "Zulässige Verspätung",
          q: "Was steuert diese Fenstereinstellung?",
          a: "Eine Engine-spezifische Regel dafür, wie lange Zustand verfügbar bleibt und was verspätete Ereignisse tun dürfen, nachdem der Ereigniszeitfortschritt ein Fenster überschritten hat. Nachgelagerte Consumer müssen ausgegebene Korrekturen unterstützen.",
        },
      ],
    },
  ],
  preserve: [
    "Watermark",
    "ISR",
    "At-most-once",
    "At-least-once",
    "Exactly-once",
    "Backpressure",
  ],
});
