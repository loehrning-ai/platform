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

import type { Locale } from "@/lib/i18n/locale";

export interface DemoCopy {
  readonly why: string;
  readonly proof: string;
  readonly ogSubtitle: string;
}

export const demoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Viele Mittelstandsanalysen entstehen in Excel. Das Praxisbeispiel zeigt, wie KI dort helfen kann, wo Tabellen, Formeln und Plausibilitätschecks ohnehin liegen.",
    proof:
      "Sandbox-Szenario: 42 fiktive Rollen im Controlling und eine angenommene Entlastung von 4,2 Stunden pro Woche und Person. Keine der beiden Zahlen ist ein Messergebnis.",
    ogSubtitle: "Excel-Lab: Formel, Pivot, Prognose im Beispiel.",
  },
  word: {
    why: "Memos, Briefe und strukturierte Dokumente kosten täglich Zeit. Das Praxisbeispiel zeigt, wie ein Assistent Dokumentmuster nutzt, ohne Stil, Quellen und Freigabeprozess zu verlieren.",
    proof:
      "Sandbox-Szenario: ein fiktives Monatsvolumen von 180 Entwürfen mit klaren Prüfschritten. Es misst keinen produktiven Durchsatz.",
    ogSubtitle: "Word-Lab mit Musterstil und Review.",
  },
  "outbound-workflow": {
    why: "Generische Nachrichten sind schlecht prüfbar. Wenn ein Entwurf konkret auf ein öffentliches Signal Bezug nimmt, lässt sich nachvollziehen, warum er geschrieben wurde und welche Quelle dahintersteht.",
    proof:
      "Sandbox-Szenario: Beispielkontakte, öffentliche Signale und ein Quellencheck vor Versand.",
    ogSubtitle: "Nachrichten mit öffentlichen Signalen begründen.",
  },
  "agent-pipeline": {
    why: "Getrennte Schritte für Recherche, Synthese, Kritik und Redaktion machen Zuständigkeiten sichtbar. Der zusätzliche Koordinationsaufwand ist nur bei Aufgaben vertretbar, die von unabhängigen Prüfungen profitieren.",
    proof:
      "Sandbox-Szenario: ein protokollierter Ablauf mit vier Rollen und ein hypothetischer Vergleich manueller und assistierter Entwurfszeit. Es ist kein gemessenes Produktivitätsergebnis.",
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
      "Sandbox-Szenario: 2.400 fiktive gelabelte Fragen und eine vorgegebene Scoredifferenz von 38 Punkten. Das sind keine Trainingsergebnisse.",
    ogSubtitle: "Baseline vs. Domänenbeispiel: Unterschied in 3 Prompts.",
  },
  "roi-rechner": {
    why: "KI-Projekte scheitern oft nicht an der Technik, sondern an unklaren Annahmen. Transparente Zahlen und offene Formel helfen beim Prüfen, nicht beim Verkaufen.",
    proof:
      "Sandbox-Szenario: Teamgröße, Stundensatz, Adoption und gesparte Stunden als offen sichtbare Annahmen.",
    ogSubtitle: "Teamgröße × Stundensatz × Adoption = Szenario.",
  },
};

const englishDemoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Many business analyses already happen in Excel. This example keeps formula suggestions, pivot design, and plausibility checks inside that familiar review context.",
    proof:
      "Sandbox scenario: 42 fictional controlling roles and a 4.2-hour weekly time-saving assumption per person. Neither figure is measured evidence.",
    ogSubtitle: "Excel lab: inspect formulas, pivots, and a forecast.",
  },
  word: {
    why: "Memos, letters, and structured documents require more than fluent text. This example separates drafting from checks for style, facts, sources, approval, and sensitive data.",
    proof:
      "Sandbox scenario: a fictional monthly volume of 180 drafts with explicit review steps. It does not measure production throughput.",
    ogSubtitle: "Word lab with a sample style and explicit review.",
  },
  "outbound-workflow": {
    why: "A message is easier to review when every substantive claim points to a recorded signal. The workflow keeps the evidence and approval step next to the draft.",
    proof:
      "Sandbox scenario: fictional contacts, public-signal examples, and a source check. No message is sent.",
    ogSubtitle: "Ground an outbound draft in recorded public signals.",
  },
  "agent-pipeline": {
    why: "Separating research, synthesis, criticism, and editing makes responsibilities visible. The added coordination cost only makes sense for work that benefits from independent checks.",
    proof:
      "Sandbox scenario: a recorded four-role trace and a hypothetical comparison of manual and assisted drafting time. It is not a measured productivity result.",
    ogSubtitle: "A recorded trace through four specialist roles.",
  },
  "n8n-supply-chain": {
    why: "Exception handling often follows a known sequence: detect a delay, inspect stock, draft communication, escalate, and obtain approval. The example identifies where automation stops.",
    proof:
      "Sandbox scenario: fictional status, inventory, message, fallback, and review events. No external action runs.",
    ogSubtitle: "Inspect a simulated supply-chain exception flow.",
  },
  "rag-vertragsassistent": {
    why: "Retrieval can reduce search effort only when the archive, citation, and review process are reliable. This example returns passages and uncertainty, not legal advice.",
    proof:
      "Sandbox scenario: a fictional contract archive, source cards, and deterministic keyword matching.",
    ogSubtitle: "Ask a fictional contract archive and inspect each source.",
  },
  "rechnung-zu-sap": {
    why: "Invoice processing is suitable for a bounded workflow because expected fields and validation rules are explicit. Low confidence must stop the process before posting.",
    proof:
      "Sandbox scenario: a fictional PDF invoice, field extraction, duplicate checks, and review before a simulated import.",
    ogSubtitle:
      "Inspect extracted invoice fields before a simulated SAP import.",
  },
  "prompt-scanner": {
    why: "A pre-submission check can identify common personal-data and confidentiality patterns. Fixed rules remain incomplete, so the interface also exposes a prompt-injection case they miss.",
    proof:
      "Sandbox scenario: fictional text and local regular-expression checks. No prompt leaves the browser.",
    ogSubtitle: "Inspect rule-based data warnings before prompt submission.",
  },
  "cost-drift-observability": {
    why: "An LLM workflow needs its own cost, latency, error, and quality signals. This example shows the structure of an operating view without presenting seeded values as telemetry.",
    proof:
      "Sandbox scenario: four fictional applications with fixed cost, latency, error, and drift indicators.",
    ogSubtitle: "Seeded cost, latency, error, and drift indicators.",
  },
  "llm-observability": {
    why: "Quality change requires a use-case-specific baseline and repeated review. This example compares automated metrics with a human judgement and shows a disagreement case.",
    proof:
      "Sandbox scenario: four fictional answers, fixed automated scores, human ratings, and one seeded drift indicator.",
    ogSubtitle: "Compare automated evaluation, drift, and human review.",
  },
  "fine-tune-playground": {
    why: "Domain adaptation is useful only when it outperforms a documented baseline on held-out examples. The comparison also keeps retrieval and prompt changes in view as simpler alternatives.",
    proof:
      "Sandbox scenario: 2,400 fictional labelled questions and a seeded 38-point score difference. These are not training results.",
    ogSubtitle: "Compare a baseline answer with a domain-adapted example.",
  },
  "roi-rechner": {
    why: "A use-case estimate is only as useful as its assumptions. The calculator exposes headcount, hourly cost, adoption, time saved, and an uncertainty range.",
    proof:
      "Sandbox scenario: editable assumptions and a deterministic formula. The result is not a return promise.",
    ogSubtitle: "Inspect every assumption behind a use-case estimate.",
  },
};

export function getDemoCopy(
  slug: string,
  locale: Locale = "de",
): DemoCopy | undefined {
  return locale === "de" ? demoCopy[slug] : englishDemoCopy[slug];
}
