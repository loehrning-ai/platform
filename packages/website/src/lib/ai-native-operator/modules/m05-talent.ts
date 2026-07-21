// Ported verbatim from course-data.js's MODULES[4] ("talent", M05).
import type { AiNativeOperatorLesson } from "../types";

export const TALENT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "talent/1",
    moduleId: "talent",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "The live-build interview",
    subtitle:
      'Replace the whiteboard with a 60-minute "build something with agents" exercise that tests the skills that matter.',
    objective:
      'Replace the whiteboard with a 60-minute "build something with agents" exercise that tests the skills that matter.',
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why the whiteboard is over",
        readTimeMinutes: 7,
        content:
          "The whiteboard interview tested the candidate's ability to invert a binary tree on the spot. It was always a poor proxy for engineering, and now it is a useless one. The candidate who can ace whiteboards in 2026 is not the candidate who will produce the most leverage on your team.",
      },
      {
        id: "s2",
        title: "What to test instead",
        readTimeMinutes: 7,
        content:
          "Give the candidate a real problem, real tools, real time, 60 minutes, an agent IDE, a representative codebase. Ask them to ship something small and real. Watch how they direct, review, and decide. Watch what they choose NOT to delegate. Watch how they verify.",
      },
      {
        id: "s3",
        title: "The rubric",
        readTimeMinutes: 6,
        content:
          "Score on five dimensions: spec quality, agent direction, judgment in review, calibrated trust, and final quality. The best candidates are not the fastest, they are the ones who consistently produce the right outcome with the least keystroke effort.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/1",
          cpId: "exercise",
          title: "Rubric Builder",
          scenario: "Draft your live-build problem. What is the task? What tools? What is the rubric?",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "talent/2",
    moduleId: "talent",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "AI fluency in the career ladder",
    subtitle: "Add explicit AI fluency rungs to your ladder. Make L4 a hard gate for senior IC.",
    objective: "Add explicit AI fluency rungs to your ladder. Make L4 a hard gate for senior IC.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A four-level rubric",
        readTimeMinutes: 6,
        content:
          "L1, uses AI for occasional tasks. L2, AI is the default first draft. L3, runs agent fleets, builds evals, ships at 3-5x velocity. L4, designs agentic systems for the team or company; sets the standard. The senior IC bar should sit at L3+; the staff/principal bar at L4.",
      },
      {
        id: "s2",
        title: "How to measure",
        readTimeMinutes: 6,
        content:
          "Measurement is qualitative but specific. Ask: what is the largest agentic workflow this person has built? What evals do they own? Whose work depends on their orchestration? The answers calibrate the level honestly.",
      },
      {
        id: "s3",
        title: "The brutal truth about senior ICs",
        readTimeMinutes: 6,
        content:
          "Some of your best 2024 engineers will not make L3 in 2026. Their craft was real but their adaptation is slow. Have the conversation early. Coach. If they cannot move, they will be passed by their juniors, and the worst outcome is them finding out via a comp letter.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/2",
          cpId: "exercise",
          title: "AI Fluency Ladder",
          scenario:
            "Draft the L1-L4 AI fluency rubric for your role family. Two sentences per level, plus an example artifact someone at that level would produce.",
          placeholders: [
            "L1, uses AI for occasional tasks",
            "L2, AI is default first draft",
            "L3, runs agent fleets, builds evals",
            "L4, designs systems for the team",
          ],
        },
      },
    ],
  },
  {
    id: "talent/3",
    moduleId: "talent",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Outcome-on-leverage compensation",
    subtitle: "Tie a portion of comp to AI-augmented outcomes, not to hours or activity.",
    objective: "Tie a portion of comp to AI-augmented outcomes, not to hours or activity.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why comp must move",
        readTimeMinutes: 8,
        content:
          "Culture is downstream of comp. If you say AI matters but pay for hours, the culture pays for hours. If you pay for leverage, the culture chases leverage. Nothing else moves behavior as reliably.",
      },
      {
        id: "s2",
        title: "The mechanism",
        readTimeMinutes: 7,
        content:
          "A common implementation: 70% of bonus tied to traditional outcomes (impact, ratings), 20% tied to AI leverage (specific KPIs by team), 10% tied to ecosystem contribution (evals shared, agents built for others). Ratios will vary; the structure rarely does.",
      },
      {
        id: "s3",
        title: "The hard part",
        readTimeMinutes: 7,
        content:
          "Measurement. AI leverage is real but slippery. Use a small set of outcome metrics, cycle time, defect rate, throughput, and trust the trend. Avoid metrics that game easily. Calibrate by manager + skip-level review.",
      },
    ],
    callout: {
      kind: "warn",
      h: "A failure mode to avoid",
      text: 'Do not measure "AI usage", number of prompts, tokens used, agents spawned. These metrics game instantly and tell you nothing. Measure outcomes. Outcomes are harder to define, harder to game, and the only thing that matters.',
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "talent/3",
          cpId: "exercise",
          title: "Leverage Comp Design",
          scenario:
            "Sketch the leverage-comp formula for one team. What outcomes do you measure? What weights? How do you calibrate?",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "talent/4",
    moduleId: "talent",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 5, knowledge check",
    subtitle: "Lock the talent shifts.",
    objective: "Lock the talent shifts.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-talent-q1",
        questionText: "A live-build interview tests:",
        answerOptions: [
          { id: "a", text: "Speed of typing.", isCorrect: false },
          { id: "b", text: "Ability to invert a binary tree.", isCorrect: false },
          {
            id: "c",
            text: "Spec quality, agent direction, judgment in review, calibrated trust, and final quality.",
            isCorrect: true,
          },
          { id: "d", text: "Years of experience.", isCorrect: false },
        ],
        explanation:
          "A live-build interview is designed to surface exactly the skills that matter in AI-native work: how well the candidate specs the problem, directs the agent, judges the output in review, calibrates trust, and lands at a correct final result, not how fast they type or whether they can invert a binary tree from memory.",
      },
      {
        id: "ano-talent-q2",
        questionText: "You are designing leverage-tied comp. Which metric is the WORST choice?",
        answerOptions: [
          { id: "a", text: "Team cycle time.", isCorrect: false },
          { id: "b", text: "Defect rate.", isCorrect: false },
          { id: "c", text: "Number of prompts sent per week.", isCorrect: true },
          { id: "d", text: "Throughput per engineer.", isCorrect: false },
        ],
        explanation:
          "Prompt count is a pure activity metric: it rewards typing more prompts, not producing better outcomes, and it is trivially gamed the moment it's tied to pay. Cycle time, defect rate, and throughput are all real outcome signals that move because the work actually got better, not because someone performed more AI usage.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
