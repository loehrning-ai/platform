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
      "Set team shape from the work, service obligations, dependencies, skills, and risk. Not from a universal size rule.",
    objective:
      "Set team shape from the work, service obligations, dependencies, skills, and risk. Not from a universal size rule.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Start with the operating boundary",
        readTimeMinutes: 7,
        content:
          "Team size is not a philosophy. Define the outcome a team owns, the users it serves, its service levels, dependencies, decision rights, and control duties. Then work out the workload and skills that boundary needs. Clear ownership cuts handoffs. Size still follows demand, coverage, complexity, and risk.",
      },
      {
        id: "s2",
        title: "Evaluate capacity options explicitly",
        readTimeMinutes: 7,
        content:
          "A capacity request shows the current workload, the bottlenecks, the service impact, the control constraints, and the options already assessed. Process changes, scope changes, better tooling, automation, training, more people. The evidence supports one decision. It does not create a rule that every team automates before it hires.",
      },
      {
        id: "s3",
        title: "Adjust the design from operating evidence",
        readTimeMinutes: 6,
        content:
          "Regulated work, specialist decisions, physical operations, incident coverage, accessibility, or sustained demand may need a larger or differently composed team. Track workload, quality, incidents, queue age, and staff load after a change. Expand, split, or recombine when those signals say the boundary is not working.",
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
          "A generalist can coordinate across several domains and use tools to retrieve context, draft artifacts, or run bounded analysis. That cuts handoffs. It does not manufacture professional expertise, and it does not manufacture accountability. Define which decisions the generalist may take, and which need specialist ownership or review.",
      },
      {
        id: "s2",
        title: "Set specialist checkpoints by risk",
        readTimeMinutes: 9,
        content:
          "Specialists own high-consequence domain decisions, review selected work, investigate novel cases, and turn recurring guidance into standards or evaluation criteria. Pick the engagement model from error cost, novelty, regulation, and reversibility. Then watch whether the checkpoint prevents harm without an avoidable queue.",
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
          "For each approval, record the decision right, the risk addressed, the evidence required, and the accountable role. Cut the steps that repeat a judgment without adding information or control. Keep the approvals that consequence, regulation, independent oversight, or separation of duties requires.",
      },
      {
        id: "s2",
        title: "Use decision briefs as untrusted aids",
        readTimeMinutes: 7,
        content:
          "A model can assemble a brief of source-linked facts, options, assumptions, risks, and open questions. Approvers must be able to open the sources and correct omissions. The brief decides nothing about how many approvers are needed, and it moves no accountability away from the people holding the decision rights.",
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
    subtitle: "Two questions on capacity and specialist authority.",
    objective: "Two questions on capacity and specialist authority.",
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
          "A capacity decision needs evidence on demand, service impact, bottlenecks, risk, and feasible options. Automation is one of them. Neither an available budget nor proof of prior automation is a sufficient rule for approving or rejecting people.",
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
          "Specialists earn their place where error cost, novelty, or regulation demands deep judgment. They may own the decision, review bounded work, handle novel cases, and make recurring guidance reusable. Their role follows the risk, not a universal advisor-only model.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
