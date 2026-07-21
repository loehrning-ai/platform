import { describe, it, expect } from "vitest";
import {
  CODEX_LESSON_IDS,
  CODEX_TRACK_IDS,
  CODEX_TRACKS,
  isCodexLessonId,
  type CodexBlock,
  type CodexLesson,
} from "./types";

describe("codex types (plan 009 stage 1)", () => {
  it("has exactly 12 lesson ids, L01 through L12, matching the source's window.LESSONS order", () => {
    expect(CODEX_LESSON_IDS).toHaveLength(12);
    expect([...CODEX_LESSON_IDS]).toEqual([
      "L01",
      "L02",
      "L03",
      "L04",
      "L05",
      "L06",
      "L07",
      "L08",
      "L09",
      "L10",
      "L11",
      "L12",
    ]);
    expect(new Set(CODEX_LESSON_IDS).size).toBe(12);
  });

  it("isCodexLessonId is a real type guard", () => {
    expect(isCodexLessonId("L01")).toBe(true);
    expect(isCodexLessonId("L12")).toBe(true);
    expect(isCodexLessonId("L13")).toBe(false);
    expect(isCodexLessonId("mental-model")).toBe(false);
    expect(isCodexLessonId(42)).toBe(false);
  });

  it("exposes the four source tracks with real label/title/hint content", () => {
    expect([...CODEX_TRACK_IDS]).toEqual([
      "fundamentals",
      "task-craft",
      "in-the-loop",
      "advanced",
    ]);
    expect(CODEX_TRACKS).toHaveLength(4);
    for (const track of CODEX_TRACKS) {
      expect(CODEX_TRACK_IDS, track.id).toContain(track.id);
      expect(track.label.length).toBeGreaterThan(0);
      expect(track.title.length).toBeGreaterThan(0);
      expect(track.hint.length).toBeGreaterThan(0);
    }
    expect(CODEX_TRACKS[0].title).toBe("The mental model");
  });

  it("CodexBlock supports the four recurring source presentational patterns", () => {
    const blocks: readonly CodexBlock[] = [
      { kind: "prose", markdown: "Some prose." },
      { kind: "pull-quote", text: "A quote." },
      { kind: "callout", body: "A callout." },
      {
        kind: "card-grid",
        cards: [{ eyebrow: "01", title: "A card", body: "Card body." }],
      },
    ];
    expect(blocks.map((b) => b.kind)).toEqual([
      "prose",
      "pull-quote",
      "callout",
      "card-grid",
    ]);
  });

  it("a minimal CodexLesson shape satisfies the CodexLesson interface", () => {
    const lesson: CodexLesson = {
      id: "L01",
      number: 1,
      title: "What Codex Actually Is",
      subtitle: "An agent, not an assistant.",
      durationMinutes: 10,
      trackId: "fundamentals",
      hook: "Agent, not assistant.",
      keyConcepts: ["Agent"],
      quiz: [],
      sections: [
        {
          id: "s1",
          title: "Section one",
          readTimeMinutes: 2,
          content: "Some prose.",
          blocks: [{ kind: "prose", markdown: "Some prose." }],
        },
      ],
      widgets: [],
    };
    expect(lesson.sections[0].blocks[0].kind).toBe("prose");
  });
});
