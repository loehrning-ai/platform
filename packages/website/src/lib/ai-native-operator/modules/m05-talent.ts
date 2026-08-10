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
      "Use a job-relevant task and an anchored rubric to observe how a candidate works with available tools.",
    objective:
      "Use a job-relevant task and an anchored rubric to observe how a candidate works with available tools.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Choose a representative work sample",
        readTimeMinutes: 7,
        content:
          "The task should represent important work in the role without requiring unpaid production work or confidential company knowledge. Keep the scope compatible with the stated time box, provide the same materials to every candidate, and offer reasonable accommodations. Assess job requirements, not familiarity with an interview puzzle.",
      },
      {
        id: "s2",
        title: "Observe the working process",
        readTimeMinutes: 7,
        content:
          "Let candidates use the same approved tools they could use in the role. Observe how they clarify the request, decompose the task, specify work, select what to delegate, inspect outputs, test assumptions, and explain the result. Protect candidate data and intellectual property; do not require personal accounts or undisclosed data sharing.",
      },
      {
        id: "s3",
        title: "Score against anchored evidence",
        readTimeMinutes: 6,
        content:
          "Define observable indicators for specification quality, tool judgment, review quality, verification, communication, and the final result. Train assessors on the rubric and compare independent ratings. Do not infer capability from typing speed, amount of tool use, or polished output when the candidate cannot explain or verify the work.",
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
            "Draft one representative interview task. Record the allowed tools, supplied materials, time box, accommodations, assessment dimensions, and observable scoring anchors.",
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
      "Define role-specific expectations for using, reviewing, and governing model-assisted workflows.",
    objective:
      "Define role-specific expectations for using, reviewing, and governing model-assisted workflows.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A four-level capability rubric",
        readTimeMinutes: 6,
        content:
          "L1 uses approved assistance for bounded tasks and checks the result. L2 runs a repeatable workflow with documented inputs, review, and escalation. L3 designs controls, evaluations, and monitoring for shared workflows. L4 sets role or organizational standards and is accountable for their operation. Adapt the levels to the actual work; they are not universal promotion gates.",
      },
      {
        id: "s2",
        title: "Measure artifacts and decisions",
        readTimeMinutes: 6,
        content:
          "Use evidence such as specifications, evaluation sets, review records, incident responses, reusable workflows, and documented decisions. Assess the person's reasoning, controls, and outcomes rather than prompt volume or claimed productivity. Calibrate examples across reviewers so that the same behavior receives comparable ratings.",
      },
      {
        id: "s3",
        title: "Provide access, training, and due process",
        readTimeMinutes: 6,
        content:
          "Do not evaluate a capability before people have approved tools, role-relevant training, practice time, and clear expectations. Account for accommodations and roles where model use is restricted or inappropriate. Communicate changes before applying them to promotion or performance decisions, document evidence, and provide a route to challenge an assessment.",
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
            "Draft four capability levels for one role family. For each level, name the expected responsibility, one observable artifact, and the controls that apply.",
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
      "Evaluate role-relevant results, quality, collaboration, and risk controls without rewarding tool activity itself.",
    objective:
      "Evaluate role-relevant results, quality, collaboration, and risk controls without rewarding tool activity itself.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Keep tool use separate from compensation",
        readTimeMinutes: 8,
        content:
          "Using a model is an input, not a result. Directly rewarding its use can encourage unnecessary processing, concealment of manual work, and unsafe delegation. Compensation decisions should consider role-relevant outcomes, quality, collaboration, and control responsibilities, including cases where the correct choice is not to use a model.",
      },
      {
        id: "s2",
        title: "Use balanced evidence",
        readTimeMinutes: 7,
        content:
          "Select measures that reflect the role and pair each measure with a countermeasure. Faster cycle time needs quality and incident data; throughput needs scope and complexity context; shared tooling needs adoption, maintenance, and support evidence. Do not impose a fixed formula across teams whose work, risk, and measurement quality differ.",
      },
      {
        id: "s3",
        title: "Control a high-stakes measurement process",
        readTimeMinutes: 7,
        content:
          "Compensation metrics can be incomplete, gameable, or biased. Document data sources and exclusions, review patterns across groups, use independent calibration, and preserve an appeal process. Involve human resources and legal owners before changing compensation criteria, especially where employment, discrimination, privacy, or worker-monitoring rules apply.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Activity metrics are not performance evidence",
      text: "Prompt counts, token volume, agent counts, and time in a tool can be increased without improving the work. Do not use them as direct compensation metrics. Evaluate verified outcomes and controls with enough context to identify quality loss, risk transfer, and metric gaming.",
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
            "Choose one role. List the outcomes, quality indicators, collaboration evidence, control duties, countermeasures, calibration process, and appeal route relevant to compensation decisions.",
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
    subtitle: "Check the talent practices from this module.",
    objective: "Check the talent practices from this module.",
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
            text: "Clarification, specification, tool judgment, review, verification, communication, and the final result.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "The number of years listed on the candidate's résumé.",
            isCorrect: false,
          },
        ],
        explanation:
          "A representative work sample provides evidence about how the candidate frames, performs, checks, and explains relevant work. Speed, tool volume, and a polished result without understandable reasoning are insufficient signals on their own.",
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
          "Prompt count measures tool activity and can rise without any improvement in outcome or quality. The other measures can also mislead when used alone, which is why they require countermeasures, context, and calibration.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
