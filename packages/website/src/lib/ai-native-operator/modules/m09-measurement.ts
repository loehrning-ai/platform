import type { AiNativeOperatorLesson } from "../types";

export const MEASUREMENT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "measurement/1",
    moduleId: "measurement",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Separate adoption from outcome measurement",
    subtitle:
      "Read activity data for operation, and judge value by predefined outcomes, costs and guardrails.",
    objective:
      "Read activity data for operation, and judge value by predefined outcomes, costs and guardrails.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Activity is diagnostic",
        readTimeMinutes: 9,
        content:
          "Licenses, active users, model calls, tokens and feature use show reach, load, cost and support needs, but not whether the work improved. Keep adoption, operational, outcome and guardrail measures apart so none passes for another.",
      },
      {
        id: "s2",
        title: "Define a balanced measure set",
        readTimeMinutes: 9,
        content:
          "Start from the expected mechanism: which behavior changes and which outcome follows. Pick a few role-relevant outcomes with quality, risk, equity and cost guardrails. Fix population, calculation, source, owner, review cadence and decision threshold before anyone sees a result.",
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
          title: "Measure set",
          scenario:
            "For one workflow, state mechanism, primary outcome, quality and risk guardrails, cost measure, population, data source, owner, review cadence and decision threshold.",
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
    title: "Establish a comparable baseline",
    subtitle:
      "Fix metric and comparison before rollout, allowing for variability, seasonality and other changes.",
    objective:
      "Fix metric and comparison before rollout, allowing for variability, seasonality and other changes.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Choose a baseline period from the data",
        readTimeMinutes: 7,
        content:
          "The observation period depends on event frequency, variance, seasonality and the size of change the decision must detect. Freeze metric definition, population, exclusions and data-quality checks before rollout, and record the uncertainty around any historical average.",
      },
      {
        id: "s2",
        title: "Build a credible comparison",
        readTimeMinutes: 7,
        content:
          "Staffing, demand, policy, product or market changes distort a plain before-and-after comparison. Use a randomized, staggered, matched or interrupted-time design where feasible, and record concurrent changes and limits. If the comparison cannot carry a causal claim, report an association.",
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
            "For one rollout, define metric, population, exclusions, baseline period, variability and seasonality checks, comparison design, concurrent changes and the strongest claim the evidence supports.",
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
    title: "Run evidence reviews on a defined cadence",
    subtitle:
      "Review outcomes, uncertainty, guardrails, costs and the next action in a decision forum.",
    objective:
      "Review outcomes, uncertainty, guardrails, costs and the next action in a decision forum.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Set cadence from the decision cycle",
        readTimeMinutes: 10,
        content:
          "Review frequency follows how fast evidence accumulates, how often the intervention changes and what a late correction costs. Fix participants, decision rights, required evidence and submission dates. Each review ends in a decision.",
      },
      {
        id: "s2",
        title: "Use a consistent evidence packet",
        readTimeMinutes: 10,
        content:
          "Present hypothesis, intervention, baseline and comparison, outcomes with uncertainty, guardrails and incidents, operating cost, limitations and the proposed decision. Record the decision to continue, change, pause or stop, its owner and the next review condition.",
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
          title: "Evidence review packet",
          scenario:
            "Draft five sections for the next review, each naming its evidence and the decision it informs.",
          placeholders: [
            "1. Hypothesis and intervention",
            "2. Baseline, comparison, and uncertainty",
            "3. Outcomes, guardrails, and incidents",
            "4. Cost, limitations, and alternatives",
            "5. Decision, owner, and next review condition",
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
    title: "Module 9 knowledge check and capstone",
    subtitle: "Three questions on adoption, baselines and evidence reviews.",
    objective: "Three questions on adoption, baselines and evidence reviews.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-measurement-q1",
        questionText:
          "A rollout is reported to have improved productivity. Which question most directly tests the claim?",
        answerOptions: [
          {
            id: "a",
            text: "Which model provider was selected?",
            isCorrect: false,
          },
          {
            id: "b",
            text: "How was productivity defined and compared, against which baseline?",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Which vendor sold the implementation?",
            isCorrect: false,
          },
          {
            id: "d",
            text: "How many user licenses were assigned?",
            isCorrect: false,
          },
        ],
        explanation:
          "A quantified gain needs a stable definition, a credible baseline and comparison, and a check of other explanations. Provider, vendor and license count say nothing about cause.",
      },
      {
        id: "ano-measurement-q2",
        questionText:
          "Which evidence most strongly supports that a model-assisted program is working?",
        answerOptions: [
          {
            id: "a",
            text: "The number of active users increased.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Monthly token volume increased.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Predefined outcomes improved against a credible comparison.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "An internal survey reported enthusiasm for the tool.",
            isCorrect: false,
          },
        ],
        explanation:
          "Adoption and sentiment explain operation, not value. Stronger evidence ties predefined outcomes and guardrails to a credible comparison and reports cost, uncertainty and alternative explanations.",
      },
      {
        id: "ano-measurement-q3",
        questionText: "What should an evidence review produce?",
        answerOptions: [
          {
            id: "a",
            text: "A project status report without a decision.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "A documented decision with an owner and next review condition.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "A demonstration of the newest model features.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "A retrospective with no measurement record.",
            isCorrect: false,
          },
        ],
        explanation:
          "A review decides whether to continue, change, pause or stop. A consistent evidence packet, a named decision owner and an explicit next condition make it auditable and reusable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
