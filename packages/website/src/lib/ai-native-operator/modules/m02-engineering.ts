// Ported verbatim from course-data.js's MODULES[1] ("engineering", M02).
import type { AiNativeOperatorLesson } from "../types";

export const ENGINEERING_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "engineering/1",
    moduleId: "engineering",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "From keystroke to delegation",
    subtitle:
      "Internalize the shift in what an engineer's day looks like, and where the leverage now lives.",
    objective:
      "Internalize the shift in what an engineer's day looks like, and where the leverage now lives.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The old day",
        readTimeMinutes: 5,
        content:
          "A senior engineer in 2022 wrote ~50 lines of production code per day, hand-typed in an IDE. They read Stack Overflow. They debugged by print statement. They reviewed peers' PRs by reading every line. The work was honest and the work was slow.",
      },
      {
        id: "s2",
        title: "The new day",
        readTimeMinutes: 5,
        content:
          "A senior engineer in 2026 ships 5-10 PRs per day, all reviewed and tested. Agents draft them while she sleeps. She wakes, reviews the morning batch, pushes one tweak per PR, and approves. Her afternoons are spent on the harder problems, system design, evals, the things that truly need her judgment. She works fewer hours and ships more.",
      },
      {
        id: "s3",
        title: "The skills that suddenly matter more",
        readTimeMinutes: 5,
        content:
          "Spec writing. Eval design. Code review at scale. System architecture. Debugging an agent's reasoning, not just its output. These were always senior skills, they are now also junior skills, because juniors who do not have them never become senior in the new world.",
      },
    ],
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/1",
          cpId: "exercise",
          scenario:
            "For your last shipped PR or feature: how much of it could a competent agent have done if you had given it the right spec? Be honest.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "engineering/2",
    moduleId: "engineering",
    lessonNumber: 2,
    number: 2,
    kind: "reading",
    title: "Spec-first development",
    subtitle:
      "Learn to write a spec an agent can implement, with enough constraint to be correct, enough freedom to be useful.",
    objective:
      "Learn to write a spec an agent can implement, with enough constraint to be correct, enough freedom to be useful.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A spec is the new code",
        readTimeMinutes: 7,
        content:
          "In 2026 you do not start by writing code. You start by writing a spec the agent can implement. The spec describes the goal, the interfaces, the constraints, and the test cases. The code is downstream. If the spec is good, the code is good. If the spec is sloppy, no model on earth saves you.",
      },
      {
        id: "s2",
        title: "Anatomy of a good agent spec",
        readTimeMinutes: 8,
        content:
          "A useful spec has five sections: (1) the goal in one sentence; (2) the interfaces, function signatures, API contracts, file paths it can touch; (3) the invariants that must hold; (4) the explicit non-goals, what NOT to do; (5) the test cases, concrete inputs and expected outputs. Most spec failures come from skipping (3) and (4).",
      },
      {
        id: "s3",
        title: "The 80/20 rule for specs",
        readTimeMinutes: 7,
        content:
          "Spend 80% of your effort on the parts of the spec that constrain the search space. The opening sentence and the test cases do almost all the work. Long prose in the middle is mostly decoration, and sometimes worse than nothing, because it gives the agent license to drift.",
      },
    ],
    callout: {
      kind: "spec",
      h: "Example: a spec the agent can implement",
      lines: [
        "# Goal",
        "Add idempotency to the /api/orders POST endpoint via an Idempotency-Key header.",
        "",
        "# Interfaces",
        "- File: services/orders/handler.go",
        "- Header: Idempotency-Key (UUID)",
        '- Storage: existing redis client; key prefix "idem:orders:"',
        "",
        "# Invariants",
        "- Same Idempotency-Key + same body within 24h returns the original response.",
        "- Same key + different body returns 409.",
        "",
        "# Non-goals",
        "- Do NOT touch /api/payments. Do NOT change the response shape.",
        "",
        "# Tests",
        "- Test: replay returns same OrderID",
        "- Test: replay with mutated body returns 409",
        "- Test: TTL of 24h enforced",
      ],
    },
    exerciseKind: "reflect-box",
    widgets: [
      {
        kind: "reflect-box",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/2",
          cpId: "exercise",
          title: "Spec Builder",
          scenario: "Write a 5-section spec for a real ticket on your backlog. Use the structure above.",
          rows: 4,
        },
      },
    ],
  },
  {
    id: "engineering/3",
    moduleId: "engineering",
    lessonNumber: 3,
    number: 3,
    kind: "reading",
    title: "Background agent fleets",
    subtitle:
      'Move from "one agent at a time" to "three to five agents working in parallel while you orchestrate."',
    objective:
      'Move from "one agent at a time" to "three to five agents working in parallel while you orchestrate."',
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "The mental model",
        readTimeMinutes: 8,
        content:
          'A fleet is not "lots of windows open." A fleet is a small number of specialized agents, each with a clear role, running in parallel against well-bounded specs. You are the conductor, you assign, you check in, you redirect. You are not in the IDE; you are above the IDE.',
      },
      {
        id: "s2",
        title: "A starter fleet",
        readTimeMinutes: 8,
        content:
          "Three agents are usually enough to start. Agent A handles the bug backlog overnight, working through tickets one at a time. Agent B handles small feature work from the spec inbox. Agent C handles refactors, cleanups, and dependency upgrades, the work that always slips. You spend ~30 minutes each morning reviewing what they did.",
      },
      {
        id: "s3",
        title: "When fleets break",
        readTimeMinutes: 8,
        content:
          "Fleets break when the specs are bad, the context is shallow, or the eval gates are missing. They also break when the human tries to micromanage, defeating the purpose. The fix is almost always upstream: tighten the spec, deepen the context, raise the eval bar.",
      },
    ],
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/3",
          cpId: "exercise",
          title: "Your Starter Fleet",
          scenario:
            "Design your starter fleet. Three agents, each with a one-sentence role and a typical task type.",
          placeholders: ["Agent A, role", "Agent B, role", "Agent C, role"],
        },
      },
    ],
  },
  {
    id: "engineering/4",
    moduleId: "engineering",
    lessonNumber: 4,
    number: 4,
    kind: "reading",
    title: "Evals: the only thing keeping you safe",
    subtitle:
      "Treat your agents like services. Build evals. Track regressions. Pin versions. Roll back when they get worse.",
    objective:
      "Treat your agents like services. Build evals. Track regressions. Pin versions. Roll back when they get worse.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Why evals are non-negotiable",
        readTimeMinutes: 7,
        content:
          "An agent without an eval suite is a service without monitoring. It works until it doesn't, and you find out from the customer. The teams that scale agentic workflows are the ones that built the eval suite first. The teams that didn't are the ones telling cautionary tales at conferences.",
      },
      {
        id: "s2",
        title: "What to measure",
        readTimeMinutes: 7,
        content:
          "For each agent, define a small, expensive, high-signal eval set: 30–100 tasks that represent the real distribution of work. Score automatically where you can; score with human judgment where you must. Run on every model upgrade, every prompt change, every tool addition.",
      },
      {
        id: "s3",
        title: "The eval-driven release",
        readTimeMinutes: 6,
        content:
          "No agent change ships without passing the eval suite. Regressions block. The discipline feels heavy until the day it saves you, and then you never give it up.",
      },
    ],
    callout: {
      kind: "note",
      h: "A useful starting taxonomy",
      text: "Group your eval cases by: (1) golden, must always pass, (2) typical, represent the real workload, (3) adversarial, known failure modes you have seen in prod. Track scores per group; a regression in any one is a release blocker.",
    },
    exerciseKind: "slot-fill",
    widgets: [
      {
        kind: "slot-fill",
        placement: "end",
        courseSlug: "ai-native-operator",
        props: {
          lessonId: "engineering/4",
          cpId: "exercise",
          title: "Eval Test Cases",
          scenario:
            "For one of your agents, list five test cases, three typical, two adversarial. Be specific about input and expected output.",
          placeholders: [
            "Test case 1 (typical)",
            "Test case 2 (typical)",
            "Test case 3 (typical)",
            "Test case 4 (adversarial)",
            "Test case 5 (adversarial)",
          ],
        },
      },
    ],
  },
  {
    id: "engineering/5",
    moduleId: "engineering",
    lessonNumber: 5,
    number: 5,
    kind: "quiz",
    title: "Module 2, knowledge check",
    subtitle: "Confirm engineering primitives are clear before you scale them.",
    objective: "Confirm engineering primitives are clear before you scale them.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText: "What is the most important section of an agent spec?",
        answerOptions: [
          { id: "a", text: "The opening sentence and the test cases", isCorrect: true },
          { id: "b", text: "The middle prose explaining context", isCorrect: false },
          { id: "c", text: "The list of files", isCorrect: false },
          { id: "d", text: "The author and timestamp", isCorrect: false },
        ],
        explanation:
          "The opening sentence and the test cases constrain the search space the most: the sentence sets the goal the agent optimizes for, and the test cases pin down exactly what \"correct\" means. Long explanatory prose in the middle does comparatively little work and can even invite drift if it's vague.",
      },
      {
        id: "ano-engineering-q2",
        questionText:
          "A teammate ships an agent change without running the eval suite. What is the right response?",
        answerOptions: [
          { id: "a", text: "Allow it; evals slow things down.", isCorrect: false },
          {
            id: "b",
            text: "Block the change. Eval-driven release is the discipline that lets you go fast safely.",
            isCorrect: true,
          },
          { id: "c", text: "Run the eval after merge.", isCorrect: false },
          { id: "d", text: "Add a comment to the PR but merge anyway.", isCorrect: false },
        ],
        explanation:
          "Eval-driven release means no agent change reaches production without passing the suite, regressions are a hard block, enforced by the system rather than relying on someone remembering to check. Skipping the gate \"just this once\" is exactly how a model upgrade or prompt tweak silently breaks a workflow nobody is watching.",
      },
      {
        id: "ano-engineering-q3",
        questionText:
          "Your fleet of three agents is producing low-quality PRs. What is the most likely cause?",
        answerOptions: [
          { id: "a", text: "The agents need to be replaced with newer models.", isCorrect: false },
          { id: "b", text: "You are micromanaging.", isCorrect: false },
          {
            id: "c",
            text: "The specs are bad, the context is shallow, or the eval gates are missing.",
            isCorrect: true,
          },
          { id: "d", text: "Agents fundamentally cannot do this work.", isCorrect: false },
        ],
        explanation:
          "Low-quality PRs from a fleet almost always trace upstream to the inputs the fleet was given: vague specs, shallow context, or missing eval gates. Swapping models or micromanaging treats the symptom; tightening the spec, deepening the context, and raising the eval bar treats the cause.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
