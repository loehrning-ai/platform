/**
 * Demo narrative copy: why the example is built this way, and what in it is
 * invented.
 *
 * Single source of truth for the detail-page narrative body. Kept separate
 * from the structural `demos.ts` so copy rewrites don't require touching
 * type definitions.
 *
 * `why` opens with the case the learner works on (du-form, a concrete actor),
 * never with an unsourced rule of thumb. `proof` is one plain sentence that
 * names which figures in the example are invented or assumed; the detail page
 * shows it once, next to the evidence line, so it no longer carries a
 * "Sandbox-Szenario:" prefix or a trailing negation.
 */

import type { Locale } from "@/lib/i18n/locale";

export interface DemoCopy {
  readonly why: string;
  readonly proof: string;
  readonly ogSubtitle: string;
  /** Where the run stops or waits for a person: the "Abbruch" row. */
  readonly stop: string;
}

export const demoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "Du arbeitest in einer Excel-Tabelle mit erfundenen Controlling-Zahlen: Formeln, eine Pivot-Tabelle und eine Plausibilitätsprüfung der Prognose.",
    proof:
      "Die 42 Rollen im Controlling und die Entlastung von 4,2 Stunden pro Woche und Person sind angenommene Werte.",
    ogSubtitle: "Formeln, Pivot und Prognose in einer Beispieltabelle prüfen.",
    stop: "Der Entwurf bleibt in der Tabelle, bis du Formel und Prognose übernimmst.",
  },
  word: {
    why: "Ein Assistent schreibt Memos und Briefe nach einem Dokumentmuster. Danach prüfst du, ob Stil, Quellen und Freigabe noch stimmen.",
    proof:
      "Das Monatsvolumen von 180 Entwürfen ist eine fiktive Annahme, an der die Prüfschritte durchgespielt werden.",
    ogSubtitle: "Word-Entwurf nach Musterstil, mit Prüfschritten vor der Freigabe.",
    stop: "Der Entwurf steht auf „Freigabe ausstehend“, bis du Stil, Quellen und Datenschutz geprüft hast.",
  },
  "outbound-workflow": {
    why: "Jeder Entwurf nennt das öffentliche Signal, auf das er sich bezieht, und die Quelle dazu. So prüfst du vor dem Versand, warum er geschrieben wurde.",
    proof:
      "Kontakte, Signale und Quellen sind erfunden, und der Versandschritt ist simuliert.",
    ogSubtitle: "Nachrichten mit öffentlichen Signalen begründen.",
    stop: "Jeder Entwurf hält vor dem Versand am Review an.",
  },
  "agent-pipeline": {
    why: "Vier Agenten schreiben ein Memo: einer recherchiert, einer fasst zusammen, einer sucht Fehler, einer redigiert. Das lohnt sich nur, wenn die Fehlersuche das Memo besser macht.",
    proof:
      "Der Auftrag ist erfunden, und der Zeitvergleich zwischen manuellem und assistiertem Entwurf ist hypothetisch.",
    ogSubtitle: "Vier Agenten arbeiten nacheinander an einem Memo.",
    stop: "Die Spur endet beim Memoentwurf, den du selbst gegenliest.",
  },
  "n8n-supply-chain": {
    why: "Ein Lieferverzug löst vier Schritte aus: Bestand prüfen, Kundennachricht entwerfen, Nachbestellung markieren, eskalieren. Du siehst, welche davon der n8n-Workflow übernimmt und wo die Disponentin freigibt.",
    proof:
      "Statusmeldung, Bestand, Nachrichten und Nachbestellung sind erfunden und bleiben im Browser.",
    ogSubtitle: "Lieferverzug: Workflow-Entwurf mit manueller Freigabe.",
    stop: "Kundennachricht und Nachbestellung warten auf die Freigabe der Disponentin.",
  },
  "rag-vertragsassistent": {
    why: "Du fragst ein Archiv mit Beispielverträgen und bekommst die Klausel mit Fundstelle. Das Beispiel zeigt auch Fragen, auf die das System nicht antworten sollte. Eine Rechtsauskunft ersetzt es nicht.",
    proof:
      "Das Vertragsarchiv ist erfunden, und die Suche vergleicht Schlüsselwörter.",
    ogSubtitle: "Chat mit Beispielverträgen; Antworten zeigen Fundstellen.",
    stop: "Findet die Suche keine Klausel, antwortet das System nicht.",
  },
  "rechnung-zu-sap": {
    why: "Die KI liest die Felder einer PDF-Rechnung aus. Regeln prüfen Pflichtfelder und Dubletten, und vor dem SAP-Import gibt ein Mensch frei.",
    proof:
      "Die Rechnung ist erfunden, und die SAP-Prüfung ist simuliert.",
    ogSubtitle: "PDF-Beispiel rein, IDoc-Entwurf zur Prüfung raus.",
    stop: "Vor dem SAP-Import hält der Ablauf an, bis ein Mensch freigibt.",
  },
  "prompt-scanner": {
    why: "Das Beispiel markiert personenbezogene Daten und Geschäftsgeheimnisse, bevor ein Text das Haus verlässt, und zeigt einen Injection-Fall, den die Regeln übersehen.",
    proof:
      "Die Beispieltexte sind erfunden, und die Prüfung läuft mit regulären Ausdrücken in deinem Browser.",
    ogSubtitle: "Personendaten markieren, bevor ein Prompt weitergegeben wird.",
    stop: "Ein blockierender Treffer hält den Prompt an. Andere Treffer werden maskiert oder zur Prüfung markiert.",
  },
  "cost-drift-observability": {
    why: "Vier Beispielanwendungen stehen mit Kosten, Antwortzeit, Fehlerquote und Drift nebeneinander. Du siehst, bei welcher ein Budget-Alarm anschlagen würde.",
    proof: "Die vier Anwendungen und alle Messwerte sind erfunden.",
    ogSubtitle: "Kosten, Antwortzeit und Drift als simulierte Betriebsansicht.",
    stop: "Ein Budget-Alarm würde bei der Anwendung anschlagen, die ihr Limit überschreitet.",
  },
  "llm-observability": {
    why: "Ob ein LLM-System besser oder schlechter wird, zeigen nur eigene Messpunkte. Hier stehen Eval-Metriken, ein Drift-Indikator und die Bewertung durch einen Menschen nebeneinander, und du siehst, wo die automatische Bewertung danebenliegt.",
    proof:
      "Die vier Antworten, ihre Scores und die menschlichen Bewertungen sind erfunden, der Drift-Indikator ist vorgegeben.",
    ogSubtitle: "Eval-Score, Drift und menschliches Urteil im Vergleich.",
    stop: "Wo Score und menschliches Urteil auseinanderliegen, listet das Beispiel die Antwort auf.",
  },
  "fine-tune-playground": {
    why: "Fine-Tuning hilft nur, wenn Trainingsdaten und Evaluation stimmen. Du siehst Baseline, Anpassung und Holdout-Prüfung deshalb getrennt.",
    proof:
      "Die 2.400 gelabelten Fragen und die Differenz von 38 Punkten sind vorgegebene Beispielwerte, trainiert wurde dafür kein Modell.",
    ogSubtitle: "Basismodell und Domänenantwort für dieselbe Frage vergleichen.",
    stop: "Beide Antworten sind vorab geschrieben und ändern sich beim Abspielen nicht.",
  },
  "roi-rechner": {
    why: "Ein Nutzen-Szenario hängt an wenigen Annahmen. Der Rechner zeigt jede als Zahl und die Formel dazu, und du siehst, welche das Ergebnis am stärksten verschiebt.",
    proof:
      "Teamgröße, Stundensatz, Nutzungsquote und gesparte Stunden sind Beispielannahmen, die du selbst änderst.",
    ogSubtitle: "Teamgröße × Stundensatz × Nutzungsquote = Szenario.",
    stop: "Der Rechner endet bei einer Spanne, die du selbst bewertest.",
  },
};

const englishDemoCopy: Readonly<Record<string, DemoCopy>> = {
  excel: {
    why: "You work in an Excel sheet with invented controlling figures: formulas, a pivot table and a plausibility check on the forecast.",
    proof:
      "The 42 controlling roles and the saving of 4.2 hours per person per week are assumed values.",
    ogSubtitle: "Check formulas, a pivot and a forecast in a sample sheet.",
    stop: "The draft stays in the sheet until you accept the formula and the forecast.",
  },
  word: {
    why: "An assistant writes memos and letters from a document template. Then you check whether style, sources and approval still hold.",
    proof:
      "The monthly volume of 180 drafts is an invented assumption used to walk through the review steps.",
    ogSubtitle: "A Word draft in a sample style, with review before approval.",
    stop: "The draft stays at “Approval pending” until you have checked style, sources and data protection.",
  },
  "outbound-workflow": {
    why: "Each draft names the public signal it refers to and the source behind it. That lets you check before sending why it was written.",
    proof: "Contacts, signals and sources are invented, and the send step is simulated.",
    ogSubtitle: "Ground a message in public signals.",
    stop: "Every draft stops at the review before sending.",
  },
  "agent-pipeline": {
    why: "Four agents write one memo: one researches, one summarises, one looks for errors, one edits. This only pays off when the error check makes the memo better.",
    proof:
      "The brief is invented, and the time comparison between manual and assisted drafting is hypothetical.",
    ogSubtitle: "Four agents work on one memo in turn.",
    stop: "The trace ends at the memo draft, which you read yourself.",
  },
  "n8n-supply-chain": {
    why: "A delivery delay triggers four steps: check stock, draft the customer message, flag the reorder, escalate. You see which of them the n8n workflow handles and where the dispatcher signs off.",
    proof:
      "Status event, stock, messages and reorder are invented and stay in the browser.",
    ogSubtitle: "Delivery delay: a workflow draft with manual sign-off.",
    stop: "The customer message and the reorder wait for the dispatcher's sign-off.",
  },
  "rag-vertragsassistent": {
    why: "You query an archive of sample contracts and get the clause with its location. The example also shows questions the system should not answer. It does not replace legal advice.",
    proof: "The contract archive is invented, and the search compares keywords.",
    ogSubtitle: "Chat with sample contracts; answers show their sources.",
    stop: "If the search finds no clause, the system does not answer.",
  },
  "rechnung-zu-sap": {
    why: "The AI reads the fields of a PDF invoice. Rules check mandatory fields and duplicates, and a person approves before the SAP import.",
    proof: "The invoice is invented, and the SAP check is simulated.",
    ogSubtitle: "Sample PDF in, IDoc draft out for review.",
    stop: "The run stops before the SAP import until a person signs off.",
  },
  "prompt-scanner": {
    why: "The example flags personal data and trade secrets before a text leaves the company, and shows one injection case its rules miss.",
    proof:
      "The sample texts are invented, and the check runs as regular expressions in your browser.",
    ogSubtitle: "Flag personal data before a prompt is passed on.",
    stop: "A blocking match stops the prompt. Other matches are masked or flagged for review.",
  },
  "cost-drift-observability": {
    why: "Four sample applications sit side by side with cost, latency, error rate and drift. You see which one would trigger a budget alert.",
    proof: "The four applications and all measurements are invented.",
    ogSubtitle: "Cost, latency and drift as a simulated operations view.",
    stop: "A budget alert would fire for the application that exceeds its limit.",
  },
  "llm-observability": {
    why: "Only your own measurements tell you whether an LLM system is getting better or worse. Here eval metrics, a drift indicator and a human rating sit side by side, and you see where the automated score is off.",
    proof:
      "The four answers, their scores and the human ratings are invented, and the drift indicator is seeded.",
    ogSubtitle: "Eval score, drift and human judgement side by side.",
    stop: "Where the score and the human rating diverge, the example lists the answer.",
  },
  "fine-tune-playground": {
    why: "Fine-tuning helps only when the training data and the evaluation hold up. So you see baseline, adaptation and holdout check separately.",
    proof:
      "The 2,400 labelled questions and the 38-point difference are seeded sample values; no model was trained for them.",
    ogSubtitle: "Compare a base model and a domain answer to the same question.",
    stop: "Both answers are written in advance and stay the same on every run.",
  },
  "roi-rechner": {
    why: "A benefit scenario rests on a few assumptions. The calculator shows each one as a number, with the formula, so you see which one moves the result most.",
    proof:
      "Team size, hourly rate, adoption and hours saved are sample assumptions that you change yourself.",
    ogSubtitle: "Team size × hourly rate × adoption = scenario.",
    stop: "The calculator ends at a range that you judge yourself.",
  },
};

export function getDemoCopy(
  slug: string,
  locale: Locale = "de",
): DemoCopy | undefined {
  return locale === "de" ? demoCopy[slug] : englishDemoCopy[slug];
}
