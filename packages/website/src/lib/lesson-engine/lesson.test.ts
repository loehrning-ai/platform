import { describe, expect, it } from "vitest";
import type { BaseLesson } from "@/lib/course/types";
import {
  countWords,
  engineLessonProgressStepIds,
  isEngineLesson,
  projectEngineLesson,
  validateEngineLesson,
} from "./lesson";
import { validateExerciseProps } from "./validate-exercise";

function lesson(overrides: Partial<BaseLesson> = {}): BaseLesson {
  return {
    id: "demo-1-1",
    number: 1,
    title: "Demo",
    subtitle: "Sub",
    durationMinutes: 5,
    sections: [],
    quiz: [],
    keyConcepts: [],
    concept: {
      body: "Evidence first. **Short.**",
      takeaway: "One rule.",
      sources: [{ label: "DSGVO Art. 5", url: "https://eur-lex.europa.eu/eli/reg/2016/679/oj" }],
    },
    exercise: {
      kind: "bucket-sort",
      title: "Sort",
      instructions: "Sort them.",
      props: {
        buckets: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        items: [
          { id: "1", text: "one", bucket: "a", why: "because" },
          { id: "2", text: "two", bucket: "b", why: "because" },
          { id: "3", text: "three", bucket: "a", why: "because" },
        ],
      },
    },
    checks: [
      {
        id: "c1",
        prompt: "Q1",
        options: [
          { id: "a", text: "yes", correct: true },
          { id: "b", text: "no", correct: false },
        ],
        explanation: "Why.",
      },
      {
        id: "c2",
        prompt: "Q2",
        options: [
          { id: "a", text: "yes", correct: false },
          { id: "b", text: "no", correct: true },
        ],
        explanation: "Why.",
      },
    ],
    ...overrides,
  };
}

describe("lesson-engine lesson model", () => {
  it("recognises complete engine lessons only", () => {
    expect(isEngineLesson(lesson())).toBe(true);
    expect(isEngineLesson(lesson({ checks: [] }))).toBe(false);
    expect(isEngineLesson(lesson({ concept: undefined }))).toBe(false);
  });

  it("projects concept and checks onto the legacy sections/quiz shape", () => {
    const projected = projectEngineLesson(lesson());
    expect(projected.sections).toEqual([
      expect.objectContaining({
        id: "demo-1-1_concept",
        title: "Demo",
        keyTakeaway: "One rule.",
        content: expect.stringContaining("Evidence first."),
      }),
    ]);
    expect(projected.sections[0]?.sources?.[0]).toEqual({
      sourceTitle: "DSGVO Art. 5",
      sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    });
    expect(projected.quiz.map((question) => question.id)).toEqual(["c1", "c2"]);
    expect(projected.quiz[1]?.answerOptions[1]).toEqual({ id: "b", text: "no", isCorrect: true });
    expect(projected.widgets).toEqual([]);
  });

  it("passes legacy lessons through unchanged", () => {
    const legacy = lesson({ concept: undefined, exercise: undefined, checks: undefined });
    expect(projectEngineLesson(legacy)).toBe(legacy);
  });

  it("tracks exactly one progress step: the exercise", () => {
    expect(engineLessonProgressStepIds("demo-1-1")).toEqual(["demo-1-1_exercise"]);
  });

  it("counts words without markdown punctuation", () => {
    expect(countWords("**Zwei** Wörter | --- |")).toBe(2);
    expect(countWords("DSGVO Art. 5 Abs. 1 lit. c")).toBe(7);
  });

  it("accepts a lesson that meets the authoring contract", () => {
    expect(validateEngineLesson(lesson())).toEqual([]);
  });

  it("reports every authoring problem", () => {
    const longBody = Array.from({ length: 151 }, (_, index) => `wort${index}`).join(" ");
    const problems = validateEngineLesson(
      lesson({
        concept: { body: longBody },
        exercise: {
          kind: "not-a-widget" as never,
          title: "",
          instructions: "",
          props: { lessonId: "x" },
        },
        checks: [
          {
            id: "c1",
            prompt: "Q",
            options: [
              { id: "a", text: "1", correct: true },
              { id: "a", text: "2", correct: true },
            ],
            explanation: "",
          },
        ],
      }),
    );
    expect(problems.join("\n")).toMatch(/151 words/);
    expect(problems.join("\n")).toMatch(/unknown exercise kind/);
    expect(problems.join("\n")).toMatch(/title and instructions/);
    expect(problems.join("\n")).toMatch(/lessonId\/cpId/);
    expect(problems.join("\n")).toMatch(/exactly 2 checks/);
    expect(problems.join("\n")).toMatch(/exactly one correct option/);
    expect(problems.join("\n")).toMatch(/duplicate option ids/);
    expect(problems.join("\n")).toMatch(/needs an explanation/);
  });
});

describe("lab exercise prop validation", () => {
  it("catches dangling bucket references and empty buckets", () => {
    expect(
      validateExerciseProps("bucket-sort", {
        buckets: [{ id: "a" }, { id: "b" }, { id: "c" }],
        items: [
          { id: "1", text: "x", bucket: "a", why: "w" },
          { id: "2", text: "y", bucket: "z", why: "w" },
          { id: "3", text: "z", bucket: "a", why: "w" },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        "bucket-sort: item 2 points to unknown bucket z",
        "bucket-sort: bucket b has no item",
        "bucket-sort: bucket c has no item",
      ]),
    );
  });

  it("requires claim evidence to be an exact quote from its source", () => {
    const problems = validateExerciseProps("claim-checker", {
      sources: [{ id: "A", label: "A", text: "Budget 1,8 Mio." }],
      draft: [{ text: "x", claimId: "c1" }, { text: "y", claimId: "c2" }],
      claims: [
        { id: "c1", verdict: "contradicted", sourceId: "A", evidence: "Budget 18 Mio.", why: "w" },
        { id: "c2", verdict: "missing", why: "w" },
        { id: "c3", verdict: "supported", sourceId: "B", why: "w" },
      ],
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        "claim-checker: claim c3 is not in the draft",
        "claim-checker: claim c3 needs a known sourceId",
        "claim-checker: evidence for c1 is not a quote from source A",
      ]),
    );
  });

  it("checks calculator formulas and goal reachability", () => {
    const problems = validateExerciseProps("calculator", {
      inputs: [
        { id: "a", type: "select", default: 1, options: [{ value: 1 }, { value: 2 }] },
      ],
      outputs: [{ id: "double", formula: "a * 2" }, { id: "bad", formula: "nope + 1" }],
      goals: [{ id: "g", when: "double == 4" }],
    });
    expect(problems).toContain("calculator output bad: unknown variable(s) nope");
    const reachable = validateExerciseProps("calculator", {
      inputs: [
        { id: "a", type: "select", default: 1, options: [{ value: 1 }, { value: 2 }] },
      ],
      outputs: [{ id: "double", formula: "a * 2" }],
      goals: [
        { id: "ok", when: "double == 4" },
        { id: "never", when: "double == 5" },
      ],
    });
    expect(reachable).toEqual(["calculator: goal never is unreachable"]);
  });

  it("checks decision trees for unreachable nodes and results", () => {
    const problems = validateExerciseProps("decision-wizard", {
      start: "q1",
      nodes: [
        { id: "q1", options: [{ label: "x", result: "r1" }, { label: "y", next: "missing" }] },
        { id: "orphan", options: [{ label: "z", result: "r2" }] },
      ],
      results: [{ id: "r1" }, { id: "r2" }],
      scenarios: [{ id: "s", expected: "r9" }],
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        "decision-wizard: option in q1 points to unknown node missing",
        "decision-wizard: node orphan is unreachable",
        "decision-wizard: result r2 is unreachable",
        "decision-wizard: scenario s expects unknown result r9",
      ]),
    );
  });

  it("requires recorded outputs for live prompts and known template fields", () => {
    expect(
      validateExerciseProps("live-prompt-ab", {
        variants: [{ prompt: "a", recorded: "" }, { prompt: "b", recorded: "x" }],
        rubric: [{ id: "r1", expected: { a: true } }],
      }),
    ).toEqual(
      expect.arrayContaining([
        "live-prompt-ab: every variant needs a prompt and a recorded output",
        "live-prompt-ab: needs at least 2 rubric criteria",
        "live-prompt-ab: criterion r1 needs expected.a and expected.b booleans",
      ]),
    );
    expect(
      validateExerciseProps("doc-builder", {
        filename: "policy.txt",
        template: "{{a}} {{ghost}}",
        fields: [{ id: "a", type: "text" }, { id: "b", type: "select" }],
      }),
    ).toEqual(
      expect.arrayContaining([
        "doc-builder: filename must end in .md",
        "doc-builder: template uses unknown field ghost",
        "doc-builder: field b is not used in the template",
        "doc-builder: field b needs options",
      ]),
    );
  });

  it("checks threshold-lab groups and goal variables", () => {
    expect(
      validateExerciseProps("threshold-lab", {
        groups: [{ id: "a", baseRate: 0.5 }, { id: "b", baseRate: 1.2 }],
        goals: [{ id: "g", when: "fpr_c < 0.1" }],
      }),
    ).toEqual([
      "threshold-lab: group b baseRate must be between 0 and 1",
      "threshold-lab goal g: unknown variable(s) fpr_c",
    ]);
  });

  it("ignores widget kinds outside the lab", () => {
    expect(validateExerciseProps("failure-tagger", {})).toEqual([]);
  });
});
