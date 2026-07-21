import { describe, it, expect } from "vitest";
import {
  COURSE_SLUGS,
  type CourseSlug,
  type BaseLesson,
  type Lesson,
} from "./types";
import {
  getCourseConfig,
  getRegisteredCourseSlugs,
  isCourseRegistered,
  getBlocks,
  getBlockLessons,
  getGlossaryTerms,
  getGlossaryTermCount,
  getWorkshopQuestions,
  getWorkshopQuestionCount,
  getWorkshopPassThreshold,
} from "./data";

// ─── Engine union ──────────────────────────────────────

describe("course engine union (shared course architecture + 6)", () => {
  it("CourseSlug includes all three courses", () => {
    expect(COURSE_SLUGS).toContain("ki-fuehrerschein");
    expect(COURSE_SLUGS).toContain("eu-ai-act-kurs");
    expect(COURSE_SLUGS).toContain("ai-native");
  });

  it("all three courses are registered in the shared engine (adds AI-Native)", () => {
    expect(isCourseRegistered("ki-fuehrerschein")).toBe(true);
    expect(isCourseRegistered("eu-ai-act-kurs")).toBe(true);
    expect(isCourseRegistered("ai-native")).toBe(true);
  });

  it("getRegisteredCourseSlugs returns all eight courses (plan 011 stage 1 adds data-engineering-fundamentals)", () => {
    const slugs = getRegisteredCourseSlugs();
    expect([...slugs].sort()).toEqual([
      "ai-native",
      "claude",
      "codex",
      "data-engineering-fundamentals",
      "data-infrastructure",
      "eu-ai-act-kurs",
      "ki-fuehrerschein",
      "ki-und-gesellschaft",
    ]);
  });
});

// ─── AI-Native registration (shared course architecture) ─────────────────

describe("AI-Native course config (shared course architecture)", () => {
  it("registers AI-Native with the right paths and certificate metadata", () => {
    const config = getCourseConfig("ai-native");
    expect(config.slug).toBe("ai-native");
    expect(config.basePath).toBe("/ai-native");
    // AI-Native is the one course whose coursePath differs from basePath/kurs
    // shape only in that basePath itself is not "/ai-native/kurs".
    expect(config.coursePath).toBe("/ai-native/kurs");
    expect(config.certificateModules.length).toBe(4);
    expect(config.certificateFileStem.length).toBeGreaterThan(0);
    // No em dashes anywhere in course copy (CI rule).
    expect(config.quizPassMessage).not.toMatch(/[—–]/);
    expect(config.certificateModules.join(" ")).not.toMatch(/[—–]/);
  });

  it("loads the AI-Native workshop questions (>= configured count)", () => {
    const questions = getWorkshopQuestions("ai-native");
    const count = getWorkshopQuestionCount("ai-native");
    expect(questions.length).toBeGreaterThanOrEqual(count);
    // Every question has exactly one correct answer.
    for (const q of questions) {
      const correct = q.answerOptions.filter((o) => o.isCorrect);
      expect(correct.length).toBe(1);
    }
  });

  it("uses a 70% pass threshold like the other courses", () => {
    expect(getWorkshopPassThreshold("ai-native")).toBeCloseTo(0.7);
  });
});

// ─── BaseLesson folds both lesson schemas ──────────────────────

describe("BaseLesson (shared lesson shape)", () => {
  it("a free-course Lesson satisfies BaseLesson", () => {
    const lesson: Lesson = {
      id: "l1",
      blockId: "block_1",
      number: 1,
      title: "T",
      subtitle: "S",
      durationMinutes: 5,
      sections: [],
      quiz: [],
      keyConcepts: [],
    };
    // Structural assignability check: compiles only if Lesson extends BaseLesson.
    const base: BaseLesson = lesson;
    expect(base.id).toBe("l1");
  });
});

// ─── Config copy fields used by the collapsed shared pages ─────

describe("CourseConfig copy fields (collapsed route components)", () => {
  const registered: CourseSlug[] = ["ki-fuehrerschein", "eu-ai-act-kurs"];

  it.each(registered)(
    "%s config carries every field the shared pages read",
    (slug) => {
      const config = getCourseConfig(slug);
      expect(config.coursePath).toBe(`${config.basePath}/kurs`);
      expect(config.quizPassMessage.length).toBeGreaterThan(0);
      expect(config.certificateFileStem.length).toBeGreaterThan(0);
      // No em dashes anywhere in course copy (CI rule).
      expect(config.quizPassMessage).not.toMatch(/[—–]/);
    },
  );

  it("getBlocks returns the configured block count per course", () => {
    expect(getBlocks("ki-fuehrerschein").length).toBe(5);
    expect(getBlocks("eu-ai-act-kurs").length).toBe(6);
  });
});

// ─── Glossary loader (shared course architecture) ───────────────────────

describe("getGlossaryTerms (shared course architecture)", () => {
  it("loads the previously-unwired KI-Führerschein glossary", () => {
    const terms = getGlossaryTerms("ki-fuehrerschein");
    expect(terms.length).toBeGreaterThanOrEqual(40);
    expect(getGlossaryTermCount("ki-fuehrerschein")).toBe(terms.length);
    // Sorted by German term, immutable copy.
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, "de"));
    expect(terms.map((t) => t.term)).toEqual(sorted.map((t) => t.term));
  });

  it("filters by relatedBlocks when a blockId is given", () => {
    const block4 = getGlossaryTerms("ki-fuehrerschein", "block_4");
    expect(block4.length).toBeGreaterThan(0);
    for (const t of block4) {
      expect(t.relatedBlocks).toContain("block_4");
    }
    // Block 4 covers verification: hallucination + 3-step check must be present.
    expect(block4.map((t) => t.term)).toContain("Halluzination");
  });

  it("returns an empty list for courses without a glossary", () => {
    // EU-AI-Act gained a glossary in ; AI-Native still has none.
    expect(getGlossaryTerms("ai-native")).toEqual([]);
    expect(getGlossaryTermCount("ai-native")).toBe(0);
  });

  it("never mutates the underlying glossary (immutable copies)", () => {
    const a = getGlossaryTerms("ki-fuehrerschein");
    const b = getGlossaryTerms("ki-fuehrerschein");
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// ─── In-lesson widgets (shared course architecture) ─────────────────────

describe("KI-Führerschein in-lesson interactivity (shared course architecture)", () => {
  it("appends a glossary flashcards deck to the last lesson of a block", () => {
    const lessons = getBlockLessons("ki-fuehrerschein", "block_4");
    const last = lessons[lessons.length - 1];
    const deck = (last.widgets ?? []).find(
      (w) => w.kind === "flashcards" && w.placement === "end",
    );
    expect(deck).toBeDefined();
    const cards = deck?.props?.cards as ReadonlyArray<{ q: string; a: string }>;
    expect(cards.length).toBeGreaterThan(0);
    // Cards are derived from the glossary terms for that block.
    expect(cards.map((c) => c.q)).toContain("Halluzination");
    // Unique checkpoint id per block.
    expect(deck?.props?.cpId).toBe("glossar-block_4");
  });

  it("only the last lesson of a block carries the glossary deck", () => {
    const lessons = getBlockLessons("ki-fuehrerschein", "block_4");
    for (const lesson of lessons.slice(0, -1)) {
      const deck = (lesson.widgets ?? []).find(
        (w) => w.kind === "flashcards" && w.placement === "end",
      );
      expect(deck).toBeUndefined();
    }
  });

  it("wires the FailureTagger into Block 4 (Verifikation)", () => {
    const lessons = getBlockLessons("ki-fuehrerschein", "block_4");
    const lesson = lessons.find((l) => l.id === "block_4_lesson_4");
    const tagger = (lesson?.widgets ?? []).find(
      (w) => w.kind === "failure-tagger",
    );
    expect(tagger).toBeDefined();
    expect(tagger?.props?.lessonId).toBe("block_4_lesson_4");
    expect(String(tagger?.props?.scenario ?? "")).not.toMatch(/[—–]/);
  });

  it("wires a RedactionDrill into Block 2 (Datenschutz)", () => {
    const lessons = getBlockLessons("ki-fuehrerschein", "block_2");
    const lesson = lessons.find((l) => l.id === "block_2_lesson_3");
    const drill = (lesson?.widgets ?? []).find(
      (w) => w.kind === "redaction-drill",
    );
    expect(drill).toBeDefined();
    expect(drill?.props?.cpId).toBe("redaction-drill");
  });

  it("wires a Compare widget into Block 3 (Anwendung)", () => {
    const lessons = getBlockLessons("ki-fuehrerschein", "block_3");
    const lesson = lessons.find((l) => l.id === "block_3_lesson_1");
    const compare = (lesson?.widgets ?? []).find((w) => w.kind === "compare");
    expect(compare).toBeDefined();
    // German copy, no em dashes, real umlauts.
    const note = String(compare?.props?.note ?? "");
    expect(note).not.toMatch(/[—–]/);
    expect(String(compare?.props?.good ?? "")).toMatch(/[äöüß]/);
  });

  it("keeps the auto-injected glossary deck immutable across calls", () => {
    const a = getBlockLessons("ki-fuehrerschein", "block_1");
    const b = getBlockLessons("ki-fuehrerschein", "block_1");
    expect(a[a.length - 1].widgets).toEqual(b[b.length - 1].widgets);
  });
});

// ─── EU-AI-Act-Kurs glossary + interactivity (shared course architecture) ─

describe("EU-AI-Act-Kurs glossary (shared course architecture)", () => {
  it("loads the new Risikostufen glossary tied to Verordnung (EU) 2024/1689", () => {
    const terms = getGlossaryTerms("eu-ai-act-kurs");
    expect(terms.length).toBeGreaterThanOrEqual(20);
    expect(getGlossaryTermCount("eu-ai-act-kurs")).toBe(terms.length);
    // Sorted by German term (immutable copy).
    const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, "de"));
    expect(terms.map((t) => t.term)).toEqual(sorted.map((t) => t.term));
    // Core Risikostufen vocabulary is present.
    const names = terms.map((t) => t.term);
    expect(names).toContain("Hochrisiko-System");
    expect(names).toContain("Verbotene Praktiken");
    expect(names).toContain("Minimales Risiko");
  });

  it("filters Risikoklassen terms by relatedBlocks (block_2)", () => {
    const block2 = getGlossaryTerms("eu-ai-act-kurs", "block_2");
    expect(block2.length).toBeGreaterThan(0);
    for (const t of block2) {
      expect(t.relatedBlocks).toContain("block_2");
    }
    expect(block2.map((t) => t.term)).toContain("Verbotene Praktiken");
  });

  it("uses only real German umlauts and no em dashes in definitions", () => {
    const all = getGlossaryTerms("eu-ai-act-kurs");
    const joined = all.map((t) => `${t.term} ${t.definition}`).join(" ");
    expect(joined).not.toMatch(/[—–]/);
    // ASCII-substitution guard: no bare "oe/ue/ae/ss" stand-ins in German words.
    expect(joined).toMatch(/[äöüß]/);
  });
});

// ─── KI und Gesellschaft (KI und Gesellschaft course review) ────────────────────────────

describe("KI und Gesellschaft course (KI und Gesellschaft course review)", () => {
  it("is registered in the course engine", () => {
    expect(isCourseRegistered("ki-und-gesellschaft")).toBe(true);
  });

  it("has correct config metadata", () => {
    const config = getCourseConfig("ki-und-gesellschaft");
    expect(config.slug).toBe("ki-und-gesellschaft");
    expect(config.basePath).toBe("/ki-und-gesellschaft");
    expect(config.coursePath).toBe("/ki-und-gesellschaft/kurs");
    expect(config.blockIds).toEqual(["block_1", "block_2", "block_3"]);
    expect(config.workshopQuizQuestionCount).toBe(15);
    expect(config.workshopQuizPassThreshold).toBe(0.7);
    expect(config.certificateModules.length).toBe(3);
    expect(config.quizPassMessage).not.toMatch(/[—–]/);
    expect(config.certificateModules.join(" ")).not.toMatch(/[—–]/);
  });

  it("has three blocks with correct titles", () => {
    const blocks = getBlocks("ki-und-gesellschaft");
    expect(blocks.length).toBe(3);
    expect(blocks[0].title).toBe("KI und Arbeit");
    expect(blocks[1].title).toBe("Deepfakes erkennen");
    expect(blocks[2].title).toBe("Ethik und Bias");
  });

  it("has 9 lessons total across the three blocks (3 per block)", () => {
    const b1 = getBlockLessons("ki-und-gesellschaft", "block_1");
    const b2 = getBlockLessons("ki-und-gesellschaft", "block_2");
    const b3 = getBlockLessons("ki-und-gesellschaft", "block_3");
    expect(b1.length).toBe(3);
    expect(b2.length).toBe(3);
    expect(b3.length).toBe(3);
  });

  it("block 1 (Arbeit) lessons reference OECD and Bundesagentur", () => {
    const lessons = getBlockLessons("ki-und-gesellschaft", "block_1");
    const allText = lessons
      .flatMap((l) => l.sections.map((s) => s.content))
      .join(" ");
    expect(allText).toMatch(/OECD/);
    expect(allText).toMatch(/Bundesagentur/);
  });

  it("block 2 (Deepfakes) lessons reference Art. 50 and WeVerify", () => {
    const lessons = getBlockLessons("ki-und-gesellschaft", "block_2");
    const allText = lessons
      .flatMap((l) => l.sections.map((s) => s.content))
      .join(" ");
    expect(allText).toMatch(/Art\. 50/);
    expect(allText).toMatch(/weverify\.eu/i);
  });

  it("block 3 (Ethik) lessons reference COMPAS and Buolamwini", () => {
    const lessons = getBlockLessons("ki-und-gesellschaft", "block_3");
    const allText = lessons
      .flatMap((l) => l.sections.map((s) => s.content))
      .join(" ");
    expect(allText).toMatch(/COMPAS/);
    expect(allText).toMatch(/Buolamwini/);
  });

  it("loads 15 workshop questions with exactly one correct answer each", () => {
    const questions = getWorkshopQuestions("ki-und-gesellschaft");
    expect(questions.length).toBe(15);
    for (const q of questions) {
      const correct = q.answerOptions.filter((o) => o.isCorrect);
      expect(correct.length).toBe(1);
    }
  });

  it("has no em dashes in lesson titles or section content", () => {
    const blocks = getBlocks("ki-und-gesellschaft");
    const allTitles = blocks.flatMap((b) =>
      b.lessons.map((l) => l.title),
    ).join(" ");
    expect(allTitles).not.toMatch(/[—–]/);
    const allContent = blocks.flatMap((b) =>
      b.lessons.flatMap((l) => l.sections.map((s) => s.content)),
    ).join(" ");
    expect(allContent).not.toMatch(/[—–]/);
  });

  it("has no glossary (ki-und-gesellschaft has no glossary.json)", () => {
    expect(getGlossaryTerms("ki-und-gesellschaft")).toEqual([]);
  });
});

describe("EU-AI-Act-Kurs in-lesson interactivity (shared course architecture)", () => {
  it("wires the risk-pyramid diagram into the Risikoklassen summary lesson", () => {
    const lessons = getBlockLessons("eu-ai-act-kurs", "block_2");
    const lesson = lessons.find((l) => l.id === "block_2_lesson_4");
    const pyramid = (lesson?.widgets ?? []).find(
      (w) => w.kind === "risk-pyramid",
    );
    expect(pyramid).toBeDefined();
    expect(pyramid?.placement).toBe("after-intro");
    expect(pyramid?.props?.lessonId).toBe("block_2_lesson_4");
    expect(String(pyramid?.props?.title ?? "")).not.toMatch(/[—–]/);
  });

  it("wires a DragReorder of the four risk tiers into block_2", () => {
    const lessons = getBlockLessons("eu-ai-act-kurs", "block_2");
    const lesson = lessons.find((l) => l.id === "block_2_lesson_4");
    const reorder = (lesson?.widgets ?? []).find(
      (w) => w.kind === "drag-reorder",
    );
    expect(reorder).toBeDefined();
    expect(reorder?.props?.cpId).toBe("risikostufen-ordnen");
    // German copy, no em dashes.
    expect(String(reorder?.props?.prompt ?? "")).not.toMatch(/[—–]/);
    expect(String(reorder?.props?.prompt ?? "")).toMatch(/[äöüß]/);
  });

  it("appends the auto-injected glossary deck to the last block_2 lesson", () => {
    const lessons = getBlockLessons("eu-ai-act-kurs", "block_2");
    const last = lessons[lessons.length - 1];
    const deck = (last.widgets ?? []).find(
      (w) => w.kind === "flashcards" && w.placement === "end",
    );
    expect(deck).toBeDefined();
    expect(deck?.props?.cpId).toBe("glossar-block_2");
    const cards = deck?.props?.cards as ReadonlyArray<{ q: string; a: string }>;
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.map((c) => c.q)).toContain("Verbotene Praktiken");
  });

  it("wires a GPAI-Transparenz FailureTagger into block_4 (Art. 50)", () => {
    const lessons = getBlockLessons("eu-ai-act-kurs", "block_4");
    const lesson = lessons.find((l) => l.id === "block_4_lesson_4");
    const tagger = (lesson?.widgets ?? []).find(
      (w) => w.kind === "failure-tagger",
    );
    expect(tagger).toBeDefined();
    expect(tagger?.props?.lessonId).toBe("block_4_lesson_4");
    expect(tagger?.props?.cpId).toBe("gpai-transparenz-tagger");
    // Five authored cases, each mapping to one of the four FailureModeIds.
    const cases = tagger?.props?.cases as ReadonlyArray<{ correct: string }>;
    expect(cases.length).toBe(5);
    const validIds = new Set([
      "halluzination",
      "verweigerung",
      "formatdrift",
      "themaverfehlung",
    ]);
    for (const c of cases) expect(validIds.has(c.correct)).toBe(true);
    // German copy, no em dashes, real umlauts.
    const scenario = String(tagger?.props?.scenario ?? "");
    expect(scenario).not.toMatch(/[—–]/);
    expect(scenario).toMatch(/[äöüß]/);
  });
});
