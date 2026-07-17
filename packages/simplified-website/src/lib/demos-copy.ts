/**
 * Demo narrative copy: "why it matters" + proof points.
 *
 * Single source of truth for the detail-page narrative body. Kept separate
 * from the structural `demos.ts` so copy rewrites don't require touching
 * type definitions.
 *
 * The `proof` field is ALWAYS displayed with an "Illustratives Beispiel"
 * badge. Keep examples as sandbox scenarios, not client proof.
 */

export interface DemoCopy {
  readonly why: string;
  readonly proof: string;
  readonly ogSubtitle: string;
}

export const demoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Viele Mittelstandsanalysen entstehen in Excel. Das Praxisbeispiel zeigt, wie KI dort helfen kann, wo Tabellen, Formeln und Plausibilitätschecks ohnehin liegen.",
    proof:
      "Sandbox-Szenario: 42 Rollen im Controlling, 4,2 Std/Woche mögliche Entlastung pro Kopf bei sauberem Prozessdesign.",
    ogSubtitle: "Excel-Lab: Formel, Pivot, Prognose im Beispiel.",
  },
  word: {
    why: "Memos, Briefe und strukturierte Dokumente kosten täglich Zeit. Das Praxisbeispiel zeigt, wie ein Assistent Dokumentmuster nutzt, ohne Stil, Quellen und Freigabeprozess zu verlieren.",
    proof:
      "Sandbox-Szenario: 180 Dokumententwürfe pro Monat, klare Prüfschritte für Stil, Fakten, Quellen und sensible Daten.",
    ogSubtitle: "Word-Lab mit Musterstil und Review.",
  },
  "outbound-workflow": {
    why: "Generische Nachrichten sind schlecht prüfbar. Wenn ein Entwurf konkret auf ein öffentliches Signal Bezug nimmt, lässt sich nachvollziehen, warum er geschrieben wurde und welche Quelle dahintersteht.",
    proof:
      "Sandbox-Szenario: Beispielkontakte, öffentliche Signale und ein Quellencheck vor Versand.",
    ogSubtitle: "Nachrichten mit öffentlichen Signalen begründen.",
  },
  "agent-pipeline": {
    why: "Ein einzelnes LLM ist ein Generalist. Multi-Agent-Setups arbeiten wie eine Redaktion mit Ressorts. Sinnvoll für komplexe Analysen, überdimensioniert für Routinefragen.",
    proof:
      "Sandbox-Szenario: 18 Memos pro Monat, Recherche- und Strukturierungszeit von 3 Tagen auf 20 Minuten.",
    ogSubtitle: "Vier spezialisierte Agenten, ein Memo.",
  },
  "n8n-supply-chain": {
    why: "Ausnahme-Kommunikation folgt oft klaren Regeln: Verzug erkennen, Bestand prüfen, Nachricht entwerfen, Nachbestellung markieren. Das Praxisbeispiel zeigt, wo Automatisierung endet und menschliche Kontrolle beginnt.",
    proof:
      "Sandbox-Szenario: Statusereignis, Bestandsprüfung, Nachricht, Fallback und Review-Schritt.",
    ogSubtitle: "Supply-Chain-Ausnahmen automatisch koordiniert.",
  },
  "rag-vertragsassistent": {
    why: "RAG kann Suchzeit reduzieren, wenn Quellenqualität und Review-Prozess stimmen. Das Praxisbeispiel zeigt Fundstellen und Grenzen, nicht eine rechtsverbindliche Auskunft.",
    proof:
      "Sandbox-Szenario: Beispielarchiv, Fundstellenkarten und angenommene Suchzeitreduktion im Kontext des Praxisbeispiels.",
    ogSubtitle: "Chat mit Beispielverträgen; Antworten zeigen Fundstellen.",
  },
  "rechnung-zu-sap": {
    why: "Rechnungseingang ist in vielen Firmen noch manuelle Arbeit. Das Praxisbeispiel zeigt einen begrenzten KI-Einsatz mit klaren Feldern, Validierung und menschlicher Freigabe.",
    proof:
      "Sandbox-Szenario: PDF-Rechnung, Feldextraktion, Duplikatprüfung und Review vor Import.",
    ogSubtitle: "PDF-Beispiel rein, IDoc-Entwurf zur Prüfung raus.",
  },
  "prompt-scanner": {
    why: "Wer KI im Unternehmen nutzt, braucht Governance vor dem Prompt, nicht erst nach dem Vorfall. Das Praxisbeispiel zeigt, wie PII und Geschäftsgeheimnisse vor der Weitergabe markiert werden.",
    proof:
      "Sandbox-Szenario: Beispielvolumen für Prompt-Prüfung; PII-Blockade als Kontrollmechanismus.",
    ogSubtitle: "PII-Hinweise markiert, bevor ein Prompt weitergegeben wird.",
  },
  "cost-drift-observability": {
    why: "LLMs ohne Observability sind schwer zu betreiben. Logs, Budget-Alerts und Qualitätsmetriken machen sichtbar, ob ein KI-Workflow stabil bleibt.",
    proof:
      "Sandbox-Szenario: 4 Beispiel-Anwendungen; Budget-Monitoring soll Overspend-Risiken früher zeigen.",
    ogSubtitle: "Spend, Latenz und Drift als simulierte Betriebsansicht.",
  },
  "llm-observability": {
    why: "Ob ein LLM-System besser oder schlechter wird, lässt sich nur mit eigenen Messpunkten beurteilen. Das Praxisbeispiel zeigt, wie Eval-Metriken, Drift-Erkennung und ein menschlicher Review zusammenspielen, und wo automatische Bewertung an ihre Grenzen stößt.",
    proof:
      "Sandbox-Szenario: 4 Beispielantworten mit Auto-Eval und menschlicher Bewertung; ein Fall, in dem beide Urteile auseinanderlaufen, und ein markierter Drift-Indikator.",
    ogSubtitle: "Eval-Score, Drift und menschliches Urteil im Vergleich.",
  },
  "fine-tune-playground": {
    why: "Domänenspezifische Anpassung kann Antwortqualität verbessern, wenn Daten und Evaluation passen. Das Praxisbeispiel trennt Baseline, Anpassung und Holdout-Prüfung.",
    proof:
      "Sandbox-Szenario: 2.400 gelabelte Beispielfragen, Beispiel-Evaluationsscore +38 Prozentpunkte gegenüber Baseline.",
    ogSubtitle: "Baseline vs. Domänenbeispiel: Unterschied in 3 Prompts.",
  },
  "roi-rechner": {
    why: "KI-Projekte scheitern oft nicht an der Technik, sondern an unklaren Annahmen. Transparente Zahlen und offene Formel helfen beim Prüfen, nicht beim Verkaufen.",
    proof:
      "Sandbox-Szenario: Teamgröße, Stundensatz, Adoption und gesparte Stunden als offen sichtbare Annahmen.",
    ogSubtitle: "Teamgröße × Stundensatz × Adoption = Szenario.",
  },
};

export function getDemoCopy(slug: string): DemoCopy | undefined {
  return demoCopy[slug];
}
