import canonical, { type InterviewMoveItem } from "../interview-playbook";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

const lesson = localizeDataInfraLessonToGerman(canonical, {
  title: "Systemdesign-Review",
  subtitle: "Ein Händleranalyse-Szenario mit expliziten Annahmen",
  hook: "Eine mehrdeutige Aufgabe in einen prüfbaren Entwurf mit Schätzungen, Fehlergrenzen und benannten Zielkonflikten überführen.",
  keyConcepts: [
    "Review-Struktur",
    "Überschlagsrechnung",
    "Zielkonfliktanalyse",
    "Umgang mit schiefer Last",
  ],
  sections: [
    {
      id: "s1",
      title: "Begrenzte Review-Schleife",
      content: `Geh diese Schleife durch und gib den Stellen mit der größten Unsicherheit und dem größten Risiko die meiste Zeit.

1. **Klären.** Consumer, Entscheidungen, Spitzenlast beim Schreiben und Lesen, Freshness, Korrektheit, Datenschutz, Aufbewahrung, Verfügbarkeit und Kosten. Offene Annahmen aufschreiben.
2. **Rahmen setzen.** Nur die Grenzen zeichnen, die die Aufgabe braucht. Hauptrisiken nennen und den Lesevertrag definieren, bevor ein Produktname fällt.
3. **Schätzen und entwerfen.** Größenordnung von Durchsatz, Speicher und Gleichzeitigkeit berechnen, dann Partitionierung, Verarbeitung, Speicher und Serving daraus ableiten.
4. **Fehlerfälle prüfen.** Verspätete und doppelte Daten, Schiefe, Schemaänderungen, Backfills, Abhängigkeitsausfälle, Zugriffstrennung und Wiederherstellung. Zu jedem Risiko gehört Evidenz für Erkennung und Wiederherstellung.
5. **Zielkonflikte prüfen.** Benennen, worauf der Entwurf optimiert, was er nicht garantiert und welche Entscheidungen noch Benchmark oder Prototyp brauchen.`,
    },
    {
      id: "s2",
      title: "Durchgearbeitetes Szenario",
      content: `Der Ablauf oben spielt einen hypothetischen Marktplatz durch, auf dem Händler Bestell- und Umsatzaggregate sehen. Seine Verkehrs-, Größen-, Verspätungs- und Freshness-Werte sind Eingaben der Übung, keine Benchmarks oder Vorgaben. Für eine Produktionsentscheidung über die genannten Produkte brauchst du Kompatibilitätsprüfung, Security Review, Kostenmodell und repräsentative Lasttests.`,
    },
    {
      id: "s3",
      title: "Präzise Formulierungen",
      content: `- *„Welche Entscheidung trifft der Consumer aus dieser Ausgabe und wie alt darf sie sein?“* definiert den Lesevertrag.
- *„Wird Freshness ab Ereignisentstehung, Quell-Commit oder Ingestion gemessen?“* verhindert ein mehrdeutiges SLI.
- *„Ich schätze zuerst und wähle danach eine Komponente.“* Eine Milliarde Ereignisse zu je 1 KB sind rund 1 TB pro Tag und im Schnitt 11.6 MB/s, vor Replikation, Kodierung, Indizes und Protokoll-Overhead. Die Spitze braucht eine eigene Annahme.
- *„Diese Komponente ist ein Kandidat, weil sie die Anforderungen erfüllt; Connector-Semantik und Pfadleistung prüfe ich separat.“* trennt Hypothese und Nachweis.
- *„Das Risiko ist X, die Gegenmaßnahme Y und Z bleibt ungemindert.“* macht Restrisiko prüfbar.
- *„Diese Garantie gilt nur zwischen diesen Grenzen.“* verhindert, dass eine lokale Verarbeitungsgarantie zur End-to-End-Aussage wird.`,
    },
    {
      id: "s4",
      title: "Unzureichende Formulierungen",
      content: `- *„Wir verwenden Kafka.“* Welche Anforderung braucht ein dauerhaftes partitioniertes Log?
- *„Maschinelles Lernen erkennt das.“* Welches Signal, welche Trainingsdaten, Fehlerkosten und Rückfalllogik gibt es?
- *„Das muss Exactly-once sein.“* Welcher Zustandsübergang und welche Zielgrenze dürfen keinen doppelten Effekt haben?
- *„Alles kommt in ein Warehouse.“* Welche Last-, Isolations- und Wiederherstellungsanforderungen tragen diese Wahl?
- *„Dieser Fehler ist unwahrscheinlich.“* Welche Evidenz trägt die Wahrscheinlichkeit und wie hoch ist der Schaden?

Jeder dieser Sätze überspringt eine Entscheidungsgrenze. Ergänze Anforderung, Annahme, Evidenz und die Bedingung, unter der sich der Entwurf ändert.`,
    },
    {
      id: "s5",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Anforderungsklärung und schiefer Last.",
    },
    {
      id: "s6",
      title: "Kursüberblick",
      content: `Die 30 Lernkarten am Ende dieser Lektion decken jedes Konzept des Kurses ab. Lies jede Karte als Review-Frage, die du an einer konkreten Last prüfst.`,
    },
    {
      id: "s7",
      title: "Betrieblicher Abschluss",
      content: `Schließe das Review mit den offenen Betriebsfragen: Wer verantwortet Datenqualitätsvorfälle, wie werden Backfills autorisiert und isoliert, welche Wiederherstellungsziele wurden erprobt und welche Garantien misst du in Produktion?`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Der Klärungsschritt",
      question:
        "Die Aufgabe lautet: „Entwirf eine Datenpipeline zur Betrugserkennung.“ Welche drei Zahlen müssen vor der ersten Zeichnung geklärt werden?",
      options: [
        "„Welcher Cloudanbieter?“ „Ist Kafka bereits vorhanden?“ „Wie groß ist das Team?“",
        "Schreibvorgänge/s in der Spitze, Lesevorgänge/s oder Latenzbudget der Entscheidung und Freshness-Ziel (Echtzeit oder nächtlicher Batch).",
        "„Batch oder Streaming?“ Die interviewende Person soll den Entwurf vorgeben.",
        "„Welches Budget besteht?“ und „Wie viele Engineers stehen bereit?“",
      ],
      explanation:
        "Spitzenlast beim Schreiben, Entscheidungslatenz und Freshness begrenzen die Architektur. Korrektheit, Datenschutz, Aufbewahrung, Verfügbarkeit und Wiederherstellung müssen trotzdem vor der Freigabe feststehen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Die Hot-Partition",
      question:
        "Ein Kafka-Topic für Bestellungen ist nach seller_id partitioniert. Ein Händler erzeugt am Black Friday 40% des gesamten Verkehrs. Was bricht und wie behebst du es?",
      options: [
        "Nichts; Kafka verteilt die Last automatisch.",
        "Die Partition wird zum Engpass. Nach (seller_id, bucket) schlüsseln, je Bucket voraggregieren, dann auf seller_id umschlüsseln.",
        "Kafka verteilt den Inhalt der Partition beim Rebalancing automatisch.",
        "Weitere Broker teilen die Partition selbstständig auf.",
      ],
      explanation:
        "In einer Gruppe liest nur ein Consumer eine Partition, also deckelt die heiße Partition den Durchsatz, während andere leerlaufen. Teilschlüssel verteilen die Arbeit, kosten aber eine Aggregationsstufe und ändern die Ordnung; Buckets nach gemessener Schiefe bemessen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Sechs Ebenen",
          q: "In welcher Reihenfolge?",
          a: "Quelle → Protokoll → Verarbeitung → Speicher → Serving → Nutzung. Ebenen, die eine Last nicht braucht, entfallen.",
        },
        {
          term: "CAP",
          q: "Was gilt während einer Partition?",
          a: "Ein verteiltes Register kann nicht zugleich linearisierbare Antworten und eine Antwort jedes nicht ausgefallenen Knotens garantieren. Modell und Grenze benennen.",
        },
        {
          term: "PACELC",
          q: "Welche Wahl gilt im Normalbetrieb?",
          a: "Zielkonflikte zwischen Latenz und Konsistenz außerhalb von Partitionen. Einen Vorgang klassifizieren, nie ein ganzes Anbieterprodukt.",
        },
        {
          term: "Sternschema",
          q: "Was liegt in der Mitte?",
          a: "Eine Faktentabelle in deklarierter Granularität, mit Fremdschlüsseln und numerischen Messwerten. Dimensionstabellen liefern beschreibenden Kontext.",
        },
        {
          term: "SCD Typ 2",
          q: "Wie bleibt Historie erhalten?",
          a: "Eine neue Dimensionszeile mit valid_from und valid_to statt Überschreiben. Der Surrogatschlüssel ändert sich, der natürliche Schlüssel bleibt.",
        },
        {
          term: "Parquet-Aufbau",
          q: "Wie lautet die Reihenfolge?",
          a: "Datei → Row Groups → Column Chunks → Pages. Der Footer enthält Schema und Minimum-/Maximumstatistiken je Column Chunk.",
        },
        {
          term: "Predicate Pushdown",
          q: "Wie wird Arbeit übersprungen?",
          a: "Über Minimum-/Maximumstatistiken je Row Group. Gilt amount > 1000 und ist der Höchstwert einer Gruppe 50, wird die ganze Gruppe übersprungen.",
        },
        {
          term: "Dictionary Encoding",
          q: "Was bewirkt es?",
          a: "Ersetzt wiederholte Werte durch Wörterbuchverweise, wenn die schreibende Implementierung das für sinnvoll hält.",
        },
        {
          term: "Iceberg-Metadatenkette",
          q: "Welche fünf Stufen?",
          a: "Catalog → metadata.json → Manifest List → Manifests → Datendateien.",
        },
        {
          term: "CoW oder MoR",
          q: "Wann passt welches Verfahren?",
          a: "Aktualisierungsarbeit gegen Zusammenführung beim Lesen. Engine-Unterstützung, Last und Wartung entscheiden.",
        },
        {
          term: "Time Travel",
          q: "Was ermöglicht es?",
          a: "Aufbewahrte Snapshots und referenzierte Dateien. Sie kosten Speicher und brauchen Regeln für Datenschutz, Aufbewahrung und Zugriff.",
        },
        {
          term: "Partitionierung",
          q: "Wonach wird gewählt?",
          a: "Nach gemessenen Filtern, Datenverteilung, Aktualisierungsmustern und Engine-Verhalten. Dateigrößen und Pruning mit repräsentativen Daten validieren.",
        },
        {
          term: "Clustering",
          q: "Wann wird es eingesetzt?",
          a: "Wenn die Lokalität ausgewählter Prädikate Umschreib- und Ingestion-Kosten rechtfertigt, belegt durch Abfrageevidenz.",
        },
        {
          term: "Problem kleiner Dateien",
          q: "Wie wird reagiert?",
          a: "Planungs- und Metadatenkosten messen, dann Kompaktierung und Zieldateigrößen für Engine und Last festlegen.",
        },
        {
          term: "ELT oder ETL",
          q: "Wie wird gewählt?",
          a: "Transformationen dort ausführen, wo Governance, Latenz, Replay, Security und Compute-Anforderungen es tragen.",
        },
        {
          term: "Idempotent",
          q: "Was muss gelten?",
          a: "Die Wiederholung eines definierten Vorgangs erzeugt keinen zusätzlichen Effekt. Dafür braucht es stabile Schlüssel, deterministische Logik und korrekte Transaktionssemantik.",
        },
        {
          term: "Kafka-Partition",
          q: "Was begrenzt sie?",
          a: "Aktive Consumer-Parallelität in einer Gruppe; Ordnung gilt nur innerhalb einer Partition. Die Anzahl folgt Kapazität und Ordnungsbedarf.",
        },
        {
          term: "Ereigniszeit oder Verarbeitungszeit",
          q: "Welche Zeit wird verwendet?",
          a: "Die Uhr, die die Fachfrage beantwortet. Ereigniszeit passt zu Quellzeitfenstern, Verarbeitungszeit zu operativen Ankunftsfragen.",
        },
        {
          term: "Watermark",
          q: "Was stellt sie dar?",
          a: "Eine Fortschrittsregel für Ausgabe oder Korrektur von Ereigniszeitergebnissen. Sie beweist nicht die Ankunft aller früheren Ereignisse.",
        },
        {
          term: "Fenstertypen",
          q: "Welche vier gibt es?",
          a: "Tumbling ist fest und nicht überlappend, Hopping fest und überlappend, Session lückenbasiert und Global triggergesteuert. Jeder Typ hat eigene Zustandskosten.",
        },
        {
          term: "CDC",
          q: "Wie liest es die Quelle?",
          a: "Über Datenbankänderungsprotokolle gemäß Connector-, Snapshot-, Quelllog-Aufbewahrungs-, Ordnungs- und Quelllastverhalten.",
        },
        {
          term: "Batch oder Streaming",
          q: "Welche Architektur gewinnt?",
          a: "Keine universell. Latenz, Replay, Korrektheit, Betriebskomplexität und Wiederherstellung vergleichen.",
        },
        {
          term: "Outbox-Muster",
          q: "Wann wird es verwendet?",
          a: "Wenn Zustand und Veröffentlichungsabsicht gemeinsam committen müssen. Veröffentlichung und Zieleffekt brauchen weiterhin Zustellungsbehandlung.",
        },
        {
          term: "Verarbeitungsgarantien",
          q: "Wie werden sie benannt?",
          a: "Replay, Prozessorzustand und Ziel-Commit getrennt benennen. Ohne End-to-End-Duplikateffekte geht es nur, wenn alle Grenzen zusammenarbeiten.",
        },
        {
          term: "Backfill-Entwurf",
          q: "Was muss kontrolliert werden?",
          a: "Eingaben und Code fixieren, Live-Schreibvorgänge koordinieren, Ersatz deterministisch machen sowie Validierung und Rollback definieren.",
        },
        {
          term: "Schemakompatibilität",
          q: "Was bedeuten Backward, Forward und Full?",
          a: "Kompatibilität gilt zwischen Reader- und Writer-Versionen. Die Richtlinie folgt Deployment-Reihenfolge und Consumer-Bedarf.",
        },
        {
          term: "Drei SLO-Kennzahlen",
          q: "Welche gelten für Daten?",
          a: "Freshness für Aktualität, Vollständigkeit für fehlende Zeilen, Genauigkeit für richtige Werte, jeweils mit eigenem SLI, Ziel, Zuständigkeit und Reaktion.",
        },
        {
          term: "Lineage",
          q: "Was liefert sie?",
          a: "Abhängigkeitsevidenz für Auswirkungsanalyse und Triage. Abdeckung und Kausalität müssen weiterhin geprüft werden.",
        },
        {
          term: "Datentestfamilien",
          q: "Wie unterscheiden sie sich?",
          a: "Schema-, Constraint-, Anomalie- und Reconciliation-Prüfungen decken unterschiedliche Risiken bei unterschiedlichen Kosten.",
        },
        {
          term: "Stack-Auswahl",
          q: "Was bestimmt sie?",
          a: "Last, Team, Security, Interoperabilität, Wiederherstellung und Kostenevidenz. Es gibt keine kursweite Vorgabe.",
        },
      ],
    },
  ],
  preserve: [
    "CAP",
    "PACELC",
    "Clustering",
    "Idempotent",
    "Watermark",
    "CDC",
    "Lineage",
  ],
});

export default lesson;

/** Deutsche Fassung der festen, hypothetischen Review-Übung. */
export const INTERVIEW_MOVES: readonly InterviewMoveItem[] = [
  {
    tag: "clarify",
    title: "Problem ohne neue Anforderungen wiedergeben",
    body: `<p>Die Aufgabe lautet <em>„Entwirf Analysen für einen Marktplatz, auf dem Händler Bestell- und Umsatz-Dashboards sehen.“</em></p><p>Gib sie so wieder: <b>„Das System veröffentlicht händlerbezogene Aggregate aus Bestelländerungen. Freshness, Verkehr, Aufbewahrung, Autorisierung und Konsistenz sind noch offen.“</b></p>`,
    note: "So wird aus einem vagen Dashboard nicht heimlich ein Echtzeitsystem.",
  },
  {
    tag: "scope",
    title: "Annahmen der Übung dokumentieren",
    body: `<p>Angenommen werden <b>10,000 Bestelländerungen pro Sekunde in der Spitze</b>, <b>500 gleichzeitige Dashboard-Sitzungen</b> und ein Ziel, <b>99% der akzeptierten Ereignisse innerhalb von 5 Sekunden in einem rollierenden Stundenfenster</b> zu veröffentlichen.</p><p>Dazu kommen Händlerautorisierung, sieben Jahre Aufbewahrung der Aggregate, 30 Tage wiedereinspielbare Rohänderungen und ein dokumentierter Degraded Mode.</p>`,
    note: "Reale Reviews beziehen sie aus Produkt-, Rechts-, Security- und Last-Evidenz.",
  },
  {
    tag: "estimate",
    title: "Vor Kapazitätswahl schätzen",
    body: `<p>Hielte die Spitze einen ganzen Tag an: 10,000 × 86,400 = <b>864 Millionen Änderungen pro Tag</b>, bei einer beispielhaften Nutzlast von 1 KB also <b>864 GB pro Tag</b> vor Replikation, Indizes, Kodierung und Protokoll-Overhead.</p><p>Miss Kompressionsrate, Spitzendauer, Aggregatgröße und Cache-Residency mit repräsentativen Daten, bevor du Knoten oder Kosten dimensionierst.</p>`,
    note: "Die Rechnung steckt das Problem ab und ersetzt keinen Benchmark.",
  },
  {
    tag: "api",
    title: "Consumer-Vertrag definieren",
    body: `<p>Zwei vorläufige Schnittstellen:</p><pre>GET /sellers/:id/dashboard  → { as_of, revenue_24h, orders_24h }
WS  /sellers/:id/updates    → { event_id, occurred_at, aggregate_delta }</pre><p>Beide leiten die Händleridentität aus dem authentifizierten Principal ab, erzwingen den Tenant-Umfang serverseitig und geben den Datenzeitpunkt zurück. Cache oder Query Store erst nach Messungen ergänzen.</p>`,
    note: "Freshness und Autorisierung stehen im Vertrag; der Speicher bleibt offen.",
  },
  {
    tag: "data model",
    title: "Ereignisidentität und Ordnung definieren",
    body: `<p>Verwende einen unveränderlichen Änderungsumschlag mit <code>event_id, order_id, seller_id, operation, source_commit_position, occurred_at, amount_minor, currency, schema_version</code>.</p><p><code>seller_id</code> trägt die händlerbezogene Aggregation. Miss Schiefe und Ordnung je Bestellung, denn kein Schlüssel passt für jede nachgelagerte Operation.</p>`,
    note: "Stabile Identität ermöglicht Deduplizierung. Der Partitionsschlüssel setzt die Grenzen für Ordnung und Schiefe.",
  },
  {
    tag: "streaming",
    title: "Verarbeitungspfad vorschlagen",
    body: `<p>Kandidat: PostgreSQL Change Capture → Kafka → zustandsbehafteter Stream-Prozessor, der versionsbewusste Änderungen anwendet und Aggregatänderungen veröffentlicht. Die Partitionszahl folgt gemessenem Durchsatz, Wiederherstellungszeit und Ordnungsbedarf.</p><p>Watermark und erlaubte Verspätung folgen beobachteten Verzögerungen und Korrekturbedarf. Ungültige Datensätze gehen in einen zugriffsbeschränkten, zeitlich begrenzten Prüfpfad.</p>`,
    note: "Connector-Snapshots, Quelllog-Aufbewahrung, Replay, Prozessor-Checkpoints und Ziel-Commits sind getrennte Grenzen. Teste jede.",
  },
  {
    tag: "storage",
    title: "Historie und Serving trennen",
    body: `<p>Halte eine dauerhafte Historientabelle für Replay und Analyse sowie eine händlerbezogene Serving-Sicht für das Dashboard. Iceberg und Druid sind hier Kandidaten, keine Pflicht.</p><p>Definiere, wie beide Ziele Versuche identifizieren, Wiederholungen behandeln, ihre commitete Version offenlegen und abgeglichen werden. Ein Schreibvorgang in eines macht das andere nicht atomar.</p>`,
    note: "Zwei Materialisierungen trennen Lasten und bringen Divergenz- und Wiederherstellungsarbeit.",
  },
  {
    tag: "serving",
    title: "Lese- und Push-Pfad schützen",
    body: `<p>Die API liest eine voraggregierte Händlersicht und gibt deren <code>as_of</code> zurück. Cache erst nach Definition von Invalidierung, tenant-sicheren Schlüsseln und zulässiger Veraltung.</p><p>Das Push-Gateway autorisiert jedes Abonnement, begrenzt Puffer und Raten, behandelt langsame Clients und widerruft Zugriff bei Sitzungsänderung. Es liest einen gemeinsamen Stream statt einer Broker Consumer Group je Händler.</p>`,
    note: "Eine Latenzaussage braucht einen repräsentativen Lasttest mit Autorisierung, Fan-out, Schiefe und Ausfällen.",
  },
  {
    tag: "tradeoff",
    title: "Konsistenzgrenze benennen",
    body: `<p>Das Dashboard liefert das neueste commitete Aggregat im Serving Store und zeigt dessen Datenzeitpunkt. Es verspricht keine linearisierbaren Lesezugriffe gegenüber der Bestelldatenbank.</p><p>Bei Ausfall oder Partition entscheidet das Produkt: veraltete Antwort mit sichtbarem Zeitpunkt, explizite Nichtverfügbarkeit oder reduzierte Übersicht.</p>`,
    note: "Beschreibe beobachtbares Verhalten für einen Lesevorgang und einen Fehler statt eines produktweiten Konsistenzetiketts.",
  },
  {
    tag: "scale",
    title: "Gemessene Schlüsselschiefe behandeln",
    body: `<p>Angenommen, ein Händler erzeugt 40% der Spitzenlast, mehr als die getestete Kapazität eines Partition-Consumers.</p><p>Schlüssle nach <code>(seller_id, bucket)</code>, aggregiere je Bucket vor und führe danach je Händler zusammen. Leite die Bucket-Anzahl aus Kapazitätsevidenz ab und dokumentiere veränderte Ordnungs-, Zustands- und Wiederherstellungskosten.</p>`,
    note: "Zusätzliche Broker können eine Hot Partition verschieben. Deren Datensätze teilen sie nicht.",
  },
  {
    tag: "tradeoff",
    title: "Ausschlüsse und Restrisiko dokumentieren",
    body: `<p>Nicht Teil dieses Entwurfs: Mehrregionen-Wiederherstellung, Datenschutzlöschung über aufbewahrte Logs und Snapshots, Betrugsentscheidungen und mobile Zustellung.</p><p>Jeder Ausschluss kommt mit Zuständigkeit und Entscheidungsdatum ins Risikoregister. Kein Replikationsprodukt gilt als Lösung, bevor Failover, Ordnung, Datenverlust und Wiederherstellung erprobt sind.</p>`,
    note: "Ein begrenzter Entwurf benennt, was er ausschließt.",
  },
  {
    tag: "follow-up",
    title: "Mit Betriebsevidenz abschließen",
    body: `<p>Überwache End-to-End-Veröffentlichungsverzögerung, Vollständigkeit von Quelle zu Ziel, ungültige Datensätze, Partitionsschiefe, Checkpoint- und Ziel-Commit-Fehler, Reconciliation-Abweichungen und Datenalter im Serving Store.</p><p>Alarmiere auf ein nutzerwirksames SLO und nutze Komponentenmetriken zur Diagnose. Schreibe Runbooks für Replay, teilweisen Zielerfolg, Zugriffsvorfälle und Backfill-Rollback.</p>`,
    note: "Garantien werden prüfbar, sobald sie Messungen, Zuständigkeiten und Wiederherstellungsabläufe haben.",
  },
];
