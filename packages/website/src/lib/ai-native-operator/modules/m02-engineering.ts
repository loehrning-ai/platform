import type { AiNativeOperatorLesson } from "../types";

export const ENGINEERING_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "engineering/1",
    moduleId: "engineering",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Engineering as controlled delegation",
    subtitle: "Separate delegable work from decisions an engineer must own.",
    objective: "Separate delegable work from decisions an engineer must own.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Classify the task before assigning it",
        readTimeMinutes: 5,
        content:
          "Two tickets, one morning. A contained refactor behind a strong test suite, and a migration nobody here has run. Start with scope, dependencies, error cost, and the available test oracle. The refactor may be safe to delegate. An architectural decision, a security boundary, an unfamiliar migration, or an incident needs human analysis or a much narrower model role.",
      },
      {
        id: "s2",
        title: "Use a visible control loop",
        readTimeMinutes: 5,
        content:
          "Controlled delegation runs in five steps. Define the result, constrain the workspace, let the agent produce a change, inspect the diff and evidence, accept or reject. The owner does more than approve a final screen. They check assumptions, test behavior, and carry the merge.",
      },
      {
        id: "s3",
        title: "Skills that support reliable delegation",
        readTimeMinutes: 5,
        content:
          "When generation is cheap, the scarce skills shift. Task decomposition, interface design, specification writing, test design, code review, observability, incident handling. Those decide what may change, expose errors, and leave a result the next engineer can read.",
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
            "Take your last shipped change. Name what could have been delegated, what needed your judgment, which evidence supported the merge, and what uncertainty remained.",
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
    title: "Specification-first development",
    subtitle:
      "Write a specification that bounds implementation choices and states observable acceptance criteria.",
    objective:
      "Write a specification that bounds implementation choices and states observable acceptance criteria.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A specification reduces ambiguity",
        readTimeMinutes: 7,
        content:
          "Before anyone implements, state the intended behavior, the affected interfaces, the constraints, and the acceptance evidence. A specification guarantees nothing about correctness. It gives the implementer and the reviewer one shared object to test the result against. Where a decision is still open, write that down instead of letting the agent guess.",
      },
      {
        id: "s2",
        title: "Five useful specification sections",
        readTimeMinutes: 8,
        content:
          "Five sections carry most of the weight: (1) goal, including the user or system outcome; (2) interfaces, such as API contracts, function signatures, data shapes, and permitted files; (3) invariants that must remain true; (4) explicit non-goals and forbidden changes; and (5) test cases with concrete inputs and expected results. Add security, privacy, migration, or rollback requirements when the task needs them.",
      },
      {
        id: "s3",
        title: "Prioritise constraints by risk",
        readTimeMinutes: 7,
        content:
          "Spend specification effort where a wrong implementation would do harm or slip past a reviewer. State boundary conditions, failure behavior, compatibility requirements, and the evidence acceptance needs. Extra prose helps only when it removes a real ambiguity. Length improves nothing on its own.",
      },
    ],
    callout: {
      kind: "spec",
      h: "Example: an implementable specification",
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
          title: "Specification builder",
          scenario:
            "Write a five-section specification for a real backlog item. Include at least one invariant, one non-goal, and one failure-path test.",
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
    title: "Parallel work with isolation",
    subtitle:
      "Run independent agent tasks concurrently without hidden conflicts or unreviewed changes.",
    objective:
      "Run independent agent tasks concurrently without hidden conflicts or unreviewed changes.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelism requires independent boundaries",
        readTimeMinutes: 8,
        content:
          "Several agents work at once only when their scopes, files, data, permissions, and completion criteria are clear. Separate worktrees or sandboxes. No shared mutable resources. Dependencies identified before anything starts. Parallelise coupled tasks and the reconciliation usually costs more than the parallelism saved.",
      },
      {
        id: "s2",
        title: "A bounded starter pattern",
        readTimeMinutes: 8,
        content:
          "Start with three independent roles. One agent investigates and proposes a fix, one implements a small specified change, one reviews tests or documentation. Each gets a narrow input and a narrow output. A named engineer reviews the artifacts, resolves conflicts, and decides what may proceed.",
      },
      {
        id: "s3",
        title: "Common parallel-work failures",
        readTimeMinutes: 8,
        content:
          "Parallel work breaks when agents edit overlapping surfaces, work from stale assumptions, exceed their permissions, or produce changes faster than anyone can review them. Cut concurrency, narrow the specifications, refresh shared context, strengthen integration tests. A larger agent count is not a performance goal.",
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
          title: "Your starter work queue",
          scenario:
            "Define three independent agent assignments. Give each a role, a scope boundary, an artifact, and a human owner.",
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
    title: "Evaluations as a release control",
    subtitle:
      "Use representative cases, regression checks, and explicit release criteria for agent changes.",
    objective:
      "Use representative cases, regression checks, and explicit release criteria for agent changes.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Evaluations provide bounded evidence",
        readTimeMinutes: 7,
        content:
          "An evaluation suite checks defined behavior on a known set of cases. It exposes regressions and compares versions. It proves nothing outside that set. Pair it with code review, security controls, staged release, monitoring, and incident response, scaled to the task's risk.",
      },
      {
        id: "s2",
        title: "Choose cases from real work and known risk",
        readTimeMinutes: 7,
        content:
          "Build the smallest set that covers important normal cases, boundary conditions, and failure modes you have seen. Automate scoring wherever a reliable oracle exists. Where judgment is unavoidable, use a documented human rubric and measure reviewer agreement when disagreement would change a release decision.",
      },
      {
        id: "s3",
        title: "Define release and rollback criteria",
        readTimeMinutes: 6,
        content:
          "Run the relevant evaluations after any model, prompt, context, tool, or policy change. Say which regressions block a release, who may approve an exception, what evidence it requires, and how rollback works. Record the version and result so an incident can be reconstructed.",
      },
    ],
    callout: {
      kind: "note",
      h: "A useful case taxonomy",
      text: "Group the cases into: (1) critical invariants that must pass, (2) representative workload cases, and (3) adversarial or previously observed failures. Track each group separately so an average score cannot hide a critical regression.",
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
          title: "Evaluation cases",
          scenario:
            "For one agent workflow, define five cases. Three representative, two adversarial. State the input, expected behavior, and scoring method for each.",
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
    subtitle:
      "Check what holds from delegation boundaries, specifications, parallel work, and release evaluations.",
    objective:
      "Check what holds from delegation boundaries, specifications, parallel work, and release evaluations.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText:
          "Which parts of a specification most directly define the intended result and how it will be accepted?",
        answerOptions: [
          {
            id: "a",
            text: "The goal and the test cases.",
            isCorrect: true,
          },
          {
            id: "b",
            text: "The longest explanatory paragraph.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "The list of available models.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "The author name and timestamp.",
            isCorrect: false,
          },
        ],
        explanation:
          "The goal states the required outcome. The test cases supply observable acceptance evidence. Interfaces, invariants, and non-goals stay essential, but neither length nor authorship defines correctness.",
      },
      {
        id: "ano-engineering-q2",
        questionText:
          "A high-impact agent change has not passed its required evaluation gate. What should happen?",
        answerOptions: [
          {
            id: "a",
            text: "Release it because evaluations reduce delivery speed.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Block the release unless the documented exception owner reviews evidence and accepts the residual risk.",
            isCorrect: true,
          },
          {
            id: "c",
            text: "Run the evaluation only after a user reports a problem.",
            isCorrect: false,
          },
          {
            id: "d",
            text: "Merge it and leave an informal comment for later.",
            isCorrect: false,
          },
        ],
        explanation:
          "A release gate works only when failure blocks the release or routes into a controlled exception process. That exception needs an owner, evidence, a stated residual risk, and a rollback path.",
      },
      {
        id: "ano-engineering-q3",
        questionText:
          "Three parallel agents produce conflicting, low-quality changes. Which response addresses the workflow first?",
        answerOptions: [
          {
            id: "a",
            text: "Replace every model without examining the assignments.",
            isCorrect: false,
          },
          {
            id: "b",
            text: "Increase concurrency so more alternatives are available.",
            isCorrect: false,
          },
          {
            id: "c",
            text: "Reduce overlap, tighten specifications, refresh context, and strengthen integration checks.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Merge all changes and resolve failures in production.",
            isCorrect: false,
          },
        ],
        explanation:
          "Conflicts and weak output usually point at coupled scopes, ambiguous requirements, stale context, or weak integration gates. Fix those conditions before you change the model or add concurrency.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
