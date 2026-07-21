// Ported verbatim from course-data.js's MODULES[7] ("governance", M08).
import type { AiNativeOperatorLesson } from "../types";

export const GOVERNANCE_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "governance/1",
    moduleId: "governance",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "The model registry",
    subtitle: "Track every model, where it runs, what data it sees, and who approved it.",
    objective: "Track every model, where it runs, what data it sees, and who approved it.",
    durationMinutes: 18,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why a registry exists",
        readTimeMinutes: 9,
        content:
          'Without a registry, you cannot answer the question "which models are running on which data right now?" — and that question gets asked the day you have an incident, a regulator, or an audit. The registry is the boring foundation that makes everything else possible.',
      },
      {
        id: "s2",
        title: "What the registry tracks",
        readTimeMinutes: 9,
        content:
          "For each model: provider, version, intended use case, data classification approved, permitted tools, owner, last review date, eval scores. Nothing exotic — just the facts, in one place, kept current.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "governance/2",
    moduleId: "governance",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Eval-driven release",
    subtitle: "Treat models like services. No release without passing the eval suite. Block regressions automatically.",
    objective:
      "Treat models like services. No release without passing the eval suite. Block regressions automatically.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The release gate",
        readTimeMinutes: 12,
        content:
          "Every model change — provider swap, version bump, prompt edit, tool addition — must pass a defined eval suite before reaching production. Regressions block. The system enforces, not the human memory.",
      },
      {
        id: "s2",
        title: "The discipline pays",
        readTimeMinutes: 12,
        content:
          "In year one, the suite catches a few embarrassments and you mostly grumble at the friction. In year two, it catches a near-disaster and the grumbling stops forever. The teams that scale agentic systems have this gate; the teams that get burned do not.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "governance/3",
    moduleId: "governance",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Agent identity and audit",
    subtitle: "Every agent has an identity. Permissions, audit, and accountability — same as a human user.",
    objective: "Every agent has an identity. Permissions, audit, and accountability — same as a human user.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why identity matters",
        readTimeMinutes: 10,
        content:
          "When an agent takes an action — sends an email, opens a PR, deletes a record — you must be able to answer: which agent, on whose behalf, with what authorization. Without identity, the audit log is a story you tell yourself. With it, you have ground truth.",
      },
      {
        id: "s2",
        title: "Implementing it",
        readTimeMinutes: 10,
        content:
          "Agents are first-class principals in your identity provider. Every action is logged with agent ID + on-behalf-of-user. Permissions are explicit, scoped, time-limited. Reviews happen on a cadence.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [],
  },
  {
    id: "governance/4",
    moduleId: "governance",
    lessonNumber: 4,
    number: 4,
    kind: "quiz",
    title: "Module 8 — knowledge check",
    subtitle: "Lock governance basics.",
    objective: "Lock governance basics.",
    durationMinutes: 8,
    keyConcepts: [],
    quiz: [],
    sections: [],
    widgets: [],
  },
];
