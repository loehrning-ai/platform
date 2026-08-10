import type { Locale } from "@/lib/i18n/locale";
import type { Widget } from "@/lib/widgets/types";

const ENGLISH_REDACTION_SCENARIOS = [
  {
    id: "s1",
    label: "Server log",
    intro:
      "A colleague wants to paste this error log into an AI tool. Mark everything that must not leave the organization.",
    segments: [
      { text: "Help me diagnose this order-system error:\n\n" },
      { text: "[2026-05-14 14:22] POST /api/v2/orders " },
      {
        text: "Authorization: Bearer sk-EXAMPLE-not-real",
        sensitive: "API access token",
      },
      { text: "\n[2026-05-14 14:22] customer=" },
      {
        text: "customer-alpha@example.invalid",
        sensitive: "Customer email address (personal data)",
      },
      {
        text: " amount=128.40 EUR\n[2026-05-14 14:22] error: PAYMENT_DECLINED (attempt 3 of 3)\ndelivery_note=",
      },
      { text: "DN-2026-04881" },
      { text: "\n\nWhy did the payment fail, and what should the retry do?" },
    ],
  },
  {
    id: "s2",
    label: "Customer email",
    intro:
      "This complaint email is going to be summarized by an AI tool. Mark only the information that requires protection.",
    segments: [
      { text: "Summarize this customer complaint in two sentences:\n\n" },
      { text: "Dear Sir or Madam, I refer to order " },
      { text: "ORD-99214" },
      {
        text: " from the explicitly fictional Fiktivwerk Example Ltd. The delivery arrived damaged. Please refund the amount to my account ",
      },
      {
        text: "DE00 0000 0000 0000 0000 00 (DUMMY)",
        sensitive: "IBAN (bank details)",
      },
      { text: ". You can reach me at " },
      {
        text: "+49 000 000000 (DUMMY)",
        sensitive: "Private telephone number",
      },
      { text: ". My customer login is customer4471 and the password is " },
      {
        text: "DUMMY-PASSWORD-DO-NOT-USE",
        sensitive: "Plain-text password",
      },
      { text: ". Kind regards, " },
      {
        text: "Fictional Person Alpha",
        sensitive: "Name of a private individual",
      },
    ],
  },
] as const;

const ENGLISH_FAILURE_MODES = [
  {
    id: "halluzination",
    label: "Hallucination",
    desc: "Invented a fact and stated it confidently.",
  },
  {
    id: "verweigerung",
    label: "Over-refusal",
    desc: "Refused a harmless request.",
  },
  {
    id: "formatdrift",
    label: "Format drift",
    desc: "Ignored the requested output format.",
  },
  {
    id: "themaverfehlung",
    label: "Off task",
    desc: "Answered a different question.",
  },
] as const;

const ENGLISH_FAILURE_CASES = [
  {
    id: "c1",
    prompt: "What is the current balance of our business bank account?",
    output:
      "Your business account currently has a balance of EUR 48,213.77, last updated on 14 May at 09:42.",
    correct: "halluzination",
    why: "The model has no access to the bank account. The balance, date, and time are invented, even though they sound plausible.",
  },
  {
    id: "c2",
    prompt:
      "Create a sample customer list with three fictional companies: name, industry, contact person.",
    output:
      "I cannot do that because I am not allowed to generate personal data about real people or companies.",
    correct: "verweigerung",
    why: "The request explicitly asked for fictional sample data and was harmless. The refusal was unnecessary.",
  },
  {
    id: "c3",
    prompt:
      'Return only a CSV table with the columns "item_number", "description", and "stock". No explanation.',
    output:
      "Here is an overview of your items:\n\n- A-1001: M6 screw (240 units)\n- A-1002: NBR seal (58 units)\n- A-1003: Bearing block (12 units)\n\nWould you like anything else?",
    correct: "formatdrift",
    why: "The request required plain CSV with no explanation. The response supplied a bulleted list, an introduction, and a follow-up question.",
  },
  {
    id: "c4",
    prompt: "Summarize the attached customer complaint in one sentence.",
    output:
      "Complaints can often be prevented. Here are seven practices for complaint management: 1. Respond quickly 2. Show understanding 3. Offer a solution ...",
    correct: "themaverfehlung",
    why: "The model gave general advice instead of summarizing the specific document.",
  },
  {
    id: "c5",
    prompt: "Which version of our internal quotation template is approved?",
    output:
      "Version 3.2 is currently approved. It was released on 3 April with a revised discount block and a new footer.",
    correct: "halluzination",
    why: "The model cannot know the internal version history. The version number, date, and changes are invented.",
  },
] as const;

const ENGLISH_REDACTION_COPY = {
  kindLabel: "Data-redaction drill",
  chooseScenarioAriaLabel: "Choose a scenario",
  scenarioWord: "Scenario",
  redactedTag: "<REDACTED>",
  redactedAriaPrefix: "Redacted:",
  redactedAriaSuffix: "(select to restore)",
  riskyAriaPrefix: "Sensitive:",
  riskyAriaSuffix: "(select to redact)",
  legendRiskyLabel: "sensitive, select to redact",
  legendRedactedChip: "redacted",
  legendCleanedLabel: "clean",
  countSuffix: "found",
  submitLabel: "Check redaction",
  resetLabel: "Reset",
  cleanStatusLabel: "Clean",
  leakStatusLabel: "Leak",
  allScenariosCleanLabel: "Both scenarios are clean",
  scenarioOfWord: "of",
  safeHeadline: "Safe to paste.",
  safeBodyTemplate:
    "All {n} sensitive passages were found without redacting harmless text.",
  notSafeHeadline: "Do not paste this yet.",
  missingSingularTemplate: "{n} sensitive passage remains exposed.",
  missingPluralTemplate: "{n} sensitive passages remain exposed.",
  mistakesSingularTemplate: "{n} harmless passage was redacted unnecessarily.",
  mistakesPluralTemplate: "{n} harmless passages were redacted unnecessarily.",
} as const;

const ENGLISH_FAILURE_COPY = {
  kindLabel: "Evaluation drill",
  promptLabel: "Request",
  outputLabel: "AI response",
  tagAriaLabelPrefix: "Failure type for:",
  correctSuffix: "correct",
  taggedSuffix: "classified",
  submitLabel: "Evaluate",
  passedLabel: "Passed",
  retryPromptLabel: "Review the cases",
  resetLabel: "Reset",
  perCaseCorrectLabel: "Correct.",
  perCaseWrongLabel: "Incorrect.",
} as const;

const ENGLISH_RISK_PYRAMID_NODES = [
  {
    id: "verboten",
    label: "Prohibited practices",
    sub: "Uses prohibited by Article 5, subject to the conditions and exceptions stated there",
    weight: 1,
  },
  {
    id: "hochrisiko",
    label: "High-risk systems",
    sub: "Systems classified under Article 6 and Annex I or III",
    weight: 0.78,
  },
  {
    id: "transparenz",
    label: "Transparency duties",
    sub: "Specific AI interactions and generated or manipulated content covered by Article 50",
    weight: 0.5,
  },
  {
    id: "minimal",
    label: "Minimal risk",
    sub: "Uses outside those categories, still subject to other applicable law and internal controls",
    weight: 0.32,
  },
] as const;

const ENGLISH_DIAGRAM_COPY = {
  kindLabel: "Risk map",
  inspectHeading: "Select a layer",
  inspectBody: "Select a layer to inspect its role and consequences.",
  consequencePrefix: "If this layer is missing:",
  traceComplete: "Sequence complete.",
  tracing: "Sequence is running…",
  traceIdle: "Start the sequence.",
  traceButton: "Run sequence",
} as const;

const ENGLISH_RISK_REORDER_BLOCKS = [
  {
    id: "verboten",
    label: "Prohibited practices",
    sample: "Uses prohibited by Article 5 where its stated conditions apply.",
  },
  {
    id: "hochrisiko",
    label: "High-risk systems",
    sample: "Systems classified under Article 6 and Annex I or III.",
  },
  {
    id: "transparenz",
    label: "Transparency duties",
    sample: "Specific interactions and content covered by Article 50.",
  },
  {
    id: "minimal",
    label: "Minimal risk",
    sample: "Uses outside those categories, without special AI Act duties merely because they use AI.",
  },
] as const;

const ENGLISH_RISK_REORDER_COPY = {
  kindLabel: "Classification order",
  shuffleLabel: "Shuffle",
  moveUpSuffix: "move up",
  moveDownSuffix: "move down",
  correctStatusLabel: "Correct. This is the classification sequence used by the exercise.",
  wrongStatusLabel: "Not yet. Rows shown in green are in the correct position.",
  idleStatusLabel: "Order the cards, then check the result.",
  checkLabel: "Check order",
} as const;

/**
 * Applies locale-specific chrome and built-in scenarios without modifying the
 * authored JSON. Machine IDs and checkpoint keys therefore remain identical
 * across languages.
 */
export function localizeCourseWidgetProps(
  widget: Widget,
  locale: Locale,
): Readonly<Record<string, unknown>> {
  const props = { ...(widget.props ?? {}) };
  if (locale !== "en") return props;

  switch (widget.kind) {
    case "compare":
      return { ...props, kindLabel: "Comparison" };
    case "redaction-drill":
      return {
        ...props,
        scenarios: ENGLISH_REDACTION_SCENARIOS,
        copy: ENGLISH_REDACTION_COPY,
      };
    case "failure-tagger":
      return {
        ...props,
        ...(widget.courseSlug === "ki-fuehrerschein" || !props.modes
          ? { modes: ENGLISH_FAILURE_MODES }
          : {}),
        ...(widget.courseSlug === "ki-fuehrerschein" || !props.cases
          ? { cases: ENGLISH_FAILURE_CASES }
          : {}),
        copy: ENGLISH_FAILURE_COPY,
      };
    case "risk-pyramid":
      return {
        ...props,
        nodes: ENGLISH_RISK_PYRAMID_NODES,
        copy: ENGLISH_DIAGRAM_COPY,
      };
    case "drag-reorder":
      return {
        ...props,
        blocks: ENGLISH_RISK_REORDER_BLOCKS,
        copy: ENGLISH_RISK_REORDER_COPY,
      };
    default:
      return props;
  }
}
