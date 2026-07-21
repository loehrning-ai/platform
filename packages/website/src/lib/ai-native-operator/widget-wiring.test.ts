import { describe, it, expect, beforeEach } from "vitest";
import { __resetAiNativeOperatorCacheForTests, getAllLessons } from "./data";
import { TIER_A_KINDS } from "@/lib/widgets/types";

/**
 * Explicit non-AI-graded wiring guard (plan 013 stage 6). Confirmed by full
 * source read: none of the 30 exercises call any AI/grading endpoint in the
 * 264-line source app. Every reading lesson's single exercise must be wired
 * through a TIER_A kind (checkpoint-boolean via useCheckpoint) — never
 * through the AI-graded "exercise-free-response" kind, which would both
 * misrepresent the source (it never had AI grading) and reintroduce the
 * per-exercise AI-feedback-text storage-bloat risk this course's port was
 * explicitly designed to avoid.
 */
describe("ai-native-operator widget wiring is exclusively TIER_A, never AI-graded (plan 013 stage 6)", () => {
  beforeEach(() => {
    __resetAiNativeOperatorCacheForTests();
  });

  it("every one of the 30 reading lessons has exactly one widget, matching its exerciseKind", async () => {
    const all = await getAllLessons();
    const reading = all.filter((l) => l.kind === "reading");
    expect(reading).toHaveLength(30);
    for (const lesson of reading) {
      expect(lesson.widgets).toHaveLength(1);
      const widget = lesson.widgets![0];
      expect(widget.kind).toBe(lesson.exerciseKind);
      expect(widget.courseSlug).toBe("ai-native-operator");
      expect(widget.placement).toBe("end");
      expect((widget.props as { lessonId?: string }).lessonId).toBe(lesson.id);
    }
  });

  it("no widget anywhere in this course is 'exercise-free-response' or any other AI-graded kind", async () => {
    const all = await getAllLessons();
    for (const lesson of all) {
      for (const widget of lesson.widgets ?? []) {
        expect(widget.kind).not.toBe("exercise-free-response");
        expect(widget.kind.startsWith("exercise-")).toBe(false);
        expect((TIER_A_KINDS as readonly string[])).toContain(widget.kind);
      }
    }
  });

  it("no widget prop carries aiFeedback or a summary field server-side (checkpoint-boolean only)", async () => {
    const all = await getAllLessons();
    for (const lesson of all) {
      for (const widget of lesson.widgets ?? []) {
        const props = widget.props as Record<string, unknown>;
        expect(props).not.toHaveProperty("aiFeedback");
        expect(props).not.toHaveProperty("summary");
      }
    }
  });
});
