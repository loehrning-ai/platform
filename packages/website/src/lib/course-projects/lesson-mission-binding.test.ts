import { describe, expect, it } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { bindLessonMission } from "./lesson-mission-binding";
import { getLessonMissionProfile } from "./lesson-missions";

describe("lesson mission binding", () => {
  it("binds every canonical lesson to a fail-closed stable mission identity", () => {
    let resolved = 0;

    for (const courseSlug of COURSE_SLUGS) {
      for (const lessonId of CANONICAL_LESSON_IDS[courseSlug]) {
        const bound = bindLessonMission(courseSlug, lessonId, "en", {
          title: `Authored title ${lessonId}`,
          objective: `Authored objective ${lessonId}`,
          keyConcepts: [`Concept ${lessonId}`],
        });

        expect(bound.definition.courseSlug).toBe(courseSlug);
        expect(bound.definition.lessonId).toBe(lessonId);
        expect(bound.frame.missionId).toBe(`${courseSlug}:${lessonId}:v1`);
        expect(bound.frame.skillId).toBe(
          `${courseSlug}:${bound.definition.stageId}`,
        );
        expect(bound.frame.scenarioSeed).toBeGreaterThan(0);
        resolved += 1;
      }
    }

    expect(resolved).toBe(177);
  });

  it("makes adjacent lesson frames visibly distinct using authored metadata", () => {
    const first = bindLessonMission("codex", "L01", "en", {
      title: "A mental model for delegated work",
      objective: "Separate intent, execution, and verification.",
      keyConcepts: ["Bounded autonomy", "Verification"],
    });
    const second = bindLessonMission("codex", "L02", "en", {
      title: "Work inside an isolated sandbox",
      objective: "Limit filesystem and process effects before execution.",
      keyConcepts: ["Sandbox", "Scope"],
    });

    expect(first.frame.label).not.toBe(second.frame.label);
    expect(first.frame.title).not.toBe(second.frame.title);
    expect(first.frame.objective).not.toBe(second.frame.objective);
    expect(first.frame.bridge).not.toBe("");
  });

  it("retains the immutable base profile and all persisted choice IDs", () => {
    const base = getLessonMissionProfile("claude");
    const bound = bindLessonMission("claude", "mental-model", "de", {
      title: "Ein mentales Modell",
      objective: "Kontext, Modell und Ausgabe voneinander trennen.",
      keyConcepts: ["Kontext", "Ausgabe"],
    });

    expect(bound.profile).toBe(base);
    expect(bound.profile.predictionChoices.map((choice) => choice.id)).toEqual(
      base.predictionChoices.map((choice) => choice.id),
    );
    expect(bound.profile.retrieval.choices.map((choice) => choice.id)).toEqual(
      base.retrieval.choices.map((choice) => choice.id),
    );
  });

  it("bounds authored display metadata and rejects missing required context", () => {
    const bound = bindLessonMission("data-science", "fund", "en", {
      title: "  Fundamentals   ",
      objective: " Sample versus population. ",
      keyConcepts: [
        "Sampling",
        "Sampling",
        "Inference",
        "Validation",
        "Ignored fourth concept",
        "x".repeat(97),
      ],
    });

    expect(bound.frame.title).toBe("Fundamentals");
    expect(bound.frame.keyConcepts).toEqual([
      "Sampling",
      "Inference",
      "Validation",
    ]);
    expect(() =>
      bindLessonMission("data-science", "fund", "en", {
        title: " ",
        objective: "Sample versus population.",
      }),
    ).toThrow("Invalid authored lesson mission title");
    expect(() =>
      bindLessonMission("data-science", "not-canonical", "en", {
        title: "Unknown",
        objective: "Unknown",
      }),
    ).toThrow("Unknown canonical lesson mission");
  });
});
