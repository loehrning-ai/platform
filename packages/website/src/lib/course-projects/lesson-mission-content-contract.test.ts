import { describe, expect, it } from "vitest";
import { getAllLessons as getAiNativeLessons } from "@/lib/ai-native/data";
import { getAllLessons as getOperatorLessons } from "@/lib/ai-native-operator/data";
import { getAllClaudeLessons } from "@/lib/claude-course/data";
import { getAllCodexLessons } from "@/lib/codex/data";
import { getAllLessons as getCoreLessons } from "@/lib/course/data";
import { getAllDataInfraLessons } from "@/lib/data-infrastructure/data";
import { getAllDefLocalizedChapters } from "@/lib/data-engineering-fundamentals/content";
import { getAllDsLocalizedChapters } from "@/lib/data-science/content";
import { CANONICAL_LESSON_IDS } from "@/lib/courses/completion";
import { bindLessonMission } from "./lesson-mission-binding";

const LOCALES = ["de", "en"] as const;
const CORE_COURSES = [
  "ki-fuehrerschein",
  "eu-ai-act-kurs",
  "ki-und-gesellschaft",
] as const;

/**
 * Test-only imports deliberately load every body. Production callers pass the
 * already-loaded active lesson projection and never import sibling lessons.
 */
describe("authored lesson-frame content contract", () => {
  it("wraps the shared course probes for all 177 canonical lessons in both reviewed locales", async () => {
    let boundCount = 0;

    for (const locale of LOCALES) {
      for (const courseSlug of CORE_COURSES) {
        for (const lesson of getCoreLessons(courseSlug, locale)) {
          bindLessonMission(courseSlug, lesson.id, locale, {
            title: lesson.title,
            objective: lesson.subtitle,
            keyConcepts: lesson.keyConcepts,
          });
          boundCount += 1;
        }
      }

      for (const lesson of await getAiNativeLessons(locale)) {
        bindLessonMission("ai-native", lesson.id, locale, {
          title: lesson.title,
          objective: lesson.subtitle,
          keyConcepts: lesson.keyConcepts,
        });
        boundCount += 1;
      }

      for (const lesson of await getOperatorLessons(locale)) {
        bindLessonMission("ai-native-operator", lesson.id, locale, {
          title: lesson.title,
          objective: lesson.objective,
          keyConcepts: lesson.keyConcepts,
        });
        boundCount += 1;
      }

      for (const lesson of await getAllCodexLessons(locale)) {
        bindLessonMission("codex", lesson.id, locale, {
          title: lesson.title,
          objective: lesson.hook,
          keyConcepts: lesson.keyConcepts,
        });
        boundCount += 1;
      }

      for (const lesson of await getAllClaudeLessons(locale)) {
        bindLessonMission("claude", lesson.id, locale, {
          title: lesson.title,
          objective: lesson.hook,
          keyConcepts: lesson.keyConcepts,
        });
        boundCount += 1;
      }

      for (const lesson of await getAllDataInfraLessons(locale)) {
        bindLessonMission("data-infrastructure", lesson.id, locale, {
          title: lesson.title,
          objective: lesson.hook,
          keyConcepts: lesson.keyConcepts,
        });
        boundCount += 1;
      }

      for (const chapter of await getAllDsLocalizedChapters(locale)) {
        if (!CANONICAL_LESSON_IDS["data-science"].includes(chapter.id)) {
          continue;
        }
        bindLessonMission("data-science", chapter.id, locale, {
          title: chapter.meta.title,
          objective: chapter.meta.subtitle,
        });
        boundCount += 1;
      }

      for (const chapter of await getAllDefLocalizedChapters(locale)) {
        bindLessonMission("data-engineering-fundamentals", chapter.id, locale, {
          title: chapter.meta.title,
          objective: chapter.meta.subtitle,
        });
        boundCount += 1;
      }
    }

    expect(boundCount).toBe(354);
  });
});
