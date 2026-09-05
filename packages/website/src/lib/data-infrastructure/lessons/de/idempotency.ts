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
      content: `Eine Messaging-Garantie ohne benannte Grenze und ohne Fehlermodell sagt nichts. Drei Varianten.

- **At-most-once.** Das Protokoll kann einen Effekt nach einem unklaren Fehler auslassen und vermeidet innerhalb seines Geltungsbereichs eine Wiederholung.
- **At-least-once.** Arbeit kann erneut versucht oder abgespielt werden. Ohne Kontrolle im Consumer entstehen doppelte Effekte. Jede Aussage über Datenverlust bleibt an Haltbarkeit und Aufbewahrung der Quelle gebunden.
- **Exactly-once.** Der bestätigte Zustand innerhalb eines definierten Pfads aus Quelle, Verarbeitung und Ziel wirkt so, als hätte jede Eingabe ihn einmal beeinflusst. Implementierungen nutzen Transaktionen, Checkpoints, koordinierte Offsets oder idempotente Effekte.

Idempotenz ist ein starker Mechanismus, aber keine allgemeingültige Übersetzung von Exactly-once. Eine Kafka-zu-Kafka-Transaktion kann Ausgabe und konsumierte Offsets bei passender Konfiguration atomar bestätigen. Ein HTTP-Aufruf an einen Zahlungsdienst braucht beim Anbieter einen stabilen Idempotenzvertrag, eine Aufbewahrung der Anfrageidentität und einen Abgleich unklarer Ergebnisse.`,
      keyTakeaway:
        "Eine Exactly-once-Aussage ist ohne Quelle, Zustand, Ziel, Konfiguration und Fehlergrenze unvollständig.",
    },
    {
      id: "s2",
      title: "Muster für Idempotenz",
      content: `Drei Muster machen einen abgegrenzten Effekt bei Wiederholung sicher, sofern ihre Voraussetzungen halten:

**01 · UPSERT nach Schlüssel.** Die Quelle braucht je Schlüssel eine deterministische Gewinnerzeile. Ein älteres Ereignis darf neueren Zustand nicht überschreiben.

\`\`\`sql
MERGE INTO fact_orders dst
USING new_orders src
  ON dst.order_id = src.order_id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
\`\`\`

**02 · Fenster ersetzen.** Die Transaktion oder der Commit des Tabellenformats veröffentlicht einen vollständigen, deterministischen Ersatz für das Fenster. Ein externer Leser darf das Löschen nie ohne das Einfügen sehen.

\`\`\`sql
BEGIN;
DELETE FROM agg_daily WHERE day = '2026-04-15';
INSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';
COMMIT;
\`\`\`

**03 · Nach Ereignisidentität deduplizieren.** Der Producer liefert eine stabile Identität für das logische Ereignis. Das Ziel setzt die Eindeutigkeit mindestens über den Wiederholungshorizont durch.

\`\`\`sql
INSERT INTO sink (event_id, ...)
VALUES (...)
ON CONFLICT (event_id) DO NOTHING;
\`\`\`

Unabhängige API-Aufrufe, Benachrichtigungen, Dateien und nicht deterministische Transformationen werden von keinem dieser Muster idempotent.`,
    },
    {
      id: "s3",
      title: "Backfills richtig entwerfen",
      content: `Ein Backfill verarbeitet historische Eingaben nach einer Logikänderung, Datenkorrektur oder Schemaergänzung erneut. Vor der Ausführung stehen sechs Festlegungen. (1) ein explizites Eingabefenster und eine unveränderliche Quellversion, (2) die Identität des Vorgangs und die Regel für doppelte Effekte, (3) Abhängigkeiten zwischen benachbarten Fenstern, (4) die Wechselwirkung mit laufenden Schreibvorgängen, (5) Ausgabeprüfung und Rückabwicklung sowie (6) Ressourcen- und Ratenbegrenzungen.

Parallele und wiederholte Fenster sind nur sicher, wenn die angegebenen Invarianten des Jobs ihre Vertauschbarkeit belegen. Sonst laufen sie seriell, oder du isolierst ihre Ausgaben und gleichst vor der Freigabe ab.`,
    },
    {
      id: "s4",
      title: "Exactly-once in Kafka",
      content: `Kafka liefert Bausteine für einen abgegrenzten transaktionalen Pfad aus Lesen, Verarbeiten und Schreiben:

1. **Idempotente Produktion.** Producer-Sequenznummern erlauben Brokern, zulässige Wiederholungen innerhalb des Producer-Protokolls und der zugehörigen Konfiguration zu deduplizieren.
2. **Transaktionen über Kafka-Partitionen.** Ein transaktionaler Producer bestätigt oder verwirft Datensätze atomar. Für \`read_committed\` konfigurierte Consumer blenden verworfene Transaktionsdatensätze aus.
3. **Konsumierte Offsets in der Ausgabetransaktion.** Die Anwendung bestätigt konsumierte Offsets zusammen mit erzeugten Datensätzen. Sichtbare Kafka-Ausgabe und Fortschritt rücken damit gemeinsam vor.

So bekommt eine Anwendung für Kafka-Eingabe und Kafka-Ausgabe Exactly-once-Verarbeitung, solange sie das Transaktionsprotokoll einhält und Broker- sowie Consumer-Einstellungen mitspielen. Eine Quelle vor Kafka oder ein Ziel außerhalb von Kafka steckt darin nicht.

Flink trennt Exactly-once für verwalteten Zustand von End-to-End-Ausgabe. Seine offizielle Dokumentation zur Fehlertoleranz verlangt für End-to-End-Exactly-once wiederholbare Quellen und transaktionale oder idempotente Ziele. Die Garantien unterscheiden sich je Connector und Version. Bau dir eine Matrix aus konkreter Quelle, Zustand, Ziel und Konfiguration. Und injiziere dann Fehler vor und nach jeder Commit-Grenze.`,
    },
    {
      id: "s4b",
      title: "Dead-Letter Queues",
      content: `Ein **Dead-Letter-Pfad** nimmt Datensätze auf, die unter dem aktuellen Vertrag nicht verarbeitet werden können. Er bewahrt Fehlerbelege, ohne alle gültigen Datensätze zu blockieren. Er verändert aber Vollständigkeit und Reihenfolge und gehört damit zur Verarbeitungsgarantie.

Speichere nur das Notwendige, also eine geschützte Referenz oder verschlüsselte Nutzlast, einen sicheren Fehlercode, Quellidentität und -position, Schemaversion, Zeitpunkt des ersten Auftretens, Anzahl der Versuche und Zuständigkeit. Ein Rohdatensatz oder Ausnahmebericht kann personenbezogene Daten, Zugangsdaten oder interne Details enthalten. Zugriffskontrolle, Minimierung, Aufbewahrung und Schwärzung ersetzen blindes Kopieren.

Der Entwurf legt fest, welche Fehler erneut versucht und welche isoliert werden, ob ein Datensatz die Reihenfolge umgehen darf, wie Wiederholungen autorisiert werden und wie reparierte Ausgabe abgeglichen wird. Alarmschwellen folgen der erwarteten Rate ungültiger Eingaben und der Wirkung auf Nutzer. Datenverkehr ungleich null ist noch kein Vorfall.`,
      keyTakeaway:
        "Eine DLQ behebt den Fehler nicht. Sie macht ihn sichtbar und wiederherstellbar statt unsichtbar und endgültig.",
    },
    {
      id: "s5",
      title: "Schemaentwicklung",
      content: `Schema Registries bieten meist die Kompatibilitätsmodi **backward**, **forward** und **full**. Was genau sie bedeuten, hängt an Serialisierungsformat, transitiver Einstellung, Subject-Strategie und Registry-Implementierung. Ein syntaktisch kompatibles Schema bricht die Fachlogik trotzdem.

Die Kompatibilität folgt aus Auslieferungsreihenfolge, Anforderungen an erneutes Lesen, Aufbewahrung und Vielfalt der Consumer. Teste alte Daten mit neuen Readern, neue Daten bei Bedarf mit unterstützten alten Readern. Ein strikter Modus verhindert einige inkompatible Registrierungen. Historische neue Felder befüllt er nicht, Semantik prüft er nicht, und die Auslieferung nachgelagerter Systeme koordiniert er erst recht nicht allein.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Garantien und Backfills.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Idempotenzschlüssel**, eine stabile Identität für einen logischen Vorgang. Aufbewahrung auf dem Server, Parameterabgleich, gleichzeitige Anfragen, erneute Ausgabe der Antwort und Ablauf bestimmen den tatsächlichen Vertrag.
- **Zwei-Phasen-Commit**, koordiniert Vorbereitung und Bestätigung über teilnehmende Ressourcen. Das Verfahren bietet ein bestimmtes Atomaritätsmodell mit Kosten für Verfügbarkeit und Wiederherstellung; die Unterstützung unterscheidet sich.
- **Outbox**, bestätigt Fachzustand und eine Outbox-Zeile in einer Datenbanktransaktion und veröffentlicht danach asynchron mit Wiederholung und Deduplizierung.
- **Aktiver Backfill**, überschneidet sich mit laufenden Schreibvorgängen und braucht deshalb Konfliktregeln, Ressourcenisolierung, Reihenfolge und Abgleich, nicht nur Idempotenz auf Zeilenebene.
- **Batch-Watermark**, eine gespeicherte Quellposition für inkrementelle Auswahl. Zeitstempel allein lassen verspätete oder korrigierte Daten aus; Token und Überlappungsregel folgen der Semantik der Quelle.`,
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
        "Exactly-once kann eine gültige Eigenschaft der bestätigten Ausgabe innerhalb eines abgegrenzten Systems sein. Die Aussage bleibt unvollständig, bis Quelle, Verarbeitungszustand, Ziel, Transaktions- oder Idempotenzmechanismus, Konfiguration und erfasste Fehler benannt sind. Externe APIs und andere nicht teilnehmende Effekte brauchen eigene Verträge und eigenen Abgleich.",
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
        "Ein explizites Fenster ist notwendig und reicht nicht. Historische Eingaben ändern sich, benachbarte Fenster teilen Zustand, laufende Schreibvorgänge kollidieren, und externe Effekte entgehen der Rückabwicklung. Halte Eingaben und Code fest, prüfe die Invarianten, veröffentliche Ausgaben atomar und behalte einen Wiederherstellungspfad.",
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
          a: "2PC koordiniert Vorbereitung und Bestätigung über teilnehmende Ressourcen. Es liefert Atomarität und kostet Koordinations- und Wiederherstellungskomplexität. Eine Outbox ist die Alternative für einen Ablauf aus Datenbank und Nachricht, kein allgemeiner Ersatz.",
        },
        {
          term: "Outbox",
          q: "Warum ist sie häufig besser als 2PC?",
          a: "Eine Datenbanktransaktion schreibt Fachzustand und Outbox-Zeile. Ein Publisher liefert die Outbox asynchron mit Wiederholungen aus. Damit verschwindet der Dual Write auf Anwendungsebene, Deduplizierung, Aufbewahrung und Überwachung bleiben.",
        },
        {
          term: "Aktiver Backfill",
          q: "Wann ist er vertretbar?",
          a: "Berühren Backfill-Läufe dieselben Partitionen wie laufende Schreibvorgänge, drohen Sperr- oder Versionskonflikte. Kalte Backfills laufen außerhalb der Hauptlast. Aktive Backfills brauchen Idempotenz auf Zeilenebene und einen Abgleich gleichzeitiger Änderungen.",
        },
        {
          term: "Batch-Watermark",
          q: "Wie verwendet Batch eine Watermark?",
          a: "Ein inkrementeller Job kann eine Quellposition speichern. Ein maximaler Zeitstempel allein lässt verspätete oder korrigierte Zeilen aus; je nach Quelle braucht es ein definiertes Änderungstoken oder ein Überlappungsfenster mit deterministischer Deduplizierung.",
        },
      ],
    },
  ],
  preserve: ["Outbox"],
});
