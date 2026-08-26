import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return readFileSync(join(__dirname, "..", "..", relativePath), "utf8");
}

describe("completion-evidence surface contract", () => {
  it("routes every aggregate and certificate selector through evidence policy", () => {
    const completion = source("lib/courses/completion.ts");
    expect(completion).toMatch(
      /completedCanonicalLessonCount[\s\S]*return evidenceBackedCompletedCanonicalLessonCount/,
    );
    expect(completion).toMatch(
      /isCourseFullyCompleted[\s\S]*return isEvidenceBackedCourseFullyCompleted/,
    );
    expect(completion).toMatch(
      /isCourseCompletionEarned[\s\S]*return isEvidenceBackedCourseCompletionEarned/,
    );

    const foundationProgress = source("lib/course/progress.ts");
    expect(foundationProgress).toMatch(
      /getBlockCompletedLessons[\s\S]*getEvidenceBackedBlockCompletedLessons/,
    );

    const aiNativeProgress = source("lib/ai-native/progress.ts");
    expect(aiNativeProgress).toMatch(
      /getCompletedLessonIds[\s\S]*getEvidenceBackedCompletedLessonIds/,
    );
    expect(aiNativeProgress).not.toMatch(
      /getModuleCompletedLessonCount[\s\S]*slice\.lessons\[id\]\?\.completed/,
    );
  });

  it("keeps lesson-level completion indicators on the shared evidence selector", () => {
    for (const relativePath of [
      "components/ai-native/kurs/lesson-progress-ring.tsx",
      "components/progress/lesson-progress-ring.tsx",
      "components/ai-native/kurs/lesson-reader.tsx",
    ]) {
      expect(source(relativePath), relativePath).toContain(
        "isEvidenceBackedLessonCompleted",
      );
    }

    expect(source("components/course/kurs/lesson-layout.tsx")).toContain(
      "getEvidenceBackedCompletedLessonIds",
    );
  });

  it("keeps all current course and record surfaces off direct completion bits", () => {
    for (const relativePath of [
      "components/ai-native/kurs/lesson-sidebar.tsx",
      "components/course/technical-course-progress.tsx",
      "components/course/kurs/completion-certificate-cta.tsx",
      "components/course/kurs/certificate-page.tsx",
      "components/course/kurs/course-assessment-cta.tsx",
      "components/course/kurs/workshop-quiz-page.tsx",
      "app/kurse/learning-atlas.tsx",
      "app/konto/page.tsx",
    ]) {
      expect(source(relativePath), relativePath).not.toMatch(
        /\.lessons\[[^\]]+\]\?*\.completed/,
      );
    }
  });
});
