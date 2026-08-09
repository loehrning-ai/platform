import type { Locale } from "@/lib/i18n/locale";
import { DIMENSIONS, QUESTIONS, RATING_BANDS, STAGE_BANDS } from "./questions";
import type {
  DimensionId,
  DimensionMeta,
  Question,
  RatingBand,
  StageBand,
} from "./types";

const DIMENSIONS_EN: readonly DimensionMeta[] = [
  {
    id: "grundlagen",
    name: "Understand AI",
    short: "Basics",
    description: "What AI systems do and where their limits lie.",
    accent: "kupfer",
    iconName: "Lightbulb",
  },
  {
    id: "urteil",
    name: "Judge outputs",
    short: "Judgement",
    description: "Deepfakes, bias, and the reliability of model output.",
    accent: "amber",
    iconName: "ScanSearch",
  },
  {
    id: "recht",
    name: "Know the rules",
    short: "Rules",
    description: "What the EU AI Act means for everyday AI use.",
    accent: "kupfer",
    iconName: "Scale",
  },
  {
    id: "verantwortung",
    name: "Work responsibly",
    short: "Responsibility",
    description: "Data protection, transparency, and traceable decisions.",
    accent: "sand",
    iconName: "ShieldCheck",
  },
  {
    id: "praxis",
    name: "Apply AI at work",
    short: "Practice",
    description: "Use AI deliberately and check the resulting work.",
    accent: "amber",
    iconName: "Workflow",
  },
];

const QUESTIONS_EN: readonly Question[] = [
  {
    id: "g1",
    dimensionId: "grundlagen",
    text: "How confidently could you explain what an AI language model actually does?",
    options: [
      {
        score: 1,
        text: "I could not explain it. AI is a black box to me.",
        meaning: "Starting point: the underlying idea is still unclear.",
      },
      {
        score: 2,
        text: "I have a rough idea, but my explanation would be vague.",
        meaning: "You have an initial picture, but no clear model yet.",
      },
      {
        score: 3,
        text: "I can explain in my own words how a model generates text.",
        meaning: "You have a sound basis and can explain it to someone else.",
      },
      {
        score: 4,
        text: "I can also explain terms such as training and hallucination.",
        meaning: "You understand the concepts that later decisions rely on.",
      },
    ],
  },
  {
    id: "g2",
    dimensionId: "grundlagen",
    text: "An AI chat gives you a convincing answer. What do you assume?",
    options: [
      {
        score: 1,
        text: "If it reads fluently, it is probably correct.",
        meaning: "A confident answer can still be wrong.",
      },
      {
        score: 2,
        text: "I know errors are possible, but I rarely check.",
        meaning: "You recognise the risk, but do not yet have a routine.",
      },
      {
        score: 3,
        text: "I know models can invent details, so I check important claims.",
        meaning: "You treat model output as material to verify.",
      },
      {
        score: 4,
        text: "I can identify high-risk answers and choose a suitable check.",
        meaning: "You connect known failure modes to concrete controls.",
      },
    ],
  },
  {
    id: "u1",
    dimensionId: "urteil",
    text: "A video shows a public figure making an unusual statement. What do you do?",
    options: [
      {
        score: 1,
        text: "I would initially accept the video as genuine.",
        meaning:
          "Synthetic or manipulated video is not yet part of your assessment.",
      },
      {
        score: 2,
        text: "I would be sceptical, but would not know how to check it.",
        meaning: "You recognise uncertainty but lack a verification method.",
      },
      {
        score: 3,
        text: "I would inspect common warning signs and find the original source.",
        meaning: "You verify before treating the video as evidence.",
      },
      {
        score: 4,
        text: "I can identify manipulation patterns and explain the checks to others.",
        meaning:
          "You can apply and communicate a repeatable verification process.",
      },
    ],
  },
  {
    id: "u2",
    dimensionId: "urteil",
    text: "Why can an AI system disadvantage people in hiring or lending?",
    options: [
      {
        score: 1,
        text: "I do not know. I assumed AI systems were neutral.",
        meaning: "Training data and system design can carry existing bias.",
      },
      {
        score: 2,
        text: "I have heard about bias, but could not explain it.",
        meaning: "You know the term but not yet the mechanism.",
      },
      {
        score: 3,
        text: "I know models can reproduce patterns and bias from their data.",
        meaning: "You understand one central source of discriminatory output.",
      },
      {
        score: 4,
        text: "I can name examples and suitable ways to detect or reduce bias.",
        meaning: "You connect the risk to concrete evaluation and controls.",
      },
    ],
  },
  {
    id: "r1",
    dimensionId: "recht",
    text: "How familiar are you with the EU regulation governing AI, the AI Act?",
    options: [
      {
        score: 1,
        text: "I have not heard of it.",
        meaning: "The legal framework is new to you.",
      },
      {
        score: 2,
        text: "I know the name, but not what the regulation covers.",
        meaning: "You know rules exist but cannot yet apply them.",
      },
      {
        score: 3,
        text: "I understand the basic risk-based structure.",
        meaning: "You can place a use case in the regulation's broad logic.",
      },
      {
        score: 4,
        text: "I can distinguish relevant roles and obligations for a use case.",
        meaning: "You can move from the regulation to a concrete assessment.",
      },
    ],
  },
  {
    id: "r2",
    dimensionId: "recht",
    text: "When must people be told that they are interacting with AI or seeing AI-generated content?",
    options: [
      {
        score: 1,
        text: "I have not considered that question.",
        meaning: "AI transparency duties are new to you.",
      },
      {
        score: 2,
        text: "I assume rules exist, but I do not know the cases.",
        meaning: "You recognise a likely duty but cannot yet classify it.",
      },
      {
        score: 3,
        text: "I know chatbots and some synthetic content require disclosure.",
        meaning: "You know the main transparency principle.",
      },
      {
        score: 4,
        text: "I can identify relevant cases and plan an appropriate disclosure.",
        meaning: "You can turn the transparency duty into an operating step.",
      },
    ],
  },
  {
    id: "v1",
    dimensionId: "verantwortung",
    text: "You want to paste work material into an AI chat. What do you check first?",
    options: [
      {
        score: 1,
        text: "I paste in whatever I need for the task.",
        meaning: "The data-protection check is still missing.",
      },
      {
        score: 2,
        text: "I hesitate with sensitive data, but decide case by case without a rule.",
        meaning: "You recognise the issue but lack a reliable boundary.",
      },
      {
        score: 3,
        text: "I check for personal, confidential, or restricted information.",
        meaning: "You assess the data before choosing the tool or input.",
      },
      {
        score: 4,
        text: "I follow explicit rules for permitted data, tools, and retention.",
        meaning: "Your handling is consistent and can be reviewed.",
      },
    ],
  },
  {
    id: "v2",
    dimensionId: "verantwortung",
    text: "AI influenced an important decision. What do you record?",
    options: [
      {
        score: 1,
        text: "Nothing. Only the final result matters.",
        meaning:
          "The contribution of the system cannot be reconstructed later.",
      },
      {
        score: 2,
        text: "I remember the broad process, but do not document it.",
        meaning: "The reasoning remains dependent on memory.",
      },
      {
        score: 3,
        text: "I record that AI was used and what it contributed.",
        meaning: "The role of the system remains traceable.",
      },
      {
        score: 4,
        text: "I record the input, checks, output, and final human decision.",
        meaning: "Another person can inspect how the decision was reached.",
      },
    ],
  },
  {
    id: "p1",
    dimensionId: "praxis",
    text: "How do you approach a task that AI might help with?",
    options: [
      {
        score: 1,
        text: "I complete it manually and do not consider AI.",
        meaning: "AI is not yet part of your tool selection.",
      },
      {
        score: 2,
        text: "I enter a short request and use the first response.",
        meaning: "You are experimenting, but without a defined method.",
      },
      {
        score: 3,
        text: "I state the context and goal, then refine the work through questions.",
        meaning: "You give the system enough structure to work deliberately.",
      },
      {
        score: 4,
        text: "I design reusable workflows for recurring tasks and their checks.",
        meaning: "You turn repeated use into a controlled process.",
      },
    ],
  },
  {
    id: "p2",
    dimensionId: "praxis",
    text: "How do you check AI-generated work before using it?",
    options: [
      {
        score: 1,
        text: "I normally use the output as provided.",
        meaning: "A review step is still missing.",
      },
      {
        score: 2,
        text: "I read it once, but tend to trust it when uncertain.",
        meaning: "You inspect the output but do not yet test it.",
      },
      {
        score: 3,
        text: "I verify facts and edit the output for its intended use.",
        meaning: "You remain responsible for the final work.",
      },
      {
        score: 4,
        text: "I use defined checks based on the task's likely failure modes.",
        meaning: "Review is a repeatable part of your workflow.",
      },
    ],
  },
];

const STAGE_BANDS_EN: readonly StageBand[] = [
  {
    level: 1,
    label: "Starting",
    min: 0,
    max: 20,
    blurb:
      "The basic concepts and checks are still new. Start with how models work, what can fail, and which data must stay out.",
  },
  {
    level: 2,
    label: "Oriented",
    min: 20,
    max: 40,
    blurb:
      "You recognise the main topics. A consistent method for verification, data handling, and rules is the next requirement.",
  },
  {
    level: 3,
    label: "Practised",
    min: 40,
    max: 60,
    blurb:
      "You can use AI for ordinary work and identify several risks. Focused practice can make the weaker fields reliable.",
  },
  {
    level: 4,
    label: "Confident",
    min: 60,
    max: 80,
    blurb:
      "You use AI deliberately and can explain your checks. Refine the legal and operational details that matter in your role.",
  },
  {
    level: 5,
    label: "Independent",
    min: 80,
    max: 100,
    blurb:
      "You evaluate AI critically, protect data, and document important decisions. Use the field scores to choose a narrow advanced topic.",
  },
];

const RATING_BANDS_EN: readonly RatingBand[] = [
  { min: 0, max: 25, label: "Starting", toneVar: "--color-brand-amber" },
  { min: 25, max: 50, label: "Developing", toneVar: "--color-brand-amber" },
  { min: 50, max: 75, label: "Established", toneVar: "--color-brand-sand" },
  { min: 75, max: 100.01, label: "Strong", toneVar: "--color-brand-orange" },
];

export const KI_CHECK_UI_COPY = {
  de: {
    resultEyebrow: "KI-Check · Dein Ergebnis",
    resultTitle: "Hier stehst du gerade.",
    resultIntroduction:
      "Dein Profil über fünf Kompetenzfelder und ein passender nächster Kurs. Die Auswertung findet nur in diesem Browser statt.",
    overall: "Gesamtstand",
    level: "Stufe",
    strength: "Deine Stärke",
    gap: "Größter Lernbedarf",
    fieldsTitle: "Deine fünf Kompetenzfelder",
    fieldsBody: "Die Balken zeigen den berechneten Stand je Feld.",
    nextStep: "Dein nächster Schritt",
    startCourse: "Kurs starten",
    courseOverview: "Erst zur Kursübersicht",
    pathway: "Dein Platz auf dem KI-Kompetenzweg",
    restart: "Check erneut starten",
    quizEyebrow: "KI-Kompetenzweg · KI-Check",
    quizTitle: "Wo stehst du?",
    quizIntroduction:
      "Zehn kurze Fragen, kein Login, keine Datenspeicherung. Danach erhältst du ein Kompetenzprofil und eine Kursempfehlung.",
    question: "Frage",
    of: "von",
    progressLabel: "Fortschritt im KI-Check",
    back: "Zurück",
    result: "Zum Ergebnis",
    next: "Weiter",
    reassurance:
      "Antworte nach deiner tatsächlichen Praxis. Es gibt kein bestanden oder nicht bestanden.",
    pathwayLabels: {
      pruefen: "Prüfen",
      grundlagen: "Verstehen",
      regeln: "Einordnen",
      anwenden: "Umsetzen",
      dokumentieren: "Belegen",
      vertiefen: "Vertiefen",
    },
  },
  en: {
    resultEyebrow: "AI check · Result",
    resultTitle: "Current profile.",
    resultIntroduction:
      "Your scores across five fields and one relevant next course. The calculation stays in this browser.",
    overall: "Overall score",
    level: "Level",
    strength: "Strongest field",
    gap: "Main learning gap",
    fieldsTitle: "Five competency fields",
    fieldsBody: "Each bar shows the calculated score for one field.",
    nextStep: "Next course",
    startCourse: "Start course",
    courseOverview: "View course overview first",
    pathway: "Position in the AI competency path",
    restart: "Restart check",
    quizEyebrow: "AI competency path · AI check",
    quizTitle: "What is your current level?",
    quizIntroduction:
      "Ten short questions, no login, and no stored answers. You receive a competency profile and one course recommendation.",
    question: "Question",
    of: "of",
    progressLabel: "Progress through the AI check",
    back: "Back",
    result: "View result",
    next: "Next",
    reassurance:
      "Answer for your actual working practice. This is not a pass or fail test.",
    pathwayLabels: {
      pruefen: "Assess",
      grundlagen: "Understand",
      regeln: "Classify",
      anwenden: "Apply",
      dokumentieren: "Document",
      vertiefen: "Deepen",
    },
  },
} as const;

export const KI_CHECK_PAGE_COPY = {
  de: {
    title: "KI-Check: Wo stehst du?",
    description:
      "Zehn Fragen ordnen fünf Kompetenzfelder ein und führen zu einem passenden Kurs. Kein Login und keine Datenspeicherung.",
    applicationName: "KI-Check",
  },
  en: {
    title: "AI check: assess your current level",
    description:
      "Ten questions assess five AI competency fields and identify a relevant course. No login and no stored answers.",
    applicationName: "AI competency check",
  },
} as const;

export const KI_CHECK_CONTENT: Readonly<
  Record<
    Locale,
    {
      readonly dimensions: readonly DimensionMeta[];
      readonly questions: readonly Question[];
      readonly stageBands: readonly StageBand[];
      readonly ratingBands: readonly RatingBand[];
    }
  >
> = {
  de: {
    dimensions: DIMENSIONS,
    questions: QUESTIONS,
    stageBands: STAGE_BANDS,
    ratingBands: RATING_BANDS,
  },
  en: {
    dimensions: DIMENSIONS_EN,
    questions: QUESTIONS_EN,
    stageBands: STAGE_BANDS_EN,
    ratingBands: RATING_BANDS_EN,
  },
};

export function localizedDimension(
  locale: Locale,
  id: DimensionId,
): DimensionMeta {
  const dimension = KI_CHECK_CONTENT[locale].dimensions.find(
    (candidate) => candidate.id === id,
  );
  if (!dimension) throw new Error(`Unknown KI-Check dimension: ${id}`);
  return dimension;
}

export function localizedStage(locale: Locale, level: number): StageBand {
  const band = KI_CHECK_CONTENT[locale].stageBands.find(
    (candidate) => candidate.level === level,
  );
  if (!band) throw new Error(`Unknown KI-Check stage: ${level}`);
  return band;
}

export function localizedRating(locale: Locale, score: number): RatingBand {
  const bands = KI_CHECK_CONTENT[locale].ratingBands;
  return (
    bands.find((band) => score >= band.min && score < band.max) ??
    bands[bands.length - 1]
  );
}
