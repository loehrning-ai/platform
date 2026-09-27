import type { AiNativeOperatorLesson } from "../types";

export const TALENT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "talent/1",
    moduleId: "talent",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Work-sample interviews with approved tools",
    subtitle:
      "Watch how a candidate works with the tools, using a real task and a rubric.",
    objective:
      "Watch how a candidate works with the tools, using a real task and a rubric.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Choose a representative work sample",
        readTimeMinutes: 7,
        content:
          "The task mirrors important work in the role without demanding unpaid production work or confidential knowledge. Fit the scope to the time box, give every candidate the same materials and offer reasonable accommodations. Assess job requirements, not puzzle familiarity.",
      },
      {
        id: "s2",
        title: "Observe the working process",
        readTimeMinutes: 7,
        content:
          "Candidates use the approved tools the role allows. Watch how they clarify the request, decompose and specify the work, choose what to delegate, inspect outputs, test assumptions and explain the result. No personal accounts or undisclosed data sharing.",
      },
      {
        id: "s3",
        title: "Score against anchored evidence",
        readTimeMinutes: 6,
        content:
          "Define observable indicators for specification quality, tool judgment, review quality, verification, communication and the final result. Train assessors on the rubric and compare independent ratings. Speed and polish count for nothing without explanation and verification.",
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
          title: "Work-sample rubric",
          scenario:
            "Draft one interview task with allowed tools, materials, time box, accommodations, assessment dimensions and scoring anchors.",
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
    title: "Model-assisted work in career expectations",
    subtitle:
      "Set role-specific expectations for using, reviewing and governing model-assisted work.",
    objective:
      "Set role-specific expectations for using, reviewing and governing model-assisted work.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A four-level capability rubric",
        readTimeMinutes: 6,
        content:
          "L1 uses approved assistance for bounded tasks and checks results. L2 runs a repeatable workflow with documented inputs, review and escalation. L3 designs controls, evaluations and monitoring for shared workflows. L4 sets standards and is accountable for their operation.",
      },
      {
        id: "s2",
        title: "Measure artifacts and decisions",
        readTimeMinutes: 6,
        content:
          "Evidence means specifications, evaluation sets, review records, incident responses, reusable workflows and documented decisions. Judge reasoning, controls and outcomes, never prompt volume or claimed productivity. Calibrate examples across reviewers so the same behavior earns the same rating.",
      },
      {
        id: "s3",
        title: "Provide access, training, and due process",
        readTimeMinutes: 6,
        content:
          "Assess a capability only after people have approved tools, training, practice time and clear expectations, allowing for accommodations and restricted roles. Announce changes before they affect promotion or performance, document evidence and offer a route to challenge.",
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
          title: "Capability ladder",
          scenario:
            "Draft four capability levels for one role family, each with responsibility, one observable artifact and the controls that apply.",
          placeholders: [
            "L1: bounded use with result checking",
            "L2: repeatable workflow with review",
            "L3: controls, evaluations, and monitoring",
            "L4: standards and operational accountability",
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
    title: "Compensate for outcomes and controls",
    subtitle:
      "Pay for results, quality, collaboration and controls, not tool activity.",
    objective:
      "Pay for results, quality, collaboration and controls, not tool activity.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Keep tool use separate from compensation",
        readTimeMinutes: 8,
        content:
          "Model use is an input. Rewarding it invites needless processing, hidden manual work and unsafe delegation. Compensation weighs role-relevant outcomes, quality, collaboration and control duties, including cases where using no model was right.",
      },
      {
        id: "s2",
        title: "Use balanced evidence",
        readTimeMinutes: 7,
        content:
          "Pair each role-fitting measure with a countermeasure: cycle time with quality and incident data, throughput with scope and complexity, shared tooling with adoption, maintenance and support evidence. Use no single formula across teams whose work, risk and measurement quality differ.",
      },
      {
        id: "s3",
        title: "Control a high-stakes measurement process",
        readTimeMinutes: 7,
        content:
          "Compensation metrics can be incomplete, gameable or biased. Document sources and exclusions, compare groups, calibrate independently and keep an appeal process. Involve HR and legal owners before changing criteria, especially under employment, discrimination, privacy or worker-monitoring rules.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Keep activity metrics out of pay",
      text: "Prompt counts, token volume, agent counts and time in a tool can rise while the work stays the same. Keep them out of compensation and watch for quality loss, risk transfer and metric gaming.",
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
          title: "Compensation evidence design",
          scenario:
            "For one role, list outcomes, quality indicators, collaboration evidence, control duties, countermeasures, calibration and appeal route for compensation.",
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
    title: "Module 5 knowledge check",
    subtitle: "Two questions on hiring and pay.",
    objective: "Two questions on hiring and pay.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-talent-q1",
        questionText:
          "What should a work-sample interview with approved tools assess?",
        answerOptions: [
          {
            id: "a",
            text: "Typing speed during the exercise.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Memorization of an unrelated interview puzzle.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "How they specify, judge tools, verify and explain results.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "The number of years listed on the candidate's résumé.",
            isCorrect: false,
          },
        ],
        explanation:
          "A work sample shows how the candidate frames, performs, checks and explains relevant work. Speed, tool volume or a polished result without reasoning shows none of that.",
      },
      {
        id: "ano-talent-q2",
        questionText:
          "Which is the least defensible direct compensation metric?",
        answerOptions: [
          {
            id: "a",
            text: "Cycle time interpreted with quality and scope data.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Defect rate interpreted with severity and detection context.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Number of prompts sent each week.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Throughput interpreted with complexity and control evidence.",
            isCorrect: false,
          },
        ],
        explanation:
          "Prompt count measures tool activity and rises without better outcomes. The other measures also mislead alone, so each needs countermeasures, context and calibration.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
