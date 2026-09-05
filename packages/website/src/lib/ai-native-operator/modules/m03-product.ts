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
      "Name the user outcome that depends on model behavior, and the fallback for when that behavior is gone.",
    objective:
      "Name the user outcome that depends on model behavior, and the fallback for when that behavior is gone.",
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A visible AI control is not a product strategy",
        readTimeMinutes: 4,
        content:
          "A chat box is not a strategy. It can be useful, but it says nothing about whether the product solves a better problem. Start from the user's job. Name the delay or decision the model changes, and define how success is observed. Controls that do not move that outcome come out.",
      },
      {
        id: "s2",
        title: "Integrate capability with existing controls",
        readTimeMinutes: 5,
        content:
          "A model-backed capability needs the same product boundaries as any other system: supported inputs, permissions, failure states, latency expectations, data handling, and accountable owners. Keep structured controls wherever they add clarity or hold down risk. Show the model's involvement when a user needs it to interpret or challenge the result.",
      },
      {
        id: "s3",
        title: "Use a dependency and fallback test",
        readTimeMinutes: 4,
        content:
          "Ask what user outcome changes when the model is removed or degraded. Nothing material? Then the capability may be unnecessary. If a core outcome hangs on it, specify the fallback, the recovery path, and what the user gets told. Embedded features and model-centred products are equally valid, as long as the boundary is explicit.",
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
            "Audit three model-backed flows. For each one, state the user outcome, the model-dependent step, the failure mode, and the fallback when the model is unavailable.",
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
      "Separate user intent from the decisions, permissions, and confirmations that must stay explicit.",
    objective:
      "Separate user intent from the decisions, permissions, and confirmations that must stay explicit.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Intent is not authority",
        readTimeMinutes: 6,
        content:
          "A search query, a button click, an uploaded document, or a written request expresses a wanted outcome. None authorises every action needed to reach it. Record what the user asked for, which assumptions the system may make alone, and which side effects need a separate confirmation or permission check.",
      },
      {
        id: "s2",
        title: "Evaluate each step before compressing the flow",
        readTimeMinutes: 6,
        content:
          "For every step after intent, ask four questions. Is it deterministic, reversible, observable, and inside the user's authority? Delegate the steps that clear all four. Keep review or confirmation wherever ambiguity, money movement, data disclosure, legal effect, or another material consequence remains. Fewer steps help only when the information and the control survive the cut.",
      },
      {
        id: "s3",
        title: "Combine conversation with structured controls",
        readTimeMinutes: 6,
        content:
          "Conversation handles ambiguous input and clarification well. Structured controls handle exact values, constrained choices, comparison, and confirmation well. Pick the surface from the information and the risk in the current step. Chat is not the default interface.",
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
            "Choose one flow with more than five steps after the user states intent. Mark which steps can be delegated, which need confirmation, what the system must show, and how a user recovers from an error.",
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
      "Generate interfaces only from approved components, schemas, states, and accessibility rules.",
    objective:
      "Generate interfaces only from approved components, schemas, states, and accessibility rules.",
    durationMinutes: 21,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Generate compositions, not arbitrary markup",
        readTimeMinutes: 7,
        content:
          "Define the component library, the typed data contracts, the permitted layouts, and the known interaction states. The model composes from that vocabulary, nothing wider. Validate the generated structure before it renders, and keep a stable fallback for when validation fails.",
      },
      {
        id: "s2",
        title: "Specify the constraint hierarchy",
        readTimeMinutes: 7,
        content:
          "Security, accessibility, permissions, data integrity, and legal requirements are hard constraints. Design-system rules and product conventions mark the permitted space. Personalisation moves inside it and nowhere else. Log the selected components and inputs so unexpected behavior can be reproduced.",
      },
      {
        id: "s3",
        title: "Keep consequential surfaces deterministic",
        readTimeMinutes: 7,
        content:
          "Payments, legal acceptance, account recovery, permission changes, destructive actions. Those get fixed, reviewed flows. A generative interface can explain or prepare, but the final action and its confirmation state stay predictable and testable.",
      },
    ],
    callout: {
      kind: "note",
      h: "A bounded starting point",
      text: "Choose a reversible, low-impact surface with varied information needs. Restrict generation to approved components, add schema validation and a static fallback, then read the real failures before you widen the scope.",
    },
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
            "Pick one reversible, low-impact surface with varied user intent. Define its approved components, hard constraints, validation rule, and static fallback.",
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
      "Measure model-backed behavior in production without treating a single score as ground truth.",
    objective:
      "Measure model-backed behavior in production without treating a single score as ground truth.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Offline evaluations do not cover production",
        readTimeMinutes: 6,
        content:
          "A pre-release suite covers known cases. Production adds new inputs, shifting data, tool failures, latency, real user behavior, and distribution shift. Watch those conditions directly. Use privacy-preserving traces, version identifiers, error categories, and sampled review so an incident can be reproduced without hoarding sensitive content.",
      },
      {
        id: "s2",
        title: "Measure observable signals",
        readTimeMinutes: 6,
        content:
          "Track verified task completion, user corrections, tool errors, refusals, latency, cost, safety-rule triggers, and fallback use. Where automated signals cannot establish quality, add human labels for a documented sample. Segment by workflow and version. One overall average will hide a failing subgroup.",
      },
      {
        id: "s3",
        title: "Separate alerts, containment, and rollback",
        readTimeMinutes: 5,
        content:
          "Set thresholds from baseline behavior and error cost. Some signals alert an owner, some disable a single capability, some justify rollback to a known version. Test those controls before an incident, not during one. Automatic action needs safeguards against noisy metrics, and a named person investigates and closes the event.",
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
            "For one user-facing model capability, define three production signals. State the baseline, alert threshold, containment or rollback condition, and responsible owner.",
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
      "Four things to test: product boundaries, delegation, constrained interfaces, production controls.",
    objective:
      "Four things to test: product boundaries, delegation, constrained interfaces, production controls.",
    durationMinutes: 8,
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
            text: "Which user outcome depends on model behavior, and what fallback remains when it fails?",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Does the interface contain a chat control?",
            isCorrect: false,
          },
        ],
        explanation:
          "A product boundary ties model behavior to one specific user outcome, its operating constraints, and a failure path. Model choice, marketing language, and interface style establish nothing.",
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
            text: "Determine which steps can be delegated safely and where permission, review, or confirmation must remain.",
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
          "Cutting steps helps only when authority, material information, and recovery survive the cut. Classify each step by reversibility, observability, permissions, and consequence before you delegate it.",
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
            text: "A reversible, low-impact surface with varied needs and an approved component vocabulary.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Every screen, including destructive and permission-changing actions.",
            isCorrect: false,
          },
        ],
        explanation:
          "Introduce generative composition where variation helps, consequences stay small, validation exists, and a stable fallback is already in place. Consequential confirmations stay deterministic and testable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
