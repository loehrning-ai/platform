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
      content: `Ein Streaming-Job bekommt nie ein Dateiende. Die Eingabe ist *unbegrenzt*, also legt das System fest, wann es ein Zwischenergebnis ausgibt, korrigiert oder für einen Consumer final genug nennt.

Dabei laufen zwei Uhren. **Ereigniszeit** sagt, wann ein Ereignis laut Quelle passiert ist. **Verarbeitungszeit** sagt, wann ein Operator es gesehen hat. Geräte puffern, Netze wiederholen, Queues sammeln Lag, Uhren gehen falsch.

Nimm Ereigniszeit, wenn die Fachregel am Entstehungszeitpunkt hängt und der Quellzeitstempel etwas taugt. Nimm Verarbeitungszeit, wenn die Anforderung Ankunft oder Systembehandlung meint. Vorgabe ist keine von beiden.`,
    },
    {
      id: "s2",
      title: "Kafkas Kernmodell",
      content: `Fünf Begriffe tragen das Kernmodell.

- **Topic**, eine benannte Folge von Datensätzen, aufgeteilt in Partitionen.
- **Partition**, ein geordnetes Log. Kafka definiert Ordnung innerhalb einer Partition, nicht über ein Topic hinweg.
- **Producer**, schreibt Datensätze und wählt eine Partition explizit, über einen konfigurierten Partitioner oder über Client-Verhalten für Datensätze mit oder ohne Schlüssel.
- **Consumer Group**, koordiniert Consumer so, dass ein Gruppenmitglied jeweils eine Partition besitzt. Die Partitionen begrenzen damit die aktive Parallelität für dieses Topic.
- **Offset**, eine Datensatzposition innerhalb einer Partition. Eine Gruppe speichert commitete Offsets; Replay geht nur, solange die benötigten Datensätze aufbewahrt und kompatibel bleiben.

Bleiben Schlüssel, Partitioner und Partitionszahl stabil, bleiben die Datensätze eines Schlüssels in einer Partition. Erhöhst du sie, landen spätere Datensätze anders, und die Historie eines Schlüssels verteilt sich über Partitionen. Wähle die Zahl aus gemessenem Durchsatz, Limits je Partition, Ordnung, Wiederherstellung und Betriebsaufwand, nicht aus einer festen Sicherheitszahl.`,
    },
    {
      id: "s3",
      title: "Ereigniszeit oder Verarbeitungszeit",
      content: `Zählung je Minute. Ein Ereignis trifft später ein, als sein Quellzeitstempel sagt. Die Ereigniszeitaggregation steckt es ins Quellfenster, die Verarbeitungszeitaggregation ordnet es nach Ankunft ein. Welche Regel richtig ist, entscheidet die Produktdefinition.

Eine **Watermark** ist das Fortschrittssignal der Engine für Ereigniszeit. Sie behauptet nach einer konfigurierten oder erzeugten Regel, dass wesentlich frühere Zeitstempel nicht mehr kommen. Ein Vollständigkeitsbeweis ist sie nicht. Überschreitet sie eine Fenstergrenze, kann die Engine ausgeben und spätere Ereignisse je API und Konfiguration verwerfen, halten, weiterleiten oder das Ergebnis korrigieren.`,
    },
    {
      id: "s4",
      title: "Watermark-Darstellung",
      content: `Die Darstellung verwendet eine feste synthetische Verspätungsschwelle. Sie zeigt, wie eine Schwelle die Klassifikation als pünktlich oder verspätet kippt; eine Produktionsempfehlung ist sie nicht.

Die Watermark-Regel folgt aus beobachteter Verzögerungsverteilung, inaktiven Partitionen, Uhrenqualität, Quellverhalten, erlaubter Zustandsgröße, Korrektursemantik und Consumer-SLO. Ein Perzentil kann informieren. Wie viel Verlust oder Korrektur akzeptabel ist, entscheidet das Produkt; gemessen wird nach dem Deployment.`,
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
      content: `Zustell- und Verarbeitungsaussagen brauchen drei Angaben: Grenze, Fehlermodell, sichtbarer Zustand.

- **At-most-once.** Ein Fehler kann einen Effekt auslassen, während das Protokoll innerhalb seines Umfangs die Wiederholung bestätigter Arbeit vermeidet.
- **At-least-once.** Das System wiederholt Arbeit nach unklaren Fehlern. Derselbe logische Datensatz kann deshalb mehrmals wirken, solange der Consumer Duplikateffekte nicht kontrolliert. „Kein Verlust“ hängt weiterhin an Quelldauerhaftigkeit, Aufbewahrung, Bestätigungen und benannten Fehlern.
- **Exactly-once.** Ein begrenztes System lässt die commitete Ausgabe so erscheinen, als hätte jede Eingabe einmal gewirkt. Transaktionen, Checkpoints, wiedereinspielbare Quellen, idempotente Ziele oder koordinierte Offsets setzen das um. Externe APIs und die Systeme davor und danach gehören nicht automatisch dazu.

Kafka-Transaktionen können Ausgabe und konsumierte Offsets für einen Kafka-zu-Kafka-Read-Process-Write-Pfad atomar veröffentlichen, wenn Producer, Consumer, Isolation und Broker-Konfiguration mitspielen. Flink dokumentiert End-to-End-Exactly-once mit wiedereinspielbaren Quellen und transaktionalen oder idempotenten Zielen. Zähl in jedem Entwurf alle Seiteneffekte auf und prüfe die Wiederherstellung mit Fehlerinjektion.`,
      keyTakeaway:
        "Eine Verarbeitungsgarantie gilt nur für benannte Quelle, Zustand, Ziel, Konfiguration und Fehlermodell.",
    },
    {
      id: "s5c",
      title: "Streaming Engine auswählen",
      content: `Fähigkeiten und Vorgaben von Engines ändern sich. Vergleiche konkrete Version und Connectoren an einer reproduzierbaren Last:

| Entscheidung | Evidenz |
|---|---|
| Verarbeitungsmodus | Scheduling von Datensätzen oder Micro-Batches und APIs je Modus |
| Zustand | Größe, Backend, Checkpoint-Dauer, Wiederherstellung, Rescaling und Schemaentwicklung |
| Ereigniszeit | Watermark-Erzeugung, inaktive Eingaben, Fenster, Joins, Timer und Late-Data-Korrekturen |
| Garantien | Quell-Replay, Zustandssemantik, Zielbeteiligung, Offset-Commits und Fehlertests |
| Latenz und Durchsatz | Gemessene Perzentile unter Normalbetrieb, Backpressure, Checkpoints und Wiederherstellung |
| Betrieb | Deployment, Upgrades, Savepoints/Checkpoints, Observability, Kosten und Zuständigkeit |

Die aktuelle offizielle Dokumentation trennt bei Spark Structured Streaming den standardmäßigen Micro-Batch-Modus von einer separaten kontinuierlichen Verarbeitung mit anderen Garantien; Flink trennt Zustandsgarantien von End-to-End-Zielgarantien. Reduziere kein Produkt auf feste Latenzbereiche oder ein „Exactly-once“-Etikett.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zu Partitionen, Watermarks und Fenstern.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **Ereignis- oder Verarbeitungszeit folgt aus Fachregel und Zeitstempelqualität.** Teste verzögerte, doppelte und ungeordnete Eingabe.
- **Eine Watermark ist eine Ereigniszeit-Fortschrittsregel, kein Vollständigkeitsbeweis.** Definiere Korrektur, Aufbewahrung und Consumer-Verhalten für verspätete Daten.
- **Grenze jede Zustellgarantie ein.** Benenne Quell-Replay, Zustand, Ziel, Konfiguration und Fehlermodell; teste jeden Seiteneffekt.
- **Engines wählst du an aktuellen versionierten Fähigkeiten und gemessener Last.** Produktnamen sagen weder Latenz noch Verarbeitungsgarantien zu.
- **Kafka-Partitionen begrenzen die aktiven Consumer einer Gruppe für dieses Topic.** Eine Erhöhung kann spätere Schlüsseldatensätze neu zuordnen; plane Migration und Ordnung.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Kompaktiertes Topic**, ein Kafka-Topic, dessen Hintergrundkompaktierung mindestens den neuesten Wert je Schlüssel gemäß Segment-, Tombstone- und Aufbewahrungsregeln behält. Alte Datensätze verschwinden nicht sofort.
- **ISR**, nach Broker-Regeln In-Sync Replicas. Producer-Bestätigungen, Replikation, Leader Election und angenommene Fehler bestimmen zusammen die Dauerhaftigkeit.
- **At-most-once**, eine begrenzte Regel, die nach unklarem Fehler Effekte auslassen und Replay innerhalb ihres Umfangs vermeiden kann.
- **At-least-once**, Wiederholungen können Effekte wiederholen; Idempotenz braucht stabile Vorgangsidentität und eine Zielregel.
- **Exactly-once**, eine begrenzte Eigenschaft commiteter Ausgabe mit beteiligter Quelle, Verarbeitungszustand, Ziel und Konfiguration.
- **Backpressure**, nachgelagerte Kapazitätsgrenzen pflanzen sich je Broker und Topologie fort oder stauen sich; überwache Lag, Puffer, Checkpoints und Quelldrosselung.
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
        "Innerhalb einer Consumer Group besitzt jeweils ein Mitglied eine Partition. Vier Partitionen erlauben also höchstens vier aktive Besitzer für dieses Topic. Erhöhen lässt sich die Zahl später, doch eine Standard-Schlüsselzuordnung kann sich für folgende Datensätze verschieben. Wähle und migriere sie an gemessenem Durchsatz, Ordnung, Wiederherstellung, Broker-Limits und Betriebsaufwand.",
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
        "Die Zeitstempel legen nahe, dass das Ereignis hinter der genannten Watermark-Regel liegt. Das Ergebnis hängt trotzdem an Watermark-Erzeugung, inaktiven Partitionen, Zustandsaufbewahrung und Late-Data-Verhalten der Engine. Der Entwurf legt fest, ob die nachgelagerte Ausgabe final, korrigierbar oder durch Korrekturen ergänzt ist.",
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
        "Session-Fenster gelten je Schlüssel, etwa je Person. Die Engine hält ein Fenster offen, solange weitere Ereignisse innerhalb der Lücke eintreffen. Es schließt, sobald Watermark - last_event > gap gilt. Ein Tumbling-Fenster kann das nicht abbilden: Eine 32-minütige Sitzung über einer Fenstergrenze erscheint als zwei Sitzungen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Kompaktiertes Topic",
          q: "Was bezeichnet der Begriff?",
          a: "Hintergrundkompaktierung behält nach Segment- und Tombstone-Regeln mindestens den neuesten Wert je Schlüssel. Sie kann den Wiederaufbau von Schlüsselzustand tragen, ist aber keine sofortige oder vollständig eingeschränkte Tabelle.",
        },
        {
          term: "ISR",
          q: "Was sind In-Sync Replicas?",
          a: "Replikate, die nach den Broker-Regeln als synchron gelten. Producer-Bestätigungen, min.insync.replicas, Replikationsfaktor, Leader Election und angenommene Fehler bestimmen zusammen die Haltbarkeit.",
        },
        {
          term: "At-most-once",
          q: "Wie wird es erreicht und wann ist es vertretbar?",
          a: "Wird die Position vor dem Effekt bestätigt, kann ein Absturz diesen Effekt auslassen. Vertretbar ist das nur, wenn jemand das definierte Verlustrisiko ausdrücklich akzeptiert und unabhängig überwacht.",
        },
        {
          term: "At-least-once",
          q: "Wie wird es erreicht?",
          a: "Wird die Position nach einem Effekt bestätigt, kann Arbeit bei einem Fehler zwischen beiden Schritten erneut laufen. Doppelte Effekte brauchen eine stabile Identität und passende Zielsemantik; Haltbarkeit und Aufbewahrung der Quelle bleiben relevant.",
        },
        {
          term: "Exactly-once",
          q: "Wie setzt Kafka es um?",
          a: "Für einen Kafka-zu-Kafka-Pfad aus Lesen, Verarbeiten und Schreiben können Transaktionen Ausgabe und konsumierte Offsets atomar veröffentlichen, wenn Producer und Read-committed-Consumer mitspielen. Externe Ziele brauchen ihre eigene transaktionale oder idempotente Integration.",
        },
        {
          term: "Backpressure",
          q: "Was geschieht bei einem langsamen Consumer?",
          a: "Ein langsamer Consumer treibt Lag und Druck auf die Broker-Aufbewahrung. In einer Verarbeitungstopologie füllen nachgelagerte Grenzen die Puffer und wandern bis zu den Quellen zurück. Überwache den ganzen Pfad, statt ein Bauteil für unbeeinflusst zu halten.",
        },
        {
          term: "Zulässige Verspätung",
          q: "Was steuert diese Fenstereinstellung?",
          a: "Eine Engine-spezifische Regel dafür, wie lange Zustand verfügbar bleibt und was verspätete Ereignisse noch dürfen, nachdem der Ereigniszeitfortschritt ein Fenster überschritten hat. Nachgelagerte Consumer müssen ausgegebene Korrekturen verkraften.",
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
