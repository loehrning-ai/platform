import canonical from "../batch-elt";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Batch-ELT und Orchestrierung",
  subtitle: "Airflow · dbt · idempotente Zusammenführungen",
  hook: "Begrenzte Jobs wiedereinspielbar, beobachtbar und bei Teilfehlern sicher machen.",
  keyConcepts: [
    "ELT",
    "dbt-Materialisierungen",
    "Idempotenz",
    "MERGE oder Insert-Overwrite",
    "SCD Typ 1 und 2",
    "Historischer Neuaufbau (Backfill)",
  ],
  sections: [
    {
      id: "s1",
      title: "Aufbau einer Batch-Pipeline",
      content: `Eine Batch-Pipeline nimmt eine begrenzte Eingabemenge, transformiert sie und veröffentlicht eine begrenzte Ausgabe. Sie kann nach Zeitplan, durch ein Ereignis oder auf Anforderung laufen.

Wähle Batch, wenn Freshness-Ziel, Quellschnittstelle und Wiederherstellungsmodell begrenzte Läufe erlauben. Wähle Streaming, wenn Consumer inkrementelle Ergebnisse oder kontinuierliche Zustandsänderungen benötigen und das zusätzliche Betriebsmodell gerechtfertigt ist. Definiere in beiden Fällen Eingabegrenzen, Abhängigkeiten, Veröffentlichung, Wiederholungen und Vollständigkeitsevidenz.`,
    },
    {
      id: "s2",
      title: "ETL oder ELT",
      content: `**ETL** transformiert vor dem Laden in das Zielsystem. **ELT** landet Daten vor der Transformation in der Zielplattform. Beide sind gültig.

ELT kann Replay verbessern, wenn die gelandete Eingabe unveränderlich, vollständig, aufbewahrt und unter passenden Kontrollen zugänglich ist. Transformationen können nahe an analytischem Compute liegen und über SQL-Werkzeuge zugänglich werden. Das ist nicht automatisch: Rohaufbewahrung kostet, Quelllöschungen und Schemaänderungen erschweren Replay und sensible Daten dürfen möglicherweise nicht im Ziel liegen.

ETL kann Minimierung, Redaktion, Formatumwandlung oder Aggregation vor einer Security-Grenze erzwingen und Ziellast reduzieren. Wähle die Grenze aus Datenklassifizierung, Quelllimits, Aufbewahrung, benötigter Neuverarbeitung, Governance und gemessenen Kosten, nicht aus einer Siegergeschichte.`,
    },
    {
      id: "s3",
      title: "dbt-Materialisierungen",
      content: `dbt ist ein Werkzeug zur Verwaltung von Transformationen und ihren Abhängigkeiten. In einem SQL-Modell deklariert \`{{ ref('upstream_model') }}\` eine vorgelagerte Relation und trägt zum DAG bei. Materialisierungen bestimmen die Darstellung eines Modells; exaktes SQL und unterstützte Strategien hängen vom Adapter ab.

- **view**, erzeugt eine Sicht. Speicherung beschränkt sich auf Metadaten, Abfragearbeit wird zu Readern verschoben.
- **table**, baut eine physische Relation. Ersatzverhalten, Atomarität und Grants unterscheiden sich nach Adapter und Konfiguration.
- **incremental**, verarbeitet nach dem ersten Build eine gewählte Teilmenge. Ein \`unique_key\` kann bei unterstützten Strategien Update-/Merge-Verhalten ermöglichen, macht die Quellauswahl aber nicht automatisch korrekt.
- **ephemeral**, fügt SQL als CTE in nachgelagerte Modelle ein und erzeugt keine eigenständige Relation.

Ein naiver \`created_at > max(created_at)\`-Filter übersieht verspätete Eingänge und spätere Änderungen älterer Datensätze. Sicherer ist ein Quell-Change-Token oder ein überlappend neu verarbeitetes Fenster mit deterministischer Deduplizierung:

\`\`\`sql
-- Adapter-specific interval syntax; validate for the target warehouse.
{{ config(materialized='incremental', unique_key='order_id') }}

select order_id, user_id, amount_usd, status, created_at, updated_at
from {{ ref('stg_orders') }}
{% if is_incremental() %}
  where updated_at >= (
    select max(updated_at) - interval '2 day' from {{ this }}
  )
{% endif %}
\`\`\`

Auch das ist ein Muster, keine Produktionsgarantie. Null-Behandlung, doppelte Quellschlüssel, Löschung, Lookback-Größe, Transaktionsgrenze und Reconciliation müssen definiert sein, bevor das Modell als replay-sicher gilt.`,
    },
    {
      id: "s3b",
      title: "Inkrementelle Verarbeitung und SCD",
      content: `Zwei verbreitete Strategien wenden inkrementelle Änderungen an:

- **MERGE (Upsert).** Quelle und Ziel auf einem deklarierten Schlüssel abgleichen und dann aktualisieren oder einfügen. Replay-Sicherheit benötigt eindeutige deterministische Quellzeilen, stabile Merge-Logik, korrekte Löschbehandlung und atomaren Ziel-Commit. Adapter können unterschiedlich viel Zieldaten scannen.
- **Insert-Overwrite (Partitionsersetzung).** Eine vollständige Zielpartition oder ein Fenster neu berechnen und ersetzen. Replay-Sicherheit benötigt vollständige deterministische Eingabe für diese Grenze und eine Engine-Operation, die den Ersatz atomar veröffentlicht.

Beide anhand von Aktualisierungsverteilung, Partitionsausrichtung, Zielgröße, Konkurrenz und Engine-Verhalten messen.

**Slowly Changing Dimensions (SCD).**

- **Typ 1**, überschreibt das modellierte Attribut. Es repräsentiert aktuellen Zustand und bewahrt den früheren modellierten Wert absichtlich nicht.
- **Typ 2**, schließt eine effektive Version und fügt eine weitere ein. As-of-Joins funktionieren, wenn Grenzen, verspätete Änderungen und Korrekturen richtig behandelt werden; Preis sind zusätzliche Zeilen und komplexere Joins.

Typ 2 nur für Attribute verwenden, deren historischer Zustand benötigt wird. Kosten hängen von Änderungshäufigkeit, Zeilenbreite, Indizes und Abfragemuster ab, nicht von einem festen Multiplikator.`,
      keyTakeaway:
        "SCD Typ 1 eignet sich für Attribute des aktuellen Zustands, Typ 2 für definierte Consumer mit zeitlich gültiger Historie; keine Variante ist eine kursweite Vorgabe.",
    },
    {
      id: "s4",
      title: "DAG, Backfill und Wiederholung",
      content: `Das Diagramm verwendet eine deterministische synthetische Arbeitslast. Die Tage \`06\`, \`14\` und \`22\` erhalten feste Retry-Kosten. Es erklärt Scheduling und abnehmenden Parallelitätsnutzen; es ist keine Laufzeitschätzung und kein Benchmark.

Ein wiedereinspielbarer Batch-Job akzeptiert ein explizites Eingabefenster und veröffentlicht für dieselbe Eingabeversion deterministische Ausgabe. \`MERGE\`, Partitionsersetzung oder eine Transaktion können das unterstützen. Externe Seiteneffekte, nichtdeterministische Funktionen, verspätete Eingabe, Duplikate und parallele Live-Schreibvorgänge benötigen trotzdem explizite Behandlung und Reconciliation.`,
    },
    {
      id: "s5",
      title: "Orchestratoren",
      content: `Airflow, Dagster, Prefect und andere Orchestratoren bieten unterschiedliche Abstraktionen und Deployment-Modelle. Fähigkeiten ändern sich; vergleiche aktuelle Versionen mit Anforderungen:

- Abhängigkeits- und Ereignissemantik;
- Retry-, Timeout-, Abbruch- und Backfill-Verhalten;
- Konkurrenz- und Ressourcensteuerung;
- Secret-Behandlung und Ausführungsisolation;
- Logs, Metriken, Lineage und Zuständigkeit;
- Deployment, Upgrade und Wiederherstellung;
- Integration mit der bestehenden Laufzeit.

Der Orchestrator plant Arbeit; er macht den zugrunde liegenden Job nicht deterministisch, atomar oder vollständig.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **ELT unterstützt Replay nur, wenn gelandete Eingabe vollständig, für den Zweck ausreichend unveränderlich, aufbewahrt und verwaltet ist.** ETL kann an einer Security- oder Minimierungsgrenze erforderlich sein.
- **Retry und Backfill getrennt entwerfen.** Explizite Fenster, deterministische Quellversionen, atomare Veröffentlichung, idempotente externe Effekte und Reconciliation sind eigene Anforderungen.
- **Materialisierung aus Lese- und Build-Kosten, Freshness, Atomarität und Adapterverhalten wählen.** Namen beweisen diese Eigenschaften nicht.
- **SCD Typ 1 oder Typ 2 ist eine Historienanforderung.** Versionierung nur für As-of-Analysen einsetzen und verspätete Korrekturen definieren.
- **MERGE oder Partitionsersetzung hängt von Schlüsseln, Partitionsausrichtung, Konkurrenz und Engine-Implementierung ab.** Tatsächlichen Plan und Fehlerverhalten testen.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Idempotent**, die Wiederholung eines Vorgangs mit derselben Identität und Eingabe hat keinen zusätzlichen beabsichtigten Effekt. Die Aussage auf enthaltenen Zustand und Seiteneffekte begrenzen.
- **Inkrementelles Modell**, eine Materialisierung, die nach dem ersten Build eine ausgewählte Teilmenge verarbeitet. Auswahl und Merge-Strategie sind getrennte Entscheidungen.
- **SLA / Freshness**, Vertrag oder Ziel zwischen Quelländerung und nutzbaren Zieldaten. Werkzeugspezifische Konfiguration gegen aktuelle Dokumentation prüfen.
- **Lineage**, erfasste Beziehungen zwischen Jobs, Datasets und Feldern. Automatische Extraktion bleibt bei dynamischen oder externen Abhängigkeiten unvollständig.
- **SCD Typ 1**, ersetzt ein modelliertes Attribut und verwirft frühere modellierte Werte.
- **SCD Typ 2**, erfasst zeitlich gültige Versionen für As-of-Analysen.
- **MERGE oder Insert-Overwrite**, schlüsselbasierte Änderungsanwendung gegenüber Ersatz einer vollständigen Grenze; beide brauchen deterministische Eingabe und atomare Veröffentlichung für Replay.
- **Sensor**, ein Orchestrator-Mechanismus, der wartet oder deferiert, bis eine externe Bedingung beobachtet wurde; Polling- und Ereignissemantik variieren.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Der Alarm um 3 Uhr",
      question:
        "Ein nächtlicher Job fügt die Bestellungen des Vortags in `fact_orders` ein. Er bricht nach der Hälfte ab. Nach der Wiederholung entstehen doppelte Zeilen. Welcher Fehler steckt im Job?",
      options: [
        "Keiner; dieses Verhalten ist zu erwarten.",
        "Er verwendet `INSERT` statt `MERGE` oder eines Upserts mit `order_id` als Schlüssel. Der Job ist nicht idempotent.",
        "Es fehlt ein try/catch-Block.",
        "Es sind mehr Wiederholungsversuche nötig.",
      ],
      explanation:
        "Ein wiederholbarer Job muss idempotent sein: Zwei Läufe über dasselbe Fenster erzeugen dasselbe Ergebnis. `INSERT` hängt Zeilen an und dupliziert sie beim zweiten Lauf. `MERGE` auf einem eindeutigen Schlüssel wie `order_id` aktualisiert vorhandene Zeilen und fügt nur fehlende hinzu. Viele Produktionsfehler mit unerklärlichen Duplikaten gehen auf fehlende Idempotenz zurück.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Wann ELT Replay unterstützt",
      question:
        "Ein Team bewertet ELT für Daten, die historisch neu verarbeitet werden könnten. Welcher Vorteil gilt nur, wenn die Landing Zone vollständige, kontrollierte Eingaben aufbewahrt?",
      options: [
        "SQL ist einfacher als Python.",
        "Aufbewahrte gelandete Eingaben können korrigierte Transformationen die Historie ohne weitere Quellabfrage neu verarbeiten lassen.",
        "Snowflake ist schneller.",
        "ELT ist die neuere Vorgehensweise.",
      ],
      explanation:
        "Eine aufbewahrte Landing Zone kann das Replay von Transformationen von der Verfügbarkeit der Quelle entkoppeln. Das gilt nur, wenn die Eingabe vollständig, für die Anforderung ausreichend versioniert, aufbewahrt, autorisiert und mit der korrigierten Logik kompatibel ist. Neuberechnung verbraucht weiterhin Compute und kann einen Abgleich nachgelagerter Systeme verlangen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Idempotenz",
          q: "Warum ist sie für Batch-Jobs entscheidend?",
          a: "Benenne, welche Ausgabe und externen Seiteneffekte unverändert bleiben, wenn dieselbe Vorgangsidentität und Eingabe wiederholt werden. Ein Datenbankschreibvorgang kann idempotent sein, während eine Benachrichtigung oder ein API-Aufruf es nicht ist.",
        },
        {
          term: "Inkrementelles Modell",
          q: "Wie setzt dbt es um?",
          a: "Mit {% if is_incremental() %} wird eine begrenzte Änderungsmenge ausgewählt und danach eine vom Adapter unterstützte Strategie konfiguriert. Ein Maximalzeitstempel kann verspätete Änderungen auslassen; ein Change Token oder eine Überlappung mit deterministischer Deduplizierung ist belastbarer. Das Verhalten von unique_key hängt von Strategie und Adapter ab.",
        },
        {
          term: "SLA / Freshness",
          q: "Wie wird Freshness festgelegt?",
          a: "Als Ziel zwischen einer Quelländerung und nutzbaren Zieldaten. Monitoring-Konfiguration und Alarmverhalten sind werkzeug- und versionsabhängig und müssen in der eingesetzten Integration geprüft werden.",
        },
        {
          term: "Lineage",
          q: "Warum ist sie wichtig?",
          a: "Lineage grenzt ein, welche vorgelagerten Datasets und Jobs eine Ausgabe beeinflussen könnten. Automatisch erzeugte Graphen können dynamisches SQL, externe APIs und semantische Änderungen auslassen; Zuständigkeit und Laufbelege bleiben notwendig.",
        },
        {
          term: "SCD Typ 1",
          q: "Wann ist dieser Typ geeignet?",
          a: "Die Zeile wird überschrieben, wenn sich ein Attribut ändert. Historie bleibt nicht erhalten. Das passt, wenn frühere Werte für die definierten Consumer keine Rolle spielen, etwa bei einer Korrektur oder einem aktuellen Kontaktwert.",
        },
        {
          term: "SCD Typ 2",
          q: "Wann ist dieser Typ geeignet?",
          a: "Bei einer Änderung wird die alte Zeile mit valid_to und is_current=false geschlossen und eine neue eingefügt. Damit lassen sich Fakten mit dem zur Ereigniszeit gültigen Dimensionsstand verbinden, wenn Grenzen und verspätete Korrekturen korrekt behandelt werden. Jede Version benötigt eine eigene Zeile.",
        },
        {
          term: "MERGE oder Insert-Overwrite",
          q: "Welche Strategie ist idempotent?",
          a: "Beide können Replay unterstützen, wenn Eingabe und Logik deterministisch sind und die Veröffentlichung atomar ist. MERGE benötigt zusätzlich eindeutige Quellzeilen und stabile Match-Logik; Ersatz benötigt eine vollständige Partitionsgrenze. Kosten hängen von Engine und Layout ab.",
        },
        {
          term: "Sensor",
          q: "Was bezeichnet der Begriff in Airflow?",
          a: "Ein Orchestrator-Mechanismus, der wartet oder deferiert, bis eine externe Bedingung beobachtet wurde. Polling-, Ereignis-, Timeout- und Ressourcenverhalten hängen von Werkzeug und Konfiguration ab.",
        },
      ],
    },
  ],
  preserve: ["ELT", "Lineage", "Sensor"],
});
