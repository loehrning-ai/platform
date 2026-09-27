import type { AiNativeOperatorLesson } from "../types";

export const OPERATIONS_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "operations/1",
    moduleId: "operations",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Choose synchronous and asynchronous coordination",
    subtitle:
      "Put routine updates in writing and meet live only when needed.",
    objective:
      "Put routine updates in writing and meet live only when needed.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Classify the purpose first",
        readTimeMinutes: 5,
        content:
          "A status update, a decision and a sensitive discussion are different jobs. Routine facts go in writing. Contested decisions, incidents, relationship work and ambiguity often need a live conversation, so classify the purpose before you pick the format.",
      },
      {
        id: "s2",
        title: "Make written updates usable",
        readTimeMinutes: 5,
        content:
          "Use one update format: current state, evidence or source links, blockers, owner, timestamp and decisions needed. A model can group and summarize entries, but summaries only route attention and readers keep access to the entries.",
      },
      {
        id: "s3",
        title: "Document the live decision",
        readTimeMinutes: 4,
        content:
          "Before a live meeting, name the decision owner and the required input. Afterwards record the decision, reasoning, dissent, actions and owners. Schedule informal contact separately if the team needs it.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/1",
          cpId: "exercise",
          title: "Meeting audit",
          scenario:
            "List five recurring meetings with purpose, required input, expected output and decision owner. Mark whether each belongs in writing, a live meeting or both.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/2",
    moduleId: "operations",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Draft documents from explicit briefs",
    subtitle:
      "Give a drafting tool audience, purpose, evidence, constraints and an owner.",
    objective:
      "Give a drafting tool audience, purpose, evidence, constraints and an owner.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Write the brief before the draft",
        readTimeMinutes: 6,
        content:
          "A brief states who reads the document, what decision it supports, which sources are authoritative, which constraints apply and who owns the result. Writers, models and reviewers all work from it.",
      },
      {
        id: "s2",
        title: "Treat generated text as an unverified draft",
        readTimeMinutes: 6,
        content:
          "Check citations, figures, names, policy statements and sensitive claims against their sources. Keep document versions and name the human approver. The owner stays accountable for accuracy, disclosure and release.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/2",
          cpId: "exercise",
          scenario:
            "Write the brief for one document due this week: audience, outcome, approved sources, constraints, owner and review criteria.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "operations/3",
    moduleId: "operations",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Controlled ticket triage",
    subtitle:
      "Automate classification and routing with uncertainty and escalation visible.",
    objective:
      "Automate classification and routing with uncertainty and escalation visible.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Define the triage record",
        readTimeMinutes: 6,
        content:
          "Record category, severity, proposed owner, confidence and evidence for each ticket. Automatic actions follow documented rules only. Keep the original request and link related tickets and context so a reviewer can reconstruct the route.",
      },
      {
        id: "s2",
        title: "Set risk-based review rules",
        readTimeMinutes: 6,
        content:
          "Escalate uncertain, conflicting, novel, high-impact and policy-required cases, and review a risk-based sample of the rest. Set thresholds from the cost of a wrong route; high confidence proves neither correctness nor absence of systematic error.",
      },
      {
        id: "s3",
        title: "Close the correction loop",
        readTimeMinutes: 5,
        content:
          "Name owners for reviewing escalations, correcting routes, updating rules or examples and informing affected users. Log inputs, outputs, overrides and outcomes, watch error patterns, and suspend automatic actions when the control stops working.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "operations/3",
          cpId: "exercise",
          title: "Triage pipeline",
          scenario:
            "Sketch a ticket-triage pipeline: inputs, classification fields, evidence sources, automatic actions, escalation rules, review sample and correction owner.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "operations/4",
    moduleId: "operations",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 4 knowledge check",
    subtitle: "Two questions on coordination and triage.",
    objective: "Two questions on coordination and triage.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "A weekly status meeting mostly repeats information already in writing. What is the best response?",
        answerOptions: [
          {
            id: "a",
            text: "Keep the meeting and reduce its scheduled duration.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Move updates into writing and meet only for decisions.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Keep the format and add a longer agenda.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Rotate the meeting time between participants.",
            isCorrect: false,
          },
        ],
        explanation:
          "Routine facts belong in a written record, and summaries only route attention. Live time is for contested decisions, incidents, sensitive issues or real ambiguity.",
      },
      {
        id: "ano-operations-q2",
        questionText:
          "Which tickets should a controlled triage system send to human review?",
        answerOptions: [
          {
            id: "a",
            text: "Only a fixed random sample, regardless of impact.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Only the oldest tickets in the queue.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Uncertain, novel or high-impact cases plus a risk-based sample.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Only tickets from a designated customer tier.",
            isCorrect: false,
          },
        ],
        explanation:
          "Review follows error cost and policy duties, with uncertainty as one signal. A risk-based sample exposes systematic errors in cases classified with high confidence.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
