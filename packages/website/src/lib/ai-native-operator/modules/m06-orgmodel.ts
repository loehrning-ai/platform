import type { AiNativeOperatorLesson } from "../types";

export const ORGMODEL_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "orgmodel/1",
    moduleId: "orgmodel",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Design teams around accountable outcomes",
    subtitle:
      "Size teams from work, service duties, dependencies, skills and risk.",
    objective:
      "Size teams from work, service duties, dependencies, skills and risk.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the operating boundary",
        readTimeMinutes: 1,
        content:
          "Define the outcome a team owns, its users, service levels, dependencies, decision rights and control duties, then the workload and skills this needs. Clear ownership cuts handoffs. Size follows demand, coverage, complexity and risk.",
      },
      {
        id: "s2",
        title: "Evaluate capacity options explicitly",
        readTimeMinutes: 1,
        content:
          "A capacity request shows workload, bottlenecks, service impact, control constraints and the options assessed: process or scope changes, better tooling, automation, training or more people. Decide each request on this evidence, without a standing rule to automate before hiring.",
      },
      {
        id: "s3",
        title: "Adjust the design from operating evidence",
        readTimeMinutes: 1,
        content:
          "Regulated work, specialist decisions, physical operations, incident coverage, accessibility or sustained demand may need a larger or different team. After a change, track workload, quality, incidents, queue age and staff load, and expand, split or recombine when they show strain.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/1",
          cpId: "exercise",
          title: "Team operating boundary",
          scenario:
            "For one team or product surface, record its accountable outcome, users, service obligations, dependencies, decision rights, control duties, workload, skills and capacity signals.",
          rows: 5,
        },
      },
    ],
  },
  {
    id: "orgmodel/2",
    moduleId: "orgmodel",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Combine generalist ownership with specialist review",
    subtitle:
      "Cut handoffs with broad ownership and keep specialist authority where error cost requires it.",
    objective:
      "Cut handoffs with broad ownership and keep specialist authority where error cost requires it.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Broad ownership needs defined limits",
        readTimeMinutes: 1,
        content:
          "A generalist coordinates across domains and uses tools to retrieve context, draft artifacts or run bounded analysis, which cuts handoffs. Tools add no expertise or accountability, so define which decisions the generalist takes and which need a specialist.",
      },
      {
        id: "s2",
        title: "Set specialist checkpoints by risk",
        readTimeMinutes: 1,
        content:
          "Specialists own high-consequence domain decisions, review selected work, investigate novel cases and turn recurring guidance into standards or evaluation criteria. Set their involvement by error cost, novelty, regulation and reversibility, then check that the checkpoint prevents harm without needless queues.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/2",
          cpId: "exercise",
          scenario:
            "Pick two workflows a generalist can own with a specialist checkpoint. Define decision boundary, review trigger, evidence package, response time and escalation owner.",
          rows: 3,
        },
      },
    ],
  },
  {
    id: "orgmodel/3",
    moduleId: "orgmodel",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Shorten approval chains by clarifying authority",
    subtitle:
      "Remove duplicate approvals, keeping expertise, accountability and separation of duties.",
    objective:
      "Remove duplicate approvals, keeping expertise, accountability and separation of duties.",
    durationMinutes: 6,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Map every approval to a purpose",
        readTimeMinutes: 1,
        content:
          "For each approval, record the decision right, risk, required evidence and accountable role. Cut steps that repeat a judgment without adding information or control. Keep approvals that consequence, regulation, independent oversight or separation of duties require.",
      },
      {
        id: "s2",
        title: "Use decision briefs as untrusted aids",
        readTimeMinutes: 1,
        content:
          "A model can assemble a brief of source-linked facts, options, assumptions, risks and open questions. Approvers must be able to open the sources and fix omissions. The brief sets neither the number of approvers nor who is accountable.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "orgmodel/3",
          cpId: "exercise",
          scenario:
            "Map one approval chain with decision right, risk, evidence and accountable role per step. Remove duplicates and mark where a source-linked brief supports the rest.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "orgmodel/4",
    moduleId: "orgmodel",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 6, knowledge check",
    subtitle: "Two questions on capacity and specialist authority.",
    objective: "Two questions on capacity and specialist authority.",
    durationMinutes: 3,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-orgmodel-q1",
        questionText:
          "A team requests additional headcount. What should leadership do first?",
        answerOptions: [
          {
            id: "a",
            text: "Approve the request whenever budget is available.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Reject the request without examining the workload.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Examine workload, bottlenecks and options, then decide on evidence.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Approve only requests for senior positions.",
            isCorrect: false,
          },
        ],
        explanation:
          "Capacity decisions need evidence on demand, service impact, bottlenecks, risk and options, automation among them. Neither budget nor prior automation is a sufficient rule.",
      },
      {
        id: "ano-orgmodel-q2",
        questionText:
          "Where do specialists provide the strongest organizational value?",
        answerOptions: [
          {
            id: "a",
            text: "By taking sole ownership of every execution detail.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "By owning or reviewing high-risk decisions and turning guidance into standards.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "By managing every generalist who uses domain guidance.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "By being removed from workflows once a model is available.",
            isCorrect: false,
          },
        ],
        explanation:
          "Specialists matter most where error cost, novelty or regulation demands deep judgment. They own or review decisions, handle novel cases and make guidance reusable.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
