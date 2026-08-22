import type { CourseSlug } from "@/lib/course/types";
import type { Locale } from "@/lib/i18n/locale";
import {
  getLessonMissionDefinition,
  type LessonMissionDefinition,
} from "./lesson-mission-catalog";
import {
  getLessonMissionProfile,
  type LessonMissionProfile,
} from "./lesson-missions";
import type { CourseProjectStageId, LocalizedProjectText } from "./types";

const MAX_TITLE_LENGTH = 160;
const MAX_OBJECTIVE_LENGTH = 280;
const MAX_CONCEPT_LENGTH = 96;
const MAX_CONCEPTS = 3;

/**
 * A deliberately small projection of content that the active lesson route has
 * already loaded. Callers must not import a course registry or sibling lesson
 * bodies merely to populate this context.
 */
export interface AuthoredLessonMissionContext {
  readonly title: string;
  readonly objective: string;
  readonly keyConcepts?: readonly string[];
}

export interface LessonMissionFrame {
  readonly missionId: LessonMissionDefinition["id"];
  readonly skillId: LessonMissionDefinition["skillId"];
  readonly scenarioSeed: number;
  readonly label: string;
  readonly title: string;
  readonly objective: string;
  readonly keyConcepts: readonly string[];
  readonly bridge: string;
}

export interface BoundLessonMission {
  readonly definition: LessonMissionDefinition;
  readonly profile: LessonMissionProfile;
  readonly frame: LessonMissionFrame;
}

const SKILL_LENSES: Readonly<
  Record<CourseProjectStageId, LocalizedProjectText>
> = {
  ground: {
    de: "Annahmen und Grenzen sichtbar machen",
    en: "make assumptions and boundaries visible",
  },
  build: {
    de: "eine prüfbare Entscheidung gestalten",
    en: "shape a testable decision",
  },
  run: {
    de: "Behauptung und Evidenz gegeneinander prüfen",
    en: "test the claim against its evidence",
  },
  verify: {
    de: "Freigabe und Übergabe begrenzen",
    en: "bound approval and handoff",
  },
  transfer: {
    de: "Ergebnis, Unsicherheit und nächsten Test trennen",
    en: "separate outcome, uncertainty, and the next test",
  },
};

const SCENARIO_LENSES: Readonly<
  Record<Locale, readonly [string, string, string, string]>
> = {
  de: ["Grenzenlinse", "Evidenzlinse", "Fehlermoduslinse", "Transferlinse"],
  en: ["Boundary lens", "Evidence lens", "Failure-mode lens", "Transfer lens"],
};

function normalizeRequiredText(
  value: string,
  field: "title" | "objective",
  maxLength: number,
): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new Error(`Invalid authored lesson mission ${field}`);
  }
  return normalized;
}

function normalizeConcepts(
  value: readonly string[] | undefined,
): readonly string[] {
  if (!value) return [];
  const concepts: string[] = [];
  for (const entry of value) {
    const normalized = entry.replace(/\s+/g, " ").trim();
    if (
      normalized.length === 0 ||
      normalized.length > MAX_CONCEPT_LENGTH ||
      concepts.includes(normalized)
    ) {
      continue;
    }
    concepts.push(normalized);
    if (concepts.length === MAX_CONCEPTS) break;
  }
  return Object.freeze(concepts);
}

/**
 * Wraps the stable course-level probe in one canonical lesson's authored
 * frame. The shared probe and its fixed choice IDs are retained by reference;
 * only the visible title, objective, concepts, and deterministic framing vary
 * per lesson. This does not claim 177 independently authored probe sets.
 */
export function bindLessonMission(
  courseSlug: CourseSlug,
  lessonId: string,
  locale: Locale,
  context: AuthoredLessonMissionContext,
): BoundLessonMission {
  const definition = getLessonMissionDefinition(courseSlug, lessonId);
  const expectedSkillId = `${courseSlug}:${definition.stageId}`;
  if (definition.skillId !== expectedSkillId || definition.scenarioSeed < 1) {
    throw new Error(
      `Invalid lesson mission definition: ${courseSlug}/${lessonId}`,
    );
  }

  const title = normalizeRequiredText(context.title, "title", MAX_TITLE_LENGTH);
  const objective = normalizeRequiredText(
    context.objective,
    "objective",
    MAX_OBJECTIVE_LENGTH,
  );
  const keyConcepts = normalizeConcepts(context.keyConcepts);
  const lens =
    SCENARIO_LENSES[locale][
      (definition.scenarioSeed - 1) % SCENARIO_LENSES[locale].length
    ];
  const skill = SKILL_LENSES[definition.stageId][locale];
  const sequence = String(definition.scenarioSeed).padStart(2, "0");

  return Object.freeze({
    definition,
    profile: getLessonMissionProfile(courseSlug),
    frame: Object.freeze({
      missionId: definition.id,
      skillId: definition.skillId,
      scenarioSeed: definition.scenarioSeed,
      label:
        locale === "de"
          ? `Lektionsmission ${sequence} · ${lens}`
          : `Lesson mission ${sequence} · ${lens}`,
      title,
      objective,
      keyConcepts,
      bridge:
        locale === "de"
          ? `Übertrage diesen Lektionsfokus auf den synthetischen Fall: ${skill}.`
          : `Carry this lesson focus into the synthetic case: ${skill}.`,
    }),
  });
}
