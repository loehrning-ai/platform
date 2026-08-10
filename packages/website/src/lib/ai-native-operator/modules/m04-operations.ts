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
      "Route routine updates through written records and reserve meetings for work that needs live interaction.",
    objective:
      "Route routine updates through written records and reserve meetings for work that needs live interaction.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Classify the purpose first",
        readTimeMinutes: 5,
        content:
          "A status update, a decision, and a sensitive discussion require different forms of coordination. Routine facts can usually be recorded asynchronously. Contested decisions, incidents, relationship work, and ambiguous issues often need a live conversation. Classify the purpose before choosing the format.",
      },
      {
        id: "s2",
        title: "Make written updates usable",
        readTimeMinutes: 5,
        content:
          "Use a consistent update format: current state, evidence or source links, blockers, owner, timestamp, and decisions needed. A model can group and summarize the entries, but its summary is a routing aid, not the record. Readers must be able to inspect the underlying updates because summaries can omit or distort details.",
      },
      {
        id: "s3",
        title: "Document the live decision",
        readTimeMinutes: 4,
        content:
          "When a live meeting is justified, define the decision owner and the required input in advance. Record the decision, reasoning, dissent, actions, and owners afterward. Separate time for informal contact when the team needs it; do not depend on a status meeting to provide it accidentally.",
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
            "List five recurring meetings. For each one, record its purpose, required input, expected output, and decision owner. Mark whether it belongs in a written update, a live meeting, or both.",
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
      "Give a drafting tool a defined audience, purpose, evidence base, constraints, and owner.",
    objective:
      "Give a drafting tool a defined audience, purpose, evidence base, constraints, and owner.",
    durationMinutes: 12,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Write the brief before the draft",
        readTimeMinutes: 6,
        content:
          "A useful brief states who will read the document, what decision or outcome it supports, which sources are authoritative, which constraints apply, and who owns the result. The brief reduces ambiguity for both a human writer and a drafting model. It also gives reviewers a stable basis for judging the draft.",
      },
      {
        id: "s2",
        title: "Treat generated text as an unverified draft",
        readTimeMinutes: 6,
        content:
          "Generated prose is not evidence. Verify citations, figures, names, policy statements, and sensitive claims against their sources. Preserve document versions and identify the human approver. The tool may accelerate drafting, but the named owner remains accountable for accuracy, disclosure, and release.",
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
            "Choose one document due this week. Write a brief with its audience, required outcome, approved sources, constraints, owner, and review criteria.",
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
      "Automate bounded classification and routing while keeping uncertainty, impact, and escalation visible.",
    objective:
      "Automate bounded classification and routing while keeping uncertainty, impact, and escalation visible.",
    durationMinutes: 17,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Define the triage record",
        readTimeMinutes: 6,
        content:
          "For each ticket, record category, severity, proposed owner, confidence, and supporting evidence. Limit automatic actions to documented rules. Preserve the original request and link any related tickets or operational context so that a reviewer can reconstruct the route.",
      },
      {
        id: "s2",
        title: "Set risk-based review rules",
        readTimeMinutes: 6,
        content:
          "Escalate uncertain, conflicting, novel, high-impact, or policy-required cases. Thresholds should reflect the cost of a wrong route rather than an assumed automation rate. Review a risk-based sample of other cases as well; confidence scores alone do not demonstrate correctness or reveal systematic errors.",
      },
      {
        id: "s3",
        title: "Close the correction loop",
        readTimeMinutes: 5,
        content:
          "Assign owners for reviewing escalations, correcting the route, updating rules or examples, and communicating with affected users. Keep an audit trail of inputs, outputs, overrides, and final outcomes. Monitor error patterns and suspend automatic actions when the control no longer performs as intended.",
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
            "Sketch a ticket-triage pipeline. Specify its inputs, classification fields, evidence sources, automatic actions, escalation rules, review sample, and correction owner.",
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
    subtitle: "Check the operating controls from this module.",
    objective: "Check the operating controls from this module.",
    durationMinutes: 7,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-operations-q1",
        questionText:
          "A weekly status meeting mostly repeats information that already exists in writing. What is the best response?",
        answerOptions: [
          {
            id: "a",
            text: "Keep the meeting and reduce its scheduled duration.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Move routine updates to a structured written record, use summaries as routing aids, and keep live time for decisions or ambiguity.",
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
          "Routine facts belong in an inspectable written record. A summary can help route attention but does not replace the source material. Live time remains appropriate when people must resolve a contested decision, incident, sensitive issue, or material ambiguity.",
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
            text: "Uncertain, conflicting, novel, high-impact, or policy-required cases, plus a risk-based sample of other cases.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Only tickets from a designated customer tier.",
            isCorrect: false,
          },
        ],
        explanation:
          "Review rules should reflect error cost and policy obligations. Uncertainty is one signal, not the only one. A risk-based sample can expose systematic errors in cases the system classified with high confidence.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
