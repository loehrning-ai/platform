/**
 * Demo narrative copy: why the example is built this way, the OG subtitle
 * and where the run stops.
 *
 * Single source of truth for the detail-page narrative body. Kept separate
 * from the structural `demos.ts` so copy rewrites don't require touching
 * type definitions.
 *
 * `why` opens with the case the learner works on (du-form, a concrete actor),
 * never with an unsourced rule of thumb, and adds what the lede does not say.
 * What is invented is stated once, in the registry's `syntheticDataLabel`
 * (the "Daten" row on the detail page).
 */

import type { Locale } from "@/lib/i18n/locale";

export interface DemoCopy {
  readonly why: string;
  readonly ogSubtitle: string;
  /** Where the run stops or waits for a person: the "Abbruch" row. */
  readonly stop: string;
}

export const demoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Du prüfst, ob die Formel die richtige Vorwoche greift und ob Pivot und Prognose zu den Zahlen passen.",
    ogSubtitle: "Formeln, Pivot und Prognose in einer Beispieltabelle prüfen.",
    stop: "Der Entwurf bleibt in der Tabelle, bis du Formel und Prognose übernimmst.",
  },
  word: {
    why: "Ein Assistent schreibt Memos und Briefe nach einem Dokumentmuster.",
    ogSubtitle: "Word-Entwurf nach Musterstil, mit Prüfschritten vor der Freigabe.",
    stop: "Der Entwurf steht auf „Freigabe ausstehend“, bis du Stil, Quellen und Datenschutz geprüft hast.",
  },
  "outbound-workflow": {
    why: "Jeder Entwurf nennt sein öffentliches Signal und die Quelle, damit du vor dem Versand prüfen kannst, warum er entstand.",
    ogSubtitle: "Nachrichten mit öffentlichen Signalen begründen.",
    stop: "Jeder Entwurf hält vor dem Versand am Review an.",
  },
  "agent-pipeline": {
    why: "Einer recherchiert, einer fasst zusammen, einer sucht Fehler und einer redigiert, und du prüfst, ob die Fehlersuche das Memo besser macht.",
    ogSubtitle: "Vier Agenten arbeiten nacheinander an einem Memo.",
    stop: "Die Spur endet beim Memoentwurf, den du selbst gegenliest.",
  },
  "n8n-supply-chain": {
    why: "Du siehst, welche Schritte der n8n-Workflow allein erledigt und wo die Disponentin freigibt.",
    ogSubtitle: "Lieferverzug: Workflow-Entwurf mit manueller Freigabe.",
    stop: "Kundennachricht und Nachbestellung warten auf die Freigabe der Disponentin.",
  },
  "rag-vertragsassistent": {
    why: "Du stellst dem Vertragsarchiv Fragen, auch solche, auf die das System nicht antworten sollte. Eine Rechtsauskunft ersetzt es nicht.",
    ogSubtitle: "Chat mit Beispielverträgen; Antworten zeigen Fundstellen.",
    stop: "Findet die Suche keine Klausel, antwortet das System nicht.",
  },
  "rechnung-zu-sap": {
    why: "Die KI liest die Felder der PDF-Rechnung aus, Regeln prüfen Pflichtangaben und Dubletten.",
    ogSubtitle: "PDF-Beispiel rein, IDoc-Entwurf zur Prüfung raus.",
    stop: "Vor dem SAP-Import hält der Ablauf an, bis ein Mensch freigibt.",
  },
  "prompt-scanner": {
    why: "Ein Grenzfall zeigt eine Prompt-Injection, die die Regeln übersehen.",
    ogSubtitle: "Personendaten markieren, bevor ein Prompt weitergegeben wird.",
    stop: "Ein blockierender Treffer hält den Prompt an. Andere Treffer werden maskiert oder zur Prüfung markiert.",
  },
  "cost-drift-observability": {
    why: "Die Latenzkurve zeigt, wie stark die Antwortzeit einer Anwendung schwankt.",
    ogSubtitle: "Kosten, Antwortzeit und Drift als simulierte Betriebsansicht.",
    stop: "Die Ansicht zeigt nur Messwerte. Ab welchem Wert jemand eingreift, legst du selbst fest.",
  },
  "llm-observability": {
    why: "Zu jeder Antwort siehst du Eval-Metriken und einen Drift-Indikator.",
    ogSubtitle: "Eval-Score, Drift und menschliches Urteil im Vergleich.",
    stop: "Wo Score und menschliches Urteil auseinanderliegen, listet das Beispiel die Antwort auf.",
  },
  "fine-tune-playground": {
    why: "Du prüfst, ob das angepasste Modell spürbar bessere Antworten liefert als das Basismodell.",
    ogSubtitle: "Basismodell und Domänenantwort für dieselbe Frage vergleichen.",
    stop: "Beide Antworten sind vorab geschrieben und ändern sich beim Abspielen nicht.",
  },
  "roi-rechner": {
    why: "Der Rechner zeigt jede Annahme als Zahl und die Formel dazu.",
    ogSubtitle: "Teamgröße × Stundensatz × Nutzungsquote × gesparte Stunden = Szenario.",
    stop: "Der Rechner endet bei einem Szenariowert, den du selbst bewertest.",
  },
};

const englishDemoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "You check whether the formula picks the right prior week and whether pivot and forecast match the figures.",
    ogSubtitle: "Check formulas, a pivot and a forecast in a sample sheet.",
    stop: "The draft stays in the sheet until you accept the formula and the forecast.",
  },
  word: {
    why: "An assistant writes memos and letters from a document template.",
    ogSubtitle: "A Word draft in a sample style, with review before approval.",
    stop: "The draft stays at “Approval pending” until you have checked style, sources and data protection.",
  },
  "outbound-workflow": {
    why: "Each draft names its public signal and source, so you can check before sending why it was written.",
    ogSubtitle: "Ground a message in public signals.",
    stop: "Every draft stops at the review before sending.",
  },
  "agent-pipeline": {
    why: "One researches, one summarises, one looks for errors and one edits, and you check whether the error search makes the memo better.",
    ogSubtitle: "Four agents work on one memo in turn.",
    stop: "The trace ends at the memo draft, which you proofread yourself.",
  },
  "n8n-supply-chain": {
    why: "You see which steps the n8n workflow handles alone and where the dispatcher signs off.",
    ogSubtitle: "Delivery delay: a workflow draft with manual sign-off.",
    stop: "The customer message and the reorder wait for the dispatcher's sign-off.",
  },
  "rag-vertragsassistent": {
    why: "You ask the contract archive questions, including some the system should not answer. It does not replace legal advice.",
    ogSubtitle: "Chat with sample contracts; answers show their sources.",
    stop: "If the search finds no clause, the system does not answer.",
  },
  "rechnung-zu-sap": {
    why: "The AI reads the fields of the PDF invoice, and rules check mandatory fields and duplicates.",
    ogSubtitle: "Sample PDF in, IDoc draft out for review.",
    stop: "The run stops before the SAP import until a person signs off.",
  },
  "prompt-scanner": {
    why: "A boundary case shows a prompt injection the rules miss.",
    ogSubtitle: "Flag personal data before a prompt is passed on.",
    stop: "A blocking match stops the prompt. Other matches are masked or flagged for review.",
  },
  "cost-drift-observability": {
    why: "The latency curve shows how much one application's response time varies.",
    ogSubtitle: "Cost, latency and drift as a simulated operations view.",
    stop: "The view shows measurements only. You decide at which value someone steps in.",
  },
  "llm-observability": {
    why: "For each answer you see eval metrics and a drift indicator.",
    ogSubtitle: "Eval score, drift and human judgement side by side.",
    stop: "Where the score and the human rating diverge, the example lists the answer.",
  },
  "fine-tune-playground": {
    why: "You check whether the adapted model gives clearly better answers than the base model.",
    ogSubtitle: "Compare a base model and a domain answer to the same question.",
    stop: "Both answers are written in advance and stay the same on every run.",
  },
  "roi-rechner": {
    why: "The calculator shows each assumption as a number, with the formula.",
    ogSubtitle: "Team size × hourly rate × adoption × hours saved = scenario.",
    stop: "The calculator ends at a scenario value that you judge yourself.",
  },
};

export function getDemoCopy(
  slug: string,
  locale: Locale = "de",
): DemoCopy | undefined {
  return locale === "de" ? demoCopy[slug] : englishDemoCopy[slug];
}
