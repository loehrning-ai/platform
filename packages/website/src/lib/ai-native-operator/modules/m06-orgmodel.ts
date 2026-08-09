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
      "Set team shape from the work, service obligations, dependencies, skills, and risk rather than a universal size rule.",
    objective:
      "Set team shape from the work, service obligations, dependencies, skills, and risk rather than a universal size rule.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the operating boundary",
        readTimeMinutes: 7,
        content:
          "Define the outcome a team owns, the users it serves, its service levels, dependencies, decision rights, and control duties. Then identify the workload and skills needed to meet that boundary. Clear ownership can reduce handoffs, but team size still depends on demand, coverage, complexity, and risk.",
      },
      {
        id: "s2",
        title: "Evaluate capacity options explicitly",
        readTimeMinutes: 7,
        content:
          "A capacity request should show current workload, bottlenecks, service impact, control constraints, and options already assessed. Options may include process changes, scope changes, better tooling, automation, training, or additional people. The evidence supports a decision; it does not create a rule that every team must automate before hiring.",
      },
      {
        id: "s3",
        title: "Adjust the design from operating evidence",
        readTimeMinutes: 6,
        content:
          "Larger or differently composed teams may be necessary for regulated work, specialist decisions, physical operations, incident coverage, accessibility, or sustained demand. Track workload, quality, incidents, queue age, and staff load after a change. Expand, split, or recombine the team when those signals show the boundary is not working.",
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
            "Choose one team or product surface. Record its accountable outcome, users, service obligations, dependencies, decision rights, control duties, workload, required skills, and capacity signals.",
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
      "Use broad ownership to reduce handoffs while preserving specialist authority where error cost requires it.",
    objective:
      "Use broad ownership to reduce handoffs while preserving specialist authority where error cost requires it.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Broad ownership needs defined limits",
        readTimeMinutes: 9,
        content:
          "A generalist can coordinate work across several domains and use tools to retrieve context, draft artifacts, or perform bounded analysis. That can reduce handoffs, but a model does not create professional expertise or accountability. Define which decisions the generalist may make and which require specialist ownership or review.",
      },
      {
        id: "s2",
        title: "Set specialist checkpoints by risk",
        readTimeMinutes: 9,
        content:
          "Specialists may own high-consequence domain decisions, review selected work, investigate novel cases, and convert recurring guidance into standards or evaluation criteria. Choose the engagement model from error cost, novelty, regulation, and reversibility. Monitor whether the checkpoint prevents harm without creating an avoidable queue.",
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
            "Identify two workflows where a generalist can hold primary ownership with a specialist checkpoint. Define the decision boundary, review trigger, evidence package, response time, and escalation owner.",
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
      "Remove duplicate approvals while preserving required expertise, accountability, and separation of duties.",
    objective:
      "Remove duplicate approvals while preserving required expertise, accountability, and separation of duties.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Map every approval to a purpose",
        readTimeMinutes: 7,
        content:
          "For each approval, record the decision right, risk addressed, evidence required, and accountable role. Remove steps that repeat the same judgment without adding information or control. Keep approvals required by consequence, regulation, independent oversight, or separation of duties.",
      },
      {
        id: "s2",
        title: "Use decision briefs as untrusted aids",
        readTimeMinutes: 7,
        content:
          "A model can assemble a brief containing source-linked facts, options, assumptions, risks, and open questions. Approvers must be able to inspect the sources and correct omissions. The brief does not decide how many approvers are required, and it does not transfer accountability from the humans who hold the decision rights.",
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
            "Map one approval chain. For each step, record its decision right, risk, evidence, and accountable role. Remove duplicate steps and define where a source-linked decision brief supports the remaining approvers.",
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
    title: "Module 6 knowledge check",
    subtitle: "Check the organizational controls from this module.",
    objective: "Check the organizational controls from this module.",
    durationMinutes: 8,
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
            text: "Examine workload, service levels, bottlenecks, controls, and capacity options, then decide from the evidence.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Approve only requests for senior positions.",
            isCorrect: false,
          },
        ],
        explanation:
          "A capacity decision needs evidence about demand, service impact, bottlenecks, risk, and feasible options. Automation may be one option, but neither budget availability nor proof of prior automation is a sufficient rule for approving or rejecting people.",
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
            text: "By owning or reviewing high-risk domain decisions and turning recurring guidance into reusable standards.",
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
          "Specialists are most valuable where error cost, novelty, or regulation requires deep judgment. They may own the decision, review bounded work, handle novel cases, and make recurring guidance reusable. Their role follows the risk, not a universal advisor-only model.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
