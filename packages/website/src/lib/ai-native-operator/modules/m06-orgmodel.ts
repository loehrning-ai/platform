// Ported verbatim from course-data.js's MODULES[5] ("orgmodel", M06).
import type { AiNativeOperatorLesson } from "../types";

export const ORGMODEL_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "orgmodel/1",
    moduleId: "orgmodel",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: 'The "two-pizza + agents" team',
    subtitle: "Cap human team size and force scaling through agents instead of headcount.",
    objective: "Cap human team size and force scaling through agents instead of headcount.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The shape that wins",
        readTimeMinutes: 7,
        content:
          "The classical 30-person product team — PM, designer, eng, data, ops, marketing, support — is over for most surfaces. Two to four humans plus a fleet of agents will own a full product surface. The handoff chain compresses to nearly nothing. Decisions move in hours, not quarters.",
      },
      {
        id: "s2",
        title: "How to enforce the cap",
        readTimeMinutes: 7,
        content:
          'A cap is only real if leadership enforces it. The discipline: when a team asks for more headcount, the answer is "show me what you tried with agents first." This is not a cost-saving measure dressed up. It is a forcing function for AI-native operating.',
      },
      {
        id: "s3",
        title: "When the cap is wrong",
        readTimeMinutes: 6,
        content:
          "Some surfaces still require larger teams — physical product, regulated industries, deeply specialized domains. Be honest about which is which. The cap is a default, not a dogma.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "orgmodel/2",
    moduleId: "orgmodel",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Generalists over specialists",
    subtitle:
      "Hire and promote T-shaped generalists who use agents to fill gaps; treat specialists as advisors.",
    objective:
      "Hire and promote T-shaped generalists who use agents to fill gaps; treat specialists as advisors.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The cost of specialization",
        readTimeMinutes: 9,
        content:
          "Deep specialization made sense when the cost of context-switching was high and the cost of expertise was low. AI inverts this: context is cheap (the agent has it), expertise is expensive (the human has it). The generalist who can wield three specialists' worth of agents beats three specialists in handoff hell.",
      },
      {
        id: "s2",
        title: "When specialists still matter",
        readTimeMinutes: 9,
        content:
          "For genuinely deep, novel work — frontier research, regulatory design, architecture-defining decisions. Treat specialists as advisors and reviewers, not owners of execution. They scale through their judgment, not their hours.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "orgmodel/3",
    moduleId: "orgmodel",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Flatten approval chains",
    subtitle: "Cap any decision at two human approvals. Agents do prep, summary, risk; humans decide.",
    objective: "Cap any decision at two human approvals. Agents do prep, summary, risk; humans decide.",
    durationMinutes: 14,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The chain that kills",
        readTimeMinutes: 7,
        content:
          "Five-approver decisions are a tax on speed. Each link adds delay, adds politics, adds risk-aversion. The chain exists because, historically, no one approver had time to absorb full context. AI removes that excuse.",
      },
      {
        id: "s2",
        title: "The two-approver default",
        readTimeMinutes: 7,
        content:
          "For most decisions, two humans are enough: the directly responsible owner and one accountable senior. Both get a full agent-prepared briefing — risks, options, recommended path. They decide in minutes.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "orgmodel/4",
    moduleId: "orgmodel",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 6 — knowledge check",
    subtitle: "Org primitives, locked.",
    objective: "Org primitives, locked.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-orgmodel-q1",
        questionText: "A team requests +5 headcount. AI-native leadership response is:",
        answerOptions: [
          { id: "a", text: "Approve if budget exists.", isCorrect: false },
          { id: "b", text: "Deny outright.", isCorrect: false },
          { id: "c", text: '"Show me what you tried with agents first."', isCorrect: true },
          { id: "d", text: "Approve only senior hires.", isCorrect: false },
        ],
        explanation:
          "\"Show me what you tried with agents first\" turns a headcount request into a forcing function: it makes teams demonstrate they've actually pushed on agentic leverage before adding humans, rather than defaulting to hiring as the first lever. Approving on budget alone or denying outright both skip that diagnostic step.",
      },
      {
        id: "ano-orgmodel-q2",
        questionText: "Specialists are most useful in an AI-native org as:",
        answerOptions: [
          { id: "a", text: "Deep individual contributors who own execution.", isCorrect: false },
          { id: "b", text: "Advisors and reviewers who scale through judgment.", isCorrect: true },
          { id: "c", text: "Managers of generalists.", isCorrect: false },
          { id: "d", text: "Eliminated entirely.", isCorrect: false },
        ],
        explanation:
          "In an AI-native org, specialists earn their leverage as advisors and reviewers whose judgment scales across many decisions, not as the sole owners of hands-on execution — that work increasingly routes through generalists wielding agents. Treating specialists as bottlenecked individual executors wastes the part of their value that actually compounds.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
