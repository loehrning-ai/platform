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
      "Use activity data to understand operation. Judge value with predefined outcomes, costs, and guardrails.",
    objective:
      "Use activity data to understand operation. Judge value with predefined outcomes, costs, and guardrails.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Activity is diagnostic, not proof of value",
        readTimeMinutes: 9,
        content:
          "Someone reports a productivity gain. What would make you believe it? Licenses, active users, model calls, tokens, and feature use reveal reach, load, cost, and support needs. None shows the intervention improved the work. Keep adoption, operational, and outcome measures apart from guardrails, so one never passes for another.",
      },
      {
        id: "s2",
        title: "Define a balanced measure set",
        readTimeMinutes: 9,
        content:
          "Start from the expected mechanism. Which behavior changes, which outcome follows? Pick a small set of role-relevant outcomes and pair them with quality, risk, equity, and cost guardrails. Fix population, calculation, source, owner, review cadence, and decision threshold before anyone sees a result.",
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
            "For one workflow, state the expected mechanism, primary outcome, quality and risk guardrails, cost measure, population, data source, owner, review cadence, and decision threshold.",
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
      "Define the metric and comparison design before rollout, then account for variability, seasonality, and other changes.",
    objective:
      "Define the metric and comparison design before rollout, then account for variability, seasonality, and other changes.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Choose a baseline period from the data",
        readTimeMinutes: 7,
        content:
          "How long you observe depends on event frequency, variance, seasonality, and the size of change the decision must detect. Freeze the metric definition, population, exclusions, and data-quality checks before rollout. Record the uncertainty instead of treating one historical average as exact.",
      },
      {
        id: "s2",
        title: "Build a credible comparison",
        readTimeMinutes: 7,
        content:
          "Staffing, demand, policy, product, or market changes will distort a plain before-and-after comparison. Use a randomized, staggered, matched, or interrupted-time design where feasible. Record concurrent changes and interpretation limits. If the comparison cannot carry a causal claim, report an association.",
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
            "Choose one rollout. Define the metric, population, exclusions, baseline period, variability and seasonality checks, comparison group or design, concurrent changes, and the strongest claim the evidence could support.",
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
      "Use a decision forum to examine outcomes, uncertainty, guardrails, costs, and the next controlled action.",
    objective:
      "Use a decision forum to examine outcomes, uncertainty, guardrails, costs, and the next controlled action.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Set cadence from the decision cycle",
        readTimeMinutes: 10,
        content:
          "Review frequency follows how fast evidence accumulates, how often the intervention changes, and what a delayed correction costs. Fix participants, decision rights, required evidence, and submission dates. The review exists for decisions. Not for a recital of activity, not for a product demonstration.",
      },
      {
        id: "s2",
        title: "Use a consistent evidence packet",
        readTimeMinutes: 10,
        content:
          "Present the hypothesis, the intervention, the baseline and comparison, the outcome results with uncertainty, guardrails and incidents, operating cost, limitations, and the proposed decision. Record whether to continue, change, pause, or stop. Name the owner and next review condition. Keep it so a later team can reuse the evidence.",
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
            "Draft five sections for the next review. Each states its evidence and the decision it informs.",
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
    subtitle: "Three questions on adoption, baselines, and evidence reviews.",
    objective: "Three questions on adoption, baselines, and evidence reviews.",
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
            text: "How was productivity defined, what baseline and comparison were used, and which concurrent changes were considered?",
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
          "A quantified improvement needs a stable definition, a credible baseline and comparison, and an account of the other changes that could explain the result. Provider, vendor, and license count establish nothing about cause.",
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
            text: "Predefined outcome and guardrail measures improved relative to a credible comparison, with costs, uncertainty, and concurrent changes considered.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "An internal survey reported enthusiasm for the tool.",
            isCorrect: false,
          },
        ],
        explanation:
          "Adoption and sentiment help explain how something operates. Neither demonstrates value. The stronger evidence ties predefined outcomes and guardrails to a credible comparison, and reports cost, uncertainty, and the alternative explanations.",
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
            text: "A documented decision based on predefined measures, comparison, uncertainty, guardrails, cost, and risk, with an owner and next review condition.",
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
          "The review exists to decide whether to continue, change, pause, or stop an intervention. A consistent evidence packet, a named decision owner, and an explicit next condition make the result auditable and reusable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
