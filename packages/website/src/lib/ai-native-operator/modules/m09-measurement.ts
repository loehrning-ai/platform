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
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/1",
          cpId: "exercise",
          title: "Outcome KPI Picker",
          scenario:
            "For your team, pick 2-3 outcome KPIs that AI should measurably move. State the current baseline and the 90-day target.",
          rows: 4,
        },
      },
    ],
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
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/2",
          cpId: "exercise",
          scenario:
            "Pick one AI rollout you did or are planning. What is the baseline measurement? If you don't have one, stop and gather it.",
          rows: 3,
        },
      },
    ],
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
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "measurement/3",
          cpId: "exercise",
          title: "Leverage Review Slides",
          scenario:
            "Sketch the 5-slide leverage review for your team next quarter. Slide titles + one-line content per slide.",
          placeholders: [
            "Slide 1 — Outcomes this quarter",
            "Slide 2 — Metric movement",
            "Slide 3 — What worked",
            "Slide 4 — Causes of misses",
            "Slide 5 — Next quarter's bets",
          ],
        },
      },
    ],
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
    quiz: [
      {
        id: "ano-measurement-q1",
        questionText:
          "Your AI rollout claims 30% productivity gain. The hardest question a board member can ask is:",
        answerOptions: [
          { id: "a", text: "What model are you using?", isCorrect: false },
          { id: "b", text: "What is the baseline measurement and when was it taken?", isCorrect: true },
          { id: "c", text: "Who is the vendor?", isCorrect: false },
          { id: "d", text: "How many seats?", isCorrect: false },
        ],
        explanation:
          "The hardest and most legitimate question a board member can ask about a productivity claim is what the baseline was and when it was measured — without a baseline taken under comparable conditions, a 30% gain is a story, not a result. Model choice, vendor, and seat count are all secondary to whether the comparison is even valid.",
      },
      {
        id: "ano-measurement-q2",
        questionText: "The most reliable signal that an AI program is working:",
        answerOptions: [
          { id: "a", text: "Number of active users.", isCorrect: false },
          { id: "b", text: "Tokens per month.", isCorrect: false },
          {
            id: "c",
            text: "Outcome metrics (cycle time, defect rate, throughput) moving against a measured baseline.",
            isCorrect: true,
          },
          { id: "d", text: "Internal survey sentiment.", isCorrect: false },
        ],
        explanation:
          "The reliable signal that an AI program is working is outcome metrics — cycle time, defect rate, throughput — moving against a measured baseline, because those numbers reflect the work actually getting better. Active-user counts, token volume, and survey sentiment are activity or vibes metrics that can rise even while nothing real improves.",
      },
      {
        id: "ano-measurement-q3",
        questionText: "A quarterly leverage review should look most like:",
        answerOptions: [
          { id: "a", text: "A project status update.", isCorrect: false },
          { id: "b", text: "A revenue review — with the same rigor and seriousness.", isCorrect: true },
          { id: "c", text: "A demo day.", isCorrect: false },
          { id: "d", text: "A retrospective.", isCorrect: false },
        ],
        explanation:
          "A quarterly leverage review earns its seriousness by mirroring a revenue review: the same cadence, the same rigor, real numbers that moved and why, presented to people who will ask hard questions. Treating it like an informal status update or a demo day undersells the discipline the program needs to keep its funding.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
