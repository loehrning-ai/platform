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
      content: `Ein Design-Review benötigt Struktur; Reihenfolge und Zeitanteile hängen aber von der Aufgabe ab. Nutze diese Schleife und investiere mehr Zeit in hohe Unsicherheit oder hohes Risiko:

1. **Klären.** Consumer, Entscheidungen, Spitzenlast beim Schreiben und Lesen, Freshness, Korrektheit, Datenschutz, Aufbewahrung, Verfügbarkeit und Kosten bestimmen. Offene Annahmen dokumentieren.
2. **Rahmen setzen.** Nur die für die Aufgabe relevanten Grenzen zeichnen. Hauptgefahren nennen und den Vertrag des Lesepfads vor Produkten definieren.
3. **Schätzen und entwerfen.** Größenordnung von Durchsatz, Speicher und Gleichzeitigkeit berechnen. Partitionierung, Verarbeitung, Speicher und Serving daraus ableiten.
4. **Fehlerfälle prüfen.** Verspätete und doppelte Daten, Schiefe, Schemaänderungen, Backfills, Abhängigkeitsausfälle, Zugriffstrennung und Wiederherstellung untersuchen. Jedem Risiko Erkennungs- und Wiederherstellungsevidenz zuordnen.
5. **Zielkonflikte prüfen.** Benennen, worauf der Entwurf optimiert, was er nicht garantiert und welche Entscheidungen Benchmark oder Prototyp benötigen.

Klärung verhindert, dass ein selten benötigter Bericht zu einem unnötigen Streaming-System wird. Schätzungen verhindern Produktauswahl vor Kenntnis der Last.`,
      keyTakeaway:
        "Consumer-Vertrag klären und Last quantifizieren, bevor Komponenten gewählt werden.",
    },
    {
      id: "s2",
      title: "Durchgearbeitetes Szenario",
      content: `Der interaktive Ablauf verwendet einen hypothetischen Marktplatz, in dem Händler Bestell- und Umsatzaggregate sehen. Sämtliche Verkehrs-, Größen-, Verspätungs- und Freshness-Werte sind Eingaben der Übung, keine Benchmarks oder empfohlenen Vorgaben. Benannte Produkte machen Zielkonflikte konkret. Eine Produktionsentscheidung benötigt trotzdem aktuelle Kompatibilitätsprüfung, Security Review, Kostenmodell und repräsentative Lasttests.`,
    },
    {
      id: "s3",
      title: "Präzise Formulierungen",
      content: `Verwende Sprache, die Annahmen und Evidenz sichtbar macht:

- *„Welche Entscheidung trifft der Consumer aus dieser Ausgabe und wie alt darf sie sein?“* definiert den Lesevertrag.
- *„Wird Freshness ab Ereignisentstehung, Quell-Commit oder Ingestion gemessen?“* verhindert ein mehrdeutiges SLI.
- *„Ich schätze zuerst und wähle danach eine Komponente.“* Eine Milliarde Ereignisse zu je 1 KB entsprechen ungefähr 1 TB pro Tag und durchschnittlich 11.6 MB/s vor Replikation, Kodierung, Indizes und Protokoll-Overhead. Für die Spitze ist eine weitere Annahme nötig.
- *„Diese Komponente ist ein Kandidat, weil sie die Anforderungen erfüllt; Connector-Semantik und Pfadleistung prüfe ich separat.“* trennt Entwurfshypothese und Nachweis.
- *„Das Risiko ist X, die Gegenmaßnahme Y und Z bleibt ungemindert.“* macht Restrisiko prüfbar.
- *„Diese Garantie gilt nur zwischen diesen Grenzen.“* verhindert, dass lokale Verarbeitungssemantik zur End-to-End-Aussage wird.`,
    },
    {
      id: "s4",
      title: "Unzureichende Formulierungen",
      content: `- *„Wir verwenden Kafka.“* Welche Anforderung braucht ein dauerhaftes partitioniertes Log?
- *„Maschinelles Lernen erkennt das.“* Welches Signal, welche Trainingsdaten, Fehlerkosten und Rückfalllogik bestehen?
- *„Das muss Exactly-once sein.“* Welcher Zustandsübergang und welche Zielgrenze dürfen keinen doppelten Effekt haben?
- *„Alles kommt in ein Warehouse.“* Welche Last-, Isolations- und Wiederherstellungsanforderungen tragen diese Wahl?
- *„Dieser Fehler ist unwahrscheinlich.“* Welche Evidenz trägt die Wahrscheinlichkeit und wie hoch ist der Schaden?

Jede Aussage überspringt eine Entscheidungsgrenze. Ergänze Anforderung, Annahme, Evidenz und Bedingung für eine Neubewertung.`,
    },
    {
      id: "s5",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu Anforderungsklärung und schiefer Last.",
    },
    {
      id: "s6",
      title: "Kursüberblick",
      content: `Nutze diese Aussagen als Review-Fragen, nicht als universelle Regeln.

- **Referenzebenen**, Quelle → Log → Verarbeitung → Speicher → Serving → Nutzung ist ein Modell zur Lokalisierung von Grenzen; nicht benötigte Ebenen entfallen.
- **CAP**, bei einer Netzwerkpartition kann ein verteiltes Register nicht zugleich linearisierbare Antworten und eine Antwort jedes nicht ausgefallenen Knotens garantieren. Modell und Fehlergrenze benennen.
- **PACELC**, erweitert die Betrachtung um Latenz- und Konsistenzkonflikte im Normalbetrieb; klassifiziere einen konkreten Vorgang, nicht einen Anbieter insgesamt.
- **Sternschema**, eine Faktentabelle erfasst Ereignisse oder Messwerte in deklarierter Granularität; Dimensionen liefern beschreibenden Kontext.
- **SCD Typ 2**, erhält ausgewählte Attributhistorie durch neue, zeitlich begrenzte Dimensionszeilen. Surrogatschlüssel hängen vom Modell ab.
- **Parquet-Aufbau**, eine Datei enthält Row Groups, Column Chunks und Pages; Metadaten können selektives Lesen unterstützen.
- **Prädikat-Pruning**, Statistiken überspringen Bereiche nur, wenn Prädikat, Metadaten und Schreiblayout dies sicher erlauben.
- **Dictionary Encoding**, ersetzt wiederholte Werte durch Wörterbuchverweise, wenn die schreibende Implementierung dies sinnvoll findet.
- **Tabellenmetadaten**, ein Tabellenformat koordiniert Snapshots und Dateien über Katalog- und Metadatenstrukturen, deren Details nach Format und Version variieren.
- **Copy-on-write und Merge-on-read**, unterschiedliche Zielkonflikte zwischen Aktualisierung und Lesen; Ergebnis hängt von Engine, Last und Wartung ab.
- **Time Travel**, aufbewahrte Snapshots ermöglichen historische Lesezugriffe, verbrauchen Speicher und benötigen klare Aufbewahrungs- und Zugriffsregeln.
- **Partitionierung**, Transformationen aus gemessenen Filtern, Dateiverteilung, Aktualisierungsmustern und Engine-Verhalten wählen; Dateigrößen anschließend prüfen.
- **Clustering**, kann Data Skipping für ausgewählte Prädikate verbessern und verursacht Umschreib- und Ingestion-Kosten.
- **Kleine Dateien**, erhöhen Metadaten- und Planungskosten; Kompaktierung folgt gemessener Last und Schreibweise.
- **ETL und ELT**, Transformationen dort ausführen, wo Security, Governance, Latenz, Replay und Compute-Anforderungen es tragen.
- **Idempotenz**, Wiederholung eines definierten Vorgangs erzeugt keinen zusätzlichen Effekt; \`MERGE\` oder Konfliktbehandlung benötigt stabile Schlüssel und korrekte Transaktionssemantik.
- **Kafka-Partitionen**, begrenzen aktive Consumer-Parallelität einer Gruppe für ein Topic und erhalten Ordnung nur innerhalb einer Partition. Anzahl aus Kapazität und Ordnungsbedarf ableiten.
- **Ereignis- und Verarbeitungszeit**, die Uhr wählen, die zur Fachfrage passt; manche operativen Fälle verwenden bewusst Verarbeitungszeit.
- **Watermark**, eine Fortschrittsregel für Ausgabe oder Korrektur von Ereigniszeitergebnissen, kein Beweis für die Ankunft aller früheren Ereignisse.
- **Fenster**, Tumbling-, Hopping-, Session- und benutzerdefinierte Fenster kodieren unterschiedliche Gruppierung und Zustandskosten.
- **CDC**, liest Datenbankänderungen gemäß Connector-, Quell-, Snapshot-, Aufbewahrungs- und Ordnungsverhalten und erzeugt Quell- sowie Betriebskosten.
- **Batch- und Streaming-Architekturen**, ein oder mehrere Verarbeitungspfade können passen; Korrektheit, Replay, Latenz und Betriebskomplexität vergleichen.
- **Outbox-Muster**, schreibt Anwendungszustand und Outbox-Zeile gemeinsam; Veröffentlichung und Zieleffekt benötigen weiterhin Behandlung.
- **Verarbeitungsgarantien**, Replay der Quelle, Prozessorzustand und Ziel-Commit getrennt benennen. End-to-End-Duplikateffekte benötigen Zusammenarbeit über jede Grenze.
- **Backfills**, Eingabe- und Codeversionen fixieren, Live-Schreibvorgänge isolieren oder koordinieren, Ausgabe deterministisch ersetzen sowie Validierung und Rollback definieren.
- **Schemakompatibilität**, Backward, Forward und Full gelten relativ zu Reader- und Writer-Versionen; die passende Regel folgt der Deployment-Reihenfolge.
- **Datenzuverlässigkeit**, Freshness, Vollständigkeit und Genauigkeit benötigen lastspezifische SLIs, Ziele, Zuständigkeiten und Reaktionen.
- **Lineage**, liefert Abhängigkeitsevidenz für Auswirkungsanalyse und Triage; Abdeckung und Kausalität müssen geprüft werden.
- **Datentests**, Schema-, Constraint-, Anomalie- und Reconciliation-Prüfungen decken unterschiedliche Risiken bei unterschiedlichen Kosten.
- **Stack-Auswahl**, Komponenten aus Last, Team, Security, Interoperabilität, Wiederherstellung und Kostenevidenz wählen. Es gibt keine kursweite Vorgabe.`,
    },
    {
      id: "s7",
      title: "Betrieblicher Abschluss",
      content: `Schließe das Review mit offenen Betriebsfragen: Wer verantwortet Datenqualitätsvorfälle, wie werden Backfills autorisiert und isoliert, welche Wiederherstellungsziele wurden tatsächlich erprobt und welche Garantien werden in Produktion gemessen?

Ein Entwurf ist erst vollständig, wenn Zuständigkeit, Evidenz, Fehlerreaktion und Restrisiken explizit sind.`,
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
        "Schreibvorgänge pro Sekunde in der Lastspitze, Lesevorgänge pro Sekunde oder Latenzbudget für die Entscheidung sowie das Freshness-Ziel zwischen Echtzeitentscheidung und nächtlichem Batch. Diese Zahlen bestimmen die Architektur.",
        "„Batch oder Streaming?“ Die interviewende Person soll den Entwurf vorgeben.",
        "„Welches Budget besteht?“ und „Wie viele Engineers stehen bereit?“",
      ],
      explanation:
        "Spitzenlast beim Schreiben, Lese- oder Entscheidungslatenz und Freshness begrenzen die Architektur. Sie genügen nicht allein: Korrektheit, Datenschutz, Aufbewahrung, Verfügbarkeit und Wiederherstellung müssen vor Freigabe ebenfalls feststehen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Die Hot-Partition",
      question:
        "Ein Kafka-Topic für Bestellungen ist nach seller_id partitioniert. Ein Händler erzeugt am Black Friday 40% des gesamten Verkehrs. Was bricht und wie wird es behoben?",
      options: [
        "Nichts; Kafka verteilt die Last automatisch.",
        "Diese Partition wird zum Engpass. Verwende einen kontrollierten Teilschlüssel wie (seller_id, bucket), aggregiere zunächst je Bucket und schlüssle für das Endaggregat wieder auf seller_id um.",
        "Kafka verteilt den Inhalt der Partition beim Rebalancing automatisch.",
        "Weitere Broker teilen die Partition selbstständig auf.",
      ],
      explanation:
        "Eine Consumer Group kann eine Partition nicht gleichzeitig durch mehrere aktive Consumer verarbeiten. Schiefe kann deshalb den Durchsatz begrenzen, während andere Partitionen unbeschäftigt sind. Ein kontrollierter Teilschlüssel verteilt Arbeit, fügt aber eine zweite Aggregationsstufe hinzu und verändert die Ordnung. Bucket-Anzahl aus gemessener Schiefe und Kapazität ableiten sowie Wiederherstellung und Re-Keying testen.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Sechs Ebenen",
          q: "In welcher Reihenfolge?",
          a: "Quelle → Protokoll → Verarbeitung → Speicher → Serving → Nutzung.",
        },
        {
          term: "CAP",
          q: "Was gilt während einer Partition?",
          a: "Für ein definiertes verteiltes Register können linearisierbare Antworten und eine Antwort jedes nicht ausgefallenen Knotens nicht gemeinsam garantiert werden. Modell und Grenze benennen.",
        },
        {
          term: "PACELC",
          q: "Welche Wahl gilt im Normalbetrieb?",
          a: "Das Modell betont Zielkonflikte zwischen Latenz und Konsistenz außerhalb von Partitionen. Einen konkreten Vorgang klassifizieren, nicht ein ganzes Anbieterprodukt.",
        },
        {
          term: "Sternschema",
          q: "Was liegt in der Mitte?",
          a: "Eine Faktentabelle mit Fremdschlüsseln und numerischen Messwerten. Umgebende Dimensionstabellen enthalten beschreibenden Kontext.",
        },
        {
          term: "SCD Typ 2",
          q: "Wie bleibt Historie erhalten?",
          a: "Statt Überschreiben wird eine neue Dimensionszeile mit valid_from und valid_to eingefügt. Der Surrogatschlüssel ändert sich, der natürliche Schlüssel bleibt.",
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
          a: "Wiederholte Werte werden durch Wörterbuchverweise ersetzt, wenn die schreibende Implementierung diese Kodierung für sinnvoll hält.",
        },
        {
          term: "Iceberg-Metadatenkette",
          q: "Welche fünf Stufen?",
          a: "Catalog → metadata.json → Manifest List → Manifests → Datendateien.",
        },
        {
          term: "CoW oder MoR",
          q: "Wann passt welches Verfahren?",
          a: "Beide tauschen Aktualisierungsarbeit gegen Zusammenführung beim Lesen. Engine-Unterstützung, Last und Wartung bestimmen das Ergebnis.",
        },
        {
          term: "Time Travel",
          q: "Was ermöglicht es?",
          a: "Aufbewahrte Snapshots und referenzierte Dateien ermöglichen historische Lesezugriffe, mit Folgen für Speicher, Datenschutz und Aufbewahrung.",
        },
        {
          term: "Partitionierung",
          q: "Wonach wird gewählt?",
          a: "Nach gemessenen Filtern, Datenverteilung, Aktualisierungsmustern und Engine-Verhalten. Dateigrößen und Pruning mit repräsentativen Daten validieren.",
        },
        {
          term: "Clustering",
          q: "Wann wird es eingesetzt?",
          a: "Wenn die Lokalität ausgewählter Prädikate Umschreib- und Ingestion-Kosten ausreichend rechtfertigt. Mit Abfrageevidenz prüfen.",
        },
        {
          term: "Problem kleiner Dateien",
          q: "Wie wird reagiert?",
          a: "Planungs- und Metadatenkosten messen, dann Kompaktierungsregel und Dateiziele für Engine und Last festlegen.",
        },
        {
          term: "ELT oder ETL",
          q: "Wie wird gewählt?",
          a: "Transformationen dort ausführen, wo Governance, Latenz, Replay, Security und Compute-Anforderungen es tragen.",
        },
        {
          term: "Idempotent",
          q: "Was muss gelten?",
          a: "Die Wiederholung eines definierten Vorgangs erzeugt keinen zusätzlichen Effekt. Stabile Schlüssel, deterministische Logik und korrekte Transaktionssemantik sind nötig.",
        },
        {
          term: "Kafka-Partition",
          q: "Was begrenzt sie?",
          a: "Aktive Consumer-Parallelität innerhalb einer Gruppe und den Ordnungsumfang. Die Anzahl folgt Kapazität und Ordnungsbedarf.",
        },
        {
          term: "Ereigniszeit oder Verarbeitungszeit",
          q: "Welche Zeit wird verwendet?",
          a: "Die Uhr verwenden, die die Fachfrage beantwortet. Ereigniszeit passt zu Quellzeitfenstern; Verarbeitungszeit kann für operative Ankunftsfragen richtig sein.",
        },
        {
          term: "Watermark",
          q: "Was stellt sie dar?",
          a: "Eine Fortschrittsregel für Ausgabe oder Korrektur von Ereigniszeitergebnissen. Sie beweist nicht die Ankunft aller früheren Ereignisse.",
        },
        {
          term: "Fenstertypen",
          q: "Welche vier gibt es?",
          a: "Tumbling ist fest und nicht überlappend, Hopping fest und überlappend, Session lückenbasiert und Global triggergesteuert.",
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
          a: "Wenn eine Anwendung Zustand und Veröffentlichungsabsicht gemeinsam committen muss. Veröffentlichung und Zieleffekt benötigen weiterhin Zustellungsbehandlung.",
        },
        {
          term: "Verarbeitungsgarantien",
          q: "Wie werden sie benannt?",
          a: "Replay, Prozessorzustand und Ziel-Commit getrennt beschreiben. End-to-End-Duplikateffekte benötigen Zusammenarbeit über alle Grenzen.",
        },
        {
          term: "Backfill-Entwurf",
          q: "Was muss kontrolliert werden?",
          a: "Eingaben und Code fixieren, Live-Schreibvorgänge koordinieren, Ersatz deterministisch machen sowie Validierung und Rollback definieren.",
        },
        {
          term: "Schemakompatibilität",
          q: "Was bedeuten Backward, Forward und Full?",
          a: "Kompatibilität relativ zu Reader- und Writer-Versionen definieren. Die Richtlinie folgt Deployment-Reihenfolge und Consumer-Bedarf.",
        },
        {
          term: "Drei SLO-Kennzahlen",
          q: "Welche gelten für Daten?",
          a: "Freshness für Aktualität, Vollständigkeit für fehlende Zeilen und Genauigkeit für richtige Werte.",
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
    body: `<p>Aufgabe: <em>„Entwirf Analysen für einen Marktplatz, auf dem Händler Bestell- und Umsatz-Dashboards sehen.“</em></p><p>Wiedergabe: <b>„Das System veröffentlicht händlerbezogene Aggregate aus Bestelländerungen. Freshness, Verkehr, Aufbewahrung, Autorisierung und Konsistenz sind noch offen.“</b></p>`,
    note: "Eine neutrale Wiedergabe bestätigt den Umfang, ohne aus einem unbestimmten Dashboard still ein Echtzeitsystem zu machen.",
  },
  {
    tag: "scope",
    title: "Annahmen der Übung dokumentieren",
    body: `<p>Angenommen werden <b>10,000 Bestelländerungen pro Sekunde in der Spitze</b>, <b>500 gleichzeitige Dashboard-Sitzungen</b> und ein Produktziel, <b>99% der akzeptierten Ereignisse innerhalb von 5 Sekunden in einem rollierenden Stundenfenster</b> zu veröffentlichen.</p><p>Zusätzlich gelten Händlerautorisierung, sieben Jahre Aufbewahrung der Aggregate, 30 Tage wiedereinspielbare Rohänderungen und ein dokumentierter Degraded Mode.</p>`,
    note: "Das sind Szenarioeingaben. Ein reales Review bezieht sie aus Produkt-, Rechts-, Security- und Last-Evidenz.",
  },
  {
    tag: "estimate",
    title: "Vor Kapazitätswahl schätzen",
    body: `<p>Würde die angenommene Spitze einen ganzen Tag anhalten: 10,000 × 86,400 = <b>864 Millionen Änderungen pro Tag</b>. Bei einer beispielhaften Nutzlast von 1 KB sind das <b>864 GB pro Tag</b> vor Replikation, Indizes, Kodierung und Protokoll-Overhead.</p><p>Kompressionsrate, Spitzendauer, Aggregatgröße und Cache-Residency bleiben unbekannt. Vor Dimensionierung von Knoten oder Kosten mit repräsentativen Daten messen.</p>`,
    note: "Die Rechnung begrenzt das Problem. Verteilung, Overhead, Ausfallverhalten und Benchmarks bleiben separat zu messen.",
  },
  {
    tag: "api",
    title: "Consumer-Vertrag definieren",
    body: `<p>Zwei vorläufige Schnittstellen:</p><pre>GET /sellers/:id/dashboard  → { as_of, revenue_24h, orders_24h }
WS  /sellers/:id/updates    → { event_id, occurred_at, aggregate_delta }</pre><p>Beide leiten die Händleridentität aus dem authentifizierten Principal ab, erzwingen den Tenant-Umfang serverseitig und geben den Datenzeitpunkt zurück. Cache oder Query Store folgt erst aus Messungen.</p>`,
    note: "Der Vertrag macht Freshness und Autorisierung sichtbar. Speicher bleibt eine Implementierungsentscheidung.",
  },
  {
    tag: "data model",
    title: "Ereignisidentität und Ordnung definieren",
    body: `<p>Verwende einen unveränderlichen Änderungsumschlag mit <code>event_id, order_id, seller_id, operation, source_commit_position, occurred_at, amount_minor, currency, schema_version</code>.</p><p><code>seller_id</code> unterstützt händlerbezogene Aggregation; Schiefe und Ordnung je Bestellung müssen jedoch gemessen werden. Ein Schlüssel erfüllt nicht automatisch jede nachgelagerte Operation.</p>`,
    note: "Stabile Identität unterstützt Deduplizierung; der Partitionsschlüssel definiert Ordnungs- und Schiefegrenzen.",
  },
  {
    tag: "streaming",
    title: "Verarbeitungspfad vorschlagen",
    body: `<p>Ein Kandidat ist PostgreSQL Change Capture → Kafka → zustandsbehafteter Stream-Prozessor. Die Partitionszahl folgt gemessenem Durchsatz, Wiederherstellungszeit und Ordnungsanforderungen. Der Prozessor wendet versionsbewusste Änderungen an und veröffentlicht Aggregatänderungen.</p><p>Watermark und erlaubte Verspätung folgen der beobachteten Verzögerungsverteilung und Korrekturanforderung. Ungültige oder nicht verarbeitbare Datensätze gehen in einen zugriffsbeschränkten, zeitlich begrenzten Prüfpfad.</p>`,
    note: "Connector-Snapshots, Quelllog-Aufbewahrung, Replay, Prozessor-Checkpoints und Ziel-Commits werden als getrennte Grenzen getestet.",
  },
  {
    tag: "storage",
    title: "Historie und Serving trennen",
    body: `<p>Halte eine dauerhafte historische Tabelle für Replay und Analyse sowie eine händlerbezogene Serving-Materialisierung für das Dashboard. Iceberg und Druid sind in dieser Übung Kandidaten, keine Pflichtprodukte.</p><p>Definiere, wie beide Ziele einen Verarbeitungsversuch identifizieren, Wiederholungen behandeln, ihre commitete Version offenlegen und abgeglichen werden. Ein erfolgreicher Schreibvorgang in ein Ziel macht das andere nicht atomar.</p>`,
    note: "Mehrere Materialisierungen verbessern Lasttrennung und erzeugen zugleich Divergenz- und Wiederherstellungsarbeit.",
  },
  {
    tag: "serving",
    title: "Lese- und Push-Pfad schützen",
    body: `<p>Die API fragt eine voraggregierte Händlersicht ab und gibt deren <code>as_of</code>-Wert zurück. Cache erst nach Definition von Invalidierung, tenant-sicheren Schlüsseln und zulässiger Veraltung.</p><p>Das Push-Gateway autorisiert jedes Abonnement, begrenzt Puffer und Raten, behandelt langsame Clients und widerruft Zugriff bei Sitzungsänderung. Es liest einen gemeinsamen Stream, statt je Händler eine Broker Consumer Group zu erzeugen.</p>`,
    note: "Latenzaussagen benötigen einen repräsentativen Lasttest einschließlich Autorisierung, Fan-out, Schiefe und Ausfallverhalten.",
  },
  {
    tag: "tradeoff",
    title: "Konsistenzgrenze benennen",
    body: `<p>Das Dashboard liefert das neueste im Serving Store verfügbare commitete Aggregat und zeigt dessen Datenzeitpunkt. Es verspricht keine linearisierbaren Lesezugriffe gegenüber der Bestelldatenbank.</p><p>Das Übungsziel erlaubt begrenzte Veröffentlichungsverzögerung. Verhalten bei Ausfall oder Partition benötigt weiterhin eine Produktentscheidung: veraltete Antwort mit sichtbarem Zeitpunkt, explizite Nichtverfügbarkeit oder reduzierte Übersicht.</p>`,
    note: "Beschreibe beobachtbares Verhalten für einen konkreten Lesevorgang und Fehler, nicht ein produktweites Konsistenzetikett.",
  },
  {
    tag: "scale",
    title: "Gemessene Schlüsselschiefe behandeln",
    body: `<p>Angenommen, ein Händler erzeugt 40% der Spitzenlast und überschreitet die getestete Kapazität eines Partition-Consumers.</p><p>Führe kontrollierte Teilschlüssel wie <code>(seller_id, bucket)</code> ein, aggregiere je Bucket vor und führe danach je Händler zusammen. Bucket-Anzahl aus Kapazitätsevidenz ableiten und veränderte Ordnungs-, Zustands- und Wiederherstellungskosten dokumentieren.</p>`,
    note: "Zusätzliche Broker können eine Hot Partition verschieben; sie teilen deren Datensätze nicht automatisch.",
  },
  {
    tag: "tradeoff",
    title: "Ausschlüsse und Restrisiko dokumentieren",
    body: `<p>Dieser Entwurf behandelt weder Mehrregionen-Wiederherstellung noch Datenschutzlöschung über aufbewahrte Logs und Snapshots, Betrugsentscheidungen oder mobile Zustellung.</p><p>Jeder Ausschluss kommt mit Zuständigkeit und Entscheidungsdatum in das Risikoregister. Kein Replikationsprodukt als Lösung darstellen, bevor Failover, Ordnung, Datenverlust und Wiederherstellung erprobt wurden.</p>`,
    note: "Ein begrenzter Entwurf benennt ausgeschlossene Pflichten, statt sie zu verstecken.",
  },
  {
    tag: "follow-up",
    title: "Mit Betriebsevidenz abschließen",
    body: `<p>Überwache End-to-End-Veröffentlichungsverzögerung, Vollständigkeit von Quelle zu Ziel, ungültige Datensätze, Partitionsschiefe, Checkpoint- und Ziel-Commit-Fehler, Reconciliation-Abweichungen und Datenalter im Serving Store.</p><p>Alarmierung folgt einem nutzerwirksamen SLO; Komponentenmetriken dienen der Diagnose. Runbooks decken Replay, teilweisen Zielerfolg, Zugriffsvorfälle und Backfill-Rollback ab.</p>`,
    note: "Der Entwurf ist nur prüfbar, wenn Garantien Messungen, Zuständigkeiten und Wiederherstellungsabläufe haben.",
  },
];
