import type { Locale } from "@/lib/i18n/locale";

export interface LessonEngineCopy {
  readonly lessonPosition: (index: number, total: number) => string;
  readonly minutes: (count: number) => string;
  readonly steps: {
    readonly concept: string;
    readonly exercise: string;
    readonly checks: string;
  };
  readonly stepState: { readonly done: string; readonly open: string };
  readonly stepsLabel: string;
  readonly conceptKicker: string;
  readonly takeawayLabel: string;
  readonly sourcesLabel: string;
  readonly exerciseKicker: string;
  readonly exerciseDone: string;
  readonly checksKicker: string;
  readonly checksIntro: string;
  readonly checkLabel: (index: number, total: number) => string;
  readonly correct: string;
  readonly incorrect: string;
  readonly tryAgain: string;
  readonly checksPassed: string;
  readonly practiceAgain: string;
  readonly completeTitle: string;
  readonly completeBody: string;
  readonly openTitle: string;
  readonly missingExercise: string;
  readonly missingChecks: string;
  readonly ownerHint: string;
  readonly savedLocally: string;
  readonly legalNote: string;
}

export const LESSON_ENGINE_COPY: Readonly<Record<Locale, LessonEngineCopy>> = {
  de: {
    lessonPosition: (index, total) => `Lektion ${index} von ${total}`,
    minutes: (count) => `${count} Min.`,
    steps: { concept: "Verstehen", exercise: "Ausprobieren", checks: "Prüfen" },
    stepState: { done: "erledigt", open: "offen" },
    stepsLabel: "Schritte dieser Lektion",
    conceptKicker: "Das Wichtigste",
    takeawayLabel: "Merksatz",
    sourcesLabel: "Quellen",
    exerciseKicker: "Übung",
    exerciseDone: "Übung erledigt",
    checksKicker: "Zwei Fragen",
    checksIntro: "Sofortiges Feedback. Falsch ist nicht schlimm: wähle neu, bis es sitzt.",
    checkLabel: (index, total) => `Frage ${index} von ${total}`,
    correct: "Richtig.",
    incorrect: "Nicht ganz.",
    tryAgain: "Wähle eine andere Antwort.",
    checksPassed: "Beide Fragen richtig",
    practiceAgain: "Nochmal üben",
    completeTitle: "Lektion geschafft",
    completeBody: "Übung erledigt, beide Fragen richtig. Dein Fortschritt ist gespeichert.",
    openTitle: "Noch offen",
    missingExercise: "Übung abschließen",
    missingChecks: "Beide Fragen richtig beantworten",
    ownerHint: "Wähle oben zuerst Konto oder lokalen Fortschritt, dann wird gespeichert.",
    savedLocally: "Gespeichert",
    legalNote:
      "Lerninhalt, keine Rechtsberatung. Verbindlich sind die Regeln deiner Organisation und der amtliche Rechtstext.",
  },
  en: {
    lessonPosition: (index, total) => `Lesson ${index} of ${total}`,
    minutes: (count) => `${count} min`,
    steps: { concept: "Understand", exercise: "Try it", checks: "Check" },
    stepState: { done: "done", open: "open" },
    stepsLabel: "Steps in this lesson",
    conceptKicker: "The essentials",
    takeawayLabel: "Rule of thumb",
    sourcesLabel: "Sources",
    exerciseKicker: "Exercise",
    exerciseDone: "Exercise done",
    checksKicker: "Two questions",
    checksIntro: "Instant feedback. Wrong is fine: pick again until it sticks.",
    checkLabel: (index, total) => `Question ${index} of ${total}`,
    correct: "Correct.",
    incorrect: "Not quite.",
    tryAgain: "Pick another answer.",
    checksPassed: "Both questions correct",
    practiceAgain: "Practise again",
    completeTitle: "Lesson complete",
    completeBody: "Exercise done, both questions correct. Your progress is saved.",
    openTitle: "Still open",
    missingExercise: "Finish the exercise",
    missingChecks: "Answer both questions correctly",
    ownerHint: "Choose account or local progress above first; then progress is saved.",
    savedLocally: "Saved",
    legalNote:
      "Learning content, not legal advice. Your organization's rules and the official legal text are binding.",
  },
};
