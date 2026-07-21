// Ported verbatim from course-data.js's MODULES[8] ("measurement", M09).
import type { AiNativeOperatorLesson } from "../types";

export const MEASUREMENT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "measurement/1",
    moduleId: "measurement",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Beyond seat counts",
    subtitle: 'Stop measuring "how many people have an AI license." Measure outcomes.',
    objective: 'Stop measuring "how many people have an AI license." Measure outcomes.',
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The vanity metric",
        readTimeMinutes: 9,
        content:
          'Adoption dashboards counting active users, prompts sent, tokens consumed — these tell you nothing about whether AI is working. They are the AI-era equivalent of "lines of code shipped." Comforting; useless.',
      },
      {
        id: "s2",
        title: "What to measure instead",
        readTimeMinutes: 9,
        content:
          "Per team, pick 2-3 outcome metrics that should improve with AI: cycle time, throughput, defect rate, NPS, deal velocity, ticket resolution time. Track them. Compare to baseline. The metric matters; the activity around it does not.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "measurement/2",
    moduleId: "measurement",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Baseline before scaling",
    subtitle: "Before rolling out any AI tool, baseline the metric. Without baseline, you are telling stories.",
    objective:
      "Before rolling out any AI tool, baseline the metric. Without baseline, you are telling stories.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The discipline",
        readTimeMinutes: 7,
        content:
          "No AI rollout begins without a measured baseline of the target metric. Two weeks minimum. Same conditions as the post-rollout measurement. Without this, every claimed improvement is anecdote.",
      },
      {
        id: "s2",
        title: "Why teams skip it (and shouldn't)",
        readTimeMinutes: 7,
        content:
          'Baselining is unglamorous and feels slow. The pressure to "just ship the AI tool" is high. Skipping it costs you the ability to ever prove the ROI — and that means the program eventually loses funding when budgets tighten.',
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "measurement/3",
    moduleId: "measurement",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "The quarterly leverage review",
    subtitle: "Run leverage reviews on the same cadence and rigor as revenue reviews.",
    objective: "Run leverage reviews on the same cadence and rigor as revenue reviews.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The ritual",
        readTimeMinutes: 10,
        content:
          "Every quarter, every team presents AI leverage like a revenue review. What metrics moved. Why. What worked. What didn't. What's next quarter's bet. The seriousness of the ritual signals the seriousness of the program.",
      },
      {
        id: "s2",
        title: "What good looks like",
        readTimeMinutes: 10,
        content:
          "A 20-minute deck. Three slides on outcomes, one on causes, one on next bets. No vanity metrics. Honest about what didn't work. The first few are awkward; by the third quarter the format is muscle memory and the program compounds.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [],
  },
  {
    id: "measurement/4",
    moduleId: "measurement",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 9 — knowledge check & capstone",
    subtitle: "Confirm measurement primitives, then commit.",
    objective: "Confirm measurement primitives, then commit.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [],
    widgets: [],
  },
];
