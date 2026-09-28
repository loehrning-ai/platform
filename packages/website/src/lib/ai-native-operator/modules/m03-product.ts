import type { AiNativeOperatorLesson } from "../types";

export const PRODUCT_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "product/1",
    moduleId: "product",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Define the product boundary",
    subtitle:
      "Name the outcome that depends on the model, and its fallback.",
    objective:
      "Name the outcome that depends on the model, and its fallback.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start from the user's job",
        readTimeMinutes: 1,
        content:
          "Start from the user's job: name the delay or decision the model changes and how you observe success. Remove any control, a chat box included, that does not move that outcome.",
      },
      {
        id: "s2",
        title: "Integrate capability with existing controls",
        readTimeMinutes: 1,
        content:
          "A model-backed capability needs the usual product boundaries: supported inputs, permissions, failure states, latency, data handling and accountable owners. Keep structured controls where they add clarity or limit risk, and show the model's role when users need it to challenge a result.",
      },
      {
        id: "s3",
        title: "Use a dependency and fallback test",
        readTimeMinutes: 1,
        content:
          "Ask which user outcome changes when the model is removed or degraded. If none does, the capability may be unnecessary. If a core outcome depends on it, specify the fallback, the recovery path and what the user is told.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/1",
          cpId: "exercise",
          scenario:
            "Audit three model-backed flows. For each, state the user outcome, the model-dependent step, the failure mode and the fallback.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "product/2",
    moduleId: "product",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Find the delegable boundary",
    subtitle:
      "Separate user intent from decisions, permissions and confirmations.",
    objective:
      "Separate user intent from decisions, permissions and confirmations.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Record what the user authorised",
        readTimeMinutes: 1,
        content:
          "A search, click, upload or request expresses a wanted outcome and authorises nothing beyond it. Record what the user asked for, which assumptions the system may make and which side effects need separate confirmation or a permission check.",
      },
      {
        id: "s2",
        title: "Evaluate each step before compressing the flow",
        readTimeMinutes: 1,
        content:
          "Check each step after intent: is it deterministic, reversible, observable and within the user's authority? Delegate steps that pass all four. Keep review or confirmation where ambiguity, money movement, data disclosure, legal effect or another material consequence remains.",
      },
      {
        id: "s3",
        title: "Combine conversation with structured controls",
        readTimeMinutes: 1,
        content:
          "Conversation suits ambiguous input and clarification. Structured controls suit exact values, constrained choices, comparison and confirmation. Pick the surface from the information and risk of the current step.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/2",
          cpId: "exercise",
          scenario:
            "Pick a flow with more than five steps after the user states intent. Mark delegable steps, needed confirmations, what the system must show and how a user recovers from an error.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "product/3",
    moduleId: "product",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Constrained generative interfaces",
    subtitle:
      "Generate interfaces only from approved components, schemas, states and accessibility rules.",
    objective:
      "Generate interfaces only from approved components, schemas, states and accessibility rules.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Compose from a fixed vocabulary",
        readTimeMinutes: 1,
        content:
          "Define the component library, typed data contracts, permitted layouts and known interaction states. The model composes only from that vocabulary. Validate the structure before rendering and keep a stable fallback for failed validation.",
      },
      {
        id: "s2",
        title: "Specify the constraint hierarchy",
        readTimeMinutes: 1,
        content:
          "Security, accessibility, permissions, data integrity and legal requirements are hard constraints. Design-system rules and product conventions set the permitted space, and personalisation stays inside it. Log selected components and inputs so you can reproduce unexpected behavior.",
      },
      {
        id: "s3",
        title: "Keep consequential surfaces deterministic",
        readTimeMinutes: 1,
        content:
          "Payments, legal acceptance, account recovery, permission changes, destructive actions and other consequential steps use fixed, reviewed flows. A generative interface may explain or prepare, but the final action and its confirmation stay predictable and testable.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/3",
          cpId: "exercise",
          scenario:
            "Pick one reversible, low-impact surface with varied user intent. Define its approved components, hard constraints, validation rule and static fallback, and read real failures before widening it.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "product/4",
    moduleId: "product",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Production evaluation and observability",
    subtitle:
      "Measure model behavior in production without trusting one score.",
    objective:
      "Measure model behavior in production without trusting one score.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Production brings new conditions",
        readTimeMinutes: 1,
        content:
          "Production adds new inputs, shifting data, tool failures, latency, real user behavior and distribution shift to the known pre-release cases. Privacy-preserving traces, version IDs, error categories and sampled review let you reproduce incidents without hoarding sensitive content.",
      },
      {
        id: "s2",
        title: "Measure observable signals",
        readTimeMinutes: 1,
        content:
          "Track verified task completion, user corrections, tool errors, refusals, latency, cost, safety-rule triggers and fallback use. Where signals cannot show quality, a human labels a documented sample. Segment by workflow and version so an average hides no failing subgroup.",
      },
      {
        id: "s3",
        title: "Separate alerts, containment, and rollback",
        readTimeMinutes: 1,
        content:
          "Set thresholds from baseline and error cost: some signals alert an owner, some disable one capability, some trigger rollback to a known version. Test these controls before an incident, guard automatic action against noisy metrics, and have a named person close each event.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "product/4",
          cpId: "exercise",
          title: "Production evaluation design",
          scenario:
            "For one user-facing model capability, define three production signals, each with baseline, alert threshold, containment or rollback condition and owner.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "product/5",
    moduleId: "product",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 3, knowledge check",
    subtitle:
      "Three questions on product boundaries, delegation, interfaces and production controls.",
    objective:
      "Three questions on product boundaries, delegation, interfaces and production controls.",
    durationMinutes: 4,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-product-q1",
        questionText:
          "Which question best defines the boundary of a model-backed product capability?",
        answerOptions: [
          {
            id: "a",
            text: "Does the marketing page call it AI-powered?",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Does it use a large language model internally?",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Which user outcome depends on the model, with what fallback?",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Does the interface contain a chat control?",
            isCorrect: false,
          },
        ],
        explanation:
          "A product boundary ties model behavior to one user outcome, its operating constraints and a failure path. Model choice, marketing and interface style establish nothing.",
      },
      {
        id: "ano-product-q2",
        questionText:
          "A flow has seven steps after the user states intent. What should the product team do first?",
        answerOptions: [
          {
            id: "a",
            text: "Add a chat control without changing the flow.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Decide which steps to delegate and where confirmation stays.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Remove every confirmation to minimise the step count.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Hide the steps behind a loading indicator.",
            isCorrect: false,
          },
        ],
        explanation:
          "Fewer steps help only if authority, material information and recovery remain. Classify each step by reversibility, observability, permissions and consequence before delegating it.",
      },
      {
        id: "ano-product-q3",
        questionText: "Where is a generative interface most appropriate?",
        answerOptions: [
          {
            id: "a",
            text: "The final confirmation for a payment.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "A legal acceptance screen.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "A reversible, low-impact surface with approved components.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Every screen, including destructive and permission-changing actions.",
            isCorrect: false,
          },
        ],
        explanation:
          "Use generative composition where variation helps, consequences are small, validation exists and a stable fallback is in place. Consequential confirmations stay deterministic and testable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
