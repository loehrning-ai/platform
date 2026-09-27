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
          "Check scope, dependencies, error cost and the test oracle first. A contained refactor behind strong tests may be delegable. An architectural decision, security boundary, unfamiliar migration or incident needs human analysis or a much narrower model role.",
      },
      {
        id: "s2",
        title: "Use a visible control loop",
        readTimeMinutes: 5,
        content:
          "Define the result, constrain the workspace, let the agent produce a change, inspect the diff and evidence, then accept or reject. The owner checks assumptions and behavior and stays accountable for the merge.",
      },
      {
        id: "s3",
        title: "Skills that support reliable delegation",
        readTimeMinutes: 5,
        content:
          "With cheap generation, the scarce skills are task decomposition, interface design, specification, test design, code review, observability and incident handling. They limit changes, expose errors and keep results readable.",
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
            "Take your last shipped change. Note what was delegable, what needed your judgment, which evidence supported the merge and what uncertainty remained.",
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
      "Bound implementation choices and state observable acceptance criteria.",
    objective:
      "Bound implementation choices and state observable acceptance criteria.",
    durationMinutes: 22,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "A specification reduces ambiguity",
        readTimeMinutes: 7,
        content:
          "Before implementation, state intended behavior, affected interfaces, constraints and acceptance evidence. This gives implementer and reviewer one standard, though no guarantee of correct code. Write down open decisions so the agent does not guess.",
      },
      {
        id: "s2",
        title: "Five useful specification sections",
        readTimeMinutes: 8,
        content:
          "(1) Goal with the user or system outcome; (2) interfaces such as API contracts, function signatures, data shapes and permitted files; (3) invariants; (4) non-goals and forbidden changes; (5) test cases with inputs and expected results. Add security, privacy, migration or rollback as needed.",
      },
      {
        id: "s3",
        title: "Prioritise constraints by risk",
        readTimeMinutes: 7,
        content:
          "Specify most where a wrong implementation would do harm or slip past review: boundary conditions, failure behavior, compatibility and required acceptance evidence. Add prose only to remove a real ambiguity.",
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
            "Write a five-section specification for a real backlog item, with at least one invariant, one non-goal and one failure-path test.",
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
      "Run independent agent tasks at once without hidden conflicts.",
    objective:
      "Run independent agent tasks at once without hidden conflicts.",
    durationMinutes: 24,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Parallelism requires independent boundaries",
        readTimeMinutes: 8,
        content:
          "Run agents in parallel only with clear scope, files, data, permissions and completion criteria for each. Use separate worktrees or sandboxes, share no mutable resources and map dependencies first; coupled tasks cost more to reconcile than they save.",
      },
      {
        id: "s2",
        title: "A bounded starter pattern",
        readTimeMinutes: 8,
        content:
          "Start with three roles: one agent investigates and proposes a fix, one implements a small specified change, one reviews tests or documentation. A named engineer reviews the artifacts, resolves conflicts and decides what proceeds.",
      },
      {
        id: "s3",
        title: "Common parallel-work failures",
        readTimeMinutes: 8,
        content:
          "Parallel work breaks when agents edit overlapping areas, act on stale assumptions, exceed permissions or produce changes faster than anyone can review. Then cut concurrency, narrow specifications, refresh shared context and strengthen integration tests.",
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
            "Define three independent agent assignments, each with a role, scope boundary, artifact and human owner.",
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
      "Gate agent changes with representative cases, regression checks and release criteria.",
    objective:
      "Gate agent changes with representative cases, regression checks and release criteria.",
    durationMinutes: 20,
    keyConcepts: [],
    quiz: [],
    sections: [
      {
        id: "s1",
        title: "Evaluations provide bounded evidence",
        readTimeMinutes: 7,
        content:
          "An evaluation suite checks defined behavior on known cases, exposes regressions and compares versions. It proves nothing outside that set. Add code review, security controls, staged release, monitoring and incident response by risk.",
      },
      {
        id: "s2",
        title: "Choose cases from real work and known risk",
        readTimeMinutes: 7,
        content:
          "Cover key normal cases, boundary conditions and observed failure modes with the smallest set. Automate scoring where a reliable oracle exists; otherwise use a written rubric and measure reviewer agreement when it could change a release.",
      },
      {
        id: "s3",
        title: "Define release and rollback criteria",
        readTimeMinutes: 6,
        content:
          "Rerun relevant evaluations after any model, prompt, context, tool or policy change. Define which regressions block release, who approves exceptions on what evidence and how rollback works, and record version and result.",
      },
    ],
    callout: {
      kind: "note",
      h: "A useful case taxonomy",
      text: "Group cases into (1) critical invariants that must pass, (2) representative workload cases and (3) adversarial or previously seen failures. Score each group separately so an average cannot hide a critical regression.",
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
            "Define five cases for one agent workflow: three representative and two adversarial, each with input, expected behavior and scoring method.",
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
      "Three questions on delegation, specifications, parallel work and release evaluations.",
    objective:
      "Three questions on delegation, specifications, parallel work and release evaluations.",
    durationMinutes: 9,
    keyConcepts: [],
    quiz: [
      {
        id: "ano-engineering-q1",
        questionText:
          "Which parts of a specification most directly define the intended result and its acceptance?",
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
          "The goal states the required outcome and the test cases make acceptance observable. Interfaces, invariants and non-goals matter too, but length and authorship define nothing.",
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
            text: "Block it unless the exception owner reviews evidence and accepts the risk.",
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
          "A gate works only when failure blocks release or triggers a controlled exception. The exception needs an owner, evidence, a stated residual risk and a rollback path.",
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
            text: "Reduce overlap, tighten specs, refresh context, strengthen integration checks.",
            isCorrect: true,
          },
          {
            id: "d",
            text: "Merge all changes and resolve failures in production.",
            isCorrect: false,
          },
        ],
        explanation:
          "Conflicts and weak output usually come from coupled scopes, vague requirements, stale context or weak integration gates. Fix those before changing the model or adding agents.",
      },
    ],
    sections: [],
    widgets: [],
  },
];
