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
      "Route routine updates into written records. Save meetings for work that needs people live.",
    objective:
      "Route routine updates into written records. Save meetings for work that needs people live.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Classify the purpose first",
        readTimeMinutes: 5,
        content:
          "Monday, 09:30. Eleven people on a call, reading out what is already in the tracker. A status update, a decision, and a sensitive discussion are three different jobs. Routine facts go in writing; contested decisions, incidents, relationship work, and ambiguity often need a live conversation. Classify the purpose before picking the format.",
      },
      {
        id: "s2",
        title: "Make written updates usable",
        readTimeMinutes: 5,
        content:
          "Use one update format: current state, evidence or source links, blockers, owner, timestamp, decisions needed. A model can group and summarize the entries. That summary is a routing aid, never the record. Readers must be able to open the underlying updates, because a summary omits and distorts.",
      },
      {
        id: "s3",
        title: "Document the live decision",
        readTimeMinutes: 4,
        content:
          "When a live meeting is justified, name the decision owner and the required input beforehand. Afterwards record the decision, reasoning, dissent, actions, and owners. Give informal contact its own time when the team needs it, rather than hoping a status meeting supplies it by accident.",
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
            "List five recurring meetings. For each, record the purpose, required input, expected output, and decision owner. Mark whether it belongs in a written update, a live meeting, or both.",
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
          "A useful brief states who reads the document, what decision it supports, which sources are authoritative, which constraints apply, and who owns the result. That removes ambiguity for a human writer and for a drafting model alike. It also gives reviewers a stable basis for judging what comes back.",
      },
      {
        id: "s2",
        title: "Treat generated text as an unverified draft",
        readTimeMinutes: 6,
        content:
          "Generated prose is not evidence. Check citations, figures, names, policy statements, and sensitive claims against their sources. Keep the document versions and name the human approver. The tool speeds up drafting. The named owner stays accountable for accuracy, disclosure, and release.",
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
            "Take one document due this week. Write its brief: audience, required outcome, approved sources, constraints, owner, review criteria.",
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
          "For each ticket, record category, severity, proposed owner, confidence, and supporting evidence. Automatic actions stay inside documented rules. Keep the original request, and link related tickets or operational context so a reviewer can reconstruct the route.",
      },
      {
        id: "s2",
        title: "Set risk-based review rules",
        readTimeMinutes: 6,
        content:
          "Escalate the uncertain, conflicting, novel, high-impact, and policy-required cases. Set thresholds from the cost of a wrong route, not from a target automation rate. Sample the rest on a risk-based basis too. A confidence score demonstrates neither correctness nor the absence of systematic error.",
      },
      {
        id: "s3",
        title: "Close the correction loop",
        readTimeMinutes: 5,
        content:
          "Name owners for reviewing escalations, correcting the route, updating rules or examples, and talking to affected users. Keep an audit trail of inputs, outputs, overrides, and final outcomes. Watch the error patterns. Suspend the automatic actions when the control stops performing.",
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
    subtitle: "Two questions on coordination and controlled triage.",
    objective: "Two questions on coordination and controlled triage.",
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
          "Routine facts belong in an inspectable written record. A summary routes attention. It does not replace the source material. Live time still earns its place when people must resolve a contested decision, an incident, a sensitive issue, or a material ambiguity.",
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
          "Review rules follow error cost and policy obligations. Uncertainty is one signal, not the only one. A risk-based sample exposes systematic errors in the cases the system classified with high confidence.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
