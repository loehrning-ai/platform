import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PASSIVE_STATE_SURFACES = [
  "demos/error.tsx",
  "demos/[slug]/error.tsx",
  "ki-fuehrerschein/kurs/error.tsx",
  "ki-fuehrerschein/kurs/[blockId]/error.tsx",
  "eu-ai-act-kurs/kurs/error.tsx",
  "eu-ai-act-kurs/kurs/[blockId]/error.tsx",
  "ki-und-gesellschaft/kurs/error.tsx",
  "ki-und-gesellschaft/kurs/[blockId]/error.tsx",
  "ai-native/kurs/error.tsx",
  "ai-native/kurs/[moduleId]/error.tsx",
  "ai-native/kurs/[moduleId]/[lessonId]/error.tsx",
  "../components/ai-native-operator/course-error-state.tsx",
  "../components/ai-native-operator/course-not-found-state.tsx",
  "../components/data-engineering-fundamentals/def-course-error-state.tsx",
  "../components/data-engineering-fundamentals/def-course-not-found-state.tsx",
  "../components/data-science/ds-course-error-state.tsx",
  "../components/data-science/ds-course-not-found-state.tsx",
  "kurse/open-source/codex/error.tsx",
  "kurse/open-source/codex/not-found.tsx",
  "kurse/open-source/data-infrastructure/error.tsx",
  "kurse/open-source/data-infrastructure/not-found.tsx",
  "kurse/open-source/claude/error.tsx",
  "kurse/open-source/claude/not-found.tsx",
  "../components/course/kurs/completion-certificate-cta.tsx",
  "../components/course/kurs/certificate-page.tsx",
] as const;

function source(relativePath: (typeof PASSIVE_STATE_SURFACES)[number]): string {
  return readFileSync(join(__dirname, relativePath), "utf8");
}

function count(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

describe("passive state design contract", () => {
  it.each(PASSIVE_STATE_SURFACES)(
    "keeps %s flat and free of hover displacement",
    (relativePath) => {
      const value = source(relativePath);

      expect(value).not.toMatch(/shadow-\[/);
      expect(value).not.toMatch(/hover:-?translate-[xy]/);
    },
  );

  it.each(PASSIVE_STATE_SURFACES)(
    "keeps every %s recovery or navigation control at least 44px tall",
    (relativePath) => {
      const value = source(relativePath);
      const controls = count(value, /<(?:button|Link)\b/g);
      const targetDeclarations = count(value, /\bmin-h-11\b/g);

      expect(targetDeclarations).toBeGreaterThanOrEqual(controls);
    },
  );
});
