/**
 * Content schema validation tests (accessibility hardening).
 *
 * Validates the schemas of all structured content files used by the platform.
 * These tests act as CI guards against malformed content silently shipping.
 *
 * Coverage:
 * - Course JSON lessons (all 4 courses)
 * - Quiz banks (all 4 courses) — exactly one correct answer per question
 * - Demo manifest (demos.ts)
 * - Book manifest (books.ts)
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { books } from "@/lib/books";
import { demos } from "@/lib/demos";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson<T>(relativePath: string): T {
  const absPath = resolve(process.cwd(), relativePath);
  return JSON.parse(readFileSync(absPath, "utf-8")) as T;
}

// ---------------------------------------------------------------------------
// Course lesson JSON schemas
// ---------------------------------------------------------------------------

interface LessonSection {
  id: string;
  title: string;
  readTimeMinutes: number;
  content: string;
}

interface QuizQuestion {
  id: string;
  questionText: string;
  answerOptions: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation: string;
}

interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  sections: LessonSection[];
  quiz: QuizQuestion[];
}

type LessonFile = Lesson[] | { lessons: Lesson[] } | { blockId?: string; lessons: Lesson[] };

const COURSE_LESSON_FILES: [string, string][] = [
  [
    "KI-Führerschein block-1",
    "content/ki-fuehrerschein/block-1-entdeckung-lessons.json",
  ],
  [
    "KI-Führerschein block-2",
    "content/ki-fuehrerschein/block-2-datenschutz-lessons.json",
  ],
  [
    "KI-Führerschein block-3",
    "content/ki-fuehrerschein/block-3-anwendung-lessons.json",
  ],
  [
    "KI-Führerschein block-4",
    "content/ki-fuehrerschein/block-4-verifikation-lessons.json",
  ],
  [
    "KI-Führerschein block-5",
    "content/ki-fuehrerschein/block-5-richtlinie-lessons.json",
  ],
];

function describeLessonFile(label: string, path: string): void {
  describe(label, () => {
    let lessons: Lesson[] = [];
    let loadError: string | null = null;
    try {
      const raw = loadJson<LessonFile>(path);
      lessons = Array.isArray(raw) ? raw : (raw as { lessons: Lesson[] }).lessons;
    } catch (e) {
      loadError = String(e);
    }

    it(`loads ${path}`, () => {
      if (loadError) expect.fail(`Could not load or parse ${path}: ${loadError}`);
    });

    it("is a non-empty array", () => {
      if (loadError) return;
      expect(Array.isArray(lessons)).toBe(true);
      expect(lessons.length).toBeGreaterThan(0);
    });

    it("each lesson has required string fields", () => {
      if (loadError) return;
      for (const lesson of lessons) {
        expect(typeof lesson.id, `lesson id in ${label}`).toBe("string");
        expect(lesson.id.trim().length, `empty id in ${label}`).toBeGreaterThan(0);
        expect(typeof lesson.title, `lesson title in ${label}`).toBe("string");
        expect(lesson.title.trim().length, `empty title in ${label}`).toBeGreaterThan(0);
      }
    });

    it("each lesson has durationMinutes > 0", () => {
      if (loadError) return;
      for (const lesson of lessons) {
        expect(
          lesson.durationMinutes,
          `durationMinutes in lesson ${lesson.id}`,
        ).toBeGreaterThan(0);
      }
    });

    it("each lesson has at least one non-empty section", () => {
      if (loadError) return;
      for (const lesson of lessons) {
        expect(
          lesson.sections?.length,
          `no sections in lesson ${lesson.id}`,
        ).toBeGreaterThan(0);
        for (const section of lesson.sections) {
          expect(
            section.content?.trim().length,
            `empty content in section ${section.id} of lesson ${lesson.id}`,
          ).toBeGreaterThan(0);
        }
      }
    });
  });
}

describe("Course lesson JSON schema", () => {
  for (const [label, path] of COURSE_LESSON_FILES) {
    describeLessonFile(label, path);
  }
});

// ---------------------------------------------------------------------------
// Quiz bank schemas (all 4 courses)
// ---------------------------------------------------------------------------

interface QuizBankQuestion {
  id: string;
  questionText: string;
  answerOptions: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation: string;
}

const QUIZ_BANKS: [string, string][] = [
  ["KI-Führerschein", "content/ki-fuehrerschein/quiz/questions.json"],
  ["EU AI Act Kurs", "content/eu-ai-act-kurs/quiz/questions.json"],
  ["AI-Native", "content/ai-native/quiz/questions.json"],
  ["KI und Gesellschaft", "content/ki-und-gesellschaft/quiz/questions.json"],
];

function describeQuizBank(label: string, path: string): void {
  describe(label, () => {
    let questions: QuizBankQuestion[] = [];
    let loadError: string | null = null;
    try {
      const raw = loadJson<QuizBankQuestion[] | { questions: QuizBankQuestion[] }>(path);
      questions = Array.isArray(raw) ? raw : raw.questions;
    } catch (e) {
      loadError = String(e);
    }

    it(`loads ${path}`, () => {
      if (loadError) expect.fail(`Could not load or parse ${path}: ${loadError}`);
    });

    it("is a non-empty array", () => {
      if (loadError) return;
      expect(questions.length).toBeGreaterThan(0);
    });

    it("each question has a non-empty questionText", () => {
      if (loadError) return;
      for (const q of questions) {
        expect(
          q.questionText?.trim().length,
          `empty questionText in question ${q.id}`,
        ).toBeGreaterThan(0);
      }
    });

    it("each question has at least 3 options", () => {
      if (loadError) return;
      for (const q of questions) {
        expect(
          q.answerOptions?.length,
          `too few options in question ${q.id}`,
        ).toBeGreaterThanOrEqual(3);
      }
    });

    it("each question has exactly one correct answer", () => {
      if (loadError) return;
      for (const q of questions) {
        const correctCount = q.answerOptions.filter((o) => o.isCorrect).length;
        expect(
          correctCount,
          `Question "${q.id}" has ${correctCount} correct answers (expected exactly 1)`,
        ).toBe(1);
      }
    });

    it("each question has a non-empty explanation", () => {
      if (loadError) return;
      for (const q of questions) {
        expect(
          q.explanation?.trim().length,
          `empty explanation in question ${q.id}`,
        ).toBeGreaterThan(0);
      }
    });
  });
}

describe("Quiz bank schemas", () => {
  for (const [label, path] of QUIZ_BANKS) {
    describeQuizBank(label, path);
  }
});

// ---------------------------------------------------------------------------
// Demo manifest validation
// ---------------------------------------------------------------------------

const ALLOWED_EVIDENCE_MODES = new Set([
  "synthetic",
  "rule_based",
  "live_api",
  "recorded_trace",
]);

describe("Demo manifest schema (src/lib/demos.ts)", () => {
  it("exports a non-empty demos array", () => {
    expect(Array.isArray(demos)).toBe(true);
    expect(demos.length).toBeGreaterThan(0);
  });

  it("every demo has required fields", () => {
    for (const demo of demos) {
      expect(typeof demo.id, `demo.id in ${demo.slug}`).toBe("string");
      expect(demo.id.trim().length, `empty id for demo ${demo.slug}`).toBeGreaterThan(0);
      expect(typeof demo.title, `demo.title in ${demo.slug}`).toBe("string");
      expect(demo.title.trim().length, `empty title for demo ${demo.slug}`).toBeGreaterThan(0);
      expect(demo.title.length, `title too long for demo ${demo.slug}`).toBeLessThan(80);
    }
  });

  it("every demo has illustrative as a boolean", () => {
    for (const demo of demos) {
      expect(
        typeof demo.illustrative,
        `demo ${demo.slug} missing illustrative boolean`,
      ).toBe("boolean");
    }
  });

  it("every illustrative demo has a non-empty syntheticDataLabel", () => {
    for (const demo of demos) {
      if (demo.illustrative) {
        expect(
          demo.syntheticDataLabel?.trim().length,
          `illustrative demo "${demo.slug}" needs a syntheticDataLabel`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("every demo has a valid evidenceMode", () => {
    for (const demo of demos) {
      expect(
        ALLOWED_EVIDENCE_MODES.has(demo.evidenceMode),
        `demo "${demo.slug}" has invalid evidenceMode: "${demo.evidenceMode}"`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Book manifest validation
// ---------------------------------------------------------------------------

describe("Book manifest schema (src/lib/books.ts)", () => {
  it("exports a non-empty books array", () => {
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThan(0);
  });

  it("every book has required fields", () => {
    for (const book of books) {
      expect(
        book.id?.trim().length,
        `empty id for book "${book.title}"`,
      ).toBeGreaterThan(0);
      expect(
        book.title?.trim().length,
        `empty title for book ${book.id}`,
      ).toBeGreaterThan(0);
    }
  });

  it("every book has a chapters count > 0", () => {
    for (const book of books) {
      expect(
        book.chapters,
        `book "${book.id}" has 0 chapters`,
      ).toBeGreaterThan(0);
    }
  });
});
