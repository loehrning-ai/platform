import { describe, expect, it } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import {
  getLessonMissionMisconception,
  LESSON_MISSION_PROFILES,
} from "./lesson-missions";

describe("lesson mission profiles", () => {
  it("defines a distinct bilingual cognitive instrument for every course", () => {
    expect(Object.keys(LESSON_MISSION_PROFILES).sort()).toEqual(
      [...COURSE_SLUGS].sort(),
    );

    const englishInstruments = COURSE_SLUGS.map(
      (courseSlug) => LESSON_MISSION_PROFILES[courseSlug].instrument.en,
    );
    expect(new Set(englishInstruments).size).toBe(COURSE_SLUGS.length);

    for (const courseSlug of COURSE_SLUGS) {
      const profile = LESSON_MISSION_PROFILES[courseSlug];
      expect(profile.courseSlug).toBe(courseSlug);
      expect(profile.instrument.de.length).toBeGreaterThan(5);
      expect(profile.instrument.en.length).toBeGreaterThan(5);
      expect(profile.revealedSignal.de).not.toBe(profile.revealedSignal.en);
      expect(profile.transferScenario.de).not.toBe(profile.transferScenario.en);
    }
  });

  it("keeps every scored probe bounded, deterministic, and internally valid", () => {
    for (const courseSlug of COURSE_SLUGS) {
      const profile = LESSON_MISSION_PROFILES[courseSlug];
      expect(profile.predictionChoices).toHaveLength(3);

      for (const currentProbe of [
        profile.evidence,
        profile.retrieval,
        profile.revision,
        profile.transfer,
      ]) {
        const ids = currentProbe.choices.map((entry) => entry.id);
        expect(ids).toHaveLength(3);
        expect(new Set(ids).size).toBe(3);
        expect(ids).toContain(currentProbe.correctId);
        expect(currentProbe.rationale.en.length).toBeGreaterThan(20);
        expect(currentProbe.rationale.de.length).toBeGreaterThan(20);
      }
    }
  });

  it("authors a distinct bilingual repair for both retrieval distractors", () => {
    const germanRepairs: string[] = [];
    const englishRepairs: string[] = [];

    for (const profile of Object.values(LESSON_MISSION_PROFILES)) {
      const repairByChoiceId = profile.retrieval.repairByChoiceId;
      expect(repairByChoiceId).toBeDefined();
      if (!repairByChoiceId) throw new Error("Missing retrieval repair map");

      const incorrectChoices = profile.retrieval.choices.filter(
        (entry) => entry.id !== profile.retrieval.correctId,
      );
      expect(Object.keys(repairByChoiceId).sort()).toEqual(
        incorrectChoices.map((entry) => entry.id).sort(),
      );
      expect(repairByChoiceId[profile.retrieval.correctId]).toBeUndefined();

      expect(
        getLessonMissionMisconception(
          profile.retrieval,
          profile.retrieval.correctId,
        ),
      ).toBeNull();

      for (const incorrect of incorrectChoices) {
        const repair = repairByChoiceId[incorrect.id];
        expect(repair).toBeDefined();
        if (!repair) throw new Error(`Missing repair for ${incorrect.id}`);

        expect(repair.de).not.toBe(incorrect.label.de);
        expect(repair.en).not.toBe(incorrect.label.en);
        expect(repair.de).not.toContain(profile.retrieval.rationale.de);
        expect(repair.en).not.toContain(profile.retrieval.rationale.en);
        expect(repair.de.match(/\./g)?.length ?? 0).toBeGreaterThanOrEqual(2);
        expect(repair.en.match(/\./g)?.length ?? 0).toBeGreaterThanOrEqual(2);
        germanRepairs.push(repair.de);
        englishRepairs.push(repair.en);

        const misconception = getLessonMissionMisconception(
          profile.retrieval,
          incorrect.id,
        );
        expect(misconception?.id).toBe(incorrect.id);
        expect(misconception?.label).toBe(incorrect.label);
        expect(misconception?.repair).toBe(repair);
      }
    }

    expect(germanRepairs).toHaveLength(COURSE_SLUGS.length * 2);
    expect(englishRepairs).toHaveLength(COURSE_SLUGS.length * 2);
    expect(new Set(germanRepairs).size).toBe(germanRepairs.length);
    expect(new Set(englishRepairs).size).toBe(englishRepairs.length);
  });

  it("fails closed when a retrieval repair is absent or the choice is invalid", () => {
    const retrieval = LESSON_MISSION_PROFILES[COURSE_SLUGS[0]].retrieval;
    const incorrect = retrieval.choices.find(
      (entry) => entry.id !== retrieval.correctId,
    );
    if (!incorrect) throw new Error("Expected an incorrect retrieval choice");

    const { prompt, choices, correctId, rationale } = retrieval;
    expect(
      getLessonMissionMisconception(
        { prompt, choices, correctId, rationale },
        incorrect.id,
      ),
    ).toBeNull();
    expect(
      getLessonMissionMisconception(
        { ...retrieval, repairByChoiceId: {} },
        incorrect.id,
      ),
    ).toBeNull();
    expect(getLessonMissionMisconception(retrieval, null)).toBeNull();
    expect(
      getLessonMissionMisconception(retrieval, retrieval.correctId),
    ).toBeNull();
    expect(
      getLessonMissionMisconception(retrieval, "unknown-choice"),
    ).toBeNull();
  });
});
