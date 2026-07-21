import { describe, it, expect } from "vitest";
import {
  DATA_INFRA_LESSON_IDS,
  DATA_INFRA_TRACK_IDS,
  DATA_INFRA_TRACKS,
  checkpointLessonId,
  isDataInfraLessonId,
  type DataInfraLesson,
} from "./types";

describe("data-infrastructure types (plan 010 stage 1)", () => {
  it("has exactly 12 lesson ids, matching the source's window.LESSONS order", () => {
    expect(DATA_INFRA_LESSON_IDS).toHaveLength(12);
    expect([...DATA_INFRA_LESSON_IDS]).toEqual([
      "mental-model",
      "cap-pacelc",
      "modeling",
      "storage-formats",
      "lakehouse",
      "partitioning",
      "batch-elt",
      "streaming",
      "cdc-lambda-kappa",
      "idempotency",
      "sla-quality",
      "interview-playbook",
    ]);
    expect(new Set(DATA_INFRA_LESSON_IDS).size).toBe(12);
  });

  it("isDataInfraLessonId is a real type guard", () => {
    expect(isDataInfraLessonId("mental-model")).toBe(true);
    expect(isDataInfraLessonId("interview-playbook")).toBe(true);
    expect(isDataInfraLessonId("does-not-exist")).toBe(false);
    expect(isDataInfraLessonId(42)).toBe(false);
  });

  it("checkpointLessonId namespaces every id so it can never collide with claude course's own bare 'mental-model' checkpoint lessonId", () => {
    expect(checkpointLessonId("mental-model")).toBe("di-mental-model");
    expect(checkpointLessonId("mental-model")).not.toBe("mental-model");
    for (const id of DATA_INFRA_LESSON_IDS) {
      expect(checkpointLessonId(id)).toBe(`di-${id}`);
    }
  });

  it("exposes the four source tracks with real label/title/hint content", () => {
    expect([...DATA_INFRA_TRACK_IDS]).toEqual([
      "foundations",
      "storage",
      "movement",
      "scale",
    ]);
    expect(DATA_INFRA_TRACKS).toHaveLength(4);
    for (const track of DATA_INFRA_TRACKS) {
      expect(DATA_INFRA_TRACK_IDS, track.id).toContain(track.id);
      expect(track.label.length).toBeGreaterThan(0);
      expect(track.title.length).toBeGreaterThan(0);
      expect(track.hint.length).toBeGreaterThan(0);
    }
    expect(DATA_INFRA_TRACKS[0].title).toBe("How to think about data systems.");
  });

  it("a minimal DataInfraLesson shape satisfies the DataInfraLesson interface", () => {
    const lesson: DataInfraLesson = {
      id: "mental-model",
      number: 1,
      title: "The Stack, Top to Bottom",
      subtitle: "Source to log to lake to warehouse to mart",
      durationMinutes: 12,
      trackId: "foundations",
      hook: "Where bytes live, why they live there.",
      keyConcepts: ["Source", "Log", "Store"],
      quiz: [],
      sections: [
        {
          id: "s1",
          title: "Section one",
          readTimeMinutes: 2,
          content: "Some prose.",
        },
      ],
      widgets: [],
    };
    expect(lesson.sections[0].content).toBe("Some prose.");
  });
});
