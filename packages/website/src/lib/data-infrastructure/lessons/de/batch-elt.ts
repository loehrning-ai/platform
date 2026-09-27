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
      content: `Eine Batch-Pipeline macht aus einer begrenzten Eingabe eine begrenzte Ausgabe, nach Zeitplan, auf ein Ereignis hin oder auf Abruf.

Nimm Batch, wenn Freshness-Ziel, Quellschnittstelle und Wiederherstellungsmodell begrenzte Läufe zulassen. Nimm Streaming, wenn Consumer inkrementelle Ergebnisse oder laufenden Zustand brauchen und sich der zusätzliche Betrieb lohnt. In beiden Fällen legst du Eingabegrenzen, Abhängigkeiten, Veröffentlichung, Wiederholungen und Vollständigkeitsnachweise fest.`,
    },
    {
      id: "s2",
      title: "ETL oder ELT",
      content: `**ETL** transformiert vor dem Laden ins Ziel, **ELT** landet zuerst und transformiert in der Zielplattform.

ELT hilft beim Replay nur, wenn die gelandete Eingabe unveränderlich, vollständig, aufbewahrt und unter passenden Kontrollen zugänglich ist. Außerdem rücken Transformationen an analytisches Compute und SQL-Werkzeuge heran. Rohaufbewahrung kostet Geld, Quelllöschungen und Schemaänderungen erschweren Replay, und sensible Daten dürfen vielleicht gar nicht ins Ziel.

ETL erzwingt Minimierung, Schwärzung, Formatumwandlung oder Aggregation, bevor Daten eine Security-Grenze passieren, und senkt die Ziellast. Die Grenze legst du nach Datenklassifizierung, Quelllimits, Aufbewahrung, Neuverarbeitungsbedarf, Governance und gemessenen Kosten fest.`,
    },
    {
      id: "s3",
      title: "dbt-Materialisierungen",
      content: `dbt verwaltet Transformationen und ihre Abhängigkeiten. In einem SQL-Modell deklariert \`{{ ref('upstream_model') }}\` eine vorgelagerte Relation und hängt sie in den DAG. Die Materialisierung bestimmt, wie ein Modell gespeichert wird; exaktes SQL und Strategien hängen am Adapter.

- **view**, erzeugt eine Sicht. Gespeichert werden nur Metadaten, die Abfragearbeit leisten die Reader.
- **table**, baut eine physische Relation; Ersatzverhalten, Atomarität und Grants hängen am Adapter.
- **incremental**, verarbeitet nach dem ersten Build eine gewählte Teilmenge. Ein \`unique_key\` kann Merge-Verhalten auslösen, macht die Quellauswahl aber nicht korrekt.
- **ephemeral**, fügt SQL als CTE in nachgelagerte Modelle ein, ohne eigene Relation.

Der naive Filter \`created_at > max(created_at)\` übersieht verspätete Eingänge und spätere Änderungen an älteren Datensätzen. Nimm ein Quell-Change-Token oder verarbeite ein überlappendes Fenster neu und dedupliziere dann deterministisch:

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

Bevor das Modell replay-sicher heißt, legst du Null-Behandlung, doppelte Quellschlüssel, Löscherfassung, Lookback-Größe, Transaktionsgrenze und Reconciliation fest.`,
    },
    {
      id: "s3b",
      title: "Inkrementelle Verarbeitung und SCD",
      content: `- **MERGE (Upsert).** Quelle und Ziel auf einem deklarierten Schlüssel abgleichen, dann aktualisieren oder einfügen. Replay-sicher ist das nur mit eindeutigen, deterministischen Quellzeilen, stabiler Merge-Logik, korrekten Löschungen und atomarem Commit. Adapter scannen dabei unterschiedlich viel Zieldaten.
- **Insert-Overwrite (Partitionsersetzung).** Eine vollständige Partition oder ein Fenster neu berechnen und ersetzen. Das braucht vollständige, deterministische Eingabe für diese Grenze und einen atomaren Ersatz.

Miss beide an Aktualisierungsverteilung, Partitionsausrichtung, Zielgröße, Konkurrenz und Engine-Verhalten.

**Slowly Changing Dimensions (SCD).**

- **Typ 1** überschreibt das Attribut. Er hält den aktuellen Zustand und verwirft den früheren Wert absichtlich.
- **Typ 2** schließt eine zeitlich gültige Version und fügt die nächste ein. As-of-Joins funktionieren, wenn Grenzen, verspätete Änderungen und Korrekturen behandelt sind; der Preis sind mehr Zeilen und schwierigere Joins.

Nimm Typ 2 nur für Attribute, deren Historie jemand braucht. Die Kosten hängen an Änderungshäufigkeit, Zeilenbreite, Indizes und Abfragemuster.`,
    },
    {
      id: "s4",
      title: "DAG, Backfill und Wiederholung",
      content: `Das Diagramm rechnet eine deterministische synthetische Arbeitslast über 30 Tage mit 1, 4 und 10 Workern; die Tage \`06\`, \`14\` und \`22\` bekommen feste Retry-Kosten. Es zeigt Scheduling und abnehmenden Parallelitätsnutzen und schätzt keine Laufzeit.

Ein wiedereinspielbarer Batch-Job nimmt ein explizites Eingabefenster und veröffentlicht für dieselbe Eingabeversion deterministische Ausgabe, gestützt durch \`MERGE\`, Partitionsersetzung oder eine Transaktion. Externe Seiteneffekte, nichtdeterministische Funktionen, verspätete Eingabe, Duplikate und parallele Live-Schreibvorgänge brauchen trotzdem eigene Behandlung und Reconciliation.`,
    },
    {
      id: "s5",
      title: "Orchestratoren",
      content: `Airflow, Dagster, Prefect und andere Orchestratoren unterscheiden sich in Abstraktionen und Deployment-Modellen, und ihre Funktionen ändern sich. Vergleiche aktuelle Versionen mit deinen Anforderungen:

- Abhängigkeits- und Ereignissemantik
- Retry, Timeout, Abbruch und Backfill
- Konkurrenz- und Ressourcensteuerung
- Secrets und Ausführungsisolation
- Logs, Metriken, Lineage und Zuständigkeit
- Deployment, Upgrades und Wiederherstellung
- Passung zur bestehenden Laufzeit

Der Orchestrator plant nur; für Determinismus, Atomarität und Vollständigkeit sorgt der Job selbst.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Wiederholung und Replay.",
    },
    {
      id: "s7",
      title: "Kernaussagen",
      content: `- Retry und Backfill brauchen explizite Fenster, deterministische Quellversionen, atomare Veröffentlichung, idempotente externe Effekte und Reconciliation.
- Der Name einer Materialisierung beweist nichts über Lese- und Build-Kosten, Freshness oder Atomarität.`,
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **Idempotent**, eine Wiederholung mit derselben Identität und Eingabe ändert nichts weiter.
- **Inkrementelles Modell**, verarbeitet nach dem ersten Build nur eine gewählte Teilmenge.
- **SLA / Freshness**, Zielzeit von der Quelländerung bis zu nutzbaren Daten.
- **Lineage**, erfasste Beziehungen zwischen Jobs, Datasets und Feldern.
- **SCD Typ 1**, überschreibt ein Attribut ohne Historie.
- **SCD Typ 2**, hält zeitlich gültige Versionen.
- **MERGE oder Insert-Overwrite**, schlüsselbasierte Änderungen oder Ersatz einer ganzen Grenze.
- **Sensor**, eine Aufgabe, die auf eine externe Bedingung wartet.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Der Alarm um 3 Uhr",
      question:
        "Ein nächtlicher Job fügt die Bestellungen des Vortags in `fact_orders` ein und bricht nach der Hälfte ab. Nach der Wiederholung stehen dort doppelte Zeilen. Welcher Fehler steckt im Job?",
      options: [
        "Keiner; dieses Verhalten ist zu erwarten.",
        "Er nutzt `INSERT` statt eines `MERGE` auf `order_id`.",
        "Es fehlt ein try/catch-Block.",
        "Es sind mehr Wiederholungsversuche nötig.",
      ],
      explanation:
        "Ein einfaches `INSERT` hängt bei jeder Wiederholung dieselben Zeilen an, der Job ist also nicht idempotent. Ein deterministisches `MERGE` auf `order_id` oder der atomare Ersatz eines vollständigen Fensters verhindert die Duplikate.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Wann ELT Replay unterstützt",
      question:
        "Ein Team prüft ELT für Daten, die vielleicht historisch neu verarbeitet werden. Welcher Vorteil gilt nur, wenn die Landing Zone vollständige, kontrollierte Eingaben aufbewahrt?",
      options: [
        "SQL ist einfacher als Python.",
        "Korrigierte Transformationen verarbeiten die Historie ohne neuen Quellabzug.",
        "Snowflake ist schneller.",
        "ELT ist die neuere Vorgehensweise.",
      ],
      explanation:
        "Eine aufbewahrte Landing Zone entkoppelt Replay von der Verfügbarkeit der Quelle, wenn die Eingabe vollständig, ausreichend versioniert, aufbewahrt, autorisiert und zur korrigierten Logik passend ist. Neuberechnung kostet trotzdem Compute und kann Abgleiche nachgelagert erzwingen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Idempotenz",
          q: "Warum ist sie für Batch-Jobs entscheidend?",
          a: "Benenne die Ausgaben und Seiteneffekte, die unverändert bleiben, wenn derselbe Vorgang mit derselben Eingabe erneut läuft. Ein Datenbankschreibvorgang kann idempotent sein, die Benachrichtigung oder der API-Aufruf daneben nicht.",
        },
        {
          term: "Inkrementelles Modell",
          q: "Wie setzt dbt es um?",
          a: "Mit {% if is_incremental() %} wählst du eine begrenzte Änderungsmenge und dazu eine vom Adapter unterstützte Strategie. Ein Maximalzeitstempel übersieht verspätete Änderungen; nimm ein Change Token oder eine Überlappung mit deterministischer Deduplizierung.",
        },
        {
          term: "SLA / Freshness",
          q: "Wie wird Freshness festgelegt?",
          a: "Als Zielzeit zwischen Quelländerung und nutzbaren Daten. Monitoring und Alarme sind werkzeug- und versionsabhängig, also prüf deine Integration.",
        },
        {
          term: "Lineage",
          q: "Warum ist sie wichtig?",
          a: "Sie grenzt ein, welche vorgelagerten Datasets und Jobs eine Ausgabe beeinflussen könnten. Automatisch erzeugte Graphen übersehen dynamisches SQL, externe APIs und semantische Änderungen, also bleiben Zuständigkeit und Laufbelege nötig.",
        },
        {
          term: "SCD Typ 1",
          q: "Wann ist dieser Typ geeignet?",
          a: "Die Zeile wird überschrieben, sobald sich ein Attribut ändert, ohne Historie. Das passt, wenn frühere Werte für die Consumer keine Rolle spielen, etwa bei einem Tippfehler oder einer neuen Telefonnummer.",
        },
        {
          term: "SCD Typ 2",
          q: "Wann ist dieser Typ geeignet?",
          a: "Die alte Zeile wird mit valid_to und is_current=false geschlossen und eine neue eingefügt. So verbindest du Fakten mit dem Dimensionsstand zur Ereigniszeit, etwa der Region des Kunden beim Kauf; jede Version kostet eine Zeile.",
        },
        {
          term: "MERGE oder Insert-Overwrite",
          q: "Welche Strategie ist idempotent?",
          a: "Beide tragen Replay, wenn Eingabe und Logik deterministisch sind und die Veröffentlichung atomar ist. MERGE braucht zusätzlich eindeutige Quellzeilen und stabilen Abgleich, Ersatz eine vollständige Partitionsgrenze.",
        },
        {
          term: "Sensor",
          q: "Was bezeichnet der Begriff in Airflow?",
          a: "Eine Aufgabe, die auf eine externe Bedingung wartet, etwa eine gelandete Datei, ein Tabellenupdate oder eine API-Antwort 200, bevor nachgelagerte Aufgaben laufen.",
        },
      ],
    },
  ],
  preserve: ["ELT", "Lineage", "Sensor"],
});
