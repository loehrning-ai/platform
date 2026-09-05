import canonical from "../sla-quality";
import { localizeDataInfraLessonToGerman } from "../../translate-lesson";

export default localizeDataInfraLessonToGerman(canonical, {
  title: "SLAs, Observability und Datenqualität",
  subtitle: "Freshness · Volumen · Drift · Lineage",
  hook: "Messbare Zuverlässigkeitsziele definieren, stille Datenfehler erkennen und Vorfälle anhand von Evidenz weiterleiten.",
  keyConcepts: [
    "Freshness",
    "Vollständigkeit",
    "Genauigkeit",
    "dbt-Tests",
    "Datenbeobachtbarkeit",
    "Lineage",
  ],
  sections: [
    {
      id: "s1",
      title: "Die drei Kennzahlen",
      content: `Infrastrukturmetriken beantworten eine Frage: Läuft der Job? Ob die Daten darin stimmen, beantwortet keine davon. Datenzuverlässigkeit braucht drei eigene Signale mit Bezug zur Nutzung.

- **Freshness.** Wie weit die verfügbaren Daten hinter der relevanten Fachzeit liegen. Ein brauchbares SLI vergleicht die letzte akzeptierte Ereigniszeit mit der aktuellen Zeit. Die Definition muss erwartete Quellaktivität, leere Zeiträume und verspätete Ereignisse aushalten.
- **Vollständigkeit.** Ob erwartete Datensätze oder Aggregate eingetroffen sind. Zeilenzahlen taugen im Vergleich mit einer passenden Basis als Näherungswert; sie beweisen nicht, dass jedes Ereignis ankam.
- **Genauigkeit.** Ob Werte Schema-, Bereichs-, Beziehungs- und Fachregeln erfüllen. Genauigkeit ist fachabhängig und braucht meist explizite Prüfungen.

Eine gestoppte Pipeline zeigt sich meist zuerst als Freshness-Fehler. Ein Transformationsfehler lässt Freshness gesund aussehen und beschädigt zugleich Vollständigkeit oder Genauigkeit. CPU- und Job-Erfolgsdiagramme trennen diese Fälle nicht.`,
      keyTakeaway:
        "Freshness, Vollständigkeit und Genauigkeit werden getrennt gemessen; ein erfolgreicher Job kann dennoch falsche Daten veröffentlichen.",
    },
    {
      id: "s2",
      title: "Zuverlässigkeitsmodell",
      content: `Das Modell unten zeigt, wie drei Fehlertypen die verfügbaren Signale verschieben. Seine Werte sind feste Beispiele, keine Produktionsschwellen. Ein grünes Dashboard sagt nur, dass die gemessenen Bedingungen innerhalb ihrer konfigurierten Grenzen liegen.

Jedes SLO folgt aus einem Nutzerbedarf, einem Messfenster, einem erlaubten Fehlerbudget und der Folge einer Verfehlung. Ein Finanzabschluss und ein exploratives Dashboard brauchen andere Definitionen für Freshness und Vollständigkeit. Prüfe Schwellenwerte gegen historisches Verhalten, bevor sie den Bereitschaftsdienst wecken.`,
    },
    {
      id: "s3",
      title: "Testfamilien",
      content: `| Familie | Erkennt | Typischer Zielkonflikt |
|---|---|---|
| Schema | ergänzte, entfernte oder neu typisierte Felder; geänderte Nullability | An einer Schnittstelle schnell, aber Kompatibilitätsregeln benötigen weiterhin Zuständigkeit |
| Constraint | Verstöße gegen Null-, Eindeutigkeits-, Beziehungs- und Bereichsregeln | Kosten steigen mit Tabellengröße, Abfrageform und Ausführungshäufigkeit |
| Anomalie / Volumen | unerwartete Änderungen von Anzahl oder Verteilung | Benötigt eine repräsentative Basis und Prüfung von Fehlalarmen |
| Reconciliation | Abweichungen zwischen unabhängig berechneten Summen oder Datensatzmengen | Starke Evidenz für eine definierte Invariante, scannt oder verbindet aber oft viele Daten |

Wähle Prüfungen an Geschäftsrisiko und Ausführungskosten. Prüfe Schnittstellen früh, werte große Datensätze begründet stichprobenartig oder inkrementell aus und heb teure Reconciliation für wichtige Invarianten auf. Keine Familie beweist allgemeine End-to-End-Korrektheit.`,
    },
    {
      id: "s4",
      title: "dbt-Tests",
      content: `\`\`\`yaml
# models/marts/fact_orders.yml
models:
  - name: fact_orders
    columns:
      - name: order_id
        tests: [unique, not_null]
      - name: amount_usd
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000000
      - name: status
        tests:
          - accepted_values:
              values: ['pending','paid','shipped','refunded','cancelled']
    tests:
      - dbt_utils.equal_rowcount:
          compare_model: ref('stg_orders')  # reconciliation
\`\`\`

Generische und singuläre dbt-Datentests sind Abfragen, deren Ergebniszeilen eine verletzte Annahme darstellen. Wann und wo sie laufen, hängt an Befehlen, Auswahlregeln, Adapter und CI-Konfiguration des Projekts. Das Beispiel prüft sinnvolle Invarianten. \`equal_rowcount\` gilt aber nur, wenn beide Modelle dieselbe Granularität und denselben Filterumfang haben. Behandle Tests als ausführbare Verträge mit Zuständigkeit, Schweregrad, Ausführungsrhythmus und dokumentierter Reaktion.`,
    },
    {
      id: "s5",
      title: "Deklarierte und gelernte Prüfungen",
      content: `Deklarierte Prüfungen kodieren bekannte Invarianten. Ein Schlüssel ist eindeutig, ein Betrag nicht negativ, eine Reconciliation-Abweichung bleibt innerhalb einer dokumentierten Toleranz. Sie sind prüfbar und deterministisch, erkennen aber nur zuvor festgelegte Bedingungen. Frameworks wie dbt-Datentests oder Great Expectations führen solche Prüfungen aus. Unterstützte Datenquellen, Orchestrierung und Berichte hängen an Version und Integration.

Gelernte Prüfungen schätzen erwartete Bereiche aus historischen Anzahlen, Nullraten oder Werteverteilungen. Sie machen unbekannte Änderungen sichtbar. Saisonalität, Produkteinführungen, Ausfälle und dünne Daten erzeugen dabei Fehlalarme. Kommerzielle und offene Observability-Produkte setzen unterschiedliche Varianten um.

Die Abdeckung folgt aus Anforderungen, nicht aus Produktkategorien:

- deklarierte Prüfungen für Verträge und Fachinvarianten;
- gelernte Prüfungen dort, wo historisches Verhalten aussagekräftig ist und jemand den Detektor justiert;
- festgelegte Profiling-Datasets, weil Stichproben und Diagnosen sensible Daten enthalten können;
- Bewertung von Alarmpräzision, Warehouse-Kosten, Zugriffskontrollen, Aufbewahrung, Lineage-Abdeckung und Exportierbarkeit mit repräsentativen Daten.

Beide Methoden ergänzen einander. Zwingend ist keine auf jeder Ebene.`,
    },
    {
      id: "s6",
      title: "Lineage und Alarme",
      content: `Eine Anomalie in \`fact_orders.amount_usd\` ist ein Symptom. Lineage grenzt die Untersuchung ein, indem sie deklarierte oder beobachtete Abhängigkeiten zwischen Jobs und Datasets zeigt. Welche Änderung den Fehler verursacht hat, beweist sie nicht; unvollständige Instrumentierung lässt wichtige Pfade aus.

Ein praktikabler Ablauf:

1. Für jedes wichtige Dataset oder Datenprodukt SLI, Ziel, Zuständigkeit und Reaktion definieren.
2. Test- und Pipeline-Ergebnisse mit stabilen Job- und Dataset-Identitäten ausgeben.
3. Lineage, letzte Deployments, Quellzustand und Stichproben-Reconciliation als Evidenz verwenden.
4. Den Alarm erst dann an das verantwortliche Team leiten, wenn die Evidenz die fehlerhafte Grenze zeigt; sonst an den zuständigen Triage-Pfad.

OpenLineage definiert ein Ereignismodell für Jobläufe, Datasets und erweiterbare Facets. Integrationen und ausgegebene Details unterscheiden sich nach Werkzeug und Version. Prüfe die tatsächlichen Ereignisse, bevor Routing oder Auswirkungsanalyse davon abhängen. Und schütze Lineage-Metadaten wie Betriebsinformationen: Namen, Query-Facets und Fehlerdetails legen interne Strukturen oder sensible Werte offen.`,
      keyTakeaway:
        "Lineage liefert Evidenz für die Untersuchung. Ein Alarm geht an das Team der nachweislich fehlerhaften Grenze, nicht pauschal an das nächstgelegene vorgelagerte System.",
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu stillen Fehlern und Alarmen.",
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **SLI / SLO / SLA**, ein SLI ist ein gemessenes Zuverlässigkeitssignal, ein SLO dessen Ziel in einem Zeitfenster und ein SLA eine Dienstvereinbarung mit möglichen Folgen.
- **Freshness**, die Verzögerung zwischen den für einen Consumer verfügbaren Daten und der von ihnen dargestellten Fachzeit; die Formel hängt am Quellverhalten.
- **Vollständigkeits-Näherungswert**, ein messbares Signal wie Anzahl, Abdeckungsquote oder Reconciliation-Abweichung; es beweist die Ankunft keines einzelnen Datensatzes.
- **Anomalieerkennung**, vergleicht Beobachtungen mit einem erwarteten Bereich und braucht Verwaltung von Fehlalarmen und Drift.
- **Datenvertrag**, eine versionierte Vereinbarung über Struktur, Semantik, Qualitätsziele, Zuständigkeit und Kompatibilität.
- **Deklarierte Prüfung**, eine explizite Invariante, die gegen Daten ausgewertet wird.
- **Gelernte Prüfung**, ein aus historischen Beobachtungen abgeleiteter erwarteter Bereich.
- **OpenLineage**, ein erweiterbares Ereignismodell für Job-, Lauf- und Dataset-Metadaten; die Abdeckung hängt an der Instrumentierung.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Der unauffällige Fehler",
      question:
        "Eine Pipeline meldet grün: Jobs erfolgreich, Latenz normal, keine Fehler. Das Marketing eskaliert, weil die Conversion-Rate seit drei Tagen falsch ist. Welche Ursache ist am wahrscheinlichsten?",
      options: [
        "Ein Fehler im Dashboard.",
        "Eine Regression bei Genauigkeit oder Vollständigkeit. Schema und Läufe wirken gesund, aber ein Join verliert Zeilen, eine Einheit ändert sich oder ein neuer Enum-Wert wird zu null. Standardmetriken erkennen das nicht; Reconciliation-Tests schon.",
        "CPU-Sättigung.",
        "Eine Netzwerkpartition.",
      ],
      explanation:
        "Erfolgreiche Jobs und normale Latenz validieren das Ergebnis nicht. Ein Enum-Wechsel, ein abweichendes Join-Schlüsselformat oder eine Einheitenumrechnung verändert die Ausgabe, ohne die Pipeline scheitern zu lassen. Ergänze eine Reconciliation, die Granularität und Bilanzregeln abbildet, und lass sie in einem durch Risiko und Kosten begründeten Rhythmus laufen.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Ziel der Alarmierung",
      question:
        "fact_orders fehlen heute 30% der erwarteten Zeilen. Die Lineage lautet fact_orders ← stg_orders ← raw_orders ← Postgres CDC. CDC hat seit vier Stunden keine Ereignisse geliefert. Welches Team wird alarmiert?",
      options: [
        "Das Team des dbt-Modells, weil dort der Test scheitert.",
        "Das Dashboard-Team, weil dort die Beschwerde entsteht.",
        "Das CDC- oder Quellsystemteam. Die Lücke entsteht an der Quelle; nachgelagerte Systeme bilden korrekt ab, dass nichts eingetroffen ist.",
        "Alle Teams gleichzeitig.",
      ],
      explanation:
        "Die Evidenz setzt die erste beobachtete Lücke an die CDC-Grenze. Deren Team untersucht also Connector und Quellzustand. Lineage grenzt die Suche ein; ob Connector, Zugangsdaten, Quelldatenbank oder Instrumentierung die Lücke verursacht haben, beweist sie nicht.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "SLA / SLO / SLI",
          q: "Wie lautet die Hierarchie?",
          a: "SLI ist ein gemessenes Zuverlässigkeitssignal. SLO ist sein Ziel in einem definierten Zeitfenster. SLA ist eine Dienstvereinbarung, die Folgen für Verfehlungen festlegen kann.",
        },
        {
          term: "Freshness",
          q: "Wie wird sie berechnet?",
          a: "Miss die Verzögerung zwischen verfügbaren Daten und der dargestellten Fachzeit. Die Formel muss erwartete Quellaktivität, verspätete Ereignisse und leere Zeiträume aushalten.",
        },
        {
          term: "Volumen / Zeilenzahl",
          q: "Wie sieht ein einfacher belastbarer Alarm aus?",
          a: "Vergleiche Anzahl oder Abdeckungsquote mit einer repräsentativen Basis und prüfe die Toleranz gegen Saisonalität. Das Ergebnis ist ein Näherungswert, kein Beweis.",
        },
        {
          term: "Anomalieerkennung",
          q: "Warum wird sie nicht überall eingesetzt?",
          a: "Historisches Verhalten ändert sich; dünne oder saisonale Daten erzeugen Fehlalarme. Setze sie nur dort ein, wo eine zuständige Person den Detektor prüft und justiert.",
        },
        {
          term: "Datenvertrag",
          q: "Was umfasst er?",
          a: "Eine versionierte Vereinbarung über Struktur, Feldbedeutung, Kompatibilität, Qualitätsziele, Zuständigkeit und Änderungsablauf zwischen Produzenten und Consumern.",
        },
        {
          term: "Great Expectations",
          q: "Deklarierte oder gelernte Regeln?",
          a: "Ein Framework für deklarierte Expectations und Validierungsabläufe. Unterstützte Datenquellen, Aktionen und Berichte hängen an Version und Integration.",
        },
        {
          term: "Monte Carlo",
          q: "Deklarierte oder gelernte Regeln?",
          a: "Ein kommerzielles Observability-Produkt mit gelerntem Monitoring. Bewerte Detektorverhalten, Abdeckung, Zugriffskontrollen, Kosten, Aufbewahrung und Exportierbarkeit gegen deine Anforderungen.",
        },
        {
          term: "OpenLineage",
          q: "Was bezeichnet der Name?",
          a: "Ein erweiterbares Ereignismodell für Jobläufe, Datasets und Metadaten-Facets. Die tatsächliche Lineage-Abdeckung hängt an ausgebender Integration und Konfiguration.",
        },
      ],
    },
  ],
  preserve: [
    "Freshness",
    "Lineage",
    "SLA / SLO / SLI",
    "Great Expectations",
    "Monte Carlo",
    "OpenLineage",
  ],
});
