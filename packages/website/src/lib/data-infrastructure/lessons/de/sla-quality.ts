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
      content: `Eine Pipeline kann fehlerfrei laufen und trotzdem falsche Zahlen veröffentlichen. Infrastrukturmetriken zeigen, ob Jobs laufen; Datenzuverlässigkeit braucht drei Signale mit Bezug zur Nutzung:

- **Freshness.** Wie weit die Daten hinter der relevanten Fachzeit liegen, etwa letzte akzeptierte Ereigniszeit gegen jetzt. Die Definition muss erwartete Quellaktivität, leere Zeiträume und verspätete Ereignisse aushalten.
- **Vollständigkeit.** Ob erwartete Datensätze oder Aggregate eingetroffen sind. Zeilenzahlen gegen eine passende Basis sind ein Näherungswert und beweisen nicht, dass jedes Ereignis ankam.
- **Genauigkeit.** Ob Werte Schema-, Bereichs-, Beziehungs- und Fachregeln erfüllen, explizit geprüft.

Eine gestoppte Pipeline zeigt sich meist zuerst als Freshness-Fehler. Ein Transformationsfehler kann Freshness gesund lassen und Vollständigkeit oder Genauigkeit beschädigen, und CPU- oder Job-Erfolgsdiagramme übersehen ihn.`,
      keyTakeaway:
        "Miss Freshness, Vollständigkeit und Genauigkeit getrennt; ein erfolgreicher Job kann falsche Daten veröffentlichen.",
    },
    {
      id: "s2",
      title: "Zuverlässigkeitsmodell",
      content: `Das Modell zeigt, wie drei Fehlertypen die Signale verschieben. Seine Werte sind feste Beispiele, keine Produktionsschwellen, und ein grünes Dashboard heißt nur, dass die gemessenen Bedingungen in ihren Grenzen liegen.

Leite jedes SLO aus Nutzerbedarf, Messfenster, Fehlerbudget und der Folge einer Verfehlung ab; ein Finanzabschluss braucht andere Definitionen als ein exploratives Dashboard. Prüfe Schwellen gegen historisches Verhalten, bevor sie den Bereitschaftsdienst wecken.`,
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

Wähle Prüfungen nach Geschäftsrisiko und Ausführungskosten: Schnittstellen früh prüfen, große Datensätze begründet stichprobenartig oder inkrementell, teure Reconciliation für die wichtigen Invarianten. Keine Familie beweist End-to-End-Korrektheit.`,
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

Ein dbt-Datentest ist eine Abfrage, deren Ergebniszeilen Verstöße sind. Befehle, Auswahlregeln, Adapter und CI bestimmen, wann er läuft. \`equal_rowcount\` gilt nur, wenn beide Modelle dieselbe Granularität und denselben Filterumfang haben. Gib jedem Test Zuständigkeit, Schweregrad, Rhythmus und eine dokumentierte Reaktion.`,
    },
    {
      id: "s5",
      title: "Deklarierte und gelernte Prüfungen",
      content: `Deklarierte Prüfungen kodieren bekannte Invarianten: Ein Schlüssel ist eindeutig, ein Betrag nicht negativ, eine Reconciliation-Abweichung bleibt in der Toleranz. Sie sind nachvollziehbar und deterministisch und erkennen nur, was jemand festgelegt hat. dbt-Datentests oder Great Expectations führen sie aus, mit versionsabhängigen Quellen und Berichten.

Gelernte Prüfungen schätzen erwartete Bereiche aus historischen Anzahlen, Nullraten oder Verteilungen. Sie zeigen unerwartete Änderungen und schlagen auch bei Saisonalität, Produkteinführungen, Ausfällen und dünnen Daten an.

Wähle die Abdeckung nach Anforderungen:

- deklarierte Prüfungen für Verträge und Fachinvarianten;
- gelernte Prüfungen, wo die Historie aussagekräftig ist und jemand den Detektor justiert;
- eine Liste der Datasets, die profiliert werden dürfen, weil Stichproben sensible Daten enthalten können;
- ein Test von Alarmpräzision, Warehouse-Kosten, Zugriffskontrolle, Aufbewahrung, Lineage-Abdeckung und Export mit repräsentativen Daten.`,
    },
    {
      id: "s6",
      title: "Lineage und Alarme",
      content: `Eine Anomalie in \`fact_orders.amount_usd\` ist ein Symptom. Lineage grenzt die Suche ein, indem sie Abhängigkeiten zwischen Jobs und Datasets zeigt; welche Änderung den Fehler verursacht hat, beweist sie nicht, und Lücken in der Instrumentierung verbergen Pfade.

Ein praktikabler Ablauf:

1. Für jedes wichtige Dataset SLI, Ziel, Zuständigkeit und Reaktion festlegen.
2. Test- und Pipeline-Ergebnisse mit stabilen Job- und Dataset-Identitäten ausgeben.
3. Mit Lineage, letzten Deployments, Quellzustand und Stichproben-Reconciliation untersuchen.
4. Den Alarm an das Team der fehlerhaften Grenze leiten, sobald die Evidenz sie zeigt; bis dahin an den Triage-Pfad.

OpenLineage definiert Ereignisse für Jobläufe, Datasets und erweiterbare Facets. Die Abdeckung unterscheidet sich nach Werkzeug und Version, also prüfst du die tatsächlichen Ereignisse, bevor Routing davon abhängt. Schütze Lineage-Metadaten: Namen, Query-Facets und Fehlerdetails legen interne Strukturen und manchmal sensible Werte offen.`,
      keyTakeaway:
        "Ein Alarm geht an das Team der Grenze, die laut Evidenz versagt; das ist nicht immer das nächste vorgelagerte System.",
    },
    {
      id: "s7",
      title: "Kurzprüfung",
      content: "Zwei Fragen zu stillen Fehlern und Alarmen.",
    },
    {
      id: "s8",
      title: "Begriffe",
      content: `- **SLI / SLO / SLA**, gemessenes Signal, sein Ziel in einem Zeitfenster und eine Vereinbarung mit Folgen.
- **Freshness**, Verzögerung zwischen verfügbaren Daten und der dargestellten Fachzeit.
- **Vollständigkeits-Näherungswert**, eine Anzahl, Abdeckungsquote oder Reconciliation-Abweichung.
- **Anomalieerkennung**, vergleicht Beobachtungen mit einem erwarteten Bereich.
- **Datenvertrag**, eine versionierte Vereinbarung zwischen Produzent und Consumer über Struktur, Bedeutung und Qualität.
- **Deklarierte Prüfung**, eine explizite Invariante, die gegen Daten ausgewertet wird.
- **Gelernte Prüfung**, ein aus der Historie abgeleiteter erwarteter Bereich.
- **OpenLineage**, ein Ereignismodell für Job-, Lauf- und Dataset-Metadaten.`,
    },
  ],
  widgets: [
    {
      kind: "quiz",
      cpId: "q1",
      title: "Der unauffällige Fehler",
      question:
        "Die Pipeline ist grün: Jobs erfolgreich, Latenz normal, keine Fehler. Das Marketing meldet, die Conversion-Rate sei seit drei Tagen falsch. Wahrscheinlichste Ursache?",
      options: [
        "Ein Fehler im Dashboard.",
        "Eine stille Regression bei Genauigkeit oder Vollständigkeit, etwa ein Join, der Zeilen verliert.",
        "CPU-Sättigung.",
        "Eine Netzwerkpartition.",
      ],
      explanation:
        "Jobstatus und Latenz sagen nichts über das Ergebnis; ein Enum-Wechsel, ein abweichender Join-Schlüssel oder eine geänderte Einheit verändert die Ausgabe, ohne zu scheitern. Ein Reconciliation-Test auf der richtigen Granularität findet das.",
    },
    {
      kind: "quiz",
      cpId: "q2",
      title: "Ziel der Alarmierung",
      question:
        "fact_orders fehlen 30% der erwarteten Zeilen. Lineage: fact_orders ← stg_orders ← raw_orders ← Postgres CDC. CDC hat seit vier Stunden keine Ereignisse geliefert. Wer wird alarmiert?",
      options: [
        "Das Team des dbt-Modells, wo der Test scheitert.",
        "Das Dashboard-Team, dem es aufgefallen ist.",
        "Das CDC- oder Quellsystemteam, wo die Lücke beginnt.",
        "Alle Teams gleichzeitig.",
      ],
      explanation:
        "Die erste Lücke zeigt sich an der CDC-Grenze, also prüft deren Team Connector und Quellzustand; nachgelagerte Systeme zeigen korrekt, dass nichts ankam. Ob Connector, Zugangsdaten, Datenbank oder Instrumentierung versagt haben, sagt die Lineage nicht.",
    },
    {
      kind: "flashcards",
      cpId: "flash",
      title: "Lernkarten",
      cards: [
        {
          term: "SLA / SLO / SLI",
          q: "Wie lautet die Hierarchie?",
          a: "SLI: ein gemessenes Zuverlässigkeitssignal. SLO: sein Ziel in einem Zeitfenster. SLA: eine Vereinbarung, die Folgen für Verfehlungen festlegen kann.",
        },
        {
          term: "Freshness",
          q: "Wie wird sie berechnet?",
          a: "Als Verzögerung zwischen verfügbaren Daten und dargestellter Fachzeit, bereinigt um erwartete Quellaktivität, verspätete Ereignisse und leere Zeiträume.",
        },
        {
          term: "Volumen / Zeilenzahl",
          q: "Wie sieht ein einfacher belastbarer Alarm aus?",
          a: "Vergleiche Anzahl oder Abdeckungsquote mit einer repräsentativen Basis und prüfe die Toleranz gegen Saisonalität. Das ergibt einen Näherungswert für Vollständigkeit.",
        },
        {
          term: "Anomalieerkennung",
          q: "Warum wird sie nicht überall eingesetzt?",
          a: "Die Historie verschiebt sich, und dünne oder saisonale Daten erzeugen Fehlalarme. Setz sie nur ein, wo jemand den Detektor justiert.",
        },
        {
          term: "Datenvertrag",
          q: "Was umfasst er?",
          a: "Eine versionierte Vereinbarung zwischen Produzent und Consumer über Struktur, Feldbedeutung, Kompatibilität, Qualität, Zuständigkeit und Änderungsablauf.",
        },
        {
          term: "Great Expectations",
          q: "Deklarierte oder gelernte Regeln?",
          a: "Deklariert: ein Framework für Expectations und Validierungsläufe. Quellen und Berichte hängen an Version und Integration.",
        },
        {
          term: "Monte Carlo",
          q: "Deklarierte oder gelernte Regeln?",
          a: "Gelernt: ein kommerzielles Observability-Produkt. Prüfe Detektoren, Abdeckung, Zugriffskontrolle, Kosten, Aufbewahrung und Export gegen deine Anforderungen.",
        },
        {
          term: "OpenLineage",
          q: "Was bezeichnet der Name?",
          a: "Ein erweiterbares Ereignismodell für Jobläufe, Datasets und Facets. Die Abdeckung hängt an der ausgebenden Integration.",
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
