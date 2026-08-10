import canonical from "../idempotency";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Idempotenz, Backfills und Verarbeitungsgarantien",
  subtitle: "Quelle, Zustand, Ziel und Fehlermodell abgrenzen",
  hook: "Wiederholungen und historische Neuberechnungen für alle benannten Seiteneffekte sicher machen.",
  keyConcepts: [
    "Idempotenz",
    "UPSERT nach Schlüssel",
    "Historischer Neuaufbau (Backfill)",
    "Zwei-Phasen-Commit",
    "Dead-Letter Queue",
    "Schemakompatibilität",
  ],
  sections: [
    {
      id: "s1",
      title: "Drei Garantien",
      content: `Messaging-Garantien sind nur mit einer benannten Grenze und einem Fehlermodell aussagekräftig:

- **At-most-once.** Das Protokoll kann einen Effekt nach einem unklaren Fehler auslassen und vermeidet innerhalb seines Geltungsbereichs eine Wiederholung.
- **At-least-once.** Arbeit kann erneut versucht oder abgespielt werden. Ohne Kontrolle im Consumer sind doppelte Effekte möglich. Aussagen über Datenverlust bleiben durch Haltbarkeit und Aufbewahrung der Quelle begrenzt.
- **Exactly-once.** Der bestätigte Zustand innerhalb eines definierten Pfads aus Quelle, Verarbeitung und Ziel wirkt so, als hätte jede Eingabe ihn einmal beeinflusst. Implementierungen können Transaktionen, Checkpoints, koordinierte Offsets oder idempotente Effekte verwenden.

Idempotenz ist ein wichtiger Mechanismus, aber keine allgemeingültige Übersetzung von Exactly-once. Eine Kafka-zu-Kafka-Transaktion kann Ausgabe und konsumierte Offsets bei beteiligter Konfiguration atomar bestätigen. Ein HTTP-Aufruf an einen Zahlungsdienst benötigt beim Anbieter einen stabilen Idempotenzvertrag, eine Aufbewahrung der Anfrageidentität und einen Abgleich unklarer Ergebnisse.`,
      keyTakeaway:
        "Eine Exactly-once-Aussage ist ohne Quelle, Zustand, Ziel, Konfiguration und Fehlergrenze unvollständig.",
    },
    {
      id: "s2",
      title: "Muster für Idempotenz",
      content: `Drei Muster können einen abgegrenzten Effekt bei Wiederholung sicher machen, wenn ihre Voraussetzungen gelten:

**01 · UPSERT nach Schlüssel.** Die Quelle muss pro Schlüssel eine deterministische Gewinnerzeile enthalten. Ältere Ereignisse dürfen neueren Zustand nicht versehentlich überschreiben.

\`\`\`sql
MERGE INTO fact_orders dst
USING new_orders src
  ON dst.order_id = src.order_id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
\`\`\`

**02 · Fenster ersetzen.** Die Transaktion oder der Commit des Tabellenformats muss einen vollständigen, deterministischen Ersatz für das Fenster veröffentlichen. Externe Leser dürfen das Löschen nicht ohne das Einfügen sehen.

\`\`\`sql
BEGIN;
DELETE FROM agg_daily WHERE day = '2026-04-15';
INSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';
COMMIT;
\`\`\`

**03 · Nach Ereignisidentität deduplizieren.** Der Producer muss eine stabile Identität für das logische Ereignis liefern. Das Ziel muss die Eindeutigkeit mindestens für den Wiederholungshorizont durchsetzen.

\`\`\`sql
INSERT INTO sink (event_id, ...)
VALUES (...)
ON CONFLICT (event_id) DO NOTHING;
\`\`\`

Keines dieser Muster macht unabhängige API-Aufrufe, Benachrichtigungen, Dateien oder nicht deterministische Transformationen automatisch idempotent.`,
    },
    {
      id: "s3",
      title: "Backfills richtig entwerfen",
      content: `Ein Backfill verarbeitet historische Eingaben nach einer Logikänderung, Datenkorrektur oder Schemaergänzung erneut. Vor der Ausführung werden festgehalten: (1) ein explizites Eingabefenster und eine unveränderliche Quellversion, (2) die Identität des Vorgangs und die Regel für doppelte Effekte, (3) Abhängigkeiten zwischen benachbarten Fenstern, (4) die Wechselwirkung mit laufenden Schreibvorgängen, (5) Ausgabeprüfung und Rückabwicklung sowie (6) Ressourcen- und Ratenbegrenzungen.

Parallele und wiederholte Fenster sind nur sicher, wenn die angegebenen Invarianten des Jobs ihre Vertauschbarkeit belegen. Andernfalls werden sie seriell ausgeführt oder ihre Ausgaben isoliert und vor der Freigabe abgeglichen.`,
    },
    {
      id: "s4",
      title: "Exactly-once in Kafka",
      content: `Kafka stellt Bausteine für einen abgegrenzten transaktionalen Pfad aus Lesen, Verarbeiten und Schreiben bereit:

1. **Idempotente Produktion.** Producer-Sequenznummern ermöglichen es Brokern, zulässige Wiederholungen innerhalb des Producer-Protokolls und der zugehörigen Konfiguration zu deduplizieren.
2. **Transaktionen über Kafka-Partitionen.** Ein transaktionaler Producer kann Datensätze atomar bestätigen oder verwerfen. Für \`read_committed\` konfigurierte Consumer blenden verworfene Transaktionsdatensätze aus.
3. **Konsumierte Offsets in der Ausgabetransaktion.** Die Anwendung kann konsumierte Offsets zusammen mit erzeugten Datensätzen bestätigen. Sichtbare Kafka-Ausgabe und Fortschritt werden dadurch gemeinsam weitergeschaltet.

Damit kann eine Anwendung für Kafka-Eingabe und Kafka-Ausgabe Exactly-once-Verarbeitung bereitstellen, wenn sie das Transaktionsprotokoll einhält und Broker- sowie Consumer-Einstellungen teilnehmen. Eine Quelle vor Kafka oder ein Ziel außerhalb von Kafka ist darin nicht enthalten.

Flink unterscheidet ebenfalls zwischen Exactly-once für verwalteten Zustand und End-to-End-Ausgabe. Seine offizielle Dokumentation zur Fehlertoleranz verlangt für End-to-End-Exactly-once wiederholbare Quellen und transaktionale oder idempotente Ziele. Die Garantien unterscheiden sich je Connector und Version. Für die konkrete Quelle, den Zustand, das Ziel und die Konfiguration wird eine Matrix erstellt. Danach werden Fehler vor und nach jeder Commit-Grenze injiziert.`,
    },
    {
      id: "s4b",
      title: "Dead-Letter Queues",
      content: `Ein **Dead-Letter-Pfad** ist eine mögliche Behandlung für Datensätze, die unter dem aktuellen Vertrag nicht verarbeitet werden können. Er bewahrt Fehlerbelege, ohne alle gültigen Datensätze zu blockieren. Gleichzeitig verändert er Vollständigkeit und Reihenfolge und gehört deshalb zur Verarbeitungsgarantie.

Gespeichert wird nur das Notwendige: eine geschützte Referenz oder verschlüsselte Nutzlast, ein sicherer Fehlercode, Quellidentität und -position, Schemaversion, Zeitpunkt des ersten Auftretens, Anzahl der Versuche und Zuständigkeit. Rohdatensätze und Ausnahmeberichte können personenbezogene Daten, Zugangsdaten oder interne Details enthalten. Zugriffskontrolle, Minimierung, Aufbewahrung und Schwärzung ersetzen blindes Kopieren.

Der Entwurf legt fest, welche Fehler erneut versucht und welche isoliert werden, ob ein Datensatz die Reihenfolge umgehen darf, wie Wiederholungen autorisiert werden und wie reparierte Ausgabe abgeglichen wird. Alarmschwellen richten sich nach der erwarteten Rate ungültiger Eingaben und den Auswirkungen auf Nutzer. Datenverkehr ungleich null ist nicht automatisch ein Vorfall.`,
      keyTakeaway:
        "Eine DLQ behebt den Fehler nicht. Sie macht ihn sichtbar und wiederherstellbar statt unsichtbar und endgültig.",
    },
    {
      id: "s5",
      title: "Schemaentwicklung",
      content: `Schema Registries stellen häufig die Kompatibilitätsmodi **backward**, **forward** und **full** bereit. Ihre genaue Bedeutung hängt von Serialisierungsformat, transitiver Einstellung, Subject-Strategie und Registry-Implementierung ab. Ein syntaktisch kompatibles Schema kann die Fachlogik trotzdem brechen.

Die Kompatibilität wird anhand von Auslieferungsreihenfolge, Anforderungen an erneutes Lesen, Aufbewahrung und Vielfalt der Consumer gewählt. Alte Daten werden mit neuen Readern getestet, neue Daten bei Bedarf mit unterstützten alten Readern. Ein strikter Modus kann einige inkompatible Registrierungen verhindern. Er kann historische neue Felder nicht befüllen, Semantik nicht prüfen und die Auslieferung nachgelagerter Systeme nicht allein koordinieren.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Idempotenzschlüssel**, eine stabile Identität für einen logischen Vorgang. Aufbewahrung auf dem Server, Parameterabgleich, gleichzeitige Anfragen, erneute Ausgabe der Antwort und Ablauf bestimmen den tatsächlichen Vertrag.
- **Zwei-Phasen-Commit**, koordiniert Vorbereitung und Bestätigung über teilnehmende Ressourcen. Das Verfahren bietet ein bestimmtes Atomaritätsmodell mit Kosten für Verfügbarkeit und Wiederherstellung; die Unterstützung unterscheidet sich.
- **Outbox**, bestätigt Fachzustand und eine Outbox-Zeile in einer Datenbanktransaktion und veröffentlicht danach asynchron mit Wiederholung und Deduplizierung.
- **Aktiver Backfill**, überschneidet sich mit laufenden Schreibvorgängen und benötigt deshalb Konfliktregeln, Ressourcenisolierung, Reihenfolge und Abgleich, nicht nur Idempotenz auf Zeilenebene.
- **Batch-Watermark**, eine gespeicherte Quellposition für inkrementelle Auswahl. Zeitstempel allein können verspätete oder korrigierte Daten auslassen; Token und Überlappungsregel folgen der Semantik der Quelle.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Eine Exactly-once-Aussage abgrenzen",
      question:
        "Ein Anbieter nennt „Exactly-once-Zustellung“. Welche Antwort benennt die fehlenden technischen Angaben?",
      options: [
        "„Gut, damit sind Duplikate gelöst.“",
        "„Quelle, bestätigten Zustand, Ziel, Konfiguration, Fehlermodell und Verhalten externer Seiteneffekte benennen.“",
        "„Unterstützt das System TLS?“",
        "„Wie unterscheidet sich das von At-most-once?“",
      ],
      explanation:
        "Exactly-once kann eine gültige Eigenschaft der bestätigten Ausgabe innerhalb eines abgegrenzten Systems sein. Die Aussage bleibt unvollständig, bis Quelle, Verarbeitungszustand, Ziel, Transaktions- oder Idempotenzmechanismus, Konfiguration und erfasste Fehler benannt sind. Externe APIs und andere nicht teilnehmende Effekte benötigen getrennte Verträge und Abgleich.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Backfill-Entwurf",
      question:
        "Ein Job läuft täglich für „die Daten von gestern“. Ein Fehler betrifft die vergangenen 90 Tage. Welche Änderung ist vor dem Backfill erforderlich?",
      options: [
        "Den Job einfach 90-mal ausführen.",
        "Das Datumsfenster parametrisieren, die Quellversion festhalten, wiederholtes und paralleles Fensterverhalten prüfen, laufende Schreibvorgänge isolieren und vor der Ausführung Prüfung und Rückabwicklung festlegen.",
        "Einen Snapshot wiederherstellen.",
        "Mehr Protokollierung ergänzen.",
      ],
      explanation:
        "Ein explizites Fenster ist notwendig, reicht aber nicht aus. Historische Eingaben können sich ändern, benachbarte Fenster können Zustand teilen, laufende Schreibvorgänge können kollidieren und externe Effekte können einer Rückabwicklung entgehen. Eingaben und Code werden festgehalten, Invarianten geprüft, Ausgaben atomar veröffentlicht und ein Wiederherstellungspfad beibehalten.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Idempotenzschlüssel",
          q: "Wie setzen APIs ihn ein?",
          a: "Der Client sendet eine stabile Vorgangsidentität. Der Server definiert Parameterabgleich, Verhalten gleichzeitiger Anfragen, Ergebnisaufbewahrung, Ablauf und ob er eine Antwort erneut ausgibt oder nur einen Effekt unterdrückt.",
        },
        {
          term: "Zwei-Phasen-Commit",
          q: "Wann wird er eingesetzt und warum ist er schwierig?",
          a: "2PC koordiniert Vorbereitung und Bestätigung über teilnehmende Ressourcen. Es kann Atomarität bereitstellen, verursacht aber Koordinations- und Wiederherstellungskomplexität. Eine Outbox ist eine Alternative für einen Ablauf aus Datenbank und Nachricht, kein allgemeiner Ersatz.",
        },
        {
          term: "Outbox",
          q: "Warum ist sie häufig besser als 2PC?",
          a: "Eine Datenbanktransaktion schreibt Fachzustand und Outbox-Zeile. Ein Publisher liefert die Outbox asynchron mit Wiederholungen aus. Das entfernt den Dual Write auf Anwendungsebene, benötigt aber weiterhin Deduplizierung, Aufbewahrung und Überwachung.",
        },
        {
          term: "Aktiver Backfill",
          q: "Wann ist er vertretbar?",
          a: "Wenn Backfill-Läufe dieselben Partitionen wie laufende Schreibvorgänge berühren, drohen Sperr- oder Versionskonflikte. Kalte Backfills laufen außerhalb der Hauptlast. Aktive Backfills benötigen Idempotenz auf Zeilenebene und einen Abgleich gleichzeitiger Änderungen.",
        },
        {
          term: "Batch-Watermark",
          q: "Wie verwendet Batch eine Watermark?",
          a: "Ein inkrementeller Job kann eine Quellposition speichern. Ein maximaler Zeitstempel allein kann verspätete oder korrigierte Zeilen auslassen; je nach Quelle braucht es ein definiertes Änderungstoken oder ein Überlappungsfenster mit deterministischer Deduplizierung.",
        },
      ],
    },
  ],
  preserve: ["Outbox"],
});
