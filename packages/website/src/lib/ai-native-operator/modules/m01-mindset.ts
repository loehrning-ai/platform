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
      "Assess whether a task is suitable for model assistance before deciding how to delegate it.",
    objective:
      "Assess whether a task is suitable for model assistance before deciding how to delegate it.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the required outcome",
        readTimeMinutes: 5,
        content:
          "Do not begin with the question, 'Where can I add AI?' Begin with the outcome, the acceptable error rate, and the person accountable for the result. Model assistance is useful when it reduces effort without weakening those conditions. If the outcome is unclear, clarify it before choosing a tool.",
      },
      {
        id: "s2",
        title: "Check delegation fit",
        readTimeMinutes: 5,
        content:
          "Good initial candidates have defined inputs, observable outputs, and a review step that costs less than doing the whole task manually. Poor candidates have ambiguous authority, irreversible effects, sensitive data without approved controls, or outputs that cannot be checked. The same task can move between these categories as its specification and safeguards improve.",
      },
      {
        id: "s3",
        title: "Delegate a bounded first pass",
        readTimeMinutes: 4,
        content:
          "Give the model a narrow task, a clear stopping condition, and explicit constraints. Keep decisions, approvals, and external side effects with a named person until the workflow has evidence that its controls work. Expand the scope only after reviewing real outputs and failure cases.",
      },
    ],
    callout: {
      kind: "quote",
      text: "Delegate work only when the expected benefit exceeds the cost of specification, review, and correction.",
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
            "List three tasks from this week that took more than 30 minutes. For each, record the expected outcome, the cost of an error, and one bounded part that could be delegated safely.",
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
      "Assess how consistently you define, verify, and govern model-assisted work across four levels.",
    objective:
      "Assess how consistently you define, verify, and govern model-assisted work across four levels.",
    durationMinutes: 11,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Unexamined",
        readTimeMinutes: 3,
        content:
          "Tasks are completed through existing manual processes, and the team has not assessed where model assistance would or would not be appropriate. This can be a valid choice for a task, but it should be a deliberate choice based on risk and cost rather than an untested default.",
      },
      {
        id: "s2",
        title: "L1, Assisted",
        readTimeMinutes: 3,
        content:
          "A person uses a model for bounded drafts, summaries, or transformations. The person remains inside the task, supplies the source material, and checks the result before use. Practices are individual and may not yet be repeatable across the team.",
      },
      {
        id: "s3",
        title: "L2, Controlled workflow",
        readTimeMinutes: 3,
        content:
          "Recurring tasks have specifications, approved context, evaluation criteria, and review ownership. Model outputs enter normal engineering or operational controls instead of bypassing them. Failures are recorded and used to revise the workflow.",
      },
      {
        id: "s4",
        title: "L3, Orchestrated portfolio",
        readTimeMinutes: 2,
        content:
          "Several independent tasks can run in parallel with isolated workspaces, explicit permissions, release gates, and named human owners. Parallelism is used only where dependencies are understood. A person remains accountable for accepting, rejecting, or releasing each result.",
      },
    ],
    callout: {
      kind: "note",
      h: "Rate controls, not tool usage",
      text: "Frequent model use does not establish a high maturity level. Look for repeatable specifications, evaluation evidence, incident handling, and clear ownership. Rate each task family separately when practices differ.",
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
            "Rate the way you work today. Use evidence from recent tasks rather than intended future practice.",
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
      "Set review depth from the likelihood, impact, and detectability of an error instead of relying on general trust.",
    objective:
      "Set review depth from the likelihood, impact, and detectability of an error instead of relying on general trust.",
    durationMinutes: 16,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Trust belongs to a task and control set",
        readTimeMinutes: 5,
        content:
          "A model is not globally trustworthy or untrustworthy. Evidence applies to a particular task, model version, prompt, context source, tool set, and evaluation method. Change one of those conditions and the previous result may no longer predict current behavior.",
      },
      {
        id: "s2",
        title: "Use an error-cost frame",
        readTimeMinutes: 6,
        content:
          "Estimate the likelihood of an error, its impact, and how easily a reviewer could detect it. A reversible internal draft may need a quick check. A security change, customer decision, financial figure, or disclosure may require source verification, tests, a second reviewer, or no model involvement at all. Verification effort should rise with residual risk.",
      },
      {
        id: "s3",
        title: "Build evidence from reviewed cases",
        readTimeMinutes: 5,
        content:
          "Start with tasks where a reliable answer or test oracle exists. Compare outputs with that reference, label the failure type, and record the conditions under which it occurred. Revisit the sample after model, prompt, data, or tool changes. This turns confidence into task-specific evidence.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Accountability does not transfer to the model",
      text: "A confident output and an experienced reviewer can still produce an accepted error. The named owner must perform the checks required by the task's residual risk and must be able to explain the acceptance decision.",
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
            "For each task type, select a minimum verification level for your current context. Increase it where errors are costly or hard to detect.",
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
    title: "Reward reliable systems, not heroics",
    subtitle:
      "Align team recognition with clear ownership, reproducible work, and controlled outcomes.",
    objective:
      "Align team recognition with clear ownership, reproducible work, and controlled outcomes.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Manual effort is not the quality measure",
        readTimeMinutes: 4,
        content:
          "Hours worked and lines written do not show whether a change is correct, maintainable, or useful. Model usage does not show that either. Evaluate the outcome, the evidence behind it, the operational cost, and whether another person can understand and repeat the process.",
      },
      {
        id: "s2",
        title: "Recognise controls that improve the team",
        readTimeMinutes: 4,
        content:
          "Recognise people who clarify specifications, add regression tests, document failure modes, reduce unnecessary steps, or stop unsafe work. These actions improve more than one delivery. Do not reward head-count reduction or output volume without examining quality, workload, and downstream risk.",
      },
      {
        id: "s3",
        title: "Apply senior judgment at review boundaries",
        readTimeMinutes: 4,
        content:
          "Experienced practitioners contribute domain knowledge, architectural context, and the ability to recognise subtle failure. Use that expertise to define constraints, review exceptions, and teach others how to evaluate results. The tool may generate an artifact; the accountable person decides whether it is acceptable.",
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
          scenario: "Choose three practices to apply during the next month.",
          minPick: 3,
          options: [
            "Write a one-line delegation boundary before starting a model-assisted task.",
            "Review one model-assisted workflow each week for errors and control gaps.",
            "Share one reviewed example, including what failed and how it was detected.",
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
      "Check your understanding of task selection, operating controls, verification, and accountability.",
    objective:
      "Check your understanding of task selection, operating controls, verification, and accountability.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-mindset-q1",
        questionText:
          "A teammate rejects model assistance after one incorrect result. Which response is most useful?",
        answerOptions: [
          {
            id: "a",
            text: "Agree that models are unsuitable for serious work.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Assess the specific task, error cost, and available verification controls before deciding.",
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
          "One result does not establish reliability for every task. Decide from task-specific evidence, the impact and detectability of an error, and the controls available to reduce residual risk.",
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
            text: "Running independent tasks in parallel with isolation, release gates, and named human owners.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Giving agents unrestricted access so they do not need supervision.",
            isCorrect: false,
          },
        ],
        explanation:
          "L3 combines bounded parallel work with isolation, permissions, evaluation gates, and explicit acceptance ownership. Parallel tool use without those controls does not meet the definition.",
      },
      {
        id: "ano-mindset-q3",
        questionText:
          "A senior engineer completes a change alone overnight. What should the leader examine?",
        answerOptions: [
          {
            id: "a",
            text: "Whether the effort deserves public praise because it took many hours.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Whether the result is correct, reviewable, maintainable, and supported by a reproducible process.",
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
          "Neither manual effort nor model usage is a quality measure. Review the result, its evidence, maintainability, operational risk, and whether the process can be understood and repeated.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
