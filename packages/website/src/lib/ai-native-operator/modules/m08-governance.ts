import type { AiNativeOperatorLesson } from "../types";

export const GOVERNANCE_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "governance/1",
    moduleId: "governance",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Maintain a model and system registry",
    subtitle:
      "Record deployed model-mediated systems, their owners, intended uses, data access, tools, controls, and current status.",
    objective:
      "Record deployed model-mediated systems, their owners, intended uses, data access, tools, controls, and current status.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Inventory the deployed system, not only the model",
        readTimeMinutes: 9,
        content:
          "A model name alone does not identify operational risk. Register each deployed use with its business purpose, accountable owner, provider and version, deployment location, data classifications, connected tools, user groups, risk tier, and lifecycle status. Include externally hosted features and embedded vendor capabilities when they affect your data or decisions.",
      },
      {
        id: "s2",
        title: "Keep the registry tied to lifecycle events",
        readTimeMinutes: 9,
        content:
          "Create or update the record during intake, approval, release, material change, periodic review, incident response, and retirement. Store evaluation evidence, approval conditions, last review, next review, and unresolved findings. Assign an owner for completeness and a mechanism for discovering unregistered systems.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/1",
          cpId: "exercise",
          scenario:
            "Choose one deployed model-mediated system. Record its use, owner, provider and version, hosting location, data classes, tools, users, risk tier, approvals, evaluation evidence, review date, and retirement condition. Mark every unknown field.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "governance/2",
    moduleId: "governance",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Release changes through defined controls",
    subtitle:
      "Match evaluation, approval, rollout, monitoring, and rollback requirements to the risk of each change.",
    objective:
      "Match evaluation, approval, rollout, monitoring, and rollback requirements to the risk of each change.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Define a change-specific release gate",
        readTimeMinutes: 12,
        content:
          "Model, provider, prompt, retrieval, tool, policy, and routing changes can alter behavior. Classify the change, select representative quality and safety evaluations, set acceptance thresholds, and identify required human review. Automate repeatable checks and preserve the result with the released version.",
      },
      {
        id: "s2",
        title: "Control the release after the gate",
        readTimeMinutes: 12,
        content:
          "Pre-release evaluations cannot cover every production condition. Use staged exposure where feasible, monitor defined outcome and guardrail signals, and prepare rollback or containment criteria. Document an emergency-change path with limited authority, explicit time bounds, retrospective review, and follow-up testing.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/2",
          cpId: "exercise",
          scenario:
            "For one deployed workflow, define change classes, required evaluations, acceptance thresholds, approvers, staged rollout, production guardrails, rollback criteria, and the emergency-change record.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "governance/3",
    moduleId: "governance",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Give agents bounded identity and audit trails",
    subtitle:
      "Use attributable workload identities, explicit delegation, least privilege, and protected event records.",
    objective:
      "Use attributable workload identities, explicit delegation, least privilege, and protected event records.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Separate the actor, user, and authority",
        readTimeMinutes: 10,
        content:
          "When an agent acts, the system should identify the executing workload, the user or service on whose behalf it acts, and the authorization that permits the action. Give each production workload a distinct identity. Use least privilege, short-lived credentials, scoped resources and actions, and explicit revocation rather than shared secrets or broad service accounts.",
      },
      {
        id: "s2",
        title: "Record enough evidence to reconstruct the event",
        readTimeMinutes: 10,
        content:
          "An audit event should include a unique event identifier, timestamps, workload identity, represented user or service, action, resource, authorization decision, policy version, result, and correlation identifiers. Protect integrity and access to the log. Store references or redacted values instead of unnecessary secrets and personal data.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "governance/3",
          cpId: "exercise",
          scenario:
            "Choose one consequential write or destructive action. Identify the workload identity, represented user or service, credential scope, authorization evidence, audit fields, retention, log access, revocation path, and incident owner.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "governance/4",
    moduleId: "governance",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 8 knowledge check",
    subtitle: "Check the governance controls from this module.",
    objective: "Check the governance controls from this module.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-governance-q1",
        questionText:
          "The security team asks which deployed systems use customer personal data, but no complete answer is available. What is the primary corrective control?",
        answerOptions: [
          {
            id: "a",
            text: "Disable every model-mediated system without first identifying them.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Create and maintain a system registry tied to intake, release, change, review, incident, and retirement events.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Assign a security executive without creating an inventory process.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Add encryption without identifying uses, owners, data flows, or tools.",
            isCorrect: false,
          },
        ],
        explanation:
          "The immediate gap is the absence of a maintained inventory. A registry connects each deployed use to its owner, data classifications, provider and version, tools, controls, approvals, and lifecycle state. Other safeguards remain necessary but do not replace that record.",
      },
      {
        id: "ano-governance-q2",
        questionText:
          "An agent deletes a record. Which evidence best supports attribution and incident reconstruction?",
        answerOptions: [
          {
            id: "a",
            text: "Sentiment analysis of recent model inputs.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "An estimate based on the display name of the agent.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Workload identity, represented user or service, action, resource, authorization and policy version, timestamps, result, and correlation identifiers.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "A retrospective written without event records.",
            isCorrect: false,
          },
        ],
        explanation:
          "A protected event record links the executing workload, represented principal, authority, action, resource, and result at the time of the event. Display names and later recollection cannot establish that chain reliably.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
