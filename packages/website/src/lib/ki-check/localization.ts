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
    text: "Could you explain what an AI language model does?",
    options: [
      {
        score: 1,
        text: "No, AI is a black box to me.",
        meaning: "The basic idea is still missing.",
      },
      {
        score: 2,
        text: "Roughly, but it would stay vague.",
        meaning: "You have a first picture, but no clear model yet.",
      },
      {
        score: 3,
        text: "Yes, I can say in my own words how it writes text.",
        meaning: "You can explain it to others.",
      },
      {
        score: 4,
        text: "Yes, including terms like training and hallucination.",
        meaning: "You know the terms everything else builds on.",
      },
    ],
  },
  {
    id: "g2",
    dimensionId: "grundlagen",
    text: "An AI chat answers convincingly. What do you assume?",
    options: [
      {
        score: 1,
        text: "If it reads fluently, it is probably right.",
        meaning: "A confident answer can still be wrong.",
      },
      {
        score: 2,
        text: "Errors are possible, but I rarely check.",
        meaning: "You see the risk, but have no routine yet.",
      },
      {
        score: 3,
        text: "AI can invent details, so I check important claims.",
        meaning: "You treat AI answers as material to check.",
      },
      {
        score: 4,
        text: "I spot high-risk answers and choose a suitable check.",
        meaning: "You link known failure modes to suitable controls.",
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
        text: "I take the video as genuine for now.",
        meaning:
          "You do not yet check for deepfakes.",
      },
      {
        score: 2,
        text: "I am sceptical but cannot tell how to spot a fake.",
        meaning: "You have doubts but no method to check.",
      },
      {
        score: 3,
        text: "I look for typical warning signs and the original source.",
        meaning: "You check before you share.",
      },
      {
        score: 4,
        text: "I spot manipulation patterns and show others how to check.",
        meaning:
          "Others can repeat your checking method.",
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
        text: "No idea, I thought AI was neutral.",
        meaning: "Training data can carry existing bias.",
      },
      {
        score: 2,
        text: "I have heard about bias, but could not explain it.",
        meaning: "You know the word bias, but not the mechanism.",
      },
      {
        score: 3,
        text: "I know AI takes on bias from its training data.",
        meaning: "You know where bias comes from.",
      },
      {
        score: 4,
        text: "I know examples and ways to detect and reduce bias.",
        meaning: "You link the risk to tests and countermeasures.",
      },
    ],
  },
  {
    id: "r1",
    dimensionId: "recht",
    text: "How well do you know the AI Act, the EU's AI regulation?",
    options: [
      {
        score: 1,
        text: "I have not heard of it.",
        meaning: "The legal framework is new to you.",
      },
      {
        score: 2,
        text: "I know the name, but not the content.",
        meaning: "You know that rules exist.",
      },
      {
        score: 3,
        text: "I know the basic idea of the risk classes.",
        meaning: "You can roughly follow its logic.",
      },
      {
        score: 4,
        text: "I know the roles and duties for a concrete case.",
        meaning: "You can assess concrete cases.",
      },
    ],
  },
  {
    id: "r2",
    dimensionId: "recht",
    text: "When must people be told they are talking to AI or seeing AI content?",
    options: [
      {
        score: 1,
        text: "No idea, I have never thought about it.",
        meaning: "AI transparency duties are new to you.",
      },
      {
        score: 2,
        text: "I assume there are rules but do not know them.",
        meaning: "You suspect a duty but cannot place it yet.",
      },
      {
        score: 3,
        text: "I know chatbots and certain AI content must be labelled.",
        meaning: "You know the labelling duty.",
      },
      {
        score: 4,
        text: "I know which cases need disclosure and how to do it.",
        meaning: "You turn the duty into a working step.",
      },
    ],
  },
  {
    id: "v1",
    dimensionId: "verantwortung",
    text: "You want to paste work content into an AI chat. What do you check first?",
    options: [
      {
        score: 1,
        text: "I paste in whatever I have.",
        meaning: "The data-protection check is still missing.",
      },
      {
        score: 2,
        text: "I hesitate with sensitive data but decide by gut feeling.",
        meaning: "You see the issue but lack clear rules.",
      },
      {
        score: 3,
        text: "I check for personal or confidential data.",
        meaning: "You check the data before you enter it.",
      },
      {
        score: 4,
        text: "I follow clear rules on which data may go in.",
        meaning: "Your handling is consistent and reviewable.",
      },
    ],
  },
  {
    id: "v2",
    dimensionId: "verantwortung",
    text: "AI helped you with an important decision. What do you record?",
    options: [
      {
        score: 1,
        text: "Nothing, the result is what counts.",
        meaning:
          "Later, no one can see what the AI contributed.",
      },
      {
        score: 2,
        text: "I remember roughly but write nothing down.",
        meaning: "The reasoning depends on your memory.",
      },
      {
        score: 3,
        text: "I note that I used AI and for what.",
        meaning: "Your AI use is traceable.",
      },
      {
        score: 4,
        text: "I record prompt, check, output and my decision.",
        meaning: "Others can check how the decision was reached.",
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
        text: "I do everything by hand; AI does not occur to me.",
        meaning: "AI is not yet one of your tools.",
      },
      {
        score: 2,
        text: "I type a short line and take what comes.",
        meaning: "You try things, but without a method.",
      },
      {
        score: 3,
        text: "I give role, context and goal and refine with follow-ups.",
        meaning: "You steer the AI with clear instructions.",
      },
      {
        score: 4,
        text: "I build reusable workflows for recurring tasks.",
        meaning: "You work with AI systematically.",
      },
    ],
  },
  {
    id: "p2",
    dimensionId: "praxis",
    text: "How do you check what AI delivers for your work?",
    options: [
      {
        score: 1,
        text: "I usually take the result as it is.",
        meaning: "A review step is still missing.",
      },
      {
        score: 2,
        text: "I skim it, but trust it when in doubt.",
        meaning: "You read it but do not test it.",
      },
      {
        score: 3,
        text: "I check facts and adjust the tone before I use it.",
        meaning: "You stay responsible for the result.",
      },
      {
        score: 4,
        text: "I have fixed checks and know where AI tends to fail.",
        meaning: "Review is a fixed step in your work.",
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
      "The basic concepts and checks are new. Start with how models work, typical errors and data rules.",
  },
  {
    level: 2,
    label: "Oriented",
    min: 20,
    max: 40,
    blurb:
      "You know several topics but do not yet check output and data with a fixed method.",
  },
  {
    level: 3,
    label: "Practised",
    min: 40,
    max: 60,
    blurb:
      "You use AI for everyday tasks and spot several risks. Work on the weaker fields.",
  },
  {
    level: 4,
    label: "Confident",
    min: 60,
    max: 80,
    blurb:
      "You use AI deliberately and can explain your checks. Clarify the legal and operational details of your role.",
  },
  {
    level: 5,
    label: "Independent",
    min: 80,
    max: 100,
    blurb:
      "You check AI output critically, protect data and document important decisions. Deepen the field with your lowest score.",
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
      "Dein Ergebnis beruht auf deiner Selbsteinschätzung.",
    overall: "Gesamtstand",
    scorePlateLabel: "Auswertung des KI-Checks",
    competencyLegendLabel: "Kompetenzwerte im Profil",
    level: "Stufe",
    strength: "Deine Stärke",
    alsoStrength: "Auch stark",
    gap: "Größter Lernbedarf",
    alsoGap: "Auch offen",
    answered: "Beantwortet",
    fieldsTitle: "Deine fünf Kompetenzfelder",
    nextStep: "Dein nächster Schritt",
    startCourse: "Kurs starten",
    courseOverview: "Zur Kursübersicht",
    pathway: "Dein Platz auf dem KI-Kompetenzweg",
    restart: "Check erneut starten",
    quizEyebrow: "KI-Kompetenzweg · KI-Check",
    quizTitle: "Wo stehst du?",
    quizIntroduction:
      "Zehn Fragen, ohne Login und ohne Speicherung. Danach siehst du dein Profil und eine Kursempfehlung.",
    question: "Frage",
    of: "von",
    progressLabel: "Fortschritt im KI-Check",
    dimensionRailLabel: "Kompetenzfelder im KI-Check",
    back: "Zurück",
    result: "Zum Ergebnis",
    next: "Weiter",
    reassurance:
      "Antworte nach deiner tatsächlichen Praxis. Durchfallen kannst du nicht.",
    chooseHint: "Wähle eine Antwort, um ihre Bedeutung zu sehen.",
    railFactsLabel: "Rahmen",
    railFacts: [
      "Kein Login",
      "Keine Speicherung",
      "Auswertung im Browser",
    ],
    methodSummary: "Methode und Grenzen der Auswertung",
    methodTitle: "So wird das Profil berechnet",
    methodBody:
      "Je Feld ergeben zwei Selbstauskünfte einen Wert von 0 bis 100, der Gesamtstand ist ihr Mittelwert. Unter 50 bei den Grundlagen empfiehlt der Check den Grundlagenkurs, sonst den Kurs zum schwächsten Feld; eine Prüfung ist das nicht.",
    privacyBody:
      "Die Antworten werden nur in diesem Browser ausgewertet und nicht gespeichert.",
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
    resultTitle: "Where you stand now.",
    resultIntroduction:
      "Your result is based on your own self-assessment.",
    overall: "Overall score",
    scorePlateLabel: "AI check result",
    competencyLegendLabel: "Competency values in the profile",
    level: "Level",
    strength: "Strongest field",
    alsoStrength: "Also strong",
    gap: "Main learning gap",
    alsoGap: "Also developing",
    answered: "Answered",
    fieldsTitle: "Five competency fields",
    nextStep: "Next course",
    startCourse: "Start course",
    courseOverview: "Course overview",
    pathway: "Position in the AI competency path",
    restart: "Restart check",
    quizEyebrow: "AI competency path · AI check",
    quizTitle: "What is your current level?",
    quizIntroduction:
      "Ten questions, no login and nothing stored. Then you see your profile and one course recommendation.",
    question: "Question",
    of: "of",
    progressLabel: "Progress through the AI check",
    dimensionRailLabel: "Competency fields in the AI check",
    back: "Back",
    result: "View result",
    next: "Next",
    reassurance:
      "Answer for how you actually work. You cannot fail.",
    chooseHint: "Choose an answer to see what it means.",
    railFactsLabel: "Scope",
    railFacts: ["No login", "Nothing stored", "Scored in your browser"],
    methodSummary: "Method and limits of this result",
    methodTitle: "How the profile is calculated",
    methodBody:
      "Two self-reported answers per field give a score from 0 to 100, and the overall score is their mean. Below 50 in Basics, the check recommends the foundation course, otherwise the course for your weakest field; it is not an exam.",
    privacyBody:
      "Answers are scored only in this browser and are not stored.",
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
