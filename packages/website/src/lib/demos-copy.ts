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
    why: "Viele Analysen im Mittelstand entstehen in Excel. Also setzt das Praxisbeispiel dort an: bei den Formeln, Pivots und Plausibilitätschecks, die es ohnehin schon gibt.",
    proof:
      "Sandbox-Szenario: 42 fiktive Rollen im Controlling und eine angenommene Entlastung von 4,2 Stunden pro Woche und Person. Keine der beiden Zahlen ist ein Messergebnis.",
    ogSubtitle: "Excel-Lab: Formel, Pivot, Prognose im Beispiel.",
  },
  word: {
    why: "Memos, Briefe, Vorlagen: jeden Tag dieselbe Arbeit. Das Praxisbeispiel lässt einen Assistenten Dokumentmuster nutzen, ohne dass Stil, Quellen und Freigabe verloren gehen.",
    proof:
      "Sandbox-Szenario: ein fiktives Monatsvolumen von 180 Entwürfen mit klaren Prüfschritten. Es misst keinen produktiven Durchsatz.",
    ogSubtitle: "Word-Lab mit Musterstil und Review.",
  },
  "outbound-workflow": {
    why: "Eine generische Nachricht kann niemand prüfen. Bezieht sich der Entwurf auf ein öffentliches Signal, siehst du, warum er geschrieben wurde und welche Quelle dahintersteht.",
    proof:
      "Sandbox-Szenario: Beispielkontakte, öffentliche Signale und ein Quellencheck vor Versand.",
    ogSubtitle: "Nachrichten mit öffentlichen Signalen begründen.",
  },
  "agent-pipeline": {
    why: "Recherche, Synthese, Kritik, Redaktion: vier Schritte, vier Zuständigkeiten. Der Koordinationsaufwand lohnt sich nur, wenn eine unabhängige Prüfung die Aufgabe besser macht.",
    proof:
      "Sandbox-Szenario: ein protokollierter Ablauf mit vier Rollen und ein hypothetischer Vergleich manueller und assistierter Entwurfszeit. Es ist kein gemessenes Produktivitätsergebnis.",
    ogSubtitle: "Vier spezialisierte Agenten, ein Memo.",
  },
  "n8n-supply-chain": {
    why: "Verzug erkennen, Bestand prüfen, Nachricht entwerfen, Nachbestellung markieren. Ausnahmen in der Lieferkette folgen Regeln, und Regeln lassen sich automatisieren. Das Praxisbeispiel zeigt, wo die Automatik endet und ein Mensch entscheidet.",
    proof:
      "Sandbox-Szenario: Statusereignis, Bestandsprüfung, Nachricht, Fallback und Review-Schritt.",
    ogSubtitle: "Supply-Chain-Ausnahmen automatisch koordiniert.",
  },
  "rag-vertragsassistent": {
    why: "RAG spart Suchzeit. Aber nur, wenn das Archiv sauber ist und ein Review dahintersteht. Das Praxisbeispiel zeigt Fundstellen und Grenzen, keine rechtsverbindliche Auskunft.",
    proof:
      "Sandbox-Szenario: Beispielarchiv, Fundstellenkarten und angenommene Suchzeitreduktion im Kontext des Praxisbeispiels.",
    ogSubtitle: "Chat mit Beispielverträgen; Antworten zeigen Fundstellen.",
  },
  "rechnung-zu-sap": {
    why: "Rechnungseingang ist in vielen Firmen Handarbeit. Das Praxisbeispiel begrenzt den KI-Einsatz auf das, was prüfbar bleibt: klare Felder, Validierung, menschliche Freigabe.",
    proof:
      "Sandbox-Szenario: PDF-Rechnung, Feldextraktion, Duplikatprüfung und Review vor Import.",
    ogSubtitle: "PDF-Beispiel rein, IDoc-Entwurf zur Prüfung raus.",
  },
  "prompt-scanner": {
    why: "Governance gehört vor den Prompt, nicht hinter den Vorfall. Das Praxisbeispiel markiert PII und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt.",
    proof:
      "Sandbox-Szenario: Beispielvolumen für Prompt-Prüfung; PII-Blockade als Kontrollmechanismus.",
    ogSubtitle: "PII-Hinweise markiert, bevor ein Prompt weitergegeben wird.",
  },
  "cost-drift-observability": {
    why: "Ein LLM ohne Observability betreibst du blind. Logs, Budget-Alerts und Qualitätsmetriken zeigen, ob ein KI-Workflow stabil bleibt oder gerade kippt.",
    proof:
      "Sandbox-Szenario: 4 Beispiel-Anwendungen; Budget-Monitoring soll Overspend-Risiken früher zeigen.",
    ogSubtitle: "Spend, Latenz und Drift als simulierte Betriebsansicht.",
  },
  "llm-observability": {
    why: "Wird dein LLM-System besser oder schlechter? Ohne eigene Messpunkte weißt du es nicht. Das Praxisbeispiel verbindet Eval-Metriken, Drift-Erkennung und menschlichen Review und zeigt, wo die automatische Bewertung aufhört zu taugen.",
    proof:
      "Sandbox-Szenario: 4 Beispielantworten mit Auto-Eval und menschlicher Bewertung; ein Fall, in dem beide Urteile auseinanderlaufen, und ein markierter Drift-Indikator.",
    ogSubtitle: "Eval-Score, Drift und menschliches Urteil im Vergleich.",
  },
  "fine-tune-playground": {
    why: "Fine-Tuning verbessert Antworten nur, wenn Daten und Evaluation stimmen. Das Praxisbeispiel trennt deshalb Baseline, Anpassung und Holdout-Prüfung.",
    proof:
      "Sandbox-Szenario: 2.400 fiktive gelabelte Fragen und eine vorgegebene Scoredifferenz von 38 Punkten. Das sind keine Trainingsergebnisse.",
    ogSubtitle: "Baseline vs. Domänenbeispiel: Unterschied in 3 Prompts.",
  },
  "roi-rechner": {
    why: "KI-Projekte scheitern selten an der Technik. Sie scheitern an Annahmen, die niemand aufgeschrieben hat. Der Rechner legt jede Zahl und die Formel offen: zum Prüfen, nicht zum Verkaufen.",
    proof:
      "Sandbox-Szenario: Teamgröße, Stundensatz, Adoption und gesparte Stunden als offen sichtbare Annahmen.",
    ogSubtitle: "Teamgröße × Stundensatz × Adoption = Szenario.",
  },
};

const englishDemoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Many business analyses happen in Excel. So the example starts there, with the formulas, pivots, and plausibility checks that already exist.",
    proof:
      "Sandbox scenario: 42 fictional controlling roles and a 4.2-hour weekly time-saving assumption per person. Neither figure is measured evidence.",
    ogSubtitle: "Excel lab: formula, pivot, forecast in an example.",
  },
  word: {
    why: "Memos, letters, templates: the same work every day. The example lets an assistant use document patterns without losing style, sources, and approval.",
    proof:
      "Sandbox scenario: a fictional monthly volume of 180 drafts with explicit review steps. It does not measure production throughput.",
    ogSubtitle: "Word lab with a sample style and review.",
  },
  "outbound-workflow": {
    why: "Nobody can check a generic message. When the draft points at a public signal, you see why it was written and which source stands behind it.",
    proof:
      "Sandbox scenario: fictional contacts, public-signal examples, and a source check. No message is sent.",
    ogSubtitle: "Ground a message in public signals.",
  },
  "agent-pipeline": {
    why: "Research, synthesis, criticism, editing. Four steps, four responsibilities. The coordination cost pays off only when an independent check makes the work better.",
    proof:
      "Sandbox scenario: a recorded four-role trace and a hypothetical comparison of manual and assisted drafting time. It is not a measured productivity result.",
    ogSubtitle: "Four specialist agents, one memo.",
  },
  "n8n-supply-chain": {
    why: "Detect a delay, check stock, draft the message, flag the reorder. Supply-chain exceptions follow rules. The example shows where automation stops and a person decides.",
    proof:
      "Sandbox scenario: fictional status, inventory, message, fallback, and review events. No external action runs.",
    ogSubtitle: "Supply-chain exceptions coordinated automatically.",
  },
  "rag-vertragsassistent": {
    why: "Retrieval saves search time. But only when the archive is clean and a review stands behind it. The example returns passages and limits, not legal advice.",
    proof:
      "Sandbox scenario: a fictional contract archive, source cards, and deterministic keyword matching.",
    ogSubtitle: "Chat with sample contracts; answers show their sources.",
  },
  "rechnung-zu-sap": {
    why: "In many companies, incoming invoices are still handwork. The example limits the AI to what stays checkable: clear fields, validation, human approval.",
    proof:
      "Sandbox scenario: a fictional PDF invoice, field extraction, duplicate checks, and review before a simulated import.",
    ogSubtitle: "Sample PDF in, IDoc draft out for review.",
  },
  "prompt-scanner": {
    why: "Governance belongs in front of the prompt, not behind the incident. The example marks personal data and trade secrets, and one injection case its rules miss.",
    proof:
      "Sandbox scenario: fictional text and local regular-expression checks. No prompt leaves the browser.",
    ogSubtitle: "Personal-data flags before a prompt is passed on.",
  },
  "cost-drift-observability": {
    why: "Run an LLM without observability and you run it blind. Logs, budget alerts, and quality metrics show whether an AI workflow stays stable or tips over.",
    proof:
      "Sandbox scenario: four fictional applications with fixed cost, latency, error, and drift indicators.",
    ogSubtitle: "Spend, latency, and drift as a simulated operating view.",
  },
  "llm-observability": {
    why: "Is your LLM system getting better or worse? Without your own measurements, you cannot tell. Eval metrics, drift detection, and human review mark where automated scoring stops.",
    proof:
      "Sandbox scenario: four fictional answers, fixed automated scores, human ratings, and one seeded drift indicator.",
    ogSubtitle: "Eval score, drift, and human judgement side by side.",
  },
  "fine-tune-playground": {
    why: "Fine-tuning improves answers only when the data and the evaluation hold up. So the example separates baseline, adaptation, and holdout check.",
    proof:
      "Sandbox scenario: 2,400 fictional labelled questions and a seeded 38-point score difference. These are not training results.",
    ogSubtitle: "Baseline vs. domain example: the difference in 3 prompts.",
  },
  "roi-rechner": {
    why: "AI projects rarely fail on the technology. They fail on assumptions nobody wrote down. The calculator shows every number and the formula, to check rather than sell.",
    proof:
      "Sandbox scenario: editable assumptions and a deterministic formula. The result is not a return promise.",
    ogSubtitle: "Team size \u00d7 hourly rate \u00d7 adoption = scenario.",
  },
};

export function getDemoCopy(
  slug: string,
  locale: Locale = "de",
): DemoCopy | undefined {
  return locale === "de" ? demoCopy[slug] : englishDemoCopy[slug];
}
