import type { AiNativeOperatorLesson } from "../types";

export const ENGINEERING_LESSONS: readonly AiNativeOperatorLesson[] = [
  {
    id: "engineering/1",
    moduleId: "engineering",
    lessonNumber: 1,
    number: 1,
    kind: "reading",
    title: "Engineering as controlled delegation",
    subtitle:
      "Separate work that can be delegated from decisions that require engineering ownership.",
    objective:
      "Separate work that can be delegated from decisions that require engineering ownership.",
    durationMinutes: 15,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Classify the task before assigning it",
        readTimeMinutes: 5,
        content:
          "Begin with the change's scope, dependencies, error cost, and available test oracle. A contained refactor with strong tests may be suitable for delegation. An architectural decision, security boundary, unfamiliar migration, or incident response may require direct human analysis or a much narrower model role.",
      },
      {
        id: "s2",
        title: "Use a visible control loop",
        readTimeMinutes: 5,
        content:
          "A controlled delegation has five steps: define the result, constrain the workspace, let the agent produce a change, inspect the diff and evidence, then accept or reject it. The human owner does not merely approve the final screen. They verify assumptions, test behavior, and retain responsibility for the merge.",
      },
      {
        id: "s3",
        title: "Skills that support reliable delegation",
        readTimeMinutes: 5,
        content:
          "Task decomposition, interface design, specification writing, test design, code review, observability, and incident handling all become more important when generation is cheap. These skills define what may change, expose errors, and make the result understandable to the next engineer.",
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
            "Review your last shipped change. Identify what could have been delegated, what required your judgment, which evidence supported the merge, and which uncertainty remained.",
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
      "Write a specification that bounds implementation choices and defines observable acceptance criteria.",
    objective:
      "Write a specification that bounds implementation choices and defines observable acceptance criteria.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A specification reduces ambiguity",
        readTimeMinutes: 7,
        content:
          "Before implementation, state the intended behavior, affected interfaces, constraints, and acceptance evidence. A specification does not guarantee correct code, but it gives both the implementer and reviewer a shared object against which to test the result. If an important decision is unresolved, mark it as unresolved instead of letting the agent infer silently.",
      },
      {
        id: "s2",
        title: "Five useful specification sections",
        readTimeMinutes: 8,
        content:
          "Use five sections: (1) goal, including the user or system outcome; (2) interfaces, such as API contracts, function signatures, data shapes, and permitted files; (3) invariants that must remain true; (4) explicit non-goals and forbidden changes; and (5) test cases with concrete inputs and expected results. Add security, privacy, migration, or rollback requirements when the task needs them.",
      },
      {
        id: "s3",
        title: "Prioritise constraints by risk",
        readTimeMinutes: 7,
        content:
          "Spend specification effort where a wrong implementation could cause harm or be difficult to detect. State boundary conditions, failure behavior, compatibility requirements, and the evidence needed for acceptance. Extra prose is useful only when it removes a real ambiguity; length by itself does not improve a specification.",
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
      "Run independent agent tasks concurrently without creating hidden conflicts or unreviewed changes.",
    objective:
      "Run independent agent tasks concurrently without creating hidden conflicts or unreviewed changes.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelism requires independent boundaries",
        readTimeMinutes: 8,
        content:
          "Several agents can work concurrently only when their scopes, files, data, permissions, and completion criteria are clear. Use separate worktrees or sandboxes, avoid shared mutable resources, and identify dependencies before starting. Parallelising coupled tasks often creates more reconciliation work than it saves.",
      },
      {
        id: "s2",
        title: "A bounded starter pattern",
        readTimeMinutes: 8,
        content:
          "Start with three independent roles: one agent investigates and proposes a fix, one implements a small specified change, and one reviews tests or documentation. Give each role a narrow input and output. A named engineer reviews the artifacts, resolves conflicts, and decides what may proceed.",
      },
      {
        id: "s3",
        title: "Common parallel-work failures",
        readTimeMinutes: 8,
        content:
          "Parallel work fails when agents edit overlapping surfaces, use stale assumptions, exceed their permissions, or produce changes faster than people can review them. Reduce concurrency, narrow the specifications, refresh shared context, and strengthen integration tests. Do not treat a larger agent count as a performance goal.",
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
            "Define three independent agent assignments. Give each a role, scope boundary, expected artifact, and human owner.",
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
          "An evaluation suite checks defined behavior on a known set of cases. It can expose regressions and compare versions, but it does not prove safety outside that set. Combine evaluations with code review, security controls, staged release, monitoring, and incident response according to the task's risk.",
      },
      {
        id: "s2",
        title: "Choose cases from real work and known risk",
        readTimeMinutes: 7,
        content:
          "Build the smallest set that represents important normal cases, boundary conditions, and observed failure modes. Automate scoring where a reliable oracle exists. Use documented human rubrics where judgment is necessary, and measure reviewer agreement when inconsistency would change a release decision.",
      },
      {
        id: "s3",
        title: "Define release and rollback criteria",
        readTimeMinutes: 6,
        content:
          "Run the relevant evaluations after model, prompt, context, tool, or policy changes. Specify which regressions block release, who can approve an exception, what evidence that exception requires, and how to roll back. Record the version and result so an incident can be reconstructed.",
      },
    ],
    callout: {
      kind: "note",
      h: "A useful case taxonomy",
      text: "Group cases into: (1) critical invariants that must pass, (2) representative workload cases, and (3) adversarial or previously observed failures. Track each group separately so an average score cannot hide a critical regression.",
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
            "For one agent workflow, define five cases: three representative and two adversarial. State the input, expected behavior, and scoring method.",
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
      "Check your understanding of delegation boundaries, specifications, parallel work, and release evaluations.",
    objective:
      "Check your understanding of delegation boundaries, specifications, parallel work, and release evaluations.",
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
          "The goal states the required outcome, while test cases provide observable acceptance evidence. Interfaces, invariants, and non-goals remain essential constraints, but length or authorship does not define correctness.",
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
          "A release gate is effective only when failure blocks release or follows a controlled exception process. The exception must have an owner, evidence, a stated residual risk, and a rollback path.",
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
          "Conflicts and low-quality output often indicate coupled scopes, ambiguous requirements, stale context, or weak integration gates. Correct those conditions before changing the model or increasing concurrency.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
