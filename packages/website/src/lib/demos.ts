/**
 * Demos catalog — single source of truth for the /demos gallery.
 *
 * Each entry is an AI capability showcase surfaced as an interactive widget.
 * Demo metadata drives the gallery tile, the /demos/[slug] detail page,
 * and the per-demo OpenGraph image.
 *
 * Size class rationale (`size` field):
 *   s-hero  : signature opener — 2x2 tile, most valuable real estate
 *   s-wide  : dark statement demo — 2x1 tile, strong horizontal story
 *   s-tall  : secondary narrative — 1x2 tile, vertical rhythm break
 *   s-med   : default — 1x1 tile
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
  readonly dark: boolean;
  readonly accent: boolean;
  readonly title: string;
  readonly titleKicker: string;
  readonly background: string;
  readonly description: string;
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
    titleKicker: "Formel, Pivot, Prognose.",
    background: "Excel-Add-In · Microsoft 365 · keine neue Software",
    description:
      "Analyst markiert einen Beispielbereich: Das Praxisbeispiel zeigt, wie Formelvorschläge, Pivot-Entwurf und Forecast-Prüfung im gewohnten Tabellenkontext aussehen können.",
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
    syntheticDataLabel: "Fiktive Tabellenwerte; keine Verbindung zu Microsoft 365.",
    riskNotes: ["Formeln und Forecasts müssen fachlich gegengeprüft werden."],
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
    titleKicker: "Dokumente strukturieren.",
    background: "Word-Lab + Stilprüfung mit Musterdokumenten",
    description:
      "Briefing eingeben: Das Praxisbeispiel zeigt einen strukturierten Entwurf mit anschließender Stil-, Quellen-, Freigabe- und Datenschutzprüfung.",
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
    syntheticDataLabel: "Fiktive Dokumentbeispiele; kein Zugriff auf echte Word-Dateien.",
    riskNotes: ["Sensible Daten und Quellen müssen vor Nutzung entfernt oder freigegeben sein."],
    lastReviewed: "2026-06-19",
  },
  {
    id: "outbound-workflow",
    slug: "outbound-workflow",
    n: "03",
    category: "Outbound",
    level: "mittel",
    size: "s-med",
    dark: false,
    accent: false,
    title: "Signale im CRM.",
    titleKicker: "Nachrichten erklären.",
    background: "Beispiel-DB · Signal-Scan · Textentwurf · Review-Gate",
    description:
      "Pipeline nimmt fiktive Beispielkontakte, markiert belegte Signale und erstellt einen Nachrichtentwurf, der vor jedem Versand im Review bleibt.",
    tags: ["DAG", "Git-Ops", "Open"],
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
    syntheticDataLabel: "Fiktive Kontakte und Domains; kein SMTP-Versand.",
    riskNotes: ["Outbound-Kommunikation braucht Quellenprüfung, Rechtsgrundlage und Opt-out-Pfad."],
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
    titleKicker: "Vier Köpfe, ein Memo.",
    background: "Multi-Agent-Muster · spezialisierte Rollen · aufgezeichnete Spur",
    description:
      "Scout recherchiert, Analyst synthetisiert, Kritiker red-teamt, Redakteur formuliert. Redaktion statt Generalist.",
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
    syntheticDataLabel: "Aufgezeichnete Beispielspur; keine Live-Agenten im Browser.",
    riskNotes: ["Rollenaufteilung ersetzt keine Quellen- und Faktenprüfung."],
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
    title: "n8n Supply-Chain.",
    titleKicker: "Disponenten-Morgen, automatisch.",
    background: "n8n-Muster · simulierte DHL/SAP/Mail-Schritte",
    description:
      "Ein Lieferverzug läuft als simulierte Prozesskette durch Bestand, Kundenentwurf, Eskalation und manuelle Freigabe.",
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
    syntheticDataLabel: "Fiktive DHL-, SAP-, Slack- und Mail-Ereignisse.",
    riskNotes: ["Externe Aktionen bleiben im Review; keine echte Nachbestellung oder Nachricht."],
    lastReviewed: "2026-06-19",
  },
  {
    id: "rag-vertragsassistent",
    slug: "rag-vertragsassistent",
    n: "06",
    category: "RAG",
    level: "mittel",
    size: "s-med",
    dark: false,
    accent: true,
    title: "Vertrags-Assistent.",
    titleKicker: "Chat mit §-Verweis.",
    background: "Keyword-Suche · 8 Beispieldokumente · Antwort mit Quellenkarte",
    description:
      "Beispielklauseln werden per Keyword-Suche gefunden, zitiert und mit einer Unsicherheitsnotiz versehen. Das Praxisbeispiel zeigt auch, wann ein System nicht antworten sollte.",
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
    syntheticDataLabel: "Fiktives Vertragsarchiv; keine echte Dokumentensuche.",
    riskNotes: ["Quellenzitate reduzieren Risiko, garantieren aber keine richtige Rechtsauslegung."],
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
    syntheticDataLabel: "Fiktive Rechnung und simulierte SAP-Prüfung.",
    riskNotes: ["Niedrige Extraktionssicherheit muss Import und Buchung stoppen."],
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
    titleKicker: "DSGVO-Guard.",
    background: "Regelbasierte Token-Klassifikation · lokal ausführbares Muster",
    description:
      "Regeln markieren PII, IBANs und vertrauliche Begriffe, bevor ein Prompt freigegeben wird. Treffer sind Hinweise, keine fehlerfreie Klassifikation.",
    tags: ["DSGVO", "On-Prem", "Live"],
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
    syntheticDataLabel: "Regelbasierte Browserdemo mit Beispieltexten.",
    riskNotes: ["False Positives und False Negatives bleiben möglich."],
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
    title: "Cost & Drift.",
    titleKicker: "Kosten und Drift im Blick.",
    background: "Seed-Szenarien · Kosten, Fehler und Drift als Lernspur",
    description:
      "Seed-Szenarien zeigen Kosten, Fehler und Drift-Indikatoren. Die Werte sind Lernannahmen, keine gemessene Produktionsmetrik.",
    tags: ["OTel", "Alerts", "Drift"],
    meta: [
      { label: "Lernziel", value: "Betrieb messen" },
      { label: "Budget", value: "Alert statt Blindflug" },
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
    syntheticDataLabel: "Seed-Szenarien; keine Live-Telemetrie.",
    riskNotes: ["Echte Observability braucht eigene Messpunkte, Budgets und Eskalationsregeln."],
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
    title: "Fine-Tuning-Playground.",
    titleKicker: "Basismodell vs. Domäne.",
    background: "Vergleich Baseline vs. Domänenbeispiele",
    description:
      "Dieselbe Frage, zwei Beispielantworten: Baseline und domänennahe Antwort. Das Praxisbeispiel zeigt auch, wann RAG oder Prompting naheliegender ist.",
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
    syntheticDataLabel: "Fiktive Trainings- und Holdout-Beispiele.",
    riskNotes: ["Fine-Tuning ist nicht automatisch besser als RAG, Prompting oder Prozessklarheit."],
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
    titleKicker: "Formel statt Bauchgefühl.",
    background: "Headcount × Stundensatz × Adoption × gesparte Stunden",
    description:
      "Welche Annahmen machen einen KI-Use-Case plausibel? Das Praxisbeispiel legt Formel und Unsicherheitsband offen.",
    tags: ["ROI", "Kalkulation", "Transparent"],
    meta: [
      { label: "Eingaben", value: "4 Annahmen" },
      { label: "Ergebnis", value: "Szenario" },
      { label: "Formel", value: "offen dokumentiert" },
      { label: "Adoption-Annahme", value: "30–80%" },
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
    syntheticDataLabel: "Rechenmodell mit editierbaren Beispielannahmen.",
    riskNotes: ["ROI ist eine Annahmenrechnung und kein Ergebnisversprechen."],
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
    title: "LLM-Qualitätsmessung.",
    titleKicker: "Eval, Drift, Feedback-Loop.",
    background: "Fiktive Eval-Metriken · Drift-Indikator · menschliches Feedback vs. Auto-Eval",
    description:
      "Wie misst man, ob ein LLM-System besser oder schlechter wird? Das Praxisbeispiel zeigt Eval-Metriken, Drift-Erkennung und den Moment, wo automatische und menschliche Bewertung auseinanderlaufen.",
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
    syntheticDataLabel: "Fiktive Eval-Metriken; keine Live-Telemetrie.",
    riskNotes: [
      "Automatische Eval-Scores ersetzen keine menschliche Qualitätsprüfung.",
      "Drift-Erkennung braucht eigene Baseline und Schwellenwerte je Anwendungsfall.",
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
