import type { AiNativeOperatorLesson } from "../types";

export const DATA_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "data/1",
    moduleId: "data",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Build a governed retrieval layer",
    subtitle:
      "Connect approved sources through explicit identity, authorization, freshness, and provenance controls.",
    objective:
      "Connect approved sources through explicit identity, authorization, freshness, and provenance controls.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the supported decisions",
        readTimeMinutes: 8,
        content:
          "Define which questions or actions the retrieval layer will support before connecting sources. For each use case, name the authoritative records, acceptable staleness, data classification, and required evidence. A single search surface can simplify access, but it must preserve differences in authority, sensitivity, and retention.",
      },
      {
        id: "s2",
        title: "Connect only justified sources",
        readTimeMinutes: 8,
        content:
          "Documents, code, tickets, customer records, messages, calendars, and other sources carry different risks. Apply purpose limitation and data minimization. Involve privacy, security, legal, and worker-representation owners where required. Do not ingest a source merely because a connector exists.",
      },
      {
        id: "s3",
        title: "Return evidence with the result",
        readTimeMinutes: 8,
        content:
          "A retrieved answer should expose source references, relevant versions or timestamps, and any material access or freshness limits. The user must be able to inspect the evidence. When coverage is insufficient or sources conflict, the system should state the limitation or abstain instead of presenting unsupported synthesis as fact.",
      },
    ],
    callout: {
      kind: "note",
      h: "Sequence by value and risk",
      text: "Begin with sources that support a defined use case and have clear ownership, stable access rules, and manageable sensitivity. Add operational records when freshness and deletion handling are controlled. Add communications only after explicit privacy, security, retention, and worker-impact review.",
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/1",
          cpId: "exercise",
          title: "Source register",
          scenario:
            "List five candidate sources. For each, record the supported use case, owner, authority, data classification, access model, freshness requirement, retention rule, and evidence shown to users.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "data/2",
    moduleId: "data",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Enforce authorization at retrieval time",
    subtitle:
      "Evaluate the user's rights, the workload identity, and the requested resource before returning content.",
    objective:
      "Evaluate the user's rights, the workload identity, and the requested resource before returning content.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Place the control before disclosure",
        readTimeMinutes: 7,
        content:
          "Authorization belongs in the retrieval path and at the source boundary. A response filter acts after content has already been retrieved and may miss indirect disclosure. Evaluate access before returning documents, passages, metadata, or derived results, and test the policy with both allowed and denied cases.",
      },
      {
        id: "s2",
        title: "Represent both user and workload identity",
        readTimeMinutes: 7,
        content:
          "The system should know which user initiated the request and which agent or service executed it. Effective access should be no broader than the intersection of the user's rights, the workload's assigned scope, and current policy. Use short-lived credentials and explicit delegation; do not rely on a shared elevated account.",
      },
      {
        id: "s3",
        title: "Log decisions without creating a new leak",
        readTimeMinutes: 6,
        content:
          "Record the user, workload identity, time, requested resource identifiers, policy version, authorization decision, and returned source identifiers. Protect the log itself and avoid storing raw secrets or unnecessary sensitive query text. The record should support incident reconstruction without becoming a second uncontrolled data store.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/2",
          cpId: "exercise",
          scenario:
            "For one retrieval flow, identify the user identity, workload identity, authorization source, effective permission rule, credential lifetime, denial behavior, and audit fields. Name any gap you cannot currently reconstruct.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "data/3",
    moduleId: "data",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Manage freshness as an explicit contract",
    subtitle:
      "Set source-specific staleness limits, propagate changes and deletions, and expose the data timestamp.",
    objective:
      "Set source-specific staleness limits, propagate changes and deletions, and expose the data timestamp.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Match freshness to the decision",
        readTimeMinutes: 11,
        content:
          "A periodic snapshot may be adequate for stable reference material and unsafe for a workflow acting on rapidly changing state. Define a maximum acceptable age for each use case and source. Include updates, revocations, and deletions in the contract; stale permissions can be as consequential as stale content.",
      },
      {
        id: "s2",
        title: "Detect and expose stale state",
        readTimeMinutes: 11,
        content:
          "Choose event-driven, scheduled, or on-demand synchronization from the required freshness and operating cost. Monitor ingestion delay and failed updates. Return an as-of timestamp or version with results, and define whether the workflow warns, requests confirmation, falls back to the source, or stops when the freshness limit is exceeded.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "data/3",
          cpId: "exercise",
          scenario:
            "For each major source, record the current update method, observed delay, maximum acceptable age, deletion behavior, stale-state signal, and workflow response when the limit is exceeded.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "data/4",
    moduleId: "data",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 7 knowledge check",
    subtitle: "Check the retrieval controls from this module.",
    objective: "Check the retrieval controls from this module.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-data-q1",
        questionText:
          "A retrieval system returns a confidential document that the requesting user may not access. What is the primary architectural correction?",
        answerOptions: [
          {
            id: "a",
            text: "Add a text filter after generating the response.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Enforce authorization in the retrieval path using the user's rights, the workload scope, and current policy.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Hide the system from users with senior roles.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Disable retrieval without correcting the authorization design.",
            isCorrect: false,
          },
        ],
        explanation:
          "The system must deny unauthorized content before disclosure. A response filter is too late and can miss indirect leakage. Effective access should reflect both the requesting user's rights and the workload's explicitly assigned scope.",
      },
      {
        id: "ano-data-q2",
        questionText:
          "Why can a periodic snapshot be unsafe for an action-taking workflow?",
        answerOptions: [
          {
            id: "a",
            text: "Every snapshot is inherently slow to build.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Snapshots always use more storage than event streams.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "The workflow can act on state older than its allowed staleness unless freshness is measured and enforced.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Snapshots cannot contain newly created files.",
            isCorrect: false,
          },
        ],
        explanation:
          "Snapshot frequency is safe only relative to the decision's freshness requirement. The control is to define that requirement, measure actual delay, expose the data timestamp, and stop or degrade the workflow when the limit is exceeded.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
