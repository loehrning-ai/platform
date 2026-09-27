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
      content: `Eine Zustellgarantie braucht eine benannte Grenze und ein Fehlermodell:

- **At-most-once** kann nach einem unklaren Fehler einen Effekt auslassen.
- **At-least-once** kann Effekte verdoppeln, solange der Consumer sie nicht kontrolliert; jede Aussage über Verlust hängt weiter an Haltbarkeit und Aufbewahrung der Quelle.
- **Exactly-once** heißt, der bestätigte Zustand auf einem definierten Pfad aus Quelle, Verarbeitung und Ziel wirkt, als hätte jede Eingabe ihn einmal beeinflusst, umgesetzt über Transaktionen, Checkpoints, koordinierte Offsets oder idempotente Effekte.

Idempotenz ist einer dieser Mechanismen. Ein HTTP-Aufruf an einen Zahlungsdienst etwa braucht den Idempotenzvertrag des Anbieters, aufbewahrte Anfrageidentitäten und einen Abgleich unklarer Ergebnisse.`,
    },
    {
      id: "s2",
      title: "Muster für Idempotenz",
      content: `Drei Muster machen einen abgegrenzten Effekt bei Wiederholung sicher, sofern ihre Voraussetzungen halten:

**01 · UPSERT nach Schlüssel.** Die Quelle braucht je Schlüssel eine deterministische Gewinnerzeile, und ältere Ereignisse dürfen neueren Zustand nicht überschreiben.

\`\`\`sql
MERGE INTO fact_orders dst
USING new_orders src
  ON dst.order_id = src.order_id
WHEN MATCHED THEN UPDATE SET ...
WHEN NOT MATCHED THEN INSERT ...
\`\`\`

**02 · Fenster ersetzen.** Eine Transaktion oder ein Tabellen-Commit veröffentlicht einen vollständigen, deterministischen Ersatz; Leser sehen das Löschen nie ohne das Einfügen.

\`\`\`sql
BEGIN;
DELETE FROM agg_daily WHERE day = '2026-04-15';
INSERT INTO agg_daily SELECT ... WHERE day = '2026-04-15';
COMMIT;
\`\`\`

**03 · Nach Ereignisidentität deduplizieren.** Der Producer liefert eine stabile Ereignisidentität, und das Ziel erzwingt Eindeutigkeit mindestens über den Wiederholungshorizont.

\`\`\`sql
INSERT INTO sink (event_id, ...)
VALUES (...)
ON CONFLICT (event_id) DO NOTHING;
\`\`\`

API-Aufrufe, Benachrichtigungen, Dateien und nicht deterministische Transformationen macht keines davon idempotent.`,
    },
    {
      id: "s3",
      title: "Backfills richtig entwerfen",
      content: `Ein Backfill verarbeitet historische Eingaben nach einer Logikänderung, Datenkorrektur oder Schemaergänzung erneut. Vor der Ausführung legst du fest:

1. Eingabefenster und unveränderliche Quellversion
2. Vorgangsidentität und Regel für doppelte Effekte
3. Abhängigkeiten zwischen benachbarten Fenstern
4. Wechselwirkung mit laufenden Schreibvorgängen
5. Ausgabeprüfung und Rückabwicklung
6. Ressourcen- und Ratenlimits

Fenster laufen nur parallel oder wiederholt, wenn die Invarianten des Jobs ihre Vertauschbarkeit belegen. Sonst laufen sie seriell, oder du isolierst die Ausgabe und gleichst vor der Freigabe ab.`,
    },
    {
      id: "s4",
      title: "Exactly-once in Kafka",
      content: `Kafka liefert drei Bausteine für einen transaktionalen Pfad aus Lesen, Verarbeiten und Schreiben:

1. **Idempotente Produktion.** Producer-Sequenznummern lassen Broker zulässige Wiederholungen deduplizieren.
2. **Transaktionen über Partitionen.** Ein transaktionaler Producer bestätigt oder verwirft Datensätze atomar; \`read_committed\`-Consumer blenden verworfene Datensätze aus.
3. **Offsets in der Ausgabetransaktion.** Konsumierte Offsets werden mit den erzeugten Datensätzen bestätigt, also rücken Ausgabe und Fortschritt gemeinsam vor.

Zusammen ergibt das Exactly-once von Kafka-Eingabe bis Kafka-Ausgabe, wenn die Anwendung das Protokoll einhält; Quellen vor Kafka und Ziele außerhalb davon sind nicht abgedeckt.

Flink trennt Exactly-once für verwalteten Zustand von End-to-End-Ausgabe, die wiederholbare Quellen und transaktionale oder idempotente Ziele braucht. Garantien unterscheiden sich je Connector und Version, also baust du eine Matrix aus Quelle, Zustand, Ziel und Konfiguration und injizierst Fehler um jede Commit-Grenze.`,
    },
    {
      id: "s4b",
      title: "Dead-Letter Queues",
      content: `Ein **Dead-Letter-Pfad** hält Datensätze, die der aktuelle Vertrag nicht verarbeiten kann, ohne gültige zu blockieren. Er verändert Vollständigkeit und Reihenfolge und gehört damit zur Verarbeitungsgarantie.

Speichere nur eine geschützte Referenz oder verschlüsselte Nutzlast, einen sicheren Fehlercode, Quellidentität und -position, Schemaversion, Zeitpunkt des ersten Auftretens, Anzahl der Versuche und Zuständigkeit. Rohdatensätze und Ausnahmeberichte können personenbezogene Daten, Zugangsdaten oder interne Details enthalten, also gelten Zugriffskontrolle, Minimierung, Aufbewahrung und Schwärzung.

Leg fest, welche Fehler wiederholt oder isoliert werden, ob ein Datensatz die Reihenfolge umgehen darf, wer Wiederholungen freigibt und wie reparierte Ausgabe abgeglichen wird. Alarmschwellen folgen der erwarteten Rate ungültiger Eingaben und der Wirkung auf Nutzer.`,
    },
    {
      id: "s5",
      title: "Schemaentwicklung",
      content: `Schema Registries bieten die Kompatibilitätsmodi **backward**, **forward** und **full**. Ihre genaue Bedeutung hängt an Format, transitiver Einstellung, Subject-Strategie und Registry, und ein kompatibles Schema kann die Fachlogik trotzdem brechen.

Wähle den Modus nach Auslieferungsreihenfolge, Replay-Bedarf, Aufbewahrung und Vielfalt der Consumer. Teste alte Daten mit neuen Readern und neue Daten mit den alten Readern, die du unterstützt. Ein strikter Modus blockiert einige inkompatible Registrierungen; neue Felder historisch befüllen, Semantik prüfen oder nachgelagerte Rollouts koordinieren kann er nicht.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Garantien und Backfills.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Idempotenzschlüssel**, eine stabile Identität für einen logischen Vorgang.
- **Zwei-Phasen-Commit**, koordiniert Vorbereitung und Bestätigung über teilnehmende Ressourcen.
- **Outbox**, Fachzustand und Outbox-Zeile in einer Transaktion, asynchron veröffentlicht.
- **Aktiver Backfill**, ein Backfill, der sich mit laufenden Schreibvorgängen überschneidet.
- **Batch-Watermark**, eine gespeicherte Quellposition für inkrementelle Auswahl.`,
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
        "„Welche Quelle, Zustand, Ziel, Konfiguration, Fehler und Seiteneffekte deckt sie ab?“",
        "„Unterstützt das System TLS?“",
        "„Wie unterscheidet sich das von At-most-once?“",
      ],
      explanation:
        "Exactly-once gilt nur innerhalb benannter Quelle, Zustand, Ziel, Mechanismus, Konfiguration und Fehlermenge. Externe APIs und andere Effekte außerhalb davon brauchen eigene Verträge und eigenen Abgleich.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Backfill-Entwurf",
      question:
        "Ein täglicher Job verarbeitet „die Daten von gestern“. Ein Fehler betrifft die letzten 90 Tage. Was änderst du vor dem Backfill?",
      options: [
        "Den Job einfach 90-mal ausführen.",
        "Fenster parametrisieren, Quelle festhalten, Wiederholung testen, Schreiblast isolieren, Rückabwicklung planen.",
        "Einen Snapshot wiederherstellen.",
        "Mehr Protokollierung ergänzen.",
      ],
      explanation:
        "Ein Datumsparameter allein reicht nicht: Historische Eingaben ändern sich, benachbarte Fenster teilen Zustand, laufende Schreibvorgänge kollidieren und externe Effekte entgehen der Rückabwicklung. Halte Eingaben und Code fest, veröffentliche atomar und gleiche die Ausgabe ab.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Idempotenzschlüssel",
          q: "Wie setzen APIs ihn ein?",
          a: "Der Client sendet eine stabile Vorgangsidentität. Der Server definiert Parameterabgleich, gleichzeitige Anfragen, Aufbewahrung, Ablauf und ob er die Antwort erneut ausgibt.",
        },
        {
          term: "Zwei-Phasen-Commit",
          q: "Wann wird er eingesetzt und warum ist er schwierig?",
          a: "2PC liefert Atomarität über teilnehmende Ressourcen und kostet Verfügbarkeit, Koordination und Wiederherstellungsaufwand; die Unterstützung variiert. Für Abläufe aus Datenbank und Nachricht ist die Outbox die übliche Alternative.",
        },
        {
          term: "Outbox",
          q: "Warum ist sie häufig besser als 2PC?",
          a: "Eine Datenbanktransaktion schreibt Zustand und Outbox-Zeile; ein Publisher liefert die Zeile mit Wiederholungen aus. Der Dual Write entfällt, Deduplizierung, Aufbewahrung und Überwachung bleiben.",
        },
        {
          term: "Aktiver Backfill",
          q: "Wann ist er vertretbar?",
          a: "Berührt ein Backfill Partitionen mit laufenden Schreibvorgängen, folgen Sperr- und Versionskonflikte. Kalte Backfills laufen außerhalb der Hauptlast; aktive brauchen Konfliktregeln, Ressourcenisolierung, Idempotenz auf Zeilenebene und Abgleich.",
        },
        {
          term: "Batch-Watermark",
          q: "Wie verwendet Batch eine Watermark?",
          a: "Ein inkrementeller Job speichert eine Quellposition. Ein maximaler Zeitstempel übersieht verspätete oder korrigierte Zeilen; nimm ein Änderungstoken oder ein Überlappungsfenster mit deterministischer Deduplizierung.",
        },
      ],
    },
  ],
  preserve: ["Outbox"],
});
