import type { Locale } from "@/lib/i18n/locale";

export type GoalId = "start" | "judge" | "build" | "data";

export interface LearningGoal {
  readonly id: GoalId;
  readonly label: string;
  readonly summary: string;
  readonly courseSlugs: readonly string[];
}

export const GOAL_IDS: readonly GoalId[] = ["start", "judge", "build", "data"];

/**
 * The four learning-goal filters, shared between /kurse's atlas and any other
 * surface that needs the same course taxonomy (e.g. /konto's catalog) --
 * courseSlugs are identical across locales, only label/summary are
 * translated, so this is one source of truth instead of duplicating the
 * slug lists per locale.
 */
export const LEARNING_GOALS: Readonly<Record<Locale, readonly LearningGoal[]>> = {
  de: [
    {
      id: "start",
      label: "Ich nutze KI im Job",
      summary: "Die vier Grundlagenkurse in empfohlener Reihenfolge.",
      courseSlugs: [
        "ki-fuehrerschein",
        "ki-und-gesellschaft",
        "eu-ai-act-kurs",
        "ai-native",
      ],
    },
    {
      id: "judge",
      label: "Ich bewerte KI-Risiken",
      summary: "Schlagzeilen, Risikoklassen und Modellkennzahlen nachprüfen.",
      courseSlugs: ["ki-und-gesellschaft", "eu-ai-act-kurs", "data-science"],
    },
    {
      id: "build",
      label: "Ich baue mit KI",
      summary: "Wiederholbare KI-Abläufe und klare Zuständigkeiten im Team.",
      courseSlugs: ["ai-native", "ai-native-operator"],
    },
    {
      id: "data",
      label: "Ich arbeite mit Daten",
      summary: "Pipelines, Datenplattformen und Modellkennzahlen.",
      courseSlugs: [
        "data-engineering-fundamentals",
        "data-infrastructure",
        "data-science",
        "ai-native-operator",
      ],
    },
  ],
  en: [
    {
      id: "start",
      label: "I use AI at work",
      summary: "The four foundation courses in the suggested order.",
      courseSlugs: [
        "ki-fuehrerschein",
        "ki-und-gesellschaft",
        "eu-ai-act-kurs",
        "ai-native",
      ],
    },
    {
      id: "judge",
      label: "I assess AI risks",
      summary: "Check headlines, risk classes and model metrics.",
      courseSlugs: ["ki-und-gesellschaft", "eu-ai-act-kurs", "data-science"],
    },
    {
      id: "build",
      label: "I build with AI",
      summary: "Repeatable AI workflows and clear ownership in a team.",
      courseSlugs: ["ai-native", "ai-native-operator"],
    },
    {
      id: "data",
      label: "I work with data",
      summary: "Pipelines, data platforms and model metrics.",
      courseSlugs: [
        "data-engineering-fundamentals",
        "data-infrastructure",
        "data-science",
        "ai-native-operator",
      ],
    },
  ],
} as const;
