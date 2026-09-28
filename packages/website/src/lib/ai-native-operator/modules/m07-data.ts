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
      "Connect approved sources with identity, authorization, freshness and provenance controls.",
    objective:
      "Connect approved sources with identity, authorization, freshness and provenance controls.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the supported decisions",
        readTimeMinutes: 1,
        content:
          "First decide which decisions the layer supports. Per use case, name authoritative records, acceptable staleness, data classification and required evidence, and make the shared search respect each source's authority, sensitivity and retention rules.",
      },
      {
        id: "s2",
        title: "Connect only justified sources",
        readTimeMinutes: 1,
        content:
          "Documents, code, tickets, customer records, messages and calendars each carry their own risk. Apply purpose limitation and data minimization, and involve privacy, security, legal and worker representatives where required. Connect a source only for a defined purpose.",
      },
      {
        id: "s3",
        title: "Return evidence with the result",
        readTimeMinutes: 1,
        content:
          "A retrieved answer shows source references, versions or timestamps and material access or freshness limits, and users can inspect that evidence. With thin coverage or conflicting sources, the system states the limitation or abstains instead of presenting unsupported synthesis as fact.",
      },
    ],
    callout: {
      kind: "note",
      h: "Sequence by value and risk",
      text: "Begin with sources that serve a defined use case, with clear ownership, stable access rules and manageable sensitivity. Add operational records once freshness and deletion are controlled, and communications only after privacy, security, retention and worker-impact review.",
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
            "List five candidate sources with use case, owner, authority, data classification, access model, freshness requirement, retention rule and evidence shown to users.",
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
      "Check user rights, workload identity and resource before returning content.",
    objective:
      "Check user rights, workload identity and resource before returning content.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Place the control before disclosure",
        readTimeMinutes: 1,
        content:
          "Authorization belongs in the retrieval path and at the source boundary. A response filter runs after retrieval and misses indirect disclosure. Check access before returning documents, passages, metadata or derived results, and test the policy on allowed and denied cases.",
      },
      {
        id: "s2",
        title: "Represent the user and the workload",
        readTimeMinutes: 1,
        content:
          "The system knows which user started a request and which agent or service ran it. Effective access is at most the intersection of the user's rights, the workload's assigned scope and current policy. Use short-lived credentials and explicit delegation, never a shared elevated account.",
      },
      {
        id: "s3",
        title: "Log decisions without creating a new leak",
        readTimeMinutes: 1,
        content:
          "Log user, workload identity, time, requested resource IDs, policy version, authorization decision and returned source IDs. Protect the log, keep raw secrets and needless sensitive query text out of it, and do not let it grow into a second uncontrolled data store.",
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
            "For one retrieval flow, identify user identity, workload identity, authorization source, effective permission rule, credential lifetime, denial behavior and audit fields. Name any gap you cannot reconstruct today.",
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
    title: "Manage freshness as a contract",
    subtitle:
      "Set staleness limits, propagate changes and deletions, show the data timestamp.",
    objective:
      "Set staleness limits, propagate changes and deletions, show the data timestamp.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Match freshness to the decision",
        readTimeMinutes: 1,
        content:
          "A periodic snapshot can suit stable reference material and be unsafe for a workflow acting on fast-changing state. Set a maximum age per use case and source, covering updates, revocations and deletions too.",
      },
      {
        id: "s2",
        title: "Detect and expose stale state",
        readTimeMinutes: 1,
        content:
          "Choose event-driven, scheduled or on-demand sync by required freshness and cost. Monitor ingestion delay and failed updates, return an as-of timestamp or version with each result, and decide in advance whether the workflow warns, asks for confirmation, falls back to the source or stops past the limit.",
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
            "For each major source, record update method, observed delay, maximum age, deletion behavior, stale-state signal and workflow response when the limit is exceeded.",
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
    title: "Module 7, knowledge check",
    subtitle: "Two questions on authorization and freshness.",
    objective: "Two questions on authorization and freshness.",
    durationMinutes: 3,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-data-q1",
        questionText:
          "A retrieval system returns a confidential document the user may not access. What is the primary architectural fix?",
        answerOptions: [
          {
            id: "a",
            text: "Add a text filter after generating the response.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Enforce authorization in the retrieval path.",
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
          "Deny unauthorized content before disclosure; a response filter comes too late and misses indirect leaks. Effective access is the intersection of user rights, workload scope and current policy.",
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
            text: "It can act on data past its allowed age.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Snapshots cannot contain newly created files.",
            isCorrect: false,
          },
        ],
        explanation:
          "A snapshot is safe only within the freshness the decision needs. Measure the delay, show the data timestamp and warn or stop past the limit.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
