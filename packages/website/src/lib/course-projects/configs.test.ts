import { describe, expect, it } from "vitest";
import { COURSE_SLUGS } from "@/lib/course/types";
import {
  CANONICAL_LESSON_IDS,
  isCanonicalLessonId,
} from "@/lib/courses/completion";
import { COURSE_PROJECT_CONFIGS, getCourseProjectConfig } from "./configs";
import { COURSE_PROJECT_STAGE_IDS, COURSE_PROJECT_STAGE_LABELS } from "./types";

describe("course project configs", () => {
  it("covers exactly the ten registered course slugs", () => {
    expect(Object.keys(COURSE_PROJECT_CONFIGS).sort()).toEqual(
      [...COURSE_SLUGS].sort(),
    );
    expect(Object.keys(COURSE_PROJECT_CONFIGS)).toHaveLength(10);

    for (const slug of COURSE_SLUGS) {
      const config = getCourseProjectConfig(slug);
      expect(config.courseSlug).toBe(slug);
      expect(CANONICAL_LESSON_IDS[slug]).toContain(config.progressLessonId);
      expect(isCanonicalLessonId(slug, config.progressLessonId)).toBe(true);
    }
  });

  it("anchors every project to one explicit canonical course lesson", () => {
    expect(
      Object.fromEntries(
        COURSE_SLUGS.map((slug) => [
          slug,
          getCourseProjectConfig(slug).progressLessonId,
        ]),
      ),
    ).toEqual({
      "ki-fuehrerschein": "block_5_lesson_4",
      "ki-und-gesellschaft": "ethik-3-3",
      "eu-ai-act-kurs": "block_6_lesson_4",
      "ai-native": "modul_4_lesson_8",
      claude: "safety",
      codex: "L12",
      "data-infrastructure": "interview-playbook",
      "data-engineering-fundamentals": "cap",
      "data-science": "cap",
      "ai-native-operator": "measurement/4",
    });
  });

  it("keeps all learner-facing fields complete in German and English", () => {
    for (const config of Object.values(COURSE_PROJECT_CONFIGS)) {
      for (const localized of [
        config.title,
        config.mission,
        config.artifact,
        config.scenario,
        config.safety,
        ...config.completionCriteria,
        ...config.stages.flatMap((stage) => [stage.objective, stage.evidence]),
      ]) {
        expect(localized.de.trim().length).toBeGreaterThan(0);
        expect(localized.en.trim().length).toBeGreaterThan(0);
      }
    }

    for (const stageId of COURSE_PROJECT_STAGE_IDS) {
      expect(COURSE_PROJECT_STAGE_LABELS[stageId].de.trim()).not.toBe("");
      expect(COURSE_PROJECT_STAGE_LABELS[stageId].en.trim()).not.toBe("");
    }
  });

  it("has unique project IDs and the complete ordered stage ladder", () => {
    const configs = Object.values(COURSE_PROJECT_CONFIGS);
    expect(new Set(configs.map((config) => config.id)).size).toBe(
      configs.length,
    );

    for (const config of configs) {
      expect(config.stages.map((stage) => stage.id)).toEqual(
        COURSE_PROJECT_STAGE_IDS,
      );
      expect(config.completionCriteria.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("assigns all four engine kinds and a distinct learning contract per course", () => {
    const configs = Object.values(COURSE_PROJECT_CONFIGS);
    expect(new Set(configs.map((config) => config.engineKind))).toEqual(
      new Set(["prompt", "repo", "data", "case"]),
    );
    expect(new Set(configs.map((config) => config.title.de)).size).toBe(10);
    expect(new Set(configs.map((config) => config.mission.en)).size).toBe(10);
    expect(new Set(configs.map((config) => config.artifact.de)).size).toBe(10);
    expect(
      new Set(
        configs.map((config) =>
          config.stages
            .map((stage) => `${stage.objective.de}|${stage.evidence.en}`)
            .join("::"),
        ),
      ).size,
    ).toBe(10);

    for (const config of configs) {
      expect(`${config.scenario.de} ${config.safety.de}`.toLowerCase()).toMatch(
        /synthet|fiktiv|fantasie|simulation|generiert|erfunden/,
      );
      expect(`${config.scenario.en} ${config.safety.en}`.toLowerCase()).toMatch(
        /synthetic|fictional|simulation|generated|supplied/,
      );
    }
  });

  it("states the fixed execution boundaries without presenting local plans as runtimes", () => {
    for (const slug of ["ai-native", "ai-native-operator"] as const) {
      const config = getCourseProjectConfig(slug);
      expect(config.mission.en).toContain("exactly one model completion");
      expect(config.artifact.en).toContain(
        "Locally validated project evidence",
      );
      expect(config.mission.en).toMatch(/No .* (?:executed|are executed)/);
    }

    for (const slug of [
      "data-infrastructure",
      "data-engineering-fundamentals",
      "data-science",
    ] as const) {
      const config = getCourseProjectConfig(slug);
      expect(config.mission.en).toContain("server-supplied");
      expect(config.stages[1].objective.en).toContain(
        "neither executed nor sent",
      );
      expect(config.artifact.en).toContain(
        "Locally validated project evidence",
      );
    }

    const codex = getCourseProjectConfig("codex");
    expect(codex.mission.en).toContain("non-verifying browser simulation");
    expect(codex.mission.en).toContain("fixed server-side Sandbox");
    expect(codex.artifact.en).toContain("Locally validated project evidence");
  });
});
