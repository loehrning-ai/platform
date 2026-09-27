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
      content: `Kein Datenmodell passt zu jedem Kontext. Geh von Schreibverhalten, Abfragemustern, benötigter Historie, Zuständigkeit und Änderungshäufigkeit aus.

1. **3NF / normalisiert**, speichert Fakten mit kontrollierter Redundanz. Transaktionale Änderungen und Integritätsregeln werden leichter; breite Lesevorgänge zahlen mit Joins.
2. **Sternschema nach Kimball**, legt analytische Ereignisse oder Messwerte in Faktentabellen und beschreibenden Kontext in Dimensionen, sodass häufige Aggregationen explizit werden.
3. **Snowflake-Schema**, normalisiert Teile der Dimensionen, mit weniger Duplikation, aber mehr Joins und Zuständigkeitsgrenzen.
4. **One Big Table (OBT) / breite Tabelle**, materialisiert eine leseorientierte Projektion. Sie spart Joins zur Abfragezeit und erhöht Build-Kosten, Duplikation und Folgen von Schemaänderungen; Column Pruning spart Lese-I/O, keinen Speicher und keine Wartung.
5. **Data Vault**, trennt Geschäftsschlüssel, Beziehungen und beschreibende Historie in Hubs, Links und Satellites. Es stärkt Nachverfolgbarkeit und parallele Ingestion und braucht meist nachgelagerte Präsentationsmodelle.`,
    },
    {
      id: "s2",
      title: "Das Sternschema",
      content: `Ein Kimball-Sternschema beginnt mit einer deklarierten Granularität. Eine oder mehrere **Faktentabellen** auf dieser Granularität hängen an **Dimensionstabellen** mit beschreibendem Kontext. Eine Faktzeile trägt meist Dimensionsschlüssel und Messwerte, bei Bedarf auch Zeitstempel, Statusfelder oder degenerierte Dimensionen.

Eine Abfrage wie *„Umsatz nach Kategorie summieren, nach Land und Zeitraum filtern“* joint eine Vertriebsfaktentabelle mit Produkt-, Kunden- und Datumsdimension. Das funktioniert, solange Definitionen und Granularitäten konsistent bleiben.

- **SCD Type 2 (Slowly Changing Dimensions).** Ändert sich ein Attribut, kommt eine versionierte Dimensionszeile mit Gültigkeitsgrenzen dazu. Ein historischer Fakt joint auf die Version, die zu seinem Ereigniszeitpunkt galt, sofern Gültigkeitsgrenzen und verspätete Korrekturen konsistent behandelt werden.
- **Ersatzschlüssel.** Ein Schlüssel unter Kontrolle des Warehouse entkoppelt Dimensionsversionen von geänderten oder wiederverwendeten Quell-IDs. Stabile natürliche Schlüssel können trotzdem passen, je nach Quellsemantik und Integrationsbedarf.`,
    },
    {
      id: "s3",
      title: "Zeilen gegen Spalten",
      content: `Eine zeilenorientierte Engine hält die Felder eines Datensatzes beieinander; Parquet gruppiert Werte innerhalb von Row Groups nach Spalten. Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf kleine feste Layouts an und zählt die Zellen, die es anfasst. Ein Datenbankbenchmark ist das nicht.

Zeilenlayouts passen oft zu Schlüsselzugriffen und Änderungen vieler Felder weniger Datensätze, Spaltenlayouts zu Scans weniger Felder über viele Datensätze. Indizes, Kompression, Cache, Engine und Lastform können das umdrehen.`,
    },
    {
      id: "s4",
      title: "Dualität von Stream und Tabelle",
      content: `Ein Änderungslog lässt sich zu einer Tabelle mit aktuellem Zustand falten, und die Änderungen einer Tabelle lassen sich manchmal als Stream darstellen. Austauschbar sind beide nur mit Verträgen zu Schlüsseln, Ordnung, Aufbewahrung, Löschung und Schemaentwicklung.

- Ein **Änderungsstream** kann \`user 42 set country=US\` festhalten, danach \`UK\`, danach \`CA\`.
- Eine **materialisierte Tabelle** behält vielleicht nur das aktuelle Ergebnis: \`user 42 → CA\`.

Datenbank-Transaktionslogs und Tabellenspeicher folgen diesem Muster mit Engine-spezifischer Wiederherstellungssemantik. Kafka Log Compaction behält nach Kompaktierungs- und Tombstone-Regeln mindestens den neuesten Datensatz je Schlüssel, und dem Topic fehlen trotzdem die Constraints einer Datenbanktabelle.

Frag, ob Consumer geordnete Historie, aktuellen Zustand oder beides brauchen, und wie du eine Darstellung aus der anderen neu baust und prüfst.`,
    },
    {
      id: "s5",
      title: "Data Vault",
      content: `Data Vault integriert mehrere Quellen und behält Quelle, Ladezeit, Schlüssel, Beziehungen und beschreibende Historie. Das hilft bei Audits; prüfbar wird ein System aber erst durch unveränderliche Quellbelege, Zugriffskontrollen, Lineage, Aufbewahrung und Reconciliation.

1. **Hub.** Ein eindeutiger Geschäftsschlüssel mit Quell- und Lademetadaten, etwa \`hub_customer(customer_hk, customer_id, load_dts, rec_src)\`.
2. **Link.** Eine Beziehung zwischen Hub-Schlüsseln, etwa \`link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)\`.
3. **Satellite.** Beschreibende Attribute samt Ladehistorie für einen Hub oder Link, etwa \`sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)\`.

Raw-Vault-Ladevorgänge sind meist insert-orientiert. Hash-Kollisionen, doppelte Quellereignisse, verspätete Daten, Effectivity-Regeln und parallele Ladevorgänge brauchen trotzdem explizite Idempotenz und Konfliktbehandlung. Business Vault und Präsentationsschichten ergänzen abgeleitete Regeln und nutzbare Abfragemodelle.

Nimm Data Vault, wenn Nachverfolgbarkeit und Mehrquellenintegration die zusätzlichen Objekte und Schichten rechtfertigen. Eine kleine Domäne mit stabilen Quellen und direkten Analysefragen läuft mit einem normalisierten oder dimensionalen Modell leichter.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu breiter Tabelle und Historie.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Konforme Dimension**, eine Dimension, deren Schlüssel und Definitionen mehrere Faktentabellen teilen.
- **Granularität**, was eine Faktzeile darstellt.
- **Ersatzschlüssel**, eine Identität unter Kontrolle des Warehouse für Dimensionsversionen oder wechselnde Quellschlüssel.
- **Brückentabelle**, eine n:m-Verbindung, etwa \`fact_orders ↔ bridge_order_promo ↔ dim_promo\`.
- **Materialisierte Sicht**, ein gespeichertes Abfrageergebnis mit Engine-spezifischer Refresh-Regel.
- **Data-Vault-Hub**, eindeutige Geschäftsschlüssel mit Lade- und Quellmetadaten.
- **Data-Vault-Satellite**, beschreibende Attribute über die Ladezeit.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Wann passt OBT?",
      question:
        'Das ML-Team will eine "Featuretabelle" mit einer Zeile pro Person und 800 Spalten vorberechneter Signale. Sternschema oder One Big Table?',
      options: [
        "Sternschema. Normalisieren, immer.",
        "Eine breite Projektion, wenn Consumer viele Features je Person abrufen.",
        "Snowflake-Schema, um Speicher zu sparen.",
        "Data Vault, wegen der Prüfbarkeit.",
      ],
      explanation:
        "Eine breite Projektion spart dem Feature Serving wiederholte Joins zur Abfragezeit. Prüf Aktualisierungskosten, Zuständigkeit, Point-in-Time-Korrektheit und ob die Engine ungenutzte Spalten wegschneidet, und miss den echten Zugriffspfad.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "SCD2 in der Praxis",
      question:
        "Eine Person registriert sich in US (1. Januar) und zieht nach UK (1. Juni). Sie kauft am 1. März und am 1. September. Mit SCD Type 2 joint die März-Bestellung auf country=___ und die September-Bestellung auf country=___:",
      options: [
        "US, US; das Land steht ab der Registrierung fest.",
        "UK, UK; Berichte zeigen immer das aktuelle Land.",
        "US, UK; SCD2 joint jede Bestellung auf die damals gültige Zeile.",
        "NULL, UK; die Historie geht verloren.",
      ],
      explanation:
        "SCD Type 2 hält Versionen mit Gültigkeitszeitraum. Stimmen Grenzen und Behandlung verspäteter Änderungen, joint jeder Fakt auf die Version zum Ereigniszeitpunkt, also US im März und UK im September.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Konforme Dimension",
          q: "Was ist eine konforme Dimension?",
          a: "Ihre Schlüssel und Definitionen teilen sich mehrere kompatible Faktentabellen. Faktenübergreifende Analyse braucht zusätzlich passende Granularität, Kennzahlen und Join-Verhalten.",
        },
        {
          term: "Granularität",
          q: "Was bezeichnet die Granularität einer Faktentabelle?",
          a: 'Was eine Faktzeile darstellt. "Eine Zeile pro Bestellposition" ist feiner als "eine Zeile pro Bestellung". Nimm die feinste, die deine Fragen brauchen und dein Volumen trägt.',
        },
        {
          term: "Ersatzschlüssel",
          q: "Warum eignen sich natürliche Schlüssel nicht?",
          a: "Ein Schlüssel unter Kontrolle des Warehouse trennt Dimensionsversionen und schirmt das Modell vor wechselnden Quellschlüsseln ab. Stabile natürliche Schlüssel bleiben gültig, solange ihre Semantik kontrolliert ist.",
        },
        {
          term: "Brückentabelle",
          q: "Wann wird sie benötigt?",
          a: "Für eine kontrollierte n:m-Beziehung, etwa fact_orders ↔ bridge_order_promo ↔ dim_promo. Neben dem Join im Stil von 3NF brauchst du eventuell Allokationsregeln und Gültigkeitszeiträume.",
        },
        {
          term: "Materialisierte Sicht",
          q: "Wie unterscheidet sie sich von einer normalen Sicht?",
          a: "Eine normale Sicht speichert eine Abfragedefinition, eine materialisierte Sicht Ergebnisse unter einem Engine-spezifischen Refresh-Modell. Consumer müssen Datenalter und Fehlerverhalten kennen.",
        },
        {
          term: "Data-Vault-Hub",
          q: "Was enthält ein Hub?",
          a: "Einen eindeutigen Geschäftsschlüssel plus Lade- und Quellmetadaten. Mehrere Quellen können einen Hub speisen, sobald Schlüsselstandardisierung, Kollisionen und Duplikate geregelt sind.",
        },
        {
          term: "Data-Vault-Satellite",
          q: "Wie bleibt die Historie erhalten?",
          a: "Beschreibende Attribute, gespeichert über die Ladezeit. Inserts bewahren Versionen; aktueller Zustand und Audit-Aussagen hängen trotzdem an Gültigkeitsregel, Lineage, Aufbewahrung und Kontrollen.",
        },
      ],
    },
  ],
  preserve: ["Data Vault"],
});
