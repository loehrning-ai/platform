import type { Locale } from "@/lib/i18n/locale";
import {
  DEMO_LEVEL_LABELS,
  demos,
  type Demo,
  type DemoCategory,
  type DemoLevel,
} from "@/lib/demos";

type DemoLocalizedFields = Pick<
  Demo,
  | "title"
  | "titleKicker"
  | "background"
  | "description"
  | "tags"
  | "meta"
  | "industries"
  | "syntheticDataLabel"
  | "riskNotes"
>;

const ENGLISH_DEMO_FIELDS: Readonly<Record<string, DemoLocalizedFields>> = {
  excel: {
    title: "Claude in Excel.",
    titleKicker: "Formulas, pivots, forecasts.",
    background: "Excel add-in · Microsoft 365 · no additional software",
    description:
      "An analyst selects a sample range. The example shows how formula suggestions, pivot-table drafts, and forecast checks can fit into an existing spreadsheet workflow.",
    tags: ["Excel add-in", "M365", "Fundamentals"],
    meta: [
      { label: "Learning objective", value: "Check formulas" },
      { label: "Tool", value: "Excel + Claude" },
      { label: "Practice data", value: "Spreadsheet range" },
      { label: "Task", value: "Pivot + forecast" },
      { label: "Data protection", value: "Check tenant settings" },
    ],
    industries: ["Controlling", "Finance", "Small and medium-sized businesses"],
    syntheticDataLabel: "Fictional spreadsheet values; no Microsoft 365 connection.",
    riskNotes: ["Formulas and forecasts require a subject-matter review."],
  },
  word: {
    title: "Claude in Word.",
    titleKicker: "Structure documents.",
    background: "Word lab · style checks with sample documents",
    description:
      "Enter a brief and inspect a structured draft, followed by checks for style, sources, approval, and sensitive data.",
    tags: ["Word add-in", "M365", "Fundamentals"],
    meta: [
      { label: "Learning objective", value: "Refine a brief" },
      { label: "Tool", value: "Word + Claude" },
      { label: "Practice data", value: "Sample documents" },
      { label: "Checks", value: "Style + facts" },
      { label: "Data protection", value: "Remove personal data" },
    ],
    industries: ["Engineering", "Skilled trades", "Professional services"],
    syntheticDataLabel: "Fictional documents; no access to actual Word files.",
    riskNotes: ["Remove or authorize sensitive data and sources before use."],
  },
  "outbound-workflow": {
    title: "Signals in the CRM.",
    titleKicker: "Explain each message.",
    background: "Sample database · signal scan · draft · review gate",
    description:
      "The pipeline takes fictional contacts, marks supported signals, and drafts a message that remains behind a review gate before any send action.",
    tags: ["DAG", "GitOps", "Open workflow"],
    meta: [
      { label: "Learning objective", value: "Ground messages in signals" },
      { label: "Tools", value: "Sample DB · LLM · review" },
      { label: "Practice data", value: "Fictional contacts" },
      { label: "Check", value: "Source for each signal" },
      { label: "Data protection", value: "Separate CRM data" },
    ],
    industries: ["B2B communications", "SaaS", "Services"],
    syntheticDataLabel: "Fictional contacts and domains; no email is sent.",
    riskNotes: [
      "Outbound communication requires source checks, a lawful basis, and an opt-out path.",
    ],
  },
  "agent-pipeline": {
    title: "Agent pipeline.",
    titleKicker: "Four roles, one memo.",
    background: "Multi-agent pattern · specialist roles · recorded trace",
    description:
      "A scout researches, an analyst synthesizes, a critic challenges, and an editor writes. This is a recorded editorial workflow, not a live agent run.",
    tags: ["Multi-agent", "Opus 4.5", "Recorded trace"],
    meta: [
      { label: "Learning objective", value: "Separate roles" },
      { label: "Agents", value: "4 specialists" },
      { label: "Output", value: "Memo + critique" },
      { label: "Check", value: "Red-team step" },
      { label: "Log", value: "Complete trace" },
    ],
    industries: ["Strategy", "Corporate development", "Investment"],
    syntheticDataLabel: "Recorded sample trace; no live agents run in the browser.",
    riskNotes: ["Role separation does not replace source and fact checks."],
  },
  "n8n-supply-chain": {
    title: "n8n supply chain.",
    titleKicker: "A dispatcher workflow.",
    background: "n8n pattern · simulated DHL, SAP, Slack, and email steps",
    description:
      "A fictional delivery delay moves through stock checks, a customer-message draft, escalation, and manual approval.",
    tags: ["n8n", "Self-hosted", "Supply chain"],
    meta: [
      { label: "Learning objective", value: "Read an automation flow" },
      { label: "Stack", value: "n8n · self-hosted" },
      { label: "Trigger", value: "Status change" },
      { label: "Check", value: "Fallback per step" },
      { label: "Data protection", value: "Define hosting" },
    ],
    industries: ["Logistics", "Manufacturing", "Wholesale"],
    syntheticDataLabel: "Fictional DHL, SAP, Slack, and email events.",
    riskNotes: ["External actions remain simulated; no order or message is sent."],
  },
  "rag-vertragsassistent": {
    title: "Contract assistant.",
    titleKicker: "Answers with clause references.",
    background: "Keyword search · 8 sample documents · answers with source cards",
    description:
      "Keyword search finds and quotes sample clauses, then adds an uncertainty note. The example also shows when the system should refuse to answer.",
    tags: ["Keyword search", "Rule-based", "DE / EN"],
    meta: [
      { label: "Learning objective", value: "Require sources" },
      { label: "Model class", value: "Haiku-class" },
      { label: "Pattern", value: "Retrieval + citation" },
      { label: "Check", value: "Source for each answer" },
      { label: "Data basis", value: "Document archive" },
    ],
    industries: ["Legal practice", "Procurement", "Legal operations"],
    syntheticDataLabel: "Fictional contract archive; no real document search.",
    riskNotes: [
      "Citations reduce ambiguity but do not guarantee a correct legal interpretation.",
    ],
  },
  "rechnung-zu-sap": {
    title: "Invoice to SAP.",
    titleKicker: "Check the extraction.",
    background: "OCR pattern · structured extraction · simulated SAP check",
    description:
      "A sample invoice is extracted, checked against explicit rules, and stopped for review before a simulated SAP import.",
    tags: ["OCR", "SAP · IDoc", "Invoice controls"],
    meta: [
      { label: "Learning objective", value: "Extract fields" },
      { label: "Formats", value: "PDF · scan · email" },
      { label: "Checks", value: "Duplicate + tax fields" },
      { label: "Output", value: "Structured data" },
      { label: "Control", value: "Review before import" },
    ],
    industries: ["Manufacturing", "Accounting", "Small and medium-sized businesses"],
    syntheticDataLabel: "Fictional invoice and simulated SAP check.",
    riskNotes: ["Low extraction confidence must stop import and posting."],
  },
  "prompt-scanner": {
    title: "Prompt scanner.",
    titleKicker: "Data and IP guard.",
    background: "Rule-based token classification · runs locally in the browser",
    description:
      "Rules mark personal data, IBANs, and confidential terms before a prompt is released. Matches are warnings, not complete classification.",
    tags: ["GDPR", "On-premises", "Rule-based"],
    meta: [
      { label: "Learning objective", value: "Identify sensitive data" },
      { label: "Pattern", value: "Local pre-check" },
      { label: "Deployment", value: "On-premises possible" },
      { label: "Audit", value: "Trail required" },
      { label: "Rules", value: "Configurable" },
    ],
    industries: ["Insurance", "Financial services", "Healthcare"],
    syntheticDataLabel: "Rule-based browser example with fictional text.",
    riskNotes: ["False positives and false negatives remain possible."],
  },
  "cost-drift-observability": {
    title: "Cost and drift.",
    titleKicker: "Inspect operating signals.",
    background: "Seeded scenarios · cost, errors, and drift as a learning trace",
    description:
      "Seeded scenarios expose cost, error, and drift indicators. Values are fixed learning assumptions, not measured production telemetry.",
    tags: ["OpenTelemetry", "Alerts", "Drift"],
    meta: [
      { label: "Learning objective", value: "Measure operations" },
      { label: "Budget", value: "Alert before overrun" },
      { label: "Stack", value: "OTel + Grafana" },
      { label: "Retention", value: "90 days" },
      { label: "Drift", value: "Check regularly" },
    ],
    industries: ["FinTech", "Platforms", "IT operations"],
    syntheticDataLabel: "Seeded scenarios; no live telemetry.",
    riskNotes: [
      "Production observability requires system-specific measurements, budgets, and escalation rules.",
    ],
  },
  "fine-tune-playground": {
    title: "Fine-tuning playground.",
    titleKicker: "Base model versus domain examples.",
    background: "Side-by-side baseline and domain-example responses",
    description:
      "Compare two sample answers to the same question: a baseline and a domain-adapted response. The example also identifies when retrieval or prompting is the simpler option.",
    tags: ["Fine-tuning", "Sonnet 4.6", "DACH"],
    meta: [
      { label: "Learning objective", value: "Compare against a baseline" },
      { label: "Training data", value: "Label examples" },
      { label: "Check", value: "Holdout questions" },
      { label: "Risk", value: "Overfitting" },
      { label: "Iteration", value: "Repeat evaluation" },
    ],
    industries: ["Manufacturing", "Technical services", "Specialist production"],
    syntheticDataLabel: "Fictional training and holdout examples.",
    riskNotes: [
      "Fine-tuning is not automatically better than retrieval, prompting, or a clearer process.",
    ],
  },
  "roi-rechner": {
    title: "Assumptions calculator.",
    titleKicker: "Expose the formula.",
    background: "Headcount × hourly cost × adoption × hours saved",
    description:
      "Which assumptions make an AI use case plausible? The calculator exposes the formula and uncertainty range instead of presenting a return promise.",
    tags: ["ROI", "Scenario model", "Transparent"],
    meta: [
      { label: "Inputs", value: "4 assumptions" },
      { label: "Result", value: "Scenario" },
      { label: "Formula", value: "Documented" },
      { label: "Adoption assumption", value: "30–80%" },
      { label: "Period", value: "12 months" },
    ],
    industries: ["Management", "Finance", "People operations"],
    syntheticDataLabel: "Editable example assumptions in a deterministic formula.",
    riskNotes: ["The result is a scenario calculation, not a return promise."],
  },
  "llm-observability": {
    title: "LLM quality measurement.",
    titleKicker: "Evaluation, drift, feedback.",
    background: "Fictional evaluation metrics · drift indicator · human review",
    description:
      "Inspect evaluation metrics, drift detection, and the point at which automated and human assessments disagree. All values are fixed examples.",
    tags: ["Observability", "Evaluation", "Drift"],
    meta: [
      { label: "Learning objective", value: "Measure quality" },
      { label: "Metrics", value: "BLEU · fluency · cost" },
      { label: "Boundary case", value: "Automated vs. human review" },
      { label: "Deployment", value: "Monitoring required" },
      { label: "Data source", value: "Seeded scenarios" },
    ],
    industries: ["FinTech", "Platforms", "IT operations"],
    syntheticDataLabel: "Fictional evaluation metrics; no live telemetry.",
    riskNotes: [
      "Automated evaluation scores do not replace human quality review.",
      "Drift detection requires a use-case-specific baseline and thresholds.",
    ],
  },
};

export const DEMO_CATEGORY_LABELS: Readonly<
  Record<Locale, Readonly<Record<DemoCategory, string>>>
> = {
  de: {
    Grundlagen: "Grundlagen",
    RAG: "RAG",
    Automation: "Automation",
    Governance: "Governance",
    Agents: "Agents",
    Ops: "Ops",
    Outbound: "Outbound",
    Modelle: "Modelle",
  },
  en: {
    Grundlagen: "Foundations",
    RAG: "Retrieval",
    Automation: "Automation",
    Governance: "Governance",
    Agents: "Agents",
    Ops: "Operations",
    Outbound: "Outbound",
    Modelle: "Models",
  },
};

export const DEMO_LEVEL_LABELS_BY_LOCALE: Readonly<
  Record<Locale, Readonly<Record<DemoLevel, string>>>
> = {
  de: DEMO_LEVEL_LABELS,
  en: {
    einstieg: "Entry",
    mittel: "Intermediate",
    fortg: "Advanced",
  },
};

export function getDemosForLocale(locale: Locale): readonly Demo[] {
  if (locale === "de") return demos;
  return demos.map((demo) => ({
    ...demo,
    ...ENGLISH_DEMO_FIELDS[demo.slug],
  }));
}

export function getDemoForLocale(slug: string, locale: Locale): Demo | undefined {
  return getDemosForLocale(locale).find((demo) => demo.slug === slug);
}

export function getNextDemoForLocale(current: Demo, locale: Locale): Demo {
  const localizedDemos = getDemosForLocale(locale);
  const index = localizedDemos.findIndex((demo) => demo.id === current.id);
  return localizedDemos[index < 0 ? 0 : (index + 1) % localizedDemos.length];
}

export function getDemoIndustries(locale: Locale): readonly string[] {
  const industries = new Set<string>();
  for (const demo of getDemosForLocale(locale)) {
    for (const industry of demo.industries) industries.add(industry);
  }
  return Array.from(industries).sort((a, b) =>
    a.localeCompare(b, locale === "de" ? "de" : "en"),
  );
}
