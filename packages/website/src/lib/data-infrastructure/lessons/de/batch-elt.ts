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
      content: `Begrenzte Eingabe rein, begrenzte Ausgabe raus, dazwischen die Transformation. Mehr ist eine Batch-Pipeline nicht. Sie startet nach Zeitplan, auf ein Ereignis hin oder auf Zuruf.

Nimm Batch, wenn Freshness-Ziel, Quellschnittstelle und Wiederherstellungsmodell begrenzte Läufe zulassen. Nimm Streaming, wenn Consumer inkrementelle Ergebnisse oder kontinuierliche Zustandsänderungen brauchen und das zusätzliche Betriebsmodell diesen Preis wert ist. In beiden Fällen schreibst du Eingabegrenzen, Abhängigkeiten, Veröffentlichung, Wiederholungen und Vollständigkeitsevidenz auf.`,
    },
    {
      id: "s2",
      title: "ETL oder ELT",
      content: `**ETL** transformiert vor dem Laden ins Zielsystem. **ELT** landet zuerst und transformiert in der Zielplattform. Beide sind gültig.

ELT kann Replay verbessern. Aber nur, wenn die gelandete Eingabe unveränderlich, vollständig, aufbewahrt und unter passenden Kontrollen zugänglich ist. Transformationen rücken näher an analytisches Compute und werden per SQL zugänglich. Umsonst ist das nicht: Rohaufbewahrung kostet, Quelllöschungen und Schemaänderungen erschweren Replay, und sensible Daten dürfen möglicherweise gar nicht im Ziel liegen.

ETL kann Minimierung, Redaktion, Formatumwandlung oder Aggregation vor einer Security-Grenze erzwingen und die Ziellast senken. Die Grenze folgt aus Datenklassifizierung, Quelllimits, Aufbewahrung, benötigter Neuverarbeitung, Governance und gemessenen Kosten. Nicht aus einer Siegergeschichte.`,
    },
    {
      id: "s3",
      title: "dbt-Materialisierungen",
      content: `dbt verwaltet Transformationen und ihre Abhängigkeiten. In einem SQL-Modell deklariert \`{{ ref('upstream_model') }}\` eine vorgelagerte Relation und hängt sie in den DAG. Die Materialisierung bestimmt, als was ein Modell im Warehouse landet; exaktes SQL und unterstützte Strategien hängen am Adapter.

- **view**, erzeugt eine Sicht. Gespeichert werden nur Metadaten, die Abfragearbeit wandert zu den Readern.
- **table**, baut eine physische Relation. Ersatzverhalten, Atomarität und Grants unterscheiden sich nach Adapter und Konfiguration.
- **incremental**, verarbeitet nach dem ersten Build eine gewählte Teilmenge. Ein \`unique_key\` kann bei unterstützten Strategien Update- oder Merge-Verhalten auslösen, macht die Quellauswahl aber nicht korrekt.
- **ephemeral**, fügt SQL als CTE in nachgelagerte Modelle ein, ohne eine eigene Relation anzulegen.

Der naive Filter \`created_at > max(created_at)\` übersieht verspätete Eingänge und spätere Änderungen an älteren Datensätzen. Belastbarer sind ein Quell-Change-Token oder ein überlappend neu verarbeitetes Fenster mit deterministischer Deduplizierung:

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

Auch das ist ein Muster, keine Garantie. Bevor das Modell replay-sicher heißt, definierst du Null-Behandlung, doppelte Quellschlüssel, Löschung, Lookback-Größe, Transaktionsgrenze und Reconciliation.`,
    },
    {
      id: "s3b",
      title: "Inkrementelle Verarbeitung und SCD",
      content: `Zwei Strategien wenden inkrementelle Änderungen an:

- **MERGE (Upsert).** Quelle und Ziel auf einem deklarierten Schlüssel abgleichen, dann aktualisieren oder einfügen. Replay-sicher wird das mit eindeutigen deterministischen Quellzeilen, stabiler Merge-Logik, korrekter Löschbehandlung und atomarem Ziel-Commit. Adapter scannen dabei unterschiedlich viel Zieldaten.
- **Insert-Overwrite (Partitionsersetzung).** Eine vollständige Zielpartition oder ein Fenster neu berechnen und ersetzen. Dafür brauchst du vollständige deterministische Eingabe für diese Grenze und eine Engine-Operation, die den Ersatz atomar veröffentlicht.

Miss beide an Aktualisierungsverteilung, Partitionsausrichtung, Zielgröße, Konkurrenz und Engine-Verhalten.

**Slowly Changing Dimensions (SCD).**

- **Typ 1**, überschreibt das modellierte Attribut. Es zeigt den aktuellen Zustand und bewahrt den früheren Wert absichtlich nicht.
- **Typ 2**, schließt eine effektive Version und fügt eine weitere ein. As-of-Joins funktionieren, wenn Grenzen, verspätete Änderungen und Korrekturen richtig behandelt werden. Der Preis: mehr Zeilen, komplexere Joins.

Nimm Typ 2 nur für Attribute, deren Historie jemand wirklich abfragt. Die Kosten hängen an Änderungshäufigkeit, Zeilenbreite, Indizes und Abfragemuster, nicht an einem festen Multiplikator.`,
      keyTakeaway:
        "SCD Typ 1 eignet sich für Attribute des aktuellen Zustands, Typ 2 für definierte Consumer mit zeitlich gültiger Historie; keine Variante ist eine kursweite Vorgabe.",
    },
    {
      id: "s4",
      title: "DAG, Backfill und Wiederholung",
      content: `Das Diagramm verwendet eine deterministische synthetische Arbeitslast. Die Tage \`06\`, \`14\` und \`22\` bekommen feste Retry-Kosten. Es erklärt Scheduling und abnehmenden Parallelitätsnutzen, es schätzt keine Laufzeit und misst nichts.

Ein wiedereinspielbarer Batch-Job akzeptiert ein explizites Eingabefenster und veröffentlicht für dieselbe Eingabeversion deterministische Ausgabe. \`MERGE\`, Partitionsersetzung oder eine Transaktion können das tragen. Externe Seiteneffekte, nichtdeterministische Funktionen, verspätete Eingabe, Duplikate und parallele Live-Schreibvorgänge brauchen trotzdem eigene Behandlung und Reconciliation.`,
    },
    {
      id: "s5",
      title: "Orchestratoren",
      content: `Airflow, Dagster, Prefect und andere Orchestratoren bieten unterschiedliche Abstraktionen und Deployment-Modelle. Fähigkeiten ändern sich; vergleiche aktuelle Versionen mit deinen Anforderungen:

- Abhängigkeits- und Ereignissemantik;
- Retry-, Timeout-, Abbruch- und Backfill-Verhalten;
- Konkurrenz- und Ressourcensteuerung;
- Secret-Behandlung und Ausführungsisolation;
- Logs, Metriken, Lineage und Zuständigkeit;
- Deployment, Upgrade und Wiederherstellung;
- Integration mit der bestehenden Laufzeit.

Der Orchestrator plant Arbeit. Deterministisch, atomar oder vollständig macht er den Job darunter nicht.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Wiederholung und Replay.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- **ELT unterstützt Replay nur, wenn gelandete Eingabe vollständig, für den Zweck ausreichend unveränderlich, aufbewahrt und verwaltet ist.** ETL kann an einer Security- oder Minimierungsgrenze Pflicht sein.
- **Retry und Backfill sind getrennte Entwürfe.** Explizite Fenster, deterministische Quellversionen, atomare Veröffentlichung, idempotente externe Effekte und Reconciliation stehen jeweils für sich.
- **Materialisierung wählst du aus Lese- und Build-Kosten, Freshness, Atomarität und Adapterverhalten.** Der Name beweist davon nichts.
- **SCD Typ 1 oder Typ 2 ist eine Historienanforderung.** Versioniere nur für As-of-Analysen und lege verspätete Korrekturen fest.
- **MERGE oder Partitionsersetzung hängt an Schlüsseln, Partitionsausrichtung, Konkurrenz und Engine-Implementierung.** Prüfe den tatsächlichen Plan und das Fehlerverhalten.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Idempotent**, die Wiederholung eines Vorgangs mit derselben Identität und Eingabe hat keinen zusätzlichen beabsichtigten Effekt. Begrenze die Aussage auf enthaltenen Zustand und Seiteneffekte.
- **Inkrementelles Modell**, eine Materialisierung, die nach dem ersten Build eine ausgewählte Teilmenge verarbeitet. Auswahl und Merge-Strategie sind zwei Entscheidungen.
- **SLA / Freshness**, Vertrag oder Ziel zwischen Quelländerung und nutzbaren Zieldaten. Prüfe werkzeugspezifische Konfiguration gegen aktuelle Dokumentation.
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
        "Ein nächtlicher Job fügt die Bestellungen des Vortags in `fact_orders` ein. Er bricht nach der Hälfte ab. Nach der Wiederholung stehen dort doppelte Zeilen. Welcher Fehler steckt im Job?",
      options: [
        "Keiner; dieses Verhalten ist zu erwarten.",
        "Er verwendet `INSERT` statt `MERGE` oder eines Upserts mit `order_id` als Schlüssel. Der Job ist nicht idempotent.",
        "Es fehlt ein try/catch-Block.",
        "Es sind mehr Wiederholungsversuche nötig.",
      ],
      explanation:
        "Ein wiederholbarer Job muss idempotent sein: Zwei Läufe über dasselbe Fenster erzeugen dasselbe Ergebnis. `INSERT` hängt Zeilen an und dupliziert sie im zweiten Lauf. `MERGE` auf einem eindeutigen Schlüssel wie `order_id` aktualisiert vorhandene Zeilen und fügt nur fehlende hinzu. Hinter vielen unerklärlichen Duplikaten in Produktion steckt genau das.",
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
        "Eine aufbewahrte Landing Zone entkoppelt das Replay von Transformationen von der Verfügbarkeit der Quelle. Das gilt nur, wenn die Eingabe vollständig, für die Anforderung ausreichend versioniert, aufbewahrt, autorisiert und mit der korrigierten Logik kompatibel ist. Neuberechnung verbraucht weiterhin Compute und kann einen Abgleich nachgelagerter Systeme verlangen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Idempotenz",
          q: "Warum ist sie für Batch-Jobs entscheidend?",
          a: "Benenne, welche Ausgabe und welche externen Seiteneffekte unverändert bleiben, wenn dieselbe Vorgangsidentität und Eingabe erneut laufen. Ein Datenbankschreibvorgang kann idempotent sein, die Benachrichtigung oder der API-Aufruf daneben nicht.",
        },
        {
          term: "Inkrementelles Modell",
          q: "Wie setzt dbt es um?",
          a: "Mit {% if is_incremental() %} wählst du eine begrenzte Änderungsmenge aus und konfigurierst danach eine vom Adapter unterstützte Strategie. Ein Maximalzeitstempel kann verspätete Änderungen auslassen; ein Change Token oder eine Überlappung mit deterministischer Deduplizierung hält besser. Das Verhalten von unique_key hängt an Strategie und Adapter.",
        },
        {
          term: "SLA / Freshness",
          q: "Wie wird Freshness festgelegt?",
          a: "Als Ziel zwischen einer Quelländerung und nutzbaren Zieldaten. Monitoring-Konfiguration und Alarmverhalten sind werkzeug- und versionsabhängig und gehören in der eingesetzten Integration geprüft.",
        },
        {
          term: "Lineage",
          q: "Warum ist sie wichtig?",
          a: "Lineage grenzt ein, welche vorgelagerten Datasets und Jobs eine Ausgabe beeinflussen könnten. Automatisch erzeugte Graphen lassen dynamisches SQL, externe APIs und semantische Änderungen aus; Zuständigkeit und Laufbelege bleiben nötig.",
        },
        {
          term: "SCD Typ 1",
          q: "Wann ist dieser Typ geeignet?",
          a: "Die Zeile wird überschrieben, sobald sich ein Attribut ändert. Historie bleibt nicht erhalten. Das passt, wenn frühere Werte für die definierten Consumer keine Rolle spielen, etwa bei einer Korrektur oder einem aktuellen Kontaktwert.",
        },
        {
          term: "SCD Typ 2",
          q: "Wann ist dieser Typ geeignet?",
          a: "Bei einer Änderung wird die alte Zeile mit valid_to und is_current=false geschlossen und eine neue eingefügt. Damit verbindest du Fakten mit dem Dimensionsstand zur Ereigniszeit, sofern Grenzen und verspätete Korrekturen sauber behandelt sind. Jede Version kostet eine Zeile.",
        },
        {
          term: "MERGE oder Insert-Overwrite",
          q: "Welche Strategie ist idempotent?",
          a: "Beide tragen Replay, wenn Eingabe und Logik deterministisch sind und die Veröffentlichung atomar ist. MERGE braucht zusätzlich eindeutige Quellzeilen und stabile Match-Logik; Ersatz braucht eine vollständige Partitionsgrenze. Die Kosten hängen an Engine und Layout.",
        },
        {
          term: "Sensor",
          q: "Was bezeichnet der Begriff in Airflow?",
          a: "Ein Orchestrator-Mechanismus, der wartet oder deferiert, bis eine externe Bedingung beobachtet wurde. Polling-, Ereignis-, Timeout- und Ressourcenverhalten hängen an Werkzeug und Konfiguration.",
        },
      ],
    },
  ],
  preserve: ["ELT", "Lineage", "Sensor"],
});
