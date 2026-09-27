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
      "Record each deployed system with owner, use, data access, tools, controls and status.",
    objective:
      "Record each deployed system with owner, use, data access, tools, controls and status.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Inventory the deployed system",
        readTimeMinutes: 9,
        content:
          "Register each deployed use with business purpose, accountable owner, provider and version, deployment location, data classifications, connected tools, user groups, risk tier and lifecycle status. Include externally hosted features and embedded vendor capabilities that touch your data or decisions.",
      },
      {
        id: "s2",
        title: "Keep the registry tied to lifecycle events",
        readTimeMinutes: 9,
        content:
          "Update the record at intake, approval, release, material change, periodic review, incident response and retirement. Store evaluation evidence, approval conditions, last and next review and open findings. One owner answers for completeness, with a process to find unregistered systems.",
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
            "For one deployed system, record use, owner, provider and version, hosting, data classes, tools, users, risk tier, approvals, evaluation evidence, review date and retirement condition. Mark every unknown field.",
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
      "Match evaluation, approval, rollout, monitoring and rollback to each change's risk.",
    objective:
      "Match evaluation, approval, rollout, monitoring and rollback to each change's risk.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Define a change-specific release gate",
        readTimeMinutes: 12,
        content:
          "Changes to model, provider, prompt, retrieval, tool, policy or routing can all shift behavior. Classify the change, pick representative quality and safety evaluations, set thresholds and name the human review. Automate repeatable checks and store results with the released version.",
      },
      {
        id: "s2",
        title: "Control the release after the gate",
        readTimeMinutes: 12,
        content:
          "Pre-release evaluations miss some production conditions. Use staged exposure where feasible, watch outcome and guardrail signals and set rollback or containment criteria in advance. Document an emergency path with limited authority, time bounds, retrospective review and follow-up tests.",
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
            "For one deployed workflow, define change classes, evaluations, thresholds, approvers, staged rollout, production guardrails, rollback criteria and the emergency-change record.",
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
      "Use distinct workload identities, explicit delegation, least privilege and protected logs.",
    objective:
      "Use distinct workload identities, explicit delegation, least privilege and protected logs.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Separate the actor, user, and authority",
        readTimeMinutes: 10,
        content:
          "When an agent acts, the system identifies the executing workload, whom it acts for and the authorization behind it. Each production workload gets its own identity with least privilege, short-lived credentials, scoped resources and actions and explicit revocation.",
      },
      {
        id: "s2",
        title: "Record enough evidence to reconstruct the event",
        readTimeMinutes: 10,
        content:
          "An audit event holds event ID, timestamps, workload identity, represented user or service, action, resource, authorization decision, policy version, result and correlation IDs. Protect the log and store references or redacted values in place of secrets and personal data.",
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
            "For one consequential write or delete action, identify workload identity, represented user or service, credential scope, authorization evidence, audit fields, retention, log access, revocation path and incident owner.",
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
    subtitle: "Two questions on registry and audit trail.",
    objective: "Two questions on registry and audit trail.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-governance-q1",
        questionText:
          "Security asks which deployed systems use customer personal data, and nobody can fully answer. What is the primary corrective control?",
        answerOptions: [
          {
            id: "a",
            text: "Disable every model-mediated system without first identifying them.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Maintain a system registry tied to lifecycle events.",
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
          "The gap is a missing inventory. A registry links each use to owner, data classes, provider and version, tools, controls, approvals and lifecycle state, which no other safeguard replaces.",
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
            text: "A protected event log with identity, authority, action and result.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "A retrospective written without event records.",
            isCorrect: false,
          },
        ],
        explanation:
          "A protected event record links workload, represented principal, authority, action, resource and result at the moment of the event. Display names and later recollection cannot establish that chain.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
