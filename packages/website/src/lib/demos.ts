/**
 * Demos catalog: single source of truth for the /demos gallery.
 *
 * Each entry is an AI capability showcase surfaced as an interactive widget.
 * Demo metadata drives the gallery tile, the /demos/[slug] detail page,
 * and the per-demo OpenGraph image.
 *
 * `size` is kept as registry metadata (e2e reads it through
 * `data-demo-size`), but the gallery no longer spans tiles: blueprint 6.14
 * asks for a uniform 3/2/1 grid, so every tile has the same width and a
 * fixed 4:3 preview. Adding or removing a demo never opens a hole.
 *
 * Titles: `title` is the plain name and `titleKicker` a short task phrase,
 * both stored as sentences for surfaces that join them. The gallery and the
 * detail page show only the name, through `demoName()`.
 *
 * When adding a demo:
 *   1. Append an entry below (keep `n` sequential, zero-padded).
 *   2. Create `src/components/demos/<slug>-demo.tsx` (client component).
 *   3. Add matching copy to `src/lib/demos-copy.ts`.
 *   4. Update tests.
 */

import type { CourseSlug } from "@/lib/course/types";

export type DemoLevel = "einstieg" | "mittel" | "fortg";
export type DemoSize = "s-hero" | "s-tall" | "s-med" | "s-wide";
export type DemoCategory =
  | "Grundlagen"
  | "RAG"
  | "Automation"
  | "Governance"
  | "Agents"
  | "Ops"
  | "Outbound"
  | "Modelle";
export type DemoEvidenceMode = "synthetic" | "rule_based" | "live_api" | "recorded_trace";
export type DemoExternalActionMode = "none" | "simulated" | "review_gated" | "real_disabled";

export interface DemoMeta {
  readonly label: string;
  readonly value: string;
}

export interface Demo {
  readonly id: string;
  readonly slug: string;
  readonly n: string;
  readonly category: DemoCategory;
  readonly level: DemoLevel;
  readonly size: DemoSize;
  /**
   * The interactive engine itself is dark (a terminal, a node canvas). Only
   * the engine frame on the detail page turns graphit; gallery tiles and the
   * page band stay paper.
   */
  readonly dark: boolean;
  readonly accent: boolean;
  readonly title: string;
  readonly titleKicker: string;
  readonly background: string;
  readonly description: string;
  /**
   * One full sentence (about 70 characters at most) for places with no room
   * for the description: the phone ledger row, the phone lead on the detail
   * page and the "next example" block. Never clamped.
   */
  readonly teaser: string;
  readonly tags: readonly string[];
  readonly meta: readonly DemoMeta[];
  readonly industries: readonly string[];
  readonly illustrative: boolean;
  readonly courseSlug: CourseSlug;
  readonly lessonId?: string;
  readonly bookSlugs: readonly string[];
  readonly templateSlugs: readonly string[];
  readonly evidenceMode: DemoEvidenceMode;
  readonly externalActionMode: DemoExternalActionMode;
  readonly syntheticDataLabel: string;
  readonly riskNotes: readonly string[];
  readonly lastReviewed: string;
}

export const demos: readonly Demo[] = [
  {
    id: "excel",
    slug: "excel",
    n: "01",
    category: "Grundlagen",
    level: "einstieg",
    size: "s-hero",
    dark: false,
    accent: true,
    title: "Claude in Excel.",
    titleKicker: "Formeln und Prognose prüfen.",
    background: "Excel-Add-In · Microsoft 365 · keine neue Software",
    description:
      "Du markierst Absatzzahlen und bekommst Formelvorschläge, einen Pivot-Entwurf und eine Prognose zum Gegenprüfen.",
    teaser: "Du prüfst Formeln und eine Prognose zu Absatzzahlen.",
    tags: ["Excel-Add-In", "M365", "Grundlagen"],
    meta: [
      { label: "Lernziel", value: "Formeln prüfen" },
      { label: "Werkzeug", value: "Excel + Claude" },
      { label: "Übungsdaten", value: "Tabellenbereich" },
      { label: "Aufgabe", value: "Pivot + Forecast" },
      { label: "Datenschutz", value: "Tenant prüfen" },
    ],
    industries: ["Controlling", "Finance", "Mittelstand"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_2_lesson_2",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["use-case-bewertungsmatrix"],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Neun fiktive Verkaufszeilen; die Prognose ist eine einfache lineare Fortschreibung.",
    riskNotes: [
      "Rechne jede vorgeschlagene Formel an einer Zeile von Hand nach.",
      "Vergleiche die Prognose mit denselben Wochen im Vorjahr.",
      "Kläre vor echtem Einsatz, ob dein Microsoft-365-Tenant Claude zulässt.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "word",
    slug: "word",
    n: "02",
    category: "Grundlagen",
    level: "einstieg",
    size: "s-tall",
    dark: false,
    accent: false,
    title: "Claude in Word.",
    titleKicker: "Entwurf aus einem Briefing.",
    background: "Word-Lab + Stilprüfung mit Musterdokumenten",
    description:
      "Aus deinem Briefing entsteht ein gegliederter Entwurf, den du auf Stil, Quellen und personenbezogene Daten prüfst.",
    teaser: "Du prüfst einen Entwurf aus einem Briefing auf Stil und Fakten.",
    tags: ["Word-Add-In", "M365", "Grundlagen"],
    meta: [
      { label: "Lernziel", value: "Briefing schärfen" },
      { label: "Werkzeug", value: "Word + Claude" },
      { label: "Datenpunkt", value: "Musterdokumente" },
      { label: "Prüfung", value: "Stil + Fakten" },
      { label: "Datenschutz", value: "PII entfernen" },
    ],
    industries: ["Ingenieurbüro", "Handwerk", "Dienstleistung"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_2_lesson_3",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["ki-nutzungsrichtlinie"],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Fiktive Briefings, Musterdokumente, Erstellzeit und Stil-Treffer.",
    riskNotes: [
      "Entferne Namen und Kundendaten, bevor das Briefing in den Assistenten geht.",
      "Prüfe jede Zahl und jede Quelle im Entwurf gegen das Original.",
      "Gib den Brief erst nach der Datenschutzprüfung frei.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "outbound-workflow",
    slug: "outbound-workflow",
    n: "03",
    category: "Outbound",
    level: "mittel",
    size: "s-tall",
    dark: false,
    accent: false,
    title: "Signale im CRM.",
    titleKicker: "Nachrichten mit Quelle.",
    background: "Beispiel-DB · Signal-Scan · Textentwurf · Review-Gate",
    description:
      "Die Pipeline markiert Signale im CRM mit Quelle und schreibt je Kontakt einen Nachrichtenentwurf.",
    teaser: "Eine Pipeline entwirft Nachrichten, die du vor dem Versand prüfst.",
    tags: ["Pipeline", "Review-Gate", "Quellen"],
    meta: [
      { label: "Lernziel", value: "Signalbezug" },
      { label: "Werkzeug", value: "Beispiel-DB · LLM · Review" },
      { label: "Übungsdaten", value: "Beispielkontakte" },
      { label: "Prüfung", value: "Quelle je Signal" },
      { label: "Datenschutz", value: "CRM-Daten trennen" },
    ],
    industries: ["B2B-Kommunikation", "SaaS", "Service"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_3_lesson_5",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "synthetic",
    externalActionMode: "review_gated",
    syntheticDataLabel: "Erfundene Kontakte, Domains und Signale.",
    riskNotes: [
      "Prüfe zu jedem Signal die Quelle und ihr Datum.",
      "Kläre die Rechtsgrundlage, bevor du einen Kontakt anschreibst.",
      "Gib jeder Nachricht einen Abmeldeweg.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "agent-pipeline",
    slug: "agent-pipeline",
    n: "04",
    category: "Agents",
    level: "fortg",
    size: "s-wide",
    dark: true,
    accent: true,
    title: "Agent-Pipeline.",
    titleKicker: "Memo aus vier Agentenschritten.",
    background: "Vier Rollen: Recherche, Synthese, Kritik, Redaktion",
    description:
      "Du liest die aufgezeichnete Spur von vier Agenten, die zusammen ein Memo schreiben.",
    teaser: "Du liest die Spur von vier Agenten, die gemeinsam ein Memo schreiben.",
    tags: ["Multi-Agent", "Opus 4.5", "Trace"],
    meta: [
      { label: "Lernziel", value: "Rollen trennen" },
      { label: "Agenten", value: "4 spezialisiert" },
      { label: "Output", value: "Memo + Kritik" },
      { label: "Prüfung", value: "Red-Team-Schritt" },
      { label: "Log", value: "vollständig" },
    ],
    industries: ["Strategie", "Corporate Development", "Investment"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_4_lesson_2",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "recorded_trace",
    externalActionMode: "none",
    syntheticDataLabel: "Aufgezeichneter Lauf; Auftrag, 42 Dokumente und Evidenz-Scores sind fiktiv.",
    riskNotes: [
      "Prüfe die Quellen der Recherche selbst. Die Kritik-Rolle sieht nur, was die Recherche geliefert hat.",
      "Vergleiche die Einwände der Kritik mit der Schlussfassung des Memos.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "n8n-supply-chain",
    slug: "n8n-supply-chain",
    n: "05",
    category: "Automation",
    level: "mittel",
    size: "s-wide",
    dark: true,
    accent: false,
    title: "Lieferverzug in n8n.",
    titleKicker: "Workflow mit Freigabe.",
    background: "n8n-Muster · simulierte DHL/SAP/Mail-Schritte",
    description:
      "Ein Lieferverzug läuft durch Bestandsprüfung, Kundenentwurf und Eskalation, bis die Disponentin freigibt.",
    teaser: "Ein Lieferverzug läuft durch den n8n-Workflow bis zur Freigabe.",
    tags: ["n8n", "Self-host", "Supply-Chain"],
    meta: [
      { label: "Lernziel", value: "Flow lesen" },
      { label: "Stack", value: "n8n · Self-hosted" },
      { label: "Trigger", value: "Statusänderung" },
      { label: "Prüfung", value: "Fallback je Schritt" },
      { label: "Datenschutz", value: "Hosting klären" },
    ],
    industries: ["Logistik", "Produktion", "Großhandel"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_3_lesson_6",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "synthetic",
    externalActionMode: "simulated",
    syntheticDataLabel: "Erfundene DHL-, SAP-, Slack- und Mail-Ereignisse, nur im Browser.",
    riskNotes: [
      "Lies den Entwurf der Kundennachricht, bevor du ihn freigibst.",
      "Lege fest, wer die Nachbestellung freigibt, wenn die Disponentin fehlt.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "rag-vertragsassistent",
    slug: "rag-vertragsassistent",
    n: "06",
    category: "RAG",
    level: "mittel",
    size: "s-tall",
    dark: false,
    accent: true,
    title: "Vertragsassistent.",
    titleKicker: "Antworten mit Fundstelle.",
    background: "Keyword-Suche · 6 Beispieldokumente · Antwort mit Quellenkarte",
    description:
      "Eine Keyword-Suche findet Klauseln in sechs Unternehmensdokumenten und zitiert sie mit Fundstelle. Ohne Treffer antwortet das System nicht.",
    teaser: "Zitiert Vertragsklauseln mit Fundstelle und schweigt ohne Treffer.",
    tags: ["Keyword-Suche", "Regelbasiert", "DE / EN"],
    meta: [
      { label: "Lernziel", value: "Quellenpflicht" },
      { label: "Modell", value: "Haiku-Klasse" },
      { label: "Pattern", value: "RAG + Zitat" },
      { label: "Prüfung", value: "Quelle je Antwort" },
      { label: "Datengrundlage", value: "Dokumentarchiv" },
    ],
    industries: ["Kanzlei", "Einkauf", "Legal"],
    illustrative: true,
    courseSlug: "eu-ai-act-kurs",
    lessonId: "block_2",
    bookSlugs: ["ki-landschaft"],
    templateSlugs: ["ki-anbieter-due-diligence"],
    evidenceMode: "rule_based",
    externalActionMode: "none",
    syntheticDataLabel: "Sechs erfundene Unternehmensdokumente.",
    riskNotes: [
      "Öffne die zitierte Klausel und lies sie im Zusammenhang.",
      "Eine Fundstelle ersetzt keine Rechtsauslegung. Strittige Fälle gehören in die Rechtsabteilung.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "rechnung-zu-sap",
    slug: "rechnung-zu-sap",
    n: "07",
    category: "Automation",
    level: "mittel",
    size: "s-med",
    dark: false,
    accent: true,
    title: "Rechnung zu SAP.",
    titleKicker: "Extraktion prüfen.",
    background: "OCR-Muster + Struktur-Extraktion + simulierte SAP-Prüfung",
    description:
      "Eine Beispielrechnung wird extrahiert, gegen Regeln geprüft und vor einem simulierten SAP-Import angehalten.",
    teaser: "Eine Beispielrechnung wird geprüft und vor dem SAP-Import angehalten.",
    tags: ["OCR", "SAP · IDoc", "UStG"],
    meta: [
      { label: "Lernziel", value: "Felder extrahieren" },
      { label: "Formate", value: "PDF · Scan · E-Mail" },
      { label: "Prüfung", value: "Duplikat + UStG" },
      { label: "Output", value: "strukturierte Daten" },
      { label: "Kontrolle", value: "Review vor Import" },
    ],
    industries: ["Maschinenbau", "Buchhaltung", "Mittelstand"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_3_lesson_4",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "synthetic",
    externalActionMode: "simulated",
    syntheticDataLabel: "Zwei erfundene Rechnungsvarianten und ein simulierter SAP-Import.",
    riskNotes: [
      "Stoppe Import und Buchung, wenn die Extraktionssicherheit niedrig ist.",
      "Prüfe Pflichtangaben nach UStG und mögliche Dubletten vor der Freigabe.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "prompt-scanner",
    slug: "prompt-scanner",
    n: "08",
    category: "Governance",
    level: "fortg",
    size: "s-med",
    dark: true,
    accent: false,
    title: "Prompt-Scanner.",
    titleKicker: "Personendaten im Prompt markieren.",
    background: "Regelbasierte Token-Klassifikation · lokal ausführbares Muster",
    description:
      "Regeln markieren Namen, IBANs und vertrauliche Begriffe, bevor ein Prompt freigegeben wird. Sie übersehen manche Fälle, deshalb ist jeder Treffer nur ein Hinweis.",
    teaser: "Markiert Namen und IBANs im Prompt und übersieht manche Fälle.",
    tags: ["DSGVO", "On-Prem", "Regelbasiert"],
    meta: [
      { label: "Lernziel", value: "PII erkennen" },
      { label: "Pattern", value: "lokale Prüfung" },
      { label: "Deployment", value: "On-Prem möglich" },
      { label: "Audit", value: "Trail nötig" },
      { label: "Regelwerk", value: "konfigurierbar" },
    ],
    industries: ["Versicherung", "Finanzdienstleistung", "Gesundheitswesen"],
    illustrative: true,
    courseSlug: "ki-fuehrerschein",
    lessonId: "block_2",
    bookSlugs: ["ki-arbeitsalltag"],
    templateSlugs: ["ki-nutzungsrichtlinie"],
    evidenceMode: "rule_based",
    externalActionMode: "none",
    syntheticDataLabel: "Erfundene Beispieltexte, geprüft mit regulären Ausdrücken in deinem Browser.",
    riskNotes: [
      "Lies den Prompt vor der Freigabe selbst, auch wenn nichts markiert ist.",
      "Prüfe jede Markierung, weil auch harmlose Wörter getroffen werden.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "cost-drift-observability",
    slug: "cost-drift-observability",
    n: "09",
    category: "Ops",
    level: "fortg",
    size: "s-med",
    dark: false,
    accent: true,
    title: "Kosten und Drift im Betrieb.",
    titleKicker: "Kosten, Antwortzeit und Fehler ablesen.",
    background: "Seed-Szenarien · Kosten, Fehler und Drift als Lernspur",
    description:
      "Du vergleichst Kosten, Antwortzeit, Fehler und Drift von vier Anwendungen und liest ab, welche am meisten kostet.",
    teaser: "Du vergleichst Kosten, Antwortzeit und Fehler von vier Beispielanwendungen.",
    tags: ["OTel", "Monitoring", "Drift"],
    meta: [
      { label: "Lernziel", value: "Betrieb messen" },
      { label: "Kosten", value: "je Anwendung" },
      { label: "Stack", value: "OTel + Grafana" },
      { label: "Retention", value: "90 Tage" },
      { label: "Drift", value: "regelmäßig prüfen" },
    ],
    industries: ["FinTech", "Plattformen", "IT-Betrieb"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_4_lesson_3",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Vier erfundene Anwendungen mit erfundenen Messwerten; die Latenzkurve läuft zufällig weiter.",
    riskNotes: [
      "Lege für jede Anwendung eigene Messpunkte und ein Budget fest.",
      "Bestimme vorab, wer bei einem Budget-Alarm entscheidet.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "fine-tune-playground",
    slug: "fine-tune-playground",
    n: "10",
    category: "Modelle",
    level: "fortg",
    size: "s-med",
    dark: false,
    accent: false,
    title: "Feintuning gegen Basismodell.",
    titleKicker: "Zwei Antworten im Vergleich.",
    background: "Vergleich Basismodell gegen Domänenbeispiele",
    description:
      "Du vergleichst die Antworten eines Basismodells und eines angepassten Modells auf dieselbe Frage.",
    teaser: "Du vergleichst ein Basismodell mit einem angepassten Modell.",
    tags: ["Fine-Tuning", "Sonnet 4.6", "DACH"],
    meta: [
      { label: "Lernziel", value: "Baseline vergleichen" },
      { label: "Trainingsdaten", value: "Beispiele labeln" },
      { label: "Prüfung", value: "Holdout-Fragen" },
      { label: "Risiko", value: "Überanpassung" },
      { label: "Iteration", value: "regelmäßig" },
    ],
    industries: ["Maschinenbau", "Technische Dienstleistung", "Spezialfertigung"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_4_lesson_4",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["use-case-bewertungsmatrix"],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Vorgegebene Antworten, Messwerte und Trainingsbeispiele; trainiert wurde kein Modell.",
    riskNotes: [
      "Prüfe zuerst, ob RAG, ein besserer Prompt oder ein klarerer Prozess dasselbe leisten.",
      "Bewerte das angepasste Modell nur an Holdout-Fragen, die nicht im Training waren.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "roi-rechner",
    slug: "roi-rechner",
    n: "11",
    category: "Grundlagen",
    level: "einstieg",
    size: "s-med",
    dark: false,
    accent: true,
    title: "Annahmen-Rechner.",
    titleKicker: "Nutzen aus vier Annahmen.",
    background: "Teamgröße × Stundensatz × Nutzungsquote × gesparte Stunden",
    description:
      "Du trägst Teamgröße, Stundensatz, Nutzungsquote und gesparte Stunden ein und siehst die Formel hinter dem Ergebnis.",
    teaser: "Du siehst die Formel hinter dem ROI deines Teams.",
    tags: ["ROI", "Kalkulation", "Transparent"],
    meta: [
      { label: "Eingaben", value: "4 Annahmen" },
      { label: "Ergebnis", value: "Szenario" },
      { label: "Formel", value: "offen dokumentiert" },
      { label: "Nutzungsquote", value: "30–80%" },
      { label: "Zeitraum", value: "12 Monate" },
    ],
    industries: ["Geschäftsführung", "Finance", "HR"],
    illustrative: true,
    courseSlug: "eu-ai-act-kurs",
    lessonId: "block_6",
    bookSlugs: ["ki-landschaft"],
    templateSlugs: ["use-case-bewertungsmatrix"],
    evidenceMode: "rule_based",
    externalActionMode: "none",
    syntheticDataLabel: "Beispielannahmen, die du selbst änderst.",
    riskNotes: [
      "Das Ergebnis ist ein Szenario. Belege jede Annahme mit einer eigenen Messung.",
      "Finde die Annahme, die das Ergebnis am stärksten verschiebt, und belege sie zuerst.",
    ],
    lastReviewed: "2026-06-19",
  },
  {
    id: "llm-observability",
    slug: "llm-observability",
    n: "12",
    category: "Ops",
    level: "fortg",
    size: "s-med",
    dark: false,
    accent: false,
    title: "Antwortqualität messen.",
    titleKicker: "Automatik und Mensch im Vergleich.",
    background: "Fiktive Eval-Metriken · Drift-Indikator · menschliches Feedback vs. Auto-Eval",
    description:
      "Du prüfst die automatische Bewertung von vier Antworten. Drei hat auch ein Mensch bewertet, und zweimal liegt die Automatik daneben.",
    teaser: "Du prüfst, wo die automatische Bewertung falsch liegt.",
    tags: ["Observability", "Eval", "Drift"],
    meta: [
      { label: "Lernziel", value: "Qualität messen" },
      { label: "Metriken", value: "BLEU · Fluency · Kosten" },
      { label: "Grenzfall", value: "Eval vs. Mensch" },
      { label: "Deployment", value: "Monitoring erforderlich" },
      { label: "Datenquelle", value: "Seed-Szenarien" },
    ],
    industries: ["FinTech", "Plattformen", "IT-Betrieb"],
    illustrative: true,
    courseSlug: "ai-native",
    lessonId: "modul_4_lesson_5",
    bookSlugs: ["ki-tools-selbststaendige"],
    templateSlugs: ["pilot-charter"],
    evidenceMode: "synthetic",
    externalActionMode: "none",
    syntheticDataLabel: "Erfundene Antworten, Scores und Bewertungen; der Drift-Indikator ist vorgegeben.",
    riskNotes: [
      "Lass automatische Scores regelmäßig von Menschen gegenprüfen.",
      "Lege für die Drift eine eigene Baseline und Schwellenwerte je Anwendungsfall fest.",
    ],
    lastReviewed: "2026-06-22",
  },
] as const;

export const DEMO_CATEGORIES: readonly DemoCategory[] = [
  "Grundlagen",
  "RAG",
  "Automation",
  "Governance",
  "Agents",
  "Ops",
  "Outbound",
  "Modelle",
] as const;

export const DEMO_LEVELS: readonly DemoLevel[] = [
  "einstieg",
  "mittel",
  "fortg",
] as const;

export const DEMO_LEVEL_LABELS: Readonly<Record<DemoLevel, string>> = {
  einstieg: "Einstieg",
  mittel: "Mittel",
  fortg: "Fortgeschritten",
};

/**
 * Soft hyphens for heading words too long for the 320px poster column (SPEC §4
 * fit rule): at the 36px floor the Arial-metric fallback face would set
 * "Vertragsassistent" 1px wider than the column. Headings only; metadata,
 * JSON-LD and share cards read `title` and keep the plain word.
 */
const HEADING_SOFT_HYPHENS: Readonly<Record<string, string>> = {
  Vertragsassistent: "Vertrags\u00adassistent",
};

/** The plain demo name for headings: the title without its full stop. */
export function demoName(demo: Pick<Demo, "title">): string {
  return demo.title
    .replace(/\.$/, "")
    .replace(/\p{L}+/gu, (word) => HEADING_SOFT_HYPHENS[word] ?? word);
}

export function getDemoBySlug(slug: string): Demo | undefined {
  return demos.find((d) => d.slug === slug);
}

export function getDemosByCategory(
  category: DemoCategory | "Alle" | string,
): readonly Demo[] {
  if (category === "Alle" || !category) return demos;
  return demos.filter((d) => d.category === category);
}

export function getDemosByLevel(
  level: DemoLevel | "alle" | string,
): readonly Demo[] {
  if (level === "alle" || !level) return demos;
  return demos.filter((d) => d.level === level);
}

export function getDemosByIndustry(industry: string): readonly Demo[] {
  if (!industry) return demos;
  return demos.filter((d) => d.industries.includes(industry));
}

/**
 * Demos bound to one lesson, in catalog order. `/demos/[slug]` already reads
 * `courseSlug` + `lessonId` to link a demo to its lesson; this reads the same
 * binding in the other direction so the course side needs no second list.
 * Most lessons have no bound demo and get an empty array.
 */
export function demosForLesson(
  courseSlug: CourseSlug,
  lessonId: string,
): readonly Demo[] {
  return demos.filter(
    (d) => d.courseSlug === courseSlug && d.lessonId === lessonId,
  );
}

/**
 * Demos bound to a course, in catalog order. Empty for seven of the ten
 * courses: the twelve demos cover ai-native (9), eu-ai-act-kurs (2) and
 * ki-fuehrerschein (1) only. Callers must render nothing for an empty
 * result rather than substituting a demo from another course.
 */
export function demosForCourse(courseSlug: CourseSlug): readonly Demo[] {
  return demos.filter((d) => d.courseSlug === courseSlug);
}

export function filterDemos(opts: {
  readonly category?: string;
  readonly level?: string;
  readonly industry?: string;
}): readonly Demo[] {
  return demos.filter((d) => {
    if (opts.category && opts.category !== "Alle" && d.category !== opts.category)
      return false;
    if (opts.level && opts.level !== "alle" && d.level !== opts.level)
      return false;
    if (opts.industry && !d.industries.includes(opts.industry)) return false;
    return true;
  });
}

export function getNextDemo(current: Demo): Demo {
  const i = demos.findIndex((d) => d.id === current.id);
  if (i === -1) return demos[0];
  return demos[(i + 1) % demos.length];
}

export function getAllCategories(): readonly DemoCategory[] {
  return DEMO_CATEGORIES;
}

export function getAllLevels(): readonly DemoLevel[] {
  return DEMO_LEVELS;
}

export function getAllIndustries(): readonly string[] {
  const set = new Set<string>();
  for (const d of demos) for (const i of d.industries) set.add(i);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
}
