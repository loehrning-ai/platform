import canonical from "../modeling";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "Datenmodellierung für OLTP, OLAP und Streams",
  subtitle: "3NF · Kimball · breite Tabellen · Vault",
  hook: "Ein Modell aus Schreibverhalten, Abfrageform, Historie, Lineage und Zuständigkeit wählen.",
  keyConcepts: [
    "Sternschema",
    "SCD Typ 2",
    "Ersatzschlüssel",
    "Data Vault",
    "Dualität von Stream und Tabelle",
  ],
  sections: [
    {
      id: "s1",
      title: "Fünf Modellierungsansätze",
      content: `„Wie sollen diese Daten modelliert werden?“ hat keine kontextfreie Antwort. Beginne mit Schreibverhalten, Abfragemustern, benötigter Historie, Zuständigkeit und Änderungshäufigkeit. Eine hilfreiche Einteilung:

1. **3NF / normalisiert**, speichert Fakten mit kontrollierter Redundanz. Unterstützt transaktionale Änderungen und Integritätsregeln, benötigt für breitere Lesevorgänge aber Joins.
2. **Sternschema nach Kimball**, organisiert analytische Ereignisse oder Messwerte in Faktentabellen und beschreibenden Kontext in Dimensionen. Häufige Aggregationen werden explizit.
3. **Snowflake-Schema**, normalisiert Teile des Dimensionsmodells. Kann Duplikation verringern, fügt aber Joins und Zuständigkeitsgrenzen hinzu.
4. **One Big Table (OBT) / breite Tabelle**, materialisiert eine leseorientierte Projektion. Kann Joins zur Abfragezeit vermeiden, erhöht aber Build-Kosten, Duplikation und Folgen von Schemaänderungen. Column Pruning senkt Lese-I/O ungenutzter Spalten, macht Speicher und Wartung nicht kostenlos.
5. **Data Vault**, trennt Geschäftsschlüssel, Beziehungen und beschreibende Historie in Hubs, Links und Satellites. Betont Nachverfolgbarkeit und parallele Ingestion, benötigt gewöhnlich nachgelagerte Präsentationsmodelle.`,
    },
    {
      id: "s2",
      title: "Das Sternschema",
      content: `Ein Kimball-Sternschema setzt eine oder mehrere **Faktentabellen** auf eine deklarierte Granularität und verbindet sie mit **Dimensionstabellen** für beschreibenden Kontext. Eine Faktzeile enthält häufig Dimensionsschlüssel und Messwerte, kann je nach Modell aber auch Zeitstempel, Statusfelder oder degenerierte Dimensionen enthalten.

Eine Abfrage wie *„Umsatz nach Kategorie summieren und nach Land sowie Zeitraum filtern“* kann eine Vertriebsfaktentabelle mit Produkt-, Kunden- und Datumsdimension verbinden. Das Modell ist nützlich, wenn Definitionen und Granularitäten konsistent verwaltet werden.

Zwei verbreitete Muster:

- **SCD Type 2 (Slowly Changing Dimensions).** Bei einer Attributänderung wird eine versionierte Dimensionszeile mit Gültigkeitsgrenzen eingefügt. Ein historischer Fakt verbindet sich mit der zum Ereigniszeitpunkt gültigen Version. Die modellierte Historie bleibt nur erhalten, wenn Gültigkeitsgrenzen und verspätete Korrekturen konsistent behandelt werden.
- **Ersatzschlüssel.** Ein vom Warehouse kontrollierter Schlüssel kann Dimensionsversionen von geänderten oder wiederverwendeten Quellidentitäten entkoppeln. Stabile natürliche Schlüssel können ebenfalls passen; die Wahl folgt Quellsemantik und Integrationsanforderungen.`,
      keyTakeaway:
        "Zuerst die Faktgranularität deklarieren; versionierte Dimensionen und Ersatzschlüssel nur verwenden, wenn ihr Historien- oder Integrationsnutzen erforderlich ist.",
    },
    {
      id: "s3",
      title: "Zeilen gegen Spalten",
      content: `Zeilenorientierte Engines halten die Felder eines Datensatzes nah beieinander; Parquet gruppiert Werte innerhalb von Row Groups nach Spalten. Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf kleine feste Layouts an und zählt die ausgewählten Zellen. Es ist kein Datenbankbenchmark.

Ein Zeilenlayout passt häufig zu Schlüsselzugriffen und Änderungen, die viele Felder weniger Datensätze benötigen. Ein Spaltenlayout passt häufig zu Scans, die wenige Felder vieler Datensätze benötigen. Indizes, Kompression, Cache, Ausführungs-Engine und Lastform können das Ergebnis verändern.`,
    },
    {
      id: "s4",
      title: "Dualität von Stream und Tabelle",
      content: `Ein Änderungslog kann in eine aktuelle Zustandstabelle gefaltet werden; Änderungen einer Tabelle lassen sich manchmal als Stream darstellen. Diese Beziehung ist nützlich, aber beide Darstellungen sind ohne Verträge zu Schlüsseln, Ordnung, Aufbewahrung, Löschung und Schemaentwicklung nicht austauschbar.

- Ein **Änderungsstream** kann \`user 42 set country=US\`, danach \`UK\` und danach \`CA\` erfassen.
- Eine **materialisierte Tabelle** kann nur das ausgewählte aktuelle Ergebnis behalten: \`user 42 → CA\`.

Datenbank-Transaktionslogs und Tabellenspeicher gehören zu diesem Muster, ihre Wiederherstellungssemantik ist aber Engine-spezifisch. Kafka Log Compaction behält gemäß Kompaktierungs- und Tombstone-Regeln mindestens den neuesten Datensatz je Schlüssel; sie macht aus einem Topic keine vollständig eingeschränkte Datenbanktabelle.

Frage, ob Consumer geordnete Historie, aktuellen Zustand oder beides benötigen und wie eine Darstellung aus der anderen neu aufgebaut und geprüft wird.`,
      keyTakeaway:
        "Ein Änderungsstream kann aktuellen Zustand nur materialisieren, wenn Schlüssel, Ordnung, Aufbewahrung, Löschung und Replay definiert sind.",
    },
    {
      id: "s5",
      title: "Data Vault",
      content: `Data Vault ist ein Ansatz zur Integration mehrerer Quellen unter Erhalt von Quelle, Ladezeit, Schlüssel, Beziehung und beschreibender Historie. Das Modell unterstützt Audit-Arbeit; Prüfbarkeit hängt trotzdem von unveränderlicher Quellevidenz, Zugriffskontrollen, Lineage, Aufbewahrung und Reconciliation ab.

Seine Kernstrukturen:

1. **Hub.** Ein eindeutiger Geschäftsschlüssel mit Quell- und Lademetadaten, etwa \`hub_customer(customer_hk, customer_id, load_dts, rec_src)\`.
2. **Link.** Eine Beziehung zwischen Hub-Schlüsseln, etwa \`link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)\`.
3. **Satellite.** Beschreibende Attribute und ihre Ladehistorie für Hub oder Link, etwa \`sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)\`.

Raw-Vault-Muster sind häufig insert-orientiert. Hash-Kollisionen, doppelte Quellereignisse, verspätete Daten, Effectivity-Regeln und parallele Ladevorgänge benötigen trotzdem explizite Idempotenz und Konfliktbehandlung. Business Vault und Präsentationsschichten ergänzen abgeleitete Regeln und nutzbare Abfragemodelle.

Wähle diese Struktur, wenn Nachverfolgbarkeit und Mehrquellenintegration zusätzliche Objekte und Transformationsschichten rechtfertigen. Für eine kleinere Domäne mit stabilen Quellen und direkten Analyseanforderungen kann ein einfacheres normalisiertes oder dimensionales Modell leichter zu betreiben sein.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zum gelesenen Abschnitt.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Konforme Dimension**, eine Dimension mit gemeinsamen Schlüsseln und Definitionen über Faktentabellen, sodass kompatible Messwerte vergleichbar sind.
- **Granularität**, was eine Faktzeile darstellt. Wähle die feinste für nachgelagerte Fragen erforderliche und bei erwarteter Last tragfähige Granularität.
- **Ersatzschlüssel**, eine vom Warehouse kontrollierte Identität zur Trennung von Dimensionsversionen oder Integration wechselnder Quellschlüssel. Er ist eine Entwurfsoption, keine universelle Pflicht.
- **Brückentabelle**, bildet eine n:m-Beziehung ab, etwa \`fact_orders ↔ bridge_order_promo ↔ dim_promo\`.
- **Materialisierte Sicht**, speichert ein Abfrageergebnis und aktualisiert es nach einer Engine-spezifischen Regel; Consumer müssen Freshness und Verhalten bei Refresh-Fehlern verstehen.
- **Data-Vault-Hub**, speichert eindeutige Geschäftsschlüssel mit Lade- und Quellmetadaten. Paralleles Laden benötigt weiterhin deterministische Schlüssel und Duplikatbehandlung.
- **Data-Vault-Satellite**, speichert beschreibende Attribute über Ladezeit. Aktuelle Zustandsabfragen hängen von gewählter Effectivity- und End-Dating-Regel ab.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Wann passt OBT?",
      question:
        'Das ML-Team verlangt eine "Featuretabelle": Jede Zeile beschreibt eine Person und enthält 800 Spalten mit vorberechneten Signalen. Soll die Tabelle als Sternschema oder als One Big Table modelliert werden?',
      options: [
        "Sternschema. Daten sollten immer normalisiert werden.",
        "Eine leseoptimierte breite Projektion kann passen, wenn Consumer viele Features je Person abrufen. Aktualisierungskosten, Zuständigkeit, Point-in-Time-Korrektheit und Column Pruning der Serving Engine müssen geprüft werden.",
        "Snowflake-Schema, um Speicher zu sparen.",
        "Data Vault, um die Prüfbarkeit sicherzustellen.",
      ],
      explanation:
        "Eine breite Projektion kann wiederholte Joins zur Abfragezeit für Feature Serving vermeiden. Sie hat weiterhin Kosten für Speicher, Neuberechnung, Schema, Zuständigkeit und Point-in-Time-Korrektheit. Benchmarke Engine und Zugriffspfad, statt kostenlose Joins oder ungenutzte Spalten anzunehmen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "SCD2 in der Praxis",
      question:
        "Eine Person registriert sich in US (1. Januar), zieht nach UK (1. Juni), kauft am 1. März und erneut am 1. September. Mit Dimensionen vom Typ SCD Type 2 wird die Bestellung im März mit country=___ und die Bestellung im September mit country=___ verknüpft:",
      options: [
        "US, US, das Land wird bei der Registrierung festgeschrieben.",
        "UK, UK, Berichte zeigen immer das aktuelle Land.",
        "US, UK, genau dafür dient SCD2: Die Bestellung verknüpft sich mit der Dimensionszeile, die zum Bestellzeitpunkt gültig war.",
        "NULL, UK, die Historie geht verloren.",
      ],
      explanation:
        "SCD Type 2 bewahrt Versionen mit Gültigkeitszeitraum. Bei korrekten Grenzen und Behandlung verspäteter Änderungen verbindet sich der Fakt mit der zum Ereigniszeitpunkt gültigen Version: US im März und UK im September.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Konforme Dimension",
          q: "Was ist eine konforme Dimension?",
          a: "Eine Dimension, deren Schlüssel und Definitionen mehrere kompatible Faktentabellen teilen. Faktenübergreifende Analyse funktioniert nur, wenn Granularität, Kennzahlen und Join-Verhalten ebenfalls abgestimmt sind.",
        },
        {
          term: "Granularität",
          q: "Was bezeichnet die Granularität einer Faktentabelle?",
          a: 'Was eine Faktzeile darstellt. "Eine Zeile pro Bestellposition" ist feiner als "eine Zeile pro Bestellung". Wähle die feinste für nachgelagerte Fragen erforderliche und beim erwarteten Volumen tragfähige Granularität.',
        },
        {
          term: "Ersatzschlüssel",
          q: "Warum eignen sich natürliche Schlüssel nicht?",
          a: "Ein vom Warehouse kontrollierter Schlüssel kann Dimensionsversionen trennen und vor wechselnden Quellschlüsseln schützen. Stabile natürliche Schlüssel können bei kontrollierter Semantik ebenfalls gültig sein.",
        },
        {
          term: "Brückentabelle",
          q: "Wann wird sie benötigt?",
          a: "Sie bildet eine kontrollierte n:m-Beziehung zwischen Fakt und Dimension ab, etwa fact_orders ↔ bridge_order_promo ↔ dim_promo. Zusätzlich zur Join-Struktur im Stil von 3NF können Allokationsregeln und Gültigkeitszeiträume nötig sein.",
        },
        {
          term: "Materialisierte Sicht",
          q: "Wie unterscheidet sie sich von einer normalen Sicht?",
          a: "Eine normale Sicht speichert eine Abfragedefinition. Eine materialisierte Sicht speichert Ergebnisse unter einem Engine-spezifischen Refresh- und Konsistenzmodell; Consumer müssen Datenalter und Fehlerverhalten kennen.",
        },
        {
          term: "Data-Vault-Hub",
          q: "Was enthält ein Hub?",
          a: "Ein Hub speichert einen eindeutigen Geschäftsschlüssel sowie Lade- und Quellmetadaten. Mehrere Quellen können ihn verwenden, wenn Schlüsselstandardisierung, Kollisionsbehandlung und Duplikatverhalten definiert sind.",
        },
        {
          term: "Data-Vault-Satellite",
          q: "Wie bleibt die Historie erhalten?",
          a: "Satellites speichern beschreibende Attribute über Ladezeit. Einfügeorientierte Muster bewahren Versionen; aktueller Zustand und Audit-Aussagen hängen weiterhin von Gültigkeitsregel, Lineage, Aufbewahrung und Kontrollen ab.",
        },
      ],
    },
  ],
  preserve: ["Data Vault"],
});
