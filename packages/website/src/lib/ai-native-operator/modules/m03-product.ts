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
      "Identify the user outcome that depends on model behavior and the fallback required when that behavior is unavailable.",
    objective:
      "Identify the user outcome that depends on model behavior and the fallback required when that behavior is unavailable.",
    durationMinutes: 13,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A visible AI control is not a product strategy",
        readTimeMinutes: 4,
        content:
          "Adding a chat control can be useful, but its presence does not show that the product solves a better problem. Start from the user's job, identify the delay or decision the model changes, and define how success will be observed. Remove controls that do not improve that outcome.",
      },
      {
        id: "s2",
        title: "Integrate capability with existing controls",
        readTimeMinutes: 5,
        content:
          "A model-backed capability needs the same product boundaries as any other system: supported inputs, permissions, failure states, latency expectations, data handling, and accountable owners. Keep structured controls where they improve clarity or constrain risk. Make model involvement visible when users need it to interpret or challenge a result.",
      },
      {
        id: "s3",
        title: "Use a dependency and fallback test",
        readTimeMinutes: 4,
        content:
          "Ask which user outcome changes if the model is removed or degraded. If no material outcome changes, the capability may be unnecessary. If a core outcome depends on it, specify the fallback, recovery path, and user communication. Both embedded features and model-centred products can be valid when their boundaries are explicit.",
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
            "Audit three model-backed flows. For each, state the user outcome, the model-dependent step, the failure mode, and the fallback when the model is unavailable.",
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
      "Separate user intent from the decisions, permissions, and confirmations that must remain explicit.",
    objective:
      "Separate user intent from the decisions, permissions, and confirmations that must remain explicit.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Intent is not authority",
        readTimeMinutes: 6,
        content:
          "A search query, button click, uploaded document, or written request can express a desired outcome. It does not automatically authorise every action needed to reach that outcome. Record what the user asked for, which assumptions the system may make, and which side effects require a separate confirmation or permission check.",
      },
      {
        id: "s2",
        title: "Evaluate each step before compressing the flow",
        readTimeMinutes: 6,
        content:
          "For every step after intent, ask whether it is deterministic, reversible, observable, and within the user's authority. Delegate steps that meet the control requirements. Keep review or confirmation where ambiguity, money movement, data disclosure, legal effect, or other material consequences remain. Fewer steps are useful only when important information and control are preserved.",
      },
      {
        id: "s3",
        title: "Combine conversation with structured controls",
        readTimeMinutes: 6,
        content:
          "Conversation is useful for ambiguous input and clarification. Structured controls are useful for exact values, constrained choices, comparison, and confirmation. Select the surface from the information and risk in the current step rather than treating chat as the default interface.",
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
            "Choose one flow with more than five steps after the user states intent. Mark which steps can be delegated, which need confirmation, what the system must show, and how the user can recover from an error.",
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
          "Define a component library, typed data contracts, permitted layouts, and known interaction states. Let the model select and compose from that vocabulary. Validate the generated structure before rendering it, and provide a stable fallback when validation fails.",
      },
      {
        id: "s2",
        title: "Specify the constraint hierarchy",
        readTimeMinutes: 7,
        content:
          "Security, accessibility, permissions, data integrity, and legal requirements are hard constraints. Design-system rules and product conventions define the permitted space. Personalisation operates only inside that space. Log the selected components and inputs so unexpected behavior can be reproduced.",
      },
      {
        id: "s3",
        title: "Keep consequential surfaces deterministic",
        readTimeMinutes: 7,
        content:
          "Use fixed, reviewed flows for payments, legal acceptance, account recovery, permission changes, destructive actions, and other consequential steps. A generative interface may support explanation or preparation, but the final action and confirmation state should remain predictable and testable.",
      },
    ],
    callout: {
      kind: "note",
      h: "A bounded starting point",
      text: "Choose a reversible, low-impact surface with varied information needs. Restrict generation to approved components, add schema validation and a static fallback, then review real failures before widening the scope.",
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
            "Identify one reversible, low-impact surface with varied user intent. Define its approved components, hard constraints, validation rule, and static fallback.",
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
          "A pre-release suite covers known cases. Production adds new inputs, changing data, tool failures, latency, user behavior, and distribution shift. Observe these conditions directly. Use privacy-preserving traces, version identifiers, error categories, and sampled review so an incident can be reproduced without collecting unnecessary sensitive content.",
      },
      {
        id: "s2",
        title: "Measure observable signals",
        readTimeMinutes: 6,
        content:
          "Track task completion where it can be verified, user corrections, tool errors, refusals, latency, cost, safety-rule triggers, and fallback use. Add human labels for a documented sample when automated signals cannot establish quality. Segment results by workflow and version; an overall average can hide a critical subgroup failure.",
      },
      {
        id: "s3",
        title: "Separate alerts, containment, and rollback",
        readTimeMinutes: 5,
        content:
          "Define thresholds from baseline behavior and error cost. Some signals should alert an owner, some should disable one capability, and some justify rollback to a known version. Test these controls before an incident. Automatic action needs safeguards against noisy metrics, and a named person must investigate and close the event.",
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
      "Check your understanding of product boundaries, delegation, constrained interfaces, and production controls.",
    objective:
      "Check your understanding of product boundaries, delegation, constrained interfaces, and production controls.",
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
          "A product boundary connects model behavior to a specific user outcome, operating constraints, and a failure path. Model choice, marketing language, or interface style does not establish that boundary.",
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
          "Step reduction is useful only when authority, material information, and recovery remain intact. Classify each step by reversibility, observability, permissions, and consequence before delegating it.",
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
          "Generative composition is best introduced where variation is useful, consequences are limited, validation is available, and a stable fallback exists. Consequential confirmations should remain deterministic and testable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
