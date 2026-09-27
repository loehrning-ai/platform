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
  | "teaser"
  | "tags"
  | "meta"
  | "industries"
  | "syntheticDataLabel"
  | "riskNotes"
>;

const ENGLISH_DEMO_FIELDS: Readonly<Record<string, DemoLocalizedFields>> = {
  excel: {
    title: "Claude in Excel.",
    titleKicker: "Check formulas and a forecast.",
    background: "Excel add-in · Microsoft 365 · no additional software",
    description:
      "You select sales figures and get formula suggestions, a pivot draft and a forecast to check.",
    teaser: "You check formulas and a forecast on sales figures.",
    tags: ["Excel add-in", "M365", "Fundamentals"],
    meta: [
      { label: "Learning objective", value: "Check formulas" },
      { label: "Tool", value: "Excel + Claude" },
      { label: "Practice data", value: "Spreadsheet range" },
      { label: "Task", value: "Pivot + forecast" },
      { label: "Data protection", value: "Check tenant settings" },
    ],
    industries: ["Controlling", "Finance", "Small and medium-sized businesses"],
    syntheticDataLabel: "Nine fictional sales rows; the forecast is a simple linear projection.",
    riskNotes: [
      "Recalculate each suggested formula by hand for one row.",
      "Compare the forecast with the same weeks last year.",
      "Before real use, check whether your Microsoft 365 tenant allows Claude.",
    ],
  },
  word: {
    title: "Claude in Word.",
    titleKicker: "A draft from a brief.",
    background: "Word lab · style checks with sample documents",
    description:
      "Your brief becomes a structured draft that you check for style, sources and personal data.",
    teaser: "You check a draft from a brief for style and facts.",
    tags: ["Word add-in", "M365", "Fundamentals"],
    meta: [
      { label: "Learning objective", value: "Refine a brief" },
      { label: "Tool", value: "Word + Claude" },
      { label: "Practice data", value: "Sample documents" },
      { label: "Checks", value: "Style + facts" },
      { label: "Data protection", value: "Remove personal data" },
    ],
    industries: ["Engineering", "Skilled trades", "Professional services"],
    syntheticDataLabel: "Fictional briefs, sample documents, drafting time and style matches.",
    riskNotes: [
      "Remove names and customer data before the brief goes into the assistant.",
      "Check every figure and source in the draft against the original.",
      "Release the letter only after the data protection check.",
    ],
  },
  "outbound-workflow": {
    title: "Signals in the CRM.",
    titleKicker: "Messages with a source.",
    background: "Sample database · signal scan · draft · review gate",
    description:
      "The pipeline marks CRM signals with their source and drafts a message for each contact.",
    teaser: "A pipeline drafts messages that you review before sending.",
    tags: ["Pipeline", "Review gate", "Sources"],
    meta: [
      { label: "Learning objective", value: "Ground messages in signals" },
      { label: "Tools", value: "Sample DB · LLM · review" },
      { label: "Practice data", value: "Fictional contacts" },
      { label: "Check", value: "Source for each signal" },
      { label: "Data protection", value: "Separate CRM data" },
    ],
    industries: ["B2B communications", "SaaS", "Services"],
    syntheticDataLabel: "Invented contacts, domains and signals.",
    riskNotes: [
      "Check the source and date behind each signal.",
      "Establish the lawful basis before you contact anyone.",
      "Give every message an opt-out link.",
    ],
  },
  "agent-pipeline": {
    title: "Agent pipeline.",
    titleKicker: "A memo from four agent steps.",
    background: "Four roles: research, synthesis, critique, editing",
    description:
      "You read the recorded trace of four agents writing one memo together.",
    teaser: "You read the trace of four agents writing one memo together.",
    tags: ["Multi-agent", "Opus 4.5", "Recorded trace"],
    meta: [
      { label: "Learning objective", value: "Separate roles" },
      { label: "Agents", value: "4 specialists" },
      { label: "Output", value: "Memo + critique" },
      { label: "Check", value: "Red-team step" },
      { label: "Log", value: "Complete trace" },
    ],
    industries: ["Strategy", "Corporate development", "Investment"],
    syntheticDataLabel: "A recorded run; the brief, 42 documents and evidence scores are fictional.",
    riskNotes: [
      "Check the research sources yourself. The critique role only sees what the research delivered.",
      "Compare the critique's objections with the final memo.",
    ],
  },
  "n8n-supply-chain": {
    title: "A delivery delay in n8n.",
    titleKicker: "A workflow with sign-off.",
    background: "n8n pattern · simulated DHL, SAP, Slack, and email steps",
    description:
      "A delivery delay runs through a stock check, a customer draft and an escalation until the dispatcher signs off.",
    teaser: "A delivery delay runs through the n8n workflow to sign-off.",
    tags: ["n8n", "Self-hosted", "Supply chain"],
    meta: [
      { label: "Learning objective", value: "Read an automation flow" },
      { label: "Stack", value: "n8n · self-hosted" },
      { label: "Trigger", value: "Status change" },
      { label: "Check", value: "Fallback per step" },
      { label: "Data protection", value: "Define hosting" },
    ],
    industries: ["Logistics", "Manufacturing", "Wholesale"],
    syntheticDataLabel: "Invented DHL, SAP, Slack and email events, in the browser only.",
    riskNotes: [
      "Read the customer message draft before you sign it off.",
      "Decide who signs off the reorder when the dispatcher is away.",
    ],
  },
  "rag-vertragsassistent": {
    title: "Contract assistant.",
    titleKicker: "Answers with clause references.",
    background: "Keyword search · 6 sample documents · answers with source cards",
    description:
      "Keyword search finds clauses in six company documents and quotes them with their location. Without a match, the system does not answer.",
    teaser: "Quotes contract clauses with their location and stays silent without a match.",
    tags: ["Keyword search", "Rule-based", "DE / EN"],
    meta: [
      { label: "Learning objective", value: "Require sources" },
      { label: "Model class", value: "Haiku-class" },
      { label: "Pattern", value: "Retrieval + citation" },
      { label: "Check", value: "Source for each answer" },
      { label: "Data basis", value: "Document archive" },
    ],
    industries: ["Legal practice", "Procurement", "Legal operations"],
    syntheticDataLabel: "Six invented company documents.",
    riskNotes: [
      "Open the quoted clause and read it in context.",
      "A clause reference is not a legal interpretation. Disputed cases go to your legal team.",
    ],
  },
  "rechnung-zu-sap": {
    title: "Invoice to SAP.",
    titleKicker: "Check the extraction.",
    background: "OCR pattern · structured extraction · simulated SAP check",
    description:
      "A sample invoice is extracted, checked against explicit rules, and stopped for review before a simulated SAP import.",
    teaser: "A sample invoice is checked and stopped before the SAP import.",
    tags: ["OCR", "SAP · IDoc", "Invoice controls"],
    meta: [
      { label: "Learning objective", value: "Extract fields" },
      { label: "Formats", value: "PDF · scan · email" },
      { label: "Checks", value: "Duplicate + tax fields" },
      { label: "Output", value: "Structured data" },
      { label: "Control", value: "Review before import" },
    ],
    industries: ["Manufacturing", "Accounting", "Small and medium-sized businesses"],
    syntheticDataLabel: "Two invented invoice variants and a simulated SAP import.",
    riskNotes: [
      "Stop import and posting when extraction confidence is low.",
      "Check mandatory VAT fields and possible duplicates before sign-off.",
    ],
  },
  "prompt-scanner": {
    title: "Prompt scanner.",
    titleKicker: "Flag personal data in a prompt.",
    background: "Rule-based token classification · runs locally in the browser",
    description:
      "Rules flag names, IBANs and confidential terms before a prompt is released. They miss some cases, so each flag is only a hint.",
    teaser: "Flags names and IBANs in a prompt and misses some cases.",
    tags: ["GDPR", "On-premises", "Rule-based"],
    meta: [
      { label: "Learning objective", value: "Identify sensitive data" },
      { label: "Pattern", value: "Local pre-check" },
      { label: "Deployment", value: "On-premises possible" },
      { label: "Audit", value: "Trail required" },
      { label: "Rules", value: "Configurable" },
    ],
    industries: ["Insurance", "Financial services", "Healthcare"],
    syntheticDataLabel: "Invented sample texts, checked with regular expressions in your browser.",
    riskNotes: [
      "Read the prompt yourself before you release it, even when nothing is flagged.",
      "Check each flag, because harmless words get caught too.",
    ],
  },
  "cost-drift-observability": {
    title: "Cost and drift in production.",
    titleKicker: "Read cost, latency and errors.",
    background: "Seeded scenarios · cost, errors, and drift as a learning trace",
    description:
      "You compare cost, latency, errors and drift across four applications and read off which one costs most.",
    teaser: "You compare cost, latency and errors across four sample applications.",
    tags: ["OpenTelemetry", "Monitoring", "Drift"],
    meta: [
      { label: "Learning objective", value: "Measure operations" },
      { label: "Cost", value: "Per application" },
      { label: "Stack", value: "OTel + Grafana" },
      { label: "Retention", value: "90 days" },
      { label: "Drift", value: "Check regularly" },
    ],
    industries: ["FinTech", "Platforms", "IT operations"],
    syntheticDataLabel: "Four invented applications with invented measurements; the latency curve continues at random.",
    riskNotes: [
      "Set your own measurement points and a budget for each application.",
      "Decide in advance who acts on a budget alert.",
    ],
  },
  "fine-tune-playground": {
    title: "Fine-tuning against the base model.",
    titleKicker: "Two answers side by side.",
    background: "Base model compared with domain examples",
    description:
      "You compare the answers of a base model and an adapted model to the same question.",
    teaser: "You compare a base model with an adapted one.",
    tags: ["Fine-tuning", "Sonnet 4.6", "DACH"],
    meta: [
      { label: "Learning objective", value: "Compare against a baseline" },
      { label: "Training data", value: "Label examples" },
      { label: "Check", value: "Holdout questions" },
      { label: "Risk", value: "Overfitting" },
      { label: "Iteration", value: "Repeat evaluation" },
    ],
    industries: ["Manufacturing", "Technical services", "Specialist production"],
    syntheticDataLabel: "Seeded answers, metrics and training examples; no model was trained.",
    riskNotes: [
      "First check whether retrieval, a better prompt or a clearer process does the same job.",
      "Score the adapted model only on holdout questions it was not trained on.",
    ],
  },
  "roi-rechner": {
    title: "Assumptions calculator.",
    titleKicker: "A benefit from four assumptions.",
    background: "Headcount × hourly cost × adoption × hours saved",
    description:
      "You enter team size, hourly rate, adoption and hours saved and see the formula behind the result.",
    teaser: "You see the formula behind your team's ROI.",
    tags: ["ROI", "Scenario model", "Transparent"],
    meta: [
      { label: "Inputs", value: "4 assumptions" },
      { label: "Result", value: "Scenario" },
      { label: "Formula", value: "Documented" },
      { label: "Adoption assumption", value: "30–80%" },
      { label: "Period", value: "12 months" },
    ],
    industries: ["Management", "Finance", "People operations"],
    syntheticDataLabel: "Sample assumptions that you change yourself.",
    riskNotes: [
      "The result is a scenario. Back each assumption with your own measurement.",
      "Find the assumption that moves the result most and back it first.",
    ],
  },
  "llm-observability": {
    title: "Measuring answer quality.",
    titleKicker: "Automated and human scores side by side.",
    background: "Fictional evaluation metrics · drift indicator · human review",
    description:
      "You check the automated score for four answers. A person rated three of them too, and twice the automated score is off.",
    teaser: "You check where the automated score is wrong.",
    tags: ["Observability", "Evaluation", "Drift"],
    meta: [
      { label: "Learning objective", value: "Measure quality" },
      { label: "Metrics", value: "BLEU · fluency · cost" },
      { label: "Boundary case", value: "Automated vs. human review" },
      { label: "Deployment", value: "Monitoring required" },
      { label: "Data source", value: "Seeded scenarios" },
    ],
    industries: ["FinTech", "Platforms", "IT operations"],
    syntheticDataLabel: "Invented answers, scores and ratings; the drift indicator is seeded.",
    riskNotes: [
      "Have people re-check automated scores on a regular schedule.",
      "Set your own drift baseline and thresholds for each use case.",
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
