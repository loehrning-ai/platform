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
      "Use a job-relevant task and an anchored rubric to watch how a candidate works with the tools.",
    objective:
      "Use a job-relevant task and an anchored rubric to watch how a candidate works with the tools.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Choose a representative work sample",
        readTimeMinutes: 7,
        content:
          "What does an interview measure once the candidate may use the same tools as the job? The task should mirror important work in the role without demanding unpaid production work or confidential knowledge. Fit the scope to the time box, give every candidate the same materials, offer reasonable accommodations. Assess job requirements, not familiarity with an interview puzzle.",
      },
      {
        id: "s2",
        title: "Observe the working process",
        readTimeMinutes: 7,
        content:
          "Let candidates use the same approved tools the role allows. Watch how they clarify the request, decompose the task, specify the work, choose what to delegate, inspect outputs, test assumptions, and explain the result. Protect candidate data and intellectual property. Never require personal accounts or undisclosed data sharing.",
      },
      {
        id: "s3",
        title: "Score against anchored evidence",
        readTimeMinutes: 6,
        content:
          "Define observable indicators for specification quality, tool judgment, review quality, verification, communication, and the final result. Train assessors on the rubric, then compare independent ratings. Typing speed, tool volume, and a polished output say nothing when the candidate cannot explain or verify the work.",
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
          "L1 uses approved assistance for bounded tasks and checks the result. L2 runs a repeatable workflow with documented inputs, review, and escalation. L3 designs controls, evaluations, and monitoring for shared workflows. L4 sets role or organizational standards and is accountable for how they run. Adapt the levels to the actual work; they are not universal promotion gates.",
      },
      {
        id: "s2",
        title: "Measure artifacts and decisions",
        readTimeMinutes: 6,
        content:
          "Look at specifications, evaluation sets, review records, incident responses, reusable workflows, documented decisions. Judge the person's reasoning, controls, and outcomes, not prompt volume or claimed productivity. Calibrate examples across reviewers so the same behavior earns comparable ratings.",
      },
      {
        id: "s3",
        title: "Provide access, training, and due process",
        readTimeMinutes: 6,
        content:
          "Do not assess a capability before people have approved tools, role-relevant training, practice time, and clear expectations. Account for accommodations, and for roles where model use is restricted or inappropriate. Announce a change before it touches promotion or performance decisions, document the evidence, and leave a route to challenge an assessment.",
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
          "Using a model is an input, not a result. Reward the input directly and you invite unnecessary processing, hidden manual work, and unsafe delegation. Compensation decisions weigh role-relevant outcomes, quality, collaboration, and control duties, including cases where the right choice was no model at all.",
      },
      {
        id: "s2",
        title: "Use balanced evidence",
        readTimeMinutes: 7,
        content:
          "Pick measures that fit the role, and pair each one with a countermeasure. Faster cycle time needs quality and incident data. Throughput needs scope and complexity. Shared tooling needs adoption, maintenance, and support evidence. Do not impose one formula across teams whose work, risk, and measurement quality differ.",
      },
      {
        id: "s3",
        title: "Control a high-stakes measurement process",
        readTimeMinutes: 7,
        content:
          "Compensation metrics can be incomplete, gameable, or biased. Document data sources and exclusions, review patterns across groups, use independent calibration, keep an appeal process. Bring in human resources and legal owners before you change compensation criteria, especially where employment, discrimination, privacy, or worker-monitoring rules apply.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Activity metrics are not performance evidence",
      text: "Prompt counts, token volume, agent counts, time in a tool. Each can be raised without improving the work. Do not use them as direct compensation metrics. Evaluate verified outcomes and controls with enough context to spot quality loss, risk transfer, and metric gaming.",
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
          "A representative work sample shows how the candidate frames, performs, checks, and explains relevant work. Speed, tool volume, and a polished result with no reasoning behind it are not enough on their own.",
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
          "Prompt count measures tool activity, and it rises without any improvement in outcome or quality. The other measures mislead when used alone too, which is why each needs countermeasures, context, and calibration.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
