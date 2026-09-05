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
      "Decide whether a task suits a model before deciding how to hand it over.",
    objective:
      "Decide whether a task suits a model before deciding how to hand it over.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start at the outcome",
        readTimeMinutes: 5,
        content:
          '"Where can we add AI?" is the wrong first question. Start with the outcome, the error rate it tolerates, and the person accountable when one slips through. A model earns its place when it cuts effort and leaves those three intact. Outcome still vague? Then the tool choice is premature.',
      },
      {
        id: "s2",
        title: "Good candidate, bad candidate",
        readTimeMinutes: 5,
        content:
          "A good first candidate has defined inputs, an observable output, and a review step cheaper than the manual work. A bad one has ambiguous authority, irreversible effects, sensitive data without approved controls, or an output nobody can check. Neither label is permanent. Tighten the specification, add safeguards, and the task changes lists.",
      },
      {
        id: "s3",
        title: "Hand over something small first",
        readTimeMinutes: 4,
        content:
          "Give the model a narrow task, a clear stopping condition, and explicit constraints. Decisions, approvals, and anything that reaches the outside world stay with a named person until the workflow proves its controls hold. Read the real outputs. Read the failure cases. Then widen the scope.",
      },
    ],
    callout: {
      kind: "quote",
      text: "Delegate only when the benefit outruns the cost of specification, review, and correction.",
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
            "Take three tasks from this week that ran longer than 30 minutes. For each, write the expected outcome, the cost of an error, and the one bounded piece you could hand over safely.",
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
      "Four levels show how consistently you define, verify, and govern model-assisted work.",
    objective:
      "Four levels show how consistently you define, verify, and govern model-assisted work.",
    durationMinutes: 11,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "L0, Unexamined",
        readTimeMinutes: 3,
        content:
          "Everything runs by hand, as always. Nobody has asked where a model would help and where it would not. For a given task that can still be right, as long as it is a decision taken from risk and cost rather than an untested default.",
      },
      {
        id: "s2",
        title: "L1, Assisted",
        readTimeMinutes: 3,
        content:
          "One person uses a model for bounded drafts, summaries, or transformations. They stay in the task, supply the source material, and check the result before use. The practice belongs to that person. Nothing about it is repeatable across the team yet.",
      },
      {
        id: "s3",
        title: "L2, Controlled workflow",
        readTimeMinutes: 3,
        content:
          "Recurring tasks have specifications, approved context, evaluation criteria, and a named reviewer. Model output goes through the same engineering and operational controls as everything else, not around them. Failures get recorded, and the workflow changes because of them.",
      },
      {
        id: "s4",
        title: "L3, Orchestrated portfolio",
        readTimeMinutes: 2,
        content:
          "Several independent tasks run at once with isolated workspaces, explicit permissions, release gates, and named human owners. Parallel work happens only where dependencies are understood. A person still accepts, rejects, or releases every result.",
      },
    ],
    callout: {
      kind: "note",
      h: "Rate controls, not tool usage",
      text: "Heavy model use proves nothing about maturity. Look for repeatable specifications, evaluation evidence, incident handling, and clear ownership. Where practices differ between task families, rate each family separately.",
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
            "Rate how you work today. Use evidence from recent tasks, not the practice you intend to adopt.",
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
      "Set review depth from how likely an error is, what it costs, and how easily a reviewer spots it.",
    objective:
      "Set review depth from how likely an error is, what it costs, and how easily a reviewer spots it.",
    durationMinutes: 16,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Trust attaches to a task, not a model",
        readTimeMinutes: 5,
        content:
          "No model is trustworthy or untrustworthy in general. The evidence belongs to one task, one model version, one prompt, one context source, one tool set, one evaluation method. Change any of those and yesterday's result stops predicting today's behavior.",
      },
      {
        id: "s2",
        title: "Use an error-cost frame",
        readTimeMinutes: 6,
        content:
          "Estimate three things: how likely an error is, what it costs, how easily a reviewer would spot it. A reversible internal draft may need a glance. A security change, a customer decision, a financial figure, or a disclosure may need source verification, tests, a second reviewer, or no model at all. Verification effort rises with residual risk.",
      },
      {
        id: "s3",
        title: "Build evidence from reviewed cases",
        readTimeMinutes: 5,
        content:
          "Start where a reliable answer or test oracle exists. Compare the output against that reference, label the failure type, and record the conditions that produced it. Run the sample again after every model, prompt, data, or tool change. That is how feeling becomes task-specific evidence.",
      },
    ],
    callout: {
      kind: "warn",
      h: "Accountability does not transfer to the model",
      text: "A confident output and an experienced reviewer can still add up to an accepted error. The named owner runs the checks the residual risk demands, and can explain the acceptance decision.",
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
            "Pick a minimum verification level per task type in your context. Raise it wherever an error is expensive or hard to spot.",
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
      "Point team recognition at clear ownership, reproducible work, and controlled outcomes.",
    objective:
      "Point team recognition at clear ownership, reproducible work, and controlled outcomes.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Manual effort is not the quality measure",
        readTimeMinutes: 4,
        content:
          "Hours worked and lines written say nothing about whether a change is correct, maintainable, or useful. Model usage says nothing either. Judge the outcome, its evidence, the operational cost, and whether a colleague could follow and repeat the process.",
      },
      {
        id: "s2",
        title: "Recognise controls that improve the team",
        readTimeMinutes: 4,
        content:
          "Recognise the people who clarify a specification, add a regression test, document a failure mode, cut an unnecessary step, or stop unsafe work. Those improve more than one delivery. And do not reward head-count reduction or output volume without examining quality, workload, and downstream risk.",
      },
      {
        id: "s3",
        title: "Apply senior judgment at review boundaries",
        readTimeMinutes: 4,
        content:
          "Experienced practitioners bring domain knowledge, architectural context, and an eye for the failure that looks fine. Spend that expertise defining constraints, reviewing exceptions, and teaching others how to judge a result. The tool produces the artifact. The accountable person decides whether it is acceptable.",
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
      "Three questions on task selection, operating controls, verification, and accountability.",
    objective:
      "Three questions on task selection, operating controls, verification, and accountability.",
    durationMinutes: 8,
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
          "One result settles nothing about reliability across tasks. Decide from task-specific evidence, what an error costs, how visible it is, and which controls cut residual risk.",
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
          "L3 is bounded parallel work plus isolation, permissions, evaluation gates, and explicit acceptance ownership. Several tools running at once without those controls is not L3.",
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
          "Neither manual effort nor model usage is a quality measure. Look at the result, its evidence, maintainability, operational risk, and whether anyone could follow and repeat the process.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
