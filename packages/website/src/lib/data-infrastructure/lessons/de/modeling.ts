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
      content: `„Wie modellieren wir das?“ Ohne Kontext hat die Frage keine Antwort. Erst kommen Schreibverhalten, Abfragemuster, benötigte Historie, Zuständigkeit und Änderungshäufigkeit. Dann eine Einteilung, die trägt:

1. **3NF / normalisiert**, speichert Fakten mit kontrollierter Redundanz. Trägt transaktionale Änderungen und Integritätsregeln; breitere Lesevorgänge zahlen mit Joins.
2. **Sternschema nach Kimball**, legt analytische Ereignisse oder Messwerte in Faktentabellen und beschreibenden Kontext in Dimensionen. Häufige Aggregationen werden explizit.
3. **Snowflake-Schema**, normalisiert Teile des Dimensionsmodells. Weniger Duplikation, dafür mehr Joins und Zuständigkeitsgrenzen.
4. **One Big Table (OBT) / breite Tabelle**, materialisiert eine leseorientierte Projektion. Kann Joins zur Abfragezeit sparen; Build-Kosten, Duplikation und Folgen von Schemaänderungen steigen. Column Pruning spart Lese-I/O für ungenutzte Spalten, nicht Speicher und Wartung.
5. **Data Vault**, trennt Geschäftsschlüssel, Beziehungen und beschreibende Historie in Hubs, Links und Satellites. Stark bei Nachverfolgbarkeit und paralleler Ingestion; nachgelagerte Präsentationsmodelle braucht es meist trotzdem.`,
    },
    {
      id: "s2",
      title: "Das Sternschema",
      content: `Ein Kimball-Sternschema setzt eine oder mehrere **Faktentabellen** auf eine deklarierte Granularität und hängt **Dimensionstabellen** mit beschreibendem Kontext daran. Eine Faktzeile trägt meist Dimensionsschlüssel und Messwerte; Zeitstempel, Statusfelder oder degenerierte Dimensionen sind erlaubt, wenn das Modell sie braucht.

*„Umsatz nach Kategorie summieren, nach Land und Zeitraum filtern“*: Diese Abfrage joint eine Vertriebsfaktentabelle mit Produkt-, Kunden- und Datumsdimension. Das funktioniert, solange Definitionen und Granularitäten konsistent verwaltet werden.

Zwei Muster sind dabei verbreitet.

- **SCD Type 2 (Slowly Changing Dimensions).** Ändert sich ein Attribut, kommt eine versionierte Dimensionszeile mit Gültigkeitsgrenzen dazu. Ein historischer Fakt joint auf die Version, die zu seinem Ereigniszeitpunkt galt. Die Historie überlebt nur, wenn Gültigkeitsgrenzen und verspätete Korrekturen konsistent behandelt werden.
- **Ersatzschlüssel.** Ein Schlüssel unter Kontrolle des Warehouse kann Dimensionsversionen von geänderten oder wiederverwendeten Quellidentitäten entkoppeln. Stabile natürliche Schlüssel können trotzdem passen; das entscheiden Quellsemantik und Integrationsanforderungen.`,
      keyTakeaway:
        "Zuerst die Faktgranularität deklarieren. Versionierte Dimensionen und Ersatzschlüssel kommen erst dazu, wenn Historie oder Integration sie verlangen.",
    },
    {
      id: "s3",
      title: "Zeilen gegen Spalten",
      content: `Eine zeilenorientierte Engine hält die Felder eines Datensatzes beieinander; Parquet gruppiert Werte innerhalb von Row Groups nach Spalten. Das interaktive Modell wendet \`SELECT SUM(amount) WHERE country='US'\` auf kleine feste Layouts an und zählt die Zellen, die es anfasst. Ein Datenbankbenchmark ist das nicht.

Ein Zeilenlayout passt meist zu Schlüsselzugriffen und Änderungen, die viele Felder weniger Datensätze brauchen. Ein Spaltenlayout passt meist zu Scans, die wenige Felder vieler Datensätze brauchen. Indizes, Kompression, Cache, Ausführungs-Engine und Lastform können das Bild drehen.`,
    },
    {
      id: "s4",
      title: "Dualität von Stream und Tabelle",
      content: `Ein Änderungslog lässt sich zu einer Tabelle mit aktuellem Zustand falten. Die Änderungen einer Tabelle lassen sich manchmal als Stream darstellen. Nützlich, aber ohne Verträge zu Schlüsseln, Ordnung, Aufbewahrung, Löschung und Schemaentwicklung sind beide Darstellungen nicht austauschbar.

- Ein **Änderungsstream** kann \`user 42 set country=US\` festhalten, danach \`UK\`, danach \`CA\`.
- Eine **materialisierte Tabelle** behält unter Umständen nur das aktuelle Ergebnis: \`user 42 → CA\`.

Datenbank-Transaktionslogs und Tabellenspeicher folgen demselben Muster; ihre Wiederherstellungssemantik ist Engine-spezifisch. Kafka Log Compaction behält nach Kompaktierungs- und Tombstone-Regeln mindestens den neuesten Datensatz je Schlüssel. Eine vollständig eingeschränkte Datenbanktabelle wird aus dem Topic dadurch nicht.

Frag, ob Consumer geordnete Historie brauchen, aktuellen Zustand oder beides. Und wie eine Darstellung aus der anderen neu gebaut und geprüft wird.`,
      keyTakeaway:
        "Ein Änderungsstream kann aktuellen Zustand nur materialisieren, wenn Schlüssel, Ordnung, Aufbewahrung, Löschung und Replay definiert sind.",
    },
    {
      id: "s5",
      title: "Data Vault",
      content: `Data Vault integriert mehrere Quellen und behält dabei Quelle, Ladezeit, Schlüssel, Beziehung und beschreibende Historie. Das hilft bei Audits. Prüfbar wird ein System trotzdem erst durch unveränderliche Quellevidenz, Zugriffskontrollen, Lineage, Aufbewahrung und Reconciliation.

Drei Kernstrukturen tragen das Modell.

1. **Hub.** Ein eindeutiger Geschäftsschlüssel mit Quell- und Lademetadaten, etwa \`hub_customer(customer_hk, customer_id, load_dts, rec_src)\`.
2. **Link.** Eine Beziehung zwischen Hub-Schlüsseln, etwa \`link_order_product(order_product_hk, order_hk, product_hk, load_dts, rec_src)\`.
3. **Satellite.** Beschreibende Attribute samt Ladehistorie für einen Hub oder Link, etwa \`sat_customer_details(customer_hk, load_dts, load_end_dts, email, country, rec_src)\`.

Raw-Vault-Muster sind meist insert-orientiert. Hash-Kollisionen, doppelte Quellereignisse, verspätete Daten, Effectivity-Regeln und parallele Ladevorgänge brauchen trotzdem explizite Idempotenz und Konfliktbehandlung. Business Vault und Präsentationsschichten liefern abgeleitete Regeln und nutzbare Abfragemodelle obendrauf.

Wähle diese Struktur, wenn Nachverfolgbarkeit und Mehrquellenintegration die zusätzlichen Objekte und Transformationsschichten wert sind. Für eine kleine Domäne mit stabilen Quellen und direkten Analysefragen kann ein normalisiertes oder dimensionales Modell leichter zu betreiben sein.`,
    },
    {
      id: "s6",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu breiter Tabelle und Historie.",
    },
    {
      id: "s7",
      title: "Begriffe",
      content: `- **Konforme Dimension**, eine Dimension, deren Schlüssel und Definitionen mehrere Faktentabellen teilen; so werden kompatible Messwerte vergleichbar.
- **Granularität**, was eine Faktzeile darstellt. Nimm die feinste, die nachgelagerte Fragen brauchen und die erwartete Last trägt.
- **Ersatzschlüssel**, eine Identität unter Kontrolle des Warehouse, um Dimensionsversionen zu trennen oder wechselnde Quellschlüssel zu integrieren. Eine Entwurfsoption, keine Pflicht.
- **Brückentabelle**, bildet eine n:m-Beziehung ab, etwa \`fact_orders ↔ bridge_order_promo ↔ dim_promo\`.
- **Materialisierte Sicht**, speichert ein Abfrageergebnis und frischt es nach einer Engine-spezifischen Regel auf. Consumer müssen Freshness und Verhalten bei Refresh-Fehlern kennen.
- **Data-Vault-Hub**, speichert eindeutige Geschäftsschlüssel mit Lade- und Quellmetadaten. Paralleles Laden braucht weiterhin deterministische Schlüssel und Duplikatbehandlung.
- **Data-Vault-Satellite**, speichert beschreibende Attribute über die Ladezeit. Was „aktueller Zustand“ heißt, entscheidet die gewählte Effectivity- und End-Dating-Regel.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Wann passt OBT?",
      question:
        'Das ML-Team will eine "Featuretabelle": eine Zeile pro Person, 800 Spalten mit vorberechneten Signalen. Sternschema oder One Big Table?',
      options: [
        "Sternschema. Normalisieren, immer.",
        "Eine leseoptimierte breite Projektion kann passen, wenn Consumer viele Features je Person abrufen. Prüf Aktualisierungskosten, Zuständigkeit, Point-in-Time-Korrektheit und ob die Serving Engine ungenutzte Spalten wegschneidet.",
        "Snowflake-Schema, um Speicher zu sparen.",
        "Data Vault, wegen der Prüfbarkeit.",
      ],
      explanation:
        "Eine breite Projektion kann dem Feature Serving die wiederholten Joins zur Abfragezeit ersparen. Bezahlt wird trotzdem: Speicher, Neuberechnung, Schema, Zuständigkeit, Point-in-Time-Korrektheit. Benchmarke Engine und Zugriffspfad, statt Joins oder ungenutzte Spalten für kostenlos zu halten.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "SCD2 in der Praxis",
      question:
        "Eine Person registriert sich in US (1. Januar), zieht nach UK (1. Juni), kauft am 1. März und noch einmal am 1. September. Mit SCD Type 2 joint die März-Bestellung auf country=___ und die September-Bestellung auf country=___:",
      options: [
        "US, US, das Land wird bei der Registrierung festgeschrieben.",
        "UK, UK, Berichte zeigen immer das aktuelle Land.",
        "US, UK, genau dafür gibt es SCD2: Die Bestellung joint auf die Dimensionszeile, die zum Bestellzeitpunkt galt.",
        "NULL, UK, die Historie geht verloren.",
      ],
      explanation:
        "SCD Type 2 hält Versionen mit Gültigkeitszeitraum. Stimmen die Grenzen und die Behandlung verspäteter Änderungen, joint der Fakt auf die Version zum Ereigniszeitpunkt: US im März, UK im September.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "Konforme Dimension",
          q: "Was ist eine konforme Dimension?",
          a: "Eine Dimension, deren Schlüssel und Definitionen mehrere kompatible Faktentabellen teilen. Faktenübergreifend analysieren kannst du nur, wenn auch Granularität, Kennzahlen und Join-Verhalten zusammenpassen.",
        },
        {
          term: "Granularität",
          q: "Was bezeichnet die Granularität einer Faktentabelle?",
          a: 'Was eine Faktzeile darstellt. "Eine Zeile pro Bestellposition" ist feiner als "eine Zeile pro Bestellung". Nimm die feinste, die nachgelagerte Fragen brauchen und das erwartete Volumen trägt.',
        },
        {
          term: "Ersatzschlüssel",
          q: "Warum eignen sich natürliche Schlüssel nicht?",
          a: "Ein Schlüssel unter Kontrolle des Warehouse kann Dimensionsversionen trennen und das Modell vor wechselnden Quellschlüsseln abschirmen. Stabile natürliche Schlüssel bleiben gültig, solange ihre Semantik kontrolliert ist.",
        },
        {
          term: "Brückentabelle",
          q: "Wann wird sie benötigt?",
          a: "Sie bildet eine kontrollierte n:m-Beziehung zwischen Fakt und Dimension ab, etwa fact_orders ↔ bridge_order_promo ↔ dim_promo. Neben der Join-Struktur im Stil von 3NF kommen unter Umständen Allokationsregeln und Gültigkeitszeiträume dazu.",
        },
        {
          term: "Materialisierte Sicht",
          q: "Wie unterscheidet sie sich von einer normalen Sicht?",
          a: "Eine normale Sicht speichert eine Abfragedefinition. Eine materialisierte Sicht speichert Ergebnisse unter einem Engine-spezifischen Refresh- und Konsistenzmodell. Consumer müssen Datenalter und Fehlerverhalten kennen.",
        },
        {
          term: "Data-Vault-Hub",
          q: "Was enthält ein Hub?",
          a: "Einen eindeutigen Geschäftsschlüssel plus Lade- und Quellmetadaten. Mehrere Quellen dürfen darauf zielen, sobald Schlüsselstandardisierung, Kollisionsbehandlung und Duplikatverhalten definiert sind.",
        },
        {
          term: "Data-Vault-Satellite",
          q: "Wie bleibt die Historie erhalten?",
          a: "Satellites speichern beschreibende Attribute über die Ladezeit. Insert-orientierte Muster bewahren Versionen. Aktueller Zustand und Audit-Aussagen hängen trotzdem an Gültigkeitsregel, Lineage, Aufbewahrung und Kontrollen.",
        },
      ],
    },
  ],
  preserve: ["Data Vault"],
});
