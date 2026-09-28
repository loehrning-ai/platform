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
      content: `Ein Stream hat kein Dateiende. Die Eingabe ist *unbegrenzt*, also legt das System fest, wann es ein Ergebnis ausgibt, korrigiert oder für einen Consumer final genug nennt.

**Ereigniszeit** sagt, wann ein Ereignis laut Quelle passiert ist, **Verarbeitungszeit**, wann ein Operator es gesehen hat. Beide laufen auseinander, weil Geräte puffern, Netze wiederholen, Queues Lag sammeln und Uhren abweichen. Nimm Ereigniszeit, wenn die Fachregel am Entstehungszeitpunkt hängt und der Quellzeitstempel verlässlich ist, und Verarbeitungszeit, wenn die Regel Ankunft oder Behandlung meint.`,
    },
    {
      id: "s2",
      title: "Kafkas Kernmodell",
      content: `- **Topic**, eine benannte Folge von Datensätzen, aufgeteilt in Partitionen.
- **Partition**, ein geordnetes Log. Kafka ordnet innerhalb einer Partition, nie über ein Topic hinweg.
- **Producer**, schreibt Datensätze in eine Partition, explizit gewählt, per Partitioner oder per Client-Vorgabe.
- **Consumer Group**, gibt jede Partition jeweils einem Mitglied, also begrenzen Partitionen die aktive Parallelität.
- **Offset**, die Position eines Datensatzes in einer Partition. Replay ab commiteten Offsets geht nur, solange die Datensätze aufbewahrt und kompatibel bleiben.

Bleiben Schlüssel, Partitioner und Partitionszahl stabil, bleiben die Datensätze eines Schlüssels in einer Partition. Erhöhst du die Zahl, können spätere Datensätze anders landen. Leg sie nach gemessenem Durchsatz, Limits je Partition, Ordnung, Wiederherstellung und Betriebsaufwand fest.`,
    },
    {
      id: "s3",
      title: "Ereigniszeit oder Verarbeitungszeit",
      content: `Du zählst Ereignisse je Minute. Um 14:35 Verarbeitungszeit kommt ein Ereignis mit Ereigniszeit 14:32 an. Die Ereigniszeitaggregation steckt es ins Fenster 14:32, die Verarbeitungszeitaggregation zählt es bei Ankunft; welche Regel stimmt, entscheidet die Produktdefinition.

Eine **Watermark** ist das Fortschrittssignal der Engine für Ereigniszeit: Nach einer konfigurierten oder erzeugten Regel erwartet sie keine wesentlich früheren Zeitstempel mehr. Dass alle früheren Ereignisse da sind, beweist sie nicht. Hinter einer Fenstergrenze kann die Engine Ergebnisse ausgeben und verspätete Ereignisse je API und Konfiguration verwerfen, halten, weiterleiten oder korrigieren.`,
    },
    {
      id: "s4",
      title: "Verspätungsschwelle wählen",
      content: `Das Watermark-Modell oben zeigt mit synthetischen Ereignissen und einer festen Verspätungsschwelle von vier Sekunden, wie eine Schwelle die Einstufung als pünktlich oder verspätet verschiebt. Eine Produktionsempfehlung ist sie nicht.

Leite die Regel aus beobachteter Verzögerung, inaktiven Partitionen, Uhrenqualität, Quellverhalten, erlaubter Zustandsgröße, Korrektursemantik und Consumer-SLO ab. Ein Perzentil hilft bei der Wahl; wie viel Verlust oder Korrektur akzeptabel ist, entscheidet das Produkt, und du misst es nach dem Deployment.`,
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
      content: `Jede Zustellaussage nennt Grenze, Fehlermodell und sichtbaren Zustand:

- **At-most-once.** Ein Fehler kann einen Effekt auslassen; bestätigte Arbeit wird innerhalb des Umfangs nicht wiederholt.
- **At-least-once.** Wiederholungen nach unklaren Fehlern können einen Datensatz zweimal wirken lassen, solange der Consumer Duplikate nicht kontrolliert. „Kein Verlust“ hängt weiter an Quelldauerhaftigkeit, Aufbewahrung und Bestätigungen.
- **Exactly-once.** Innerhalb eines Umfangs sieht die commitete Ausgabe aus, als hätte jede Eingabe einmal gewirkt, umgesetzt über Transaktionen, Checkpoints, wiedereinspielbare Quellen, idempotente Ziele oder koordinierte Offsets. Externe APIs gehören nicht automatisch dazu.

Kafka-Transaktionen veröffentlichen Ausgabe und konsumierte Offsets auf einem Kafka-zu-Kafka-Read-Process-Write-Pfad atomar, wenn Producer, Consumer, Isolation und Broker mitspielen. Flink verlangt für End-to-End-Exactly-once wiedereinspielbare Quellen und transaktionale oder idempotente Ziele.`,
    },
    {
      id: "s5c",
      title: "Streaming-Engine auswählen",
      content: `Fähigkeiten und Vorgaben von Engines ändern sich. Vergleiche die genaue Version und die Connectoren an einer reproduzierbaren Last:

| Entscheidung | Evidenz |
|---|---|
| Verarbeitungsmodus | Scheduling von Datensätzen oder Micro-Batches; APIs je Modus |
| Zustand | Größe, Backend, Checkpoint-Dauer, Wiederherstellung, Rescaling, Schemaentwicklung |
| Ereigniszeit | Watermarks, inaktive Eingaben, Fenster, Joins, Timer, späte Korrekturen |
| Garantien | Quell-Replay, Zustandssemantik, Zielbeteiligung, Offset-Commits, Fehlertests |
| Latenz und Durchsatz | Gemessene Perzentile unter Last, Backpressure, Checkpoints, Wiederherstellung |
| Betrieb | Deployment, Upgrades, Savepoints, Observability, Kosten, Zuständigkeit |

Spark Structured Streaming etwa arbeitet standardmäßig mit Micro-Batches und bietet einen getrennten kontinuierlichen Modus mit anderen Garantien. Flink trennt ebenso Zustandsgarantien von End-to-End-Garantien der Ziele. Kein Engine-Name garantiert einen Latenzbereich oder ein pauschales Exactly-once.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Drei Fragen zu Partitionen, Watermarks und Fenstern.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- Teste mit verzögerter, doppelter und ungeordneter Eingabe und injiziere Fehler um jeden externen Seiteneffekt.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Kompaktiertes Topic**, behält mindestens den neuesten Wert je Schlüssel und entfernt ältere verzögert.
- **ISR**, nach Broker-Regeln synchrone Replikate; mit den Producer-Bestätigungen bestimmen sie die Dauerhaftigkeit.
- **Backpressure**, nachgelagerte Grenzen, die vorgelagerte Arbeit bremsen oder stauen.
- **Zulässige Verspätung**, wie lange ein Fenster Zustand hält, um verspätete Ereignisse anzunehmen oder zu korrigieren.`,
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
        "Keines; Kafka skaliert Consumer automatisch.",
        "Nur vier Consumer arbeiten gleichzeitig; mehr Partitionen können Schlüssel später neu zuordnen.",
        "Das Team benötigt mehr Broker.",
        "Das Team sollte Kinesis verwenden.",
      ],
      explanation:
        "Jede Partition gehört jeweils einem Gruppenmitglied, also arbeiten höchstens vier Consumer und 46 bleiben untätig. Mehr Partitionen gehen später, doch Schlüsseldatensätze können dann anders landen; plane eine ordnungsbewusste Migration.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Regel für verspätete Daten",
      question:
        "Ein Job summiert Umsatz je Minute, Watermark 30 Sekunden hinter der höchsten Ereigniszeit. Ein Ereignis von 14:32:15 kommt um 14:34:00 Verarbeitungszeit an. Was passiert?",
      options: [
        "Es wird in das Ergebnis für 14:32 Uhr aufgenommen.",
        "Fenster- und Late-Data-Regel entscheiden: verwerfen, weiterleiten, halten oder korrigieren.",
        "Es wird nach Verarbeitungszeit in das Ergebnis für 14:34 Uhr eingeordnet.",
        "Es löst eine Neuberechnung aller Fenster aus.",
      ],
      explanation:
        "Das Ereignis liegt hinter der Watermark, doch Watermark-Erzeugung, inaktive Partitionen, Zustandsaufbewahrung und Late-Data-Verhalten bestimmen, was die Engine tut. Dein Entwurf legt fest, ob die Ausgabe final, korrigierbar oder später ergänzt ist.",
    },
    {
      kind: "quiz",
      cpId: "q3",
      title: "Session-Fenster",
      question:
        "Du berechnest die Sitzungsdauer: eine Folge von Ereignissen ohne Pause von mehr als 30 Minuten. Welcher Fenstertyp passt?",
      options: [
        "Tumbling, alle 30 Minuten.",
        "Session mit einer Inaktivitätslücke von 30 Minuten.",
        "Hopping mit einer Größe von 30 Minuten.",
        "Global mit einem manuellen Trigger.",
      ],
      explanation:
        "Ein Session-Fenster bleibt je Schlüssel offen, solange die Lücken unter der Schwelle liegen, und schließt per Watermark. Eine feste Tumbling-Grenze teilt eine 32-minütige Sitzung in zwei.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Kompaktiertes Topic",
          q: "Was bezeichnet der Begriff?",
          a: "Kompaktierung behält mindestens den neuesten Wert je Schlüssel und entfernt alte Werte verzögert. Damit lässt sich Zustand je Schlüssel neu aufbauen.",
        },
        {
          term: "ISR",
          q: "Was sind In-Sync Replicas?",
          a: "Replikate, die nach Broker-Regeln als synchron gelten. Producer-Bestätigungen, min.insync.replicas, Replikationsfaktor, Leader Election und angenommene Fehler bestimmen zusammen die Haltbarkeit.",
        },
        {
          term: "At-most-once",
          q: "Wie wird es erreicht und wann ist es vertretbar?",
          a: "Die Position wird vor dem Effekt bestätigt; ein Absturz kann ihn dann auslassen. Vertretbar nur, wenn jemand dieses Verlustrisiko akzeptiert und überwacht.",
        },
        {
          term: "At-least-once",
          q: "Wie wird es erreicht?",
          a: "Die Position wird nach dem Effekt bestätigt; ein Fehler dazwischen wiederholt Arbeit. Duplikate kontrollierst du mit stabiler Identität und passender Zielsemantik.",
        },
        {
          term: "Exactly-once",
          q: "Wie setzt Kafka es um?",
          a: "Auf einem Kafka-zu-Kafka-Pfad veröffentlichen Transaktionen Ausgabe und konsumierte Offsets atomar für Read-committed-Consumer. Externe Ziele brauchen eine eigene transaktionale oder idempotente Integration.",
        },
        {
          term: "Backpressure",
          q: "Was geschieht bei einem langsamen Consumer?",
          a: "Lag und Druck auf die Broker-Aufbewahrung steigen. In einer Verarbeitungstopologie füllen nachgelagerte Grenzen die Puffer und wandern zu den Quellen zurück, also überwachst du den ganzen Pfad.",
        },
        {
          term: "Zulässige Verspätung",
          q: "Was steuert diese Fenstereinstellung?",
          a: "Wie lange ein Fenster nach der Watermark Zustand hält und ob verspätete Ereignisse noch zählen. Consumer müssen die ausgegebenen Korrekturen verkraften.",
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
