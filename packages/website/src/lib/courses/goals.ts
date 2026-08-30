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
      label: "Sicher starten",
      summary: "Alltagseinsatz, Prüfung und Verantwortung in fester Folge.",
      courseSlugs: [
        "ki-fuehrerschein",
        "ki-und-gesellschaft",
        "eu-ai-act-kurs",
        "ai-native",
      ],
    },
    {
      id: "judge",
      label: "Folgen beurteilen",
      summary:
        "Beispiele prüfen, Risiken klassifizieren, Entscheidungen begründen.",
      courseSlugs: ["ki-und-gesellschaft", "eu-ai-act-kurs", "data-science"],
    },
    {
      id: "build",
      label: "Mit KI bauen",
      summary: "Arbeitsablauf, Prompt, Spezifikation und Kontrolle verbinden.",
      courseSlugs: ["ai-native", "claude", "codex", "ai-native-operator"],
    },
    {
      id: "data",
      label: "Daten entscheiden",
      summary: "Pipeline, Infrastruktur und Modellwirkung als System prüfen.",
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
      label: "Start safely",
      summary: "Everyday use, verification, and responsibility in sequence.",
      courseSlugs: [
        "ki-fuehrerschein",
        "ki-und-gesellschaft",
        "eu-ai-act-kurs",
        "ai-native",
      ],
    },
    {
      id: "judge",
      label: "Judge impact",
      summary: "Examine examples, classify risk, and justify decisions.",
      courseSlugs: ["ki-und-gesellschaft", "eu-ai-act-kurs", "data-science"],
    },
    {
      id: "build",
      label: "Build with AI",
      summary: "Connect workflow, prompting, specification, and control.",
      courseSlugs: ["ai-native", "claude", "codex", "ai-native-operator"],
    },
    {
      id: "data",
      label: "Decide with data",
      summary:
        "Test pipeline, infrastructure, and model behavior as a system.",
      courseSlugs: [
        "data-engineering-fundamentals",
        "data-infrastructure",
        "data-science",
        "ai-native-operator",
      ],
    },
  ],
} as const;
