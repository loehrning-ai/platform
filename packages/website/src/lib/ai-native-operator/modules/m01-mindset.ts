import type { AiNativeOperatorLesson } from "../types";

export const MINDSET_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "mindset/1",
    moduleId: "mindset",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Choose tasks before choosing tools",
    subtitle:
      "Check whether a task suits a model before handing it over.",
    objective:
      "Check whether a task suits a model before handing it over.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start at the outcome",
        readTimeMinutes: 1,
        content:
          "Name the outcome, its tolerable error rate and who is accountable for errors. A model earns its place when it cuts effort and keeps all three intact.",
      },
      {
        id: "s2",
        title: "Good candidate, bad candidate",
        readTimeMinutes: 1,
        content:
          "A good first candidate has defined inputs, an observable output and a review cheaper than the manual work. A bad one has ambiguous authority, irreversible effects, sensitive data without approved controls or an uncheckable output. Tighter specifications or safeguards can move a task between the two.",
      },
      {
        id: "s3",
        title: "Hand over something small first",
        readTimeMinutes: 1,
        content:
          "Give the model a narrow task, a stopping condition and explicit constraints. Decisions, approvals and external effects stay with a named person until real outputs and failure cases show the controls hold.",
      },
    ],
    callout: {
      kind: "quote",
      text: "Delegate only when the benefit outruns the cost of specification, review and correction.",
      attr: "Operating principle",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/1",
          cpId: "exercise",
          scenario:
            "Pick three tasks from this week that took over 30 minutes. Note the outcome, the cost of an error and one bounded piece you could safely hand over.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "mindset/2",
    moduleId: "mindset",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Four levels of operating control",
    subtitle:
      "Rate how you define, verify and govern model-assisted work.",
    objective:
      "Rate how you define, verify and govern model-assisted work.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Unexamined",
        readTimeMinutes: 1,
        content:
          "Everything runs by hand and nobody has asked where a model would help. For a given task that can be right, if risk and cost justify it.",
      },
      {
        id: "s2",
        title: "L1, Assisted",
        readTimeMinutes: 1,
        content:
          "One person uses a model for bounded drafts, summaries or transformations and checks the result before use. The practice is theirs and not repeatable across the team.",
      },
      {
        id: "s3",
        title: "L2, Controlled workflow",
        readTimeMinutes: 1,
        content:
          "Recurring tasks have specifications, approved context, evaluation criteria and a named reviewer. Model output passes the usual engineering and operational controls, and recorded failures change the workflow.",
      },
      {
        id: "s4",
        title: "L3, Orchestrated portfolio",
        readTimeMinutes: 1,
        content:
          "Independent tasks run in parallel with isolated workspaces, explicit permissions, release gates and named human owners, where dependencies are understood. A person accepts, rejects or releases every result.",
      },
    ],
    callout: {
      kind: "note",
      h: "Rate controls",
      text: "Heavy model use proves no maturity. Look for repeatable specifications, evaluation evidence, incident handling and clear ownership, and rate task families separately if they differ.",
    },
    exerciseKind: "self-rate",
    widgets: [
      {
        kind: "self-rate",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/2",
          cpId: "exercise",
          title: "Control self-assessment",
          scenario:
            "Rate how you work today from recent tasks. Leave planned changes out.",
          axes: [
            {
              id: "tasks",
              label: "Task-selection practice",
              anchors: [
                "Not assessed",
                "Individual experiments",
                "Defined task criteria",
                "Portfolio-level controls",
              ],
            },
            {
              id: "tools",
              label: "Workflow integration",
              anchors: [
                "Manual process",
                "Bounded assistance",
                "Controlled workflow",
                "Isolated parallel work",
              ],
            },
            {
              id: "trust",
              label: "Verification practice",
              anchors: [
                "No calibration",
                "Informal review",
                "Task-specific checks",
                "Measured release gates",
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: "mindset/3",
    moduleId: "mindset",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Calibrate verification to error cost",
    subtitle:
      "Set review depth by an error's likelihood, cost and visibility.",
    objective:
      "Set review depth by an error's likelihood, cost and visibility.",
    durationMinutes: 10,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Trust belongs to a task",
        readTimeMinutes: 1,
        content:
          "Evidence about a model holds for one task, model version, prompt, context source, tool set and evaluation method. Change one and the old result predicts nothing.",
      },
      {
        id: "s2",
        title: "Use an error-cost frame",
        readTimeMinutes: 1,
        content:
          "Estimate how likely an error is, what it costs and whether a reviewer would spot it. A reversible internal draft may need a glance; a security change, customer decision, financial figure or disclosure may need source checks, tests, a second reviewer or no model.",
      },
      {
        id: "s3",
        title: "Build evidence from reviewed cases",
        readTimeMinutes: 1,
        content:
          "Start where a reliable answer or test exists. Compare outputs with it, label failure types and record conditions, and rerun the sample after any model, prompt, data or tool change.",
      },
    ],
    callout: {
      kind: "warn",
      h: "The owner stays accountable",
      text: "Confident output and an experienced reviewer can still let an error through. The named owner runs the checks the residual risk needs and can explain why the result was accepted.",
    },
    exerciseKind: "matrix-grid",
    widgets: [
      {
        kind: "matrix-grid",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/3",
          cpId: "exercise",
          title: "Verification matrix",
          scenario:
            "Pick a minimum verification level per task type. Go one level higher where an error is expensive or hard to spot.",
          rows: [
            "Internal email draft",
            "External customer email",
            "Code patch under 50 lines",
            "Code patch over 200 lines",
            "Board-facing number",
            "Performance review draft",
          ],
          cols: [
            "Skim",
            "Read carefully",
            "Verify against source",
            "Have a second human review",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/4",
    moduleId: "mindset",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Reward reliable, repeatable work",
    subtitle:
      "Recognise ownership, reproducible work and controlled outcomes.",
    objective:
      "Recognise ownership, reproducible work and controlled outcomes.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Judge the result and its evidence",
        readTimeMinutes: 1,
        content:
          "Hours, lines of code and model usage say nothing about correctness, maintainability or use. Judge the outcome, its evidence, operating cost and whether a colleague could repeat the process.",
      },
      {
        id: "s2",
        title: "Recognise controls that improve the team",
        readTimeMinutes: 1,
        content:
          "Praise people who clarify a specification, add a regression test, document a failure mode, cut a needless step or stop unsafe work. Check quality, workload and downstream risk before rewarding head-count cuts or output volume.",
      },
      {
        id: "s3",
        title: "Apply senior judgment at review boundaries",
        readTimeMinutes: 1,
        content:
          "Experienced people know the domain, the architecture and the failure that looks fine. Let them set constraints, review exceptions and teach others to judge results; the accountable person decides acceptance.",
      },
    ],
    exerciseKind: "plays",
    widgets: [
      {
        kind: "plays",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "mindset/4",
          cpId: "exercise",
          title: "Your next controls",
          scenario: "Pick three practices for the next month.",
          minPick: 3,
          options: [
            "Write a one-line delegation boundary before starting any model-assisted task.",
            "Review one model-assisted workflow each week for errors and control gaps.",
            "Share one reviewed example, including what failed and how it was caught.",
            "Recognise reproducible outcomes instead of long hours or output volume.",
            "Ask a peer to challenge one assumption in a high-impact acceptance decision.",
          ],
        },
      },
    ],
  },
  {
    id: "mindset/5",
    moduleId: "mindset",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 1, knowledge check",
    subtitle:
      "Three questions on task selection, controls, verification and accountability.",
    objective:
      "Three questions on task selection, controls, verification and accountability.",
    durationMinutes: 4,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-mindset-q1",
        questionText:
          "A colleague writes off model assistance after one wrong result. Which response helps most?",
        answerOptions: [
          {
            id: "a",
            text: "Agree that models are unsuitable for serious work.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Assess the task, its error cost and the available checks.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Use a newer model without changing the workflow.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Wait until models stop producing errors.",
            isCorrect: false,
          },
        ],
        explanation:
          "One result says nothing about reliability across tasks. Decide from task-specific evidence, the cost and visibility of an error, and the controls that cut residual risk.",
      },
      {
        id: "ano-mindset-q2",
        questionText:
          "Which practice best describes L3, Orchestrated portfolio?",
        answerOptions: [
          {
            id: "a",
            text: "Using autocomplete every day.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Using a model for the first draft of each document.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Isolated parallel tasks with release gates and named human owners.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Giving agents unrestricted access so they do not need supervision.",
            isCorrect: false,
          },
        ],
        explanation:
          "L3 is bounded parallel work with isolation, permissions, evaluation gates and explicit acceptance ownership. Several tools running at once without those controls is not L3.",
      },
      {
        id: "ano-mindset-q3",
        questionText:
          "A senior engineer completes a change alone overnight. What should the leader examine?",
        answerOptions: [
          {
            id: "a",
            text: "Whether the long hours deserve public praise.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Whether the result is correct, reviewable, maintainable and reproducible.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Whether the engineer can be required to use a model next time.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Only how quickly the change reached production.",
            isCorrect: false,
          },
        ],
        explanation:
          "Neither manual effort nor model usage measures quality. Look at the result, its evidence, maintainability, operational risk and whether others could repeat the process.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
